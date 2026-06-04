require('dotenv').config()

const express = require('express')
const path = require('path')
const { z } = require('zod')
const { CONFIG, normalizeCartItems } = require('./server/catalog')
const { authMiddleware, signToken } = require('./server/auth')
const {
  initDb,
  upsertUser,
  createOrder,
  getOrder,
  listOrders,
  createPayment,
  getPaymentByOrder,
  markPaymentSucceeded,
  hasDatabase,
} = require('./server/db')
const { createPaymentForm, verifyNotification } = require('./server/yoomoney')
const { sendPaidOrderToCrm } = require('./server/crm')

const app = express()
const port = Number(process.env.PORT || 3000)

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: false }))
app.use(express.static(__dirname, {
  extensions: ['html'],
  setHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff')
  },
}))

const MaxAuthSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  first_name: z.string().optional().default(''),
  last_name: z.string().optional().default(''),
  username: z.string().optional(),
  start_param: z.string().optional().nullable(),
})

const CreateOrderSchema = z.object({
  items: z.array(z.object({
    product_id: z.string().optional(),
    id: z.string().optional(),
    quantity: z.number().int().min(1).max(50),
  })).min(1),
  customer: z.object({
    name: z.string().min(1).max(80),
    phone: z.string().min(6).max(30),
    email: z.string().email().optional().or(z.literal('')),
  }),
  delivery: z.object({
    method: z.enum(['delivery', 'pickup']).default('delivery'),
    city: z.string().min(1).max(100).default('Екатеринбург'),
    address: z.string().max(240).optional().default(''),
    pickup_point_id: z.string().max(80).optional().default(''),
  }),
  comment: z.string().max(500).optional().default(''),
}).superRefine((value, ctx) => {
  if (value.delivery.city.trim().toLowerCase() !== 'екатеринбург') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['delivery', 'city'],
      message: 'Доставка доступна только по Екатеринбургу',
    })
  }
  if (value.delivery.method === 'delivery' && value.delivery.address.trim().length < 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['delivery', 'address'],
      message: 'Для доставки нужен адрес',
    })
  }
})

function publicOrigin(req) {
  if (process.env.PUBLIC_APP_URL) return process.env.PUBLIC_APP_URL
  return `${req.protocol}://${req.get('host')}`
}

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    app: 'max-burger-shop',
    database: hasDatabase ? 'postgres' : 'memory',
    yoomoney: process.env.YOOMONEY_RECEIVER ? 'configured' : 'missing_receiver',
  })
})

app.get('/api/catalog', (req, res) => {
  res.json({
    ok: true,
    shop: CONFIG.SHOP,
    catalog: CONFIG.CATALOG,
    categories: CONFIG.CATEGORIES,
    products: CONFIG.PRODUCTS,
  })
})

app.post('/api/auth/max', async (req, res) => {
  const parsed = MaxAuthSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'VALIDATION_ERROR', details: parsed.error.issues })
  }

  const user = parsed.data
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ')
  await upsertUser({
    id: user.id,
    name: fullName,
    username: user.username,
    start_param: user.start_param || null,
  })

  const token = signToken({
    sub: user.id,
    platform: 'max',
    username: user.username,
  })

  res.json({ ok: true, token, userId: user.id })
})

app.post('/api/orders', authMiddleware, async (req, res) => {
  const parsed = CreateOrderSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'VALIDATION_ERROR', details: parsed.error.issues })
  }

  try {
    const calculated = normalizeCartItems(parsed.data.items, parsed.data.delivery)
    const order = await createOrder({
      userId: req.user.sub,
      calculated,
      customer: parsed.data.customer,
      delivery: parsed.data.delivery,
      comment: parsed.data.comment,
    })
    res.status(201).json({ ok: true, order })
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message })
  }
})

app.get('/api/orders/my', authMiddleware, async (req, res) => {
  const orders = await listOrders(req.user.sub)
  res.json({ ok: true, orders })
})

app.get('/api/orders/:id', authMiddleware, async (req, res) => {
  const order = await getOrder(req.params.id)
  if (!order || order.user_id !== req.user.sub) {
    return res.status(404).json({ ok: false, error: 'ORDER_NOT_FOUND' })
  }
  const payment = await getPaymentByOrder(order.id)
  return res.json({ ok: true, order, payment })
})

app.post('/api/payments/yoomoney/create', authMiddleware, async (req, res) => {
  const orderId = String(req.body.order_id || '')
  const order = await getOrder(orderId)
  if (!order || order.user_id !== req.user.sub) {
    return res.status(404).json({ ok: false, error: 'ORDER_NOT_FOUND' })
  }
  if (order.status === 'paid') {
    return res.status(409).json({ ok: false, error: 'ORDER_ALREADY_PAID' })
  }

  const payment = await createPayment(order)
  const paymentForm = createPaymentForm(payment, order, publicOrigin(req))
  res.json({
    ok: true,
    order,
    payment,
    paymentForm,
    needsConfiguration: !paymentForm,
  })
})

app.get('/api/payments/:orderId/status', authMiddleware, async (req, res) => {
  const order = await getOrder(req.params.orderId)
  if (!order || order.user_id !== req.user.sub) {
    return res.status(404).json({ ok: false, error: 'ORDER_NOT_FOUND' })
  }
  const payment = await getPaymentByOrder(order.id)
  res.json({ ok: true, order, payment })
})

app.post('/api/payments/yoomoney/notification', async (req, res) => {
  const payload = { ...req.body }
  const verified = verifyNotification(payload)
  if (!verified) {
    console.warn('[yoomoney] Неверная подпись уведомления')
    return res.status(401).send('invalid sign')
  }

  const paymentId = String(payload.label || '')
  const payment = await markPaymentSucceeded(paymentId, payload)
  if (!payment) {
    return res.status(404).send('unknown label')
  }

  const order = await getOrder(payment.order_id)
  if (order && payment.status === 'succeeded') {
    await sendPaidOrderToCrm({ ...order, status: 'paid' }, payment)
  }

  res.status(200).send('OK')
})

app.post('/api/webhook', async (req, res) => {
  const url = process.env.CRM_WEBHOOK_URL
  if (!url) {
    return res.status(501).json({ ok: false, error: 'CRM_WEBHOOK_URL_NOT_CONFIGURED' })
  }

  const headers = { 'Content-Type': 'application/json' }
  if (process.env.CRM_WEBHOOK_SECRET) {
    headers['x-webhook-secret'] = process.env.CRM_WEBHOOK_SECRET
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(req.body),
  })
  const text = await response.text()
  res.status(response.status).json({ ok: response.ok, data: text })
})

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`MAX Burger Shop listening on http://localhost:${port}`)
    })
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error)
    process.exit(1)
  })

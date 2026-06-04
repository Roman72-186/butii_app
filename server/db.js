const crypto = require('crypto')
const { Pool } = require('pg')

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null

const memory = {
  users: new Map(),
  orders: new Map(),
  payments: new Map(),
  webhookEvents: new Map(),
}

function nowIso() {
  return new Date().toISOString()
}

function orderNumber() {
  return `MAX-${Date.now().toString(36).toUpperCase()}`
}

async function initDb() {
  if (!pool) return

  await pool.query(`
    create table if not exists users (
      id text primary key,
      name text not null default '',
      username text,
      platform text not null default 'max',
      start_param text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists orders (
      id text primary key,
      order_number text not null unique,
      user_id text not null,
      items jsonb not null,
      customer jsonb not null,
      delivery jsonb not null,
      fulfillment_method text not null default 'delivery',
      subtotal integer not null,
      delivery_amount integer not null,
      total integer not null,
      status text not null,
      crm_status text not null default 'pending',
      comment text not null default '',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists payments (
      id text primary key,
      order_id text not null references orders(id),
      provider text not null,
      amount integer not null,
      currency text not null default 'RUB',
      status text not null,
      provider_operation_id text,
      raw_payload jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists webhook_events (
      id text primary key,
      provider text not null,
      event_key text not null unique,
      payload jsonb not null,
      created_at timestamptz not null default now()
    );
  `)
}

async function upsertUser(user) {
  const id = String(user.id)
  const data = {
    id,
    name: user.name || '',
    username: user.username || null,
    platform: 'max',
    start_param: user.start_param || null,
    updated_at: nowIso(),
  }

  if (!pool) {
    const current = memory.users.get(id) || { created_at: nowIso() }
    const next = { ...current, ...data }
    memory.users.set(id, next)
    return next
  }

  const result = await pool.query(
    `insert into users (id, name, username, platform, start_param)
     values ($1, $2, $3, $4, $5)
     on conflict (id) do update set
       name = excluded.name,
       username = excluded.username,
       start_param = excluded.start_param,
       updated_at = now()
     returning *`,
    [data.id, data.name, data.username, data.platform, data.start_param],
  )
  return result.rows[0]
}

async function createOrder({ userId, calculated, customer, delivery, comment }) {
  const order = {
    id: crypto.randomUUID(),
    order_number: orderNumber(),
    user_id: String(userId),
    items: calculated.items,
    customer,
    delivery,
    subtotal: calculated.subtotal,
      delivery_amount: calculated.delivery,
      fulfillment_method: calculated.method,
    total: calculated.total,
    status: 'pending_payment',
    crm_status: 'pending',
    comment: comment || '',
    created_at: nowIso(),
    updated_at: nowIso(),
  }

  if (!pool) {
    memory.orders.set(order.id, order)
    return order
  }

  const result = await pool.query(
    `insert into orders
      (id, order_number, user_id, items, customer, delivery, fulfillment_method, subtotal, delivery_amount, total, status, crm_status, comment)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     returning *`,
    [
      order.id,
      order.order_number,
      order.user_id,
      JSON.stringify(order.items),
      JSON.stringify(order.customer),
      JSON.stringify(order.delivery),
      order.fulfillment_method,
      order.subtotal,
      order.delivery_amount,
      order.total,
      order.status,
      order.crm_status,
      order.comment,
    ],
  )
  return result.rows[0]
}

async function getOrder(orderId) {
  if (!pool) return memory.orders.get(orderId) || null
  const result = await pool.query('select * from orders where id = $1', [orderId])
  return result.rows[0] || null
}

async function listOrders(userId) {
  if (!pool) {
    return Array.from(memory.orders.values())
      .filter((order) => order.user_id === String(userId))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }
  const result = await pool.query('select * from orders where user_id = $1 order by created_at desc', [String(userId)])
  return result.rows
}

async function createPayment(order) {
  const existing = await getPaymentByOrder(order.id)
  if (existing && existing.status !== 'failed') return existing

  const payment = {
    id: crypto.randomUUID(),
    order_id: order.id,
    provider: 'yoomoney',
    amount: order.total,
    currency: 'RUB',
    status: process.env.YOOMONEY_RECEIVER ? 'waiting' : 'demo_waiting_config',
    provider_operation_id: null,
    raw_payload: null,
    created_at: nowIso(),
    updated_at: nowIso(),
  }

  if (!pool) {
    memory.payments.set(payment.id, payment)
    return payment
  }

  const result = await pool.query(
    `insert into payments (id, order_id, provider, amount, currency, status)
     values ($1,$2,$3,$4,$5,$6)
     returning *`,
    [payment.id, payment.order_id, payment.provider, payment.amount, payment.currency, payment.status],
  )
  return result.rows[0]
}

async function getPaymentByOrder(orderId) {
  if (!pool) {
    return Array.from(memory.payments.values()).find((payment) => payment.order_id === orderId) || null
  }
  const result = await pool.query('select * from payments where order_id = $1 order by created_at desc limit 1', [orderId])
  return result.rows[0] || null
}

async function getPayment(paymentId) {
  if (!pool) return memory.payments.get(paymentId) || null
  const result = await pool.query('select * from payments where id = $1', [paymentId])
  return result.rows[0] || null
}

async function markPaymentSucceeded(paymentId, payload) {
  const payment = await getPayment(paymentId)
  if (!payment) return null
  const eventKey = payload.operation_id || `${paymentId}:${payload.datetime || Date.now()}`

  if (!pool) {
    if (memory.webhookEvents.has(eventKey)) return payment
    memory.webhookEvents.set(eventKey, { provider: 'yoomoney', event_key: eventKey, payload, created_at: nowIso() })
    const nextPayment = {
      ...payment,
      status: payload.unaccepted === 'true' ? 'waiting_acceptance' : 'succeeded',
      provider_operation_id: payload.operation_id || null,
      raw_payload: payload,
      updated_at: nowIso(),
    }
    memory.payments.set(paymentId, nextPayment)
    const order = memory.orders.get(payment.order_id)
    if (order) {
      memory.orders.set(order.id, { ...order, status: nextPayment.status === 'succeeded' ? 'paid' : 'pending_payment', updated_at: nowIso() })
    }
    return nextPayment
  }

  const client = await pool.connect()
  try {
    await client.query('begin')
    await client.query(
      `insert into webhook_events (id, provider, event_key, payload)
       values ($1,$2,$3,$4)
       on conflict (event_key) do nothing`,
      [crypto.randomUUID(), 'yoomoney', eventKey, JSON.stringify(payload)],
    )
    const status = payload.unaccepted === 'true' ? 'waiting_acceptance' : 'succeeded'
    const paymentResult = await client.query(
      `update payments
       set status = $2, provider_operation_id = $3, raw_payload = $4, updated_at = now()
       where id = $1
       returning *`,
      [paymentId, status, payload.operation_id || null, JSON.stringify(payload)],
    )
    await client.query(
      `update orders set status = $2, updated_at = now() where id = $1`,
      [payment.order_id, status === 'succeeded' ? 'paid' : 'pending_payment'],
    )
    await client.query('commit')
    return paymentResult.rows[0]
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
}

async function markCrmSent(orderId, status) {
  if (!pool) {
    const order = memory.orders.get(orderId)
    if (order) memory.orders.set(orderId, { ...order, crm_status: status, updated_at: nowIso() })
    return
  }
  await pool.query('update orders set crm_status = $2, updated_at = now() where id = $1', [orderId, status])
}

module.exports = {
  initDb,
  upsertUser,
  createOrder,
  getOrder,
  listOrders,
  createPayment,
  getPaymentByOrder,
  markPaymentSucceeded,
  markCrmSent,
  hasDatabase: Boolean(pool),
}

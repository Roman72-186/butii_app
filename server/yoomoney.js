const crypto = require('crypto')

function rfc3986Encode(value) {
  return encodeURIComponent(String(value ?? '')).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  )
}

function buildSignatureBase(params) {
  return Object.keys(params)
    .filter((key) => key !== 'sign')
    .sort()
    .map((key) => `${key}=${rfc3986Encode(params[key])}`)
    .join('&')
}

function verifyNotification(params) {
  const secret = process.env.YOOMONEY_NOTIFICATION_SECRET || ''
  if (!secret) {
    return process.env.YOOMONEY_ALLOW_UNSIGNED === 'true'
  }

  const sign = String(params.sign || '')
  if (!sign) return false

  const base = buildSignatureBase(params)
  const expected = crypto
    .createHmac('sha256', secret)
    .update(base)
    .digest('hex')

  return crypto.timingSafeEqual(Buffer.from(sign), Buffer.from(expected))
}

function createPaymentForm(payment, order, origin) {
  const receiver = process.env.YOOMONEY_RECEIVER || ''
  if (!receiver) {
    return null
  }

  const successUrl = new URL(origin)
  successUrl.searchParams.set('payment_return', order.id)

  return {
    method: 'POST',
    action: 'https://yoomoney.ru/quickpay/confirm',
    fields: {
      receiver,
      label: payment.id,
      'quickpay-form': 'button',
      sum: Number(payment.amount).toFixed(2),
      paymentType: process.env.YOOMONEY_PAYMENT_TYPE || 'AC',
      successURL: successUrl.toString(),
      targets: `MAX Burger: заказ ${order.order_number}`,
    },
  }
}

module.exports = {
  buildSignatureBase,
  verifyNotification,
  createPaymentForm,
}

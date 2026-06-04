const { markCrmSent } = require('./db')

async function sendPaidOrderToCrm(order, payment) {
  const url = process.env.CRM_WEBHOOK_URL
  if (!url) {
    await markCrmSent(order.id, 'skipped_no_url')
    return { skipped: true }
  }

  const payload = {
    source: 'max_commerce_demo',
    order_id: order.id,
    order_number: order.order_number,
    order_status: order.status,
    payment_id: payment.id,
    payment_provider: payment.provider,
    payment_status: payment.status,
    payment_operation_id: payment.provider_operation_id,
    max_user_id: order.user_id,
    customer: order.customer,
    delivery: order.delivery,
    items: order.items,
    subtotal: order.subtotal,
    delivery_amount: order.delivery_amount,
    total: order.total,
    comment: order.comment,
  }

  const headers = { 'Content-Type': 'application/json' }
  if (process.env.CRM_WEBHOOK_SECRET) {
    headers['x-webhook-secret'] = process.env.CRM_WEBHOOK_SECRET
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
    await markCrmSent(order.id, response.ok ? 'sent' : `failed_${response.status}`)
    return { ok: response.ok, status: response.status }
  } catch (error) {
    console.error('[crm] Ошибка отправки оплаченного заказа:', error)
    await markCrmSent(order.id, 'failed_network')
    return { ok: false, error: error.message }
  }
}

module.exports = {
  sendPaidOrderToCrm,
}

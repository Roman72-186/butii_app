const CONFIG = require('../js/config')

function getProduct(productId) {
  return CONFIG.PRODUCTS.find((product) => product.id === productId)
}

function normalizeCartItems(rawItems, fulfillment = {}) {
  if (!Array.isArray(rawItems)) {
    throw new Error('ITEMS_REQUIRED')
  }

  const items = rawItems.map((item) => {
    const productId = String(item.product_id || item.id || '').trim()
    const quantity = Number.parseInt(String(item.quantity || 0), 10)
    const product = getProduct(productId)

    if (!product) {
      throw new Error(`UNKNOWN_PRODUCT:${productId}`)
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
      throw new Error(`INVALID_QUANTITY:${productId}`)
    }

    return {
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity,
      total: product.price * quantity,
    }
  })

  if (items.length === 0) {
    throw new Error('EMPTY_CART')
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const method = fulfillment.method === 'pickup' ? 'pickup' : 'delivery'
  const delivery = CONFIG.getDeliveryCost(subtotal, method)
  const total = subtotal + delivery

  return { items, subtotal, delivery, total, method }
}

module.exports = {
  CONFIG,
  getProduct,
  normalizeCartItems,
}

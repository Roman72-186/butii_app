const CONFIG = require('../js/config')
const { normalizeCartItems } = require('../server/catalog')
const { buildSignatureBase } = require('../server/yoomoney')

describe('MAX Burger smoke', () => {
  test('каталог содержит меню бургерной для Екатеринбурга', () => {
    expect(CONFIG.SHOP.name).toBe('MAX Burger')
    expect(CONFIG.SHOP.city).toBe('Екатеринбург')
    expect(CONFIG.PRODUCTS.length).toBeGreaterThan(0)
    expect(CONFIG.CATEGORIES.map((category) => category.id)).toEqual(
      expect.arrayContaining(['burgers', 'wings', 'sauces', 'sides']),
    )
  })

  test('backend пересчитывает сумму заказа с доставкой', () => {
    const product = CONFIG.PRODUCTS[0]
    const result = normalizeCartItems([{ product_id: product.id, quantity: 2 }], { method: 'delivery' })

    expect(result.subtotal).toBe(product.price * 2)
    expect(result.delivery).toBe(CONFIG.getDeliveryCost(result.subtotal, 'delivery'))
    expect(result.total).toBe(result.subtotal + result.delivery)
    expect(result.method).toBe('delivery')
    expect(result.items[0].name).toBe(product.name)
  })

  test('самовывоз не добавляет стоимость доставки', () => {
    const product = CONFIG.PRODUCTS[0]
    const result = normalizeCartItems([{ product_id: product.id, quantity: 1 }], { method: 'pickup' })

    expect(result.delivery).toBe(0)
    expect(result.total).toBe(result.subtotal)
    expect(result.method).toBe('pickup')
  })

  test('строка подписи ЮMoney сортирует параметры и исключает sign', () => {
    const base = buildSignatureBase({
      label: 'PAY-1',
      amount: '98.00',
      sign: 'ignored',
      currency: '643',
    })

    expect(base).toBe('amount=98.00&currency=643&label=PAY-1')
  })
})

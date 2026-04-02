---
tags: [business, order, leadtex, variables]
date: 2026-04-02
---

# Структура заказа и переменные LEADTEX

## Объект заказа внутри приложения

Формируется в `app.js::submitOrder()`:

```javascript
const order = {
    id: 'ORDER-' + Date.now(),    // например ORDER-1743600000000
    items: [
        {
            id: 'keychain-classic-metal',
            name: 'Классический металлический',
            price: 290,
            quantity: 2,
            total: 580
        }
    ],
    total: 580,                    // сумма товаров без доставки
    customer: {
        name: 'Иван Петров',
        phone: '+7 (999) 123-45-67',
        email: 'ivan@example.com'  // необязательно
    },
    delivery: {
        city: 'Москва',
        address: 'ул. Пушкина, д. 10'
    },
    comment: 'Позвонить перед доставкой',
    timestamp: '2026-04-02T10:00:00.000Z'
};
```

## Payload для LEADTEX

`sendOrderToServer()` трансформирует объект заказа в плоский словарь переменных:

| Переменная | Пример | Источник |
|---|---|---|
| `order_id` | `ORDER-1743600000000` | `order.id` |
| `order_total` | `"580"` | `order.total.toString()` |
| `order_subtotal` | `"580"` | то же, что total |
| `order_delivery` | `"300"` | **хардкод** в `app.js:511` |
| `order_items_count` | `"1"` | `order.items.length.toString()` |
| `order_timestamp` | ISO 8601 | `order.timestamp` |
| `order_items` | JSON строка | `JSON.stringify(order.items)` |
| `customer_name` | `Иван Петров` | `order.customer.name` |
| `customer_phone` | `+7 (999) 123-45-67` | `order.customer.phone` |
| `customer_email` | `ivan@...` | `order.customer.email` |
| `delivery_city` | `Москва` | `order.delivery.city` |
| `delivery_address` | `ул. Пушкина, д. 10` | `order.delivery.address` |
| `order_comment` | `Позвонить...` | `order.comment` |
| `source` | `mini_app_keychain_shop` | константа |
| `telegram_user_name` | `Иван Петров` | `telegramApp.getUserName()` |

> **Внимание**: `order_delivery` захардкожен как `"300"` в `app.js:511`. Это не соответствует реальной стоимости доставки. Нужно перенести в `CONFIG.CATALOG`.

## Телеграм-обёртка запроса

```json
{
  "contact_by": "telegram_id",
  "search": "<telegram_id пользователя>",
  "variables": { ... }
}
```

LEADTEX ищет контакт по `telegram_id`. Если контакта нет — заказ не обрабатывается.

## Маска телефона

Телефон форматируется автоматически при вводе:
- `89991234567` → `+7 (999) 123-45-67`
- Начало с `8` заменяется на `7`

Валидация: после снятия маски должно быть 11+ цифр: `phoneInput.value.replace(/\D/g, '').length < 11`.

## Связанные заметки

- [[LEADTEX принимает заказы через inner_webhook]]
- [[каталог брелков 15 товаров 6 категорий]]
- [[заказ не отправляется в LEADTEX]]

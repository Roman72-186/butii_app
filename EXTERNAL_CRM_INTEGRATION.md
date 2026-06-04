# Интеграция MAX Burger с External CRM

External CRM подключается как дополнительный канал после успешной оплаты заказа. Основной поток заказа живёт на backend: frontend собирает корзину, backend пересчитывает сумму, создаёт заказ и обновляет статус после ЮMoney.

## Когда отправлять заказ

Отправляй данные в External CRM только после статуса `paid`. Так менеджер получает уже подтверждённый заказ, а не неоплаченную корзину.

## Настройка окружения

```env
CRM_WEBHOOK_URL=https://example.crm/inner_webhook/uuid
CRM_WEBHOOK_SECRET=optional-secret
```

Если `CRM_WEBHOOK_URL` пустой, магазин продолжает принимать и оплачивать заказы без отправки во внешнюю CRM.

## Какие данные передаются

Рекомендуемый набор переменных:

| Переменная | Что хранит |
|---|---|
| `order_id` | внутренний ID заказа |
| `order_number` | номер заказа для клиента |
| `order_status` | статус заказа |
| `payment_status` | статус оплаты |
| `order_total` | итоговая сумма |
| `order_subtotal` | сумма блюд |
| `order_delivery` | стоимость доставки |
| `fulfillment_method` | `delivery` или `pickup` |
| `customer_name` | имя клиента |
| `customer_phone` | телефон клиента |
| `customer_email` | email для чека, если указан |
| `delivery_city` | Екатеринбург |
| `delivery_address` | адрес доставки или точка самовывоза |
| `order_comment` | комментарий к заказу |
| `order_items` | JSON со списком блюд |
| `source` | `max_burger` |

## Пример payload

```json
{
  "variables": {
    "order_id": "ord_123",
    "order_number": "MB-1001",
    "order_status": "paid",
    "payment_status": "succeeded",
    "order_total": "1180",
    "order_subtotal": "990",
    "order_delivery": "190",
    "fulfillment_method": "delivery",
    "customer_name": "Иван",
    "customer_phone": "+7 (999) 123-45-67",
    "customer_email": "ivan@example.com",
    "delivery_city": "Екатеринбург",
    "delivery_address": "ул. Вайнера, 9",
    "order_comment": "Побольше салфеток",
    "order_items": "[{\"name\":\"Ural Smash\",\"quantity\":1,\"price\":490}]",
    "source": "max_burger"
  }
}
```

## Проверка

1. Оформи заказ в MAX Mini App.
2. Оплати через ЮMoney.
3. Проверь, что заказ получил статус `paid`.
4. Проверь входящий webhook в External CRM и сценарий уведомления кухни/менеджера.

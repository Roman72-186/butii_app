---
tags: [integration, leadtex, webhook, crm]
date: 2026-04-02
---

# LEADTEX принимает заказы через inner_webhook

## Что такое inner_webhook

Inner Webhook в LEADTEX — это входящий эндпоинт, который принимает POST-запросы, находит контакт по указанному полю и записывает переменные в его карточку, затем запускает привязанный сценарий.

## Формат запроса

```json
{
  "contact_by": "telegram_id",
  "search": "123456789",
  "variables": {
    "order_id": "ORDER-1706620800000",
    "order_total": "2990",
    "order_subtotal": "2990",
    "order_delivery": "300",
    "order_items_count": "2",
    "order_timestamp": "2026-01-30T12:00:00.000Z",
    "order_items": "[{\"name\":\"Брелок\",\"quantity\":1,\"price\":2990}]",
    "customer_name": "Иван Петров",
    "customer_phone": "+7 (999) 123-45-67",
    "customer_email": "ivan@example.com",
    "delivery_city": "Москва",
    "delivery_address": "ул. Пушкина, д. 10",
    "order_comment": "Позвонить перед доставкой",
    "source": "mini_app_keychain_shop",
    "telegram_user_name": "Иван Петров"
  }
}
```

## URL вебхука

```
https://rb786743.leadteh.ru/inner_webhook/1f829cc9-3da3-4485-a97d-350e0d34baa1
```

Этот URL захардкожен в **двух местах**:
- `api/webhook.js:11`
- `vercel.json` → `rewrites[0].destination`

## Обязательное условие

**Контакт должен существовать в LEADTEX до отправки заказа.**

Пользователь должен сначала написать `/start` боту → LEADTEX создаст контакт с `telegram_id`. Если контакта нет, LEADTEX не сможет найти его по `search` и заказ «потеряется».

## Как LEADTEX обрабатывает запрос

```
Webhook получен
    ↓
Поиск контакта: contact_by = "telegram_id", search = "123456789"
    ↓
Запись переменных в карточку контакта
    ↓
Запуск привязанного сценария (настраивается в LEADTEX):
  — Отправить сообщение покупателю в Telegram
  — Уведомить менеджера
  — Установить тег "Новый заказ"
```

## Переменные в шаблонах LEADTEX

В сообщениях сценария используй `{{имя_переменной}}`:

```
Новый заказ №{{order_id}}
Клиент: {{customer_name}}
Телефон: {{customer_phone}}
Сумма: {{order_total}} ₽
Адрес: {{delivery_city}}, {{delivery_address}}
```

## Связанные заметки

- [[нет базы данных — состояние хранится в памяти и LEADTEX]]
- [[заказ не отправляется в LEADTEX]]
- [[архитектура системы построена на трёх уровнях]]
- [[деплой через Vercel с автоматическим CI]]

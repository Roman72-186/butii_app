# Интеграция Mini App с LEADTEX

Инструкция по получению Telegram ID пользователя и запуску сценариев в LEADTEX.

---

## 1. Как Mini App получает Telegram ID

Когда пользователь открывает Mini App через Telegram бота, Telegram автоматически передаёт данные пользователя:

```javascript
// telegram.js - инициализация
this.tg = window.Telegram?.WebApp;
this.user = this.tg.initDataUnsafe?.user;

// Получение ID
getUserId() {
    return this.user?.id;  // например: 123456789
}
```

**Telegram передаёт объект user:**
```javascript
{
    id: 123456789,           // ← Telegram ID пользователя
    first_name: "Иван",
    last_name: "Петров",
    username: "ivanpetrov",
    language_code: "ru"
}
```

---

## 2. Как ID отправляется в LEADTEX

При оформлении заказа Mini App отправляет POST-запрос на webhook:

```javascript
// app.js - функция sendToLeadtex()
fetch(CONFIG.WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        contact_by: 'telegram_id',           // ← Искать по Telegram ID
        search: '123456789',                  // ← Сам Telegram ID
        variables: {
            order_id: 'ORD-1706620800000',
            customer_name: 'Иван Петров',
            // ... остальные переменные
        }
    })
})
```

---

## 3. Настройка LEADTEX для приёма заказов

### Шаг 1: Создайте бота для регистрации контактов

Пользователь **должен сначала написать боту**, чтобы LEADTEX создал контакт с его `telegram_id`.

```
Пользователь → Пишет /start боту → LEADTEX создаёт контакт с telegram_id
```

### Шаг 2: Настройте Inner Webhook в LEADTEX

1. Перейдите в **LEADTEX → Настройки → Webhooks**
2. Создайте **Inner Webhook**
3. Скопируйте URL: `https://rb786743.leadteh.ru/inner_webhook/1f829cc9-3da3-4485-a97d-350e0d34baa1`

### Шаг 3: Создайте сценарий обработки заказа

В LEADTEX создайте сценарий, который:

```
Триггер: Inner Webhook (ваш webhook)
    ↓
Действие: Отправить сообщение в Telegram
    Текст: "Новый заказ №{{order_id}}
           Клиент: {{customer_name}}
           Телефон: {{customer_phone}}
           Сумма: {{order_total}} ₽
           Адрес: {{delivery_city}}, {{delivery_address}}"
    ↓
Действие: Установить тег "Новый заказ"
    ↓
Действие: Уведомить менеджера
```

---

## 4. Схема работы

```
┌─────────────────────────────────────────────────────────────────┐
│                         ПОЛЬЗОВАТЕЛЬ                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Открывает Mini App через кнопку в боте                      │
│     Telegram передаёт: { user: { id: 123456789, ... } }         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Mini App (keychain-shop)                                    │
│     - Получает telegram_id из window.Telegram.WebApp            │
│     - Пользователь оформляет заказ                              │
│     - Отправляет POST на /api/webhook                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Vercel (прокси)                                             │
│     - Получает запрос от Mini App                               │
│     - Перенаправляет на LEADTEX webhook                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. LEADTEX                                                     │
│     - Получает: { contact_by: 'telegram_id', search: '123...' } │
│     - Ищет контакт с telegram_id = 123456789                    │
│     - Записывает переменные в карточку контакта                 │
│     - Запускает сценарий (отправка сообщений, теги, и т.д.)     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Важно: Условие работы

**Контакт должен существовать в LEADTEX до оформления заказа!**

Пользователь должен сначала:
1. Написать `/start` вашему Telegram боту
2. LEADTEX создаст контакт с его `telegram_id`
3. Только после этого Mini App сможет найти контакт по ID

---

## 6. Доступные переменные в LEADTEX

После получения webhook, в карточке контакта будут доступны:

| Переменная | Пример значения |
|------------|-----------------|
| `{{order_id}}` | ORD-1706620800000 |
| `{{order_total}}` | 1980 |
| `{{order_subtotal}}` | 1980 |
| `{{order_delivery}}` | 0 |
| `{{order_items_count}}` | 2 |
| `{{order_items}}` | JSON с товарами |
| `{{customer_name}}` | Иван Петров |
| `{{customer_phone}}` | +7 (999) 123-45-67 |
| `{{customer_email}}` | ivan@example.com |
| `{{delivery_city}}` | Москва |
| `{{delivery_address}}` | ул. Пушкина, д. 10 |
| `{{order_comment}}` | Комментарий |
| `{{telegram_user_name}}` | Иван Петров |

---

## 7. Пример полного JSON запроса

```json
{
  "contact_by": "telegram_id",
  "search": "123456789",
  "variables": {
    "order_id": "ORD-1706620800000",
    "order_total": "1980",
    "order_subtotal": "1980",
    "order_delivery": "0",
    "order_items_count": "2",
    "order_timestamp": "2026-01-30T12:00:00.000Z",

    "order_items": "[{\"name\":\"Брелок Premium Edition\",\"quantity\":2,\"price\":990,\"total\":1980}]",

    "customer_name": "Иван Петров",
    "customer_phone": "+7 (999) 123-45-67",
    "customer_email": "ivan@example.com",

    "delivery_city": "Москва",
    "delivery_address": "ул. Пушкина, д. 10, кв. 5",

    "order_comment": "Позвонить перед доставкой",

    "source": "mini_app_keychain_shop",
    "telegram_user_name": "Иван Петров"
  }
}
```

---

## 8. Файлы проекта

| Файл | Описание |
|------|----------|
| `js/telegram.js` | Получение данных пользователя из Telegram Web App API |
| `js/app.js` | Логика оформления заказа и отправки в LEADTEX |
| `js/config.js` | Конфигурация (WEBHOOK_URL, данные товара) |
| `vercel.json` | Настройка прокси для обхода CORS |

---

## 9. Отладка

### Проверка Telegram ID в консоли браузера

Откройте Mini App и в консоли разработчика выполните:

```javascript
console.log(telegramApp.getUserId());
console.log(telegramApp.getUser());
```

### Проверка отправки заказа

В консоли браузера при оформлении заказа вы увидите:

```
📤 Отправка заказа: { customer: {...}, order: {...}, telegram: {...} }
✅ Заказ успешно отправлен в LEADTEX
```

### Режим разработки

Для тестирования без Telegram установите в `js/config.js`:

```javascript
DEV_MODE: true,
MOCK_USER: {
    id: 123456789,
    first_name: 'Test',
    last_name: 'User'
}
```

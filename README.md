# MAX Burger Shop

MAX-only Mini App для продажи еды в Екатеринбурге: бургеры, крылья, соусы и сопутствующие товары.

Сценарий:

1. пользователь открывает Mini App из MAX;
2. frontend получает пользователя через `window.WebApp`;
3. backend выдаёт session token;
4. пользователь собирает корзину;
5. в корзине выбирает доставку по Екатеринбургу или самовывоз;
6. backend пересчитывает сумму по серверному каталогу;
7. backend создаёт платёж ЮMoney;
8. после HTTP-уведомления ЮMoney заказ получает статус `paid`.

Проект работает как MAX Mini App.

## Стек

- Frontend: vanilla HTML/CSS/JS, MAX Web App SDK.
- Backend: Express.js.
- БД: PostgreSQL через `pg`; если `DATABASE_URL` пустой, работает in-memory режим для локальной проверки.
- Оплата: ЮMoney форма перевода + HTTP-уведомления.
- Внешний webhook: опционально через `CRM_WEBHOOK_URL` после успешной оплаты.

## Команды

```bash
npm install
npm run dev
npm test
```

Для локального запуска на текущем порту:

```powershell
$env:PORT="3012"; npm run dev
```

## Публичный домен

```text
https://shop.sushi-house-39.online
```

DNS A-запись должна указывать на:

```text
72.56.77.253
```

## Env

Скопировать `.env.example` в `.env` и заполнить:

```bash
PUBLIC_APP_URL=https://shop.sushi-house-39.online
DATABASE_URL=postgresql://...
JWT_SECRET=...

YOOMONEY_RECEIVER=41001...
YOOMONEY_NOTIFICATION_SECRET=...
YOOMONEY_PAYMENT_TYPE=AC

CRM_WEBHOOK_URL=https://...
CRM_WEBHOOK_SECRET=...
```

До финальной настройки сервера можно оставить `DATABASE_URL` пустым: приложение запустится в in-memory режиме.

## API

```text
GET  /api/health
GET  /api/catalog
POST /api/auth/max
POST /api/orders
GET  /api/orders/my
GET  /api/orders/:id
POST /api/payments/yoomoney/create
GET  /api/payments/:orderId/status
POST /api/payments/yoomoney/notification
POST /api/webhook
```

Все endpoints заказов и платежей, кроме ЮMoney notification, требуют:

```http
Authorization: Bearer <token>
```

## ЮMoney

Форма оплаты:

```text
POST https://yoomoney.ru/quickpay/confirm
```

HTTP-уведомления ЮMoney принимать на:

```text
https://shop.sushi-house-39.online/api/payments/yoomoney/notification
```

## MAX

Frontend использует:

```js
window.WebApp
```

Ключевые возможности:

- `ready()`;
- `expand()`;
- `initDataUnsafe.user`;
- `initDataUnsafe.start_param`;
- `requestContact()`;
- `shareMaxContent()`;
- `HapticFeedback`.

URL Mini App для MAX:

```text
https://shop.sushi-house-39.online/
```

## Что осталось настроить на сервере

- дождаться DNS propagation для `shop.sushi-house-39.online`;
- настроить Nginx reverse proxy на Node-приложение;
- выпустить HTTPS-сертификат от доверенного ЦС, например Let's Encrypt;
- заполнить `.env`;
- проверить заказ: MAX → Mini App → корзина → доставка/самовывоз → ЮMoney → notification → paid.

# Деплой MAX Burger

Инструкция для текущего проекта: MAX Mini App бургерной в Екатеринбурге с Express backend, серверным пересчётом корзины, доставкой/самовывозом и оплатой через ЮMoney.

## 1. Подготовка

```bash
npm install
cp .env.example .env
```

Заполни `.env`:

```env
PUBLIC_APP_URL=https://shop.sushi-house-39.online
PORT=3000
JWT_SECRET=replace-with-long-random-secret
DATABASE_URL=
YOOMONEY_RECEIVER=
YOOMONEY_NOTIFICATION_SECRET=
CRM_WEBHOOK_URL=
CRM_WEBHOOK_SECRET=
```

`DATABASE_URL` можно оставить пустым для локальной проверки: приложение запустится с in-memory хранилищем.

## 2. Локальная проверка

```bash
npm run dev
npm test
```

Открой `http://localhost:3000` и проверь путь:

```text
меню -> блюдо -> корзина -> доставка/самовывоз -> оплата -> статус заказа
```

## 3. Сервер

Продакшен-домен:

```text
https://shop.sushi-house-39.online
```

DNS A-запись должна указывать на VPS:

```text
shop.sushi-house-39.online -> 72.56.77.253
```

На сервере приложение должно работать за Nginx reverse proxy на Node-процесс с `PORT=3000`.

## 4. ЮMoney

В кабинете ЮMoney укажи HTTP notification URL:

```text
https://shop.sushi-house-39.online/api/payments/yoomoney/notification
```

После подключения проверь, что заказ после оплаты получает статус `paid`.

## 5. MAX

В настройках MAX Mini App укажи URL:

```text
https://shop.sushi-house-39.online/
```

Проверь на реальном клиенте MAX:

- открывается витрина MAX Burger;
- товары добавляются в корзину;
- доставка и самовывоз считают правильную сумму;
- оплата открывается через ЮMoney;
- статус заказа обновляется после оплаты.

## 6. Проверка после деплоя

```bash
curl https://shop.sushi-house-39.online/health
```

Ожидаемый результат: JSON со статусом приложения, хранилища и ЮMoney.

# План переделки под MAX Burger

## Что сделано

- Проект переведён на MAX-only frontend.
- Каталог заменён на бургеры, крылья, соусы и сопутствующие товары.
- Корзина стала основным экраном оформления заказа.
- В корзине добавлены:
  - выбор доставки по Екатеринбургу;
  - выбор самовывоза из точки;
  - контактные данные;
  - запуск оплаты ЮMoney.
- Добавлен Express backend.
- Добавлен PostgreSQL-ready слой хранения с in-memory fallback.
- Добавлен серверный пересчёт корзины по каталогу.
- Добавлена авторизация `POST /api/auth/max` с session token.
- Добавлены заказы:
  - `POST /api/orders`;
  - `GET /api/orders/my`;
  - `GET /api/orders/:id`.
- Добавлены endpoints ЮMoney:
  - `POST /api/payments/yoomoney/create`;
  - `POST /api/payments/yoomoney/notification`;
  - `GET /api/payments/:orderId/status`.
- Дизайн заменён на яркую ресторанную витрину с фото товаров.

## Публичная точка

```text
https://shop.sushi-house-39.online
```

DNS A-запись:

```text
shop.sushi-house-39.online -> 72.56.77.253
```

## Что нужно сделать при финальной настройке

1. Дождаться, пока DNS начнёт резолвиться снаружи.
2. Настроить Nginx reverse proxy на Node-приложение.
3. Выпустить Let's Encrypt сертификат.
4. Заполнить `.env`:
   - `PUBLIC_APP_URL=https://shop.sushi-house-39.online`;
   - `DATABASE_URL`;
   - `JWT_SECRET`;
   - `YOOMONEY_RECEIVER`;
   - `YOOMONEY_NOTIFICATION_SECRET`;
   - `CRM_WEBHOOK_URL`, если нужен внешний webhook;
   - `CRM_WEBHOOK_SECRET`, если нужен секрет для webhook.
5. В кабинете ЮMoney указать HTTP notification URL:

```text
https://shop.sushi-house-39.online/api/payments/yoomoney/notification
```

6. В MAX указать URL Mini App:

```text
https://shop.sushi-house-39.online/
```

7. Протестировать путь:

```text
MAX -> Mini App -> корзина -> доставка/самовывоз -> ЮMoney -> notification -> paid
```

## Важные решения

- Frontend не диктует итоговую сумму заказа.
- Доставка доступна только по Екатеринбургу.
- Самовывоз не добавляет стоимость доставки.
- Секреты не попадают в клиентский JS.
- Без PostgreSQL проект остаётся проверяемым локально через in-memory fallback.

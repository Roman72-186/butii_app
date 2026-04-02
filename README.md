# Keychain Shop Telegram Mini App

## Описание

Это Telegram Mini App для интернет-магазина брелков, интегрированный с платформой LeadTex. Проект включает в себя основное приложение магазина и bridge компонент для точной атрибуции рекламных кампаний.

## Архитектура

- **Frontend**: HTML/CSS/JS Telegram Mini App
- **Bridge**: Мост для атрибуции рекламных параметров из Telegram Ads
- **Backend**: Vercel Serverless Functions (для обхода CORS)
- **CRM**: LeadTex для управления заказами

## Запуск бота через Telegram

Для запуска бота с использованием домена LeadTex, следуйте этим шагам:

### 1. Создание бота в Telegram

1. Начните диалог с [@BotFather](https://t.me/BotFather) в Telegram
2. Используйте команду `/newbot`, чтобы создать нового бота
3. Следуйте инструкциям, чтобы задать имя и username для вашего бота
4. После завершения вы получите токен API

### 2. Настройка бота в LeadTex

1. Войдите в ваш аккаунт LeadTex
2. Перейдите в раздел "Настройки" → "Мессенджеры (каналы)"
3. Выберите Telegram и нажмите "Подключить"
4. Вставьте токен API, который вы получили от @BotFather

### 3. Настройка Bridge для рекламной атрибуции

Bridge компонент позволяет точно отслеживать источники переходов из рекламных кампаний:

1. **Разверните bridge** на Vercel или другом хостинге
2. **Настройте переменные окружения** в `.env` файле:
   ```
   LEADTEH_WEBHOOK_URL=https://your-leadteh-account.leadteh.ru/inner_webhook/your-webhook-uuid
   LEADTEH_API_KEY=your_api_key
   LEADTEH_BOT_ID=your_bot_id
   ```
3. **Обновите BOT_USERNAME** в `bridge/index.html` на ваш реальный username бота
4. **Настройте Mini App** в BotFather с коротким именем `bridge`

### 4. Создание ссылки для запуска

Для рекламных кампаний используйте формат:
```
https://t.me/your_bot_username/bridge?startapp=campaign_tag
```

Для обычного запуска приложения:
```
https://t.me/your_bot_username?startapp=miniapp_id
```

Где:
- `your_bot_username` — это username вашего Telegram-бота (например, `@mykeychainbot`)
- `campaign_tag` — тег рекламной кампании (например, `promo_jan2024`)
- `miniapp_id` — идентификатор вашего Mini App в системе LeadTex

### 5. Настройка домена в LeadTex

LeadTex автоматически обеспечивает соответствие доменным требованиям Telegram для запуска Mini Apps. Вам не нужно настраивать отдельный webhook, так как вся обработка происходит через платформу LeadTex.

## Интеграция с LeadTex

При оформлении заказа в Mini App:

1. Приложение получает `telegram_id` пользователя из Telegram Web App API
2. Отправляется POST-запрос на webhook LeadTex с данными заказа
3. LeadTex создает карточку контакта с `telegram_id` и запускает сценарий обработки

Пример структуры запроса:
```json
{
  "contact_by": "telegram_id",
  "search": "123456789",
  "variables": {
    "order_id": "ORDER-1234567890",
    "order_total": "2990",
    "customer_name": "Иван Петров",
    "customer_phone": "+7 (999) 123-45-67",
    "delivery_city": "Москва",
    "delivery_address": "ул. Пушкина, д. 10",
    "...": "..."
  }
}
```

## Важные замечания

1. **Контакт должен существовать в LeadTex до оформления заказа** - пользователь должен сначала написать `/start` вашему боту, чтобы LeadTex создал контакт с его `telegram_id`.

2. **Для тестирования** в файле `js/config.js` можно включить режим разработки:
   ```javascript
   DEV_MODE: true,
   MOCK_USER: {
       id: 123456789,
       first_name: 'Тест',
       last_name: 'Пользователь',
       username: 'testuser',
       language_code: 'ru'
   }
   ```

3. **Домен LeadTex** используется автоматически через систему вебхуков, что соответствует требованиям Telegram для запуска Mini Apps.

## Запуск локально

1. Установите зависимости: `npm install` (если есть package.json)
2. Запустите локальный сервер: `npm run dev`
3. Откройте приложение через Telegram Web App для корректной работы всех функций

## Деплой

Проект настроен для деплоя на Vercel. При пуше в репозиторий автоматически происходит сборка и деплой.

## Отладка

Для проверки `telegram_id` в консоли браузера выполните:
```javascript
console.log(telegramApp.getUserId());
console.log(telegramApp.getUser());
```

При оформлении заказа в консоли браузера вы увидите:
```
📤 Отправка заказа: { customer: {...}, order: {...}, telegram: {...} }
✅ Заказ успешно отправлен в LEADTEX
```

## Bridge компонент

Bridge компонент находится в директории `bridge/` и обеспечивает точную атрибуцию рекламных кампаний. Подробнее см. `bridge/README.md`.
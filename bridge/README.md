# Telegram Ads Bridge Mini App для Keychain Shop

Минимальное Telegram Mini App, которое захватывает рекламные параметры из Telegram Ads и пересылает их в Leadteh для точного отслеживания атрибуции.

## Проблема, которую решает

При запуске Telegram Ads с прямыми ссылками на бот (`t.me/bot?start=xyz`), платформы вроде Leadteh часто теряют параметр `start` для **новых пользователей**. Этот мост решает проблему следующим образом:

1. Открывается как Mini App (сохраняет параметры)
2. Захватывает `start_param` и `telegram_id`
3. Отправляет данные в webhook Leadteh
4. Автоматически закрывается, чтобы пользователь оказался в чате с ботом

## Architecture

```
[Telegram Ad]
    ↓ (user clicks)
[Mini App Link: t.me/bot/bridge?startapp=campaign_123]
    ↓
[Bridge Mini App Opens]
    ↓ (captures: telegram_id, start_param, initData)
[POST to /api/bridge-webhook]
    ↓ (proxy)
[Leadteh Webhook receives full attribution data]
    ↓
[Mini App closes → tg.close()]
    ↓
[User lands in bot chat with correct flow triggered]
```

## File Structure

```
bridge/
├── index.html           # Main Mini App page
├── css/
│   └── bridge.css       # Minimal styles with Telegram theme support
├── js/
│   └── bridge.js        # Core bridge logic
├── api/
│   └── bridge-webhook.js  # Vercel serverless function (proxy to Leadteh)
├── vercel.json          # Vercel deployment config
├── .env.example         # Environment variables template
└── README.md            # This file
```

## Настройка и деплой

### Вариант 1: Деплой как отдельный Vercel проект

1. **Создайте новый Vercel проект:**
   ```bash
   cd bridge
   vercel
   ```

2. **Установите переменные окружения в Vercel Dashboard:**
   - Перейдите в Project Settings → Environment Variables
   - Добавьте `LEADTEH_WEBHOOK_URL` с вашим Leadteh webhook URL
   - При необходимости добавьте `LEADTEH_API_KEY` и `LEADTEH_BOT_ID`

3. **Получите URL деплоя** (например, `https://your-bridge.vercel.app`)

### Вариант 2: Деплой как часть существующего проекта

Если вы хотите использовать мост по адресу `/bridge` на вашем домене:

1. **Скопируйте файлы в корень проекта:**
   - Переместите `bridge/index.html` → `bridge.html` (или оставьте как `bridge/index.html`)
   - Переместите `bridge/api/bridge-webhook.js` → `api/bridge-webhook.js`

2. **Обновите корневой `vercel.json`:**
   ```json
   {
     "rewrites": [
       {
         "source": "/bridge",
         "destination": "/bridge/index.html"
       }
     ]
   }
   ```

3. **Установите переменные окружения** как описано выше

## Настройка для Keychain Shop

Для интеграции с проектом Keychain Shop:

1. **Обновите BOT_USERNAME в `index.html`:**
   ```javascript
   BOT_USERNAME: 'your_real_keychain_shop_bot'  // Замените на реальный username бота
   ```

2. **Настройте переменные окружения:**
   - `LEADTEH_WEBHOOK_URL`: ваш Leadteh webhook URL
   - `LEADTEH_API_KEY`: ваш API ключ Leadteh (если используется)
   - `LEADTEH_BOT_ID`: ID бота в Leadteh (если используется)

3. **Создайте .env файл:**
   ```bash
   cp .env.example .env
   # Отредактируйте .env с вашими значениями
   ```

## Формат ссылок для Telegram (используют домен t.me)

### Для рекламных кампаний через Bridge (рекомендуется)

Используйте этот формат в ваших Telegram Ads:

```
https://t.me/YOUR_BOT_USERNAME/bridge?startapp=CAMPAIGN_TAG
```

Где:
- `YOUR_BOT_USERNAME` - Username вашего бота (без @)
- `bridge` - Короткое имя Mini App (настраивается в BotFather)
- `CAMPAIGN_TAG` - Ваш рекламный тег (например, `promo_jan2024`, `utm_source_fb`)

### Для обычного запуска Mini App

Для обычного запуска приложения используйте:

```
https://t.me/YOUR_BOT_USERNAME?startapp=APP_IDENTIFIER
```

Где:
- `YOUR_BOT_USERNAME` - Username вашего бота (без @)
- `APP_IDENTIFIER` - Идентификатор приложения (опционально)

### Настройка в BotFather

1. Откройте [@BotFather](https://t.me/BotFather)
2. Отправьте `/mybots` → Выберите бота → **Bot Settings** → **Menu Button**
3. Или используйте `/newapp` чтобы создать новый Mini App:
   - **Short name:** `bridge`
   - **URL:** `https://your-bridge-domain.vercel.app/` (ваш развернутый URL моста)

### Примеры

| Кампания | Ссылка в Telegram Ads |
|----------|------------------|
| Ретаргетинг Facebook | `t.me/mybot/bridge?startapp=fb_retarget_jan` |
| История Instagram | `t.me/mybot/bridge?startapp=ig_story_promo` |
| Канал Telegram | `t.me/mybot/bridge?startapp=tg_channel_main` |
| Общая реклама | `t.me/mybot/bridge?startapp=promo_2024q1` |

## Данные, отправляемые в Leadteh

Мост отправляет этот payload в ваш webhook Leadteh:

```json
{
  "telegram_id": 123456789,
  "start_param": "your_campaign_tag",
  "init_data": "query_string_with_signature",
  "user_data": {
    "id": 123456789,
    "first_name": "Иван",
    "last_name": "Иванов",
    "username": "ivanov",
    "language_code": "ru",
    "is_premium": false
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "platform": "android",
  "source": "telegram_ads_bridge"
}
```

## Конфигурация

Отредактируйте `window.BRIDGE_CONFIG` в `index.html`:

```javascript
window.BRIDGE_CONFIG = {
    WEBHOOK_URL: '/api/bridge-webhook',  // Endpoint вебхука
    TIMEOUT_MS: 10000,                   // Таймаут запроса
    MAX_RETRIES: 2,                      // Количество авто-повторов
    RETRY_DELAY_MS: 1000,                // Задержка между повторами
    CLOSE_DELAY_MS: 500                  // Задержка перед закрытием
};
```

## Обработка ошибок

| Сценарий | Поведение |
|----------|----------|
| Ошибка сети | Автоповтор до 2 раз, затем показ ошибки с кнопкой повтора |
| Ошибка сервера (5xx) | Автоповтор, затем ошибка |
| Ошибка клиента (4xx) | Немедленный показ ошибки (без повтора) |
| Таймаут | Автоповтор, затем ошибка |
| Пользователь нажимает "Закрыть" | Mini App закрывается, пользователь переходит в чат с ботом |

## Безопасность

1. **Валидация initData:** Поле `init_data` содержит подписанный хэш, который можно проверить на сервере с использованием токена бота. Реализуйте проверку в вашем Leadteh workflow при необходимости.

2. **Никаких секретов во фронтенде:** Все чувствительные URL передаются через serverless функцию.

3. **CORS:** Serverless функция обрабатывает CORS для разрешения запросов из контекста Telegram Mini App.

## Локальное тестирование

1. **Запустите локальный сервер:**
   ```bash
   cd bridge
   npx serve .
   ```

2. **Откройте в браузере:** Приложение запустится, но не будет иметь реальных данных Telegram. Проверьте консоль браузера для просмотра логов.

3. **Тестирование с ngrok:** Для тестирования с реальным Telegram:
   ```bash
   ngrok http 3000
   ```
   Затем используйте URL ngrok в BotFather временно.

## Устранение неполадок

### Mini App не открывается
- Проверьте правильность username бота
- Убедитесь, что Mini App настроен в BotFather с правильным URL
- Проверьте, что URL использует HTTPS

### start_param равен null
- Проверьте формат ссылки: `t.me/bot/app?startapp=tag` (внимание: `startapp`, а не `start`)
- Проверьте, что тег не содержит специальных символов (используйте буквы, цифры и подчеркивания)

### Вебхук возвращает ошибку
- Проверьте логи функции Vercel в панели управления
- Убедитесь, что переменная окружения `LEADTEH_WEBHOOK_URL` установлена
- Протестируйте webhook Leadteh напрямую с помощью curl

### Приложение показывает "Connecting..." вечно
- Проверьте вкладку Network браузера на наличие неудачных запросов
- Убедитесь, что endpoint API доступен
- Проверьте логи деплоя Vercel

## Интеграция с Keychain Shop

Для полноценной интеграции моста с вашим Keychain Shop:

1. **Настройте BotFather:** Убедитесь, что ваш бот настроен как Mini App с коротким именем `bridge`
2. **Обновите конфигурацию:** Установите правильный `BOT_USERNAME` в `index.html`
3. **Настройте Leadteh:** Убедитесь, что ваш webhook Leadteh правильно обрабатывает полученные параметры
4. **Тестирование:** Протестируйте полный путь от рекламной ссылки до оформления заказа в боте

## Лицензия

MIT

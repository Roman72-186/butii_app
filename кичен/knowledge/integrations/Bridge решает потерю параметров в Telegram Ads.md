---
tags: [integration, bridge, telegram-ads, attribution]
date: 2026-04-02
---

# Bridge решает потерю параметров в Telegram Ads

## Проблема

При запуске рекламы в Telegram Ads через ссылку `t.me/bot?start=campaign_tag` для **новых пользователей** (тех, кто ещё не писал боту) параметр `start` теряется. LEADTEX не получает информацию об источнике трафика.

## Решение: Mini App как промежуточный слой

Bridge — отдельный Telegram Mini App в папке `bridge/`. Алгоритм:

```
Пользователь кликает на рекламу
    ↓
Открывается Bridge Mini App: t.me/bot/bridge?startapp=campaign_123
    ↓
bridge.js захватывает: telegram_id + start_param
    ↓
POST на /api/bridge-webhook → прокси → LEADTEX
    ↓
tg.close() — Mini App закрывается
    ↓
Пользователь оказывается в чате с ботом
```

Mini App сохраняет параметры, потому что `tg.initDataUnsafe.start_param` доступен ещё до того, как пользователь написал что-либо боту.

## Формат ссылки для рекламы

```
https://t.me/YOUR_BOT_USERNAME/bridge?startapp=CAMPAIGN_TAG
```

Примеры:
- `t.me/mybot/bridge?startapp=fb_retarget_jan`
- `t.me/mybot/bridge?startapp=tg_channel_promo`

## Payload Bridge в LEADTEX

```json
{
  "telegram_id": 123456789,
  "start_param": "fb_retarget_jan",
  "init_data": "query_string_with_signature",
  "user_data": { "id": 123456789, "first_name": "Иван", ... },
  "timestamp": "2026-01-30T10:00:00Z",
  "platform": "android",
  "source": "telegram_ads_bridge"
}
```

## Конфигурация Bridge

В `bridge/index.html` настраивается `window.BRIDGE_CONFIG`:

```javascript
{
  WEBHOOK_URL: '/api/bridge-webhook',
  TIMEOUT_MS: 10000,
  MAX_RETRIES: 2,
  RETRY_DELAY_MS: 1000,
  CLOSE_DELAY_MS: 500
}
```

## Деплой Bridge

**Вариант 1**: Отдельный Vercel проект (папка `bridge/` как корень)
**Вариант 2**: Как часть основного проекта по пути `/bridge`

Требует env-переменных в Vercel Dashboard:
- `LEADTEH_WEBHOOK_URL`
- `LEADTEH_API_KEY` (опционально)
- `LEADTEH_BOT_ID` (опционально)

## Настройка в BotFather

```
/mybots → Выбрать бота → Bot Settings → Menu Button
или
/newapp → Short name: bridge → URL: https://your-bridge.vercel.app/
```

## Обработка ошибок

| Ситуация | Поведение |
|---|---|
| Ошибка сети | Авто-повтор до 2 раз |
| Ошибка 5xx | Авто-повтор, затем показ ошибки |
| Ошибка 4xx | Немедленная ошибка (не повторять) |
| Таймаут | Авто-повтор |

## Связанные заметки

- [[архитектура системы построена на трёх уровнях]]
- [[деплой через Vercel с автоматическим CI]]
- [[LEADTEX принимает заказы через inner_webhook]]

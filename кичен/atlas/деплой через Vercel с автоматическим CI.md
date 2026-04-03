---
tags: [atlas, deploy, vercel, ci]
date: 2026-04-02
---

# Деплой через Vercel с автоматическим CI

## Как работает деплой

1. `git push` в репозиторий на GitHub
2. Vercel автоматически подхватывает изменения
3. Статические файлы раздаются с CDN
4. `api/webhook.js` компилируется в Serverless Function
5. Настройки из `vercel.json` применяются (маршруты, заголовки)

## Ручной деплой

```bash
vercel --prod
```

## Конфигурация vercel.json

```json
{
  "rewrites": [
    {
      "source": "/api/webhook",
      "destination": "https://rb786743.leadteh.ru/inner_webhook/1f829cc9-..."
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

> **Важно**: URL LEADTEX захардкожен в двух местах — `vercel.json` и `api/webhook.js`. При смене UUID вебхука нужно обновить оба файла.

## Vercel Rewrite vs Serverless Function

В проекте **два** механизма проксирования существуют одновременно:

- `vercel.json → rewrites` — простое перенаправление URL, не выполняет код
- `api/webhook.js` — serverless функция, выполняет fetch с кастомными заголовками

Сейчас оба нацелены на один URL LEADTEX. `api/webhook.js` добавляет обработку ошибок и логирование — это актуальный путь. Rewrite в `vercel.json` — возможно артефакт предыдущей версии.

## Переменные окружения

Основное приложение не требует env-переменных — конфигурация в `js/config.js`.

Bridge-компонент требует:
```
LEADTEH_WEBHOOK_URL=https://...
LEADTEH_API_KEY=...
LEADTEH_BOT_ID=...
```
Устанавливаются в Vercel Dashboard → Project Settings → Environment Variables.

## Связанные заметки

- [[архитектура системы построена на трёх уровнях]]
- [[Bridge решает потерю параметров в Telegram Ads]]

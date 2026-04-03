---
tags: [session]
date: 2026-04-03
---

# 2026-04-03 — Переход на MAX-мессенджер (SMS-NJMAX)

## Сделано

- Заменён webhook UUID: старый `1f829cc9-...` → `ed15c46a-5b2b-44fb-82b1-283059365c41`
- Изменён способ поиска контакта: `contact_by: 'telegram_id'` → `contact_by: 'phone'`
- Добавлена функция `normalizePhone()` в `js/app.js` — нормализует любой формат российского номера до `+7XXXXXXXXXX`
- Обновлён `source`: `mini_app_keychain_shop` → `mini_app_keychain_max`
- `telegram_id` добавлен как вспомогательная переменная в payload
- `messenger: 'max'` в `bridge/api/bridge-webhook.js`
- `BOT_USERNAME: 'id861708697380_1_bot'` в `bridge/index.html`

## Баги исправлены

- **Двойной вызов webhook** в `bridge/api/bridge-webhook.js` (строки 118-148) — webhook вызывался дважды за один запрос, создавая дублирующие записи в LeadTeX. Исправлено через сохранение статуса в переменную `webhookStatus`.
- **normalizePhone** не обрабатывала 10-значные номера — добавлена ветка для `digits.length === 10`.

## Тесты

24/24 в `tests/app.test.js` — все зелёные.

## Связанные заметки

- [[LEADTEX принимает заказы через inner_webhook]]
- [[Bridge решает потерю параметров в Telegram Ads]]

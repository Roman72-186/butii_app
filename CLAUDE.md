# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Local dev server at http://localhost:3000
npm test             # Run Jest tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report (HTML output in coverage/)
vercel --prod        # Deploy to production
```

Tests live in `tests/` and target jsdom environment. Run a single test file with:
```bash
npx jest tests/cart.test.js
```

## Architecture

This is a **Telegram Mini App** (SPA) for selling keychains, deployed on Vercel and integrated with the LEADTEX CRM.

### Data flow

```
User (Telegram) → index.html → js/app.js → POST /api/webhook → Vercel rewrite → LEADTEX
```

- `js/config.js` — Single source of truth for all shop data (products, categories, prices, WEBHOOK_URL). Modifying products/categories only requires editing this file.
- `js/telegram.js` — Wraps the Telegram Web App SDK (`window.Telegram.WebApp`). Provides a mock object when `DEV_MODE=true` in config.js so the app runs outside Telegram in a browser.
- `js/app.js` — Core shopping logic: section-based SPA navigation, cart state (in-memory + localStorage), product rendering, checkout form, and `sendOrderToServer()` which posts to `/api/webhook`.
- `api/webhook.js` — Vercel serverless function that acts as a CORS proxy, forwarding order payloads to LEADTEX. The actual LEADTEX URL lives in `vercel.json` rewrites.
- `js/booking.js` — Unused BookingManager class, not wired into the application.

### SPA navigation

`showSection(sectionId)` hides all sections and shows the target one. The six sections are defined in `index.html`: `productsSection`, `productDetailsSection`, `cartSection`, `checkoutSection`, `successSection`, `myOrdersSection`.

### LEADTEX payload format

Orders are sent as:
```json
{
  "contact_by": "telegram_id",
  "search": "<user telegram_id>",
  "variables": { "order details and customer info" }
}
```

`telegram_id` is read from `Telegram.WebApp.initDataUnsafe.user.id`. In DEV_MODE, a mock user `{ id: 123456789 }` is used.

### Bridge component (`bridge/`)

A separate, standalone Telegram Mini App used for ad campaign attribution. It captures `start_param` + `telegram_id` when new users arrive via Telegram Ads (where those params can be lost), forwards them to LEADTEX, then closes immediately. Has its own `vercel.json` and can be deployed independently.

## Key configuration

- **Enable dev mode** (run outside Telegram): set `DEV_MODE: true` in `js/config.js`.
- **Change LEADTEX endpoint**: update the `rewrites` destination in `vercel.json`.
- **Add/edit products**: edit the `PRODUCTS` array in `js/config.js` — no rebuild required (static site).
- **Delivery cost / cart limits**: `CONFIG.CATALOG` in `js/config.js`.
## Obsidian Knowledge Vault

Хранилище знаний находится в `obsidian-vault/` в корне репозитория.

**При старте сессии** читай:
- `obsidian-vault/00-home/index.md` — навигация по всем заметкам
- `obsidian-vault/00-home/текущие приоритеты.md` — активные задачи и известные баги

**Где искать знания:**
- `obsidian-vault/knowledge/integrations/` — LEADTEX, Telegram SDK, Bridge
- `obsidian-vault/knowledge/debugging/` — известные проблемы и их решения
- `obsidian-vault/knowledge/decisions/` — почему сделано именно так
- `obsidian-vault/knowledge/patterns/` — архитектурные паттерны кода
- `obsidian-vault/knowledge/business/` — каталог товаров, структура заказа
- `obsidian-vault/atlas/` — архитектура, стек, деплой (верхний уровень)

**После завершения задачи** создай заметку в `obsidian-vault/sessions/YYYY-MM-DD название.md` и обнови `текущие приоритеты.md`.
> Совместимый вход для Claude Code: перед работой читать [AGENTS.md](AGENTS.md), затем [../AGENTS.md](../AGENTS.md).  
> Сохранить сессию → C:\Users\User\.agents\skills\save-session\SKILL.md → session-handoffs/current.md.  
> Прочитай сохранённую сессию → сначала session-handoffs/current.md, затем [AGENTS.md](AGENTS.md).

---
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Общие слои

Этот проект использует общие принципы и активы из корня монорепо `Project/`:

- **Голос и стиль:** [../ai-clone/voice/](../ai-clone/voice/), [../ai-clone/style/](../ai-clone/style/)
- **Принципы кода:** [../ai-clone/principles/code.md](../ai-clone/principles/code.md)
- **Принципы продукта:** [../ai-clone/principles/product.md](../ai-clone/principles/product.md)
- **Уроки и подтверждённые решения:** [../ai-clone/feedback/](../ai-clone/feedback/) — `Why / How to apply`
- **Совет директоров (методы):** [../mastery/INDEX.md](../mastery/INDEX.md)
- **Активные планы:** [../plans/](../plans/) — файлы с префиксом `keychain-`
- **Ретроспективы:** [../retrospectives/](../retrospectives/)
- **Корневой навигатор:** [../CLAUDE.md](../CLAUDE.md)

---

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

This is a **MAX Mini App** burger shop for Екатеринбург: burgers, wings, sauces, sides, delivery/pickup, orders, and YooMoney payments.

### Data flow

```
User (MAX) → index.html → js/max-app.js → js/app.js → server.js → PostgreSQL/in-memory store → YooMoney/External CRM
```

- `js/config.js` — single source of truth for burger menu data: products, categories, prices, delivery, pickup points, and public shop settings.
- `js/max-app.js` — wraps the MAX Web App SDK (`window.WebApp`) and provides a browser mock for local development.
- `js/app.js` — core shop logic: section-based SPA navigation, cart state, product rendering, checkout form, order creation, payment screen, status checks, and order history.
- `server.js` + `server/` — Express API for auth, catalog validation, orders, YooMoney payment creation/status, and optional External CRM webhook after successful payment.
- `api/webhook.js` — legacy Vercel webhook bridge; do not use it as the main order flow unless a specific integration task requires it.

### SPA navigation

`showSection(sectionId)` hides all sections and shows the target one. The six sections are defined in `index.html`: `productsSection`, `productDetailsSection`, `cartSection`, `checkoutSection`, `successSection`, `myOrdersSection`.

### External CRM payload format

External CRM is optional and receives paid orders from the backend when `CRM_WEBHOOK_URL` is configured. MAX user data comes from `window.WebApp.initDataUnsafe.user`; in local development `CONFIG.MOCK_USER` is used.

### Bridge component (`bridge/`)

Legacy attribution bridge. Keep it only if the deployment still uses it for campaign tracking; it is not part of the burger ordering UI.

## Key configuration

- **Enable dev mode** (run outside MAX): set `DEV_MODE: true` in `js/config.js`.
- **Change External CRM endpoint**: set `CRM_WEBHOOK_URL` in environment.
- **Add/edit products**: edit the `PRODUCTS` array in `js/config.js` — no rebuild required (static site).
- **Delivery cost / cart limits**: `CONFIG.CATALOG` in `js/config.js`.
## Obsidian Knowledge Vault

Хранилище знаний находится в `obsidian-vault/` в корне репозитория.

**При старте сессии** читай:
- `obsidian-vault/00-home/index.md` — навигация по всем заметкам
- `obsidian-vault/00-home/текущие приоритеты.md` — активные задачи и известные баги

**Где искать знания:**
- `obsidian-vault/knowledge/integrations/` — External CRM, Telegram SDK, Bridge
- `obsidian-vault/knowledge/debugging/` — известные проблемы и их решения
- `obsidian-vault/knowledge/decisions/` — почему сделано именно так
- `obsidian-vault/knowledge/patterns/` — архитектурные паттерны кода
- `obsidian-vault/knowledge/business/` — каталог товаров, структура заказа
- `obsidian-vault/atlas/` — архитектура, стек, деплой (верхний уровень)

**После завершения задачи** сначала используй внешний протокол `C:\Users\User\.agents\skills\save-session\SKILL.md` и обнови `session-handoffs/current.md` внутри проекта. Заметку в `obsidian-vault/sessions/YYYY-MM-DD название.md` и `текущие приоритеты.md` можно обновить дополнительно как долговременную память проекта.


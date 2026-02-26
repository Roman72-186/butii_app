# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Telegram Mini App for a beauty studio appointment booking system ("Beauty Studio") with LEADTEX CRM integration. The app is a static SPA built with vanilla JavaScript — no frameworks, no build step, no production dependencies.

## Commands

```bash
npm run dev              # Local dev server on port 3000 (http-server)
npm test                 # Run Jest tests (jsdom environment)
npm run test:watch       # Tests in watch mode
npm run test:coverage    # Coverage report (excludes js/telegram.js)
npm run deploy           # Deploy to Vercel (vercel --prod)
```

Tests live in `tests/` and match pattern `**/tests/**/*.test.js`.

## Architecture

**Static SPA** — single `index.html` with JS modules loaded via `<script>` tags (not ES modules). All state is managed through global variables and localStorage.

### Booking Flow

```
Categories → Services → Master Selection → Calendar → Time Slots → Confirmation Form
    ↓                                                                      ↓
config.js (data)                                              POST /api/webhook
                                                                       ↓
                                                              LEADTEX CRM (inner_webhook)
```

### Key Modules

| File | Role |
|------|------|
| `js/config.js` | All data: services, masters, categories, schedule settings, studio info. Single source of truth for business configuration. |
| `js/app.js` | UI rendering and user interaction. DOM-based rendering (no virtual DOM). Global functions like `renderCategories()`, `renderServices()`, `renderCalendar()`, `renderTimeSlots()`. |
| `js/booking.js` | `BookingManager` class — booking lifecycle, localStorage persistence. |
| `js/telegram.js` | `TelegramApp` class — Telegram Web App API wrapper (theme, haptic feedback, MainButton). Falls back to mock when outside Telegram or in dev mode. |
| `api/webhook.js` | Vercel serverless function — proxies POST requests to LEADTEX to bypass CORS. |
| `css/style.css` | All styles. Uses CSS variables (`--tg-*` for Telegram theme integration). |

### Globals

Scripts create global singletons: `telegramApp` (TelegramApp instance), `bookingManager` (BookingManager). App state uses module-level variables in `app.js`: `currentCategory`, `selectedDate`, `selectedTime`.

## Deployment

Hosted on **Vercel**. `vercel.json` configures:
- Rewrite: `/api/webhook` → LEADTEX webhook endpoint
- Security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)

The `api/webhook.js` serverless function also hardcodes the LEADTEX URL as a fallback proxy.

## Language

All UI text, comments, and documentation are in **Russian**. Maintain this convention.

## Subproject: n8n-skills/

Separate directory with Claude Code skills for n8n workflow development. Has its own `CLAUDE.md`. Not part of the main app build/test cycle.

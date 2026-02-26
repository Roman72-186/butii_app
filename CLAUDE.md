# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Telegram Mini App for a beauty studio appointment booking system ("Beauty Studio") with LEADTEX CRM integration and Supabase backend. The app is a static SPA built with vanilla JavaScript — no frameworks, no build step, no production dependencies.

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

Two SPAs sharing one Supabase backend:

### 1. Mini App (`index.html`) — клиентская часть
Telegram Mini App для записи на услуги. JS modules loaded via `<script>` tags.

```
Categories → Services → Master Selection → Calendar → Time Slots → Confirmation Form
    ↓                                                                      ↓
Supabase (services, specialists, schedule)                    POST /api/webhook → LEADTEX CRM
                                                              + INSERT into bookings (Supabase)
```

### 2. Admin Panel (`admin.html`) — управление
Вход по телефону + пароль. Две роли: admin и specialist.

- **Admin**: видит все записи, специалистов, клиентов, услуги. Добавляет специалистов/услуги.
- **Specialist**: управляет своим расписанием (рабочие дни/часы), блокирует слоты, видит свои записи.

### Key Modules

| File | Role |
|------|------|
| `js/config.js` | Static fallback data (services, masters, schedule). Being replaced by Supabase. |
| `js/app.js` | Mini App UI rendering and interaction. |
| `js/booking.js` | `BookingManager` class — booking lifecycle. |
| `js/telegram.js` | `TelegramApp` class — Telegram Web App API wrapper. |
| `js/supabase-config.js` | Supabase client initialization (URL + anon key). |
| `js/admin.js` | Admin panel logic: auth, navigation, CRUD for all entities. |
| `api/webhook.js` | Vercel serverless function — proxies POST to LEADTEX CRM. |
| `sql/schema.sql` | Supabase database schema: tables, RPC functions, RLS policies. |
| `css/style.css` | Mini App styles. |
| `css/admin.css` | Admin panel styles. |

### Supabase Schema

Tables: `admins`, `specialists`, `clients`, `services`, `specialist_services`, `specialist_schedule`, `blocked_slots`, `bookings`.

RPC functions (SECURITY DEFINER, handle password hashing):
- `admin_login(phone, password)` → returns `{id, role, name}` or error
- `create_specialist(...)` → creates specialist + default schedule
- `create_admin(name, phone, password)`
- `get_available_slots(specialist_id, date, duration)` → returns available time slots

Auth is custom (not Supabase Auth): phone + bcrypt password in `admins`/`specialists` tables, verified via `admin_login` RPC.

## Deployment

Hosted on **Vercel**. `vercel.json` configures security headers. `api/webhook.js` proxies to LEADTEX.

Supabase credentials go in `js/supabase-config.js` (SUPABASE_URL, SUPABASE_ANON_KEY).

## Language

All UI text, comments, and documentation are in **Russian**. Maintain this convention.

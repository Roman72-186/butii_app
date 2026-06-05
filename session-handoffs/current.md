# Session Handoff

**Updated:** 2026-06-05 09:00 +05
**Agent:** Codex
**Workspace:** C:\Users\User\Desktop\Project
**Active project:** C:\Users\User\Desktop\Project\keychain-shop

## What Was Done

- Fixed mobile mini app product images by routing external Unsplash image URLs through same-origin `/api/image`.
- Added frontend SVG fallback for failed image loads in product cards, product details, and cart.
- Committed and pushed changes to `origin/main`.
- Deployed manually to VPS production path `/opt/max-burger-shop` because Vercel CLI token is invalid and production domain is served by PM2/Nginx on `server-main`.

## Current State

- Local git commit: `29f7cce fix(miniapp): proxy product images`.
- Production process: PM2 `max-burger-shop`, cwd `/opt/max-burger-shop`, proxy via Nginx `shop.sushi-house-39.online -> 127.0.0.1:3012`.
- Production backup before overwrite: `/opt/max-burger-shop/backups/image-proxy-20260605-040013`.

## Files Changed

- `server.js` — added safe `/api/image` proxy; only allows `https://images.unsplash.com`, checks `image/*`, caches response.
- `js/app.js` — added `getProductImageSrc`, `getProductFallbackImage`, `handleProductImageError`; updated product/detail/cart image tags.

## Decisions And Rules

- Do not rely on direct external image loading in mobile mini app webviews.
- Keep original catalog image URLs in `js/config.js`; transform them only at render time.
- No env changes and no payment/order logic changes.

## Next Steps

- User should open the real mini app on a phone and confirm catalog preview and product detail images render.
- If replacing Unsplash later, prefer local/static product images or a controlled CDN on the app domain.

## Verification

- Local: `npm.cmd test` passed, 4 smoke tests.
- Local syntax: `node --check server.js`, `node --check js\app.js`.
- Server syntax before restart: `node --check server.js`, `node --check js/app.js`.
- Production checks:
  - `https://shop.sushi-house-39.online/api/health` -> 200 JSON.
  - `https://shop.sushi-house-39.online/api/image?...` -> 200 `image/avif`.
  - `https://shop.sushi-house-39.online/js/app.js?verify=...` contains `/api/image?url=` and `handleProductImageError`.

## Open Risks

- Vercel CLI on local machine has invalid token; manual deploy used SSH/SCP instead.
- Local Windows `curl.exe`/`Invoke-RestMethod` had TLS/SChannel issues; production verification was done via Node REPL fetch.

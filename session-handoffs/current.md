# Session Handoff

**Updated:** 2026-06-05 09:16 +05
**Agent:** Codex
**Workspace:** C:\Users\User\Desktop\Project
**Active project:** C:\Users\User\Desktop\Project\keychain-shop

## What Was Done

- Fixed mobile mini app product images by routing external Unsplash image URLs through same-origin `/api/image`.
- Added frontend SVG fallback for failed image loads in product cards, product details, and cart.
- Changed cart UX so adding a product no longer jumps straight to the cart; users can keep browsing and add multiple items.
- Added a `В корзину` button on product details for manual checkout navigation.
- Committed and pushed changes to `origin/main`.
- Deployed manually to VPS production path `/opt/max-burger-shop` because Vercel CLI token is invalid and production domain is served by PM2/Nginx on `server-main`.

## Current State

- Local git commit: `29f7cce fix(miniapp): proxy product images`.
- Latest cart UX commit: `09e16de fix(cart): keep browsing after add`.
- Production process: PM2 `max-burger-shop`, cwd `/opt/max-burger-shop`, proxy via Nginx `shop.sushi-house-39.online -> 127.0.0.1:3012`.
- Production backup before overwrite: `/opt/max-burger-shop/backups/image-proxy-20260605-040013`.
- Cart UX production backup before overwrite: `/opt/max-burger-shop/backups/cart-browse-20260605-041531`.

## Files Changed

- `server.js` — added safe `/api/image` proxy; only allows `https://images.unsplash.com`, checks `image/*`, caches response.
- `js/app.js` — added `getProductImageSrc`, `getProductFallbackImage`, `handleProductImageError`; updated product/detail/cart image tags.
- `js/app.js` — removed automatic `showCart()` from `addToCart`, added toast/button feedback, added product details `В корзину` button.
- `css/style.css` — added `.detail-actions` layout for product details actions.

## Decisions And Rules

- Do not rely on direct external image loading in mobile mini app webviews.
- Keep original catalog image URLs in `js/config.js`; transform them only at render time.
- No env changes and no payment/order logic changes.

## Next Steps

- User should open the real mini app on a phone and confirm catalog preview and product detail images render.
- User should add several products from product details and confirm the mini app stays on the product screen until `В корзину` is tapped.
- If replacing Unsplash later, prefer local/static product images or a controlled CDN on the app domain.

## Verification

- Local: `npm.cmd test` passed, 4 smoke tests.
- Local syntax: `node --check server.js`, `node --check js\app.js`.
- Server syntax before restart: `node --check server.js`, `node --check js/app.js`.
- Production checks:
  - `https://shop.sushi-house-39.online/api/health` -> 200 JSON.
  - `https://shop.sushi-house-39.online/api/image?...` -> 200 `image/avif`.
  - `https://shop.sushi-house-39.online/js/app.js?verify=...` contains `/api/image?url=` and `handleProductImageError`.
  - `https://shop.sushi-house-39.online/js/app.js` contains `addToCart(productId, quantity = 1, trigger = null)`, `добавлен в заказ`, and `В корзину`.
  - `https://shop.sushi-house-39.online/css/style.css` contains `.detail-actions`.

## Open Risks

- Vercel CLI on local machine has invalid token; manual deploy used SSH/SCP instead.
- Local Windows `curl.exe`/`Invoke-RestMethod` had TLS/SChannel issues; production verification was done via Node REPL fetch.

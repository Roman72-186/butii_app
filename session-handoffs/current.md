# Session Handoff

**Updated:** 2026-06-05 09:56 +05
**Agent:** Codex
**Workspace:** C:\Users\User\Desktop\Project
**Active project:** C:\Users\User\Desktop\Project\keychain-shop

## What Was Done

- Fixed mobile mini app product images by routing external Unsplash image URLs through same-origin `/api/image`.
- Added frontend SVG fallback for failed image loads in product cards, product details, and cart.
- Changed cart UX so adding a product no longer jumps straight to the cart; users can keep browsing and add multiple items.
- Added a `В корзину` button on product details for manual checkout navigation.
- Added `Добавить в корзину` on product preview cards without opening product details.
- Added product detail quantity controls that sync with the cart.
- Changed cart back navigation so returning from the cart opened from product details goes back to the same product details screen.
- Replaced the detail-card flow with a full-screen product photo/description popup opened from the preview image.
- Changed cart add flow to preview-only: `Добавить в корзину` opens quantity controls, `+/-` changes a draft quantity, red check confirms the exact quantity into the cart.
- Removed the old product details section from HTML and removed old detail quantity JS functions.
- Optimized preview quantity controls so `+/-` and confirm update only the current product action block instead of re-rendering the full product grid.
- Committed and pushed changes to `origin/main`.
- Deployed manually to VPS production path `/opt/max-burger-shop` because Vercel CLI token is invalid and production domain is served by PM2/Nginx on `server-main`.

## Current State

- Local git commit: `29f7cce fix(miniapp): proxy product images`.
- Latest cart UX commit: `09e16de fix(cart): keep browsing after add`.
- Latest cart controls commit: `88a847b fix(cart): add preview and detail quantity controls`.
- Latest preview-only cart flow commit: `635d7cf fix(cart): use preview quantity confirmation`.
- Latest in-place preview controls commit: `08b0b41 fix(cart): update preview controls in place`.
- Production process: PM2 `max-burger-shop`, cwd `/opt/max-burger-shop`, proxy via Nginx `shop.sushi-house-39.online -> 127.0.0.1:3012`.
- Production backup before overwrite: `/opt/max-burger-shop/backups/image-proxy-20260605-040013`.
- Cart UX production backup before overwrite: `/opt/max-burger-shop/backups/cart-browse-20260605-041531`.
- Cart controls production backup before overwrite: `/opt/max-burger-shop/backups/cart-controls-20260605-042931`.
- Preview confirmation production backup before overwrite: `/opt/max-burger-shop/backups/preview-confirm-20260605-043906`.
- In-place controls production backup before overwrite: `/opt/max-burger-shop/backups/in-place-preview-controls-20260605-045526`.

## Files Changed

- `server.js` — added safe `/api/image` proxy; only allows `https://images.unsplash.com`, checks `image/*`, caches response.
- `js/app.js` — added `getProductImageSrc`, `getProductFallbackImage`, `handleProductImageError`; updated product/detail/cart image tags.
- `js/app.js` — removed automatic `showCart()` from `addToCart`, added toast/button feedback, added product details `В корзину` button.
- `js/app.js` — added preview-card add button handling, product detail quantity controls, and return-to-product behavior from cart.
- `js/app.js` — added preview quantity draft/confirm flow and full-screen product popup; removed old product detail add controls.
- `js/app.js` — added `renderProductCartActions(productId)` and `data-product-id` so preview controls update in place without full catalog re-render.
- `css/style.css` — added `.detail-actions` layout for product details actions.
- `css/style.css` — added `.product-actions` and `.detail-quantity` styles.
- `css/style.css` — added `.preview-quantity`, `.confirm-add-btn`, and `.product-modal` styles.
- `index.html` — changed cart back button to call `goBackFromCart()`.
- `index.html` — added `productPreviewModal`; removed `productDetailsSection`.

## Decisions And Rules

- Do not rely on direct external image loading in mobile mini app webviews.
- Keep original catalog image URLs in `js/config.js`; transform them only at render time.
- No env changes and no payment/order logic changes.
- User requested a standing workflow: commit, push, and deploy after future code changes in this project unless they explicitly say not to.

## Next Steps

- User should open the real mini app on a phone and confirm catalog preview images and the full-screen preview popup render.
- User should test adding from product preview, choosing quantity with `+/-`, confirming with the red check button, and verifying the cart quantity.
- Current expected UX: product card itself does not open a detail page; tapping the preview image opens a full-screen popup with photo/description; adding to cart is only from the card preview via quantity controls and a red check button.
- Performance expectation: pressing `Добавить в корзину`, `+/-`, or the red check must update only that product's `.product-actions` node; do not call `renderProducts()` for these interactions.
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
  - `https://shop.sushi-house-39.online/css/style.css` contains `.product-actions` and `.detail-quantity`.
  - `https://shop.sushi-house-39.online/` contains `goBackFromCart()`.
  - `https://shop.sushi-house-39.online/js/app.js` contains `productDraftQuantities`, `renderPreviewCartActions`, `confirmProductDraftQuantity`, and `openProductPreview`.
  - `https://shop.sushi-house-39.online/js/app.js` no longer contains `renderProductDetails` or `updateDetailProductQuantity`.
  - `https://shop.sushi-house-39.online/css/style.css` contains `.preview-quantity`, `.confirm-add-btn`, and `.product-modal`.
  - `https://shop.sushi-house-39.online/` contains `productPreviewModal` and no longer contains `productDetailsSection`.
  - `https://shop.sushi-house-39.online/js/app.js` contains `renderProductCartActions` and `getProductActionsNode`.
  - Production handlers `startProductDraftQuantity`, `changeProductDraftQuantity`, and `confirmProductDraftQuantity` use `renderProductCartActions` and do not call `renderProducts`.

## Open Risks

- Vercel CLI on local machine has invalid token; manual deploy used SSH/SCP instead.
- Local Windows `curl.exe`/`Invoke-RestMethod` had TLS/SChannel issues; production verification was done via Node REPL fetch.

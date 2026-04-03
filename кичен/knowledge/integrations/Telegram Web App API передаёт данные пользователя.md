---
tags: [integration, telegram, webApp, api]
date: 2026-04-02
---

# Telegram Web App API передаёт данные пользователя

## Как получить данные пользователя

Когда Mini App открыт внутри Telegram, объект `window.Telegram.WebApp` содержит данные пользователя:

```javascript
const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe?.user;

// user = {
//   id: 123456789,
//   first_name: "Иван",
//   last_name: "Петров",
//   username: "ivanpetrov",
//   language_code: "ru",
//   is_premium: false
// }
```

## Что делает telegram.js

`js/telegram.js` оборачивает SDK в класс `TelegramApp`:

| Метод | Что делает |
|---|---|
| `init()` | Вызывает `tg.ready()`, `tg.expand()`, сохраняет user, применяет тему |
| `getUserId()` | Возвращает `user.id` |
| `getUserName()` | Возвращает `first_name + last_name` |
| `hapticFeedback(type)` | Вибрация: `light`, `medium`, `success`, `error` |
| `showAlert(msg)` | Показывает popup через Telegram UI |
| `createMockTelegram()` | Возвращает mock-объект для режима разработки |

## Сохранение telegram_id

При инициализации ID сохраняется в `localStorage`:

```javascript
// telegram.js:19-22
if (this.user && this.user.id) {
    localStorage.setItem('telegram_id', this.user.id.toString());
}
```

При отправке заказа `app.js::sendOrderToServer()` читает сначала из `localStorage`, затем напрямую из SDK, затем использует mock:

```javascript
let telegramId = localStorage.getItem('telegram_id')
    || window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString()
    || CONFIG.MOCK_USER.id.toString();
```

## Темизация

При инициализации применяются цвета из `tg.themeParams`:

```javascript
root.style.setProperty('--tg-bg-color', tg.themeParams.bg_color);
root.style.setProperty('--tg-text-color', tg.themeParams.text_color);
root.style.setProperty('--tg-button-color', tg.themeParams.button_color);
```

`document.body.setAttribute('data-theme', 'dark' | 'light')` — CSS реагирует на этот атрибут.

## Режим разработки (вне Telegram)

Если `CONFIG.DEV_MODE = true` или SDK недоступен, `createMockTelegram()` подставляет заглушку. Mock-пользователь берётся из `CONFIG.MOCK_USER`.

Подробнее: [[mock объект для разработки вне Telegram]]

## Отладка в консоли

```javascript
console.log(telegramApp.getUserId());  // ID пользователя
console.log(telegramApp.getUser());    // Полный объект user
console.log(localStorage.getItem('telegram_id'));  // Сохранённый ID
```

## Связанные заметки

- [[нет базы данных — состояние хранится в памяти и LEADTEX]]
- [[mock объект для разработки вне Telegram]]
- [[telegram_id не определяется в приложении]]

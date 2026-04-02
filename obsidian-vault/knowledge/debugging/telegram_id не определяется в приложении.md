---
tags: [debugging, telegram, telegram_id]
date: 2026-04-02
---

# telegram_id не определяется в приложении

## Симптомы

- В консоли: `⚠️ Telegram Web App API недоступен`
- `telegramApp.getUserId()` возвращает `123456789` (mock-значение)
- Заказы уходят в LEADTEX с mock ID вместо реального

## Порядок разрешения telegram_id в app.js

`sendOrderToServer()` использует три источника по приоритету (строки 486–496):

```javascript
// 1. localStorage (сохранён при инициализации telegram.js)
let telegramId = localStorage.getItem('telegram_id');

// 2. Прямое чтение из Telegram SDK
if (!telegramId && window.Telegram?.WebApp?.initDataUnsafe?.user) {
    telegramId = window.Telegram.WebApp.initDataUnsafe.user.id.toString();
    localStorage.setItem('telegram_id', telegramId);
}

// 3. Fallback на mock (если всё выше не сработало)
if (!telegramId) {
    telegramId = CONFIG.MOCK_USER.id.toString(); // "123456789"
}
```

## Причины, почему ID не определяется

### Приложение открыто в обычном браузере

`window.Telegram` не существует вне Telegram. Это нормально для разработки.

**Решение**: Установи `DEV_MODE: true` в `js/config.js`. Mock-пользователь будет использоваться явно, не как fallback.

### Приложение открыто через Telegram, но пользователь — новый

Иногда `initDataUnsafe` недоступен при первом открытии.

**Проверка**: Попроси пользователя закрыть и снова открыть Mini App.

### localStorage заблокирован

В некоторых браузерных окружениях `localStorage` может быть недоступен.

**Проверка**:
```javascript
try { localStorage.getItem('test'); } catch(e) { console.error('localStorage недоступен', e); }
```

## Как проверить текущий статус

```javascript
// Показывает, откуда пришёл ID
console.log('localStorage:', localStorage.getItem('telegram_id'));
console.log('SDK direct:', window.Telegram?.WebApp?.initDataUnsafe?.user?.id);
console.log('telegramApp:', telegramApp.getUserId());
console.log('getUser:', telegramApp.getUser());
```

## Правильный способ тестирования

1. Включи `DEV_MODE: true` в `js/config.js`
2. Запусти `npm run dev`
3. Открой `http://localhost:3000`
4. Mock-пользователь с ID `123456789` используется явно
5. Перед деплоем верни `DEV_MODE: false`

## Связанные заметки

- [[Telegram Web App API передаёт данные пользователя]]
- [[mock объект для разработки вне Telegram]]
- [[заказ не отправляется в LEADTEX]]

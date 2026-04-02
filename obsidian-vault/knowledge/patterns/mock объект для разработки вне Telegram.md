---
tags: [pattern, dev, mock, testing]
date: 2026-04-02
---

# Mock объект для разработки вне Telegram

## Проблема

`window.Telegram.WebApp` существует только внутри Telegram WebView. При открытии в обычном браузере SDK недоступен, и все методы `telegramApp.*` падают.

## Решение

`telegram.js` при инициализации проверяет наличие SDK:

```javascript
// telegram.js:13-43
init() {
    if (this.tg) {
        // Реальный Telegram — используем SDK
        this.tg.ready();
        this.user = this.tg.initDataUnsafe?.user;
        this.setupTheme();
        this.setupButtons();
    } else if (CONFIG.DEV_MODE) {
        // DEV_MODE = true — явный режим разработки
        this.user = CONFIG.MOCK_USER;
        this.tg = this.createMockTelegram();
    } else {
        // SDK недоступен, но DEV_MODE не включён — тоже используем mock
        console.warn('⚠️ Telegram Web App API недоступен');
        this.user = CONFIG.MOCK_USER;
        this.tg = this.createMockTelegram();
    }
}
```

## Mock-объект

`createMockTelegram()` возвращает объект, который логирует вызовы вместо реальных действий:

```javascript
{
    ready: () => console.log('Mock: ready'),
    expand: () => console.log('Mock: expand'),
    showAlert: (msg) => alert(msg),         // нативный alert браузера
    showConfirm: (msg, cb) => cb(confirm(msg)),
    MainButton: {
        setText, show, hide, onClick, offClick  // всё в console.log
    },
    HapticFeedback: {
        impactOccurred, notificationOccurred    // всё в console.log
    }
}
```

## Пользователь в режиме разработки

Из `CONFIG.MOCK_USER`:
```javascript
{
    id: 123456789,
    first_name: 'Тест',
    last_name: 'Пользователь',
    username: 'testuser',
    language_code: 'ru'
}
```

## Включение DEV_MODE

В `js/config.js`:
```javascript
DEV_MODE: true,   // было false
```

Не забудь вернуть `false` перед деплоем.

## Тесты и mock

В `tests/` Jest тоже не имеет доступа к `window.Telegram`. Тесты используют jsdom и напрямую устанавливают моки через `jest.fn()` или `global.CONFIG = ...`.

## Связанные заметки

- [[Telegram Web App API передаёт данные пользователя]]
- [[telegram_id не определяется в приложении]]
- [[конфигурация-ориентированное проектирование]]

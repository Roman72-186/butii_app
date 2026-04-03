---
tags: [decision, cart, state, storage]
date: 2026-04-02
---

# Корзина хранится в памяти, а не в localStorage

## Как устроено сейчас

В `js/app.js` корзина — это простой массив в памяти:

```javascript
let cart = [];  // app.js:3
```

Операции над ней: `addToCart()`, `removeFromCart()`, `updateCartItemQuantity()`. При закрытии вкладки корзина теряется.

`localStorage` используется **только** для `telegram_id`:
```javascript
localStorage.setItem('telegram_id', this.user.id.toString()); // telegram.js:21
```

## Почему так

Вероятно, это упрощение при первоначальной разработке — проще хранить объекты с полной информацией о продукте (`item.product.price`, `item.product.name`) в памяти, чем сериализовать/десериализовать из localStorage.

## Следствия

- Добавил товары, закрыл Telegram — корзина пуста
- Нет синхронизации между устройствами
- Нет «брошенной корзины» для ремаркетинга

## Как это изменить (если потребуется)

Добавить в `addToCart()` и `removeFromCart()`:
```javascript
localStorage.setItem('cart', JSON.stringify(cart));
```

И в `init()` восстанавливать:
```javascript
const saved = localStorage.getItem('cart');
if (saved) cart = JSON.parse(saved);
```

## Связанные заметки

- [[нет базы данных — состояние хранится в памяти и LEADTEX]]
- [[SPA навигация скрытием секций]]

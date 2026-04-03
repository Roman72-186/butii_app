---
tags: [pattern, spa, navigation, frontend]
date: 2026-04-02
---

# SPA навигация скрытием секций

## Паттерн

Вместо роутинга с изменением URL или загрузки отдельных страниц, приложение показывает одну из 6 секций в `index.html`, скрывая остальные.

```javascript
// app.js:56-73
function showSection(sectionId) {
    const sections = document.querySelectorAll('section');
    sections.forEach(s => s.style.display = 'none');

    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
        section.scrollTop = 0;
        window.scrollTo(0, 0);
    }

    telegramApp.hapticFeedback('light'); // тактильный отклик
}
```

## Шесть экранов

| ID секции | Функция активации | Что показывает |
|---|---|---|
| `productsSection` | `showProducts()` | Каталог с категориями |
| `productDetailsSection` | `showProduct(id)` | Детали одного товара |
| `cartSection` | `showCart()` | Корзина |
| `checkoutSection` | `showCheckout()` | Форма оформления заказа |
| `successSection` | `showSuccess(order)` | Подтверждение заказа |
| `myOrdersSection` | `showMyOrders()` | История заказов (заглушка) |

## Почему этот паттерн

- Нет роутера, нет зависимостей
- Telegram Mini App — всегда fullscreen, URL пользователь не видит
- Быстрое переключение без перезагрузки
- Подходит для линейного flow: каталог → товар → корзина → заказ → успех

## Сброс состояния

`resetApp()` возвращает в начало:
```javascript
function resetApp() {
    currentProduct = null;
    currentCategory = 'all';
    renderCategories();
    renderProducts();
    showProducts();
}
```

Вызывается с экрана успешного заказа — «Продолжить покупки».

## Связанные заметки

- [[конфигурация-ориентированное проектирование]]
- [[стек технологий — vanilla JS Vercel Telegram]]

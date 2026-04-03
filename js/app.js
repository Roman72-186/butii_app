// ===================================
// KEYCHAIN SHOP - ГЛАВНОЕ ПРИЛОЖЕНИЕ
// ===================================

// Состояние приложения
let currentCategory = 'all';
let cart = [];
let currentProduct = null;

// ===================================
// ИНИЦИАЛИЗАЦИЯ
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    // Инициализация Telegram
    if (typeof telegramApp !== 'undefined') {
        telegramApp.init();
    }

    // Настройка хедера
    setupHeader();

    // Рендер начальной страницы
    renderCategories();
    renderProducts();

    // Обновить бейдж корзины
    updateCartBadge();

    // Инициализация маски телефона
    initPhoneMask();

    // Скрыть лоадер и показать приложение
    setTimeout(() => {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('app').style.display = 'block';
    }, 500);
}

function setupHeader() {
    const shopLogo = document.getElementById('shopLogo');
    const shopName = document.getElementById('shopName');

    if (shopLogo) shopLogo.textContent = CONFIG.SHOP.logo;
    if (shopName) shopName.textContent = CONFIG.SHOP.name;
}

// ===================================
// НАВИГАЦИЯ
// ===================================

function showSection(sectionId) {
    // Скрыть все секции
    const sections = document.querySelectorAll('section');
    sections.forEach(s => s.style.display = 'none');

    // Показать нужную
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
        section.scrollTop = 0;
        window.scrollTo(0, 0);
    }

    // Haptic feedback
    if (typeof telegramApp !== 'undefined') {
        telegramApp.hapticFeedback('light');
    }
}

function showProducts() {
    showSection('productsSection');
    currentProduct = null;
}

function showProduct(productId) {
    const product = CONFIG.getProductById(productId);
    if (!product) return;

    currentProduct = product;
    renderProductDetails(product);
    showSection('productDetailsSection');
}

function showCart() {
    renderCart();
    showSection('cartSection');
}

function showCheckout() {
    renderCheckout();
    showSection('checkoutSection');
}

function showSuccess(order) {
    renderSuccessDetails(order);
    showSection('successSection');
}

function showMyOrders() {
    renderMyOrders();
    showSection('myOrdersSection');
}

function resetApp() {
    currentProduct = null;
    currentCategory = 'all';
    renderCategories();
    renderProducts();
    showProducts();
}

// ===================================
// РЕНДЕРИНГ КАТЕГОРИЙ
// ===================================

function renderCategories() {
    const container = document.getElementById('categories');
    if (!container) return;

    container.innerHTML = CONFIG.CATEGORIES.map(cat => `
        <button class="category-btn ${cat.id === currentCategory ? 'active' : ''}"
                onclick="selectCategory('${cat.id}')">
            <span class="category-icon">${cat.icon}</span>
            <span>${cat.name}</span>
        </button>
    `).join('');
}

function selectCategory(categoryId) {
    currentCategory = categoryId;
    renderCategories();
    renderProducts();

    if (typeof telegramApp !== 'undefined') {
        telegramApp.hapticFeedback('light');
    }
}

// ===================================
// РЕНДЕРИНГ ПРОДУКТОВ
// ===================================

function renderProducts() {
    const container = document.getElementById('productsGrid');
    if (!container) return;

    const products = CONFIG.getProductsByCategory(currentCategory);

    container.innerHTML = products.map(product => `
        <div class="product-card" onclick="showProduct('${product.id}')">
            <div class="product-card-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
            </div>
            <div class="product-card-body">
                <div class="product-card-name">${product.name}</div>
                <div class="product-card-price">${CONFIG.formatPrice(product.price)}</div>
                <div class="product-card-rating">${CONFIG.formatRating(product.rating)}</div>
            </div>
        </div>
    `).join('');
}

// ===================================
// РЕНДЕРИНГ ДЕТАЛЕЙ ПРОДУКТА
// ===================================

function renderProductDetails(product) {
    const container = document.getElementById('productDetails');
    if (!container || !product) return;

    container.innerHTML = `
        <div class="product-detail-image">
            <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="product-detail-info">
            <h2>${product.name}</h2>
            <div class="product-detail-price">${CONFIG.formatPrice(product.price)}</div>
            <div class="product-detail-rating">${CONFIG.formatRating(product.rating)}</div>
            <p class="product-detail-description">${product.description}</p>
            
            <div class="product-detail-actions">
                <button class="btn-primary" onclick="addToCart('${product.id}', 1)">
                    <span>Добавить в корзину</span>
                    <span class="btn-price">${CONFIG.formatPrice(product.price)}</span>
                </button>
            </div>
        </div>
    `;
}

// ===================================
// РАБОТА С КОРЗИНОЙ
// ===================================

function addToCart(productId, quantity = 1) {
    const product = CONFIG.getProductById(productId);
    if (!product) return;

    // Проверить, есть ли уже такой продукт в корзине
    const existingItem = cart.find(item => item.product.id === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            product: product,
            quantity: quantity
        });
    }

    updateCartBadge();
    
    if (typeof telegramApp !== 'undefined') {
        telegramApp.hapticFeedback('success');
        telegramApp.showAlert(`Товар добавлен в корзину!`);
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.product.id !== productId);
    updateCartBadge();
    renderCart();
}

function updateCartItemQuantity(productId, quantity) {
    if (quantity <= 0) {
        removeFromCart(productId);
        return;
    }

    const item = cart.find(item => item.product.id === productId);
    if (item) {
        item.quantity = quantity;
        updateCartBadge();
        renderCart();
    }
}

function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

function getCartTotal() {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
}

function getCartItemCount() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
}

// ===================================
// РЕНДЕРИНГ КОРЗИНЫ
// ===================================

function renderCart() {
    const container = document.getElementById('cartItems');
    const totalElement = document.getElementById('cartTotal');
    
    if (!container || !totalElement) return;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <h3>Корзина пуста</h3>
                <p>Добавьте товары в корзину, чтобы оформить заказ</p>
                <button class="btn-secondary" onclick="showProducts()">Выбрать товары</button>
            </div>
        `;
        totalElement.textContent = CONFIG.formatPrice(0);
        document.getElementById('checkoutBtn').style.display = 'none';
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.product.image}" alt="${item.product.name}" class="cart-item-image">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.product.name}</div>
                <div class="cart-item-price">${CONFIG.formatPrice(item.product.price)}</div>
            </div>
            <div class="cart-item-controls">
                <button class="quantity-btn" onclick="updateCartItemQuantity('${item.product.id}', ${item.quantity - 1})">-</button>
                <span class="quantity">${item.quantity}</span>
                <button class="quantity-btn" onclick="updateCartItemQuantity('${item.product.id}', ${item.quantity + 1})">+</button>
            </div>
            <div class="cart-item-total">${CONFIG.formatPrice(item.product.price * item.quantity)}</div>
            <button class="remove-item-btn" onclick="removeFromCart('${item.product.id}')">✕</button>
        </div>
    `).join('');

    totalElement.textContent = CONFIG.formatPrice(getCartTotal());
    document.getElementById('checkoutBtn').style.display = 'block';
}

// ===================================
// РЕНДЕРИНГ ОФОРМЛЕНИЯ ЗАКАЗА
// ===================================

function renderCheckout() {
    const container = document.getElementById('checkoutForm');
    if (!container) return;

    container.innerHTML = `
        <div class="checkout-summary">
            <h3>Состав заказа</h3>
            <div class="checkout-items">
                ${cart.map(item => `
                    <div class="checkout-item">
                        <span class="checkout-item-name">${item.product.name}</span>
                        <span class="checkout-item-qty">×${item.quantity}</span>
                        <span class="checkout-item-price">${CONFIG.formatPrice(item.product.price * item.quantity)}</span>
                    </div>
                `).join('')}
            </div>
            <div class="checkout-total">
                <span>Итого:</span>
                <span id="checkoutTotal">${CONFIG.formatPrice(getCartTotal())}</span>
            </div>
        </div>

        <form id="orderForm" onsubmit="submitOrder(event)">
            <div class="form-section">
                <h3>Контактные данные</h3>

                <div class="form-group">
                    <label for="customerName">Имя *</label>
                    <input type="text" id="customerName" required placeholder="Введите ваше имя">
                </div>

                <div class="form-group">
                    <label for="customerPhone">Телефон *</label>
                    <input type="tel" id="customerPhone" required placeholder="+7 (___) ___-__-__">
                </div>

                <div class="form-group">
                    <label for="customerEmail">Email (необязательно)</label>
                    <input type="email" id="customerEmail" placeholder="your@email.com">
                </div>
            </div>

            <div class="form-section">
                <h3>Доставка</h3>

                <div class="form-group">
                    <label for="deliveryCity">Город *</label>
                    <input type="text" id="deliveryCity" required placeholder="Введите город">
                </div>

                <div class="form-group">
                    <label for="deliveryAddress">Адрес *</label>
                    <textarea id="deliveryAddress" rows="2" required placeholder="Улица, дом, квартира"></textarea>
                </div>
            </div>

            <div class="form-section">
                <h3>Комментарий к заказу</h3>
                <div class="form-group">
                    <textarea id="orderComment" rows="3" placeholder="Ваши пожелания"></textarea>
                </div>
            </div>

            <button type="submit" class="btn-primary" id="placeOrderBtn">
                <span>Оформить заказ</span>
                <span id="orderTotal">${CONFIG.formatPrice(getCartTotal())}</span>
            </button>
        </form>
    `;

    // Заполнить имя из Telegram если есть
    if (typeof telegramApp !== 'undefined') {
        const user = telegramApp.getUser();
        if (user && user.first_name) {
            const nameInput = document.getElementById('customerName');
            if (nameInput && !nameInput.value) {
                nameInput.value = user.first_name + (user.last_name ? ' ' + user.last_name : '');
            }
        }
    }
}

// ===================================
// ОФОРМЛЕНИЕ ЗАКАЗА
// ===================================

async function submitOrder(event) {
    event.preventDefault();

    const nameInput = document.getElementById('customerName');
    const phoneInput = document.getElementById('customerPhone');
    const emailInput = document.getElementById('customerEmail');
    const cityInput = document.getElementById('deliveryCity');
    const addressInput = document.getElementById('deliveryAddress');
    const commentInput = document.getElementById('orderComment');

    // Валидация
    if (!nameInput.value.trim()) {
        alert('Пожалуйста, введите имя');
        nameInput.focus();
        return;
    }

    if (!phoneInput.value.trim() || phoneInput.value.replace(/\D/g, '').length < 11) {
        alert('Пожалуйста, введите корректный номер телефона');
        phoneInput.focus();
        return;
    }

    if (!cityInput.value.trim()) {
        alert('Пожалуйста, введите город доставки');
        cityInput.focus();
        return;
    }

    if (!addressInput.value.trim()) {
        alert('Пожалуйста, введите адрес доставки');
        addressInput.focus();
        return;
    }

    // Подготовка данных заказа
    const order = {
        id: 'ORDER-' + Date.now(),
        items: cart.map(item => ({
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            total: item.product.price * item.quantity
        })),
        total: getCartTotal(),
        customer: {
            name: nameInput.value.trim(),
            phone: phoneInput.value.trim(),
            email: emailInput.value.trim()
        },
        delivery: {
            city: cityInput.value.trim(),
            address: addressInput.value.trim()
        },
        comment: commentInput.value.trim(),
        timestamp: new Date().toISOString()
    };

    // Отправить на сервер (webhook)
    try {
        await sendOrderToServer(order);
        
        // Очистить корзину
        cart = [];
        updateCartBadge();
        
        // Haptic feedback
        if (typeof telegramApp !== 'undefined') {
            telegramApp.hapticFeedback('success');
        }

        // Показать успех
        showSuccess(order);

        // Сбросить форму
        document.getElementById('orderForm').reset();
    } catch (e) {
        console.error('Failed to send order to server:', e);
        alert('Ошибка при отправке заказа. Попробуйте ещё раз.');
    }
}

function normalizePhone(phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return '+7' + digits;
    if (digits.length === 11 && digits.startsWith('8')) return '+7' + digits.slice(1);
    return '+' + digits;
}

async function sendOrderToServer(order) {
    // Надежное получение telegramId с fallback на localStorage и моковые данные
    let telegramId = localStorage.getItem('telegram_id');

    if (!telegramId && window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
        telegramId = window.Telegram.WebApp.initDataUnsafe.user.id.toString();
        localStorage.setItem('telegram_id', telegramId);
    }

    if (!telegramId) {
        console.warn('Telegram ID не найден. Используется моковый пользователь.');
        telegramId = CONFIG.MOCK_USER.id.toString(); // Используем мок, если ID все еще нет
    }

    console.log('📤 Отправка заказа в LEADTEX');
    console.log('🆔 Telegram ID (из localStorage):', localStorage.getItem('telegram_id'));
    console.log('🆔 Telegram ID (из Telegram WebApp):', window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString());
    console.log('🆔 Используемый Telegram ID:', telegramId);

    // Подготовка данных для LEADTEX в соответствии с документацией
    const leadtexPayload = {
        contact_by: 'phone',
        search: normalizePhone(order.customer.phone),
        variables: {
            order_id: order.id,
            order_total: order.total.toString(),
            order_subtotal: order.total.toString(),
            order_delivery: "300", // пример стоимости доставки
            order_items_count: order.items.length.toString(),
            order_timestamp: order.timestamp,

            order_items: JSON.stringify(order.items),

            customer_name: order.customer.name,
            customer_phone: order.customer.phone,
            customer_email: order.customer.email,

            delivery_city: order.delivery.city,
            delivery_address: order.delivery.address,

            order_comment: order.comment,

            source: "mini_app_keychain_max",
            telegram_id: telegramId,
            telegram_user_name: typeof telegramApp !== 'undefined' ? telegramApp.getUserName() : 'debug_user'
        }
    };

    console.log('📦 Payload для отправки:', leadtexPayload);

    // Добавляем логирование URL и заголовков
    console.log('📡 Отправка запроса на URL:', CONFIG.WEBHOOK_URL);
    console.log('🏷️ Заголовки запроса:', {
        'Content-Type': 'application/json'
    });

    const response = await fetch(CONFIG.WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(leadtexPayload)
    }).catch(error => {
        console.error('📡 Fetch Error:', error);
        throw error; // Перебрасываем ошибку для дальнейшей обработки
    });

    // Логирование результата отправки
    if (response.ok) {
        console.log('✅ Заказ успешно отправлен в LEADTEX:', leadtexPayload);
    } else {
        console.error('❌ Ошибка отправки в LEADTEX:', response.status, await response.text());
    }

    return response.json();
}

// ===================================
// РЕНДЕРИНГ УСПЕШНОГО ЗАКАЗА
// ===================================

function renderSuccessDetails(order) {
    const container = document.getElementById('successDetails');
    if (!container || !order) return;

    container.innerHTML = `
        <div class="success-order-id">Заказ №${order.id}</div>
        <div class="success-order-items">
            <h3>Состав заказа</h3>
            ${order.items.map(item => `
                <div class="success-order-item">
                    <span class="item-name">${item.name}</span>
                    <span class="item-qty">×${item.quantity}</span>
                    <span class="item-price">${CONFIG.formatPrice(item.total)}</span>
                </div>
            `).join('')}
        </div>
        <div class="success-order-total">
            <span>Итого:</span>
            <span>${CONFIG.formatPrice(order.total)}</span>
        </div>
        <div class="success-delivery-info">
            <h3>Доставка</h3>
            <p><strong>Город:</strong> ${order.delivery.city}</p>
            <p><strong>Адрес:</strong> ${order.delivery.address}</p>
        </div>
    `;
}

// ===================================
// МОИ ЗАКАЗЫ
// ===================================

function renderMyOrders() {
    // В реальном приложении здесь будет загрузка заказов из localStorage или API
    const container = document.getElementById('ordersList');
    if (!container) return;

    // Для демонстрации покажем заглушку
    container.innerHTML = `
        <div class="empty-orders">
            <div class="empty-orders-icon">📦</div>
            <h3>Заказов пока нет</h3>
            <p>После оформления заказа он появится здесь</p>
            <button class="btn-secondary" onclick="showProducts()">Сделать заказ</button>
        </div>
    `;
}

// ===================================
// МАСКА ТЕЛЕФОНА
// ===================================

function initPhoneMask() {
    const phoneInput = document.getElementById('customerPhone');
    if (!phoneInput) return;

    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');

        if (value.length > 0) {
            if (value[0] === '8') {
                value = '7' + value.slice(1);
            }
            if (value[0] !== '7') {
                value = '7' + value;
            }
        }

        let formatted = '';
        if (value.length > 0) {
            formatted = '+7';
        }
        if (value.length > 1) {
            formatted += ' (' + value.slice(1, 4);
        }
        if (value.length > 4) {
            formatted += ') ' + value.slice(4, 7);
        }
        if (value.length > 7) {
            formatted += '-' + value.slice(7, 9);
        }
        if (value.length > 9) {
            formatted += '-' + value.slice(9, 11);
        }

        e.target.value = formatted;
    });

    phoneInput.addEventListener('keydown', (e) => {
        // Разрешить: backspace, delete, tab, escape, enter
        if ([46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
            // Разрешить: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
            (e.keyCode === 65 && e.ctrlKey === true) ||
            (e.keyCode === 67 && e.ctrlKey === true) ||
            (e.keyCode === 86 && e.ctrlKey === true) ||
            (e.keyCode === 88 && e.ctrlKey === true) ||
            // Разрешить: home, end, left, right
            (e.keyCode >= 35 && e.keyCode <= 39)) {
            return;
        }
        // Запретить не цифры
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    });
}
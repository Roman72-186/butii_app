// ===================================
// MAX BURGER SHOP APP
// ===================================

let currentCategory = 'all';
let cart = [];
let productDraftQuantities = {};
let authToken = localStorage.getItem('max_burger_token') || null;
let currentOrder = null;
let fulfillmentMethod = 'delivery';

document.addEventListener('DOMContentLoaded', () => {
    init();
});

async function init() {
    setupHeader();
    renderCategories();
    renderProducts();
    updateCartBadge();
    renderReturnedPayment();

    try {
        await authenticateMaxUser();
    } catch (error) {
        console.warn('MAX auth fallback:', error);
    }

    setTimeout(() => {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('app').style.display = 'block';
    }, 350);
}

function setupHeader() {
    document.getElementById('shopName').textContent = CONFIG.SHOP.name;
    const heroUser = document.getElementById('heroUser');
    if (heroUser) heroUser.textContent = maxApp.getUserName();
}

async function authenticateMaxUser() {
    const user = maxApp.getUser();
    const response = await fetch(CONFIG.API.auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: maxApp.getUserId(),
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            username: user.username || '',
            start_param: maxApp.startParam || '',
        }),
    });

    const data = await response.json();
    if (!data.ok) throw new Error(data.error || 'AUTH_FAILED');

    authToken = data.token;
    localStorage.setItem('max_burger_token', authToken);
}

function apiHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
    };
}

function showSection(sectionId) {
    document.querySelectorAll('main > section').forEach((section) => {
        section.style.display = 'none';
    });
    const target = document.getElementById(sectionId);
    if (target) target.style.display = 'block';
    window.scrollTo(0, 0);
    maxApp.hapticFeedback('light');
}

function showProducts() {
    showSection('productsSection');
}

function showCapabilities() {
    document.getElementById('capabilities')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function scrollToCatalog() {
    document.getElementById('catalogBlock')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showProduct(productId) {
    openProductPreview(productId);
}

function showCart() {
    renderCart();
    showSection('cartSection');
}

function showCheckout() {
    showCart();
}

function goBackFromCart() {
    showProducts();
}

function showPayment(order, paymentPayload) {
    currentOrder = order;
    renderPayment(order, paymentPayload);
    showSection('paymentSection');
}

function showSuccess(order, payment = null) {
    currentOrder = order;
    renderSuccessDetails(order, payment);
    showSection('successSection');
}

function shareApp() {
    maxApp.hapticFeedback('light');
    maxApp.shareApp(currentOrder?.order_number || '');
}

async function showMyOrders() {
    const container = document.getElementById('ordersList');
    container.innerHTML = '<div class="loading-card">Подгружаю историю заказов...</div>';
    showSection('myOrdersSection');

    try {
        const response = await fetch(CONFIG.API.myOrders, { headers: apiHeaders() });
        const data = await response.json();
        if (!data.ok) throw new Error(data.error);
        renderMyOrders(data.orders || []);
    } catch (error) {
        container.innerHTML = `<div class="empty-card"><h3>Историю пока не удалось открыть</h3><p>${escapeHtml(error.message || 'Проверь соединение и попробуй ещё раз.')}</p></div>`;
    }
}

function resetApp() {
    currentOrder = null;
    currentCategory = 'all';
    cart = [];
    fulfillmentMethod = 'delivery';
    renderCategories();
    renderProducts();
    updateCartBadge();
    showProducts();
}

function renderCategories() {
    const container = document.getElementById('categories');
    container.innerHTML = CONFIG.CATEGORIES.map((category) => `
        <button class="category-btn ${category.id === currentCategory ? 'active' : ''}" onclick="selectCategory('${category.id}')">
            <span>${category.icon}</span>
            <strong>${category.name}</strong>
        </button>
    `).join('');
}

function selectCategory(categoryId) {
    currentCategory = categoryId;
    renderCategories();
    renderProducts();
    maxApp.hapticFeedback('light');
}

function getCategoryName(categoryId) {
    return CONFIG.CATEGORIES.find((category) => category.id === categoryId)?.name || categoryId;
}

function getProductImageSrc(product) {
    if (!product?.image) return getProductFallbackImage(product);

    try {
        const imageUrl = new URL(product.image, window.location.origin);
        if (imageUrl.origin === window.location.origin) return imageUrl.href;
        return `/api/image?url=${encodeURIComponent(imageUrl.href)}`;
    } catch (error) {
        return getProductFallbackImage(product);
    }
}

function getProductFallbackImage(product) {
    const accentColors = {
        yellow: '#ffd400',
        red: '#ff3b30',
        orange: '#ff8a00',
        green: '#26c281',
        black: '#080808',
    };
    const accent = accentColors[product?.accent] || accentColors.yellow;
    const name = escapeHtml(product?.name || CONFIG.SHOP.name);
    const badge = escapeHtml(product?.badge || 'MAX');
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 620">
            <rect width="900" height="620" fill="#080808"/>
            <circle cx="710" cy="105" r="180" fill="${accent}" opacity="0.92"/>
            <circle cx="140" cy="520" r="220" fill="#ffffff" opacity="0.12"/>
            <rect x="96" y="118" width="708" height="384" rx="44" fill="#ffffff"/>
            <rect x="146" y="168" width="608" height="148" rx="74" fill="${accent}"/>
            <rect x="190" y="350" width="520" height="72" rx="36" fill="#080808"/>
            <text x="450" y="258" fill="#080808" font-family="Arial, sans-serif" font-size="54" font-weight="800" text-anchor="middle">${badge}</text>
            <text x="450" y="454" fill="#ffffff" font-family="Arial, sans-serif" font-size="38" font-weight="800" text-anchor="middle">${name}</text>
        </svg>
    `.trim();
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function handleProductImageError(image, productId) {
    const product = CONFIG.getProductById(productId);
    image.onerror = null;
    image.src = getProductFallbackImage(product);
}

function renderProducts() {
    const container = document.getElementById('productsGrid');
    const products = CONFIG.getProductsByCategory(currentCategory);

    container.innerHTML = products.map((product) => `
        <article class="product-card accent-${product.accent}">
            <button type="button" class="product-photo product-photo-button" onclick="openProductPreview('${product.id}')" aria-label="Открыть фото и описание ${escapeHtml(product.name)}">
                <img src="${escapeHtml(getProductImageSrc(product))}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="handleProductImageError(this, '${escapeHtml(product.id)}')">
                <span class="product-badge">${escapeHtml(product.badge)}</span>
                <strong class="product-price">${CONFIG.formatPrice(product.price)}</strong>
            </button>
            <div class="product-body">
                <p class="product-meta">${product.emoji} ${escapeHtml(getCategoryName(product.category))} · ${CONFIG.formatRating(product.rating)}</p>
                <h3>${escapeHtml(product.name)}</h3>
                <p>${escapeHtml(product.description)}</p>
                <div class="product-bullets">
                    ${product.bullets.map((bullet) => `<span>${escapeHtml(bullet)}</span>`).join('')}
                </div>
                <div class="product-actions" data-product-id="${escapeHtml(product.id)}">
                    ${renderPreviewCartActions(product)}
                </div>
            </div>
        </article>
    `).join('');
}

function getProductActionsNode(productId) {
    return Array.from(document.querySelectorAll('.product-actions'))
        .find((node) => node.dataset.productId === productId) || null;
}

function renderProductCartActions(productId) {
    const product = CONFIG.getProductById(productId);
    const actions = getProductActionsNode(productId);
    if (!product || !actions) return;

    actions.innerHTML = renderPreviewCartActions(product);
}

function renderPreviewCartActions(product) {
    const draftQuantity = productDraftQuantities[product.id] || 0;

    if (draftQuantity > 0) {
        return `
            <div class="preview-quantity">
                <span>Количество</span>
                <div class="qty-control">
                    <button type="button" aria-label="Уменьшить" onclick="changeProductDraftQuantity('${product.id}', ${draftQuantity - 1})">-</button>
                    <strong>${draftQuantity}</strong>
                    <button type="button" aria-label="Увеличить" onclick="changeProductDraftQuantity('${product.id}', ${draftQuantity + 1})">+</button>
                </div>
                <button type="button" class="confirm-add-btn" aria-label="Подтвердить" onclick="confirmProductDraftQuantity('${product.id}')">✓</button>
            </div>
        `;
    }

    return `
        <button class="action-primary full" onclick="startProductDraftQuantity('${product.id}')">Добавить в корзину</button>
    `;
}

function startProductDraftQuantity(productId) {
    productDraftQuantities = { ...productDraftQuantities, [productId]: getCartQuantity(productId) || 1 };
    renderProductCartActions(productId);
    maxApp.hapticFeedback('light');
}

function changeProductDraftQuantity(productId, quantity) {
    if (quantity <= 0) {
        const nextDrafts = { ...productDraftQuantities };
        delete nextDrafts[productId];
        productDraftQuantities = nextDrafts;
    } else {
        productDraftQuantities = { ...productDraftQuantities, [productId]: quantity };
    }

    renderProductCartActions(productId);
    maxApp.hapticFeedback('light');
}

function confirmProductDraftQuantity(productId) {
    const quantity = productDraftQuantities[productId] || 1;
    const product = CONFIG.getProductById(productId);
    if (!product) return;

    setCartItemQuantity(productId, quantity, false);
    const nextDrafts = { ...productDraftQuantities };
    delete nextDrafts[productId];
    productDraftQuantities = nextDrafts;

    renderProductCartActions(productId);
    maxApp.hapticFeedback('success');
    alertInline(`${product.name}: ${quantity} шт. в корзине`);
}

function openProductPreview(productId) {
    const product = CONFIG.getProductById(productId);
    const modal = document.getElementById('productPreviewModal');
    if (!product || !modal) return;

    document.getElementById('productPreviewImage').src = getProductImageSrc(product);
    document.getElementById('productPreviewImage').alt = product.name;
    document.getElementById('productPreviewBadge').textContent = product.badge;
    document.getElementById('productPreviewMeta').textContent = `${product.emoji} ${getCategoryName(product.category)} · ${CONFIG.formatRating(product.rating)}`;
    document.getElementById('productPreviewTitle').textContent = product.name;
    document.getElementById('productPreviewDescription').textContent = product.description;
    document.getElementById('productPreviewBullets').innerHTML = product.bullets
        .map((bullet) => `<span>${escapeHtml(bullet)}</span>`)
        .join('');
    document.getElementById('productPreviewPrice').textContent = CONFIG.formatPrice(product.price);

    modal.hidden = false;
    document.body.classList.add('modal-open');
    maxApp.hapticFeedback('light');
}

function closeProductPreview() {
    const modal = document.getElementById('productPreviewModal');
    if (!modal) return;

    modal.hidden = true;
    document.body.classList.remove('modal-open');
}

function closeProductPreviewOnBackdrop(event) {
    if (event.target === event.currentTarget) closeProductPreview();
}

function getCartItem(productId) {
    return cart.find((item) => item.product.id === productId) || null;
}

function getCartQuantity(productId) {
    return getCartItem(productId)?.quantity || 0;
}

function addToCart(productId, quantity = 1, trigger = null) {
    const product = CONFIG.getProductById(productId);
    if (!product) return;

    const existingItem = cart.find((item) => item.product.id === productId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ product, quantity });
    }

    updateCartBadge();
    maxApp.hapticFeedback('success');
    alertInline(`${product.name} добавлен в заказ`);

    if (trigger && trigger.isConnected) {
        const initialText = trigger.textContent;
        trigger.textContent = 'Добавлено';
        trigger.disabled = true;
        setTimeout(() => {
            trigger.textContent = initialText;
            trigger.disabled = false;
        }, 1200);
    }
}

function setCartItemQuantity(productId, quantity, shouldRenderCart = true) {
    if (quantity <= 0) return removeFromCart(productId, shouldRenderCart);

    const product = CONFIG.getProductById(productId);
    if (!product) return;

    const existingItem = getCartItem(productId);
    if (existingItem) {
        existingItem.quantity = quantity;
    } else {
        cart.push({ product, quantity });
    }

    updateCartBadge();
    if (shouldRenderCart) renderCart();
}

function removeFromCart(productId, shouldRenderCart = true) {
    cart = cart.filter((item) => item.product.id !== productId);
    updateCartBadge();
    if (shouldRenderCart) renderCart();
}

function updateCartItemQuantity(productId, quantity, shouldRenderCart = true) {
    if (quantity <= 0) return removeFromCart(productId, shouldRenderCart);
    const item = getCartItem(productId);
    if (!item) return;
    item.quantity = quantity;
    updateCartBadge();
    if (shouldRenderCart) renderCart();
}

function updateCartBadge() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('cartBadge');
    badge.textContent = count;
    badge.style.opacity = count > 0 ? '1' : '0.35';
}

function getCartTotal() {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
}

function setFulfillment(method) {
    fulfillmentMethod = method === 'pickup' ? 'pickup' : 'delivery';
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cartItems');
    const totalElement = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) checkoutBtn.style.display = 'none';

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-card">
                <h3>Заказ ещё не собран</h3>
                <p>Выбери бургер, крылья, соус или картофель, а мы сразу посчитаем доставку и итоговую сумму.</p>
                <button class="action-ghost full" onclick="showProducts()">Перейти в меню</button>
            </div>
        `;
        totalElement.innerHTML = '';
        return;
    }

    container.innerHTML = cart.map((item) => `
        <article class="cart-item">
            <img src="${escapeHtml(getProductImageSrc(item.product))}" alt="${escapeHtml(item.product.name)}" onerror="handleProductImageError(this, '${escapeHtml(item.product.id)}')">
            <div>
                <h3>${escapeHtml(item.product.name)}</h3>
                <p>${CONFIG.formatPrice(item.product.price)} · ${escapeHtml(item.product.badge)}</p>
            </div>
            <div class="qty-control">
                <button type="button" aria-label="Уменьшить" onclick="updateCartItemQuantity('${item.product.id}', ${item.quantity - 1})">-</button>
                <strong>${item.quantity}</strong>
                <button type="button" aria-label="Увеличить" onclick="updateCartItemQuantity('${item.product.id}', ${item.quantity + 1})">+</button>
            </div>
        </article>
    `).join('');

    const subtotal = getCartTotal();
    const delivery = CONFIG.getDeliveryCost(subtotal, fulfillmentMethod);
    const total = subtotal + delivery;
    const user = maxApp.getUser();
    const defaultName = [user.first_name, user.last_name].filter(Boolean).join(' ');

    totalElement.innerHTML = `
        <div class="summary-lines">
            <div><span>Блюда</span><strong>${CONFIG.formatPrice(subtotal)}</strong></div>
            <div><span>${fulfillmentMethod === 'pickup' ? 'Самовывоз' : 'Доставка'}</span><strong>${CONFIG.formatPrice(delivery)}</strong></div>
            <div class="summary-total"><span>К оплате</span><strong>${CONFIG.formatPrice(total)}</strong></div>
        </div>

        <form id="orderForm" class="cart-order-form" onsubmit="submitOrder(event)">
            <div class="fulfillment-toggle" role="group" aria-label="Получение заказа">
                <button type="button" class="${fulfillmentMethod === 'delivery' ? 'active' : ''}" onclick="setFulfillment('delivery')">
                    <span>Доставка</span>
                    <strong>привезём по Екатеринбургу</strong>
                </button>
                <button type="button" class="${fulfillmentMethod === 'pickup' ? 'active' : ''}" onclick="setFulfillment('pickup')">
                    <span>Самовывоз</span>
                    <strong>заберу из точки</strong>
                </button>
            </div>

            <div class="form-grid">
                <label>
                    Имя
                    <input id="customerName" value="${escapeHtml(defaultName)}" required placeholder="Как подписать заказ">
                </label>
                <label>
                    Телефон
                    <div class="phone-row">
                        <input id="customerPhone" type="tel" required placeholder="+7 (___) ___-__-__">
                        <button type="button" onclick="fillPhoneFromMax()">MAX</button>
                    </div>
                </label>
                <label>
                    Email для чека
                    <input id="customerEmail" type="email" placeholder="client@example.com">
                </label>
                <label>
                    Город
                    <input id="deliveryCity" value="${CONFIG.SHOP.city}" readonly>
                </label>
            </div>

            ${fulfillmentMethod === 'delivery' ? `
                <label>
                    Адрес доставки
                    <textarea id="deliveryAddress" required placeholder="Улица, дом, квартира, подъезд и ориентир"></textarea>
                </label>
            ` : `
                <label>
                    Точка самовывоза
                    <select id="pickupPoint" required>
                        ${CONFIG.PICKUP_POINTS.map((point) => `<option value="${point.id}">${escapeHtml(point.name)} · ${escapeHtml(point.address)} · ${escapeHtml(point.worktime)}</option>`).join('')}
                    </select>
                </label>
            `}

            <textarea id="orderComment" placeholder="Комментарий: приборы, соусы, удобное время или пожелания"></textarea>
            <button id="placeOrderBtn" class="action-primary full" type="submit">Перейти к оплате</button>
        </form>
    `;

    initPhoneMask();
}

function fillPhoneFromMax() {
    maxApp.requestContact((phone) => {
        if (!phone) return;
        const input = document.getElementById('customerPhone');
        input.value = phone;
        maxApp.hapticFeedback('success');
    });
}

async function submitOrder(event) {
    event.preventDefault();
    const button = document.getElementById('placeOrderBtn');
    if (button.disabled) return;
    button.disabled = true;
    button.textContent = 'Передаю заказ на кухню...';

    try {
        if (!authToken) await authenticateMaxUser();
        const orderPayload = collectOrderPayload();
        const orderResponse = await fetch(CONFIG.API.orders, {
            method: 'POST',
            headers: apiHeaders(),
            body: JSON.stringify(orderPayload),
        });
        const orderData = await orderResponse.json();
        if (!orderData.ok) throw new Error(readApiError(orderData) || 'ORDER_FAILED');

        button.textContent = 'Открываю оплату...';
        const paymentResponse = await fetch(CONFIG.API.createPayment, {
            method: 'POST',
            headers: apiHeaders(),
            body: JSON.stringify({ order_id: orderData.order.id }),
        });
        const paymentData = await paymentResponse.json();
        if (!paymentData.ok) throw new Error(paymentData.error || 'PAYMENT_FAILED');

        maxApp.hapticFeedback('success');
        showPayment(orderData.order, paymentData);
    } catch (error) {
        maxApp.hapticFeedback('error');
        button.disabled = false;
        button.textContent = 'Перейти к оплате';
        alertInline(error.message || 'Не удалось оформить заказ. Попробуй ещё раз.');
    }
}

function collectOrderPayload() {
    const selectedPickup = CONFIG.PICKUP_POINTS.find((point) => point.id === document.getElementById('pickupPoint')?.value);
    const deliveryAddress = fulfillmentMethod === 'pickup'
        ? selectedPickup?.address || CONFIG.SHOP.pickupAddress
        : document.getElementById('deliveryAddress').value.trim();

    return {
        items: cart.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
        })),
        customer: {
            name: document.getElementById('customerName').value.trim(),
            phone: document.getElementById('customerPhone').value.trim(),
            email: document.getElementById('customerEmail').value.trim(),
        },
        delivery: {
            method: fulfillmentMethod,
            city: CONFIG.SHOP.city,
            address: deliveryAddress,
            pickup_point_id: fulfillmentMethod === 'pickup' ? selectedPickup?.id || '' : '',
        },
        comment: document.getElementById('orderComment').value.trim(),
    };
}

function renderPayment(order, payload) {
    const container = document.getElementById('paymentDetails');
    const payment = payload.payment;
    window.currentYooMoneyForm = payload.paymentForm || null;

    if (payload.needsConfiguration || !payload.paymentForm) {
        container.innerHTML = `
            <div class="payment-card">
                <p class="eyebrow">Оплата временно недоступна</p>
                <h1>${escapeHtml(order.order_number)}</h1>
                <p>Заказ сохранён. Мы покажем итоговую сумму, а оплату можно завершить после подключения платёжного канала.</p>
                <div class="payment-total">${CONFIG.formatPrice(order.total)}</div>
                <button class="action-primary full" onclick="showSuccess(currentOrder)">Показать результат</button>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="payment-card">
            <p class="eyebrow">Безопасная оплата ЮMoney</p>
            <h1>${escapeHtml(order.order_number)}</h1>
            <p>Нажми «Оплатить», чтобы перейти на форму ЮMoney. После подтверждения мы обновим статус заказа.</p>
            <div class="payment-total">${CONFIG.formatPrice(payment.amount)}</div>
            <button class="action-primary full" onclick="submitYooMoneyForm(window.currentYooMoneyForm)">Оплатить заказ</button>
            <button class="action-ghost full" onclick="checkPaymentStatus('${order.id}')">Обновить статус</button>
        </div>
    `;
}

function submitYooMoneyForm(formConfig) {
    const form = document.createElement('form');
    form.method = formConfig.method;
    form.action = formConfig.action;
    form.style.display = 'none';

    Object.entries(formConfig.fields).forEach(([name, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
}

async function checkPaymentStatus(orderId) {
    const response = await fetch(CONFIG.API.paymentStatus(orderId), { headers: apiHeaders() });
    const data = await response.json();
    if (!data.ok) return alertInline(data.error || 'Статус оплаты пока не найден');
    showSuccess(data.order, data.payment);
}

function renderReturnedPayment() {
    const returnedOrder = new URLSearchParams(location.search).get('payment_return');
    if (!returnedOrder) return;
    setTimeout(() => {
        if (authToken) checkPaymentStatus(returnedOrder);
    }, 800);
}

function renderSuccessDetails(order, payment = null) {
    const status = payment?.status || order.status;
    const paid = status === 'succeeded' || order.status === 'paid';
    document.getElementById('successTitle').textContent = paid ? 'Оплата прошла' : 'Заказ создан';
    document.getElementById('successMessage').textContent = paid
        ? 'Кухня получила заказ. Детали и статус можно посмотреть здесь же.'
        : 'Оплата ещё не подтверждена. Вернись после ЮMoney и обнови статус.';

    const method = order.fulfillment_method === 'pickup' || order.delivery?.method === 'pickup' ? 'Самовывоз' : 'Доставка';
    document.getElementById('successDetails').innerHTML = `
        <div><span>Заказ</span><strong>${escapeHtml(order.order_number)}</strong></div>
        <div><span>Получение</span><strong>${method}</strong></div>
        <div><span>Статус заказа</span><strong>${escapeHtml(order.status)}</strong></div>
        <div><span>Статус оплаты</span><strong>${escapeHtml(status || 'not_created')}</strong></div>
        <div class="summary-total"><span>Сумма</span><strong>${CONFIG.formatPrice(order.total)}</strong></div>
    `;
}

function renderMyOrders(orders) {
    const container = document.getElementById('ordersList');
    if (orders.length === 0) {
        container.innerHTML = '<div class="empty-card"><h3>История заказов пустая</h3><p>Собери первый заказ, и он появится здесь для повторной проверки статуса.</p></div>';
        return;
    }

    container.innerHTML = orders.map((order) => `
        <article class="order-card">
            <div>
                <p class="eyebrow">${escapeHtml(order.status)}</p>
                <h3>${escapeHtml(order.order_number)}</h3>
            </div>
            <strong>${CONFIG.formatPrice(order.total)}</strong>
            <button class="action-ghost" onclick="checkPaymentStatus('${order.id}')">Обновить</button>
        </article>
    `).join('');
}

function initPhoneMask() {
    const phoneInput = document.getElementById('customerPhone');
    if (!phoneInput) return;

    phoneInput.addEventListener('input', (event) => {
        let value = event.target.value.replace(/\D/g, '');
        if (value.length > 0) {
            if (value[0] === '8') value = '7' + value.slice(1);
            if (value[0] !== '7') value = '7' + value;
        }

        let formatted = value.length > 0 ? '+7' : '';
        if (value.length > 1) formatted += ' (' + value.slice(1, 4);
        if (value.length > 4) formatted += ') ' + value.slice(4, 7);
        if (value.length > 7) formatted += '-' + value.slice(7, 9);
        if (value.length > 9) formatted += '-' + value.slice(9, 11);
        event.target.value = formatted;
    });
}

function readApiError(data) {
    if (data.details?.[0]?.message) return data.details[0].message;
    return data.error;
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function alertInline(message) {
    const node = document.createElement('div');
    node.className = 'toast';
    node.textContent = message;
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 3200);
}

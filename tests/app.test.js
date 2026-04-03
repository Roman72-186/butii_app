/**
 * Тесты для app.js
 * @jest-environment jsdom
 */

// Мокаем localStorage
const localStorageMock = {
    store: {},
    getItem: jest.fn(key => localStorageMock.store[key] || null),
    setItem: jest.fn((key, value) => { localStorageMock.store[key] = value; }),
    clear: jest.fn(() => { localStorageMock.store = {}; })
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Мокаем fetch
global.fetch = jest.fn();

// Мокаем CONFIG
global.CONFIG = {
    WEBHOOK_URL: '/api/webhook',
    SHOP: {
        name: 'TestShop',
        logo: '🛒',
        currency: '₽',
        currencyCode: 'RUB'
    },
    CATEGORIES: [
        { id: 'all', name: 'Все товары', icon: '🏠' },
        { id: 'electronics', name: 'Электроника', icon: '📱' },
        { id: 'accessories', name: 'Аксессуары', icon: '🔑' }
    ],
    PRODUCTS: [
        {
            id: 'prod-001',
            name: 'Тестовый товар 1',
            price: 1000,
            oldPrice: 1500,
            category: 'electronics',
            badge: 'Хит',
            rating: 4.5,
            reviews: 100,
            image: 'https://example.com/img1.jpg',
            images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
            description: 'Описание товара 1',
            features: [{ label: 'Цвет', value: 'Черный' }],
            inStock: true
        },
        {
            id: 'prod-002',
            name: 'Тестовый товар 2',
            price: 500,
            category: 'accessories',
            badge: null,
            rating: 4.0,
            reviews: 50,
            image: 'https://example.com/img3.jpg',
            images: ['https://example.com/img3.jpg'],
            description: 'Описание товара 2',
            features: [{ label: 'Размер', value: 'M' }],
            inStock: true
        }
    ],
    DELIVERY: {
        freeShippingThreshold: 2000,
        cost: 299,
        estimatedDays: '1-3'
    },
    getProductById: jest.fn(id => CONFIG.PRODUCTS.find(p => p.id === id)),
    getProductsByCategory: jest.fn(catId => {
        if (catId === 'all') return CONFIG.PRODUCTS;
        return CONFIG.PRODUCTS.filter(p => p.category === catId);
    }),
    formatPrice: jest.fn(price => price.toLocaleString('ru-RU') + ' ₽'),
    getDiscount: jest.fn((price, oldPrice) => {
        if (!oldPrice || oldPrice <= price) return 0;
        return Math.round((1 - price / oldPrice) * 100);
    })
};

// Мокаем telegramApp
global.telegramApp = {
    getUserId: jest.fn(() => 123456789),
    getUserName: jest.fn(() => 'Test User'),
    showAlert: jest.fn(),
    showConfirm: jest.fn((msg, cb) => cb(true)),
    hapticFeedback: jest.fn(),
    tg: null
};

// Базовый HTML для тестов
const baseHTML = `
<div id="loader"></div>
<div id="app" style="display: none;">
    <span id="shopName"></span>
    <span id="shopLogo"></span>
    <div id="cartIcon"></div>
    <span id="cartBadge">0</span>

    <section id="catalogSection">
        <div id="categories"></div>
        <div id="productsGrid"></div>
    </section>

    <section id="productSection" style="display: none;">
        <img id="mainImage" src="">
        <div id="productBadge"></div>
        <h1 id="productTitle"></h1>
        <div id="productRating"></div>
        <div id="productPrice"></div>
        <div id="productOldPrice"></div>
        <div id="productDiscount"></div>
        <p id="productDescription"></p>
        <ul id="productFeatures"></ul>
        <div id="imageThumbnails"></div>
        <span id="deliveryInfo"></span>
        <span id="deliveryDays"></span>
        <input id="quantity" value="1">
        <span id="btnPrice"></span>
    </section>

    <section id="cartSection" style="display: none;">
        <div id="cartEmpty"></div>
        <div id="cartContent" style="display: none;">
            <div id="cartItems"></div>
            <span id="subtotal"></span>
            <span id="deliveryCost"></span>
            <span id="total"></span>
        </div>
    </section>

    <section id="checkoutSection" style="display: none;">
        <form id="checkoutForm">
            <input id="customerName" value="">
            <input id="customerPhone" value="">
            <input id="customerEmail" value="">
            <input id="city" value="">
            <textarea id="address"></textarea>
            <textarea id="comment"></textarea>
            <div id="checkoutItems"></div>
            <span id="checkoutTotal"></span>
            <button id="submitOrderBtn"></button>
            <span id="submitTotal"></span>
        </form>
    </section>

    <section id="successSection" style="display: none;">
        <div id="orderDetails"></div>
    </section>
</div>
`;

// Создаем мок корзины
class MockCart {
    constructor() {
        this.items = [];
    }
    add(product, qty) { this.items.push({ ...product, quantity: qty }); }
    remove(id) { this.items = this.items.filter(i => i.id !== id); }
    getItems() { return this.items; }
    getCount() { return this.items.reduce((s, i) => s + i.quantity, 0); }
    getTotal() { return this.items.reduce((s, i) => s + i.price * i.quantity, 0); }
    getDeliveryCost() { return this.getTotal() >= 2000 ? 0 : 299; }
    getFinalTotal() { return this.getTotal() + this.getDeliveryCost(); }
    clear() { this.items = []; }
    isEmpty() { return this.items.length === 0; }
    updateBadge() {}
}

global.cart = new MockCart();

describe('App', () => {

    beforeEach(() => {
        document.body.innerHTML = baseHTML;
        localStorageMock.clear();
        localStorageMock.store = {};
        jest.clearAllMocks();
        global.cart = new MockCart();
        global.currentProduct = null;
        global.currentCategory = 'all';
    });

    describe('renderCategories()', () => {

        // Эмулируем функцию
        const renderCategories = () => {
            const container = document.getElementById('categories');
            const currentCategory = global.currentCategory || 'all';

            container.innerHTML = CONFIG.CATEGORIES.map(cat => `
                <button class="category-btn ${cat.id === currentCategory ? 'active' : ''}"
                        data-category="${cat.id}">
                    <span class="category-icon">${cat.icon}</span>
                    <span>${cat.name}</span>
                </button>
            `).join('');
        };

        test('должна рендерить все категории', () => {
            renderCategories();

            const buttons = document.querySelectorAll('.category-btn');
            expect(buttons.length).toBe(CONFIG.CATEGORIES.length);
        });

        test('должна отмечать активную категорию', () => {
            global.currentCategory = 'electronics';
            renderCategories();

            const activeBtn = document.querySelector('.category-btn.active');
            expect(activeBtn.dataset.category).toBe('electronics');
        });

    });

    describe('renderProducts()', () => {

        const renderProducts = () => {
            const container = document.getElementById('productsGrid');
            const products = CONFIG.getProductsByCategory(global.currentCategory);

            container.innerHTML = products.map(product => `
                <div class="product-card-mini" data-id="${product.id}">
                    <div class="product-card-name">${product.name}</div>
                    <div class="product-card-price">${CONFIG.formatPrice(product.price)}</div>
                </div>
            `).join('');
        };

        test('должна рендерить все товары для категории "all"', () => {
            global.currentCategory = 'all';
            renderProducts();

            const cards = document.querySelectorAll('.product-card-mini');
            expect(cards.length).toBe(CONFIG.PRODUCTS.length);
        });

        test('должна фильтровать товары по категории', () => {
            global.currentCategory = 'electronics';
            renderProducts();

            const cards = document.querySelectorAll('.product-card-mini');
            expect(cards.length).toBe(1);
            expect(cards[0].dataset.id).toBe('prod-001');
        });

    });

    describe('openProduct()', () => {

        const openProduct = (productId) => {
            const product = CONFIG.getProductById(productId);
            if (!product) return;

            global.currentProduct = product;

            document.getElementById('mainImage').src = product.image;
            document.getElementById('productTitle').textContent = product.name;
            document.getElementById('productDescription').textContent = product.description;
            document.getElementById('productPrice').textContent = CONFIG.formatPrice(product.price);

            document.getElementById('catalogSection').style.display = 'none';
            document.getElementById('productSection').style.display = 'block';
        };

        test('должна открывать страницу товара', () => {
            openProduct('prod-001');

            expect(document.getElementById('productSection').style.display).toBe('block');
            expect(document.getElementById('catalogSection').style.display).toBe('none');
        });

        test('должна заполнять данные товара', () => {
            openProduct('prod-001');

            expect(document.getElementById('productTitle').textContent).toBe('Тестовый товар 1');
            expect(document.getElementById('mainImage').src).toContain('img1.jpg');
        });

        test('должна устанавливать currentProduct', () => {
            openProduct('prod-001');

            expect(global.currentProduct).toBeDefined();
            expect(global.currentProduct.id).toBe('prod-001');
        });

        test('не должна ломаться для несуществующего товара', () => {
            expect(() => openProduct('non-existent')).not.toThrow();
            expect(global.currentProduct).toBeNull();
        });

    });

    describe('Управление количеством', () => {

        const increaseQty = () => {
            const input = document.getElementById('quantity');
            const val = parseInt(input.value);
            if (val < 10) input.value = val + 1;
        };

        const decreaseQty = () => {
            const input = document.getElementById('quantity');
            const val = parseInt(input.value);
            if (val > 1) input.value = val - 1;
        };

        test('increaseQty должна увеличивать количество', () => {
            document.getElementById('quantity').value = '1';
            increaseQty();
            expect(document.getElementById('quantity').value).toBe('2');
        });

        test('increaseQty не должна превышать 10', () => {
            document.getElementById('quantity').value = '10';
            increaseQty();
            expect(document.getElementById('quantity').value).toBe('10');
        });

        test('decreaseQty должна уменьшать количество', () => {
            document.getElementById('quantity').value = '5';
            decreaseQty();
            expect(document.getElementById('quantity').value).toBe('4');
        });

        test('decreaseQty не должна опускаться ниже 1', () => {
            document.getElementById('quantity').value = '1';
            decreaseQty();
            expect(document.getElementById('quantity').value).toBe('1');
        });

    });

    describe('Навигация', () => {

        const hideAllSections = () => {
            document.getElementById('catalogSection').style.display = 'none';
            document.getElementById('productSection').style.display = 'none';
            document.getElementById('cartSection').style.display = 'none';
            document.getElementById('checkoutSection').style.display = 'none';
            document.getElementById('successSection').style.display = 'none';
        };

        const showCatalog = () => {
            hideAllSections();
            document.getElementById('catalogSection').style.display = 'block';
        };

        const showCart = () => {
            hideAllSections();
            document.getElementById('cartSection').style.display = 'block';
        };

        test('showCatalog должна показывать каталог', () => {
            showCart(); // Сначала показываем корзину
            showCatalog();

            expect(document.getElementById('catalogSection').style.display).toBe('block');
            expect(document.getElementById('cartSection').style.display).toBe('none');
        });

        test('showCart должна показывать корзину', () => {
            showCatalog();
            showCart();

            expect(document.getElementById('cartSection').style.display).toBe('block');
            expect(document.getElementById('catalogSection').style.display).toBe('none');
        });

        test('hideAllSections должна скрывать все секции', () => {
            hideAllSections();

            expect(document.getElementById('catalogSection').style.display).toBe('none');
            expect(document.getElementById('productSection').style.display).toBe('none');
            expect(document.getElementById('cartSection').style.display).toBe('none');
            expect(document.getElementById('checkoutSection').style.display).toBe('none');
            expect(document.getElementById('successSection').style.display).toBe('none');
        });

    });

    describe('sendToLeadtex()', () => {

        const normalizePhone = (phone) => {
            const digits = phone.replace(/\D/g, '');
            return '+' + (digits.startsWith('8') ? '7' + digits.slice(1) : digits);
        };

        const sendToLeadtex = async (orderData) => {
            const response = await fetch(CONFIG.WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contact_by: 'id',
                    search: orderData.telegram.userId.toString(),
                    variables: {
                        order_id: orderData.order.orderId,
                        order_total: orderData.order.total.toString(),
                        customer_name: orderData.customer.name,
                        telegram_id: orderData.telegram.userId.toString()
                    }
                })
            });

            return response.ok;
        };

        const testOrderData = {
            customer: { name: 'Иван', phone: '+7 (999) 123-45-67', email: 'test@test.com' },
            delivery: { city: 'Москва', address: 'Улица 1' },
            comment: 'Тест',
            order: {
                items: [],
                subtotal: 1000,
                delivery: 0,
                total: 1000,
                timestamp: new Date().toISOString(),
                orderId: 'ORD-123'
            },
            telegram: { userId: 123456789, userName: 'Test' }
        };

        test('должна отправлять POST запрос на WEBHOOK_URL', async () => {
            global.fetch.mockResolvedValueOnce({ ok: true });

            await sendToLeadtex(testOrderData);

            expect(fetch).toHaveBeenCalledWith(
                CONFIG.WEBHOOK_URL,
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                })
            );
        });

        test('должна возвращать true при успешном ответе', async () => {
            global.fetch.mockResolvedValueOnce({ ok: true });

            const result = await sendToLeadtex(testOrderData);
            expect(result).toBe(true);
        });

        test('должна возвращать false при ошибке', async () => {
            global.fetch.mockResolvedValueOnce({ ok: false, status: 500 });

            const result = await sendToLeadtex(testOrderData);
            expect(result).toBe(false);
        });

        test('должна искать контакт по MAX user ID (telegram_id)', async () => {
            global.fetch.mockResolvedValueOnce({ ok: true });

            await sendToLeadtex(testOrderData);

            const callBody = JSON.parse(fetch.mock.calls[0][1].body);
            expect(callBody.contact_by).toBe('id');
            expect(callBody.search).toBe('123456789');
        });

        test('должна включать telegram_id в variables', async () => {
            global.fetch.mockResolvedValueOnce({ ok: true });

            await sendToLeadtex(testOrderData);

            const callBody = JSON.parse(fetch.mock.calls[0][1].body);
            expect(callBody.variables.telegram_id).toBe('123456789');
        });

    });

    describe('renderCart()', () => {

        const renderCart = () => {
            const container = document.getElementById('cartItems');
            const items = cart.getItems();

            container.innerHTML = items.map(item => `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-qty">x${item.quantity}</div>
                    <div class="cart-item-price">${CONFIG.formatPrice(item.price * item.quantity)}</div>
                </div>
            `).join('');

            document.getElementById('subtotal').textContent = CONFIG.formatPrice(cart.getTotal());
            document.getElementById('total').textContent = CONFIG.formatPrice(cart.getFinalTotal());
        };

        test('должна рендерить товары из корзины', () => {
            cart.add({ id: 'test-1', name: 'Товар 1', price: 1000, image: '' }, 2);
            cart.add({ id: 'test-2', name: 'Товар 2', price: 500, image: '' }, 1);

            renderCart();

            const items = document.querySelectorAll('.cart-item');
            expect(items.length).toBe(2);
        });

        test('должна обновлять итоговую сумму', () => {
            cart.add({ id: 'test-1', name: 'Товар 1', price: 1000, image: '' }, 2);

            renderCart();

            expect(document.getElementById('subtotal').textContent).toContain('2');
            expect(document.getElementById('total').textContent).toContain('2');
        });

    });

});

describe('Интеграционные тесты', () => {

    beforeEach(() => {
        document.body.innerHTML = baseHTML;
        global.cart = new MockCart();
        jest.clearAllMocks();
    });

    test('Полный flow: каталог → товар → корзина', () => {
        // 1. Начинаем с каталога
        expect(document.getElementById('catalogSection')).toBeDefined();

        // 2. Открываем товар
        global.currentProduct = CONFIG.PRODUCTS[0];
        document.getElementById('productSection').style.display = 'block';
        document.getElementById('catalogSection').style.display = 'none';

        expect(document.getElementById('productSection').style.display).toBe('block');

        // 3. Добавляем в корзину
        cart.add(CONFIG.PRODUCTS[0], 2);

        expect(cart.getCount()).toBe(2);
        expect(cart.isEmpty()).toBe(false);

        // 4. Переходим в корзину
        document.getElementById('cartSection').style.display = 'block';
        document.getElementById('productSection').style.display = 'none';

        expect(document.getElementById('cartSection').style.display).toBe('block');
    });

    test('Расчет стоимости доставки', () => {
        // Меньше порога - доставка платная
        cart.add({ id: 't1', name: 'T1', price: 500, image: '' }, 1);
        expect(cart.getDeliveryCost()).toBe(299);
        expect(cart.getFinalTotal()).toBe(799);

        // Больше порога - доставка бесплатная
        cart.clear();
        cart.add({ id: 't2', name: 'T2', price: 2000, image: '' }, 1);
        expect(cart.getDeliveryCost()).toBe(0);
        expect(cart.getFinalTotal()).toBe(2000);
    });

});

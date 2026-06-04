// ===================================
// MAX BURGER CONFIG
// ===================================

const CONFIG = {
    API: {
        auth: '/api/auth/max',
        orders: '/api/orders',
        myOrders: '/api/orders/my',
        createPayment: '/api/payments/yoomoney/create',
        paymentStatus: (orderId) => `/api/payments/${orderId}/status`,
    },

    SHOP: {
        name: 'MAX Burger',
        logo: 'MB',
        currency: '₽',
        currencyCode: 'RUB',
        phone: '+7 343 000-00-00',
        address: 'Екатеринбург, ул. Вайнера, 9',
        city: 'Екатеринбург',
        pickupAddress: 'ул. Вайнера, 9, Екатеринбург',
        maxBotUsername: 'id861708697380_1_bot',
        tagline: 'Горячие бургеры и крылья прямо в MAX',
    },

    CATALOG: {
        itemsPerPage: 12,
        maxCartItems: 50,
        allowPreOrder: true,
        deliveryCost: 190,
        freeDeliveryFrom: 1800,
        pickupCost: 0,
    },

    PICKUP_POINTS: [
        {
            id: 'vaynera',
            name: 'MAX Burger Вайнера',
            address: 'Екатеринбург, ул. Вайнера, 9',
            worktime: '10:00–23:00',
        },
        {
            id: 'malysheva',
            name: 'MAX Burger Малышева',
            address: 'Екатеринбург, ул. Малышева, 51',
            worktime: '11:00–22:30',
        },
    ],

    CATEGORIES: [
        { id: 'all', name: 'Всё меню', icon: '🔥' },
        { id: 'burgers', name: 'Бургеры', icon: '🍔' },
        { id: 'wings', name: 'Крылья', icon: '🍗' },
        { id: 'sauces', name: 'Соусы', icon: '🌶️' },
        { id: 'sides', name: 'Картофель и напитки', icon: '🍟' },
    ],

    PRODUCTS: [
        {
            id: 'burger-ural-smash',
            name: 'Ural Smash',
            price: 490,
            category: 'burgers',
            description: 'Две сочные smash-котлеты, расплавленный чеддер, маринованный лук и фирменный MAX sauce.',
            emoji: '🍔',
            image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80',
            stock: 100,
            rating: 4.9,
            badge: 'Хит',
            accent: 'yellow',
            bullets: ['двойная говядина', 'чеддер', 'MAX sauce'],
        },
        {
            id: 'burger-black-bun',
            name: 'Black Bun BBQ',
            price: 560,
            category: 'burgers',
            description: 'Чёрная булка, говяжья котлета, хрустящий бекон, копчёный BBQ и свежий салат.',
            emoji: '🍔',
            image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80',
            stock: 100,
            rating: 4.8,
            badge: 'BBQ',
            accent: 'red',
            bullets: ['хрустящий бекон', 'копчёный BBQ', 'яркий вкус'],
        },
        {
            id: 'burger-cheese-river',
            name: 'Cheese River',
            price: 520,
            category: 'burgers',
            description: 'Говяжья котлета в мягкой булке, много сыра, огурцы и нежный сливочный соус.',
            emoji: '🧀',
            image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=900&q=80',
            stock: 100,
            rating: 4.7,
            badge: 'Сыр',
            accent: 'yellow',
            bullets: ['много сыра', 'говядина', 'сливочный соус'],
        },
        {
            id: 'wings-hot-8',
            name: 'Hot Wings 8 шт.',
            price: 430,
            category: 'wings',
            description: 'Крылья в остром glaze-соусе с кунжутом и зелёным луком. Для тех, кто любит жарче.',
            emoji: '🍗',
            image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=900&q=80',
            stock: 100,
            rating: 4.9,
            badge: 'Остро',
            accent: 'red',
            bullets: ['8 штук', 'острый соус', 'кунжут'],
        },
        {
            id: 'wings-bbq-12',
            name: 'BBQ Wings 12 шт.',
            price: 610,
            category: 'wings',
            description: 'Большая порция крыльев в сладко-копчёном BBQ-соусе. Хорошо заходит на двоих.',
            emoji: '🍗',
            image: 'https://images.unsplash.com/photo-1608039755401-742074f0548d?auto=format&fit=crop&w=900&q=80',
            stock: 100,
            rating: 4.8,
            badge: 'На двоих',
            accent: 'orange',
            bullets: ['12 штук', 'копчёный BBQ', 'большая порция'],
        },
        {
            id: 'sauce-max',
            name: 'MAX Sauce',
            price: 90,
            category: 'sauces',
            description: 'Фирменный сливочно-перечный соус: добавь к бургеру, картошке или крыльям.',
            emoji: '🥣',
            image: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=900&q=80',
            stock: 100,
            rating: 4.9,
            badge: 'Фирменный',
            accent: 'yellow',
            bullets: ['сливочный', 'перечный', 'к бургеру'],
        },
        {
            id: 'sauce-chipotle',
            name: 'Chipotle Fire',
            price: 110,
            category: 'sauces',
            description: 'Острый копчёный соус на томатной базе с чипотле. Делает заказ заметно ярче.',
            emoji: '🌶️',
            image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80',
            stock: 100,
            rating: 4.8,
            badge: 'Острый',
            accent: 'red',
            bullets: ['чипотле', 'копчёный', 'острый'],
        },
        {
            id: 'side-fries',
            name: 'Картофель фри',
            price: 190,
            category: 'sides',
            description: 'Золотистый картофель с хрустящей корочкой и крупной солью. Подаём горячим.',
            emoji: '🍟',
            image: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=900&q=80',
            stock: 100,
            rating: 4.7,
            badge: 'Классика',
            accent: 'yellow',
            bullets: ['хрустящий', 'горячий', 'к соусу'],
        },
        {
            id: 'side-coleslaw',
            name: 'Коул Слоу',
            price: 170,
            category: 'sides',
            description: 'Свежий салат из капусты и моркови с лёгкой заправкой. Освежает после острого.',
            emoji: '🥗',
            image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=80',
            stock: 100,
            rating: 4.6,
            badge: 'Fresh',
            accent: 'green',
            bullets: ['свежий', 'капуста', 'лёгкая заправка'],
        },
        {
            id: 'drink-max-cola',
            name: 'MAX Cola',
            price: 150,
            category: 'sides',
            description: 'Холодная MAX Cola 0.33 л. Классическая пара к бургеру и картофелю.',
            emoji: '🥤',
            image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=900&q=80',
            stock: 100,
            rating: 4.5,
            badge: 'Cold',
            accent: 'black',
            bullets: ['0.33 л', 'холодная', 'к бургеру'],
        },
    ],

    DEV_MODE: true,

    MOCK_USER: {
        id: 123456789,
        first_name: 'MAX',
        last_name: 'Guest',
        username: 'max_food_guest',
        language_code: 'ru',
    },

    getProductById(id) {
        return this.PRODUCTS.find((product) => product.id === id);
    },

    getProductsByCategory(categoryId) {
        if (categoryId === 'all') return this.PRODUCTS;
        return this.PRODUCTS.filter((product) => product.category === categoryId);
    },

    getDeliveryCost(subtotal, method = 'delivery') {
        if (method === 'pickup') return this.CATALOG.pickupCost;
        if (subtotal >= this.CATALOG.freeDeliveryFrom) return 0;
        return this.CATALOG.deliveryCost;
    },

    formatPrice(price) {
        return price.toLocaleString('ru-RU') + ' ' + this.SHOP.currency;
    },

    formatRating(rating) {
        return `${Number(rating).toFixed(1)}`;
    },
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

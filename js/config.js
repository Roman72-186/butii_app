// ===================================
// КОНФИГУРАЦИЯ KEYCHAIN SHOP
// ===================================
// Telegram Mini App для интернет-магазина брелков

const CONFIG = {
    // ===================================
    // НАСТРОЙКИ ИНТЕГРАЦИИ
    // ===================================

    WEBHOOK_URL: '/api/webhook',

    // ===================================
    // НАСТРОЙКИ МАГАЗИНА
    // ===================================

    SHOP: {
        name: 'Keychain Shop',
        logo: '🔑',
        currency: '₽',
        currencyCode: 'RUB',
        phone: '+7 (999) 123-45-67',
        address: 'г. Москва, ул. Брелковая, д. 1',
        maxBotUsername: 'id861708697380_1_bot'
    },

    // ===================================
    // НАСТРОЙКИ КАТАЛОГА
    // ===================================

    CATALOG: {
        itemsPerPage: 12,
        maxCartItems: 50,
        allowPreOrder: true,
        deliveryCost: 300
    },

    // ===================================
    // КАТЕГОРИИ ТОВАРОВ
    // ===================================

    CATEGORIES: [
        { id: 'all', name: 'Все товары', icon: '✨' },
        { id: 'classic', name: 'Классические', icon: '🗝️' },
        { id: 'custom', name: 'Персональные', icon: '👤' },
        { id: 'promo', name: 'Рекламные', icon: '📢' },
        { id: 'seasonal', name: 'Сезонные', icon: '🗓️' },
        { id: 'premium', name: 'Премиум', icon: '💎' }
    ],

    // ===================================
    // ТОВАРЫ
    // ===================================

    PRODUCTS: [
        // Классические брелки
        {
            id: 'keychain-classic-metal',
            name: 'Классический металлический',
            price: 290,
            category: 'classic',
            description: 'Прочный металлический брелок классического дизайна',
            emoji: '⚙️',
            stock: 100,
            rating: 4.8
        },
        {
            id: 'keychain-classic-leather',
            name: 'Кожаный брелок',
            price: 450,
            category: 'classic',
            description: 'Элегантный кожаный брелок с металлической фурнитурой',
            emoji: '👜',
            stock: 75,
            rating: 4.7
        },
        {
            id: 'keychain-classic-wood',
            name: 'Деревянный брелок',
            price: 390,
            category: 'classic',
            description: 'Натуральный деревянный брелок ручной работы',
            emoji: '🌿',
            stock: 50,
            rating: 4.9
        },

        // Персональные брелки
        {
            id: 'keychain-custom-engrave',
            name: 'С гравировкой',
            price: 690,
            category: 'custom',
            description: 'Брелок с персональной гравировкой по вашему тексту',
            emoji: '✍️',
            stock: 30,
            rating: 4.9
        },
        {
            id: 'keychain-custom-photo',
            name: 'С фотографией',
            price: 890,
            category: 'custom',
            description: 'Брелок с нанесением вашей фотографии',
            emoji: '📸',
            stock: 25,
            rating: 4.8
        },
        {
            id: 'keychain-custom-logo',
            name: 'С логотипом',
            price: 790,
            category: 'custom',
            description: 'Корпоративный брелок с вашим логотипом',
            emoji: '🏷️',
            stock: 40,
            rating: 4.7
        },

        // Рекламные брелки
        {
            id: 'keychain-promo-small',
            name: 'Промо брелок (малый)',
            price: 190,
            category: 'promo',
            description: 'Бюджетный рекламный брелок для массовых рассылок',
            emoji: '📢',
            stock: 200,
            rating: 4.5
        },
        {
            id: 'keychain-promo-medium',
            name: 'Промо брелок (средний)',
            price: 350,
            category: 'promo',
            description: 'Рекламный брелок среднего качества с логотипом',
            emoji: '📣',
            stock: 150,
            rating: 4.6
        },
        {
            id: 'keychain-promo-large',
            name: 'Промо брелок (премиум)',
            price: 590,
            category: 'promo',
            description: 'Премиум рекламный брелок с качественной печатью',
            emoji: '⭐',
            stock: 100,
            rating: 4.8
        },

        // Сезонные брелки
        {
            id: 'keychain-season-newyear',
            name: 'Новогодний брелок',
            price: 490,
            category: 'seasonal',
            description: 'Праздничный новогодний брелок ограниченной серии',
            emoji: '🎄',
            stock: 60,
            rating: 4.9
        },
        {
            id: 'keychain-season-valentine',
            name: 'Валентинка брелок',
            price: 550,
            category: 'seasonal',
            description: 'Романтичный брелок ко Дню святого Валентина',
            emoji: '❤️',
            stock: 45,
            rating: 4.7
        },
        {
            id: 'keychain-season-mother',
            name: 'Мамин брелок',
            price: 650,
            category: 'seasonal',
            description: 'Трогательный брелок ко Дню матери',
            emoji: '💐',
            stock: 35,
            rating: 4.9
        },

        // Премиум брелки
        {
            id: 'keychain-premium-gold',
            name: 'Золотой брелок',
            price: 2990,
            category: 'premium',
            description: 'Премиум брелок из золота с инкрустацией',
            emoji: '🥇',
            stock: 10,
            rating: 5.0
        },
        {
            id: 'keychain-premium-silver',
            name: 'Серебряный брелок',
            price: 1990,
            category: 'premium',
            description: 'Эксклюзивный серебряный брелок ручной работы',
            emoji: '🥈',
            stock: 15,
            rating: 4.9
        },
        {
            id: 'keychain-premium-diamond',
            name: 'Бриллиантовый брелок',
            price: 9990,
            category: 'premium',
            description: 'Эксклюзивный брелок с бриллиантовой огранкой',
            emoji: '💎',
            stock: 5,
            rating: 5.0
        }
    ],

    // ===================================
    // РЕЖИМ РАЗРАБОТКИ
    // ===================================

    DEV_MODE: false,

    MOCK_USER: {
        id: 123456789,
        first_name: 'Тест',
        last_name: 'Пользователь',
        username: 'testuser',
        language_code: 'ru'
    },

    // ===================================
    // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    // ===================================

    // Получить продукт по ID
    getProductById(id) {
        return this.PRODUCTS.find(p => p.id === id);
    },

    // Получить продукты по категории
    getProductsByCategory(categoryId) {
        if (categoryId === 'all') return this.PRODUCTS;
        return this.PRODUCTS.filter(p => p.category === categoryId);
    },

    // Форматирование цены
    formatPrice(price) {
        return price.toLocaleString('ru-RU') + ' ' + this.SHOP.currency;
    },

    // Форматирование рейтинга
    formatRating(rating) {
        const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
        return `${stars} (${rating})`;
    }
};

// Экспорт для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
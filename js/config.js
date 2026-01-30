// ===================================
// КОНФИГУРАЦИЯ BEAUTY STUDIO
// ===================================
// Telegram Mini App для записи на услуги

const CONFIG = {
    // ===================================
    // НАСТРОЙКИ ИНТЕГРАЦИИ
    // ===================================

    WEBHOOK_URL: '/api/webhook',

    // ===================================
    // НАСТРОЙКИ СТУДИИ
    // ===================================

    STUDIO: {
        name: 'Beauty Studio',
        logo: '💅',
        currency: '₽',
        currencyCode: 'RUB',
        phone: '+7 (999) 123-45-67',
        address: 'г. Москва, ул. Красоты, д. 1'
    },

    // ===================================
    // НАСТРОЙКИ РАСПИСАНИЯ
    // ===================================

    SCHEDULE: {
        workDays: [1, 2, 3, 4, 5, 6], // 0=Вс, 1=Пн, ... 6=Сб
        workHoursStart: 9,            // Начало работы (09:00)
        workHoursEnd: 20,             // Конец работы (20:00)
        slotDuration: 30,             // Длительность слота в минутах
        bookingDaysAhead: 14,         // На сколько дней вперёд можно записаться
        minBookingHoursAhead: 2       // Минимум часов до записи
    },

    // ===================================
    // КАТЕГОРИИ УСЛУГ
    // ===================================

    CATEGORIES: [
        { id: 'all', name: 'Все услуги', icon: '✨' },
        { id: 'hair', name: 'Парикмахер', icon: '💇' },
        { id: 'stylist', name: 'Стилист', icon: '💁' },
        { id: 'manicure', name: 'Маникюр', icon: '💅' },
        { id: 'pedicure', name: 'Педикюр', icon: '🦶' },
        { id: 'massage', name: 'Массаж', icon: '💆' }
    ],

    // ===================================
    // УСЛУГИ
    // ===================================

    SERVICES: [
        // Парикмахер
        {
            id: 'haircut-women',
            name: 'Женская стрижка',
            price: 1500,
            duration: 60, // минуты
            category: 'hair',
            description: 'Стрижка любой сложности с мытьём и укладкой',
            image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80'
        },
        {
            id: 'haircut-men',
            name: 'Мужская стрижка',
            price: 800,
            duration: 30,
            category: 'hair',
            description: 'Классическая мужская стрижка',
            image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80'
        },
        {
            id: 'hair-coloring',
            name: 'Окрашивание',
            price: 3500,
            duration: 120,
            category: 'hair',
            description: 'Профессиональное окрашивание волос',
            image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80'
        },
        {
            id: 'hair-styling',
            name: 'Укладка',
            price: 1000,
            duration: 45,
            category: 'hair',
            description: 'Укладка на любую длину волос',
            image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&q=80'
        },

        // Стилист
        {
            id: 'stylist-consultation',
            name: 'Консультация стилиста',
            price: 2000,
            duration: 60,
            category: 'stylist',
            description: 'Подбор образа и стиля',
            image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&q=80'
        },
        {
            id: 'evening-hairstyle',
            name: 'Вечерняя причёска',
            price: 2500,
            duration: 90,
            category: 'stylist',
            description: 'Создание праздничной причёски',
            image: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&q=80'
        },

        // Маникюр
        {
            id: 'manicure-classic',
            name: 'Классический маникюр',
            price: 800,
            duration: 45,
            category: 'manicure',
            description: 'Обработка кутикулы, придание формы ногтям',
            image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=80'
        },
        {
            id: 'manicure-gel',
            name: 'Маникюр с гель-лаком',
            price: 1500,
            duration: 90,
            category: 'manicure',
            description: 'Маникюр с покрытием гель-лаком',
            image: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=400&q=80'
        },
        {
            id: 'nail-extension',
            name: 'Наращивание ногтей',
            price: 3000,
            duration: 150,
            category: 'manicure',
            description: 'Наращивание гелем с дизайном',
            image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400&q=80'
        },

        // Педикюр
        {
            id: 'pedicure-classic',
            name: 'Классический педикюр',
            price: 1200,
            duration: 60,
            category: 'pedicure',
            description: 'Уход за ногтями и кожей стоп',
            image: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400&q=80'
        },
        {
            id: 'pedicure-gel',
            name: 'Педикюр с гель-лаком',
            price: 1800,
            duration: 90,
            category: 'pedicure',
            description: 'Педикюр с покрытием гель-лаком',
            image: 'https://images.unsplash.com/photo-1610992015732-2449b0bb0a71?w=400&q=80'
        },

        // Массаж
        {
            id: 'massage-back',
            name: 'Массаж спины',
            price: 1500,
            duration: 30,
            category: 'massage',
            description: 'Расслабляющий массаж спины',
            image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80'
        },
        {
            id: 'massage-full',
            name: 'Общий массаж',
            price: 3000,
            duration: 60,
            category: 'massage',
            description: 'Массаж всего тела',
            image: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400&q=80'
        },
        {
            id: 'massage-face',
            name: 'Массаж лица',
            price: 1200,
            duration: 30,
            category: 'massage',
            description: 'Омолаживающий массаж лица',
            image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=80'
        }
    ],

    // ===================================
    // МАСТЕРА
    // ===================================

    MASTERS: [
        {
            id: 'master-1',
            name: 'Анна Иванова',
            photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
            specialization: ['hair', 'stylist'],
            rating: 4.9,
            reviews: 127,
            experience: '5 лет',
            description: 'Топ-стилист, специалист по окрашиванию'
        },
        {
            id: 'master-2',
            name: 'Мария Петрова',
            photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
            specialization: ['manicure', 'pedicure'],
            rating: 4.8,
            reviews: 98,
            experience: '4 года',
            description: 'Мастер ногтевого сервиса'
        },
        {
            id: 'master-3',
            name: 'Елена Сидорова',
            photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80',
            specialization: ['massage'],
            rating: 5.0,
            reviews: 156,
            experience: '7 лет',
            description: 'Сертифицированный массажист'
        },
        {
            id: 'master-4',
            name: 'Ольга Козлова',
            photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
            specialization: ['hair'],
            rating: 4.7,
            reviews: 84,
            experience: '3 года',
            description: 'Парикмахер-универсал'
        },
        {
            id: 'master-5',
            name: 'Светлана Новикова',
            photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80',
            specialization: ['manicure'],
            rating: 4.9,
            reviews: 112,
            experience: '6 лет',
            description: 'Nail-дизайнер, специалист по наращиванию'
        }
    ],

    // ===================================
    // ДЕМО-БРОНИРОВАНИЯ (для демонстрации занятых слотов)
    // ===================================

    DEMO_BOOKINGS: [
        // Сегодня + 1 день
        { masterId: 'master-1', date: CONFIG_getDateString(1), time: '10:00' },
        { masterId: 'master-1', date: CONFIG_getDateString(1), time: '10:30' },
        { masterId: 'master-1', date: CONFIG_getDateString(1), time: '14:00' },
        { masterId: 'master-2', date: CONFIG_getDateString(1), time: '11:00' },
        { masterId: 'master-2', date: CONFIG_getDateString(1), time: '11:30' },
        // Сегодня + 2 дня
        { masterId: 'master-1', date: CONFIG_getDateString(2), time: '09:00' },
        { masterId: 'master-1', date: CONFIG_getDateString(2), time: '09:30' },
        { masterId: 'master-3', date: CONFIG_getDateString(2), time: '15:00' },
        { masterId: 'master-3', date: CONFIG_getDateString(2), time: '15:30' },
        // Сегодня + 3 дня
        { masterId: 'master-4', date: CONFIG_getDateString(3), time: '12:00' },
        { masterId: 'master-5', date: CONFIG_getDateString(3), time: '16:00' },
        { masterId: 'master-5', date: CONFIG_getDateString(3), time: '16:30' },
        { masterId: 'master-5', date: CONFIG_getDateString(3), time: '17:00' }
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

    // Получить услугу по ID
    getServiceById(id) {
        return this.SERVICES.find(s => s.id === id);
    },

    // Получить услуги по категории
    getServicesByCategory(categoryId) {
        if (categoryId === 'all') return this.SERVICES;
        return this.SERVICES.filter(s => s.category === categoryId);
    },

    // Получить мастера по ID
    getMasterById(id) {
        return this.MASTERS.find(m => m.id === id);
    },

    // Получить мастеров по специализации (категории услуги)
    getMastersByCategory(categoryId) {
        if (categoryId === 'all') return this.MASTERS;
        return this.MASTERS.filter(m => m.specialization.includes(categoryId));
    },

    // Получить мастеров, которые могут выполнить услугу
    getMastersForService(serviceId) {
        const service = this.getServiceById(serviceId);
        if (!service) return [];
        return this.MASTERS.filter(m => m.specialization.includes(service.category));
    },

    // Форматирование цены
    formatPrice(price) {
        return price.toLocaleString('ru-RU') + ' ' + this.STUDIO.currency;
    },

    // Форматирование длительности
    formatDuration(minutes) {
        if (minutes < 60) return `${minutes} мин`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (mins === 0) return `${hours} ч`;
        return `${hours} ч ${mins} мин`;
    },

    // Генерация временных слотов на день
    getTimeSlots() {
        const slots = [];
        const { workHoursStart, workHoursEnd, slotDuration } = this.SCHEDULE;

        for (let hour = workHoursStart; hour < workHoursEnd; hour++) {
            for (let min = 0; min < 60; min += slotDuration) {
                const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
                slots.push(time);
            }
        }
        return slots;
    },

    // Проверка, является ли день рабочим
    isWorkDay(date) {
        const dayOfWeek = date.getDay();
        return this.SCHEDULE.workDays.includes(dayOfWeek);
    },

    // Получить даты для календаря (14 дней вперёд)
    getBookingDates() {
        const dates = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < this.SCHEDULE.bookingDaysAhead; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            dates.push({
                date: date,
                dateString: this.formatDateString(date),
                dayName: this.getDayName(date),
                dayNumber: date.getDate(),
                month: this.getMonthName(date),
                isWorkDay: this.isWorkDay(date),
                isToday: i === 0
            });
        }
        return dates;
    },

    // Форматирование даты в строку YYYY-MM-DD
    formatDateString(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    // Получить название дня недели
    getDayName(date) {
        const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        return days[date.getDay()];
    },

    // Получить название месяца
    getMonthName(date) {
        const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
        return months[date.getMonth()];
    },

    // Форматирование даты для отображения
    formatDisplayDate(dateString) {
        const date = new Date(dateString);
        const day = date.getDate();
        const month = this.getMonthName(date);
        const dayName = this.getDayName(date);
        return `${day} ${month}, ${dayName}`;
    }
};

// Вспомогательная функция для генерации дат (используется в DEMO_BOOKINGS)
function CONFIG_getDateString(daysAhead) {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Экспорт для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

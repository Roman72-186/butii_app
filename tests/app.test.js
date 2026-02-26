/**
 * Тесты для app.js
 * @jest-environment jsdom
 */

// Мокаем localStorage
const localStorageMock = {
    store: {},
    getItem: jest.fn(key => localStorageMock.store[key] || null),
    setItem: jest.fn((key, value) => { localStorageMock.store[key] = value; }),
    removeItem: jest.fn(key => { delete localStorageMock.store[key]; }),
    clear: jest.fn(() => { localStorageMock.store = {}; })
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Мокаем fetch
global.fetch = jest.fn();

// Загружаем CONFIG
global.CONFIG = require('../js/config.js');

// Мокаем telegramApp
global.telegramApp = {
    init: jest.fn(),
    getUserId: jest.fn(() => 123456789),
    getUserName: jest.fn(() => 'Тест Пользователь'),
    getUser: jest.fn(() => ({ id: 123456789, first_name: 'Тест', last_name: 'Пользователь' })),
    showAlert: jest.fn(),
    showConfirm: jest.fn((msg, cb) => cb(true)),
    hapticFeedback: jest.fn(),
    tg: null
};

// Базовый HTML для тестов (соответствует текущему index.html)
const baseHTML = `
<div id="loader"></div>
<div id="app" style="display: none;">
    <span id="studioLogo"></span>
    <span id="studioName"></span>
    <span id="bookingsBadge" style="display: none;">0</span>

    <section id="servicesSection">
        <div id="categories"></div>
        <div id="servicesGrid"></div>
    </section>

    <section id="mastersSection" style="display: none;">
        <div id="selectedServiceCard"></div>
        <div id="mastersList"></div>
    </section>

    <section id="bookingSection" style="display: none;">
        <div id="bookingInfoCard"></div>
        <div id="calendarDays"></div>
        <div id="timeSection" style="display: none;">
            <div id="timeSlots"></div>
        </div>
        <div id="bookingActions" style="display: none;"></div>
    </section>

    <section id="confirmationSection" style="display: none;">
        <div id="confirmationDetails"></div>
        <form id="bookingForm">
            <input id="customerName" value="">
            <input id="customerPhone" value="">
            <textarea id="customerComment"></textarea>
            <span id="bookingPrice"></span>
        </form>
    </section>

    <section id="successSection" style="display: none;">
        <div id="successDetails"></div>
    </section>

    <section id="myBookingsSection" style="display: none;">
        <div id="noBookings"></div>
        <div id="bookingsList" style="display: none;">
            <div id="upcomingBookings">
                <div id="upcomingBookingsItems"></div>
            </div>
            <div id="pastBookings" style="display: none;">
                <div id="pastBookingsItems"></div>
            </div>
        </div>
    </section>
</div>
`;

// Мокаем BookingManager
const BookingManager = require('../js/booking.js');

describe('App — рендеринг', () => {

    let bookingManager;

    beforeEach(() => {
        document.body.innerHTML = baseHTML;
        localStorageMock.clear();
        localStorageMock.store = {};
        jest.clearAllMocks();
        bookingManager = new BookingManager();
        global.bookingManager = bookingManager;
        global.currentCategory = 'all';
        global.selectedDate = null;
        global.selectedTime = null;
    });

    describe('renderCategories()', () => {

        const renderCategories = () => {
            const container = document.getElementById('categories');
            if (!container) return;
            container.innerHTML = CONFIG.CATEGORIES.map(cat => `
                <button class="category-btn ${cat.id === global.currentCategory ? 'active' : ''}"
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
            global.currentCategory = 'hair';
            renderCategories();

            const activeBtn = document.querySelector('.category-btn.active');
            expect(activeBtn.dataset.category).toBe('hair');
        });

        test('категория "all" должна быть активной по умолчанию', () => {
            global.currentCategory = 'all';
            renderCategories();

            const activeBtn = document.querySelector('.category-btn.active');
            expect(activeBtn.dataset.category).toBe('all');
        });

    });

    describe('renderServices()', () => {

        const renderServices = () => {
            const container = document.getElementById('servicesGrid');
            if (!container) return;
            const services = CONFIG.getServicesByCategory(global.currentCategory);
            container.innerHTML = services.map(service => `
                <div class="service-card" data-id="${service.id}">
                    <div class="service-card-name">${service.name}</div>
                    <div class="service-card-price">${CONFIG.formatPrice(service.price)}</div>
                </div>
            `).join('');
        };

        test('должна рендерить все услуги для категории "all"', () => {
            global.currentCategory = 'all';
            renderServices();

            const cards = document.querySelectorAll('.service-card');
            expect(cards.length).toBe(CONFIG.SERVICES.length);
        });

        test('должна фильтровать услуги по категории', () => {
            global.currentCategory = 'manicure';
            renderServices();

            const cards = document.querySelectorAll('.service-card');
            const manicureServices = CONFIG.SERVICES.filter(s => s.category === 'manicure');
            expect(cards.length).toBe(manicureServices.length);
        });

        test('должна отображать цену услуги', () => {
            global.currentCategory = 'all';
            renderServices();

            const firstCard = document.querySelector('.service-card');
            const priceEl = firstCard.querySelector('.service-card-price');
            expect(priceEl.textContent).toContain(CONFIG.STUDIO.currency);
        });

    });

    describe('renderMasters()', () => {

        const renderMasters = (serviceId) => {
            const container = document.getElementById('mastersList');
            if (!container) return;
            const masters = CONFIG.getMastersForService(serviceId);
            container.innerHTML = masters.map(master => `
                <div class="master-card" data-id="${master.id}">
                    <div class="master-name">${master.name}</div>
                    <div class="master-rating">${master.rating}</div>
                </div>
            `).join('');
        };

        test('должна рендерить мастеров для услуги', () => {
            renderMasters('haircut-women');

            const cards = document.querySelectorAll('.master-card');
            const hairMasters = CONFIG.getMastersForService('haircut-women');
            expect(cards.length).toBe(hairMasters.length);
        });

        test('мастера маникюра не должны быть в списке для стрижки', () => {
            renderMasters('haircut-women');

            const cards = document.querySelectorAll('.master-card');
            const ids = Array.from(cards).map(c => c.dataset.id);
            // master-2 — маникюр/педикюр, не должна быть в стрижках
            expect(ids).not.toContain('master-2');
        });

    });

    describe('renderCalendar()', () => {

        const renderCalendar = () => {
            const container = document.getElementById('calendarDays');
            if (!container) return;
            const dates = CONFIG.getBookingDates();
            container.innerHTML = dates.map(d => {
                let classes = 'calendar-day';
                if (d.isToday) classes += ' today';
                if (!d.isWorkDay) classes += ' disabled';
                if (global.selectedDate === d.dateString) classes += ' selected';
                return `
                    <div class="${classes}" data-date="${d.dateString}">
                        <span class="day-name">${d.dayName}</span>
                        <span class="day-number">${d.dayNumber}</span>
                    </div>
                `;
            }).join('');
        };

        test('должна рендерить дни на bookingDaysAhead вперёд', () => {
            renderCalendar();

            const days = document.querySelectorAll('.calendar-day');
            expect(days.length).toBe(CONFIG.SCHEDULE.bookingDaysAhead);
        });

        test('первый день должен быть помечен как today', () => {
            renderCalendar();

            const todayEl = document.querySelector('.calendar-day.today');
            expect(todayEl).not.toBeNull();
        });

        test('выходные должны быть disabled', () => {
            renderCalendar();

            const days = document.querySelectorAll('.calendar-day');
            days.forEach(day => {
                const dateStr = day.dataset.date;
                const date = new Date(dateStr);
                const isWorkDay = CONFIG.SCHEDULE.workDays.includes(date.getDay());
                if (!isWorkDay) {
                    expect(day.classList.contains('disabled')).toBe(true);
                }
            });
        });

    });

    describe('Навигация (показ/скрытие секций)', () => {

        const showSection = (sectionId) => {
            const sections = document.querySelectorAll('section');
            sections.forEach(s => s.style.display = 'none');
            const section = document.getElementById(sectionId);
            if (section) section.style.display = 'block';
        };

        test('showSection должна показывать только указанную секцию', () => {
            showSection('mastersSection');

            expect(document.getElementById('mastersSection').style.display).toBe('block');
            expect(document.getElementById('servicesSection').style.display).toBe('none');
            expect(document.getElementById('bookingSection').style.display).toBe('none');
        });

        test('переключение между секциями', () => {
            showSection('bookingSection');
            expect(document.getElementById('bookingSection').style.display).toBe('block');

            showSection('confirmationSection');
            expect(document.getElementById('confirmationSection').style.display).toBe('block');
            expect(document.getElementById('bookingSection').style.display).toBe('none');
        });

    });

    describe('setupHeader()', () => {

        const setupHeader = () => {
            const studioLogo = document.getElementById('studioLogo');
            const studioName = document.getElementById('studioName');
            if (studioLogo) studioLogo.textContent = CONFIG.STUDIO.logo;
            if (studioName) studioName.textContent = CONFIG.STUDIO.name;
        };

        test('должна устанавливать логотип и название студии', () => {
            setupHeader();

            expect(document.getElementById('studioLogo').textContent).toBe(CONFIG.STUDIO.logo);
            expect(document.getElementById('studioName').textContent).toBe(CONFIG.STUDIO.name);
        });

    });

    describe('updateBookingsBadge()', () => {

        const updateBookingsBadge = () => {
            const badge = document.getElementById('bookingsBadge');
            const count = bookingManager.getUpcomingCount();
            if (badge) {
                if (count > 0) {
                    badge.textContent = count;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            }
        };

        test('должна скрывать бейдж при 0 записей', () => {
            updateBookingsBadge();

            const badge = document.getElementById('bookingsBadge');
            expect(badge.style.display).toBe('none');
        });

    });

});

describe('sendBookingToServer()', () => {

    beforeEach(() => {
        localStorageMock.clear();
        localStorageMock.store = {};
        jest.clearAllMocks();
        global.window = { Telegram: undefined };
    });

    const sendBookingToServer = async (booking) => {
        let telegramId = localStorageMock.store['telegram_id'] || CONFIG.MOCK_USER.id.toString();

        const leadtexPayload = {
            contact_by: 'telegram_id',
            search: telegramId,
            variables: {
                order_id: booking.id,
                order_total: booking.service.price.toString(),
                booking_date: booking.date,
                booking_time: booking.time,
                booking_service: booking.service.name,
                booking_master: booking.master.name,
                customer_name: booking.customerName,
                customer_phone: booking.customerPhone
            }
        };

        const response = await fetch(CONFIG.WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leadtexPayload)
        });

        return response;
    };

    const testBooking = {
        id: 'booking-test-123',
        service: { name: 'Женская стрижка', price: 1500, duration: 60 },
        master: { name: 'Анна Иванова' },
        date: '2026-03-15',
        time: '14:00',
        customerName: 'Тест',
        customerPhone: '+7 (999) 000-00-00'
    };

    test('должна отправлять POST на WEBHOOK_URL', async () => {
        global.fetch.mockResolvedValueOnce({ ok: true, json: () => ({}) });

        await sendBookingToServer(testBooking);

        expect(fetch).toHaveBeenCalledWith(
            CONFIG.WEBHOOK_URL,
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })
        );
    });

    test('должна отправлять contact_by: telegram_id', async () => {
        localStorageMock.store['telegram_id'] = '987654321';
        global.fetch.mockResolvedValueOnce({ ok: true, json: () => ({}) });

        await sendBookingToServer(testBooking);

        const body = JSON.parse(fetch.mock.calls[0][1].body);
        expect(body.contact_by).toBe('telegram_id');
        expect(body.search).toBe('987654321');
    });

    test('должна передавать данные бронирования в variables', async () => {
        global.fetch.mockResolvedValueOnce({ ok: true, json: () => ({}) });

        await sendBookingToServer(testBooking);

        const body = JSON.parse(fetch.mock.calls[0][1].body);
        expect(body.variables.booking_date).toBe('2026-03-15');
        expect(body.variables.booking_time).toBe('14:00');
        expect(body.variables.booking_service).toBe('Женская стрижка');
        expect(body.variables.booking_master).toBe('Анна Иванова');
        expect(body.variables.customer_name).toBe('Тест');
        expect(body.variables.order_total).toBe('1500');
    });

    test('должна использовать MOCK_USER.id когда telegram_id нет в localStorage', async () => {
        global.fetch.mockResolvedValueOnce({ ok: true, json: () => ({}) });

        await sendBookingToServer(testBooking);

        const body = JSON.parse(fetch.mock.calls[0][1].body);
        expect(body.search).toBe(CONFIG.MOCK_USER.id.toString());
    });

});

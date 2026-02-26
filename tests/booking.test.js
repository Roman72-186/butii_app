/**
 * Тесты для booking.js (BookingManager)
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

// Загружаем CONFIG
global.CONFIG = require('../js/config.js');

// Загружаем BookingManager
const BookingManager = require('../js/booking.js');

// Тестовые данные
const testServiceId = 'haircut-women';
const testMasterId = 'master-1';

// Получаем дату через 3 дня (гарантированно в будущем и не заблокирована minBookingHoursAhead)
function getFutureDate(daysAhead = 3) {
    const date = new Date();
    date.setDate(date.getDate() + daysAhead);
    return CONFIG.formatDateString(date);
}

describe('BookingManager', () => {

    let manager;

    beforeEach(() => {
        localStorageMock.clear();
        localStorageMock.store = {};
        jest.clearAllMocks();
        manager = new BookingManager();
    });

    describe('Инициализация', () => {

        test('должен создаваться с пустым массивом bookings', () => {
            expect(manager.bookings).toEqual([]);
        });

        test('должен создаваться с currentBooking = null', () => {
            expect(manager.currentBooking).toBeNull();
        });

        test('должен загружать бронирования из localStorage', () => {
            const service = CONFIG.getServiceById(testServiceId);
            const master = CONFIG.getMasterById(testMasterId);
            const saved = [{
                id: 'booking-test',
                serviceId: testServiceId,
                service: service,
                masterId: testMasterId,
                master: master,
                date: '2026-03-10',
                time: '14:00',
                status: 'confirmed'
            }];
            localStorageMock.store['beautyStudioBookings'] = JSON.stringify(saved);

            const newManager = new BookingManager();
            expect(newManager.bookings.length).toBe(1);
            expect(newManager.bookings[0].id).toBe('booking-test');
        });

    });

    describe('startBooking()', () => {

        test('должен начинать новое бронирование с указанной услугой', () => {
            const booking = manager.startBooking(testServiceId);

            expect(booking).not.toBeNull();
            expect(booking.serviceId).toBe(testServiceId);
            expect(booking.service.name).toBe('Женская стрижка');
            expect(booking.status).toBe('pending');
        });

        test('должен возвращать null для несуществующей услуги', () => {
            const booking = manager.startBooking('non-existent');
            expect(booking).toBeNull();
        });

        test('должен генерировать уникальный ID', () => {
            const booking1 = manager.startBooking(testServiceId);
            const id1 = booking1.id;
            const booking2 = manager.startBooking(testServiceId);
            const id2 = booking2.id;
            expect(id1).not.toBe(id2);
        });

    });

    describe('selectMaster()', () => {

        test('должен выбирать мастера', () => {
            manager.startBooking(testServiceId);
            const booking = manager.selectMaster(testMasterId);

            expect(booking.masterId).toBe(testMasterId);
            expect(booking.master.name).toBe('Анна Иванова');
        });

        test('должен возвращать null без активного бронирования', () => {
            expect(manager.selectMaster(testMasterId)).toBeNull();
        });

        test('должен возвращать null для несуществующего мастера', () => {
            manager.startBooking(testServiceId);
            expect(manager.selectMaster('non-existent')).toBeNull();
        });

    });

    describe('selectDate() и selectTime()', () => {

        beforeEach(() => {
            manager.startBooking(testServiceId);
            manager.selectMaster(testMasterId);
        });

        test('должен выбирать дату', () => {
            const date = getFutureDate();
            const booking = manager.selectDate(date);
            expect(booking.date).toBe(date);
        });

        test('при смене даты должен сбрасывать время', () => {
            manager.selectDate(getFutureDate(3));
            manager.selectTime('14:00');
            manager.selectDate(getFutureDate(4));

            expect(manager.getCurrentBooking().time).toBeNull();
        });

        test('должен выбирать время', () => {
            manager.selectDate(getFutureDate());
            const booking = manager.selectTime('14:00');
            expect(booking.time).toBe('14:00');
        });

    });

    describe('setCustomerInfo()', () => {

        test('должен устанавливать контактные данные', () => {
            manager.startBooking(testServiceId);
            const booking = manager.setCustomerInfo('Иван', '+7 (999) 123-45-67', 'Комментарий');

            expect(booking.customerName).toBe('Иван');
            expect(booking.customerPhone).toBe('+7 (999) 123-45-67');
            expect(booking.customerComment).toBe('Комментарий');
        });

        test('должен возвращать null без активного бронирования', () => {
            expect(manager.setCustomerInfo('Иван', '+7999')).toBeNull();
        });

    });

    describe('isBookingReady()', () => {

        test('должен возвращать false без активного бронирования', () => {
            expect(manager.isBookingReady()).toBe(false);
        });

        test('должен возвращать falsy если не все данные заполнены', () => {
            manager.startBooking(testServiceId);
            expect(manager.isBookingReady()).toBeFalsy();

            manager.selectMaster(testMasterId);
            expect(manager.isBookingReady()).toBeFalsy();

            manager.selectDate(getFutureDate());
            expect(manager.isBookingReady()).toBeFalsy();
        });

        test('должен возвращать truthy когда всё заполнено', () => {
            manager.startBooking(testServiceId);
            manager.selectMaster(testMasterId);
            manager.selectDate(getFutureDate());
            manager.selectTime('14:00');

            expect(manager.isBookingReady()).toBeTruthy();
        });

    });

    describe('confirmBooking()', () => {

        function createFullBooking() {
            manager.startBooking(testServiceId);
            manager.selectMaster(testMasterId);
            manager.selectDate(getFutureDate());
            manager.selectTime('14:00');
            manager.setCustomerInfo('Тест', '+7 (999) 000-00-00');
        }

        test('должен подтверждать бронирование и добавлять в список', () => {
            createFullBooking();
            const confirmed = manager.confirmBooking();

            expect(confirmed).not.toBeNull();
            expect(confirmed.status).toBe('confirmed');
            expect(confirmed.confirmedAt).toBeDefined();
            expect(manager.bookings.length).toBe(1);
        });

        test('должен сбрасывать currentBooking после подтверждения', () => {
            createFullBooking();
            manager.confirmBooking();

            expect(manager.getCurrentBooking()).toBeNull();
        });

        test('должен сохранять в localStorage', () => {
            createFullBooking();
            manager.confirmBooking();

            expect(localStorage.setItem).toHaveBeenCalledWith(
                'beautyStudioBookings',
                expect.any(String)
            );
        });

        test('должен возвращать null без активного бронирования', () => {
            expect(manager.confirmBooking()).toBeNull();
        });

        test('должен возвращать null если бронирование не готово', () => {
            manager.startBooking(testServiceId);
            // Не выбран мастер, дата, время
            expect(manager.confirmBooking()).toBeNull();
        });

    });

    describe('cancelBooking()', () => {

        test('должен отменять бронирование', () => {
            manager.startBooking(testServiceId);
            manager.selectMaster(testMasterId);
            manager.selectDate(getFutureDate());
            manager.selectTime('14:00');
            const confirmed = manager.confirmBooking();

            const success = manager.cancelBooking(confirmed.id);

            expect(success).toBe(true);
            expect(manager.bookings[0].status).toBe('cancelled');
            expect(manager.bookings[0].cancelledAt).toBeDefined();
        });

        test('должен возвращать false для несуществующего ID', () => {
            expect(manager.cancelBooking('non-existent')).toBe(false);
        });

    });

    describe('getUpcomingBookings() и getPastBookings()', () => {

        function addBooking(daysAhead, time = '14:00') {
            manager.startBooking(testServiceId);
            manager.selectMaster(testMasterId);
            manager.selectDate(getFutureDate(daysAhead));
            manager.selectTime(time);
            return manager.confirmBooking();
        }

        test('должен разделять бронирования на предстоящие и прошедшие', () => {
            // Будущая запись
            addBooking(5);

            const upcoming = manager.getUpcomingBookings();
            expect(upcoming.length).toBe(1);
        });

        test('отменённые бронирования должны быть в прошедших', () => {
            const booking = addBooking(5);
            manager.cancelBooking(booking.id);

            expect(manager.getUpcomingBookings().length).toBe(0);
            expect(manager.getPastBookings().length).toBe(1);
        });

    });

    describe('getAvailableSlots()', () => {

        test('должен возвращать доступные слоты', () => {
            const date = getFutureDate(5);
            const slots = manager.getAvailableSlots(testMasterId, date, 60);

            expect(Array.isArray(slots)).toBe(true);
            expect(slots.length).toBeGreaterThan(0);
        });

        test('занятые слоты не должны быть в доступных', () => {
            const date = getFutureDate(5);

            // Создаём бронирование на 14:00
            manager.startBooking(testServiceId);
            manager.selectMaster(testMasterId);
            manager.selectDate(date);
            manager.selectTime('14:00');
            manager.confirmBooking();

            // Проверяем: 14:00 и 14:30 заняты (услуга 60 мин = 2 слота по 30 мин)
            const available = manager.getAvailableSlots(testMasterId, date, 30);
            expect(available).not.toContain('14:00');
            expect(available).not.toContain('14:30');
        });

        test('демо-бронирования должны блокировать слоты', () => {
            // DEMO_BOOKINGS содержит записи для master-1 на date +1 день
            const tomorrow = getFutureDate(1);
            const bookedSlots = manager.getBookedSlots('master-1', tomorrow);

            // Должны быть занятые слоты из демо-данных
            expect(bookedSlots.length).toBeGreaterThan(0);
        });

    });

    describe('resetCurrentBooking()', () => {

        test('должен сбрасывать текущее бронирование', () => {
            manager.startBooking(testServiceId);
            expect(manager.getCurrentBooking()).not.toBeNull();

            manager.resetCurrentBooking();
            expect(manager.getCurrentBooking()).toBeNull();
        });

    });

    describe('clearAll()', () => {

        test('должен очищать все бронирования', () => {
            manager.startBooking(testServiceId);
            manager.selectMaster(testMasterId);
            manager.selectDate(getFutureDate());
            manager.selectTime('14:00');
            manager.confirmBooking();

            manager.clearAll();

            expect(manager.bookings).toEqual([]);
            expect(manager.currentBooking).toBeNull();
        });

    });

    describe('generateId()', () => {

        test('должен генерировать строку с префиксом booking-', () => {
            const id = manager.generateId();
            expect(id.startsWith('booking-')).toBe(true);
        });

        test('должен генерировать уникальные ID', () => {
            const ids = new Set();
            for (let i = 0; i < 100; i++) {
                ids.add(manager.generateId());
            }
            expect(ids.size).toBe(100);
        });

    });

});

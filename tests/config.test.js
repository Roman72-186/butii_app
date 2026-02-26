/**
 * Тесты для config.js
 * @jest-environment jsdom
 */

const CONFIG = require('../js/config.js');

describe('CONFIG', () => {

    describe('Структура конфигурации', () => {

        test('должен содержать WEBHOOK_URL', () => {
            expect(CONFIG.WEBHOOK_URL).toBeDefined();
            expect(typeof CONFIG.WEBHOOK_URL).toBe('string');
        });

        test('должен содержать настройки студии STUDIO', () => {
            expect(CONFIG.STUDIO).toBeDefined();
            expect(CONFIG.STUDIO.name).toBeDefined();
            expect(CONFIG.STUDIO.logo).toBeDefined();
            expect(CONFIG.STUDIO.currency).toBeDefined();
            expect(CONFIG.STUDIO.currencyCode).toBeDefined();
            expect(CONFIG.STUDIO.phone).toBeDefined();
            expect(CONFIG.STUDIO.address).toBeDefined();
        });

        test('должен содержать настройки расписания SCHEDULE', () => {
            expect(CONFIG.SCHEDULE).toBeDefined();
            expect(CONFIG.SCHEDULE.workDays).toBeDefined();
            expect(Array.isArray(CONFIG.SCHEDULE.workDays)).toBe(true);
            expect(CONFIG.SCHEDULE.workHoursStart).toBeDefined();
            expect(CONFIG.SCHEDULE.workHoursEnd).toBeDefined();
            expect(CONFIG.SCHEDULE.slotDuration).toBeDefined();
            expect(CONFIG.SCHEDULE.bookingDaysAhead).toBeDefined();
            expect(CONFIG.SCHEDULE.minBookingHoursAhead).toBeDefined();
        });

        test('должен содержать категории CATEGORIES', () => {
            expect(CONFIG.CATEGORIES).toBeDefined();
            expect(Array.isArray(CONFIG.CATEGORIES)).toBe(true);
            expect(CONFIG.CATEGORIES.length).toBeGreaterThan(0);
        });

        test('должен содержать услуги SERVICES', () => {
            expect(CONFIG.SERVICES).toBeDefined();
            expect(Array.isArray(CONFIG.SERVICES)).toBe(true);
            expect(CONFIG.SERVICES.length).toBeGreaterThan(0);
        });

        test('должен содержать мастеров MASTERS', () => {
            expect(CONFIG.MASTERS).toBeDefined();
            expect(Array.isArray(CONFIG.MASTERS)).toBe(true);
            expect(CONFIG.MASTERS.length).toBeGreaterThan(0);
        });

        test('должен содержать демо-бронирования DEMO_BOOKINGS', () => {
            expect(CONFIG.DEMO_BOOKINGS).toBeDefined();
            expect(Array.isArray(CONFIG.DEMO_BOOKINGS)).toBe(true);
        });

    });

    describe('Валидация категорий', () => {

        test('каждая категория должна иметь id, name, icon', () => {
            CONFIG.CATEGORIES.forEach(category => {
                expect(category.id).toBeDefined();
                expect(typeof category.id).toBe('string');
                expect(category.name).toBeDefined();
                expect(typeof category.name).toBe('string');
                expect(category.icon).toBeDefined();
            });
        });

        test('должна быть категория "all"', () => {
            const allCategory = CONFIG.CATEGORIES.find(c => c.id === 'all');
            expect(allCategory).toBeDefined();
        });

        test('ID категорий должны быть уникальными', () => {
            const ids = CONFIG.CATEGORIES.map(c => c.id);
            const uniqueIds = [...new Set(ids)];
            expect(ids.length).toBe(uniqueIds.length);
        });

    });

    describe('Валидация услуг', () => {

        test('каждая услуга должна иметь обязательные поля', () => {
            CONFIG.SERVICES.forEach(service => {
                expect(service.id).toBeDefined();
                expect(service.name).toBeDefined();
                expect(typeof service.price).toBe('number');
                expect(service.price).toBeGreaterThan(0);
                expect(typeof service.duration).toBe('number');
                expect(service.duration).toBeGreaterThan(0);
                expect(service.category).toBeDefined();
                expect(service.description).toBeDefined();
                expect(service.image).toBeDefined();
            });
        });

        test('ID услуг должны быть уникальными', () => {
            const ids = CONFIG.SERVICES.map(s => s.id);
            const uniqueIds = [...new Set(ids)];
            expect(ids.length).toBe(uniqueIds.length);
        });

        test('категория каждой услуги должна существовать', () => {
            const categoryIds = CONFIG.CATEGORIES.map(c => c.id);

            CONFIG.SERVICES.forEach(service => {
                expect(categoryIds).toContain(service.category);
            });
        });

    });

    describe('Валидация мастеров', () => {

        test('каждый мастер должен иметь обязательные поля', () => {
            CONFIG.MASTERS.forEach(master => {
                expect(master.id).toBeDefined();
                expect(master.name).toBeDefined();
                expect(master.photo).toBeDefined();
                expect(Array.isArray(master.specialization)).toBe(true);
                expect(master.specialization.length).toBeGreaterThan(0);
                expect(typeof master.rating).toBe('number');
                expect(master.rating).toBeGreaterThanOrEqual(1);
                expect(master.rating).toBeLessThanOrEqual(5);
            });
        });

        test('ID мастеров должны быть уникальными', () => {
            const ids = CONFIG.MASTERS.map(m => m.id);
            const uniqueIds = [...new Set(ids)];
            expect(ids.length).toBe(uniqueIds.length);
        });

        test('специализации мастеров должны соответствовать существующим категориям', () => {
            const categoryIds = CONFIG.CATEGORIES.map(c => c.id).filter(id => id !== 'all');

            CONFIG.MASTERS.forEach(master => {
                master.specialization.forEach(spec => {
                    expect(categoryIds).toContain(spec);
                });
            });
        });

    });

    describe('getServiceById()', () => {

        test('должен вернуть услугу по существующему ID', () => {
            const firstService = CONFIG.SERVICES[0];
            const found = CONFIG.getServiceById(firstService.id);

            expect(found).toBeDefined();
            expect(found.id).toBe(firstService.id);
            expect(found.name).toBe(firstService.name);
        });

        test('должен вернуть undefined для несуществующего ID', () => {
            const found = CONFIG.getServiceById('non-existent-id');
            expect(found).toBeUndefined();
        });

    });

    describe('getServicesByCategory()', () => {

        test('должен вернуть все услуги для категории "all"', () => {
            const services = CONFIG.getServicesByCategory('all');
            expect(services.length).toBe(CONFIG.SERVICES.length);
        });

        test('должен вернуть услуги только указанной категории', () => {
            const services = CONFIG.getServicesByCategory('hair');
            services.forEach(service => {
                expect(service.category).toBe('hair');
            });
            expect(services.length).toBeGreaterThan(0);
        });

        test('должен вернуть пустой массив для несуществующей категории', () => {
            const services = CONFIG.getServicesByCategory('non-existent');
            expect(services).toEqual([]);
        });

    });

    describe('getMasterById()', () => {

        test('должен вернуть мастера по существующему ID', () => {
            const firstMaster = CONFIG.MASTERS[0];
            const found = CONFIG.getMasterById(firstMaster.id);

            expect(found).toBeDefined();
            expect(found.id).toBe(firstMaster.id);
        });

        test('должен вернуть undefined для несуществующего ID', () => {
            expect(CONFIG.getMasterById('non-existent')).toBeUndefined();
        });

    });

    describe('getMastersForService()', () => {

        test('должен вернуть мастеров подходящей специализации', () => {
            const hairService = CONFIG.SERVICES.find(s => s.category === 'hair');
            const masters = CONFIG.getMastersForService(hairService.id);

            expect(masters.length).toBeGreaterThan(0);
            masters.forEach(master => {
                expect(master.specialization).toContain('hair');
            });
        });

        test('должен вернуть пустой массив для несуществующей услуги', () => {
            const masters = CONFIG.getMastersForService('non-existent');
            expect(masters).toEqual([]);
        });

    });

    describe('formatPrice()', () => {

        test('должен форматировать цену с символом валюты', () => {
            const formatted = CONFIG.formatPrice(1500);
            expect(formatted).toContain(CONFIG.STUDIO.currency);
        });

        test('должен форматировать ноль', () => {
            const formatted = CONFIG.formatPrice(0);
            expect(formatted).toContain('0');
            expect(formatted).toContain(CONFIG.STUDIO.currency);
        });

    });

    describe('formatDuration()', () => {

        test('должен форматировать минуты', () => {
            expect(CONFIG.formatDuration(30)).toBe('30 мин');
            expect(CONFIG.formatDuration(45)).toBe('45 мин');
        });

        test('должен форматировать часы', () => {
            expect(CONFIG.formatDuration(60)).toBe('1 ч');
            expect(CONFIG.formatDuration(120)).toBe('2 ч');
        });

        test('должен форматировать часы и минуты', () => {
            expect(CONFIG.formatDuration(90)).toBe('1 ч 30 мин');
            expect(CONFIG.formatDuration(150)).toBe('2 ч 30 мин');
        });

    });

    describe('getTimeSlots()', () => {

        test('должен возвращать массив временных слотов', () => {
            const slots = CONFIG.getTimeSlots();
            expect(Array.isArray(slots)).toBe(true);
            expect(slots.length).toBeGreaterThan(0);
        });

        test('первый слот должен соответствовать началу рабочего дня', () => {
            const slots = CONFIG.getTimeSlots();
            const expectedStart = `${CONFIG.SCHEDULE.workHoursStart.toString().padStart(2, '0')}:00`;
            expect(slots[0]).toBe(expectedStart);
        });

        test('последний слот должен быть до конца рабочего дня', () => {
            const slots = CONFIG.getTimeSlots();
            const lastSlot = slots[slots.length - 1];
            const [hours, minutes] = lastSlot.split(':').map(Number);
            const lastSlotMinutes = hours * 60 + minutes;
            const endMinutes = CONFIG.SCHEDULE.workHoursEnd * 60;
            expect(lastSlotMinutes).toBeLessThan(endMinutes);
        });

        test('интервал между слотами должен быть slotDuration', () => {
            const slots = CONFIG.getTimeSlots();
            if (slots.length >= 2) {
                const [h1, m1] = slots[0].split(':').map(Number);
                const [h2, m2] = slots[1].split(':').map(Number);
                const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
                expect(diff).toBe(CONFIG.SCHEDULE.slotDuration);
            }
        });

    });

    describe('isWorkDay()', () => {

        test('должен возвращать true для рабочих дней', () => {
            // Понедельник (1) — рабочий день
            const monday = new Date('2026-03-02'); // понедельник
            expect(CONFIG.isWorkDay(monday)).toBe(true);
        });

        test('должен возвращать false для выходных', () => {
            // Воскресенье (0) — выходной
            const sunday = new Date('2026-03-01'); // воскресенье
            expect(CONFIG.isWorkDay(sunday)).toBe(false);
        });

    });

    describe('getBookingDates()', () => {

        test('должен возвращать массив дат', () => {
            const dates = CONFIG.getBookingDates();
            expect(Array.isArray(dates)).toBe(true);
            expect(dates.length).toBe(CONFIG.SCHEDULE.bookingDaysAhead);
        });

        test('каждая дата должна иметь нужные поля', () => {
            const dates = CONFIG.getBookingDates();
            dates.forEach(d => {
                expect(d.date).toBeInstanceOf(Date);
                expect(d.dateString).toBeDefined();
                expect(d.dayName).toBeDefined();
                expect(d.dayNumber).toBeDefined();
                expect(d.month).toBeDefined();
                expect(typeof d.isWorkDay).toBe('boolean');
                expect(typeof d.isToday).toBe('boolean');
            });
        });

        test('первая дата должна быть сегодня', () => {
            const dates = CONFIG.getBookingDates();
            expect(dates[0].isToday).toBe(true);
        });

    });

    describe('formatDateString()', () => {

        test('должен возвращать дату в формате YYYY-MM-DD', () => {
            const date = new Date(2026, 2, 15); // 15 марта 2026
            expect(CONFIG.formatDateString(date)).toBe('2026-03-15');
        });

        test('должен дополнять нулями однозначные числа', () => {
            const date = new Date(2026, 0, 5); // 5 января 2026
            expect(CONFIG.formatDateString(date)).toBe('2026-01-05');
        });

    });

});

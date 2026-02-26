// ===================================
// BEAUTY STUDIO - ГЛАВНОЕ ПРИЛОЖЕНИЕ
// ===================================

// Состояние приложения
let currentCategory = 'all';
let selectedDate = null;
let selectedTime = null;
let currentTab = 'services';

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
    renderServices();

    // Обновить бейдж записей
    updateBookingsBadge();

    // Инициализация маски телефона
    initPhoneMask();

    // Установить дефолтную видимость табов (гость)
    if (typeof updateAuthTabs === 'function') {
        updateAuthTabs();
    }

    // Проверить сохранённую сессию (авто-вход)
    if (typeof checkCabinetSession === 'function') {
        checkCabinetSession();
    }

    // Скрыть лоадер и показать приложение
    setTimeout(() => {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('app').style.display = 'block';
    }, 500);
}

function setupHeader() {
    const studioLogo = document.getElementById('studioLogo');
    const studioName = document.getElementById('studioName');

    if (studioLogo) studioLogo.textContent = CONFIG.STUDIO.logo;
    if (studioName) studioName.textContent = CONFIG.STUDIO.name;
}

// ===================================
// НАВИГАЦИЯ ТАБОВ
// ===================================

function switchTab(tabName) {
    currentTab = tabName;

    // Скрыть все табы
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Показать нужный таб
    const tabEl = document.getElementById('tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
    if (tabEl) {
        tabEl.classList.add('active');
    }

    // Обновить кнопки навигации
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });

    // Действия при переходе на таб
    if (tabName === 'services') {
        // Показать секцию услуг, скрыть остальные секции booking flow
        const servicesTab = document.getElementById('tabServices');
        if (servicesTab) {
            servicesTab.querySelectorAll('section').forEach(s => s.style.display = 'none');
            const servicesSection = document.getElementById('servicesSection');
            if (servicesSection) servicesSection.style.display = 'block';
        }
    } else if (tabName === 'bookings') {
        renderMyBookings();
    }

    window.scrollTo(0, 0);

    // Haptic feedback
    if (typeof telegramApp !== 'undefined') {
        telegramApp.hapticFeedback('light');
    }
}

// ===================================
// НАВИГАЦИЯ СЕКЦИЙ
// ===================================

function showSection(sectionId) {
    // Скрыть все секции внутри текущего таба
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
        activeTab.querySelectorAll('section').forEach(s => s.style.display = 'none');
    }

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

function showServices() {
    showSection('servicesSection');
    bookingManager.resetCurrentBooking();
    selectedDate = null;
    selectedTime = null;
}

function showMasters(serviceId) {
    // Начать бронирование
    bookingManager.startBooking(serviceId);

    // Рендер выбранной услуги
    renderSelectedService();

    // Рендер списка мастеров
    renderMasters();

    showSection('mastersSection');
}

function showBooking(masterId) {
    // Если передан masterId, выбираем мастера
    if (masterId) {
        bookingManager.selectMaster(masterId);
    }

    // Рендер информации о бронировании
    renderBookingInfo();

    // Рендер календаря
    renderCalendar();

    // Скрыть секцию времени до выбора даты
    document.getElementById('timeSection').style.display = 'none';
    document.getElementById('bookingActions').style.display = 'none';

    showSection('bookingSection');
}

function goBackFromBooking() {
    const booking = bookingManager.getCurrentBooking();
    if (booking && booking.serviceId) {
        showMasters(booking.serviceId);
    } else {
        showServices();
    }
}

function showConfirmation() {
    // Рендер деталей для подтверждения
    renderConfirmationDetails();

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

    // Установить цену на кнопку
    const booking = bookingManager.getCurrentBooking();
    if (booking) {
        document.getElementById('bookingPrice').textContent = CONFIG.formatPrice(booking.service.price);
    }

    showSection('confirmationSection');
}

function showSuccess(booking) {
    renderSuccessDetails(booking);
    showSection('successSection');
}

function showMyBookings() {
    switchTab('bookings');
}

function resetApp() {
    bookingManager.resetCurrentBooking();
    selectedDate = null;
    selectedTime = null;
    currentCategory = 'all';
    renderCategories();
    renderServices();
    switchTab('services');
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
    renderServices();

    if (typeof telegramApp !== 'undefined') {
        telegramApp.hapticFeedback('light');
    }
}

// ===================================
// РЕНДЕРИНГ УСЛУГ
// ===================================

function renderServices() {
    const container = document.getElementById('servicesGrid');
    if (!container) return;

    const services = CONFIG.getServicesByCategory(currentCategory);

    container.innerHTML = services.map(service => `
        <div class="service-card" onclick="showMasters('${service.id}')">
            <div class="service-card-image">
                <img src="${service.image}" alt="${service.name}" loading="lazy">
                <span class="service-card-duration">${CONFIG.formatDuration(service.duration)}</span>
            </div>
            <div class="service-card-body">
                <div class="service-card-name">${service.name}</div>
                <div class="service-card-price">${CONFIG.formatPrice(service.price)}</div>
            </div>
        </div>
    `).join('');
}

// ===================================
// РЕНДЕРИНГ ВЫБРАННОЙ УСЛУГИ
// ===================================

function renderSelectedService() {
    const container = document.getElementById('selectedServiceCard');
    const booking = bookingManager.getCurrentBooking();

    if (!container || !booking) return;

    container.innerHTML = `
        <img src="${booking.service.image}" alt="${booking.service.name}" class="selected-service-image">
        <div class="selected-service-info">
            <div class="selected-service-name">${booking.service.name}</div>
            <div class="selected-service-meta">
                <span>${CONFIG.formatPrice(booking.service.price)}</span>
                <span>${CONFIG.formatDuration(booking.service.duration)}</span>
            </div>
        </div>
    `;
}

// ===================================
// РЕНДЕРИНГ МАСТЕРОВ
// ===================================

function renderMasters() {
    const container = document.getElementById('mastersList');
    const booking = bookingManager.getCurrentBooking();

    if (!container || !booking) return;

    const masters = CONFIG.getMastersForService(booking.serviceId);

    container.innerHTML = masters.map(master => `
        <div class="master-card" onclick="showBooking('${master.id}')">
            <img src="${master.photo}" alt="${master.name}" class="master-photo">
            <div class="master-info">
                <div class="master-name">${master.name}</div>
                <div class="master-description">${master.description}</div>
                <div class="master-rating">
                    <span class="stars">${'★'.repeat(Math.floor(master.rating))}${'☆'.repeat(5 - Math.floor(master.rating))}</span>
                    <span class="rating-value">${master.rating}</span>
                    <span class="reviews-count">(${master.reviews} отзывов)</span>
                </div>
            </div>
            <span class="master-arrow">→</span>
        </div>
    `).join('');
}

// ===================================
// РЕНДЕРИНГ ИНФОРМАЦИИ О БРОНИРОВАНИИ
// ===================================

function renderBookingInfo() {
    const container = document.getElementById('bookingInfoCard');
    const booking = bookingManager.getCurrentBooking();

    if (!container || !booking) return;

    container.innerHTML = `
        <div class="booking-info-row">
            <span class="booking-info-icon">✨</span>
            <div class="booking-info-text">
                <div class="booking-info-label">Услуга</div>
                <div class="booking-info-value">${booking.service.name}</div>
            </div>
        </div>
        <div class="booking-info-row">
            <span class="booking-info-icon">👤</span>
            <div class="booking-info-text">
                <div class="booking-info-label">Мастер</div>
                <div class="booking-info-value">${booking.master.name}</div>
            </div>
        </div>
        <div class="booking-info-row">
            <span class="booking-info-icon">💰</span>
            <div class="booking-info-text">
                <div class="booking-info-label">Стоимость</div>
                <div class="booking-info-value">${CONFIG.formatPrice(booking.service.price)} • ${CONFIG.formatDuration(booking.service.duration)}</div>
            </div>
        </div>
    `;
}

// ===================================
// РЕНДЕРИНГ КАЛЕНДАРЯ
// ===================================

function renderCalendar() {
    const container = document.getElementById('calendarDays');
    if (!container) return;

    const dates = CONFIG.getBookingDates();

    container.innerHTML = dates.map(d => {
        let classes = 'calendar-day';
        if (d.isToday) classes += ' today';
        if (!d.isWorkDay) classes += ' disabled';
        if (selectedDate === d.dateString) classes += ' selected';

        return `
            <div class="${classes}"
                 onclick="${d.isWorkDay ? `selectDate('${d.dateString}')` : ''}"
                 data-date="${d.dateString}">
                <span class="day-name">${d.dayName}</span>
                <span class="day-number">${d.dayNumber}</span>
                <span class="day-month">${d.month}</span>
            </div>
        `;
    }).join('');
}

function selectDate(dateString) {
    selectedDate = dateString;
    selectedTime = null;

    // Обновить бронирование
    bookingManager.selectDate(dateString);

    // Обновить визуал календаря
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.classList.remove('selected');
        if (day.dataset.date === dateString) {
            day.classList.add('selected');
        }
    });

    // Показать и отрендерить слоты времени
    renderTimeSlots();
    document.getElementById('timeSection').style.display = 'block';

    // Скрыть кнопку продолжить
    document.getElementById('bookingActions').style.display = 'none';

    if (typeof telegramApp !== 'undefined') {
        telegramApp.hapticFeedback('light');
    }
}

// ===================================
// РЕНДЕРИНГ ВРЕМЕННЫХ СЛОТОВ
// ===================================

function renderTimeSlots() {
    const container = document.getElementById('timeSlots');
    const booking = bookingManager.getCurrentBooking();

    if (!container || !booking || !selectedDate) return;

    const allSlots = CONFIG.getTimeSlots();
    const availableSlots = bookingManager.getAvailableSlots(
        booking.masterId,
        selectedDate,
        booking.service.duration
    );

    container.innerHTML = allSlots.map(time => {
        const isAvailable = availableSlots.includes(time);
        let classes = 'time-slot';
        if (!isAvailable) classes += ' disabled';
        if (selectedTime === time) classes += ' selected';

        return `
            <button class="${classes}"
                    onclick="${isAvailable ? `selectTime('${time}')` : ''}"
                    ${!isAvailable ? 'disabled' : ''}>
                ${time}
            </button>
        `;
    }).join('');
}

function selectTime(time) {
    selectedTime = time;

    // Обновить бронирование
    bookingManager.selectTime(time);

    // Обновить визуал
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected');
        if (slot.textContent.trim() === time) {
            slot.classList.add('selected');
        }
    });

    // Показать кнопку продолжить
    document.getElementById('bookingActions').style.display = 'block';

    if (typeof telegramApp !== 'undefined') {
        telegramApp.hapticFeedback('medium');
    }
}

// ===================================
// РЕНДЕРИНГ ПОДТВЕРЖДЕНИЯ
// ===================================

function renderConfirmationDetails() {
    const container = document.getElementById('confirmationDetails');
    const booking = bookingManager.getCurrentBooking();

    if (!container || !booking) return;

    container.innerHTML = `
        <div class="confirmation-row">
            <div class="confirmation-icon">✨</div>
            <div class="confirmation-content">
                <div class="confirmation-label">Услуга</div>
                <div class="confirmation-value">${booking.service.name}</div>
            </div>
        </div>
        <div class="confirmation-row">
            <div class="confirmation-icon">👤</div>
            <div class="confirmation-content">
                <div class="confirmation-label">Мастер</div>
                <div class="confirmation-value">${booking.master.name}</div>
            </div>
        </div>
        <div class="confirmation-row">
            <div class="confirmation-icon">📅</div>
            <div class="confirmation-content">
                <div class="confirmation-label">Дата и время</div>
                <div class="confirmation-value">${CONFIG.formatDisplayDate(booking.date)}, ${booking.time}</div>
            </div>
        </div>
        <div class="confirmation-row">
            <div class="confirmation-icon">💰</div>
            <div class="confirmation-content">
                <div class="confirmation-label">Стоимость</div>
                <div class="confirmation-value">${CONFIG.formatPrice(booking.service.price)}</div>
            </div>
        </div>
    `;
}

// ===================================
// ОТПРАВКА БРОНИРОВАНИЯ
// ===================================

async function submitBooking(event) {
    event.preventDefault();

    const nameInput = document.getElementById('customerName');
    const phoneInput = document.getElementById('customerPhone');
    const commentInput = document.getElementById('customerComment');

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

    // Установить контактные данные
    bookingManager.setCustomerInfo(
        nameInput.value.trim(),
        phoneInput.value.trim(),
        commentInput.value.trim()
    );

    // Подтвердить бронирование
    const confirmedBooking = bookingManager.confirmBooking();

    if (!confirmedBooking) {
        alert('Ошибка при создании записи. Попробуйте ещё раз.');
        return;
    }

    // Отправить на сервер (webhook)
    try {
        await sendBookingToServer(confirmedBooking);
    } catch (e) {
        console.error('Failed to send booking to server:', e);
        // Продолжаем даже если сервер не ответил - запись уже сохранена локально
    }

    // Haptic feedback
    if (typeof telegramApp !== 'undefined') {
        telegramApp.hapticFeedback('success');
    }

    // Обновить бейдж
    updateBookingsBadge();

    // Показать успех
    showSuccess(confirmedBooking);

    // Очистить форму
    nameInput.value = '';
    phoneInput.value = '';
    commentInput.value = '';
}

async function sendBookingToServer(booking) {
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
    
    console.log('📤 Отправка бронирования в LEADTEX');
    console.log('🆔 Telegram ID (из localStorage):', localStorage.getItem('telegram_id'));
    console.log('🆔 Telegram ID (из Telegram WebApp):', window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString());
    console.log('🆔 Используемый Telegram ID:', telegramId);
    
    // Подготовка данных для LEADTEX в соответствии с документацией
    const leadtexPayload = {
        contact_by: 'telegram_id',
        search: telegramId,
        variables: {
            order_id: booking.id,
            order_total: booking.service.price.toString(),
            order_subtotal: booking.service.price.toString(),
            order_delivery: "0",
            order_items_count: "1",
            order_timestamp: new Date().toISOString(),

            order_items: JSON.stringify([{
                name: booking.service.name,
                quantity: 1,
                price: booking.service.price,
                total: booking.service.price
            }]),

            customer_name: booking.customerName,
            customer_phone: booking.customerPhone,
            customer_email: "", // не используется в бронировании

            delivery_city: "", // не используется в бронировании
            delivery_address: "", // не используется в бронировании

            order_comment: booking.customerComment,

            source: "mini_app_beauty_studio",
            telegram_user_name: typeof telegramApp !== 'undefined' ? telegramApp.getUserName() : 'debug_user',
            
            // Дополнительные переменные для бронирования
            booking_date: booking.date,
            booking_time: booking.time,
            booking_service: booking.service.name,
            booking_master: booking.master.name,
            booking_duration: booking.service.duration
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
        console.log('✅ Запись успешно отправлена в LEADTEX:', leadtexPayload);
    } else {
        console.error('❌ Ошибка отправки в LEADTEX:', response.status, await response.text());
    }

    return response.json();
}

// ===================================
// РЕНДЕРИНГ УСПЕШНОЙ ЗАПИСИ
// ===================================

function renderSuccessDetails(booking) {
    const container = document.getElementById('successDetails');
    if (!container || !booking) return;

    container.innerHTML = `
        <div class="success-detail-row">
            <span class="success-detail-label">Услуга</span>
            <span class="success-detail-value">${booking.service.name}</span>
        </div>
        <div class="success-detail-row">
            <span class="success-detail-label">Мастер</span>
            <span class="success-detail-value">${booking.master.name}</span>
        </div>
        <div class="success-detail-row">
            <span class="success-detail-label">Дата</span>
            <span class="success-detail-value">${CONFIG.formatDisplayDate(booking.date)}</span>
        </div>
        <div class="success-detail-row">
            <span class="success-detail-label">Время</span>
            <span class="success-detail-value">${booking.time}</span>
        </div>
        <div class="success-detail-row">
            <span class="success-detail-label">Стоимость</span>
            <span class="success-detail-value">${CONFIG.formatPrice(booking.service.price)}</span>
        </div>
    `;
}

// ===================================
// МОИ ЗАПИСИ
// ===================================

function renderMyBookings() {
    const upcomingBookings = bookingManager.getUpcomingBookings();
    const pastBookings = bookingManager.getPastBookings();

    const hasBookings = upcomingBookings.length > 0 || pastBookings.length > 0;

    // Показать/скрыть пустое состояние
    document.getElementById('noBookings').style.display = hasBookings ? 'none' : 'block';
    document.getElementById('bookingsList').style.display = hasBookings ? 'block' : 'none';

    if (!hasBookings) return;

    // Предстоящие
    const upcomingContainer = document.getElementById('upcomingBookingsItems');
    const upcomingGroup = document.getElementById('upcomingBookings');

    if (upcomingBookings.length > 0) {
        upcomingGroup.style.display = 'block';
        upcomingContainer.innerHTML = upcomingBookings.map(b => renderBookingItem(b, 'upcoming')).join('');
    } else {
        upcomingGroup.style.display = 'none';
    }

    // Прошедшие
    const pastContainer = document.getElementById('pastBookingsItems');
    const pastGroup = document.getElementById('pastBookings');

    if (pastBookings.length > 0) {
        pastGroup.style.display = 'block';
        pastContainer.innerHTML = pastBookings.map(b => renderBookingItem(b, 'past')).join('');
    } else {
        pastGroup.style.display = 'none';
    }
}

function renderBookingItem(booking, type) {
    const statusClass = booking.status === 'cancelled' ? 'cancelled' : type;
    const statusText = booking.status === 'cancelled' ? 'Отменена' : (type === 'upcoming' ? 'Предстоит' : 'Завершена');

    return `
        <div class="booking-item">
            <div class="booking-item-header">
                <span class="booking-item-service">${booking.service.name}</span>
                <span class="booking-item-status ${statusClass}">${statusText}</span>
            </div>
            <div class="booking-item-details">
                <div class="booking-item-detail">
                    <span class="booking-item-detail-icon">👤</span>
                    <span>${booking.master.name}</span>
                </div>
                <div class="booking-item-detail">
                    <span class="booking-item-detail-icon">📅</span>
                    <span>${CONFIG.formatDisplayDate(booking.date)}</span>
                </div>
                <div class="booking-item-detail">
                    <span class="booking-item-detail-icon">🕐</span>
                    <span>${booking.time}</span>
                </div>
                <div class="booking-item-detail">
                    <span class="booking-item-detail-icon">💰</span>
                    <span>${CONFIG.formatPrice(booking.service.price)}</span>
                </div>
            </div>
            ${type === 'upcoming' && booking.status !== 'cancelled' ? `
                <div class="booking-item-actions">
                    <button class="booking-item-btn cancel" onclick="cancelBookingConfirm('${booking.id}')">
                        Отменить запись
                    </button>
                </div>
            ` : ''}
            ${type === 'past' ? `
                <div class="booking-item-actions">
                    <button class="booking-item-btn rebook" onclick="rebookService('${booking.serviceId}')">
                        Записаться снова
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

function cancelBookingConfirm(bookingId) {
    if (typeof telegramApp !== 'undefined' && telegramApp.tg) {
        telegramApp.showConfirm('Вы уверены, что хотите отменить запись?', (confirmed) => {
            if (confirmed) {
                cancelBookingAction(bookingId);
            }
        });
    } else {
        if (confirm('Вы уверены, что хотите отменить запись?')) {
            cancelBookingAction(bookingId);
        }
    }
}

function cancelBookingAction(bookingId) {
    const success = bookingManager.cancelBooking(bookingId);

    if (success) {
        if (typeof telegramApp !== 'undefined') {
            telegramApp.hapticFeedback('warning');
        }
        updateBookingsBadge();
        renderMyBookings();
    }
}

function rebookService(serviceId) {
    showMasters(serviceId);
}

// ===================================
// БЕЙДЖ ЗАПИСЕЙ
// ===================================

function updateBookingsBadge() {
    const badge = document.getElementById('tabBookingsBadge');
    const count = bookingManager.getUpcomingCount();

    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
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

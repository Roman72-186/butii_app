// =============================================
// BEAUTY STUDIO — Админ-панель
// =============================================

// Состояние
let currentUser = null;  // { id, role, name, specialty? }
let currentView = null;

const DAY_NAMES = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const DAY_NAMES_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

// =============================================
// ИНИЦИАЛИЗАЦИЯ
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    initPhoneMask(document.getElementById('loginPhone'));
    checkSession();
    // Установить минимальную дату для блокировки — сегодня
    const blockDate = document.getElementById('blockDate');
    if (blockDate) blockDate.min = new Date().toISOString().split('T')[0];
});

function checkSession() {
    const saved = localStorage.getItem('admin_session');
    if (saved) {
        try {
            currentUser = JSON.parse(saved);
            showDashboard();
        } catch (e) {
            localStorage.removeItem('admin_session');
        }
    }
}

// =============================================
// АВТОРИЗАЦИЯ
// =============================================

async function handleLogin(event) {
    event.preventDefault();
    const phone = document.getElementById('loginPhone').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');

    errorEl.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Вход...';

    try {
        // Нормализуем телефон: оставляем только цифры с +
        const normalizedPhone = '+' + phone.replace(/\D/g, '');

        const { data, error } = await supabase.rpc('admin_login', {
            p_phone: normalizedPhone,
            p_password: password
        });

        if (error) throw error;

        if (!data || data.error) {
            errorEl.textContent = data?.error || 'Неверный телефон или пароль';
            errorEl.style.display = 'block';
            return;
        }

        currentUser = data;
        localStorage.setItem('admin_session', JSON.stringify(currentUser));
        showDashboard();

    } catch (err) {
        errorEl.textContent = 'Ошибка подключения к серверу';
        errorEl.style.display = 'block';
        console.error('Login error:', err);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Войти';
    }
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('admin_session');
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('loginPassword').value = '';
}

// =============================================
// НАВИГАЦИЯ
// =============================================

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'flex';

    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userRole').textContent =
        currentUser.role === 'admin' ? 'Администратор' : currentUser.specialty || 'Специалист';

    renderSidebar();

    // Показать первый пункт меню
    if (currentUser.role === 'admin') {
        navigateTo('bookings');
    } else {
        navigateTo('schedule');
    }
}

function renderSidebar() {
    const nav = document.getElementById('sidebarNav');
    let items = [];

    if (currentUser.role === 'admin') {
        items = [
            { id: 'bookings', icon: '📋', label: 'Записи' },
            { id: 'specialists', icon: '👤', label: 'Специалисты' },
            { id: 'services', icon: '✨', label: 'Услуги' },
            { id: 'clients', icon: '👥', label: 'Клиенты' },
        ];
    } else {
        items = [
            { id: 'schedule', icon: '📅', label: 'Моё расписание' },
            { id: 'bookings', icon: '📋', label: 'Мои записи' },
        ];
    }

    nav.innerHTML = items.map(item => `
        <a data-view="${item.id}" onclick="navigateTo('${item.id}')">
            <span class="nav-icon">${item.icon}</span>
            <span>${item.label}</span>
        </a>
    `).join('');
}

function navigateTo(viewId) {
    currentView = viewId;

    // Скрыть все view
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');

    // Убрать active у всех nav
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    const activeNav = document.querySelector(`.sidebar-nav a[data-view="${viewId}"]`);
    if (activeNav) activeNav.classList.add('active');

    // Показать нужный view и загрузить данные
    switch (viewId) {
        case 'bookings':
            document.getElementById('viewBookings').style.display = 'block';
            loadBookings();
            break;
        case 'schedule':
            document.getElementById('viewSchedule').style.display = 'block';
            loadSchedule();
            loadBlockedSlots();
            break;
        case 'specialists':
            document.getElementById('viewSpecialists').style.display = 'block';
            loadSpecialists();
            break;
        case 'services':
            document.getElementById('viewServices').style.display = 'block';
            loadServices();
            break;
        case 'clients':
            document.getElementById('viewClients').style.display = 'block';
            loadClients();
            break;
    }
}

// =============================================
// ЗАПИСИ (BOOKINGS)
// =============================================

async function loadBookings() {
    const container = document.getElementById('bookingsTable');
    const dateFilter = document.getElementById('bookingsDateFilter').value;
    const statusFilter = document.getElementById('bookingsStatusFilter').value;

    let query = supabase
        .from('bookings')
        .select('*, specialists(first_name, last_name), services(name), clients(first_name, last_name, telegram_id)')
        .order('date', { ascending: false })
        .order('time', { ascending: false });

    // Специалист видит только свои записи
    if (currentUser.role === 'specialist') {
        query = query.eq('specialist_id', currentUser.id);
    }

    if (dateFilter) query = query.eq('date', dateFilter);
    if (statusFilter) query = query.eq('status', statusFilter);

    const { data, error } = await query;

    if (error) {
        container.innerHTML = `<div class="empty-state">Ошибка загрузки: ${error.message}</div>`;
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><p>Записей не найдено</p></div>';
        return;
    }

    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Дата</th>
                    <th>Время</th>
                    <th>Клиент</th>
                    <th>Услуга</th>
                    ${currentUser.role === 'admin' ? '<th>Специалист</th>' : ''}
                    <th>Стоимость</th>
                    <th>Статус</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(b => `
                    <tr>
                        <td>${formatDate(b.date)}</td>
                        <td>${b.time?.slice(0, 5) || ''}</td>
                        <td>${b.customer_name || (b.clients ? b.clients.first_name + ' ' + (b.clients.last_name || '') : '—')}</td>
                        <td>${b.services?.name || '—'}</td>
                        ${currentUser.role === 'admin' ? `<td>${b.specialists ? b.specialists.first_name + ' ' + b.specialists.last_name : '—'}</td>` : ''}
                        <td>${b.price} ₽</td>
                        <td><span class="badge badge-${b.status}">${statusLabel(b.status)}</span></td>
                        <td>
                            ${b.status === 'confirmed' ? `
                                <button class="btn-outline" onclick="completeBooking('${b.id}')">Завершить</button>
                                <button class="btn-danger" onclick="cancelBooking('${b.id}')">Отменить</button>
                            ` : ''}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function cancelBooking(bookingId) {
    if (!confirm('Отменить эту запись?')) return;

    const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

    if (error) { alert('Ошибка: ' + error.message); return; }
    loadBookings();
}

async function completeBooking(bookingId) {
    const { error } = await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', bookingId);

    if (error) { alert('Ошибка: ' + error.message); return; }
    loadBookings();
}

// =============================================
// РАСПИСАНИЕ (SCHEDULE)
// =============================================

async function loadSchedule() {
    const container = document.getElementById('scheduleGrid');

    const { data, error } = await supabase
        .from('specialist_schedule')
        .select('*')
        .eq('specialist_id', currentUser.id)
        .order('day_of_week');

    if (error) {
        container.innerHTML = `<div class="empty-state">Ошибка: ${error.message}</div>`;
        return;
    }

    // Если расписание пустое — создаём шаблон
    if (!data || data.length === 0) {
        container.innerHTML = '<div class="empty-state">Расписание не настроено. Обратитесь к администратору.</div>';
        return;
    }

    container.innerHTML = data.map(day => `
        <div class="schedule-day-card ${day.is_working ? 'working' : 'day-off'}">
            <div class="schedule-day-name">${DAY_NAMES[day.day_of_week]}</div>
            <div class="schedule-toggle">
                <input type="checkbox" id="day_${day.day_of_week}"
                       ${day.is_working ? 'checked' : ''}
                       onchange="updateScheduleDay(${day.day_of_week}, this.checked)">
                <label for="day_${day.day_of_week}">${day.is_working ? 'Рабочий день' : 'Выходной'}</label>
            </div>
            ${day.is_working ? `
                <div class="schedule-times">
                    <input type="time" value="${day.start_time?.slice(0,5) || '09:00'}" step="1800"
                           onchange="updateScheduleTime(${day.day_of_week}, 'start_time', this.value)">
                    <span>—</span>
                    <input type="time" value="${day.end_time?.slice(0,5) || '20:00'}" step="1800"
                           onchange="updateScheduleTime(${day.day_of_week}, 'end_time', this.value)">
                </div>
            ` : ''}
        </div>
    `).join('');
}

async function updateScheduleDay(dayOfWeek, isWorking) {
    const { error } = await supabase
        .from('specialist_schedule')
        .update({ is_working: isWorking })
        .eq('specialist_id', currentUser.id)
        .eq('day_of_week', dayOfWeek);

    if (error) { alert('Ошибка: ' + error.message); return; }
    loadSchedule();
}

async function updateScheduleTime(dayOfWeek, field, value) {
    const update = {};
    update[field] = value + ':00';

    const { error } = await supabase
        .from('specialist_schedule')
        .update(update)
        .eq('specialist_id', currentUser.id)
        .eq('day_of_week', dayOfWeek);

    if (error) alert('Ошибка: ' + error.message);
}

// =============================================
// ЗАБЛОКИРОВАННЫЕ СЛОТЫ
// =============================================

async function loadBlockedSlots() {
    const container = document.getElementById('blockedSlotsList');
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('blocked_slots')
        .select('*')
        .eq('specialist_id', currentUser.id)
        .gte('date', today)
        .order('date')
        .order('time');

    if (error) { container.innerHTML = ''; return; }

    if (!data || data.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Нет заблокированных слотов</p></div>';
        return;
    }

    container.innerHTML = data.map(slot => `
        <div class="blocked-item">
            <div class="blocked-item-info">
                <strong>${formatDate(slot.date)}</strong>
                <span>${slot.time?.slice(0,5)}</span>
                ${slot.reason ? `<span style="color:var(--text-secondary)">${slot.reason}</span>` : ''}
            </div>
            <button class="btn-danger" onclick="removeBlockedSlot('${slot.id}')">Убрать</button>
        </div>
    `).join('');
}

async function handleBlockSlot() {
    const date = document.getElementById('blockDate').value;
    const time = document.getElementById('blockTime').value;
    const reason = document.getElementById('blockReason').value.trim();

    if (!date || !time) { alert('Укажите дату и время'); return; }

    const { error } = await supabase
        .from('blocked_slots')
        .insert({
            specialist_id: currentUser.id,
            date: date,
            time: time + ':00',
            reason: reason || null
        });

    if (error) {
        if (error.code === '23505') {
            alert('Этот слот уже заблокирован');
        } else {
            alert('Ошибка: ' + error.message);
        }
        return;
    }

    document.getElementById('blockReason').value = '';
    loadBlockedSlots();
}

async function removeBlockedSlot(slotId) {
    const { error } = await supabase
        .from('blocked_slots')
        .delete()
        .eq('id', slotId);

    if (error) { alert('Ошибка: ' + error.message); return; }
    loadBlockedSlots();
}

// =============================================
// СПЕЦИАЛИСТЫ (ADMIN)
// =============================================

async function loadSpecialists() {
    const container = document.getElementById('specialistsTable');

    const { data, error } = await supabase
        .from('specialists')
        .select('*')
        .order('last_name');

    if (error) {
        container.innerHTML = `<div class="empty-state">Ошибка: ${error.message}</div>`;
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👤</div><p>Специалисты не добавлены</p></div>';
        return;
    }

    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>ФИО</th>
                    <th>Специальность</th>
                    <th>Скиллы</th>
                    <th>Телефон</th>
                    <th>Статус</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(s => `
                    <tr>
                        <td>${s.last_name} ${s.first_name} ${s.patronymic || ''}</td>
                        <td>${s.specialty}</td>
                        <td>${s.skills_summary || '—'}</td>
                        <td>${s.phone}</td>
                        <td><span class="badge ${s.is_active ? 'badge-confirmed' : 'badge-cancelled'}">${s.is_active ? 'Активен' : 'Неактивен'}</span></td>
                        <td>
                            <button class="btn-outline" onclick="toggleSpecialistActive('${s.id}', ${!s.is_active})">${s.is_active ? 'Деактивировать' : 'Активировать'}</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function showAddSpecialistModal() {
    openModal('Добавить специалиста', `
        <form onsubmit="handleAddSpecialist(event)">
            <div class="form-group">
                <label>Фамилия *</label>
                <input type="text" id="specLastName" required>
            </div>
            <div class="form-group">
                <label>Имя *</label>
                <input type="text" id="specFirstName" required>
            </div>
            <div class="form-group">
                <label>Отчество</label>
                <input type="text" id="specPatronymic">
            </div>
            <div class="form-group">
                <label>Специальность *</label>
                <input type="text" id="specSpecialty" required placeholder="Парикмахер, Массажист...">
            </div>
            <div class="form-group">
                <label>Скиллы (кратко)</label>
                <textarea id="specSkills" rows="2" placeholder="Опыт, навыки, сертификаты"></textarea>
            </div>
            <div class="form-group">
                <label>Телефон *</label>
                <input type="tel" id="specPhone" required placeholder="+7 (___) ___-__-__">
            </div>
            <div class="form-group">
                <label>Пароль для входа *</label>
                <input type="text" id="specPassword" required placeholder="Минимум 6 символов">
            </div>
            <button type="submit" class="btn-primary">Добавить</button>
        </form>
    `);
    initPhoneMask(document.getElementById('specPhone'));
}

async function handleAddSpecialist(event) {
    event.preventDefault();

    const phone = '+' + document.getElementById('specPhone').value.replace(/\D/g, '');
    const password = document.getElementById('specPassword').value;

    if (password.length < 6) {
        alert('Пароль должен быть не менее 6 символов');
        return;
    }

    const { data, error } = await supabase.rpc('create_specialist', {
        p_last_name: document.getElementById('specLastName').value.trim(),
        p_first_name: document.getElementById('specFirstName').value.trim(),
        p_patronymic: document.getElementById('specPatronymic').value.trim() || null,
        p_specialty: document.getElementById('specSpecialty').value.trim(),
        p_skills: document.getElementById('specSkills').value.trim() || null,
        p_phone: phone,
        p_password: password
    });

    if (error) {
        if (error.message.includes('unique') || error.message.includes('duplicate')) {
            alert('Специалист с таким телефоном уже существует');
        } else {
            alert('Ошибка: ' + error.message);
        }
        return;
    }

    closeModal();
    loadSpecialists();
}

async function toggleSpecialistActive(specialistId, isActive) {
    const { error } = await supabase
        .from('specialists')
        .update({ is_active: isActive })
        .eq('id', specialistId);

    if (error) { alert('Ошибка: ' + error.message); return; }
    loadSpecialists();
}

// =============================================
// УСЛУГИ (ADMIN)
// =============================================

async function loadServices() {
    const container = document.getElementById('servicesTable');

    const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('category')
        .order('name');

    if (error) {
        container.innerHTML = `<div class="empty-state">Ошибка: ${error.message}</div>`;
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✨</div><p>Услуги не добавлены</p></div>';
        return;
    }

    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Название</th>
                    <th>Категория</th>
                    <th>Цена</th>
                    <th>Длительность</th>
                    <th>Статус</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(s => `
                    <tr>
                        <td>${s.name}</td>
                        <td>${s.category}</td>
                        <td>${s.price} ₽</td>
                        <td>${s.duration} мин</td>
                        <td><span class="badge ${s.is_active ? 'badge-confirmed' : 'badge-cancelled'}">${s.is_active ? 'Активна' : 'Скрыта'}</span></td>
                        <td>
                            <button class="btn-outline" onclick="toggleServiceActive('${s.id}', ${!s.is_active})">${s.is_active ? 'Скрыть' : 'Показать'}</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function showAddServiceModal() {
    openModal('Добавить услугу', `
        <form onsubmit="handleAddService(event)">
            <div class="form-group">
                <label>Название *</label>
                <input type="text" id="svcName" required>
            </div>
            <div class="form-group">
                <label>Категория *</label>
                <select id="svcCategory" required>
                    <option value="hair">Парикмахер</option>
                    <option value="stylist">Стилист</option>
                    <option value="manicure">Маникюр</option>
                    <option value="pedicure">Педикюр</option>
                    <option value="massage">Массаж</option>
                </select>
            </div>
            <div class="form-group">
                <label>Цена (₽) *</label>
                <input type="number" id="svcPrice" required min="0">
            </div>
            <div class="form-group">
                <label>Длительность (мин) *</label>
                <input type="number" id="svcDuration" required min="15" step="15" value="60">
            </div>
            <div class="form-group">
                <label>Описание</label>
                <textarea id="svcDescription" rows="2"></textarea>
            </div>
            <button type="submit" class="btn-primary">Добавить</button>
        </form>
    `);
}

async function handleAddService(event) {
    event.preventDefault();

    const { error } = await supabase
        .from('services')
        .insert({
            name: document.getElementById('svcName').value.trim(),
            category: document.getElementById('svcCategory').value,
            price: parseInt(document.getElementById('svcPrice').value),
            duration: parseInt(document.getElementById('svcDuration').value),
            description: document.getElementById('svcDescription').value.trim() || null
        });

    if (error) { alert('Ошибка: ' + error.message); return; }
    closeModal();
    loadServices();
}

async function toggleServiceActive(serviceId, isActive) {
    const { error } = await supabase
        .from('services')
        .update({ is_active: isActive })
        .eq('id', serviceId);

    if (error) { alert('Ошибка: ' + error.message); return; }
    loadServices();
}

// =============================================
// КЛИЕНТЫ (ADMIN)
// =============================================

async function loadClients() {
    const container = document.getElementById('clientsTable');

    const { data, error } = await supabase
        .from('clients')
        .select('*, bookings(count)')
        .order('created_at', { ascending: false });

    if (error) {
        container.innerHTML = `<div class="empty-state">Ошибка: ${error.message}</div>`;
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👥</div><p>Клиентов пока нет</p></div>';
        return;
    }

    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Имя</th>
                    <th>Телефон</th>
                    <th>Telegram ID</th>
                    <th>Записей</th>
                    <th>Дата регистрации</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(c => `
                    <tr>
                        <td>${c.first_name || ''} ${c.last_name || ''}</td>
                        <td>${c.phone || '—'}</td>
                        <td>${c.telegram_id || '—'}</td>
                        <td>${c.bookings?.[0]?.count || 0}</td>
                        <td>${formatDate(c.created_at)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// =============================================
// МОДАЛЬНЫЕ ОКНА
// =============================================

function openModal(title, bodyHTML) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHTML;
    document.getElementById('modal').style.display = 'flex';
}

function closeModal(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('modal').style.display = 'none';
}

// =============================================
// УТИЛИТЫ
// =============================================

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusLabel(status) {
    const labels = {
        confirmed: 'Подтверждена',
        pending: 'Ожидает',
        cancelled: 'Отменена',
        completed: 'Завершена'
    };
    return labels[status] || status;
}

function initPhoneMask(input) {
    if (!input) return;

    input.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 0) {
            if (value[0] === '8') value = '7' + value.slice(1);
            if (value[0] !== '7') value = '7' + value;
        }
        let formatted = '';
        if (value.length > 0) formatted = '+7';
        if (value.length > 1) formatted += ' (' + value.slice(1, 4);
        if (value.length > 4) formatted += ') ' + value.slice(4, 7);
        if (value.length > 7) formatted += '-' + value.slice(7, 9);
        if (value.length > 9) formatted += '-' + value.slice(9, 11);
        e.target.value = formatted;
    });
}

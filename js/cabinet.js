// ===================================
// BEAUTY STUDIO - КАБИНЕТ
// ===================================
// Авторизация, профиль, рефералы

// Состояние кабинета
let cabinetUser = null; // { id, name, phone, role, ... }

// ===================================
// ВХОД / ВЫХОД
// ===================================

function showLoginForm() {
    document.getElementById('cabinetGuest').style.display = 'none';
    document.getElementById('cabinetLogin').style.display = 'block';

    // Инициализировать маску телефона для кабинета
    initCabinetPhoneMask();
}

function hideLoginForm() {
    document.getElementById('cabinetLogin').style.display = 'none';
    document.getElementById('cabinetGuest').style.display = 'block';

    // Очистить форму
    document.getElementById('cabinetPhone').value = '';
    document.getElementById('cabinetPassword').value = '';
    document.getElementById('cabinetLoginError').style.display = 'none';
}

async function handleCabinetLogin(event) {
    event.preventDefault();

    const phone = document.getElementById('cabinetPhone').value.trim();
    const password = document.getElementById('cabinetPassword').value;
    const errorEl = document.getElementById('cabinetLoginError');
    const btn = document.getElementById('cabinetLoginBtn');

    if (!phone || !password) {
        errorEl.textContent = 'Заполните все поля';
        errorEl.style.display = 'block';
        return;
    }

    // Нормализация телефона
    const cleanPhone = phone.replace(/\D/g, '');
    const normalizedPhone = '+' + cleanPhone;

    btn.disabled = true;
    btn.textContent = 'Вход...';
    errorEl.style.display = 'none';

    try {
        // Единая функция admin_login проверяет и админов, и специалистов
        const { data, error } = await supabase.rpc('admin_login', {
            p_phone: normalizedPhone,
            p_password: password
        });

        if (error) throw error;

        // data — это JSON объект с role, id, name (или error)
        if (data && data.id && !data.error) {
            cabinetUser = {
                id: data.id,
                name: data.name,
                phone: normalizedPhone,
                role: data.role, // 'admin' или 'specialist'
                specialty: data.specialty || null
            };
            onLoginSuccess();
            return;
        }

        // Попробовать найти клиента по телефону (у клиентов пока нет пароля)
        const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('*')
            .eq('phone', normalizedPhone)
            .single();

        if (clientData) {
            cabinetUser = {
                id: clientData.id,
                name: clientData.first_name || 'Клиент',
                phone: normalizedPhone,
                role: 'client',
                bonuses: clientData.bonuses || 0,
                referral_code: clientData.referral_code || null,
                referred_by: clientData.referred_by || null
            };
            onLoginSuccess();
            return;
        }

        // Не удалось войти
        errorEl.textContent = 'Неверный телефон или пароль';
        errorEl.style.display = 'block';

    } catch (err) {
        console.error('Login error:', err);
        errorEl.textContent = 'Ошибка подключения к серверу';
        errorEl.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Войти';
    }
}

function onLoginSuccess() {
    // Скрыть форму входа и гостевой вид
    document.getElementById('cabinetLogin').style.display = 'none';
    document.getElementById('cabinetGuest').style.display = 'none';

    // Показать профиль
    document.getElementById('cabinetProfile').style.display = 'block';

    // Заполнить данные профиля
    renderProfile();

    // Обновить карту лояльности на вкладке Бонусы
    updateLoyaltyCard();

    // Haptic feedback
    if (typeof telegramApp !== 'undefined') {
        telegramApp.hapticFeedback('success');
    }
}

function handleCabinetLogout() {
    cabinetUser = null;

    // Скрыть профиль и подвид
    document.getElementById('cabinetProfile').style.display = 'none';
    document.getElementById('cabinetSubview').style.display = 'none';

    // Показать гостевой вид
    document.getElementById('cabinetGuest').style.display = 'block';

    // Сбросить лояльность
    document.getElementById('loyaltyName').textContent = 'Гость';
    document.getElementById('loyaltyBalance').textContent = '0';

    if (typeof telegramApp !== 'undefined') {
        telegramApp.hapticFeedback('light');
    }
}

// ===================================
// РЕНДЕРИНГ ПРОФИЛЯ
// ===================================

function renderProfile() {
    if (!cabinetUser) return;

    const nameEl = document.getElementById('profileName');
    const roleEl = document.getElementById('profileRole');
    const avatarEl = document.getElementById('profileAvatar');

    nameEl.textContent = cabinetUser.name;

    const roleLabels = {
        admin: 'Администратор',
        specialist: 'Специалист',
        client: 'Клиент'
    };
    roleEl.textContent = roleLabels[cabinetUser.role] || 'Пользователь';

    // Аватар — первая буква имени
    const initials = cabinetUser.name.charAt(0).toUpperCase();
    avatarEl.textContent = initials;

    // Меню на основе роли
    renderProfileMenu();
}

function renderProfileMenu() {
    const container = document.getElementById('profileMenu');
    if (!container || !cabinetUser) return;

    let items = [];

    if (cabinetUser.role === 'client') {
        items = [
            { icon: '👤', label: 'Мои данные', view: 'myData' },
            { icon: '👥', label: 'Мои рефералы', view: 'myRefs' },
            { icon: '📁', label: 'Архив рефералов', view: 'archiveRefs' },
            { icon: '🔑', label: 'Сменить пароль', view: 'changePassword' }
        ];
    } else if (cabinetUser.role === 'specialist') {
        items = [
            { icon: '👤', label: 'Мои данные', view: 'myData' },
            { icon: '📅', label: 'Моё расписание', view: 'mySchedule' },
            { icon: '📋', label: 'Мои записи', view: 'myAppointments' },
            { icon: '🔑', label: 'Сменить пароль', view: 'changePassword' }
        ];
    } else if (cabinetUser.role === 'admin') {
        items = [
            { icon: '👥', label: 'Специалисты', view: 'adminSpecialists' },
            { icon: '✨', label: 'Услуги', view: 'adminServices' },
            { icon: '📋', label: 'Все записи', view: 'adminBookings' },
            { icon: '👤', label: 'Клиенты', view: 'adminClients' },
            { icon: '🔑', label: 'Сменить пароль', view: 'changePassword' }
        ];
    }

    container.innerHTML = items.map(item => `
        <div class="profile-menu-item" onclick="showCabinetView('${item.view}')">
            <div class="profile-menu-item-left">
                <span class="profile-menu-item-icon">${item.icon}</span>
                <span>${item.label}</span>
            </div>
            <span class="profile-menu-item-arrow">&rarr;</span>
        </div>
    `).join('');
}

// ===================================
// ПОДВИДЫ КАБИНЕТА
// ===================================

function showCabinetView(viewName) {
    const subview = document.getElementById('cabinetSubview');
    const titleEl = document.getElementById('cabinetSubviewTitle');
    const contentEl = document.getElementById('cabinetSubviewContent');

    // Скрыть профиль, показать подвид
    document.getElementById('cabinetProfile').querySelector('.profile-card').style.display = 'none';
    document.getElementById('profileMenu').style.display = 'none';
    document.querySelector('.btn-logout').style.display = 'none';

    subview.style.display = 'block';

    // Haptic
    if (typeof telegramApp !== 'undefined') {
        telegramApp.hapticFeedback('light');
    }

    switch (viewName) {
        case 'myRefs':
            titleEl.textContent = 'Мои рефералы';
            loadMyReferrals(contentEl);
            break;
        case 'archiveRefs':
            titleEl.textContent = 'Архив рефералов';
            loadArchiveReferrals(contentEl);
            break;
        case 'myData':
            titleEl.textContent = 'Мои данные';
            renderMyData(contentEl);
            break;
        case 'mySchedule':
            titleEl.textContent = 'Моё расписание';
            loadMySchedule(contentEl);
            break;
        case 'myAppointments':
            titleEl.textContent = 'Мои записи';
            loadMyAppointments(contentEl);
            break;
        case 'changePassword':
            titleEl.textContent = 'Сменить пароль';
            renderChangePassword(contentEl);
            break;
        case 'adminSpecialists':
            titleEl.textContent = 'Специалисты';
            loadAdminSpecialists(contentEl);
            break;
        case 'adminServices':
            titleEl.textContent = 'Услуги';
            loadAdminServices(contentEl);
            break;
        case 'adminBookings':
            titleEl.textContent = 'Все записи';
            loadAdminBookings(contentEl);
            break;
        case 'adminClients':
            titleEl.textContent = 'Клиенты';
            loadAdminClients(contentEl);
            break;
        default:
            titleEl.textContent = '';
            contentEl.innerHTML = '<p class="subview-empty">Раздел в разработке</p>';
    }
}

function closeCabinetSubview() {
    document.getElementById('cabinetSubview').style.display = 'none';

    // Показать профиль обратно
    document.getElementById('cabinetProfile').querySelector('.profile-card').style.display = '';
    document.getElementById('profileMenu').style.display = '';
    document.querySelector('.btn-logout').style.display = '';
}

// ===================================
// МОИ ДАННЫЕ
// ===================================

function renderMyData(container) {
    if (!cabinetUser) return;

    container.innerHTML = `
        <div class="subview-card">
            <div class="subview-row">
                <span class="subview-row-label">Имя</span>
                <span class="subview-row-value">${cabinetUser.name}</span>
            </div>
            <div class="subview-row">
                <span class="subview-row-label">Телефон</span>
                <span class="subview-row-value">${cabinetUser.phone}</span>
            </div>
            <div class="subview-row">
                <span class="subview-row-label">Роль</span>
                <span class="subview-row-value">${cabinetUser.role === 'admin' ? 'Администратор' : cabinetUser.role === 'specialist' ? 'Специалист' : 'Клиент'}</span>
            </div>
            ${cabinetUser.referral_code ? `
            <div class="subview-row">
                <span class="subview-row-label">Реф. код</span>
                <span class="subview-row-value">${cabinetUser.referral_code}</span>
            </div>
            ` : ''}
        </div>
    `;
}

// ===================================
// РЕФЕРАЛЫ
// ===================================

async function loadMyReferrals(container) {
    if (!cabinetUser) return;

    container.innerHTML = '<div class="subview-loading">Загрузка...</div>';

    try {
        const { data, error } = await supabase
            .from('clients')
            .select('id, name, phone, created_at')
            .eq('referred_by', cabinetUser.id);

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="subview-empty-state">
                    <div class="subview-empty-icon">👥</div>
                    <h3>Рефералов пока нет</h3>
                    <p>Поделитесь ссылкой с друзьями</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="subview-list">
                ${data.map(ref => `
                    <div class="subview-list-item">
                        <div class="subview-list-item-name">${ref.name || 'Без имени'}</div>
                        <div class="subview-list-item-meta">${ref.phone || ''}</div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (err) {
        console.error('Load referrals error:', err);
        container.innerHTML = '<div class="subview-error">Ошибка загрузки</div>';
    }
}

async function loadArchiveReferrals(container) {
    // Архив — рефералы, которые были начислены (бонусы уже выданы)
    container.innerHTML = `
        <div class="subview-empty-state">
            <div class="subview-empty-icon">📁</div>
            <h3>Архив пуст</h3>
            <p>Здесь будут отображаться завершённые реферальные начисления</p>
        </div>
    `;
}

// ===================================
// РАСПИСАНИЕ СПЕЦИАЛИСТА
// ===================================

async function loadMySchedule(container) {
    if (!cabinetUser || cabinetUser.role !== 'specialist') return;

    container.innerHTML = '<div class="subview-loading">Загрузка...</div>';

    try {
        const { data, error } = await supabase
            .from('specialist_schedule')
            .select('*')
            .eq('specialist_id', cabinetUser.id)
            .order('day_of_week');

        if (error) throw error;

        const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="subview-empty-state">
                    <div class="subview-empty-icon">📅</div>
                    <h3>Расписание не задано</h3>
                    <p>Обратитесь к администратору для настройки</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="schedule-list">
                ${data.map(day => `
                    <div class="schedule-day-card ${day.is_working ? '' : 'day-off'}">
                        <div class="schedule-day-name">${dayNames[day.day_of_week]}</div>
                        <div class="schedule-day-time">
                            ${day.is_working
                                ? `${day.start_time.slice(0,5)} — ${day.end_time.slice(0,5)}`
                                : 'Выходной'}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (err) {
        console.error('Load schedule error:', err);
        container.innerHTML = '<div class="subview-error">Ошибка загрузки</div>';
    }
}

// ===================================
// ЗАПИСИ СПЕЦИАЛИСТА
// ===================================

async function loadMyAppointments(container) {
    if (!cabinetUser || cabinetUser.role !== 'specialist') return;

    container.innerHTML = '<div class="subview-loading">Загрузка...</div>';

    try {
        const { data, error } = await supabase
            .from('bookings')
            .select('*, clients(name, phone), services(name, price)')
            .eq('specialist_id', cabinetUser.id)
            .gte('booking_date', new Date().toISOString().split('T')[0])
            .order('booking_date')
            .order('booking_time');

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="subview-empty-state">
                    <div class="subview-empty-icon">📋</div>
                    <h3>Записей нет</h3>
                    <p>Предстоящие записи появятся здесь</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="subview-list">
                ${data.map(b => `
                    <div class="subview-list-item">
                        <div class="subview-list-item-name">${b.services?.name || 'Услуга'}</div>
                        <div class="subview-list-item-meta">
                            ${b.booking_date} в ${b.booking_time ? b.booking_time.slice(0,5) : ''}
                        </div>
                        <div class="subview-list-item-meta">
                            Клиент: ${b.clients?.name || 'Не указан'} ${b.clients?.phone || ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (err) {
        console.error('Load appointments error:', err);
        container.innerHTML = '<div class="subview-error">Ошибка загрузки</div>';
    }
}

// ===================================
// СМЕНА ПАРОЛЯ
// ===================================

function renderChangePassword(container) {
    container.innerHTML = `
        <div class="subview-card">
            <form onsubmit="handleChangePassword(event)">
                <div class="form-group">
                    <label>Текущий пароль</label>
                    <input type="password" id="currentPassword" required placeholder="Текущий пароль">
                </div>
                <div class="form-group">
                    <label>Новый пароль</label>
                    <input type="password" id="newPassword" required placeholder="Новый пароль" minlength="6">
                </div>
                <div class="form-group">
                    <label>Подтвердите пароль</label>
                    <input type="password" id="confirmPassword" required placeholder="Повторите пароль">
                </div>
                <div id="changePasswordError" class="login-error" style="display:none;"></div>
                <div id="changePasswordSuccess" class="login-success" style="display:none;"></div>
                <button type="submit" class="btn-primary" id="changePasswordBtn">Сменить пароль</button>
            </form>
        </div>
    `;
}

async function handleChangePassword(event) {
    event.preventDefault();

    const current = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;
    const errorEl = document.getElementById('changePasswordError');
    const successEl = document.getElementById('changePasswordSuccess');

    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    if (newPass !== confirm) {
        errorEl.textContent = 'Пароли не совпадают';
        errorEl.style.display = 'block';
        return;
    }

    if (newPass.length < 6) {
        errorEl.textContent = 'Пароль должен быть не менее 6 символов';
        errorEl.style.display = 'block';
        return;
    }

    // TODO: Реализовать RPC для смены пароля
    successEl.textContent = 'Функция в разработке';
    successEl.style.display = 'block';
}

// ===================================
// АДМИН: СПЕЦИАЛИСТЫ
// ===================================

async function loadAdminSpecialists(container) {
    container.innerHTML = '<div class="subview-loading">Загрузка...</div>';

    try {
        const { data, error } = await supabase
            .from('specialists')
            .select('*')
            .order('name');

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<div class="subview-empty-state"><h3>Нет специалистов</h3></div>';
            return;
        }

        container.innerHTML = `
            <div class="subview-list">
                ${data.map(s => `
                    <div class="subview-list-item">
                        <div class="subview-list-item-name">${s.name}</div>
                        <div class="subview-list-item-meta">${s.phone} | ${s.specialty || ''}</div>
                        <div class="subview-list-item-meta">${s.is_active ? 'Активен' : 'Неактивен'}</div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (err) {
        console.error('Load specialists error:', err);
        container.innerHTML = '<div class="subview-error">Ошибка загрузки</div>';
    }
}

// ===================================
// АДМИН: УСЛУГИ
// ===================================

async function loadAdminServices(container) {
    container.innerHTML = '<div class="subview-loading">Загрузка...</div>';

    try {
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .order('name');

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<div class="subview-empty-state"><h3>Нет услуг</h3></div>';
            return;
        }

        container.innerHTML = `
            <div class="subview-list">
                ${data.map(s => `
                    <div class="subview-list-item">
                        <div class="subview-list-item-name">${s.name}</div>
                        <div class="subview-list-item-meta">${s.price} ₽ | ${s.duration} мин | ${s.category || ''}</div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (err) {
        console.error('Load services error:', err);
        container.innerHTML = '<div class="subview-error">Ошибка загрузки</div>';
    }
}

// ===================================
// АДМИН: ВСЕ ЗАПИСИ
// ===================================

async function loadAdminBookings(container) {
    container.innerHTML = '<div class="subview-loading">Загрузка...</div>';

    try {
        const { data, error } = await supabase
            .from('bookings')
            .select('*, clients(name, phone), services(name), specialists(name)')
            .order('booking_date', { ascending: false })
            .limit(50);

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<div class="subview-empty-state"><h3>Записей нет</h3></div>';
            return;
        }

        container.innerHTML = `
            <div class="subview-list">
                ${data.map(b => `
                    <div class="subview-list-item">
                        <div class="subview-list-item-name">${b.services?.name || 'Услуга'}</div>
                        <div class="subview-list-item-meta">
                            ${b.booking_date} в ${b.booking_time ? b.booking_time.slice(0,5) : ''} | ${b.status}
                        </div>
                        <div class="subview-list-item-meta">
                            Клиент: ${b.clients?.name || '—'} | Мастер: ${b.specialists?.name || '—'}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (err) {
        console.error('Load bookings error:', err);
        container.innerHTML = '<div class="subview-error">Ошибка загрузки</div>';
    }
}

// ===================================
// АДМИН: КЛИЕНТЫ
// ===================================

async function loadAdminClients(container) {
    container.innerHTML = '<div class="subview-loading">Загрузка...</div>';

    try {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<div class="subview-empty-state"><h3>Клиентов нет</h3></div>';
            return;
        }

        container.innerHTML = `
            <div class="subview-list">
                ${data.map(c => `
                    <div class="subview-list-item">
                        <div class="subview-list-item-name">${c.name || 'Без имени'}</div>
                        <div class="subview-list-item-meta">${c.phone || ''} | Бонусы: ${c.bonuses || 0}</div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (err) {
        console.error('Load clients error:', err);
        container.innerHTML = '<div class="subview-error">Ошибка загрузки</div>';
    }
}

// ===================================
// КАРТА ЛОЯЛЬНОСТИ
// ===================================

function updateLoyaltyCard() {
    const nameEl = document.getElementById('loyaltyName');
    const balanceEl = document.getElementById('loyaltyBalance');
    const refLinkEl = document.getElementById('refLink');

    if (cabinetUser) {
        nameEl.textContent = cabinetUser.name;
        balanceEl.textContent = cabinetUser.bonuses || '0';

        if (cabinetUser.referral_code) {
            const botUsername = 'beauty_studio_bot'; // TODO: вынести в CONFIG
            refLinkEl.textContent = `t.me/${botUsername}?start=${cabinetUser.referral_code}`;
        } else {
            refLinkEl.textContent = 'Код не назначен';
        }
    }
}

// ===================================
// РЕФЕРАЛЬНАЯ ССЫЛКА
// ===================================

function copyRefLink() {
    const refLinkEl = document.getElementById('refLink');
    const text = refLinkEl.textContent;

    if (!text || text === 'Войдите в кабинет' || text === 'Код не назначен') {
        if (typeof telegramApp !== 'undefined') {
            telegramApp.showAlert('Войдите в кабинет, чтобы получить реферальную ссылку');
        } else {
            alert('Войдите в кабинет, чтобы получить реферальную ссылку');
        }
        return;
    }

    if (navigator.clipboard) {
        navigator.clipboard.writeText('https://' + text).then(() => {
            if (typeof telegramApp !== 'undefined') {
                telegramApp.showAlert('Ссылка скопирована!');
                telegramApp.hapticFeedback('success');
            } else {
                alert('Ссылка скопирована!');
            }
        });
    } else {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = 'https://' + text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('Ссылка скопирована!');
    }
}

// ===================================
// МАСКА ТЕЛЕФОНА КАБИНЕТА
// ===================================

function initCabinetPhoneMask() {
    const phoneInput = document.getElementById('cabinetPhone');
    if (!phoneInput || phoneInput.dataset.masked) return;

    phoneInput.dataset.masked = 'true';

    phoneInput.addEventListener('input', (e) => {
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

// ===================================
// BEAUTY STUDIO - КАБИНЕТ
// ===================================
// Авторизация, сессии, профиль, расписание

// Состояние кабинета
var cabinetUser = null; // { id, name, phone, role, ... }

// Ключ для localStorage
var SESSION_KEY = 'beauty_cabinet_session';

// Тройной клик на логотип — счётчик
var logoClickCount = 0;
var logoClickTimer = null;

// ===================================
// СЕССИЯ (localStorage)
// ===================================

function saveSession(user) {
    try {
        var session = {
            user: user,
            loginAt: new Date().toISOString()
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (e) {
        console.error('Save session error:', e);
    }
}

function loadSession() {
    try {
        var raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        console.error('Load session error:', e);
        return null;
    }
}

function clearSession() {
    try {
        localStorage.removeItem(SESSION_KEY);
    } catch (e) {
        console.error('Clear session error:', e);
    }
}

async function validateSession(session) {
    if (!session || !session.user || !session.user.id || !session.user.role) return false;
    if (!supabase) return false;

    try {
        var user = session.user;

        if (user.role === 'specialist') {
            var { data, error } = await supabase
                .from('specialists')
                .select('id, is_active')
                .eq('id', user.id)
                .single();
            return !error && data && data.is_active;
        }

        if (user.role === 'admin') {
            var { data, error } = await supabase
                .from('admins')
                .select('id')
                .eq('id', user.id)
                .single();
            return !error && data;
        }

        if (user.role === 'client') {
            var { data, error } = await supabase
                .from('clients')
                .select('id')
                .eq('id', user.id)
                .single();
            return !error && data;
        }

        return false;
    } catch (e) {
        console.error('Validate session error:', e);
        return false;
    }
}

async function checkCabinetSession() {
    var session = loadSession();
    if (!session) return;

    var valid = await validateSession(session);
    if (!valid) {
        clearSession();
        return;
    }

    // Восстанавливаем пользователя
    cabinetUser = session.user;
    onLoginSuccess();
}

// ===================================
// НАВИГАЦИЯ ФОРМ (клиент)
// ===================================

function showLoginForm() {
    document.getElementById('cabinetGuest').style.display = 'none';
    document.getElementById('cabinetRegister').style.display = 'none';
    document.getElementById('cabinetLogin').style.display = 'block';

    initCabinetPhoneMask('cabinetPhone');
}

function hideLoginForm() {
    document.getElementById('cabinetLogin').style.display = 'none';
    document.getElementById('cabinetGuest').style.display = 'block';

    document.getElementById('cabinetPhone').value = '';
    document.getElementById('cabinetPassword').value = '';
    document.getElementById('cabinetLoginError').style.display = 'none';
}

function showRegisterForm() {
    document.getElementById('cabinetGuest').style.display = 'none';
    document.getElementById('cabinetLogin').style.display = 'none';
    document.getElementById('cabinetRegister').style.display = 'block';

    initCabinetPhoneMask('registerPhone');
}

function hideRegisterForm() {
    document.getElementById('cabinetRegister').style.display = 'none';
    document.getElementById('cabinetGuest').style.display = 'block';

    document.getElementById('registerName').value = '';
    document.getElementById('registerPhone').value = '';
    document.getElementById('registerPassword').value = '';
    document.getElementById('registerPasswordConfirm').value = '';
    document.getElementById('cabinetRegisterError').style.display = 'none';
}

// ===================================
// СКРЫТЫЙ ВХОД СОТРУДНИКА (тройной клик на логотип)
// ===================================

function initLogoTripleClick() {
    var logo = document.getElementById('headerLogo');
    if (!logo) return;

    logo.addEventListener('click', function(e) {
        logoClickCount++;

        if (logoClickTimer) clearTimeout(logoClickTimer);

        if (logoClickCount >= 3) {
            logoClickCount = 0;
            e.preventDefault();
            e.stopPropagation();
            showStaffLogin();
            return;
        }

        logoClickTimer = setTimeout(function() {
            logoClickCount = 0;
        }, 600);
    });
}

function showStaffLogin() {
    document.getElementById('staffLoginOverlay').style.display = 'flex';
    initCabinetPhoneMask('staffPhone');

    // Очистить форму
    document.getElementById('staffPhone').value = '';
    document.getElementById('staffPassword').value = '';
    document.getElementById('staffLoginError').style.display = 'none';
}

function hideStaffLogin() {
    document.getElementById('staffLoginOverlay').style.display = 'none';
}

async function handleStaffLogin(event) {
    event.preventDefault();

    var phone = document.getElementById('staffPhone').value.trim();
    var password = document.getElementById('staffPassword').value;
    var errorEl = document.getElementById('staffLoginError');
    var btn = document.getElementById('staffLoginBtn');

    if (!phone || !password) {
        errorEl.textContent = 'Заполните все поля';
        errorEl.style.display = 'block';
        return;
    }

    var cleanPhone = phone.replace(/\D/g, '');
    var normalizedPhone = '+' + cleanPhone;

    if (!supabase) {
        errorEl.textContent = 'Supabase не инициализирован';
        errorEl.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Вход...';
    errorEl.style.display = 'none';

    try {
        var { data: staffData, error: staffError } = await supabase.rpc('admin_login', {
            p_phone: normalizedPhone,
            p_password: password
        });

        if (staffError) throw staffError;

        if (staffData && staffData.id && !staffData.error) {
            cabinetUser = {
                id: staffData.id,
                name: staffData.name,
                phone: normalizedPhone,
                role: staffData.role,
                specialty: staffData.specialty || null
            };
            saveSession(cabinetUser);
            hideStaffLogin();
            onLoginSuccess();
            return;
        }

        errorEl.textContent = 'Неверный телефон или пароль';
        errorEl.style.display = 'block';

    } catch (err) {
        console.error('Staff login error:', err);
        errorEl.textContent = err.message || 'Ошибка подключения';
        errorEl.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Войти';
    }
}

// ===================================
// ВХОД КЛИЕНТА
// ===================================

async function handleCabinetLogin(event) {
    event.preventDefault();

    var phone = document.getElementById('cabinetPhone').value.trim();
    var password = document.getElementById('cabinetPassword').value;
    var errorEl = document.getElementById('cabinetLoginError');
    var btn = document.getElementById('cabinetLoginBtn');

    if (!phone || !password) {
        errorEl.textContent = 'Заполните все поля';
        errorEl.style.display = 'block';
        return;
    }

    var cleanPhone = phone.replace(/\D/g, '');
    var normalizedPhone = '+' + cleanPhone;

    if (!supabase) {
        errorEl.textContent = 'Supabase не инициализирован. Перезагрузите страницу.';
        errorEl.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Вход...';
    errorEl.style.display = 'none';

    try {
        var { data: clientData, error: clientError } = await supabase.rpc('client_login', {
            p_phone: normalizedPhone,
            p_password: password
        });

        if (clientError) throw clientError;

        if (clientData && clientData.id && !clientData.error) {
            cabinetUser = {
                id: clientData.id,
                name: clientData.name,
                phone: normalizedPhone,
                role: 'client',
                bonuses: clientData.bonuses || 0,
                referral_code: clientData.referral_code || null
            };
            saveSession(cabinetUser);
            onLoginSuccess();
            return;
        }

        errorEl.textContent = 'Неверный телефон или пароль';
        errorEl.style.display = 'block';

    } catch (err) {
        console.error('Login error:', err);
        errorEl.textContent = err.message || 'Ошибка подключения к серверу';
        errorEl.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Войти';
    }
}

// ===================================
// РЕГИСТРАЦИЯ (клиент)
// ===================================

async function handleCabinetRegister(event) {
    event.preventDefault();

    var name = document.getElementById('registerName').value.trim();
    var phone = document.getElementById('registerPhone').value.trim();
    var password = document.getElementById('registerPassword').value;
    var passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    var errorEl = document.getElementById('cabinetRegisterError');
    var btn = document.getElementById('cabinetRegisterBtn');

    errorEl.style.display = 'none';

    if (!name || !phone || !password) {
        errorEl.textContent = 'Заполните все поля';
        errorEl.style.display = 'block';
        return;
    }

    if (password.length < 6) {
        errorEl.textContent = 'Пароль должен быть не менее 6 символов';
        errorEl.style.display = 'block';
        return;
    }

    if (password !== passwordConfirm) {
        errorEl.textContent = 'Пароли не совпадают';
        errorEl.style.display = 'block';
        return;
    }

    var cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 11) {
        errorEl.textContent = 'Введите корректный номер телефона';
        errorEl.style.display = 'block';
        return;
    }
    var normalizedPhone = '+' + cleanPhone;

    if (!supabase) {
        errorEl.textContent = 'Supabase не инициализирован. Перезагрузите страницу.';
        errorEl.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Регистрация...';

    try {
        var { data, error } = await supabase.rpc('client_register', {
            p_phone: normalizedPhone,
            p_password: password,
            p_name: name
        });

        if (error) {
            console.error('Register RPC error:', error);
            errorEl.textContent = error.message || 'Ошибка сервера';
            errorEl.style.display = 'block';
            return;
        }

        if (data && data.error) {
            errorEl.textContent = data.error;
            errorEl.style.display = 'block';
            return;
        }

        if (data && data.id) {
            cabinetUser = {
                id: data.id,
                name: data.name,
                phone: normalizedPhone,
                role: 'client',
                bonuses: data.bonuses || 0,
                referral_code: data.referral_code || null
            };

            document.getElementById('cabinetRegister').style.display = 'none';
            saveSession(cabinetUser);
            onLoginSuccess();
            return;
        }

        errorEl.textContent = 'Ошибка регистрации. Попробуйте ещё раз.';
        errorEl.style.display = 'block';

    } catch (err) {
        console.error('Register error:', err);
        errorEl.textContent = err.message || 'Ошибка подключения к серверу';
        errorEl.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Зарегистрироваться';
    }
}

// ===================================
// УСПЕШНЫЙ ВХОД
// ===================================

function onLoginSuccess() {
    // Скрыть все формы
    document.getElementById('cabinetLogin').style.display = 'none';
    document.getElementById('cabinetRegister').style.display = 'none';
    document.getElementById('cabinetGuest').style.display = 'none';

    // Показать профиль
    document.getElementById('cabinetProfile').style.display = 'block';

    // Заполнить данные профиля
    renderProfile();

    // Обновить видимость табов по роли
    updateAuthTabs();

    // Для клиентов обновить лояльность
    if (cabinetUser && cabinetUser.role === 'client') {
        updateLoyaltyCard();
    }

    // Специалист/админ — сразу на Кабинет
    if (cabinetUser && (cabinetUser.role === 'specialist' || cabinetUser.role === 'admin')) {
        switchTab('cabinet');
    }

    // Haptic feedback
    if (typeof telegramApp !== 'undefined') {
        telegramApp.hapticFeedback('success');
    }
}

// ===================================
// ВЫХОД
// ===================================

function handleCabinetLogout() {
    cabinetUser = null;
    clearSession();

    // Скрыть профиль, подвид и формы
    document.getElementById('cabinetProfile').style.display = 'none';
    document.getElementById('cabinetSubview').style.display = 'none';
    document.getElementById('cabinetLogin').style.display = 'none';
    document.getElementById('cabinetRegister').style.display = 'none';

    // Показать гостевой вид
    document.getElementById('cabinetGuest').style.display = 'block';

    // Сбросить лояльность
    document.getElementById('loyaltyName').textContent = 'Гость';
    document.getElementById('loyaltyBalance').textContent = '0';

    // Обновить табы и перейти на Услуги
    updateAuthTabs();
    switchTab('services');

    if (typeof telegramApp !== 'undefined') {
        telegramApp.hapticFeedback('light');
    }
}

// ===================================
// УПРАВЛЕНИЕ ТАБАМИ ПО РОЛИ
// ===================================

function updateAuthTabs() {
    var servicesBtn = document.querySelector('.tab-btn[data-tab="services"]');
    var bookingsBtn = document.querySelector('.tab-btn[data-tab="bookings"]');
    var bonusesBtn = document.querySelector('.tab-btn[data-tab="bonuses"]');
    var cabinetBtn = document.querySelector('.tab-btn[data-tab="cabinet"]');

    if (!cabinetUser) {
        // Гость: Услуги + Кабинет
        if (servicesBtn) servicesBtn.style.display = '';
        if (bookingsBtn) bookingsBtn.style.display = 'none';
        if (bonusesBtn) bonusesBtn.style.display = 'none';
        if (cabinetBtn) cabinetBtn.style.display = '';
        return;
    }

    if (cabinetUser.role === 'client') {
        // Клиент: Услуги + Записи + Бонусы + Кабинет
        if (servicesBtn) servicesBtn.style.display = '';
        if (bookingsBtn) bookingsBtn.style.display = '';
        if (bonusesBtn) bonusesBtn.style.display = '';
        if (cabinetBtn) cabinetBtn.style.display = '';
        return;
    }

    // Специалист/Админ: ТОЛЬКО Кабинет
    if (servicesBtn) servicesBtn.style.display = 'none';
    if (bookingsBtn) bookingsBtn.style.display = 'none';
    if (bonusesBtn) bonusesBtn.style.display = 'none';
    if (cabinetBtn) cabinetBtn.style.display = '';
}

// ===================================
// РЕНДЕРИНГ ПРОФИЛЯ
// ===================================

function renderProfile() {
    if (!cabinetUser) return;

    var nameEl = document.getElementById('profileName');
    var roleEl = document.getElementById('profileRole');
    var avatarEl = document.getElementById('profileAvatar');

    nameEl.textContent = cabinetUser.name;

    var roleLabels = {
        admin: 'Администратор',
        specialist: 'Специалист',
        client: 'Клиент'
    };
    roleEl.textContent = roleLabels[cabinetUser.role] || 'Пользователь';

    // Аватар — первая буква имени
    var initials = cabinetUser.name.charAt(0).toUpperCase();
    avatarEl.textContent = initials;

    // Меню
    renderProfileMenu();
}

function renderProfileMenu() {
    var container = document.getElementById('profileMenu');
    if (!container || !cabinetUser) return;

    var items = [];

    if (cabinetUser.role === 'client') {
        items = [
            { icon: '👤', label: 'Мои данные', view: 'myData' },
            { icon: '👥', label: 'Мои рефералы', view: 'myRefs' },
            { icon: '📁', label: 'Архив записей', view: 'archiveBookings' },
            { icon: '🔑', label: 'Сменить пароль', view: 'changePassword' }
        ];
    } else if (cabinetUser.role === 'specialist') {
        items = [
            { icon: '👤', label: 'Мой профиль', view: 'specialistProfile' },
            { icon: '📅', label: 'Моё расписание', view: 'mySchedule' },
            { icon: '📋', label: 'Мои записи', view: 'myAppointments' },
            { icon: '➕', label: 'Записать клиента', view: 'manualBooking' },
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

    container.innerHTML = items.map(function(item) {
        return '<div class="profile-menu-item" onclick="showCabinetView(\'' + item.view + '\')">' +
            '<div class="profile-menu-item-left">' +
                '<span class="profile-menu-item-icon">' + item.icon + '</span>' +
                '<span>' + item.label + '</span>' +
            '</div>' +
            '<span class="profile-menu-item-arrow">&rarr;</span>' +
        '</div>';
    }).join('');
}

// ===================================
// ПОДВИДЫ КАБИНЕТА
// ===================================

function showCabinetView(viewName) {
    var subview = document.getElementById('cabinetSubview');
    var titleEl = document.getElementById('cabinetSubviewTitle');
    var contentEl = document.getElementById('cabinetSubviewContent');

    // Скрыть профиль, показать подвид
    document.getElementById('cabinetProfile').querySelector('.profile-card').style.display = 'none';
    document.getElementById('profileMenu').style.display = 'none';
    document.querySelector('.btn-logout').style.display = 'none';

    subview.style.display = 'block';

    if (typeof telegramApp !== 'undefined') {
        telegramApp.hapticFeedback('light');
    }

    switch (viewName) {
        case 'myRefs':
            titleEl.textContent = 'Мои рефералы';
            loadMyReferrals(contentEl);
            break;
        case 'archiveBookings':
            titleEl.textContent = 'Архив записей';
            loadArchiveBookings(contentEl);
            break;
        case 'myData':
            titleEl.textContent = 'Мои данные';
            renderMyData(contentEl);
            break;
        case 'specialistProfile':
            titleEl.textContent = 'Мой профиль';
            renderSpecialistProfile(contentEl);
            break;
        case 'mySchedule':
            titleEl.textContent = 'Моё расписание';
            loadMySchedule(contentEl);
            break;
        case 'myAppointments':
            titleEl.textContent = 'Мои записи';
            loadMyAppointments(contentEl);
            break;
        case 'manualBooking':
            titleEl.textContent = 'Записать клиента';
            renderManualBooking(contentEl);
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
// МОИ ДАННЫЕ (клиент)
// ===================================

function renderMyData(container) {
    if (!cabinetUser) return;

    container.innerHTML = '<div class="subview-card">' +
        '<div class="subview-row">' +
            '<span class="subview-row-label">Имя</span>' +
            '<span class="subview-row-value">' + cabinetUser.name + '</span>' +
        '</div>' +
        '<div class="subview-row">' +
            '<span class="subview-row-label">Телефон</span>' +
            '<span class="subview-row-value">' + cabinetUser.phone + '</span>' +
        '</div>' +
        '<div class="subview-row">' +
            '<span class="subview-row-label">Роль</span>' +
            '<span class="subview-row-value">' + (cabinetUser.role === 'admin' ? 'Администратор' : cabinetUser.role === 'specialist' ? 'Специалист' : 'Клиент') + '</span>' +
        '</div>' +
        (cabinetUser.referral_code ? '<div class="subview-row">' +
            '<span class="subview-row-label">Реф. код</span>' +
            '<span class="subview-row-value">' + cabinetUser.referral_code + '</span>' +
        '</div>' : '') +
    '</div>';
}

// ===================================
// ПРОФИЛЬ СПЕЦИАЛИСТА (редактируемый)
// ===================================

async function renderSpecialistProfile(container) {
    if (!cabinetUser || cabinetUser.role !== 'specialist') return;

    container.innerHTML = '<div class="subview-loading">Загрузка...</div>';

    try {
        var { data, error } = await supabase
            .from('specialists')
            .select('first_name, last_name, specialty, skills_summary, photo_url')
            .eq('id', cabinetUser.id)
            .single();

        if (error) throw error;

        var photoHtml = data.photo_url
            ? '<img src="' + data.photo_url + '" alt="Фото" class="specialist-photo-preview">'
            : '<div class="specialist-photo-placeholder">📷</div>';

        container.innerHTML = '<div class="subview-card">' +
            '<div class="specialist-photo-section">' +
                photoHtml +
                '<label class="btn-sm btn-upload">' +
                    'Загрузить фото' +
                    '<input type="file" accept="image/*" onchange="handlePhotoUpload(this)" style="display:none;">' +
                '</label>' +
            '</div>' +
            '<form onsubmit="handleSaveSpecialistProfile(event)">' +
                '<div class="form-group">' +
                    '<label>Имя</label>' +
                    '<input type="text" id="specFirstName" value="' + (data.first_name || '') + '" required>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>Фамилия</label>' +
                    '<input type="text" id="specLastName" value="' + (data.last_name || '') + '" required>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>Специальность</label>' +
                    '<input type="text" id="specSpecialty" value="' + (data.specialty || '') + '" required>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>О себе</label>' +
                    '<textarea id="specSkills" rows="3" placeholder="Расскажите о своих навыках">' + (data.skills_summary || '') + '</textarea>' +
                '</div>' +
                '<div id="specProfileError" class="login-error" style="display:none;"></div>' +
                '<div id="specProfileSuccess" class="login-success" style="display:none;"></div>' +
                '<button type="submit" class="btn-primary" id="specProfileBtn">Сохранить</button>' +
            '</form>' +
        '</div>';
    } catch (err) {
        console.error('Load specialist profile error:', err);
        container.innerHTML = '<div class="subview-error">Ошибка загрузки профиля</div>';
    }
}

async function handlePhotoUpload(input) {
    if (!input.files || !input.files[0]) return;
    if (!cabinetUser) return;

    var file = input.files[0];

    // Проверка размера (макс 2 МБ)
    if (file.size > 2 * 1024 * 1024) {
        alert('Файл слишком большой. Максимум 2 МБ.');
        return;
    }

    var ext = file.name.split('.').pop().toLowerCase();
    var filePath = 'specialist-photos/' + cabinetUser.id + '.' + ext;

    try {
        var { error: uploadError } = await supabase.storage
            .from('specialist-photos')
            .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        var { data: urlData } = supabase.storage
            .from('specialist-photos')
            .getPublicUrl(filePath);

        var photoUrl = urlData.publicUrl;

        // Обновить в БД
        await supabase.rpc('update_specialist_profile', {
            p_specialist_id: cabinetUser.id,
            p_first_name: document.getElementById('specFirstName').value,
            p_last_name: document.getElementById('specLastName').value,
            p_specialty: document.getElementById('specSpecialty').value,
            p_skills_summary: document.getElementById('specSkills').value,
            p_photo_url: photoUrl
        });

        // Обновить превью
        var section = document.querySelector('.specialist-photo-section');
        if (section) {
            var existing = section.querySelector('.specialist-photo-preview, .specialist-photo-placeholder');
            if (existing) {
                var img = document.createElement('img');
                img.src = photoUrl;
                img.alt = 'Фото';
                img.className = 'specialist-photo-preview';
                existing.replaceWith(img);
            }
        }

        if (typeof telegramApp !== 'undefined') {
            telegramApp.hapticFeedback('success');
        }
    } catch (err) {
        console.error('Photo upload error:', err);
        alert('Ошибка загрузки фото: ' + (err.message || 'Попробуйте ещё раз'));
    }
}

async function handleSaveSpecialistProfile(event) {
    event.preventDefault();

    var errorEl = document.getElementById('specProfileError');
    var successEl = document.getElementById('specProfileSuccess');
    var btn = document.getElementById('specProfileBtn');

    errorEl.style.display = 'none';
    successEl.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Сохранение...';

    try {
        var { data, error } = await supabase.rpc('update_specialist_profile', {
            p_specialist_id: cabinetUser.id,
            p_first_name: document.getElementById('specFirstName').value.trim(),
            p_last_name: document.getElementById('specLastName').value.trim(),
            p_specialty: document.getElementById('specSpecialty').value.trim(),
            p_skills_summary: document.getElementById('specSkills').value.trim()
        });

        if (error) throw error;
        if (data && data.error) throw new Error(data.error);

        // Обновить имя в cabinetUser и сессии
        cabinetUser.name = data.first_name + ' ' + data.last_name;
        cabinetUser.specialty = data.specialty;
        saveSession(cabinetUser);
        renderProfile();

        successEl.textContent = 'Профиль сохранён';
        successEl.style.display = 'block';

        if (typeof telegramApp !== 'undefined') {
            telegramApp.hapticFeedback('success');
        }
    } catch (err) {
        console.error('Save profile error:', err);
        errorEl.textContent = err.message || 'Ошибка сохранения';
        errorEl.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Сохранить';
    }
}

// ===================================
// РЕФЕРАЛЫ (клиент)
// ===================================

async function loadMyReferrals(container) {
    if (!cabinetUser) return;

    container.innerHTML = '<div class="subview-loading">Загрузка...</div>';

    try {
        var { data, error } = await supabase
            .from('clients')
            .select('id, name, phone, created_at')
            .eq('referred_by', cabinetUser.id);

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<div class="subview-empty-state">' +
                '<div class="subview-empty-icon">👥</div>' +
                '<h3>Рефералов пока нет</h3>' +
                '<p>Поделитесь ссылкой с друзьями</p>' +
            '</div>';
            return;
        }

        container.innerHTML = '<div class="subview-list">' +
            data.map(function(ref) {
                return '<div class="subview-list-item">' +
                    '<div class="subview-list-item-name">' + (ref.name || 'Без имени') + '</div>' +
                    '<div class="subview-list-item-meta">' + (ref.phone || '') + '</div>' +
                '</div>';
            }).join('') +
        '</div>';
    } catch (err) {
        console.error('Load referrals error:', err);
        container.innerHTML = '<div class="subview-error">Ошибка загрузки</div>';
    }
}

async function loadArchiveBookings(container) {
    if (!cabinetUser) return;

    container.innerHTML = '<div class="subview-loading">Загрузка...</div>';

    try {
        var today = new Date().toISOString().split('T')[0];

        var { data, error } = await supabase
            .from('bookings')
            .select('*, services(name, price), specialists(first_name, last_name)')
            .eq('customer_phone', cabinetUser.phone)
            .or('status.eq.completed,status.eq.cancelled,booking_date.lt.' + today)
            .order('booking_date', { ascending: false })
            .limit(50);

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<div class="subview-empty-state">' +
                '<div class="subview-empty-icon">📁</div>' +
                '<h3>Архив пуст</h3>' +
                '<p>Прошедшие и отменённые записи появятся здесь</p>' +
            '</div>';
            return;
        }

        container.innerHTML = '<div class="subview-list">' +
            data.map(function(b) {
                var masterName = b.specialists
                    ? (b.specialists.first_name + ' ' + b.specialists.last_name)
                    : (b.customer_name || '—');
                var statusLabel = b.status === 'cancelled' ? 'Отменена'
                    : b.status === 'completed' ? 'Завершена' : 'Прошла';
                var statusClass = b.status === 'cancelled' ? 'status-cancelled' : 'status-past';

                return '<div class="subview-list-item">' +
                    '<div class="subview-list-item-header">' +
                        '<div class="subview-list-item-name">' + (b.services ? b.services.name : 'Услуга') + '</div>' +
                        '<span class="booking-item-status ' + statusClass + '">' + statusLabel + '</span>' +
                    '</div>' +
                    '<div class="subview-list-item-meta">' +
                        b.booking_date + ' в ' + (b.booking_time ? b.booking_time.slice(0,5) : '') +
                    '</div>' +
                    '<div class="subview-list-item-meta">' +
                        'Мастер: ' + masterName + ' | ' + (b.price || 0) + ' ₽' +
                    '</div>' +
                '</div>';
            }).join('') +
        '</div>';
    } catch (err) {
        console.error('Load archive bookings error:', err);
        container.innerHTML = '<div class="subview-error">Ошибка загрузки</div>';
    }
}

// ===================================
// РАСПИСАНИЕ СПЕЦИАЛИСТА (calendar + work dates)
// ===================================

// Состояние расписания
var scheduleSelectedDate = null;

async function loadMySchedule(container) {
    if (!cabinetUser || cabinetUser.role !== 'specialist') return;

    container.innerHTML = '<div class="subview-loading">Загрузка...</div>';

    try {
        // Загружаем рабочие даты
        var today = new Date().toISOString().split('T')[0];
        var { data: workDates, error } = await supabase
            .from('specialist_work_dates')
            .select('*')
            .eq('specialist_id', cabinetUser.id)
            .gte('work_date', today)
            .order('work_date');

        if (error) throw error;

        var workDatesMap = {};
        if (workDates) {
            workDates.forEach(function(wd) {
                workDatesMap[wd.work_date] = wd;
            });
        }

        // Рендерим календарь + список
        var html = renderScheduleCalendar(workDatesMap);

        // Список установленных дат
        html += '<div class="schedule-work-dates-list">';
        html += '<h3 class="schedule-section-title">Рабочие даты</h3>';

        if (workDates && workDates.length > 0) {
            html += workDates.map(function(wd) {
                var d = new Date(wd.work_date + 'T00:00:00');
                var dayName = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][d.getDay()];
                var dateStr = d.getDate() + '.' + (d.getMonth() + 1 < 10 ? '0' : '') + (d.getMonth() + 1);

                return '<div class="schedule-day-card">' +
                    '<div>' +
                        '<div class="schedule-day-name">' + dayName + ', ' + dateStr + '</div>' +
                        '<div class="schedule-day-time">' + wd.start_time.slice(0,5) + ' — ' + wd.end_time.slice(0,5) + '</div>' +
                    '</div>' +
                    '<button class="btn-sm btn-remove" onclick="removeWorkDate(\'' + wd.work_date + '\')">Убрать</button>' +
                '</div>';
            }).join('');
        } else {
            html += '<div class="subview-empty-state">' +
                '<p>Нет установленных рабочих дат</p>' +
                '<p>Нажмите на дату в календаре</p>' +
            '</div>';
        }
        html += '</div>';

        container.innerHTML = html;

    } catch (err) {
        console.error('Load schedule error:', err);
        container.innerHTML = '<div class="subview-error">Ошибка загрузки расписания</div>';
    }
}

function renderScheduleCalendar(workDatesMap) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var html = '<div class="schedule-calendar-grid">';

    // Заголовки дней
    var dayHeaders = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    dayHeaders.forEach(function(d) {
        html += '<div class="schedule-calendar-header">' + d + '</div>';
    });

    // 30 дней вперёд
    var startDate = new Date(today);
    // Сдвинуть к понедельнику текущей недели
    var dayOfWeek = startDate.getDay();
    var mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + mondayOffset);

    // 5 недель
    for (var i = 0; i < 35; i++) {
        var d = new Date(startDate);
        d.setDate(d.getDate() + i);
        var dateStr = d.toISOString().split('T')[0];
        var isPast = d < today;
        var isToday = d.getTime() === today.getTime();
        var isWorkDay = workDatesMap && workDatesMap[dateStr];

        var classes = 'schedule-calendar-day';
        if (isPast) classes += ' past';
        if (isToday) classes += ' today';
        if (isWorkDay) classes += ' work-day';

        var onclick = isPast ? '' : 'onclick="selectScheduleDate(\'' + dateStr + '\')"';

        html += '<div class="' + classes + '" ' + onclick + '>' +
            '<span class="schedule-day-num">' + d.getDate() + '</span>' +
        '</div>';
    }

    html += '</div>';
    return html;
}

function selectScheduleDate(dateStr) {
    scheduleSelectedDate = dateStr;

    // Показать диалог установки времени
    var d = new Date(dateStr + 'T00:00:00');
    var dayName = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'][d.getDay()];
    var dateDisplay = d.getDate() + '.' + (d.getMonth() + 1 < 10 ? '0' : '') + (d.getMonth() + 1);

    var contentEl = document.getElementById('cabinetSubviewContent');
    var existingModal = contentEl.querySelector('.schedule-time-modal');
    if (existingModal) existingModal.remove();

    var modal = document.createElement('div');
    modal.className = 'schedule-time-modal';
    modal.innerHTML = '<div class="schedule-time-modal-content">' +
        '<h3>' + dayName + ', ' + dateDisplay + '</h3>' +
        '<div class="schedule-time-inputs">' +
            '<div class="form-group">' +
                '<label>Начало</label>' +
                '<input type="time" id="scheduleStartTime" value="09:00">' +
            '</div>' +
            '<div class="form-group">' +
                '<label>Конец</label>' +
                '<input type="time" id="scheduleEndTime" value="20:00">' +
            '</div>' +
        '</div>' +
        '<div id="scheduleTimeError" class="login-error" style="display:none;"></div>' +
        '<div class="schedule-time-actions">' +
            '<button class="btn-primary" onclick="saveWorkDate()">Сохранить</button>' +
            '<button class="btn-secondary" onclick="this.closest(\'.schedule-time-modal\').remove()">Отмена</button>' +
        '</div>' +
    '</div>';

    contentEl.appendChild(modal);

    if (typeof telegramApp !== 'undefined') {
        telegramApp.hapticFeedback('light');
    }
}

async function saveWorkDate() {
    if (!scheduleSelectedDate || !cabinetUser) return;

    var startTime = document.getElementById('scheduleStartTime').value;
    var endTime = document.getElementById('scheduleEndTime').value;
    var errorEl = document.getElementById('scheduleTimeError');

    if (!startTime || !endTime) {
        errorEl.textContent = 'Укажите время';
        errorEl.style.display = 'block';
        return;
    }

    if (startTime >= endTime) {
        errorEl.textContent = 'Время начала должно быть раньше окончания';
        errorEl.style.display = 'block';
        return;
    }

    try {
        var { error } = await supabase
            .from('specialist_work_dates')
            .upsert({
                specialist_id: cabinetUser.id,
                work_date: scheduleSelectedDate,
                start_time: startTime,
                end_time: endTime
            }, { onConflict: 'specialist_id,work_date' });

        if (error) throw error;

        // Перезагрузить расписание
        var contentEl = document.getElementById('cabinetSubviewContent');
        loadMySchedule(contentEl);

        if (typeof telegramApp !== 'undefined') {
            telegramApp.hapticFeedback('success');
        }
    } catch (err) {
        console.error('Save work date error:', err);
        if (errorEl) {
            errorEl.textContent = err.message || 'Ошибка сохранения';
            errorEl.style.display = 'block';
        }
    }
}

async function removeWorkDate(dateStr) {
    if (!cabinetUser) return;

    try {
        var { error } = await supabase
            .from('specialist_work_dates')
            .delete()
            .eq('specialist_id', cabinetUser.id)
            .eq('work_date', dateStr);

        if (error) throw error;

        var contentEl = document.getElementById('cabinetSubviewContent');
        loadMySchedule(contentEl);

        if (typeof telegramApp !== 'undefined') {
            telegramApp.hapticFeedback('light');
        }
    } catch (err) {
        console.error('Remove work date error:', err);
        alert('Ошибка удаления: ' + (err.message || ''));
    }
}

// ===================================
// ЗАПИСИ СПЕЦИАЛИСТА
// ===================================

async function loadMyAppointments(container) {
    if (!cabinetUser || cabinetUser.role !== 'specialist') return;

    container.innerHTML = '<div class="subview-loading">Загрузка...</div>';

    try {
        var { data, error } = await supabase
            .from('bookings')
            .select('*, services(name, price), specialists(first_name, last_name)')
            .eq('specialist_id', cabinetUser.id)
            .gte('booking_date', new Date().toISOString().split('T')[0])
            .order('booking_date')
            .order('booking_time');

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<div class="subview-empty-state">' +
                '<div class="subview-empty-icon">📋</div>' +
                '<h3>Записей нет</h3>' +
                '<p>Предстоящие записи появятся здесь</p>' +
            '</div>';
            return;
        }

        container.innerHTML = '<div class="subview-list">' +
            data.map(function(b) {
                return '<div class="subview-list-item">' +
                    '<div class="subview-list-item-name">' + (b.services ? b.services.name : 'Услуга') + '</div>' +
                    '<div class="subview-list-item-meta">' +
                        b.booking_date + ' в ' + (b.booking_time ? b.booking_time.slice(0,5) : '') +
                    '</div>' +
                    '<div class="subview-list-item-meta">' +
                        'Клиент: ' + (b.customer_name || 'Не указан') + ' ' + (b.customer_phone || '') +
                    '</div>' +
                '</div>';
            }).join('') +
        '</div>';
    } catch (err) {
        console.error('Load appointments error:', err);
        container.innerHTML = '<div class="subview-error">Ошибка загрузки</div>';
    }
}

// ===================================
// РУЧНАЯ ЗАПИСЬ КЛИЕНТА (специалист)
// ===================================

var manualBookingDate = null;
var manualBookingTime = null;

async function renderManualBooking(container) {
    if (!cabinetUser || cabinetUser.role !== 'specialist') return;

    container.innerHTML = '<div class="subview-loading">Загрузка...</div>';

    try {
        // Загрузить услуги специалиста
        var { data: specServices, error: ssError } = await supabase
            .from('specialist_services')
            .select('service_id, services(id, name, price, duration)')
            .eq('specialist_id', cabinetUser.id);

        if (ssError) throw ssError;

        // Если нет привязанных услуг, загрузить все
        var services = [];
        if (specServices && specServices.length > 0) {
            services = specServices.map(function(ss) { return ss.services; }).filter(Boolean);
        } else {
            var { data: allServices, error: sError } = await supabase
                .from('services')
                .select('id, name, price, duration')
                .eq('is_active', true)
                .order('name');
            if (sError) throw sError;
            services = allServices || [];
        }

        // Загрузить рабочие даты для выбора
        var today = new Date().toISOString().split('T')[0];
        var { data: workDates, error: wdError } = await supabase
            .from('specialist_work_dates')
            .select('work_date, start_time, end_time')
            .eq('specialist_id', cabinetUser.id)
            .gte('work_date', today)
            .order('work_date');

        if (wdError) throw wdError;

        var dateOptions = '';
        if (workDates && workDates.length > 0) {
            dateOptions = workDates.map(function(wd) {
                var d = new Date(wd.work_date + 'T00:00:00');
                var dayName = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][d.getDay()];
                var dateDisplay = d.getDate() + '.' + (d.getMonth() + 1 < 10 ? '0' : '') + (d.getMonth() + 1);
                return '<option value="' + wd.work_date + '">' + dayName + ', ' + dateDisplay + ' (' + wd.start_time.slice(0,5) + '-' + wd.end_time.slice(0,5) + ')</option>';
            }).join('');
        }

        var serviceOptions = services.map(function(s) {
            return '<option value="' + s.id + '" data-duration="' + s.duration + '" data-price="' + s.price + '">' + s.name + ' (' + s.price + ' ₽, ' + s.duration + ' мин)</option>';
        }).join('');

        container.innerHTML = '<div class="subview-card">' +
            '<form onsubmit="handleManualBooking(event)">' +
                '<div class="form-group">' +
                    '<label>Услуга</label>' +
                    '<select id="manualService" required class="form-select">' +
                        '<option value="">Выберите услугу</option>' +
                        serviceOptions +
                    '</select>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>Дата</label>' +
                    '<select id="manualDate" required class="form-select" onchange="loadManualBookingSlots()">' +
                        '<option value="">Выберите дату</option>' +
                        dateOptions +
                    '</select>' +
                    ((!workDates || workDates.length === 0) ? '<p class="form-hint">Сначала установите рабочие даты в расписании</p>' : '') +
                '</div>' +
                '<div id="manualTimeSlots" style="display:none;">' +
                    '<div class="form-group">' +
                        '<label>Время</label>' +
                        '<div id="manualTimeSlotsGrid" class="time-slots"></div>' +
                    '</div>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>Имя клиента</label>' +
                    '<input type="text" id="manualClientName" required placeholder="Имя клиента">' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>Телефон клиента</label>' +
                    '<input type="tel" id="manualClientPhone" required placeholder="+7 (___) ___-__-__">' +
                '</div>' +
                '<div id="manualBookingError" class="login-error" style="display:none;"></div>' +
                '<div id="manualBookingSuccess" class="login-success" style="display:none;"></div>' +
                '<button type="submit" class="btn-primary" id="manualBookingBtn">Записать</button>' +
            '</form>' +
        '</div>';

        initCabinetPhoneMask('manualClientPhone');

    } catch (err) {
        console.error('Render manual booking error:', err);
        container.innerHTML = '<div class="subview-error">Ошибка загрузки</div>';
    }
}

async function loadManualBookingSlots() {
    var dateStr = document.getElementById('manualDate').value;
    var slotsContainer = document.getElementById('manualTimeSlots');
    var slotsGrid = document.getElementById('manualTimeSlotsGrid');

    if (!dateStr) {
        slotsContainer.style.display = 'none';
        return;
    }

    manualBookingDate = dateStr;
    manualBookingTime = null;

    // Получить duration выбранной услуги
    var serviceSelect = document.getElementById('manualService');
    var selectedOption = serviceSelect.options[serviceSelect.selectedIndex];
    var duration = selectedOption ? parseInt(selectedOption.dataset.duration || '30') : 30;

    slotsGrid.innerHTML = '<div class="subview-loading">Загрузка слотов...</div>';
    slotsContainer.style.display = 'block';

    try {
        var { data, error } = await supabase.rpc('get_available_slots', {
            p_specialist_id: cabinetUser.id,
            p_date: dateStr,
            p_duration: duration
        });

        if (error) throw error;

        var slots = data || [];
        if (slots.length === 0) {
            slotsGrid.innerHTML = '<p class="form-hint">Нет свободных слотов на эту дату</p>';
            return;
        }

        slotsGrid.innerHTML = slots.map(function(time) {
            var t = time.slice(0, 5);
            return '<button type="button" class="time-slot" onclick="selectManualTime(this, \'' + t + '\')">' + t + '</button>';
        }).join('');

    } catch (err) {
        console.error('Load manual slots error:', err);
        slotsGrid.innerHTML = '<p class="form-hint">Ошибка загрузки слотов</p>';
    }
}

function selectManualTime(btn, time) {
    manualBookingTime = time;

    // Обновить визуал
    var grid = document.getElementById('manualTimeSlotsGrid');
    grid.querySelectorAll('.time-slot').forEach(function(s) {
        s.classList.remove('selected');
    });
    btn.classList.add('selected');

    if (typeof telegramApp !== 'undefined') {
        telegramApp.hapticFeedback('light');
    }
}

async function handleManualBooking(event) {
    event.preventDefault();

    var errorEl = document.getElementById('manualBookingError');
    var successEl = document.getElementById('manualBookingSuccess');
    var btn = document.getElementById('manualBookingBtn');

    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    var serviceSelect = document.getElementById('manualService');
    var serviceId = serviceSelect.value;
    var selectedOption = serviceSelect.options[serviceSelect.selectedIndex];
    var duration = selectedOption ? parseInt(selectedOption.dataset.duration || '30') : 30;
    var price = selectedOption ? parseInt(selectedOption.dataset.price || '0') : 0;
    var clientName = document.getElementById('manualClientName').value.trim();
    var clientPhone = document.getElementById('manualClientPhone').value.trim();

    if (!serviceId) {
        errorEl.textContent = 'Выберите услугу';
        errorEl.style.display = 'block';
        return;
    }

    if (!manualBookingDate) {
        errorEl.textContent = 'Выберите дату';
        errorEl.style.display = 'block';
        return;
    }

    if (!manualBookingTime) {
        errorEl.textContent = 'Выберите время';
        errorEl.style.display = 'block';
        return;
    }

    if (!clientName) {
        errorEl.textContent = 'Введите имя клиента';
        errorEl.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Создание записи...';

    try {
        var { error } = await supabase
            .from('bookings')
            .insert({
                specialist_id: cabinetUser.id,
                service_id: serviceId,
                booking_date: manualBookingDate,
                booking_time: manualBookingTime,
                duration: duration,
                price: price,
                customer_name: clientName,
                customer_phone: clientPhone.replace(/\D/g, '').length > 0 ? '+' + clientPhone.replace(/\D/g, '') : null,
                status: 'confirmed',
                source: 'specialist_manual'
            });

        if (error) throw error;

        successEl.textContent = 'Клиент записан!';
        successEl.style.display = 'block';

        // Очистить форму
        document.getElementById('manualClientName').value = '';
        document.getElementById('manualClientPhone').value = '';
        manualBookingTime = null;
        var grid = document.getElementById('manualTimeSlotsGrid');
        if (grid) {
            grid.querySelectorAll('.time-slot').forEach(function(s) {
                s.classList.remove('selected');
            });
        }

        // Перезагрузить слоты (обновить доступные)
        loadManualBookingSlots();

        if (typeof telegramApp !== 'undefined') {
            telegramApp.hapticFeedback('success');
        }
    } catch (err) {
        console.error('Manual booking error:', err);
        errorEl.textContent = err.message || 'Ошибка создания записи';
        errorEl.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Записать';
    }
}

// ===================================
// СМЕНА ПАРОЛЯ
// ===================================

function renderChangePassword(container) {
    container.innerHTML = '<div class="subview-card">' +
        '<form onsubmit="handleChangePassword(event)">' +
            '<div class="form-group">' +
                '<label>Текущий пароль</label>' +
                '<input type="password" id="currentPassword" required placeholder="Текущий пароль">' +
            '</div>' +
            '<div class="form-group">' +
                '<label>Новый пароль</label>' +
                '<input type="password" id="newPassword" required placeholder="Новый пароль" minlength="6">' +
            '</div>' +
            '<div class="form-group">' +
                '<label>Подтвердите пароль</label>' +
                '<input type="password" id="confirmPassword" required placeholder="Повторите пароль">' +
            '</div>' +
            '<div id="changePasswordError" class="login-error" style="display:none;"></div>' +
            '<div id="changePasswordSuccess" class="login-success" style="display:none;"></div>' +
            '<button type="submit" class="btn-primary" id="changePasswordBtn">Сменить пароль</button>' +
        '</form>' +
    '</div>';
}

async function handleChangePassword(event) {
    event.preventDefault();

    var current = document.getElementById('currentPassword').value;
    var newPass = document.getElementById('newPassword').value;
    var confirm = document.getElementById('confirmPassword').value;
    var errorEl = document.getElementById('changePasswordError');
    var successEl = document.getElementById('changePasswordSuccess');

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
        var { data, error } = await supabase
            .from('specialists')
            .select('*')
            .order('last_name');

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<div class="subview-empty-state"><h3>Нет специалистов</h3></div>';
            return;
        }

        container.innerHTML = '<div class="subview-list">' +
            data.map(function(s) {
                return '<div class="subview-list-item">' +
                    '<div class="subview-list-item-name">' + s.first_name + ' ' + s.last_name + '</div>' +
                    '<div class="subview-list-item-meta">' + s.phone + ' | ' + (s.specialty || '') + '</div>' +
                    '<div class="subview-list-item-meta">' + (s.is_active ? 'Активен' : 'Неактивен') + '</div>' +
                '</div>';
            }).join('') +
        '</div>';
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
        var { data, error } = await supabase
            .from('services')
            .select('*')
            .order('name');

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<div class="subview-empty-state"><h3>Нет услуг</h3></div>';
            return;
        }

        container.innerHTML = '<div class="subview-list">' +
            data.map(function(s) {
                return '<div class="subview-list-item">' +
                    '<div class="subview-list-item-name">' + s.name + '</div>' +
                    '<div class="subview-list-item-meta">' + s.price + ' ₽ | ' + s.duration + ' мин | ' + (s.category || '') + '</div>' +
                '</div>';
            }).join('') +
        '</div>';
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
        var { data, error } = await supabase
            .from('bookings')
            .select('*, services(name), specialists(first_name, last_name)')
            .order('booking_date', { ascending: false })
            .limit(50);

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<div class="subview-empty-state"><h3>Записей нет</h3></div>';
            return;
        }

        container.innerHTML = '<div class="subview-list">' +
            data.map(function(b) {
                var masterName = b.specialists ? (b.specialists.first_name + ' ' + b.specialists.last_name) : '—';
                return '<div class="subview-list-item">' +
                    '<div class="subview-list-item-name">' + (b.services ? b.services.name : 'Услуга') + '</div>' +
                    '<div class="subview-list-item-meta">' +
                        b.booking_date + ' в ' + (b.booking_time ? b.booking_time.slice(0,5) : '') + ' | ' + b.status +
                    '</div>' +
                    '<div class="subview-list-item-meta">' +
                        'Клиент: ' + (b.customer_name || '—') + ' | Мастер: ' + masterName +
                    '</div>' +
                '</div>';
            }).join('') +
        '</div>';
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
        var { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<div class="subview-empty-state"><h3>Клиентов нет</h3></div>';
            return;
        }

        container.innerHTML = '<div class="subview-list">' +
            data.map(function(c) {
                return '<div class="subview-list-item">' +
                    '<div class="subview-list-item-name">' + (c.name || 'Без имени') + '</div>' +
                    '<div class="subview-list-item-meta">' + (c.phone || '') + ' | Бонусы: ' + (c.bonuses || 0) + '</div>' +
                '</div>';
            }).join('') +
        '</div>';
    } catch (err) {
        console.error('Load clients error:', err);
        container.innerHTML = '<div class="subview-error">Ошибка загрузки</div>';
    }
}

// ===================================
// КАРТА ЛОЯЛЬНОСТИ
// ===================================

function updateLoyaltyCard() {
    var nameEl = document.getElementById('loyaltyName');
    var balanceEl = document.getElementById('loyaltyBalance');
    var refLinkEl = document.getElementById('refLink');

    if (cabinetUser) {
        nameEl.textContent = cabinetUser.name;
        balanceEl.textContent = cabinetUser.bonuses || '0';

        if (cabinetUser.referral_code) {
            var botUsername = 'beauty_studio_bot';
            refLinkEl.textContent = 't.me/' + botUsername + '?start=' + cabinetUser.referral_code;
        } else {
            refLinkEl.textContent = 'Код не назначен';
        }
    }
}

// ===================================
// РЕФЕРАЛЬНАЯ ССЫЛКА
// ===================================

function copyRefLink() {
    var refLinkEl = document.getElementById('refLink');
    var text = refLinkEl.textContent;

    if (!text || text === 'Войдите в кабинет' || text === 'Код не назначен') {
        if (typeof telegramApp !== 'undefined') {
            telegramApp.showAlert('Войдите в кабинет, чтобы получить реферальную ссылку');
        } else {
            alert('Войдите в кабинет, чтобы получить реферальную ссылку');
        }
        return;
    }

    if (navigator.clipboard) {
        navigator.clipboard.writeText('https://' + text).then(function() {
            if (typeof telegramApp !== 'undefined') {
                telegramApp.showAlert('Ссылка скопирована!');
                telegramApp.hapticFeedback('success');
            } else {
                alert('Ссылка скопирована!');
            }
        });
    } else {
        var textarea = document.createElement('textarea');
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

function initCabinetPhoneMask(inputId) {
    var phoneInput = document.getElementById(inputId);
    if (!phoneInput || phoneInput.dataset.masked) return;

    phoneInput.dataset.masked = 'true';

    phoneInput.addEventListener('input', function(e) {
        var value = e.target.value.replace(/\D/g, '');

        if (value.length > 0) {
            if (value[0] === '8') value = '7' + value.slice(1);
            if (value[0] !== '7') value = '7' + value;
        }

        var formatted = '';
        if (value.length > 0) formatted = '+7';
        if (value.length > 1) formatted += ' (' + value.slice(1, 4);
        if (value.length > 4) formatted += ') ' + value.slice(4, 7);
        if (value.length > 7) formatted += '-' + value.slice(7, 9);
        if (value.length > 9) formatted += '-' + value.slice(9, 11);

        e.target.value = formatted;
    });
}

// ===================================
// ИНИЦИАЛИЗАЦИЯ (вызывается после загрузки DOM)
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    initLogoTripleClick();
});

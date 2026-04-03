// ===================================
// MAX WEB APP SDK (+ Telegram fallback)
// ===================================
// Приоритет: window.WebApp (MAX) → window.Telegram.WebApp (Telegram) → mock

class TelegramApp {
    constructor() {
        // MAX SDK определяет window.WebApp
        // Telegram SDK определяет window.Telegram.WebApp
        this.isMAX = !!window.WebApp;
        this.tg = window.WebApp || window.Telegram?.WebApp || null;
        this.user = null;
        this.init();
    }

    init() {
        if (this.tg) {
            this.tg.ready();

            // expand() есть в Telegram, в MAX может отсутствовать
            if (typeof this.tg.expand === 'function') {
                this.tg.expand();
            }

            this.user = this.tg.initDataUnsafe?.user || null;

            if (this.user?.id) {
                localStorage.setItem('telegram_id', this.user.id.toString());
                console.log(`📱 ${this.isMAX ? 'MAX' : 'Telegram'} user:`, this.user.id);
            }

            this.setupTheme();
            this.setupButtons();

            console.log(`✅ ${this.isMAX ? 'MAX' : 'Telegram'} WebApp инициализирован`);
        } else if (CONFIG.DEV_MODE) {
            console.log('🔧 DEV_MODE активирован');
            this.user = CONFIG.MOCK_USER;
            this.tg = this._createMock();
        } else {
            console.warn('⚠️ WebApp API недоступен — используется mock');
            this.user = CONFIG.MOCK_USER;
            this.tg = this._createMock();
        }
    }

    setupTheme() {
        if (!this.tg) return;

        const theme = this.tg.colorScheme || 'light';
        document.body.setAttribute('data-theme', theme);

        const params = this.tg.themeParams;
        if (params) {
            const root = document.documentElement;
            if (params.bg_color)     root.style.setProperty('--tg-bg-color',     params.bg_color);
            if (params.text_color)   root.style.setProperty('--tg-text-color',   params.text_color);
            if (params.button_color) root.style.setProperty('--tg-button-color', params.button_color);
        }
    }

    setupButtons() {
        // BackButton — есть и в MAX, и в Telegram
        if (this.tg?.BackButton) {
            this.tg.BackButton.hide();
        }

        // MainButton — только Telegram, в MAX отсутствует
        if (!this.isMAX && this.tg?.MainButton) {
            this.tg.MainButton.hide();
        }
    }

    // -----------------------------------------------
    // ЗАПРОС ТЕЛЕФОНА (нативный диалог MAX)
    // callback(phone: string | null)
    // -----------------------------------------------
    requestContact(callback) {
        if (this.isMAX && typeof this.tg?.requestContact === 'function') {
            // Событие по документации MAX: WebAppRequestPhone
            // Данные: { phone: string }
            const handler = (data) => {
                this.tg.offEvent('WebAppRequestPhone', handler);
                const phone = data?.phone || null;
                callback(phone);
            };
            this.tg.onEvent('WebAppRequestPhone', handler);
            this.tg.requestContact();
        } else {
            // Telegram или mock — нативного диалога нет
            callback(null);
        }
    }

    // -----------------------------------------------
    // УВЕДОМЛЕНИЯ
    // -----------------------------------------------
    showAlert(message) {
        console.log('Alert:', message);
    }

    showConfirm(message, callback) {
        if (this.tg?.showConfirm) {
            this.tg.showConfirm(message, callback);
        } else {
            callback(true);
        }
    }

    // -----------------------------------------------
    // HAPTIC FEEDBACK (одинаковый API в MAX и Telegram)
    // -----------------------------------------------
    hapticFeedback(type = 'medium') {
        const hf = this.tg?.HapticFeedback;
        if (!hf) return;

        switch (type) {
            case 'light':   hf.impactOccurred('light');           break;
            case 'medium':  hf.impactOccurred('medium');          break;
            case 'heavy':   hf.impactOccurred('heavy');           break;
            case 'success': hf.notificationOccurred('success');   break;
            case 'warning': hf.notificationOccurred('warning');   break;
            case 'error':   hf.notificationOccurred('error');     break;
            default:        hf.impactOccurred('medium');
        }
    }

    // -----------------------------------------------
    // УПРАВЛЕНИЕ ПРИЛОЖЕНИЕМ
    // -----------------------------------------------
    close() {
        if (typeof this.tg?.close === 'function') {
            this.tg.close();
        }
    }

    sendData(data) {
        if (typeof this.tg?.sendData === 'function') {
            this.tg.sendData(JSON.stringify(data));
        }
    }

    // -----------------------------------------------
    // ШЕРИНГ (MAX: shareMaxContent / нативный: shareContent)
    // -----------------------------------------------
    shareApp() {
        const text = CONFIG.SHOP.name + ' — магазин брелков';
        const link = 'https://max.ru/' + CONFIG.SHOP.maxBotUsername;

        if (this.isMAX && typeof this.tg?.shareMaxContent === 'function') {
            // Шеринг внутри MAX (в чаты пользователя)
            this.tg.shareMaxContent({ text, link });
        } else if (typeof this.tg?.shareContent === 'function') {
            // Нативный системный шеринг (Telegram / другие платформы)
            this.tg.shareContent({ text, link });
        } else if (navigator.share) {
            // Web Share API fallback
            navigator.share({ title: CONFIG.SHOP.name, text, url: link });
        }
    }

    // -----------------------------------------------
    // ДАННЫЕ ПОЛЬЗОВАТЕЛЯ
    // -----------------------------------------------
    getUser() {
        return this.user;
    }

    getUserId() {
        return this.user?.id || CONFIG.MOCK_USER.id;
    }

    getUserName() {
        const u = this.user || CONFIG.MOCK_USER;
        return u.first_name + (u.last_name ? ' ' + u.last_name : '');
    }

    // -----------------------------------------------
    // MOCK (dev / вне мессенджера)
    // -----------------------------------------------
    _createMock() {
        return {
            ready:          () => console.log('Mock: ready'),
            expand:         () => console.log('Mock: expand'),
            close:          () => console.log('Mock: close'),
            showAlert:      (msg) => console.log('Mock alert:', msg),
            showPopup:      ({ message }) => console.log('Mock popup:', message),
            showConfirm:    (msg, cb) => cb(confirm(msg)),
            sendData:       (d) => console.log('Mock: sendData', d),
            requestContact: () => console.log('Mock: requestContact'),
            onEvent:        (ev, cb) => console.log('Mock: onEvent', ev),
            offEvent:       (ev, cb) => console.log('Mock: offEvent', ev),
            BackButton: {
                show:     () => {},
                hide:     () => {},
                onClick:  () => {},
                offClick: () => {}
            },
            HapticFeedback: {
                impactOccurred:      (s) => console.log('Mock: impact', s),
                notificationOccurred:(t) => console.log('Mock: notify', t),
                selectionChanged:    ()  => console.log('Mock: selection')
            }
        };
    }
}

// Глобальный экземпляр
const telegramApp = new TelegramApp();

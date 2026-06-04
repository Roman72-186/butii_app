// ===================================
// MAX WEB APP WRAPPER
// ===================================

class MaxApp {
    constructor() {
        this.sdk = window.WebApp || null;
        this.user = null;
        this.startParam = null;
        this.init();
    }

    init() {
        if (this.sdk) {
            this.sdk.ready();
            if (typeof this.sdk.expand === 'function') {
                this.sdk.expand();
            }

            this.user = this.sdk.initDataUnsafe?.user || null;
            this.startParam = this.sdk.initDataUnsafe?.start_param || new URLSearchParams(location.search).get('startapp');

            if (this.user?.id) {
                localStorage.setItem('max_user_id', String(this.user.id));
            }

            this.setupTheme();
            this.setupButtons();
            return;
        }

        this.user = CONFIG.MOCK_USER;
        this.startParam = new URLSearchParams(location.search).get('startapp') || 'demo_direct';
        this.sdk = this.createMock();
    }

    setupTheme() {
        const theme = this.sdk?.colorScheme || 'light';
        document.body.setAttribute('data-max-theme', theme);

        const params = this.sdk?.themeParams;
        if (!params) return;

        const root = document.documentElement;
        if (params.bg_color) root.style.setProperty('--max-bg-color', params.bg_color);
        if (params.text_color) root.style.setProperty('--max-text-color', params.text_color);
        if (params.button_color) root.style.setProperty('--max-button-color', params.button_color);
    }

    setupButtons() {
        if (this.sdk?.BackButton) {
            this.sdk.BackButton.hide();
        }
    }

    hapticFeedback(type = 'medium') {
        const feedback = this.sdk?.HapticFeedback;
        if (!feedback) return;

        if (['success', 'warning', 'error'].includes(type)) {
            feedback.notificationOccurred(type);
            return;
        }

        feedback.impactOccurred(type);
    }

    requestContact(callback) {
        if (typeof this.sdk?.requestContact !== 'function') {
            callback(null);
            return;
        }

        const handler = (data) => {
            this.sdk.offEvent('WebAppRequestPhone', handler);
            callback(data?.phone || null);
        };

        this.sdk.onEvent('WebAppRequestPhone', handler);
        this.sdk.requestContact();
    }

    shareApp(orderNumber = '') {
        const text = orderNumber
            ? `Я оформил заказ ${orderNumber} в MAX Burger`
            : 'MAX Burger: горячие бургеры, крылья и оплата прямо в MAX';
        const link = `https://max.ru/${CONFIG.SHOP.maxBotUsername}`;

        if (typeof this.sdk?.shareMaxContent === 'function') {
            this.sdk.shareMaxContent({ text, link });
            return;
        }

        if (navigator.share) {
            navigator.share({ title: CONFIG.SHOP.name, text, url: link });
        }
    }

    getUser() {
        return this.user || CONFIG.MOCK_USER;
    }

    getUserId() {
        return String(this.getUser()?.id || CONFIG.MOCK_USER.id);
    }

    getUserName() {
        const user = this.getUser();
        return [user.first_name, user.last_name].filter(Boolean).join(' ') || 'MAX User';
    }

    createMock() {
        return {
            ready: () => {},
            expand: () => {},
            close: () => {},
            requestContact: () => {},
            onEvent: () => {},
            offEvent: () => {},
            BackButton: { show: () => {}, hide: () => {}, onClick: () => {}, offClick: () => {} },
            HapticFeedback: {
                impactOccurred: () => {},
                notificationOccurred: () => {},
            },
        };
    }
}

const maxApp = new MaxApp();

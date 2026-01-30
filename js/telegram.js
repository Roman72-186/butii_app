// ===================================
// TELEGRAM WEB APP API
// ===================================

class TelegramApp {
    constructor() {
        this.tg = window.Telegram?.WebApp;
        this.user = null;
        this.init();
    }

    init() {
        if (this.tg) {
            // Реальное окружение Telegram
            this.tg.ready();
            this.tg.expand();
            this.user = this.tg.initDataUnsafe?.user;
            
            // Сохраняем telegram_id в localStorage для дальнейшего использования
            if (this.user && this.user.id) {
                localStorage.setItem('telegram_id', this.user.id.toString());
                console.log('📱 Telegram ID сохранен в localStorage:', this.user.id);
                console.log('🆔 Telegram ID:', this.user?.id);
            }
            
            // Настройка темы
            this.setupTheme();
            
            // Настройка кнопок
            this.setupButtons();
            
            console.log('📱 Telegram Web App инициализирован');
            console.log('👤 Пользователь:', this.user);
        } else if (CONFIG.DEV_MODE) {
            // Режим разработки - используем mock данные
            console.log('🔧 Режим разработки активирован');
            this.user = CONFIG.MOCK_USER;
            this.tg = this.createMockTelegram();
        } else {
            console.warn('⚠️ Telegram Web App API недоступен');
            this.user = CONFIG.MOCK_USER;
            this.tg = this.createMockTelegram();
        }
    }

    setupTheme() {
        if (!this.tg) return;
        
        const theme = this.tg.colorScheme || 'light';
        document.body.setAttribute('data-theme', theme);
        
        // Установка цветов из темы Telegram
        if (this.tg.themeParams) {
            const root = document.documentElement;
            if (this.tg.themeParams.bg_color) {
                root.style.setProperty('--tg-bg-color', this.tg.themeParams.bg_color);
            }
            if (this.tg.themeParams.text_color) {
                root.style.setProperty('--tg-text-color', this.tg.themeParams.text_color);
            }
            if (this.tg.themeParams.button_color) {
                root.style.setProperty('--tg-button-color', this.tg.themeParams.button_color);
            }
        }
    }

    setupButtons() {
        if (!this.tg?.MainButton) return;
        
        // Скрываем главную кнопку по умолчанию
        this.tg.MainButton.hide();
    }

    showMainButton(text, onClick) {
        if (!this.tg?.MainButton) return;
        
        this.tg.MainButton.setText(text);
        this.tg.MainButton.show();
        this.tg.MainButton.onClick(onClick);
    }

    hideMainButton() {
        if (!this.tg?.MainButton) return;
        
        this.tg.MainButton.hide();
        this.tg.MainButton.offClick(() => {});
    }

    showAlert(message) {
        // Проверяем доступность методов в порядке приоритета
        if (this.tg?.showPopup) {
            this.tg.showPopup({
                message: message
            });
        } else if (this.tg?.showAlert) {
            this.tg.showAlert(message);
        } else {
            // Fallback на стандартный alert
            alert(message);
        }
    }

    showConfirm(message, callback) {
        if (this.tg?.showConfirm) {
            this.tg.showConfirm(message, callback);
        } else {
            const result = confirm(message);
            callback(result);
        }
    }

    hapticFeedback(type = 'impact') {
        if (!this.tg?.HapticFeedback) return;
        
        switch (type) {
            case 'light':
                this.tg.HapticFeedback.impactOccurred('light');
                break;
            case 'medium':
                this.tg.HapticFeedback.impactOccurred('medium');
                break;
            case 'heavy':
                this.tg.HapticFeedback.impactOccurred('heavy');
                break;
            case 'success':
                this.tg.HapticFeedback.notificationOccurred('success');
                break;
            case 'warning':
                this.tg.HapticFeedback.notificationOccurred('warning');
                break;
            case 'error':
                this.tg.HapticFeedback.notificationOccurred('error');
                break;
            default:
                this.tg.HapticFeedback.impactOccurred('medium');
        }
    }

    close() {
        if (this.tg?.close) {
            this.tg.close();
        } else {
            console.log('Mock: Закрытие приложения');
        }
    }

    sendData(data) {
        if (this.tg?.sendData) {
            this.tg.sendData(JSON.stringify(data));
        } else {
            console.log('Mock: Отправка данных боту:', data);
        }
    }

    createMockTelegram() {
        return {
            ready: () => console.log('Mock: ready'),
            expand: () => console.log('Mock: expand'),
            close: () => console.log('Mock: close'),
            showAlert: (msg) => alert(msg),
            showConfirm: (msg, cb) => cb(confirm(msg)),
            sendData: (data) => console.log('Mock: sendData', data),
            MainButton: {
                setText: (text) => console.log('Mock: MainButton.setText', text),
                show: () => console.log('Mock: MainButton.show'),
                hide: () => console.log('Mock: MainButton.hide'),
                onClick: (cb) => console.log('Mock: MainButton.onClick'),
                offClick: (cb) => console.log('Mock: MainButton.offClick')
            },
            HapticFeedback: {
                impactOccurred: (style) => console.log('Mock: Haptic', style),
                notificationOccurred: (type) => console.log('Mock: Notification', type),
                selectionChanged: () => console.log('Mock: Selection changed')
            }
        };
    }

    getUser() {
        return this.user;
    }

    getUserId() {
        return this.user?.id || CONFIG.MOCK_USER.id;
    }

    getUserName() {
        const user = this.user || CONFIG.MOCK_USER;
        return user.first_name + (user.last_name ? ' ' + user.last_name : '');
    }
}

// Создаем глобальный экземпляр
const telegramApp = new TelegramApp();

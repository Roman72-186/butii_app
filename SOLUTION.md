# Решение проблемы запуска бота LeadTex по Telegram ссылке

## Проблема

Необходимо запускать бота на LeadTex по Telegram ссылке с доменом telegram (t.me), а не с доменом leadteh.

## Решение

### 1. Понимание архитектуры

Для корректного запуска бота по ссылке с доменом telegram (t.me), нужно правильно настроить интеграцию между:

- Telegram Bot API
- LeadTex платформой
- Mini App приложением
- Bridge компонентом для атрибуции рекламных кампаний

### 2. Два варианта запуска

#### Вариант 1: Прямой запуск Mini App (для обычного использования)
```
https://t.me/your_bot_username?startapp=miniapp_identifier
```

#### Вариант 2: Запуск через Bridge (для рекламных кампаний с атрибуцией)
```
https://t.me/your_bot_username/bridge?startapp=campaign_tag
```

### 3. Правильная настройка бота

#### Шаг 1: Создание бота в Telegram
1. Обратитесь к @BotFather в Telegram
2. Создайте нового бота с помощью команды `/newbot`
3. Получите токен API для вашего бота

#### Шаг 2: Настройка Mini App в BotFather
1. Используйте команду `/newapp` или `/setmenubutton`
2. Установите URL для Mini App (например, `https://your-app.vercel.app/`)
3. Установите короткое имя для приложения (например, `shop`)

#### Шаг 3: Интеграция с LeadTex
1. Зарегистрируйтесь на [LeadTex](https://app.leadteh.ru/)
2. Перейдите в раздел "Настройки" → "Мессенджеры"
3. Подключите Telegram, вставив токен API
4. Настройте сценарии взаимодействия с ботом

### 4. Настройка Bridge для рекламной атрибуции

Bridge компонент позволяет сохранять атрибуцию рекламных кампаний:

1. **Разверните bridge** на Vercel или другом хостинге
2. **Настройте переменные окружения** в `.env` файле:
   ```
   LEADTEH_WEBHOOK_URL=https://your-leadteh-account.leadteh.ru/inner_webhook/your-webhook-uuid
   ```
3. **Обновите BOT_USERNAME** в `bridge/index.html` на ваш реальный username бота
4. **Настройте Mini App** в BotFather с коротким именем `bridge`

### 5. Формирование правильной ссылки

#### Для обычного запуска:
```
https://t.me/your_bot_username?startapp=miniapp_identifier
```

#### Для рекламных кампаний:
```
https://t.me/your_bot_username/bridge?startapp=campaign_tag
```

Где:
- `your_bot_username` - это username вашего Telegram бота (например, `@mykeychainshop_bot`)
- `miniapp_identifier` - идентификатор вашего Mini App (опционально)
- `campaign_tag` - тег рекламной кампании (например, `facebook_retargering`)

### 6. Как это работает в нашем приложении

#### В основном приложении (Keychain Shop):
1. **Получение данных пользователя**:
   ```javascript
   // telegram.js
   this.user = this.tg.initDataUnsafe?.user;
   getUserId() {
       return this.user?.id;  // например: 123456789
   }
   ```

2. **Отправка данных в LeadTex**:
   ```javascript
   // app.js
   fetch(CONFIG.WEBHOOK_URL, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
           contact_by: 'telegram_id',
           search: '123456789',  // ID пользователя из Telegram
           variables: {
               // данные заказа
           }
       })
   })
   ```

#### В bridge приложении:
1. **Захват рекламного параметра**:
   ```javascript
   // bridge.js
   const startParam = extractStartParam(); // Получает campaign_tag
   ```

2. **Отправка данных в LeadTex**:
   ```javascript
   // api/bridge-webhook.js
   // Отправляет telegram_id и start_param в LeadTex
   ```

### 7. Ключевые моменты

- **Важно**: Пользователь должен сначала написать `/start` боту, чтобы LeadTex создал контакт с его `telegram_id`
- **Домен t.me**: Используется для запуска Mini App, как того требует Telegram
- **Bridge**: Используется для сохранения атрибуции рекламных кампаний
- **LeadTex webhook**: Обрабатывает данные на сервере LeadTex

### 8. Проверка работы

1. Убедитесь, что бот подключен к LeadTex
2. Проверьте, что webhook настроен корректно
3. Протестируйте обе ссылки:
   - Обычная: `https://t.me/your_bot_username?startapp=identifier`
   - Через bridge: `https://t.me/your_bot_username/bridge?startapp=campaign`
4. Убедитесь, что данные пользователя корректно передаются и обрабатываются

### 9. Тестирование

Для тестирования в консоли браузера выполните:
```javascript
console.log(telegramApp.getUserId()); // Проверка получения ID
console.log(telegramApp.getUser());   // Проверка получения полных данных
```

При оформлении заказа вы увидите логи отправки в LeadTex.

## Заключение

Теперь бот может быть запущен по ссылке с доменом telegram (t.me), при этом сохраняется полная интеграция с LeadTex. Bridge компонент обеспечивает атрибуцию рекламных кампаний, позволяя отслеживать эффективность различных каналов привлечения пользователей.
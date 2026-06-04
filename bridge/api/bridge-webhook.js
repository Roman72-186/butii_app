/**
 * Vercel Serverless Function - Bridge Webhook Proxy
 *
 * 1. createOrUpdateContact — создаёт контакт, возвращает contact_id
 * 2. inner_webhook — передаёт start_param, CRM сохраняет через маппинг переменных
 */

// Используем переменные окружения или тестовые значения
const CRM_API_KEY = process.env.CRM_API_KEY;
const CRM_BOT_ID = process.env.CRM_BOT_ID;
const CRM_WEBHOOK_URL = process.env.CRM_WEBHOOK_URL;
const CRM_API_BASE = 'https://crm.example.com/api/v1';

// Проверяем обязательные переменные окружения
if (!CRM_WEBHOOK_URL) {
    console.error('[Bridge] ОШИБКА: Не установлен CRM_WEBHOOK_URL в переменных окружения');
}

async function CRMApiPost(endpoint, payload) {
    // Если API ключ не установлен, возвращаем ошибку
    if (!CRM_API_KEY) {
        throw new Error('CRM_API_KEY не установлен');
    }
    
    const url = `${CRM_API_BASE}/${endpoint}?api_token=${CRM_API_KEY}`;
    return await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(payload)
    });
}

export default async function handler(req, res) {
    // Настройка CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    // Обработка preflight запросов
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    // Разрешаем только POST запросы
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Метод не разрешен' 
        });
    }

    try {
        const body = req.body;
        
        // Проверяем наличие обязательного параметра telegram_id
        if (!body || !body.telegram_id) {
            return res.status(400).json({ 
                success: false, 
                error: 'telegram_id обязателен' 
            });
        }

        const telegramId = body.telegram_id.toString();
        const startParam = body.start_param || '';
        const firstName = body.user_data?.first_name || '';
        const lastName = body.user_data?.last_name || '';
        const userName = [firstName, lastName].filter(Boolean).join(' ') || 'Пользователь';
        const username = body.user_data?.username || null;

        console.log('[Bridge] ===== НАЧАЛО =====');
        console.log('[Bridge] telegram_id:', telegramId);
        console.log('[Bridge] start_param:', startParam);

        // ─── Этап 1: createOrUpdateContact ────────────────────────────────
        console.log('[Bridge] Этап 1: createOrUpdateContact...');
        
        const createPayload = {
            bot_id: CRM_BOT_ID ? parseInt(CRM_BOT_ID) : undefined,
            messenger: 'max',
            name: userName
        };

        if (telegramId) createPayload.telegram_id = telegramId;
        if (username) createPayload.telegram_username = username;

        console.log('[Bridge] createPayload:', JSON.stringify(createPayload));
        
        let createRes, createText;
        
        // Выполняем создание контакта только если установлены необходимые переменные
        let contactId = null;
        if (CRM_API_KEY && CRM_BOT_ID) {
            createRes = await CRMApiPost('createOrUpdateContact', createPayload);
            createText = await createRes.text();
            console.log('[Bridge] createOrUpdateContact status:', createRes.status);
            console.log('[Bridge] createOrUpdateContact response:', createText);

            try {
                const createJson = JSON.parse(createText);
                contactId = createJson?.data?.id || createJson?.id || null;
                console.log('[Bridge] Получен contact_id:', contactId);
            } catch (e) {
                console.log('[Bridge] Не удалось распарсить ответ');
            }
        } else {
            console.log('[Bridge] Пропускаем createOrUpdateContact - не все переменные окружения установлены');
        }

        // ─── Этап 2: inner_webhook (сохраняет start_param через маппинг) ──
        // Если есть contact_id из Этапа 1, используем его, иначе telegram_id
        const contactBy = contactId ? 'id' : 'telegram_id';
        const search = contactId ? contactId.toString() : telegramId;
        
        console.log('[Bridge] Этап 2: inner_webhook (contact_by=' + contactBy + ', search=' + search + ')...');

        // Выполняем вызов вебхука CRM
        let webhookStatus = 'skipped';
        if (CRM_WEBHOOK_URL) {
            const webhookRes = await fetch(CRM_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contact_by: contactBy,
                    search: search,
                    start_param: startParam
                })
            });
            const webhookText = await webhookRes.text();
            webhookStatus = webhookRes.status;
            console.log('[Bridge] inner_webhook status:', webhookRes.status);
            console.log('[Bridge] inner_webhook response:', webhookText);
        } else {
            console.error('[Bridge] CRM_WEBHOOK_URL не установлен');
        }

        console.log('[Bridge] ===== КОНЕЦ =====');

        return res.status(200).json({
            success: true,
            contact_id: contactId,
            webhook_status: webhookStatus,
            start_param: startParam,
            message: 'Данные успешно переданы в CRM'
        });

    } catch (error) {
        console.error('[Bridge] ОШИБКА:', error.message);
        return res.status(500).json({ 
            success: false, 
            error: 'Внутренняя ошибка сервера', 
            message: error.message 
        });
    }
}

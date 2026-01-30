// Vercel Serverless Function для проксирования запросов к LEADTEX
// Это решает проблему CORS

export default async function handler(req, res) {
    // Логируем информацию о запросе
    console.log('Webhook received:', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body
    });

    // Разрешаем только POST запросы
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Получаем URL вебхука LEADTEX из переменных окружения или используем значение по умолчанию
    const WEBHOOK_URL = process.env.LEADTEX_WEBHOOK_URL || 'https://rb786743.leadteh.ru/inner_webhook/bf5c8437-6871-4c61-b23b-c4d65b847aa8';

    try {
        // Проксируем запрос к LEADTEX
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.text();
        
        // Логируем ответ от LEADTEX
        console.log('Response from LEADTEX:', {
            status: response.status,
            ok: response.ok,
            data: data
        });
        
        // Возвращаем ответ клиенту
        return res.status(response.status).json({
            success: response.ok,
            status: response.status,
            data: data
        });

    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({
            error: 'Failed to send request to LEADTEX',
            message: error.message
        });
    }
}

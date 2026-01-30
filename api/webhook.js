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

    // URL вебхука LEADTEX
    const WEBHOOK_URL = 'https://rb786743.leadteh.ru/inner_webhook/4228d48d-9a90-40aa-b249-664e73405c4a';

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

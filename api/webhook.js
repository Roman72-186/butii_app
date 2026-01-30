// Vercel Serverless Function для проксирования запросов к LEADTEX
// Это решает проблему CORS

export default async function handler(req, res) {
    // Разрешаем только POST запросы
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // URL вебхука LEADTEX
    const WEBHOOK_URL = 'https://rb786743.leadteh.ru/inner_webhook/1f829cc9-3da3-4485-a97d-350e0d34baa1';

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
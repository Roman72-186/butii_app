// Vercel Serverless Function для проксирования запросов к LEADTEX
// Это решает проблему CORS

export default async function handler(req, res) {
    // Разрешаем только POST запросы
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // URL вебхука SMS-NJMAX (MAX-мессенджер) в LeadTeX
    const WEBHOOK_URL = 'https://rb786743.leadteh.ru/inner_webhook/ed15c46a-5b2b-44fb-82b1-283059365c41';

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
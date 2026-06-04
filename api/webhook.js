// Legacy Vercel-compatible CRM proxy.
// Main production path is Express server.js; this file is kept only to avoid
// hardcoded CRM URLs if somebody deploys the old Vercel setup by mistake.

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
    }

    const webhookUrl = process.env.CRM_WEBHOOK_URL;
    if (!webhookUrl) {
        return res.status(501).json({ ok: false, error: 'CRM_WEBHOOK_URL_NOT_CONFIGURED' });
    }

    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };

    if (process.env.CRM_WEBHOOK_SECRET) {
        headers['x-webhook-secret'] = process.env.CRM_WEBHOOK_SECRET;
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(req.body),
        });
        const data = await response.text();
        return res.status(response.status).json({ ok: response.ok, data });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            error: 'CRM_PROXY_FAILED',
            message: error.message,
        });
    }
}

const crypto = require('crypto')

function base64url(input) {
  return Buffer.from(input).toString('base64url')
}

function getSecret() {
  const secret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'dev-secret-change-me')
  if (!secret) {
    throw new Error('JWT_SECRET is required')
  }
  return secret
}

function signToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const body = {
    ...payload,
    iat: now,
    exp: now + 24 * 60 * 60,
  }

  const encodedHeader = base64url(JSON.stringify(header))
  const encodedBody = base64url(JSON.stringify(body))
  const unsigned = `${encodedHeader}.${encodedBody}`
  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(unsigned)
    .digest('base64url')

  return `${unsigned}.${signature}`
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [encodedHeader, encodedBody, signature] = parts
  const unsigned = `${encodedHeader}.${encodedBody}`
  const expected = crypto
    .createHmac('sha256', getSecret())
    .update(unsigned)
    .digest('base64url')

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedBody, 'base64url').toString('utf8'))
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.replace(/^Bearer\s+/i, '')
  const payload = verifyToken(token)
  if (!payload?.sub) {
    return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' })
  }
  req.user = payload
  return next()
}

module.exports = {
  signToken,
  verifyToken,
  authMiddleware,
}


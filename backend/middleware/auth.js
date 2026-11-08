import { verifyToken } from '../config/jwt.js'

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    // Support Guest Sandbox token for reading data ONLY
    if (token === 'demo_guest_token_rb_2026') {
      const method = (req.method || 'GET').toUpperCase()
      if (method !== 'GET') {
        return res.status(403).json({
          error: 'Mode tamu (GS123) hanya memiliki akses baca (read-only) di server.'
        })
      }
      req.user = { id: 'guest-demo-user', username: 'GS123', role: 'guest' }
      return next()
    }

    const decoded = verifyToken(token)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

/**
 * Middleware that requires the authenticated user to have the 'admin' role.
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Akses ditolak. Peran administrator diperlukan.' })
  }
  next()
}

export default authMiddleware

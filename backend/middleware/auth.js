import jwt from 'jsonwebtoken'

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    // Support Guest Sandbox token for reading data
    if (token === 'demo_guest_token_rb_2026') {
      req.user = { id: 'guest-demo-user', username: 'GS123', role: 'guest' }
      return next()
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

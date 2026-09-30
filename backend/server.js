import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import slowDown from 'express-slow-down'
import orderRoutes from './routes/orders.js'
import memberRoutes from './routes/members.js'
import eventRoutes from './routes/events.js'
import configRoutes from './routes/config.js'
import faqRoutes from './routes/faqs.js'
import authRoutes from './routes/auth.js'
import uploadRoutes from './routes/upload.js'
import merchandiseRoutes from './routes/merchandise.js'
import merchOrdersRoutes from './routes/merchOrders.js'
import userRoutes from './routes/users.js'
import passwordResetRoutes from './routes/passwordReset.js'


const app = express()
const PORT = process.env.PORT || 5000

app.set('trust proxy', 1)
app.disable('x-powered-by')

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }))

const toNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

const rateLimitWindowMs = toNumber(process.env.RATE_LIMIT_WINDOW_MS, 60 * 1000)
const rateLimitMax = toNumber(process.env.RATE_LIMIT_MAX, 120)
const rateLimitAuthMax = toNumber(process.env.RATE_LIMIT_AUTH_MAX, 20)
const rateLimitUploadMax = toNumber(process.env.RATE_LIMIT_UPLOAD_MAX, 30)
const ordersLimitTwoMinWindowMs = toNumber(process.env.RATE_LIMIT_ORDERS_2MIN_WINDOW_MS, 2 * 60 * 1000)
const ordersLimitTenMinWindowMs = toNumber(process.env.RATE_LIMIT_ORDERS_10MIN_WINDOW_MS, 10 * 60 * 1000)
const ordersLimitTwoMinMax = toNumber(process.env.RATE_LIMIT_ORDERS_2MIN_MAX, 67)
const ordersLimitTenMinMax = toNumber(process.env.RATE_LIMIT_ORDERS_10MIN_MAX, 167)
const slowdownAfter = toNumber(process.env.SLOWDOWN_AFTER, 100)
const slowdownDelayMs = toNumber(process.env.SLOWDOWN_DELAY_MS, 250)
const slowdownMaxDelayMs = toNumber(process.env.SLOWDOWN_MAX_DELAY_MS, 5000)
const rateLimitEnabled = process.env.RATE_LIMIT_DISABLED !== 'true'

const getClientIp = (req) => {
  const cfIp = req.headers['cf-connecting-ip']
  if (typeof cfIp === 'string' && cfIp.trim().length > 0) {
    return cfIp.trim()
  }

  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.trim().length > 0) {
    return forwarded.split(',')[0].trim()
  }

  return req.ip
}

const createRateLimiter = (options) => rateLimit({
  windowMs: rateLimitWindowMs,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  skip: (req) => req.method === 'OPTIONS',
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests, please try again later.'
    })
  },
  ...options
})

const generalLimiter = createRateLimiter({ max: rateLimitMax })
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: rateLimitAuthMax
})
const uploadLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: rateLimitUploadMax
})
const ordersLimiterTwoMin = createRateLimiter({
  windowMs: ordersLimitTwoMinWindowMs,
  max: ordersLimitTwoMinMax
})
const ordersLimiterTenMin = createRateLimiter({
  windowMs: ordersLimitTenMinWindowMs,
  max: ordersLimitTenMinMax
})

const speedLimiter = slowDown({
  windowMs: rateLimitWindowMs,
  delayAfter: slowdownAfter,
  delayMs: (hits) => Math.min((hits - slowdownAfter) * slowdownDelayMs, slowdownMaxDelayMs),
  keyGenerator: getClientIp,
  skip: (req) => req.method === 'OPTIONS'
})

const noopLimiter = (req, res, next) => next()
const useLimiter = (limiter) => (rateLimitEnabled ? limiter : noopLimiter)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL
].filter(Boolean)

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true)
    // Allow all origins in development mode for easy local network testing (e.g., mobile phones, tablet, other PCs)
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true)
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(null, false)
  },
  credentials: true
}))

if (rateLimitEnabled) {
  app.use(speedLimiter)
  app.use(generalLimiter)
}
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Routes
app.use('/api/auth', useLimiter(authLimiter), authRoutes)
app.use('/api/orders', useLimiter(ordersLimiterTwoMin), useLimiter(ordersLimiterTenMin), orderRoutes)
app.use('/api/members', memberRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/config', configRoutes)
app.use('/api/faqs', faqRoutes)
app.use('/api/upload', useLimiter(uploadLimiter), uploadRoutes)
app.use('/api/merchandise', merchandiseRoutes)
app.use('/api/merch-orders', merchOrdersRoutes)
app.use('/api/users', userRoutes)
app.use('/api/password-reset', passwordResetRoutes)


// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Refresh Breeze API Running' })
})

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// Export for serverless
export default app

// Start server only when not in Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT}`)
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`)
  })
}

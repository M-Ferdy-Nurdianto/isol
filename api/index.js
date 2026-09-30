import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import slowDown from 'express-slow-down'
// Note: dotenv removed - Vercel provides environment variables directly via process.env
import orderRoutes from '../backend/routes/orders.js'
import memberRoutes from '../backend/routes/members.js'
import eventRoutes from '../backend/routes/events.js'
import configRoutes from '../backend/routes/config.js'
import faqRoutes from '../backend/routes/faqs.js'
import authRoutes from '../backend/routes/auth.js'
import uploadRoutes from '../backend/routes/upload.js'
import merchandiseRoutes from '../backend/routes/merchandise.js'
import merchOrdersRoutes from '../backend/routes/merchOrders.js'
import chekiPricesRoutes from '../backend/routes/chekiPrices.js'
import usersRoutes from '../backend/routes/users.js'
import { supabase } from '../backend/config/supabase.js'

const app = express()

app.set('trust proxy', 1)
app.disable('x-powered-by')

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'https://kohi-sekai-web.vercel.app',
  'https://kohisekai.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean)

// Middleware - CORS configuration
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

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin) return callback(null, true)
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, origin)
    }
    
    // Allow all vercel.app subdomains for preview deployments
    if (origin && origin.endsWith('.vercel.app')) {
      return callback(null, origin)
    }
    
    // Reject other origins
    return callback(null, false)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

if (rateLimitEnabled) {
  app.use(speedLimiter)
  app.use(generalLimiter)
}

// Handle preflight requests explicitly
app.options('*', cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Routes - keeping /api prefix as Express receives full path from Vercel
app.use('/api/auth', useLimiter(authLimiter), authRoutes)
app.use('/api/orders', useLimiter(ordersLimiterTwoMin), useLimiter(ordersLimiterTenMin), orderRoutes)
app.use('/api/members', memberRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/config', configRoutes)
app.use('/api/faqs', faqRoutes)
app.use('/api/upload', useLimiter(uploadLimiter), uploadRoutes)
app.use('/api/merchandise', merchandiseRoutes)
app.use('/api/merch-orders', merchOrdersRoutes)
app.use('/api/cheki-prices', chekiPricesRoutes)
app.use('/api/users', usersRoutes)

// Health check & Keep Alive
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected'
  try {
    const { error } = await supabase.from('events').select('id').limit(1)
    if (!error) dbStatus = 'connected'
  } catch (e) {
    dbStatus = 'error'
  }
  
  res.json({ 
    status: 'OK', 
    message: 'Kohi Sekai API Running',
    database: dbStatus,
    timestamp: new Date().toISOString()
  })
})

// Specific Keep Alive route for Vercel Cron
app.get('/api/cron/keep-alive', async (req, res) => {
  try {
    // Perform a simple query to keep Supabase active
    const { data, error } = await supabase.from('events').select('id').limit(1)
    if (error) throw error
    
    res.json({ success: true, message: 'Keep-alive success', data })
  } catch (error) {
    console.error('Cron Keep-alive failed:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Debug route to see what paths are received
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl,
    baseUrl: req.baseUrl,
    method: req.method
  })
})

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// Vercel serverless function handler
export default app

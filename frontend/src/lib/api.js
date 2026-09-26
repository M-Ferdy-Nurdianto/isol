import axios from 'axios'
import { showToast } from './toast'
import { isGuestMode, maskOrderForGuest, maskMerchOrderForGuest, generateGuestMockResponse } from './guestMock'
import { getValidAdminToken, touchAdminSession } from './authSession'

// In production (Vercel), use the API URL from environment variable
// In development, use localhost
let API_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL

if (!API_URL) {
  API_URL = import.meta.env.MODE === 'production' 
    ? '/api' 
    : `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:5000/api`
} else if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && API_URL.includes('localhost')) {
  // If accessing from a mobile device (non-localhost) but the API is configured with localhost,
  // dynamically substitute localhost with the computer's local IP address so requests reach the backend.
  API_URL = API_URL.replace('localhost', window.location.hostname)
}

const api = axios.create({
  baseURL: API_URL,
})

// Debug: Log API URL in production to help troubleshooting
if (import.meta.env.MODE === 'production') {
  // console.log('[API] Base URL:', API_URL)
}

// Add auth token to requests and handle Content-Type + Guest Mode sandbox interceptor
api.interceptors.request.use(
  (config) => {
    const token = getValidAdminToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      touchAdminSession()
    }

    // Only set Content-Type to JSON if data is not FormData
    // Let axios set the correct boundary for multipart/form-data
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json'
    }

    // GUEST SANDBOX INTERCEPTOR:
    // If guest mode is active, do NOT send write requests to the server / database.
    // Intercept with an in-memory mock adapter so the UI behaves as if successfully saved!
    if (isGuestMode()) {
      const method = (config.method || 'get').toLowerCase()
      if (method !== 'get') {
        config.adapter = async (cfg) => {
          const mockRes = generateGuestMockResponse(cfg)
          return {
            data: mockRes.data,
            status: mockRes.status,
            statusText: 'OK',
            headers: {},
            config: cfg,
            request: {}
          }
        }
      }
    }

    return config
  },
  (error) => Promise.reject(error)
)

const rateLimitToastId = 'rate-limit-toast'

api.interceptors.response.use(
  (response) => {
    // GUEST MODE DATA MASKING:
    // Mask sensitive customer data (name, contact, payment proof) while preserving cheki item details & quantities
    if (isGuestMode() && response?.data) {
      const url = response.config?.url || ''
      if (url.includes('/orders') && !url.includes('/orders/stats')) {
        if (Array.isArray(response.data.data)) {
          response.data.data = response.data.data.map(maskOrderForGuest)
        } else if (response.data.data && typeof response.data.data === 'object') {
          response.data.data = maskOrderForGuest(response.data.data)
        }
      } else if (url.includes('/merch-orders')) {
        if (Array.isArray(response.data.data)) {
          response.data.data = response.data.data.map(maskMerchOrderForGuest)
        } else if (response.data.data && typeof response.data.data === 'object') {
          response.data.data = maskMerchOrderForGuest(response.data.data)
        }
      }
    }

    return response
  },
  (error) => {
    const status = error?.response?.status
    if (status === 429) {
      const message = error?.response?.data?.error || 'Terlalu banyak permintaan. Silakan tunggu sebentar lalu coba lagi.'
      showToast.error(message, 'Rate Limit')
    }

    return Promise.reject(error)
  }
)

// Add request interceptor to invalidate cache on POST, PUT, DELETE, PATCH
api.interceptors.request.use(
  (config) => {
    if (config.method !== 'get') {
      apiCache.clear()
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Global in-memory cache for GET requests
const apiCache = new Map()
const originalGet = api.get

api.get = async (url, config) => {
  const token = getValidAdminToken()

  // Always bypass cache for logged-in admin or if skipCache is set
  if (config?.skipCache || token) {
    return originalGet.call(api, url, config)
  }

  const cacheKey = url + (config?.params ? JSON.stringify(config.params) : '')

  if (apiCache.has(cacheKey)) {
    return Promise.resolve(apiCache.get(cacheKey))
  }

  const requestPromise = originalGet.call(api, url, config)
    .then(response => {
      // Store the actual response to serve instantly later
      apiCache.set(cacheKey, response)
      return response
    })
    .catch(err => {
      apiCache.delete(cacheKey)
      throw err
    })

  // Store the promise immediately to deduplicate concurrent requests
  apiCache.set(cacheKey, requestPromise)
  return requestPromise
}

export default api



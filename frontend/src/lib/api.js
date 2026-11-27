import axios from 'axios'
import { showToast } from './toast'
import { isGuestMode, maskOrderForGuest, maskMerchOrderForGuest, generateGuestMockResponse } from './guestMock'
import { getValidAdminToken, touchAdminSession, logoutAdminSession } from './authSession'

// In production (Vercel), use relative '/api' so it always works seamlessly on any domain
let API_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL

if (typeof window !== 'undefined') {
  const isLocalDev = ['localhost', '127.0.0.1'].includes(window.location.hostname) ||
                     window.location.hostname.startsWith('192.168.') ||
                     window.location.hostname.startsWith('10.')
  if (!isLocalDev || import.meta.env.MODE === 'production') {
    API_URL = '/api'
  } else if (!API_URL) {
    API_URL = `http://${window.location.hostname}:5000/api`
  } else if (API_URL.includes('localhost') && window.location.hostname !== 'localhost') {
    API_URL = API_URL.replace('localhost', window.location.hostname)
  }
} else if (!API_URL) {
  API_URL = '/api'
}

const api = axios.create({
  baseURL: API_URL,
})

// Global mutation loading tracker (blocks spam clicks during POST/PUT/PATCH/DELETE)
let activeMutationCount = 0
const loadingListeners = new Set()
const notifyLoadingListeners = () => {
  const isLoading = activeMutationCount > 0
  loadingListeners.forEach((cb) => {
    try { cb(isLoading) } catch {}
  })
}

export const subscribeGlobalLoading = (cb) => {
  loadingListeners.add(cb)
  cb(activeMutationCount > 0)
  return () => loadingListeners.delete(cb)
}

const MUTATION_METHODS = new Set(['post', 'put', 'patch', 'delete'])

// Debug: Log API URL in production to help troubleshooting
if (import.meta.env.MODE === 'production') {
  // console.log('[API] Base URL:', API_URL)
}

// Add auth token to requests and handle Content-Type + Guest Mode sandbox interceptor
api.interceptors.request.use(
  (config) => {
    // Only set Authorization header if not already explicitly provided by caller
    if (!config.headers.Authorization) {
      const adminToken = getValidAdminToken()
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`
        touchAdminSession()
      } else {
        // Fallback: send FAN token if available (for logged-in fan users)
        try {
          const fanToken = typeof localStorage !== 'undefined' ? localStorage.getItem('ks_fan_token') : null
          if (fanToken) {
            config.headers.Authorization = `Bearer ${fanToken}`
          }
        } catch {}
      }
    } else {
      const adminToken = getValidAdminToken()
      if (adminToken && config.headers.Authorization === `Bearer ${adminToken}`) {
        touchAdminSession()
      }
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

// Track mutating requests for global blocking loading overlay
api.interceptors.request.use(
  (config) => {
    const method = (config.method || 'get').toLowerCase()
    if (MUTATION_METHODS.has(method) && !config.skipGlobalLoading) {
      config.__trackedGlobalLoading = true
      activeMutationCount += 1
      notifyLoadingListeners()
    }
    return config
  },
  (error) => Promise.reject(error)
)

const rateLimitToastId = 'rate-limit-toast'

let isRedirectingToLogin = false

api.interceptors.response.use(
  (response) => {
    if (response?.config?.__trackedGlobalLoading) {
      activeMutationCount = Math.max(0, activeMutationCount - 1)
      notifyLoadingListeners()
    }
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
    if (error?.config?.__trackedGlobalLoading) {
      activeMutationCount = Math.max(0, activeMutationCount - 1)
      notifyLoadingListeners()
    }
    const status = error?.response?.status
    const reqUrl = error?.config?.url || ''

    // 401 Unauthorized Session Handling:
    // Do NOT redirect if the failed request was the login attempt itself!
    if (status === 401 && !reqUrl.includes('/auth/login')) {
      const hadAdminToken = typeof localStorage !== 'undefined' && Boolean(localStorage.getItem('admin_token'))
      if (hadAdminToken) {
        logoutAdminSession()
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
          if (!isRedirectingToLogin) {
            isRedirectingToLogin = true
            showToast.warning('Sesi admin telah berakhir. Silakan login kembali.', 'Sesi Berakhir')
            setTimeout(() => {
              window.location.href = '/admin/login'
              isRedirectingToLogin = false
            }, 800)
          }
        }
      }
    }

    if (status === 429) {
      const message = error?.response?.data?.error || 'Terlalu banyak permintaan. Silakan tunggu sebentar lalu coba lagi.'
      showToast.error(message, 'Rate Limit')
    }

    // Normalize error.message so UI toasts never display raw HTTP codes like "Request failed with status code 401"
    const serverMsg = error?.response?.data?.error || error?.response?.data?.message
    let friendlyMessage = typeof serverMsg === 'string' && serverMsg.trim() ? serverMsg.trim() : ''

    if (!friendlyMessage) {
      if (error?.code === 'ECONNABORTED') {
        friendlyMessage = 'Waktu koneksi habis. Silakan coba lagi.'
      } else if (error?.message === 'Network Error' || !error?.response) {
        friendlyMessage = 'Koneksi ke server gagal. Periksa jaringan internet Anda.'
      } else if (status === 400) {
        friendlyMessage = 'Data yang dimasukkan tidak valid. Periksa kembali isian Anda.'
      } else if (status === 401) {
        friendlyMessage = 'Email/username atau password yang Anda masukkan salah.'
      } else if (status === 403) {
        friendlyMessage = 'Akses ditolak. Anda tidak memiliki izin untuk aksi ini.'
      } else if (status === 404) {
        friendlyMessage = 'Akun atau data yang dicari tidak ditemukan.'
      } else if (status === 429) {
        friendlyMessage = 'Terlalu banyak percobaan. Silakan tunggu sebentar lalu coba lagi.'
      } else if (status >= 500) {
        friendlyMessage = 'Terjadi gangguan pada server. Silakan coba beberapa saat lagi.'
      } else {
        friendlyMessage = 'Terjadi kesalahan. Silakan coba lagi.'
      }
    }

    error.userMessage = friendlyMessage
    error.message = friendlyMessage

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



import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../lib/api'
import { kohiToast } from '../components/ui/KohiToast'

const FanAuthContext = createContext({
  fanUser: null,
  isLoggedIn: false,
  login: async () => {},
  loginByEmail: async () => {},
  setSession: () => {},
  logout: () => {},
  updateProfile: () => {},
  authModalOpen: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  orderHistoryModalOpen: false,
  openOrderHistory: () => {},
  closeOrderHistory: () => {},
})

const STORAGE_KEY = 'ks_fan_user'
const SESSION_MONTH_KEY = 'ks_fan_session_month'

const getCurrentJakartaMonthKey = () => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit'
  }).format(new Date()).slice(0, 7)
}

const clearFanStorage = () => {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem('ks_fan_token')
  localStorage.removeItem(SESSION_MONTH_KEY)
}

export const FanAuthProvider = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [fanUser, setFanUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return null
      const savedMonth = localStorage.getItem(SESSION_MONTH_KEY)
      const currentMonth = getCurrentJakartaMonthKey()
      if (savedMonth !== currentMonth) {
        clearFanStorage()
        return null
      }
      return JSON.parse(saved)
    } catch {
      return null
    }
  })

  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [orderHistoryModalOpen, setOrderHistoryModalOpen] = useState(false)
  const [pendingCallback, setPendingCallback] = useState(null)

  // Persist user state changes
  useEffect(() => {
    try {
      if (fanUser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fanUser))
        if (!localStorage.getItem(SESSION_MONTH_KEY)) {
          localStorage.setItem(SESSION_MONTH_KEY, getCurrentJakartaMonthKey())
        }
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch (err) {
      console.error('Failed to sync fan user to localStorage:', err)
    }
  }, [fanUser])

  // On mount & tab focus: clear session if month rolled over to the 1st, or sync profile
  useEffect(() => {
    const checkMonthlyReset = () => {
      const savedMonth = localStorage.getItem(SESSION_MONTH_KEY)
      const currentMonth = getCurrentJakartaMonthKey()
      if (savedMonth && savedMonth !== currentMonth) {
        clearFanStorage()
        setFanUser(null)
        return true
      }
      return false
    }

    const syncLatestProfile = async () => {
      if (checkMonthlyReset()) return
      try {
        const token = localStorage.getItem('ks_fan_token')
        if (!token) return

        const res = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.data?.success && res.data?.user && res.data.user.role !== 'admin') {
          setFanUser(prev => ({ ...(prev || {}), ...res.data.user }))
        }
      } catch (err) {
        if (err?.response?.status === 401) {
          clearFanStorage()
          setFanUser(null)
        }
      }
    }

    syncLatestProfile()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkMonthlyReset()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', checkMonthlyReset)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', checkMonthlyReset)
    }
  }, [])

  const login = async (userData) => {
    const { nama, email, whatsapp, instagram, password } = userData

    try {
      // Call backend API
      const res = await api.post('/auth/fan/login', {
        nama: nama.trim(),
        email: email.trim().toLowerCase(),
        whatsapp: whatsapp.trim(),
        instagram: instagram ? instagram.trim().replace(/^@/, '') : '',
        password: password || undefined,
      })

      if (res.data?.success && res.data?.user) {
        const user = res.data.user
        localStorage.setItem(SESSION_MONTH_KEY, getCurrentJakartaMonthKey())
        setFanUser(user)
        if (res.data.token) {
          localStorage.setItem('ks_fan_token', res.data.token)
        }
        return { success: true, user }
      }
    } catch (err) {
      console.warn('[FanAuth] API login failed, using local session fallback:', err?.response?.data || err.message)
    }

    // Fallback local session if backend/DB error
    const localUser = {
      id: fanUser?.id || `fan-${Date.now()}`,
      nama: nama.trim(),
      email: email.trim().toLowerCase(),
      whatsapp: whatsapp.trim(),
      instagram: instagram ? instagram.trim().replace(/^@/, '') : '',
    }
    localStorage.setItem(SESSION_MONTH_KEY, getCurrentJakartaMonthKey())
    setFanUser(localUser)
    return { success: true, user: localUser }
  }

  const loginByEmail = async (emailInput, passwordInput) => {
    const cleanEmail = (emailInput || '').trim().toLowerCase()
    const payload = { email: cleanEmail }
    if (passwordInput) payload.password = passwordInput

    const res = await api.post('/auth/login', payload)
    if (res.data?.success && res.data?.user) {
      localStorage.setItem(SESSION_MONTH_KEY, getCurrentJakartaMonthKey())
      setFanUser(res.data.user)
      if (res.data.token) {
        localStorage.setItem('ks_fan_token', res.data.token)
      }
      return { success: true, user: res.data.user }
    }
    throw new Error(res.data?.error || 'Gagal login dengan email tersebut')
  }

  const setSession = useCallback((token, user) => {
    if (token) {
      localStorage.setItem('ks_fan_token', token)
    }
    if (user) {
      localStorage.setItem(SESSION_MONTH_KEY, getCurrentJakartaMonthKey())
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      setFanUser(user)
    }
  }, [])

  const logout = () => {
    setFanUser(null)
    clearFanStorage()
  }

  const updateProfile = (data) => {
    setFanUser(prev => ({ ...prev, ...data }))
  }

  const openAuthModal = useCallback(() => {
    kohiToast.warning('Kamu belum login. Silakan login atau daftar dulu untuk membeli!')
    navigate('/login?mode=register', {
      state: {
        from: `${location.pathname}${location.search}`,
        authNotice: 'Kamu belum login. Silakan login atau daftar dulu baru bisa membeli.'
      }
    })
  }, [navigate, location.pathname, location.search])

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false)
    setPendingCallback(null)
  }, [])

  const handleAuthSuccess = useCallback((user) => {
    setAuthModalOpen(false)
    if (typeof pendingCallback === 'function') {
      const cb = pendingCallback
      setPendingCallback(null)
      cb(user)
    }
  }, [pendingCallback])

  const openOrderHistory = useCallback(() => {
    setOrderHistoryModalOpen(true)
  }, [])

  const closeOrderHistory = useCallback(() => {
    setOrderHistoryModalOpen(false)
  }, [])

  return (
    <FanAuthContext.Provider
      value={{
        fanUser,
        isLoggedIn: Boolean(fanUser?.email),
        login,
        loginByEmail,
        setSession,
        logout,
        updateProfile,
        authModalOpen,
        openAuthModal,
        closeAuthModal,
        handleAuthSuccess,
        orderHistoryModalOpen,
        openOrderHistory,
        closeOrderHistory,
      }}
    >
      {children}
    </FanAuthContext.Provider>
  )
}

export const useFanAuth = () => useContext(FanAuthContext)
export default FanAuthContext

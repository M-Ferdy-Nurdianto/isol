import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../lib/api'

const FanAuthContext = createContext({
  fanUser: null,
  isLoggedIn: false,
  login: async () => {},
  loginByEmail: async () => {},
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

export const FanAuthProvider = ({ children }) => {
  const [fanUser, setFanUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : null
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
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch (err) {
      console.error('Failed to sync fan user to localStorage:', err)
    }
  }, [fanUser])

  const login = async (userData) => {
    const { nama, email, whatsapp, instagram } = userData

    try {
      // Call backend API
      const res = await api.post('/auth/fan/login', {
        nama: nama.trim(),
        email: email.trim().toLowerCase(),
        whatsapp: whatsapp.trim(),
        instagram: instagram ? instagram.trim().replace(/^@/, '') : '',
      })

      if (res.data?.success && res.data?.user) {
        const user = res.data.user
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
    setFanUser(localUser)
    return { success: true, user: localUser }
  }

  const loginByEmail = async (emailInput) => {
    const cleanEmail = (emailInput || '').trim().toLowerCase()
    const res = await api.post('/auth/login', { email: cleanEmail })
    if (res.data?.success && res.data?.user) {
      setFanUser(res.data.user)
      if (res.data.token) {
        localStorage.setItem('ks_fan_token', res.data.token)
      }
      return { success: true, user: res.data.user }
    }
    throw new Error(res.data?.error || 'Gagal login dengan email tersebut')
  }

  const logout = () => {
    setFanUser(null)
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem('ks_fan_token')
  }

  const updateProfile = (data) => {
    setFanUser(prev => ({ ...prev, ...data }))
  }

  const openAuthModal = useCallback((onSuccessCallback = null) => {
    setPendingCallback(() => onSuccessCallback)
    setAuthModalOpen(true)
  }, [])

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

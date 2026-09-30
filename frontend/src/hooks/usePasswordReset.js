import { useState, useCallback } from 'react'
import api from '../lib/api'

/**
 * Custom hook to handle admin and user password reset operations
 */
export const usePasswordReset = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])
  const [activeOtp, setActiveOtp] = useState(null) // { code, expiresAt, show: false }

  // 1. Admin: Send reset link to user's registered email
  const sendEmailReset = useCallback(async (userId) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post(`/password-reset/admin/email/${userId}`)
      return res.data
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Gagal mengirim email reset password'
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  // 2. Admin: Generate secure 6-digit OTP code for user
  const generateOtpReset = useCallback(async (userId) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post(`/password-reset/admin/otp/${userId}`)
      if (res.data?.otp_code) {
        setActiveOtp({
          code: res.data.otp_code,
          expiresAt: res.data.expires_at,
          show: false
        })
      }
      return res.data
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Gagal generate kode OTP'
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  // 3. Admin: Fetch last reset history for target user
  const fetchResetHistory = useCallback(async (userId) => {
    try {
      const res = await api.get(`/password-reset/admin/history/${userId}`)
      const data = res.data?.data || []
      setHistory(data)
      return data
    } catch (err) {
      console.warn('[usePasswordReset] Error loading history:', err.message)
      setHistory([])
      return []
    }
  }, [])

  // 4. User: Verify OTP and set new password
  const verifyOtpReset = useCallback(async ({ identifier, code, newPassword }) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.post('/password-reset/verify-otp', {
        identifier,
        code,
        new_password: newPassword
      })
      return res.data
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Gagal reset password'
      setError(msg)
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  const toggleOtpVisibility = useCallback(() => {
    setActiveOtp(prev => prev ? { ...prev, show: !prev.show } : null)
  }, [])

  const clearActiveOtp = useCallback(() => {
    setActiveOtp(null)
  }, [])

  return {
    loading,
    error,
    history,
    activeOtp,
    sendEmailReset,
    generateOtpReset,
    fetchResetHistory,
    verifyOtpReset,
    toggleOtpVisibility,
    clearActiveOtp
  }
}

export default usePasswordReset

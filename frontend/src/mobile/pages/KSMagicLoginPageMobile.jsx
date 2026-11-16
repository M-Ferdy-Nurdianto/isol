import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FaSpinner, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa'
import { useFanAuth } from '@shared/context'
import { kohiToast } from '../../components/ui/KohiToast'
import api from '../../lib/api'
import MobileAppShell from '../components/layout/MobileAppShell'

/**
 * KSMagicLoginPageMobile (Native-Feel 1-Click Magic Login Screen)
 */
const KSMagicLoginPageMobile = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const { setSession } = useFanAuth()

  const [status, setStatus] = useState('verifying')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    const verifyToken = async () => {
      if (!token) {
        if (isMounted) {
          setStatus('error')
          setErrorMessage('Link login tidak lengkap.')
        }
        return
      }

      try {
        const res = await api.post('/auth/magic-login', { token })
        if (!isMounted) return

        if (res.data?.success && res.data?.token && res.data?.user) {
          const user = res.data.user
          const authToken = res.data.token

          localStorage.setItem('ks_fan_token', authToken)
          localStorage.setItem('ks_fan_user', JSON.stringify(user))
          setSession(authToken, user)

          setStatus('success')
          kohiToast.success(`Selamat datang, ${user.nama || 'Fan'}!`)

          setTimeout(() => {
            if (isMounted) {
              window.location.href = '/profile'
            }
          }, 300)
        } else {
          throw new Error(res.data?.error || 'Gagal memproses sesi login.')
        }
      } catch (err) {
        if (!isMounted) return
        setStatus('error')
        setErrorMessage(err.response?.data?.error || err.message || 'Link login sudah kadaluarsa atau tidak valid.')
      }
    }

    verifyToken()

    return () => {
      isMounted = false
    }
  }, [token, setSession, navigate])

  return (
    <MobileAppShell title="Aktivasi Akun Fan" hideBottomNav={true}>
      <div className="space-y-4 py-8 text-center max-w-sm mx-auto">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 space-y-4 shadow-md">
          {status === 'verifying' && (
            <div className="space-y-3">
              <FaSpinner className="text-3xl text-[var(--primary)] animate-spin mx-auto" />
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                Menghubungkan Akun Anda...
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Sistem sedang memverifikasi link 1-klik Anda.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-3 text-[var(--success)]">
              <FaCheckCircle className="text-4xl mx-auto" />
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                Berhasil Masuk!
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Mengarahkan ke Dashboard Fan...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <FaExclamationCircle className="text-4xl text-[var(--danger)] mx-auto" />
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                Aktivasi Gagal
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {errorMessage}
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full touch-target py-3 rounded-2xl bg-[var(--primary)] text-[var(--background)] font-black text-xs uppercase tracking-wider tap-active shadow-sm"
              >
                Masuk Manual
              </button>
            </div>
          )}
        </div>
      </div>
    </MobileAppShell>
  )
}

export default KSMagicLoginPageMobile

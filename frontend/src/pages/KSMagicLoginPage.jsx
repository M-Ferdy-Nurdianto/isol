import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { FaSpinner, FaCheckCircle, FaExclamationCircle, FaArrowRight, FaSignInAlt } from 'react-icons/fa'
import { useFanAuth } from '../context/FanAuthContext'
import { kohiToast } from '../components/ui/KohiToast'
import api from '../lib/api'

const KSMagicLoginPage = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const { login } = useFanAuth()

  const [status, setStatus] = useState('verifying') // 'verifying' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('')
  const [userName, setUserName] = useState('')

  useEffect(() => {
    let isMounted = true

    const verifyToken = async () => {
      if (!token) {
        if (isMounted) {
          setStatus('error')
          setErrorMessage('Link login tidak lengkap. Pastikan Anda mengklik link lengkap dari email Anda.')
        }
        return
      }

      try {
        const res = await api.post('/auth/magic-login', { token })
        if (!isMounted) return

        if (res.data?.success && res.data?.token && res.data?.user) {
          // Login context session
          login(res.data.token, res.data.user)
          setUserName(res.data.user.nama || 'Fan')
          setStatus('success')
          kohiToast.success(`Selamat datang, ${res.data.user.nama || 'Fan'}! Anda berhasil masuk.`)

          // Auto redirect to profile after brief visual confirmation
          setTimeout(() => {
            if (isMounted) {
              navigate('/profile', { replace: true })
            }
          }, 1200)
        } else {
          throw new Error(res.data?.error || 'Gagal memproses sesi login.')
        }
      } catch (err) {
        if (!isMounted) return
        console.error('[Magic Login Error]:', err)
        setStatus('error')
        const serverError = err.response?.data?.error || err.message || 'Link login tidak valid atau sudah kadaluarsa.'
        setErrorMessage(serverError)
      }
    }

    verifyToken()

    return () => {
      isMounted = false
    }
  }, [token, login, navigate])

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] flex flex-col items-center justify-center p-4 sm:p-6 select-none font-outfit">
      <div className="max-w-md w-full bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
        
        {/* Brand Emblem */}
        <div className="flex flex-col items-center justify-center gap-1.5 pb-4 border-b border-[var(--border)]">
          <div className="w-12 h-12 rounded-2xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] font-black text-lg shadow-inner">
            KS
          </div>
          <span className="text-[10px] uppercase tracking-[0.25em] font-mono text-[var(--primary)] font-bold">
            Kohi Sekai Yogyakarta
          </span>
          <h1 className="text-base font-black text-[var(--text-primary)]">
            Aktivasi Sesi Login Fan
          </h1>
        </div>

        {/* State: Verifying */}
        {status === 'verifying' && (
          <div className="py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[var(--background)] border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--primary)]">
              <FaSpinner className="text-2xl animate-spin" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                Menghubungkan Akun Kamu...
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Mohon tunggu sebentar, sistem sedang memverifikasi link login 1-klik kamu.
              </p>
            </div>
          </div>
        )}

        {/* State: Success */}
        {status === 'success' && (
          <div className="py-6 space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
              <FaCheckCircle className="text-3xl" />
            </div>
            <div>
              <h2 className="text-base font-black text-[var(--text-primary)]">
                Berhasil Masuk!
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Halo <strong>{userName}</strong>, kamu berhasil login. Mengalihkan ke halaman profil...
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/profile', { replace: true })}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--background)] font-black text-xs uppercase tracking-wider transition shadow-lg shadow-[var(--primary)]/20"
              >
                <span>Buka Profil Saya Sekarang</span>
                <FaArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* State: Error */}
        {status === 'error' && (
          <div className="py-6 space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/40 flex items-center justify-center mx-auto text-red-400">
              <FaExclamationCircle className="text-3xl" />
            </div>
            <div>
              <h2 className="text-base font-black text-[var(--text-primary)]">
                Link Tidak Dapat Digunakan
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                {errorMessage}
              </p>
            </div>
            <div className="pt-2 space-y-2">
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--background)] font-black text-xs uppercase tracking-wider transition shadow-lg shadow-[var(--primary)]/20"
              >
                <FaSignInAlt />
                <span>Login Manual di Website</span>
              </Link>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Kamu dapat login menggunakan email dan password acak yang tertera di email sambutan.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default KSMagicLoginPage

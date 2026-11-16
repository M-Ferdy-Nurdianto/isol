import React, { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { FaLock, FaKey, FaCheckCircle } from 'react-icons/fa'
import { kohiToast } from '../../components/ui/KohiToast'
import api from '../../lib/api'
import MobileAppShell from '../components/layout/MobileAppShell'

/**
 * ResetPasswordPageMobile (Native-Feel Reset Password Screen)
 */
const ResetPasswordPageMobile = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!token) {
      kohiToast.error('Token reset password tidak ditemukan atau tidak valid.')
      return
    }

    if (!password || password.length < 6) {
      kohiToast.error('Password baru minimal 6 karakter.')
      return
    }

    if (password !== confirmPassword) {
      kohiToast.error('Konfirmasi password tidak cocok.')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/password-reset/confirm-email', {
        token,
        new_password: password
      })

      if (res.data?.success) {
        setSuccess(true)
        kohiToast.success('Password berhasil diperbarui! Silakan masuk.')
        setTimeout(() => navigate('/login'), 1500)
      } else {
        throw new Error(res.data?.error || 'Gagal mereset password')
      }
    } catch (err) {
      kohiToast.error(err.response?.data?.error || err.message || 'Gagal mereset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MobileAppShell title="Atur Ulang Password" showBack={true} hideBottomNav={true}>
      <div className="space-y-5 py-4 max-w-sm mx-auto">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-5 space-y-4 shadow-md">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] mx-auto">
              <FaKey size={20} />
            </div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              Buat Kata Sandi Baru
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Masukkan password baru Anda untuk akun Kohi Sekai.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                Password Baru
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                Ulangi Password Baru
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Konfirmasi password"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full touch-target py-3.5 rounded-2xl bg-[var(--primary)] text-[var(--background)] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 tap-active shadow-md disabled:opacity-50 mt-2"
            >
              {loading ? 'Memperbarui...' : 'Simpan Password Baru'}
            </button>
          </form>
        </div>
      </div>
    </MobileAppShell>
  )
}

export default ResetPasswordPageMobile

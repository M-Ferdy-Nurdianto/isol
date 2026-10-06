import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FaKey, FaEnvelope, FaCheckCircle, FaSpinner, FaArrowLeft, FaShieldAlt } from 'react-icons/fa'
import Swal from 'sweetalert2'
import api from '../lib/api'
import { supabase } from '../lib/supabase'

const ResetPasswordPage = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // Parse URL params
  const searchParams = new URLSearchParams(location.search)
  const urlToken = searchParams.get('token')
  const urlType = searchParams.get('type')

  // Detect recovery mode
  const isSupabaseRecovery = location.hash.includes('type=recovery') || urlType === 'recovery'
  const isEmailTokenReset = urlType === 'email_token' && !!urlToken

  const getInitialTab = () => {
    if (isEmailTokenReset) return 'email_token'
    if (isSupabaseRecovery) return 'email'
    return 'otp'
  }

  const [activeTab, setActiveTab] = useState(getInitialTab)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const [otpForm, setOtpForm] = useState({ identifier: '', code: '', newPassword: '', confirmPassword: '' })
  const [emailForm, setEmailForm] = useState({ newPassword: '', confirmPassword: '' })
  const [tokenForm, setTokenForm] = useState({ newPassword: '', confirmPassword: '' })

  useEffect(() => {
    if (isEmailTokenReset) { setActiveTab('email_token'); return }
    if (isSupabaseRecovery) { setActiveTab('email') }
    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') setActiveTab('email')
      })
      return () => { authListener?.subscription?.unsubscribe() }
    }
  }, [isEmailTokenReset, isSupabaseRecovery])

  // Handle OTP Reset Submit
  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (otpForm.newPassword.length < 6) { setError('Password baru minimal terdiri dari 6 karakter.'); return }
    if (otpForm.newPassword !== otpForm.confirmPassword) { setError('Konfirmasi password tidak cocok.'); return }
    setLoading(true)
    try {
      const res = await api.post('/password-reset/verify-otp', {
        identifier: otpForm.identifier.trim(),
        code: otpForm.code.trim(),
        new_password: otpForm.newPassword
      })
      setSuccess(true)
      Swal.fire({ icon: 'success', title: 'Password Berhasil Diubah!', text: res.data?.message || 'Silakan login dengan password baru.', confirmButtonColor: '#079108' }).then(() => navigate('/login'))
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Gagal mereset password'
      setError(errorMsg)
      Swal.fire({ icon: 'error', title: 'Gagal', text: errorMsg })
    } finally { setLoading(false) }
  }

  // Handle Supabase Email Recovery Submit
  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (emailForm.newPassword.length < 6) { setError('Password baru minimal terdiri dari 6 karakter.'); return }
    if (emailForm.newPassword !== emailForm.confirmPassword) { setError('Konfirmasi password tidak cocok.'); return }
    setLoading(true)
    try {
      if (!supabase) throw new Error('Koneksi otentikasi tidak tersedia.')
      const { error: updateErr } = await supabase.auth.updateUser({ password: emailForm.newPassword })
      if (updateErr) throw updateErr
      setSuccess(true)
      Swal.fire({ icon: 'success', title: 'Password Berhasil Diubah!', text: 'Silakan login dengan password baru.', confirmButtonColor: '#079108' }).then(() => navigate('/login'))
    } catch (err) {
      const errorMsg = err.message || 'Gagal mengubah password dari link email.'
      setError(errorMsg)
      Swal.fire({ icon: 'error', title: 'Gagal', text: errorMsg })
    } finally { setLoading(false) }
  }

  // Handle Email Token Reset Submit (Gmail SMTP flow)
  const handleTokenSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (tokenForm.newPassword.length < 6) { setError('Password baru minimal terdiri dari 6 karakter.'); return }
    if (tokenForm.newPassword !== tokenForm.confirmPassword) { setError('Konfirmasi password tidak cocok.'); return }
    setLoading(true)
    try {
      const res = await api.post('/password-reset/confirm-email', {
        token: urlToken,
        new_password: tokenForm.newPassword
      })
      setSuccess(true)
      Swal.fire({ icon: 'success', title: 'Password Berhasil Diubah!', text: res.data?.message || 'Silakan login dengan password baru.', confirmButtonColor: '#079108' }).then(() => navigate('/login'))
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Gagal memverifikasi link reset password.'
      setError(errorMsg)
      Swal.fire({ icon: 'error', title: 'Gagal', text: errorMsg })
    } finally { setLoading(false) }
  }

  const inputCls = 'w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:border-[var(--primary)] focus:outline-none transition'
  const labelCls = 'block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5'
  const btnCls = 'w-full py-3 px-4 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--background)] font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50'

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/15 border border-[var(--primary)]/40 flex items-center justify-center text-[var(--primary)] mx-auto text-xl shadow-lg">
            <FaShieldAlt />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-primary)] uppercase">
            Atur Ulang <span className="text-[var(--primary)]">Password</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            {isEmailTokenReset
              ? 'Buat password baru untuk akun Kohi Sekai Anda.'
              : 'Pilih metode reset via kode OTP admin atau tautan email.'}
          </p>
        </div>

        {/* Tab switch — hanya tampil jika bukan alur email token langsung */}
        {!isEmailTokenReset && (
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[var(--background)] border border-[var(--border)] rounded-2xl">
            <button
              type="button"
              onClick={() => { setActiveTab('otp'); setError(null) }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${activeTab === 'otp' ? 'bg-[var(--primary)] text-[var(--background)] shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              <FaKey className="text-[10px]" />
              <span>Kode OTP Admin</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('email'); setError(null) }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${activeTab === 'email' ? 'bg-[var(--primary)] text-[var(--background)] shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              <FaEnvelope className="text-[10px]" />
              <span>Link Email</span>
            </button>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl text-center font-medium">
            {error}
          </div>
        )}

        {/* TAB 1: RESET VIA OTP ADMIN */}
        {activeTab === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <label className={labelCls}>Email atau ID Fan <span className="text-red-400">*</span></label>
              <input type="text" required value={otpForm.identifier} onChange={(e) => setOtpForm({ ...otpForm, identifier: e.target.value })} placeholder="Contoh: kiki@gmail.com atau 0002" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Kode OTP Dari Admin <span className="text-red-400">*</span></label>
              <input type="text" required maxLength={8} value={otpForm.code} onChange={(e) => setOtpForm({ ...otpForm, code: e.target.value.replace(/\s/g, '') })} placeholder="6 digit kode OTP (misal: 482910)" className={`${inputCls} font-mono tracking-widest text-center text-sm`} />
              <span className="text-[10px] text-[var(--text-secondary)] mt-1 block">Kode OTP berlaku 15 menit dan diberikan oleh admin.</span>
            </div>
            <div>
              <label className={labelCls}>Password Baru <span className="text-red-400">*</span></label>
              <input type="password" required minLength={6} value={otpForm.newPassword} onChange={(e) => setOtpForm({ ...otpForm, newPassword: e.target.value })} placeholder="Minimal 6 karakter" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Konfirmasi Password Baru <span className="text-red-400">*</span></label>
              <input type="password" required minLength={6} value={otpForm.confirmPassword} onChange={(e) => setOtpForm({ ...otpForm, confirmPassword: e.target.value })} placeholder="Ulangi password baru" className={inputCls} />
            </div>
            <button type="submit" disabled={loading || success} className={btnCls}>
              {loading ? (<><FaSpinner className="animate-spin text-sm" /><span>Memverifikasi...</span></>) : (<><FaCheckCircle className="text-sm" /><span>Ubah Password Sekarang</span></>)}
            </button>
          </form>
        )}

        {/* TAB 2: RESET VIA SUPABASE EMAIL RECOVERY */}
        {activeTab === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-3.5 text-xs text-[var(--text-secondary)] space-y-1">
              <span className="font-bold text-[var(--text-primary)] block">Tautan Pemulihan Email</span>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                {isSupabaseRecovery ? 'Sesi pemulihan terdeteksi dari email. Masukkan password baru Anda di bawah.' : 'Klik link email dari admin untuk mengaktifkan sesi pemulihan, lalu isi form di bawah.'}
              </p>
            </div>
            <div>
              <label className={labelCls}>Password Baru <span className="text-red-400">*</span></label>
              <input type="password" required minLength={6} value={emailForm.newPassword} onChange={(e) => setEmailForm({ ...emailForm, newPassword: e.target.value })} placeholder="Minimal 6 karakter" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Konfirmasi Password Baru <span className="text-red-400">*</span></label>
              <input type="password" required minLength={6} value={emailForm.confirmPassword} onChange={(e) => setEmailForm({ ...emailForm, confirmPassword: e.target.value })} placeholder="Ulangi password baru" className={inputCls} />
            </div>
            <button type="submit" disabled={loading || success} className={btnCls}>
              {loading ? (<><FaSpinner className="animate-spin text-sm" /><span>Menyimpan Password...</span></>) : (<><FaCheckCircle className="text-sm" /><span>Simpan Password Baru</span></>)}
            </button>
          </form>
        )}

        {/* TAB 3: RESET VIA EMAIL TOKEN (Gmail SMTP flow) */}
        {activeTab === 'email_token' && (
          <form onSubmit={handleTokenSubmit} className="space-y-4">
            <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-3.5 text-xs text-[var(--text-secondary)] space-y-1">
              <span className="font-bold text-[var(--text-primary)] block">Link Reset Terverifikasi</span>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                Link reset password dari email Anda telah terdeteksi. Buat password baru untuk akun Anda di bawah. Link ini berlaku 30 menit.
              </p>
            </div>
            <div>
              <label className={labelCls}>Password Baru <span className="text-red-400">*</span></label>
              <input type="password" required minLength={6} value={tokenForm.newPassword} onChange={(e) => setTokenForm({ ...tokenForm, newPassword: e.target.value })} placeholder="Minimal 6 karakter" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Konfirmasi Password Baru <span className="text-red-400">*</span></label>
              <input type="password" required minLength={6} value={tokenForm.confirmPassword} onChange={(e) => setTokenForm({ ...tokenForm, confirmPassword: e.target.value })} placeholder="Ulangi password baru" className={inputCls} />
            </div>
            <button type="submit" disabled={loading || success} className={btnCls}>
              {loading ? (<><FaSpinner className="animate-spin text-sm" /><span>Memperbarui Password...</span></>) : (<><FaCheckCircle className="text-sm" /><span>Simpan Password Baru</span></>)}
            </button>
          </form>
        )}

        {/* Back navigation */}
        <div className="pt-2 text-center">
          <button type="button" onClick={() => navigate('/login')} className="inline-flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">
            <FaArrowLeft className="text-[10px]" />
            <span>Kembali ke Halaman Login</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage

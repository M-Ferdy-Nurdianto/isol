import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaKey,
  FaEye,
  FaEyeSlash,
  FaWhatsapp,
  FaInstagram,
  FaSignInAlt,
  FaUserPlus,
  FaCheckCircle,
  FaArrowRight
} from 'react-icons/fa'
import { useFanAuth } from '@shared/context'
import { kohiToast } from '../../components/ui/KohiToast'
import TurnstileWidget from '../../components/ui/TurnstileWidget'
import api from '../../lib/api'
import MobileAppShell from '../components/layout/MobileAppShell'
import MobileBottomSheet from '../components/common/MobileBottomSheet'

/**
 * KSLoginPageMobile (Native-Feel Login & Registration for Mobile)
 * Strictly adheres to Deep Coffee Design:
 * - Solid surfaces (#241E19), border (#3A2E24)
 * - Anti-blur: NO backdrop-blur, NO gradients
 * - Segmented Brand Tab Switch
 * - Cloudflare Turnstile integration
 * - Forgot Password Bottom Sheet
 * - 44x44px touch targets
 */
const KSLoginPageMobile = () => {
  const navigate = useNavigate()
  const { isLoggedIn, loginByEmail } = useFanAuth()

  // Redirect if logged in
  useEffect(() => {
    if (isLoggedIn || localStorage.getItem('ks_fan_token')) {
      navigate('/profile', { replace: true })
    }
  }, [isLoggedIn, navigate])

  const [authMode, setAuthMode] = useState('login') // 'login' | 'register'
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [loginTurnstileToken, setLoginTurnstileToken] = useState(null)
  const [loading, setLoading] = useState(false)

  // Register Form States
  const [registerForm, setRegisterForm] = useState({
    nama: '',
    email: '',
    whatsapp: '',
    instagram: '',
    password: '',
    confirmPassword: ''
  })
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [registerTurnstileToken, setRegisterTurnstileToken] = useState(null)
  const [regStep, setRegStep] = useState(1) // 1: Info | 2: Password | 3: OTP
  const [otpCode, setOtpCode] = useState('')

  // Forgot Password Sheet States
  const [showForgotSheet, setShowForgotSheet] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    if (!loginEmail || !loginPassword) {
      kohiToast.error('Email dan password wajib diisi.')
      return
    }

    setLoading(true)
    try {
      const res = await loginByEmail(loginEmail.trim(), loginPassword)
      if (res?.success) {
        kohiToast.success(`Selamat datang kembali, ${res.user.nama || 'Fan'}!`)
        navigate('/profile', { replace: true })
      }
    } catch (err) {
      kohiToast.error(err.message || 'Gagal masuk. Pastikan email & password sudah benar.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Register Step 1 Next
  const handleNextRegStep1 = () => {
    if (!registerForm.nama.trim() || registerForm.nama.trim().length < 2) {
      kohiToast.error('Nama lengkap wajib diisi minimal 2 karakter.')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!registerForm.email || !emailRegex.test(registerForm.email.trim())) {
      kohiToast.error('Format email tidak valid.')
      return
    }
    setRegStep(2)
  }

  // Handle Register Submit
  const handleRegisterSubmit = async (e) => {
    e?.preventDefault()
    if (!registerForm.password || registerForm.password.length < 6) {
      kohiToast.error('Password baru minimal 6 karakter.')
      return
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      kohiToast.error('Konfirmasi password tidak cocok.')
      return
    }

    setLoading(true)
    try {
      const cleanWa = (registerForm.whatsapp || '').replace(/[^0-9+]/g, '')
      const res = await api.post('/auth/register', {
        nama: registerForm.nama.trim(),
        email: registerForm.email.trim().toLowerCase(),
        whatsapp: cleanWa || null,
        instagram: registerForm.instagram.replace(/^@/, '').trim() || null,
        password: registerForm.password
      })

      if (res.data?.success) {
        kohiToast.success('Registrasi berhasil! Silakan masuk.')
        setAuthMode('login')
        setLoginEmail(registerForm.email)
        setRegStep(1)
      } else {
        throw new Error(res.data?.error || 'Gagal mendaftar')
      }
    } catch (err) {
      kohiToast.error(err.response?.data?.error || err.message || 'Gagal mendaftar')
    } finally {
      setLoading(false)
    }
  }

  // Handle Request Forgot Password Email
  const handleForgotSubmit = async (e) => {
    e.preventDefault()
    if (!forgotEmail) {
      kohiToast.error('Silakan isi alamat email Anda.')
      return
    }

    setForgotLoading(true)
    try {
      const res = await api.post('/password-reset/request-email', {
        email: forgotEmail.trim()
      })
      if (res.data?.success) {
        kohiToast.success('Link reset password berhasil dikirim ke email Anda!')
        setShowForgotSheet(false)
        setForgotEmail('')
      } else {
        throw new Error(res.data?.error || 'Gagal mengirim email reset')
      }
    } catch (err) {
      kohiToast.error(err.response?.data?.error || err.message || 'Gagal mengirim email reset')
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <MobileAppShell title="Akun Fan Kohi Sekai" showBack={true} hideBottomNav={true}>
      <div className="space-y-5 py-2 max-w-sm mx-auto">

        {/* Brand Emblem */}
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] font-black text-xl shadow-md">
            KS
          </div>
          <div>
            <h1 className="text-base font-black text-[var(--text-primary)]">
              Kohi Sekai Fan Space
            </h1>
            <p className="text-[11px] text-[var(--text-secondary)] font-mono">
              コーヒーの世界 · Portal Akun Resmi
            </p>
          </div>
        </div>

        {/* Segmented Tab Switch */}
        <div className="flex rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setAuthMode('login')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all tap-active ${
              authMode === 'login'
                ? 'bg-[var(--primary)] text-[var(--background)] shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <FaSignInAlt size={12} />
            <span>Masuk</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('register')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all tap-active ${
              authMode === 'register'
                ? 'bg-[var(--primary)] text-[var(--background)] shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <FaUserPlus size={12} />
            <span>Daftar</span>
          </button>
        </div>

        {/* ==================================================================== */}
        {/* LOGIN FORM                                                           */}
        {/* ==================================================================== */}
        {authMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-5 space-y-4 shadow-md">
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="fan@gmail.com"
                  required
                  className="w-full pl-9 pr-3.5 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                />
                <FaEnvelope className="absolute left-3 top-3.5 text-[var(--text-secondary)] text-xs" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[var(--text-primary)]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotSheet(true)}
                  className="text-[11px] font-bold text-[var(--primary)] hover:underline tap-active"
                >
                  Lupa Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  className="w-full pl-9 pr-10 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                />
                <FaLock className="absolute left-3 top-3.5 text-[var(--text-secondary)] text-xs" />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-3.5 text-[var(--text-secondary)] text-xs tap-active"
                >
                  {showLoginPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Turnstile Widget */}
            <div className="pt-1 flex justify-center">
              <TurnstileWidget onVerify={(token) => setLoginTurnstileToken(token)} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full touch-target py-3.5 rounded-2xl bg-[var(--primary)] text-[var(--background)] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 tap-active shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-[var(--background)] border-t-transparent animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <FaSignInAlt size={13} />
                  <span>Masuk ke Akun Saya</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ==================================================================== */}
        {/* REGISTER FORM                                                        */}
        {/* ==================================================================== */}
        {authMode === 'register' && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-5 space-y-4 shadow-md">
            
            {/* Step Indicator */}
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase">
                Langkah {regStep} dari 2
              </span>
              <span className="text-[10px] font-bold text-[var(--primary)]">
                {regStep === 1 ? 'Data Kontak' : 'Keamanan Password'}
              </span>
            </div>

            {regStep === 1 ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Nama Lengkap <span className="text-[var(--danger)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={registerForm.nama}
                    onChange={(e) => setRegisterForm({ ...registerForm, nama: e.target.value })}
                    placeholder="Nama lengkap Anda"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Alamat Email <span className="text-[var(--danger)]">*</span>
                  </label>
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    placeholder="email@anda.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Nomor WhatsApp <span className="text-[10px] text-[var(--text-secondary)] font-normal">(opsional)</span>
                  </label>
                  <input
                    type="tel"
                    value={registerForm.whatsapp}
                    onChange={(e) => setRegisterForm({ ...registerForm, whatsapp: e.target.value })}
                    placeholder="08123456789"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNextRegStep1}
                  className="w-full touch-target py-3.5 rounded-2xl bg-[var(--primary)] text-[var(--background)] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 tap-active shadow-md mt-2"
                >
                  <span>Lanjut Buat Password</span>
                  <FaArrowRight size={11} />
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Password <span className="text-[var(--danger)]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      placeholder="Minimal 6 karakter"
                      required
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-3 text-[var(--text-secondary)] text-xs tap-active"
                    >
                      {showRegPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Konfirmasi Password <span className="text-[var(--danger)]">*</span>
                  </label>
                  <input
                    type="password"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    placeholder="Ulangi password"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRegStep(1)}
                    className="touch-target py-3 px-4 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-secondary)] font-bold text-xs tap-active"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 touch-target py-3 px-4 rounded-xl bg-[var(--primary)] text-[var(--background)] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 tap-active shadow-md disabled:opacity-50"
                  >
                    {loading ? 'Mendaftarkan...' : 'Selesaikan Pendaftaran'}
                  </button>
                </div>
              </form>
            )}

          </div>
        )}

      </div>

      {/* Forgot Password Bottom Sheet */}
      <MobileBottomSheet
        isOpen={showForgotSheet}
        onClose={() => setShowForgotSheet(false)}
        title="Reset Password Akun"
        subtitle="Link reset akan dikirimkan ke email yang terdaftar"
      >
        <form onSubmit={handleForgotSubmit} className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
              Alamat Email Terdaftar
            </label>
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="fan@gmail.com"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <button
            type="submit"
            disabled={forgotLoading}
            className="w-full touch-target py-3.5 rounded-2xl bg-[var(--primary)] text-[var(--background)] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 tap-active shadow-md disabled:opacity-50"
          >
            {forgotLoading ? 'Mengirim...' : 'Kirim Link Reset Password'}
          </button>
        </form>
      </MobileBottomSheet>

    </MobileAppShell>
  )
}

export default KSLoginPageMobile

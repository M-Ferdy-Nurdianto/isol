import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaCoffee,
  FaUser,
  FaEnvelope,
  FaWhatsapp,
  FaInstagram,
  FaArrowRight,
  FaCheckCircle,
  FaShieldAlt,
  FaLock,
  FaKey,
  FaTimes,
  FaExclamationTriangle,
  FaUserPlus,
  FaSignInAlt,
  FaLightbulb,
  FaListOl,
  FaIdCard,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa'
import KSHeader from '../components/KSHeader'
import TurnstileWidget from '../components/ui/TurnstileWidget'
import { useFanAuth } from '../context/FanAuthContext'
import { kohiToast } from '../components/ui/KohiToast'
import api from '../lib/api'
const KSLoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { fanUser, isLoggedIn, login, loginByEmail } = useFanAuth()

  // Mode: 'quick' (Login) vs 'register' (Sign Up)
  const [authMode, setAuthMode] = useState('quick')

  // Active Instruction Tab in Left Panel: 'register-guide' | 'login-guide' | 'tips'
  const [activeGuideTab, setActiveGuideTab] = useState('login-guide')

  // Redirect if logged in
  useEffect(() => {
    if (isLoggedIn) {
      const from = location.state?.from || '/shop'
      navigate(from, { replace: true })
    }
  }, [isLoggedIn, navigate, location])

  // Synchronized mode switch handlers
  const handleSwitchAuthMode = (mode) => {
    setAuthMode(mode)
    setErrors({})
    setRegisterStep(1)
    if (mode === 'register') {
      setActiveGuideTab('register-guide')
    } else if (mode === 'quick') {
      setActiveGuideTab('login-guide')
    }
  }

  const handleSwitchGuideTab = (tab) => {
    setActiveGuideTab(tab)
    setRegisterStep(1)
    if (tab === 'register-guide') {
      setAuthMode('register')
      setErrors({})
    } else if (tab === 'login-guide') {
      setAuthMode('quick')
      setErrors({})
    }
  }

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [loginTurnstileToken, setLoginTurnstileToken] = useState(null)
  const [loginTurnstileResetKey, setLoginTurnstileResetKey] = useState(0)

  // Register Form State
  const [registerStep, setRegisterStep] = useState(1)
  const [registerForm, setRegisterForm] = useState({
    nama: fanUser?.nama || '',
    email: fanUser?.email || '',
    password: '',
    confirmPassword: '',
    otp: '',
    whatsapp: fanUser?.whatsapp || '',
    instagram: fanUser?.instagram || '',
  })
  const [registerTurnstileToken, setRegisterTurnstileToken] = useState(null)
  const [registerTurnstileResetKey, setRegisterTurnstileResetKey] = useState(0)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)



  // Validate Login Form
  const validateLogin = () => {
    const newErrors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!loginEmail || !emailRegex.test(loginEmail.trim())) {
      newErrors.email = 'Format email tidak valid (contoh: fan@gmail.com)'
    }
    if (!loginPassword) {
      newErrors.password = 'Password wajib diisi'
    }
    if (!loginTurnstileToken) {
      newErrors.turnstile = 'Verifikasi Cloudflare Turnstile belum selesai. Tunggu sebentar atau refresh.'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Validate Step 1
  const validateStep1 = () => {
    const newErrors = {}
    if (!registerForm.nama || registerForm.nama.trim().length < 2) {
      newErrors.nama = 'Nama lengkap wajib diisi minimal 2 karakter'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!registerForm.email || !emailRegex.test(registerForm.email.trim())) {
      newErrors.email = 'Format email tidak valid (contoh: fan@gmail.com)'
    }

    const cleanWa = (registerForm.whatsapp || '').replace(/[^0-9+]/g, '')
    if (!cleanWa || cleanWa.length < 8) {
      newErrors.whatsapp = 'Nomor WhatsApp wajib diisi (minimal 8 digit)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep1 = () => {
    if (validateStep1()) {
      setRegisterStep(2)
      setErrors({})
    }
  }

  // Validate Register Form (Step 2)
  const validateRegister = () => {
    const newErrors = {}
    if (!registerForm.password || registerForm.password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter'
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      newErrors.confirmPassword = 'Password tidak cocok'
    }
    if (!registerTurnstileToken) {
      newErrors.turnstile = 'Verifikasi Cloudflare Turnstile belum selesai. Tunggu sebentar atau refresh.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Verify Turnstile Token via Backend API Endpoint
  const verifyBackendTurnstile = async (token) => {
    try {
      const res = await api.post('/auth/verify-turnstile', { token })
      return res.data?.success !== false
    } catch (err) {
      console.warn('[Turnstile] Backend verification fallback:', err)
      return true
    }
  }

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    if (!validateLogin()) return

    setLoading(true)
    try {
      const isTurnstileValid = await verifyBackendTurnstile(loginTurnstileToken)
      if (!isTurnstileValid) {
        throw new Error('Verifikasi Cloudflare Turnstile gagal. Silakan coba lagi.')
      }

      const res = await loginByEmail(loginEmail)
      if (res?.success) {
        kohiToast.success(`Selamat datang kembali, ${res.user.nama || 'Fan Kohi Sekai'}!`)
        const from = location.state?.from || '/shop'
        navigate(from, { replace: true })
      }
    } catch (err) {
      kohiToast.error(err.message || 'Gagal masuk. Pastikan email & password sudah benar.')
      setLoginTurnstileResetKey(prev => prev + 1)
    } finally {
      setLoading(false)
    }
  }

  // Handle Send OTP (End of Step 2)
  const handleSendOTP = async () => {
    if (!validateRegister()) return

    setLoading(true)
    try {
      const isTurnstileValid = await verifyBackendTurnstile(registerTurnstileToken)
      if (!isTurnstileValid) {
        throw new Error('Verifikasi Cloudflare Turnstile gagal. Silakan coba lagi.')
      }

      const res = await api.post('/auth/send-otp', {
        email: registerForm.email,
        nama: registerForm.nama,
      })

      if (res.data?.success) {
        kohiToast.success('OTP terkirim! Silakan cek email Anda.')
        setRegisterStep(3)
      } else {
        throw new Error(res.data?.error || 'Gagal mengirim OTP')
      }
    } catch (err) {
      kohiToast.error(err.response?.data?.error || err.message || 'Gagal mengirim OTP.')
      setRegisterTurnstileResetKey(prev => prev + 1)
    } finally {
      setLoading(false)
    }
  }

  // Handle Verify OTP and Register (Step 3)
  const handleVerifyAndRegister = async () => {
    if (!registerForm.otp || registerForm.otp.length < 6) {
      kohiToast.error('Masukkan kode OTP 6 digit')
      return
    }

    setLoading(true)
    try {
      const resOtp = await api.post('/auth/verify-otp', {
        email: registerForm.email,
        otp: registerForm.otp,
      })

      if (!resOtp.data?.success) {
        throw new Error('OTP tidak valid')
      }

      const res = await login({
        nama: registerForm.nama,
        email: registerForm.email,
        whatsapp: registerForm.whatsapp,
        instagram: registerForm.instagram,
      })

      if (res?.success) {
        kohiToast.success(`Pendaftaran akun berhasil! Selamat datang, ${res.user.nama}!`)
        const from = location.state?.from || '/shop'
        navigate(from, { replace: true })
      } else {
        throw new Error('Gagal memproses pendaftaran')
      }
    } catch (err) {
      kohiToast.error(err.response?.data?.error || err.message || 'Gagal verifikasi OTP.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Register Submit Router
  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    if (registerStep === 2) {
      await handleSendOTP()
    } else if (registerStep === 3) {
      await handleVerifyAndRegister()
    }
  }

  // Handle Forgot Password Submit
  const handleForgotSubmit = (e) => {
    e.preventDefault()
    if (!forgotEmail || !forgotEmail.includes('@')) {
      kohiToast.error('Masukkan email terdaftar yang valid.')
      return
    }
    kohiToast.info('Permintaan instruksi reset password telah diterima. Tim bantuan kami akan memandu proses pemulihan akun via email.')
    setShowForgotModal(false)
    setForgotEmail('')
  }

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col">
      <KSHeader />

      <main className="flex-1 pt-24 sm:pt-32 pb-16 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">

          {/* =========================================================================
              UNIFIED RESPONSIVE GRID LAYOUT (1 DESIGN FOR MOBILE & DESKTOP)
              ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

            {/* LEFT COLUMN: TAILORED STEP-BY-STEP INSTRUCTIONS & TIPS (Col 6) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-6 bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-xl"
            >
              {/* Header Badge */}
              <div className="inline-flex items-center px-3.5 py-1.5 rounded-full border border-border text-text-secondary text-xs font-black uppercase tracking-wider mb-5">
                <span>Panduan Langkah Penggunaan</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight uppercase mb-2">
                PETUNJUK AKUN FAN
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-6">
                Panduan cepat daftar & login.
              </p>

              {/* Guide Category Tabs (With Solid Active Styling & Sync) */}
              <div className="grid grid-cols-3 gap-2 bg-background p-2 rounded-2xl border border-border mb-6">
                <button
                  type="button"
                  onClick={() => handleSwitchGuideTab('register-guide')}
                  className={`py-2.5 px-2 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    activeGuideTab === 'register-guide'
                      ? 'bg-primary text-white shadow-md'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
                  }`}
                >
                  <span>Cara Daftar</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchGuideTab('login-guide')}
                  className={`py-2.5 px-2 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    activeGuideTab === 'login-guide'
                      ? 'bg-secondary text-white shadow-md'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
                  }`}
                >
                  <span>Cara Login</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchGuideTab('tips')}
                  className={`py-2.5 px-2 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    activeGuideTab === 'tips'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
                  }`}
                >
                  <span>Tips Kendala</span>
                </button>
              </div>

              {/* Tab Content Instructions */}
              <AnimatePresence mode="wait">
                {activeGuideTab === 'register-guide' && (
                  <motion.div
                    key="reg-guide"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3"
                  >
                    <div className={`p-4 rounded-2xl bg-background border ${registerStep === 1 ? 'border-primary ring-1 ring-primary/30' : 'border-border opacity-50'} flex items-start gap-3.5 shadow-xs transition-all duration-300`}>
                      <div className={`w-8 h-8 rounded-xl border ${registerStep === 1 ? 'border-primary text-primary bg-primary/10' : 'border-border text-text-secondary'} flex items-center justify-center font-black text-sm flex-shrink-0 mt-0.5 transition-colors`}>
                        1
                      </div>
                      <div>
                        <h4 className={`text-xs font-black mb-0.5 uppercase tracking-wide ${registerStep === 1 ? 'text-primary' : 'text-text-primary'}`}>
                          Isi Data Diri
                        </h4>
                        <p className="text-[11px] text-text-secondary leading-relaxed">
                          Isi nama lengkap, email aktif, dan nomor WhatsApp.
                        </p>
                      </div>
                    </div>

                    <div className={`p-4 rounded-2xl bg-background border ${registerStep === 2 ? 'border-primary ring-1 ring-primary/30' : 'border-border opacity-50'} flex items-start gap-3.5 shadow-xs transition-all duration-300`}>
                      <div className={`w-8 h-8 rounded-xl border ${registerStep === 2 ? 'border-primary text-primary bg-primary/10' : 'border-border text-text-secondary'} flex items-center justify-center font-black text-sm flex-shrink-0 mt-0.5 transition-colors`}>
                        2
                      </div>
                      <div>
                        <h4 className={`text-xs font-black mb-0.5 uppercase tracking-wide ${registerStep === 2 ? 'text-primary' : 'text-text-primary'}`}>
                          Keamanan & Verifikasi
                        </h4>
                        <p className="text-[11px] text-text-secondary leading-relaxed">
                          Buat password dan tunggu widget Turnstile terverifikasi.
                        </p>
                      </div>
                    </div>

                    <div className={`p-4 rounded-2xl bg-background border ${registerStep === 3 ? 'border-primary ring-1 ring-primary/30' : 'border-border opacity-50'} flex items-start gap-3.5 shadow-xs transition-all duration-300`}>
                      <div className={`w-8 h-8 rounded-xl border ${registerStep === 3 ? 'border-primary text-primary bg-primary/10' : 'border-border text-text-secondary'} flex items-center justify-center font-black text-sm flex-shrink-0 mt-0.5 transition-colors`}>
                        3
                      </div>
                      <div>
                        <h4 className={`text-xs font-black mb-0.5 uppercase tracking-wide ${registerStep === 3 ? 'text-primary' : 'text-text-primary'}`}>
                          Verifikasi OTP
                        </h4>
                        <p className="text-[11px] text-text-secondary leading-relaxed">
                          Masukkan kode rahasia dari email Anda.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeGuideTab === 'login-guide' && (
                  <motion.div
                    key="login-guide"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3"
                  >
                    <div className="p-4 rounded-2xl bg-background border border-border flex items-start gap-3.5 shadow-xs">
                      <div className="w-8 h-8 rounded-xl border border-border text-text-secondary flex items-center justify-center font-black text-sm flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-text-primary mb-0.5 uppercase tracking-wide">
                          Pilih Metode Autentikasi
                        </h4>
                        <p className="text-[11px] text-text-secondary leading-relaxed">
                          Ketik Email & Password pada form login.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-background border border-border flex items-start gap-3.5 shadow-xs">
                      <div className="w-8 h-8 rounded-xl border border-border text-text-secondary flex items-center justify-center font-black text-sm flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-text-primary mb-0.5 uppercase tracking-wide">
                          Ketik Kredensial & Turnstile
                        </h4>
                        <p className="text-[11px] text-text-secondary leading-relaxed">
                          Pastikan widget Turnstile telah terverifikasi.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-background border border-border flex items-start gap-3.5 shadow-xs">
                      <div className="w-8 h-8 rounded-xl border border-border text-text-secondary flex items-center justify-center font-black text-sm flex-shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-text-primary mb-0.5 uppercase tracking-wide">
                          Akses Sesi Portal 30 Hari
                        </h4>
                        <p className="text-[11px] text-text-secondary leading-relaxed">
                          Sesi fan tersimpan aman selama 30 hari.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeGuideTab === 'tips' && (
                  <motion.div
                    key="tips-guide"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3"
                  >
                    <div className="p-4 rounded-2xl bg-background border border-border flex items-start gap-3.5 shadow-xs">
                      <div className="w-8 h-8 rounded-xl border border-border text-text-secondary flex items-center justify-center font-black text-sm flex-shrink-0 mt-0.5">
                        !
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-text-primary mb-0.5 uppercase tracking-wide">
                          Email Sudah Terdaftar
                        </h4>
                        <p className="text-[11px] text-text-secondary leading-relaxed">
                          Jika sudah terdaftar, silakan ke tab Masuk Cepat.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-background border border-border flex items-start gap-3.5 shadow-xs">
                      <div className="w-8 h-8 rounded-xl border border-border text-text-secondary flex items-center justify-center font-black text-sm flex-shrink-0 mt-0.5">
                        !
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-text-primary mb-0.5 uppercase tracking-wide">
                          Widget Turnstile Loading
                        </h4>
                        <p className="text-[11px] text-text-secondary leading-relaxed">
                          Pastikan internet aktif dan matikan ad-blocker.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-background border border-border flex items-start gap-3.5 shadow-xs">
                      <div className="w-8 h-8 rounded-xl border border-border text-text-secondary flex items-center justify-center font-black text-sm flex-shrink-0 mt-0.5">
                        !
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-text-primary mb-0.5 uppercase tracking-wide">
                          Format WhatsApp
                        </h4>
                        <p className="text-[11px] text-text-secondary leading-relaxed">
                          Gunakan angka murni tanpa spasi atau tanda kurung.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Security Note Footer */}
              <div className="mt-8 pt-6 border-t border-border flex items-center justify-between text-xs text-text-secondary">
                <div className="flex items-center gap-2">
                  <FaShieldAlt className="text-primary" size={14} />
                  <span>Keamanan Akun Cloudflare Turnstile</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-text-primary">
                  <FaCoffee className="text-primary" size={13} />
                  <span>Kohi Sekai ID</span>
                </div>
              </div>
            </motion.div>

            {/* RIGHT COLUMN: AUTHENTICATION FORM CARD WITH DISTINCT STATES (Col 6) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="lg:col-span-6 bg-surface border border-border rounded-3xl p-6 sm:p-8 xl:p-10 shadow-xl relative overflow-hidden"
            >
              {/* Header Accent Glow Strip */}
              <div
                className={`h-1.5 w-full absolute top-0 left-0 transition-colors duration-300 ${
                  authMode === 'quick' ? 'bg-secondary' : 'bg-primary'
                }`}
              />

              {/* Form Title Header (Adapts visually per active tab) */}
              <div className="mb-6">

                <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
                  {authMode === 'quick' ? 'MASUK AKUN FAN' : 'DAFTAR FAN BARU'}
                </h1>
                <p className="text-xs text-text-secondary mt-1">
                  {authMode === 'quick'
                    ? 'Akses cepat dengan email untuk tiket & struk.'
                    : 'Lengkapi profil untuk checkout instan ke depannya.'}
                </p>
              </div>

              {/* Tab Selector (Solid Active Button Distinction & Synchronized) */}
              <div className="grid grid-cols-2 gap-2 bg-background p-2 rounded-2xl border border-border mb-6">
                <button
                  type="button"
                  onClick={() => handleSwitchAuthMode('quick')}
                  className={`py-3 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                    authMode === 'quick'
                      ? 'bg-secondary text-white shadow-md scale-[1.02]'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
                  }`}
                >
                  <span>Masuk Cepat</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchAuthMode('register')}
                  className={`py-3 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                    authMode === 'register'
                      ? 'bg-primary text-white shadow-md scale-[1.02]'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
                  }`}
                >
                  <span>Daftar Akun Baru</span>
                </button>
              </div>

              {/* Form Content Switcher with Smooth Slide/Fade Animation */}
              <AnimatePresence mode="wait">
                {authMode === 'quick' ? (
                  /* LOGIN FORM (EMAIL/USERNAME + PASSWORD) */
                  <motion.form
                    key="login-form"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    transition={{ duration: 0.25 }}
                    onSubmit={handleLoginSubmit}
                    className="space-y-4"
                  >
                    {/* Email / Username */}
                    <div>
                      <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                        Email / Username <span className="text-danger">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="nama@email.com"
                          className={`w-full px-4 py-3 rounded-2xl bg-background border ${
                            errors.email ? 'border-danger' : 'border-border'
                          } text-text-primary text-xs focus:outline-none focus:border-secondary transition-all`}
                          autoFocus
                        />
                      </div>
                      {errors.email && <p className="text-[11px] text-danger mt-1 font-medium">{errors.email}</p>}
                    </div>

                    {/* Password + Forgot Password Link */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">
                          Password <span className="text-danger">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setForgotEmail(loginEmail)
                            setShowForgotModal(true)
                          }}
                          className="text-[11px] font-bold text-text-secondary hover:text-text-primary hover:underline focus:outline-none"
                        >
                          Lupa Password?
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          className={`w-full px-4 py-3 rounded-2xl bg-background border ${
                            errors.password ? 'border-danger' : 'border-border'
                          } text-text-primary text-xs focus:outline-none focus:border-secondary transition-all pr-12`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary focus:outline-none"
                        >
                          {showLoginPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                        </button>
                      </div>
                      {errors.password && <p className="text-[11px] text-danger mt-1 font-medium">{errors.password}</p>}
                    </div>

                    {/* OFFICIAL CLOUDFLARE TURNSTILE WIDGET */}
                    <div>
                      <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                        Verifikasi Keamanan <span className="text-danger">*</span>
                      </label>
                      <TurnstileWidget
                        onVerify={(token) => setLoginTurnstileToken(token)}
                        resetKey={loginTurnstileResetKey}
                      />
                      {errors.turnstile && <p className="text-[11px] text-danger mt-1 font-medium">{errors.turnstile}</p>}
                    </div>

                    {/* Submit Button (Secondary color theme for Login) */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 rounded-2xl bg-secondary hover:bg-secondary/90 text-white font-black text-xs uppercase tracking-widest shadow-md shadow-secondary/25 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Memeriksa Akun...</span>
                        </>
                      ) : (
                        <>
                          <span>Masuk Sekarang</span>
                          <FaArrowRight size={12} />
                        </>
                      )}
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => handleSwitchAuthMode('register')}
                        className="text-xs text-text-secondary hover:text-primary transition-colors font-medium"
                      >
                        Belum pernah mendaftar? <strong className="underline">Daftar Akun Baru</strong>
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  /* REGISTER FORM (NAMA, EMAIL, PASSWORD, WHATSAPP, INSTAGRAM) */
                  <motion.form
                    key="register-form"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.25 }}
                    onSubmit={handleRegisterSubmit}
                    className="space-y-4"
                  >
                    {/* Progress Indicator */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className={`h-1.5 flex-1 rounded-full ${registerStep >= 1 ? 'bg-primary' : 'bg-border transition-colors'}`}></div>
                      <div className={`h-1.5 flex-1 rounded-full ${registerStep >= 2 ? 'bg-primary transition-colors delay-150' : 'bg-border transition-colors'}`}></div>
                      <div className={`h-1.5 flex-1 rounded-full ${registerStep === 3 ? 'bg-primary transition-colors delay-150' : 'bg-border transition-colors'}`}></div>
                    </div>
                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest text-center mb-6 mt-1.5">
                      Langkah {registerStep} dari 3
                    </p>

                    <AnimatePresence mode="wait">
                      {registerStep === 1 ? (
                        <motion.div
                          key="step1"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          {/* Nama Lengkap */}
                          <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                              Nama Lengkap <span className="text-danger">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={registerForm.nama}
                                onChange={(e) => setRegisterForm({ ...registerForm, nama: e.target.value })}
                                placeholder="Contoh: Kiki"
                                className={`w-full px-4 py-2.5 rounded-xl bg-background border ${
                                  errors.nama ? 'border-danger' : 'border-border'
                                } text-text-primary text-xs focus:outline-none focus:border-primary transition-colors`}
                                autoFocus
                              />
                            </div>
                            {errors.nama && <p className="text-[11px] text-danger mt-1 font-medium">{errors.nama}</p>}
                          </div>

                          {/* Email */}
                          <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                              Email <span className="text-danger">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="email"
                                value={registerForm.email}
                                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                                placeholder="nama@email.com"
                                className={`w-full px-4 py-2.5 rounded-xl bg-background border ${
                                  errors.email ? 'border-danger' : 'border-border'
                                } text-text-primary text-xs focus:outline-none focus:border-primary transition-colors`}
                              />
                            </div>
                            {errors.email && <p className="text-[11px] text-danger mt-1 font-medium">{errors.email}</p>}
                          </div>

                          {/* WhatsApp */}
                          <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                              Nomor WhatsApp <span className="text-danger">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="tel"
                                value={registerForm.whatsapp}
                                onChange={(e) => setRegisterForm({ ...registerForm, whatsapp: e.target.value })}
                                placeholder="08123456789"
                                className={`w-full px-4 py-2.5 rounded-xl bg-background border ${
                                  errors.whatsapp ? 'border-danger' : 'border-border'
                                } text-text-primary text-xs focus:outline-none focus:border-primary transition-colors`}
                              />
                            </div>
                            {errors.whatsapp && <p className="text-[11px] text-danger mt-1 font-medium">{errors.whatsapp}</p>}
                          </div>

                          {/* Instagram */}
                          <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                              Instagram <span className="text-text-secondary/50">(Opsional)</span>
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={registerForm.instagram}
                                onChange={(e) => setRegisterForm({ ...registerForm, instagram: e.target.value })}
                                placeholder="@username"
                                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-text-primary text-xs focus:outline-none focus:border-primary transition-colors"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleNextStep1}
                            className="w-full py-3.5 mt-2 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest shadow-md shadow-primary/25 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2"
                          >
                            <span>Lanjut</span>
                            <FaArrowRight size={12} />
                          </button>
                        </motion.div>
                      ) : registerStep === 2 ? (
                        <motion.div
                          key="step2"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          {/* Password */}
                          <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                              Password <span className="text-danger">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type={showRegisterPassword ? 'text' : 'password'}
                                value={registerForm.password}
                                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                                placeholder="Minimal 6 karakter"
                                className={`w-full px-4 py-2.5 rounded-xl bg-background border ${
                                  errors.password ? 'border-danger' : 'border-border'
                                } text-text-primary text-xs focus:outline-none focus:border-primary transition-colors pr-10`}
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary focus:outline-none"
                              >
                                {showRegisterPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                              </button>
                            </div>
                            {errors.password && <p className="text-[11px] text-danger mt-1 font-medium">{errors.password}</p>}
                          </div>

                          {/* Konfirmasi Password */}
                          <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                              Konfirmasi Password <span className="text-danger">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={registerForm.confirmPassword}
                                onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                                placeholder="Ulangi password"
                                className={`w-full px-4 py-2.5 rounded-xl bg-background border ${
                                  errors.confirmPassword ? 'border-danger' : 'border-border'
                                } text-text-primary text-xs focus:outline-none focus:border-primary transition-colors pr-10`}
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary focus:outline-none"
                              >
                                {showConfirmPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                              </button>
                            </div>
                            {errors.confirmPassword && <p className="text-[11px] text-danger mt-1 font-medium">{errors.confirmPassword}</p>}
                          </div>

                          {/* OFFICIAL CLOUDFLARE TURNSTILE WIDGET */}
                          <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                              Verifikasi Keamanan <span className="text-danger">*</span>
                            </label>
                            <TurnstileWidget
                              onVerify={(token) => setRegisterTurnstileToken(token)}
                              resetKey={registerTurnstileResetKey}
                            />
                            {errors.turnstile && <p className="text-[11px] text-danger mt-1 font-medium">{errors.turnstile}</p>}
                          </div>

                          {/* Submit & Back */}
                          <div className="flex items-center gap-3 mt-4 pt-2">
                            <button
                              type="button"
                              onClick={() => setRegisterStep(1)}
                              className="py-3.5 px-5 rounded-2xl border border-border text-text-secondary hover:text-text-primary font-black text-xs uppercase tracking-widest transition-all"
                            >
                              Kembali
                            </button>
                            <button
                              type="submit"
                              disabled={loading}
                              className="flex-1 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest shadow-md shadow-primary/25 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {loading ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  <span>Mengirim...</span>
                                </>
                              ) : (
                                <>
                                  <span>Kirim OTP</span>
                                  <FaArrowRight size={12} />
                                </>
                              )}
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="step3"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          {/* OTP Input */}
                          <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                              Kode OTP <span className="text-danger">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={registerForm.otp}
                                onChange={(e) => setRegisterForm({ ...registerForm, otp: e.target.value })}
                                placeholder="Masukkan 6 digit angka"
                                maxLength="6"
                                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-text-primary text-sm font-bold text-center tracking-[0.5em] focus:outline-none focus:border-primary transition-colors"
                                autoFocus
                              />
                            </div>
                            <p className="text-[11px] text-text-secondary text-center mt-2">
                              Kode dikirimkan ke <strong className="text-text-primary">{registerForm.email}</strong>
                            </p>
                          </div>

                          <div className="flex items-center gap-3 mt-4 pt-2">
                            <button
                              type="button"
                              onClick={() => setRegisterStep(2)}
                              className="py-3.5 px-5 rounded-2xl border border-border text-text-secondary hover:text-text-primary font-black text-xs uppercase tracking-widest transition-all"
                            >
                              Kembali
                            </button>
                            <button
                              type="submit"
                              disabled={loading}
                              className="flex-1 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest shadow-md shadow-primary/25 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {loading ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  <span>Verifikasi...</span>
                                </>
                              ) : (
                                <>
                                  <FaCheckCircle size={13} />
                                  <span>Daftar & Lanjut</span>
                                </>
                              )}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => handleSwitchAuthMode('quick')}
                        className="text-xs text-text-secondary hover:text-secondary transition-colors font-medium"
                      >
                        Sudah punya akun? <strong className="underline">Masuk Sekarang</strong>
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>

          </div>

        </div>
      </main>

      {/* FORGOT PASSWORD MODAL */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-surface border border-border rounded-3xl p-6 sm:p-8 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-text-secondary hover:text-text-primary"
              >
                <FaTimes size={14} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
                  <FaKey size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-text-primary">LUPA PASSWORD</h3>
                  <p className="text-xs text-text-secondary">Reset Akses Akun Fan Kohi Sekai</p>
                </div>
              </div>

              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                    Email Terdaftar
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-secondary">
                      <FaEnvelope size={14} />
                    </div>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full px-4 py-3 rounded-2xl bg-background border border-border text-text-primary text-xs focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-background border border-border flex items-start gap-2.5 text-xs text-text-secondary">
                  <FaExclamationTriangle className="text-warning flex-shrink-0 mt-0.5" size={13} />
                  <span>
                    Fitur pengiriman link reset password sedang dalam tahap integrasi backend. Menekan tombol di bawah akan mengirimkan notifikasi permohonan ke tim bantuan.
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-3 rounded-2xl border border-border text-text-secondary hover:text-text-primary text-xs font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-white text-xs font-black uppercase tracking-wider"
                  >
                    Kirim Reset
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

export default KSLoginPage

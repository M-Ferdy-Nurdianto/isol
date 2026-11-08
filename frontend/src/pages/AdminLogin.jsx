import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { kohiToast } from '../components/ui/KohiToast'
import api from '../lib/api'
import { getAssetPath } from '../lib/pathUtils'
import { FaSpinner, FaSignInAlt, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa'
import { touchAdminSession } from '../lib/authSession'

const AdminLogin = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [logoClickCount, setLogoClickCount] = useState(0)

  useEffect(() => {
    document.documentElement.classList.add('dark')
    document.body.classList.add('dark-theme')
    return () => {
      const savedTheme = localStorage.getItem('ks-theme')
      if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark')
        document.documentElement.classList.add('light')
        document.body.classList.remove('dark-theme')
        document.body.classList.add('light-theme')
      }
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // CHECK FOR GUEST PLAYGROUND CREDENTIALS (GS123 / GS321)
    if (formData.username?.trim() === 'GS123' && formData.password === 'GS321') {
      try {
        localStorage.setItem('is_guest_mode', 'true')
        localStorage.setItem('admin_token', 'demo_guest_token_rb_2026')
        localStorage.setItem('admin_user', JSON.stringify({
          id: 'guest-demo-user',
          username: 'GS123',
          full_name: 'Guest Tester (Demo)',
          role: 'guest'
        }))
        touchAdminSession()

        kohiToast.success('Login Guest Berhasil! Selamat datang di Mode Tamu. Semua fitur dapat dicoba dengan aman tanpa mengubah database.')
        navigate('/admin')
        return
      } finally {
        setLoading(false)
      }
    }

    try {
      const response = await api.post('/auth/login', formData)
      
      if (response.data.success) {
        localStorage.removeItem('is_guest_mode')
        localStorage.setItem('admin_token', response.data.token)
        localStorage.setItem('admin_user', JSON.stringify(response.data.user))
        touchAdminSession()
        
        kohiToast.success(`Login Berhasil! Selamat datang, ${response.data.user.full_name || response.data.user.username}`)
        navigate('/admin')
      }
    } catch (error) {
      console.error('Login error:', error)
      kohiToast.error(error.response?.data?.error || 'Username atau password salah')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickGuestLogin = () => {
    setFormData({ username: 'GS123', password: 'GS321' })
    localStorage.setItem('is_guest_mode', 'true')
    localStorage.setItem('admin_token', 'demo_guest_token_rb_2026')
    localStorage.setItem('admin_user', JSON.stringify({
      id: 'guest-demo-user',
      username: 'GS123',
      full_name: 'Guest Tester (Demo)',
      role: 'guest'
    }))
    touchAdminSession()

    kohiToast.success('Masuk sebagai Guest (GS123)! Mode simulasi interaktif aktif. Data sensitif disensor dan database aman.')
    navigate('/admin')
  }

  const handleLogoClick = () => {
    const nextCount = logoClickCount + 1
    if (nextCount >= 3) {
      setLogoClickCount(0)
      handleQuickGuestLogin()
    } else {
      setLogoClickCount(nextCount)
      // Reset count after 1.5 seconds if user stops clicking
      setTimeout(() => {
        setLogoClickCount(0)
      }, 1500)
    }
  }

  return (
    <div className="admin-layout min-h-screen bg-[var(--background)] text-[var(--text-primary)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Subtle Warm Brand Ambient */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[var(--primary)]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          {/* Logo - Clickable 3x for secret guest login */}
          <div 
            onClick={handleLogoClick}
            className="w-48 h-16 mx-auto mb-4 flex items-center justify-center cursor-pointer select-none transition-transform active:scale-95 group"
            title="Kohi Sekai"
          >
            <img 
              src={getAssetPath('/images/logos/logo.png')} 
              alt="Kohi Sekai Logo" 
              className="w-full h-full object-contain filter group-hover:brightness-110 transition-all"
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] uppercase">
            Login <span className="text-[var(--primary)]">Staff</span>
          </h1>
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mt-1">Kohi Sekai Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all text-sm"
              placeholder="Enter username"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 pr-12 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all text-sm"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                tabIndex="-1"
              >
                {showPassword ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--primary)] text-[#1A1512] font-black py-3.5 px-4 rounded-xl hover:bg-[#F0A868] transition-all shadow-[0_4px_16px_rgba(232,148,74,0.25)] flex justify-center items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin text-lg" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <FaSignInAlt className="text-lg" />
                <span>Masuk Ke Dashboard</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium text-xs transition-colors inline-flex items-center gap-2"
          >
            <FaArrowLeft className="text-xs" />
            <span>Kembali ke Beranda</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin



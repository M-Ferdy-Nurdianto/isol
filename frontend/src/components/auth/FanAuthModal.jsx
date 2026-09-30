import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaTimes, FaUser, FaEnvelope, FaWhatsapp, FaInstagram, FaCoffee, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa'
import { useFanAuth } from '../../context/FanAuthContext'
import { kohiToast } from '../ui/KohiToast'

const FanAuthModal = () => {
  const { authModalOpen, closeAuthModal, login, fanUser, handleAuthSuccess } = useFanAuth()

  const [form, setForm] = useState({
    nama: '',
    email: '',
    whatsapp: '',
    instagram: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // Pre-fill if user already exists
  useEffect(() => {
    if (fanUser) {
      setForm({
        nama: fanUser.nama || '',
        email: fanUser.email || '',
        whatsapp: fanUser.whatsapp || '',
        instagram: fanUser.instagram || '',
      })
    }
  }, [fanUser, authModalOpen])

  if (!authModalOpen) return null

  const validate = () => {
    const newErrors = {}
    if (!form.nama || form.nama.trim().length < 2) {
      newErrors.nama = 'Nama wajib diisi minimal 2 karakter'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!form.email || !emailRegex.test(form.email.trim())) {
      newErrors.email = 'Format email tidak valid (contoh: user@gmail.com)'
    }

    const cleanWa = (form.whatsapp || '').replace(/[^0-9+]/g, '')
    if (!cleanWa || cleanWa.length < 8) {
      newErrors.whatsapp = 'Nomor WhatsApp minimal 8 digit (contoh: 08123456789)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const res = await login({
        nama: form.nama,
        email: form.email,
        whatsapp: form.whatsapp,
        instagram: form.instagram,
      })

      if (res?.success) {
        kohiToast.success(`Selamat datang, ${res.user.nama}!`)
        handleAuthSuccess(res.user)
      } else {
        kohiToast.error('Gagal memproses data. Silakan coba lagi.')
      }
    } catch (err) {
      console.error('Submit error:', err)
      kohiToast.error('Terjadi kesalahan saat masuk.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAuthModal}
          className="absolute inset-0 bg-black/60"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.4, bounce: 0.1 }}
          className="relative w-full max-w-md rounded-3xl bg-surface border border-border shadow-2xl overflow-hidden z-10"
        >
          {/* Header Accent Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-primary" />

          {/* Close Button */}
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-background/80 transition-colors"
            aria-label="Tutup"
          >
            <FaTimes size={14} />
          </button>

          <div className="p-6 sm:p-8">
            {/* Brand icon & title */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center text-primary flex-shrink-0">
                <FaCoffee size={22} />
              </div>
              <div>
                <p className="text-[10px] font-black tracking-[0.3em] text-primary uppercase">Kohi Sekai Fan ID</p>
                <h3 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
                  Masuk / Registrasi
                </h3>
              </div>
            </div>

            <p className="text-xs text-text-secondary mb-6 leading-relaxed">
              Cukup isi data kamu sekali untuk memesan tiket Cheki & menerima struk digital resmi. Tanpa perlu repot password atau kode OTP!
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-text-secondary mb-1.5">
                  Nama Lengkap / Panggilan <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/50">
                    <FaUser size={13} />
                  </div>
                  <input
                    type="text"
                    value={form.nama}
                    onChange={(e) => {
                      setForm(prev => ({ ...prev, nama: e.target.value }))
                      if (errors.nama) setErrors(prev => ({ ...prev, nama: null }))
                    }}
                    placeholder="Contoh: Kiki"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-background border text-text-primary placeholder:text-text-secondary/40 focus:outline-none transition-colors ${
                      errors.nama ? 'border-danger focus:border-danger' : 'border-border focus:border-primary'
                    }`}
                  />
                </div>
                {errors.nama && (
                  <p className="text-[11px] text-danger mt-1 flex items-center gap-1">
                    <FaExclamationCircle size={10} /> {errors.nama}
                  </p>
                )}
              </div>

              {/* Nomor WhatsApp */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-text-secondary mb-1.5">
                  Nomor WhatsApp <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/50">
                    <FaWhatsapp size={15} />
                  </div>
                  <input
                    type="tel"
                    value={form.whatsapp}
                    onChange={(e) => {
                      setForm(prev => ({ ...prev, whatsapp: e.target.value }))
                      if (errors.whatsapp) setErrors(prev => ({ ...prev, whatsapp: null }))
                    }}
                    placeholder="Contoh: 081234567890"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-background border text-text-primary placeholder:text-text-secondary/40 focus:outline-none transition-colors ${
                      errors.whatsapp ? 'border-danger focus:border-danger' : 'border-border focus:border-primary'
                    }`}
                  />
                </div>
                {errors.whatsapp && (
                  <p className="text-[11px] text-danger mt-1 flex items-center gap-1">
                    <FaExclamationCircle size={10} /> {errors.whatsapp}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-text-secondary mb-1.5">
                  Alamat Email <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/50">
                    <FaEnvelope size={13} />
                  </div>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => {
                      setForm(prev => ({ ...prev, email: e.target.value }))
                      if (errors.email) setErrors(prev => ({ ...prev, email: null }))
                    }}
                    placeholder="Contoh: kiki@gmail.com"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-background border text-text-primary placeholder:text-text-secondary/40 focus:outline-none transition-colors ${
                      errors.email ? 'border-danger focus:border-danger' : 'border-border focus:border-primary'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] text-danger mt-1 flex items-center gap-1">
                    <FaExclamationCircle size={10} /> {errors.email}
                  </p>
                )}
              </div>

              {/* Instagram */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-text-secondary mb-1.5">
                  Akun Instagram <span className="text-text-secondary/50 text-[10px] lowercase font-normal">(opsional)</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/50">
                    <FaInstagram size={14} />
                  </div>
                  <input
                    type="text"
                    value={form.instagram}
                    onChange={(e) => setForm(prev => ({ ...prev, instagram: e.target.value }))}
                    placeholder="Contoh: @budi_fan"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-background border border-border text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-widest transition-all duration-200 shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <FaCheckCircle size={14} />
                      <span>Masuk & Lanjutkan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default FanAuthModal

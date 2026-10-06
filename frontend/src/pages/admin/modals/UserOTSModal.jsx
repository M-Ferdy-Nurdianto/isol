import React, { useState } from 'react'
import { FaUserPlus, FaUser, FaEnvelope, FaWhatsapp, FaInstagram, FaSpinner, FaEye, FaEyeSlash, FaChevronUp } from 'react-icons/fa'
import { showToast } from '../../../lib/toast'
import api from '../../../lib/api'

/**
 * UserOTSForm — Inline form untuk registrasi akun Fan On-The-Spot.
 * Tidak lagi berbentuk popup modal, langsung tampil di dalam halaman.
 *
 * Props:
 *  - onRefresh: () => void  — dipanggil setelah berhasil submit
 *  - onDone: () => void     — dipanggil untuk menutup/menyembunyikan form
 */
const UserOTSModal = ({ onRefresh, onDone }) => {
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    whatsapp: '',
    instagram: ''
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleReset = () => {
    setFormData({ nama: '', email: '', whatsapp: '', instagram: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.nama || formData.nama.length < 2) {
      return showToast.error('Nama lengkap wajib diisi minimal 2 karakter')
    }

    // Validasi email hanya jika diisi
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email.trim())) {
        return showToast.error('Format email tidak valid')
      }
    }

    setLoading(true)
    try {
      await api.post('/auth/register', { ...formData, source: 'ots' })
      showToast.success('Akun Fan OTS berhasil dibuat!')
      handleReset()
      onRefresh?.()
      onDone?.()
    } catch (error) {
      showToast.error(error.response?.data?.error || 'Gagal mendaftarkan akun OTS')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--background)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/15 border border-[var(--primary)]/40 flex items-center justify-center shrink-0">
            <FaUserPlus className="text-[var(--primary)] text-sm" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-wide">
              Registrasi Akun OTS
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Pendaftaran on-the-spot untuk Fan.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDone}
          className="w-8 h-8 rounded-lg bg-[var(--border)] hover:bg-[var(--primary)]/20 text-[var(--text-secondary)] hover:text-[var(--primary)] flex items-center justify-center transition text-sm"
          title="Tutup form"
        >
          <FaChevronUp />
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nama Lengkap */}
          <div>
            <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1.5 flex items-center gap-1.5">
              <FaUser className="text-[var(--primary)]" />
              Nama Lengkap <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              type="text"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              placeholder="Masukkan nama lengkap fan..."
              className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] text-xs placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--primary)] transition-colors"
              required
            />
          </div>

          {/* Email Aktif */}
          <div>
            <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1.5 flex items-center gap-1.5">
              <FaEnvelope className="text-[var(--primary)]" />
              Email Aktif <span className="text-[var(--text-secondary)] font-normal">(opsional)</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="email@contoh.com (bisa dikosongkan)"
              className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] text-xs placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--primary)] transition-colors"
            />
            <p className="text-[10px] text-[var(--text-secondary)] mt-1">
              Jika diisi, digunakan untuk reset password via OTP.
            </p>
          </div>

          {/* Nomor WhatsApp */}
          <div>
            <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1.5 flex items-center gap-1.5">
              <FaWhatsapp className="text-[var(--primary)]" />
              Nomor WhatsApp
            </label>
            <input
              type="text"
              name="whatsapp"
              value={formData.whatsapp}
              onChange={handleChange}
              placeholder="0812xxxx (Opsional)"
              className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] text-xs placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--primary)] transition-colors"
            />
          </div>

          {/* Username Instagram */}
          <div>
            <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1.5 flex items-center gap-1.5">
              <FaInstagram className="text-[var(--primary)]" />
              Username Instagram
            </label>
            <input
              type="text"
              name="instagram"
              value={formData.instagram}
              onChange={handleChange}
              placeholder="@username (Opsional)"
              className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] text-xs placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--primary)] transition-colors"
            />
          </div>
        </div>

        {/* Password info note */}
        <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/25">
          <FaEye className="text-[var(--primary)] mt-0.5 shrink-0 text-xs" />
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            Password digenerate otomatis. Jika email diisi, fan bisa login dan reset password via OTP.
            Jika tidak, akun tetap dibuat dan bisa diupdate emailnya nanti di halaman Fan Users.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)]/40 font-semibold text-xs transition disabled:opacity-50"
          >
            Reset Form
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/85 text-[var(--text-primary)] font-bold text-sm flex justify-center items-center gap-2 transition-all shadow-[0_2px_12px_rgba(232,148,74,0.3)] disabled:opacity-50"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" /> Mendaftarkan...
              </>
            ) : (
              <>
                <FaUserPlus /> Daftarkan Akun OTS
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default UserOTSModal


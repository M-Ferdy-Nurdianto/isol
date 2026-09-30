import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FaKey, FaEnvelope, FaLock, FaCheckCircle, FaSpinner, FaArrowLeft, FaShieldAlt } from 'react-icons/fa'
import Swal from 'sweetalert2'
import api from '../lib/api'
import { supabase } from '../lib/supabase'

const ResetPasswordPage = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // Detect recovery mode from email reset link (hash or query params)
  const isEmailRecovery = location.hash.includes('type=recovery') || location.search.includes('type=recovery')

  const [activeTab, setActiveTab] = useState(isEmailRecovery ? 'email' : 'otp')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Form states for OTP Reset
  const [otpForm, setOtpForm] = useState({
    identifier: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Form states for Email Recovery Reset
  const [emailForm, setEmailForm] = useState({
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (isEmailRecovery) {
      setActiveTab('email')
    }

    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setActiveTab('email')
        }
      })
      return () => {
        authListener?.subscription?.unsubscribe()
      }
    }
  }, [isEmailRecovery])

  // Handle OTP Reset Submit
  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (otpForm.newPassword.length < 6) {
      setError('Password baru minimal terdiri dari 6 karakter.')
      return
    }

    if (otpForm.newPassword !== otpForm.confirmPassword) {
      setError('Konfirmasi password tidak cocok dengan password baru.')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/password-reset/verify-otp', {
        identifier: otpForm.identifier.trim(),
        code: otpForm.code.trim(),
        new_password: otpForm.newPassword
      })

      setSuccess(true)
      Swal.fire({
        icon: 'success',
        title: 'Password Berhasil Diubah!',
        text: res.data?.message || 'Password baru Anda telah aktif. Silakan login kembali.',
        confirmButtonColor: '#079108'
      }).then(() => {
        navigate('/')
      })
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Gagal mereset password'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // Handle Email Link Recovery Submit (via Supabase Auth Client)
  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (emailForm.newPassword.length < 6) {
      setError('Password baru minimal terdiri dari 6 karakter.')
      return
    }

    if (emailForm.newPassword !== emailForm.confirmPassword) {
      setError('Konfirmasi password tidak cocok dengan password baru.')
      return
    }

    setLoading(true)
    try {
      if (!supabase) {
        throw new Error('Koneksi otentikasi tidak tersedia.')
      }

      const { data, error: updateErr } = await supabase.auth.updateUser({
        password: emailForm.newPassword
      })

      if (updateErr) throw updateErr

      setSuccess(true)
      Swal.fire({
        icon: 'success',
        title: 'Password Berhasil Diubah!',
        text: 'Password baru Anda telah aktif. Silakan login kembali.',
        confirmButtonColor: '#079108'
      }).then(() => {
        navigate('/')
      })
    } catch (err) {
      setError(err.message || 'Gagal mengubah password dari link email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col justify-center items-center p-4 selection:bg-[#079108] selection:text-white">
      {/* Container */}
      <div className="max-w-md w-full bg-[#111726] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 animate-fade-in">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#079108]/15 border border-[#079108]/40 flex items-center justify-center text-[#079108] mx-auto text-xl shadow-lg">
            <FaShieldAlt />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
            Atur Ulang <span className="text-[#079108]">Password</span>
          </h1>
          <p className="text-xs text-zinc-400">
            Pilih metode reset password menggunakan kode OTP admin atau tautan email.
          </p>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#182032] border border-white/5 rounded-xl">
          <button
            type="button"
            onClick={() => { setActiveTab('otp'); setError(null) }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'otp'
                ? 'bg-[#079108] text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FaKey className="text-[10px]" />
            <span>Kode OTP Admin</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('email'); setError(null) }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'email'
                ? 'bg-[#079108] text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FaEnvelope className="text-[10px]" />
            <span>Link Email</span>
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl text-center font-medium animate-fade-in">
            {error}
          </div>
        )}

        {/* TAB 1: RESET LEWAT KODE OTP */}
        {activeTab === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Email atau ID Fan <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={otpForm.identifier}
                onChange={(e) => setOtpForm({ ...otpForm, identifier: e.target.value })}
                placeholder="Contoh: kiki@gmail.com atau 0002"
                className="w-full px-3.5 py-2.5 bg-[#182032] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:border-[#079108] focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Kode OTP Dari Admin <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={8}
                value={otpForm.code}
                onChange={(e) => setOtpForm({ ...otpForm, code: e.target.value.replace(/\s/g, '') })}
                placeholder="6 digit kode OTP (misal: 482910)"
                className="w-full px-3.5 py-2.5 bg-[#182032] border border-white/10 rounded-xl text-sm font-mono tracking-widest text-center text-white placeholder-zinc-500 focus:border-[#079108] focus:outline-none transition"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Kode OTP berlaku 15 menit dan diberikan oleh admin.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Password Baru <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={otpForm.newPassword}
                onChange={(e) => setOtpForm({ ...otpForm, newPassword: e.target.value })}
                placeholder="Minimal 6 karakter"
                className="w-full px-3.5 py-2.5 bg-[#182032] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:border-[#079108] focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Konfirmasi Password Baru <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={otpForm.confirmPassword}
                onChange={(e) => setOtpForm({ ...otpForm, confirmPassword: e.target.value })}
                placeholder="Ulangi password baru"
                className="w-full px-3.5 py-2.5 bg-[#182032] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:border-[#079108] focus:outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3 px-4 rounded-xl bg-[#079108] hover:bg-[#079108]/90 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin text-sm" />
                  <span>Memverifikasi & Menyimpan...</span>
                </>
              ) : (
                <>
                  <FaCheckCircle className="text-sm" />
                  <span>Ubah Password Sekarang</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: RESET LEWAT LINK EMAIL */}
        {activeTab === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="bg-[#182032] border border-white/5 rounded-xl p-3.5 text-xs text-zinc-300 space-y-1">
              <span className="font-bold text-white block">Tautan Pemulihan Email</span>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {isEmailRecovery
                  ? 'Sesi pemulihan terdeteksi dari email. Masukkan password baru Anda di bawah.'
                  : 'Jika Anda telah menerima email berisi link reset dari admin, klik link tersebut untuk mengisi form di bawah.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Password Baru <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={emailForm.newPassword}
                onChange={(e) => setEmailForm({ ...emailForm, newPassword: e.target.value })}
                placeholder="Minimal 6 karakter"
                className="w-full px-3.5 py-2.5 bg-[#182032] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:border-[#079108] focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Konfirmasi Password Baru <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={emailForm.confirmPassword}
                onChange={(e) => setEmailForm({ ...emailForm, confirmPassword: e.target.value })}
                placeholder="Ulangi password baru"
                className="w-full px-3.5 py-2.5 bg-[#182032] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:border-[#079108] focus:outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3 px-4 rounded-xl bg-[#079108] hover:bg-[#079108]/90 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin text-sm" />
                  <span>Menyimpan Password...</span>
                </>
              ) : (
                <>
                  <FaCheckCircle className="text-sm" />
                  <span>Simpan Password Baru</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Back navigation */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition"
          >
            <FaArrowLeft className="text-[10px]" />
            <span>Kembali ke Beranda</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage

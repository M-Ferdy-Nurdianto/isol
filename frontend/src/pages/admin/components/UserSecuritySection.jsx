import React, { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import {
  FaShieldAlt,
  FaEnvelope,
  FaKey,
  FaEye,
  FaEyeSlash,
  FaCopy,
  FaCheck,
  FaHistory,
  FaSpinner,
  FaExclamationTriangle,
  FaClock
} from 'react-icons/fa'
import { usePasswordReset } from '../../../hooks/usePasswordReset'

/**
 * Account Security & Password Reset Section for Admin User Detail
 */
const UserSecuritySection = ({ user, onActionSuccess }) => {
  const {
    loading,
    history,
    activeOtp,
    sendEmailReset,
    generateOtpReset,
    fetchResetHistory,
    toggleOtpVisibility,
    clearActiveOtp
  } = usePasswordReset()

  const [copied, setCopied] = useState(false)

  // Fetch reset history on user change
  useEffect(() => {
    if (user?.id) {
      fetchResetHistory(user.id)
    }
  }, [user?.id, fetchResetHistory])

  // Handle Option 1: Send reset link to email
  const handleSendEmail = async () => {
    if (!user?.email || user.email.includes('@refreshbreeze.com')) {
      Swal.fire({
        icon: 'warning',
        title: 'Email Tidak Valid',
        text: 'User ini tidak memiliki alamat email aktif yang terdaftar.',
        confirmButtonColor: '#079108'
      })
      return
    }

    const result = await Swal.fire({
      title: 'Kirim Link Reset Password?',
      html: `Link pengaturan password baru akan dikirim langsung ke email user:<br/><span class="text-[#079108] font-bold">${user.email}</span>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Kirim Link Sekarang',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#079108',
      cancelButtonColor: '#374151'
    })

    if (!result.isConfirmed) return

    try {
      const res = await sendEmailReset(user.id)
      Swal.fire({
        icon: 'success',
        title: 'Link Terkirim!',
        text: res.message || `Link berhasil dikirim ke ${res.masked_email}`,
        confirmButtonColor: '#079108'
      })
      fetchResetHistory(user.id)
      onActionSuccess?.()
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengirim Link',
        text: err.message,
        confirmButtonColor: '#079108'
      })
    }
  }

  // Handle Option 2: Generate Admin OTP Code
  const handleGenerateOtp = async () => {
    const result = await Swal.fire({
      title: 'Generate Kode OTP Reset?',
      html: 'Sistem akan membuat <b>kode acak 6 digit</b> (berlaku 15 menit).<br/><span class="text-zinc-400 text-xs mt-2 block">Kode lama yang belum digunakan untuk user ini akan otomatis hangus.</span>',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Generate Kode',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#079108',
      cancelButtonColor: '#374151'
    })

    if (!result.isConfirmed) return

    try {
      await generateOtpReset(user.id)
      fetchResetHistory(user.id)
      onActionSuccess?.()
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Generate OTP',
        text: err.message,
        confirmButtonColor: '#079108'
      })
    }
  }

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <div className="bg-[#111726] border border-white/10 rounded-2xl p-5 space-y-5">
      {/* Header section */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#079108]/15 border border-[#079108]/40 flex items-center justify-center text-[#079108]">
            <FaShieldAlt className="text-sm" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-wide">
              Keamanan Akun & Reset Password
            </h4>
            <p className="text-[11px] text-zinc-400">
              Admin tidak dapat melihat password user. Gunakan salah satu dari 2 opsi resmi di bawah.
            </p>
          </div>
        </div>
      </div>

      {/* 2 Reset Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Opsi 1: Link Email */}
        <div className="bg-[#182032] border border-white/10 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <FaEnvelope className="text-[#079108]" />
              <span>Opsi 1: Reset Lewat Email</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Kirim tautan pemulihan ke email terdaftar ({user?.email || 'Tidak ada email'}). User klik link untuk setel password baru.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSendEmail}
            disabled={loading}
            className="w-full py-2.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? <FaSpinner className="animate-spin text-xs" /> : <FaEnvelope className="text-xs text-[#079108]" />}
            <span>Kirim Link Reset ke Email</span>
          </button>
        </div>

        {/* Opsi 2: Kode OTP Admin */}
        <div className="bg-[#182032] border border-white/10 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <FaKey className="text-[#079108]" />
              <span>Opsi 2: Reset dengan Kode OTP</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Generate kode acak 6 digit (berlaku 15 menit). Berikan kode ke user untuk dimasukkan di halaman reset.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerateOtp}
            disabled={loading}
            className="w-full py-2.5 px-3 rounded-lg bg-[#079108] hover:bg-[#079108]/90 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md disabled:opacity-50"
          >
            {loading ? <FaSpinner className="animate-spin text-xs" /> : <FaKey className="text-xs" />}
            <span>Generate Kode OTP</span>
          </button>
        </div>
      </div>

      {/* ACTIVE OTP DISPLAY BOX (Masked by default, single-view warning) */}
      {activeOtp && (
        <div className="bg-[#182032] border-2 border-[#079108] rounded-xl p-4 space-y-3 shadow-lg animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#079108] flex items-center gap-1.5">
              <FaKey /> Kode OTP Dibuat Berhasil
            </span>
            <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1">
              <FaClock className="text-amber-400" /> Berlaku 15 Menit
            </span>
          </div>

          <div className="flex items-center justify-between bg-[#111726] border border-white/15 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-mono font-black tracking-widest text-white select-all">
                {activeOtp.show ? activeOtp.code : '••••••'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleOtpVisibility}
                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 flex items-center gap-1.5 transition"
                title={activeOtp.show ? 'Sembunyikan' : 'Tampilkan'}
              >
                {activeOtp.show ? <FaEyeSlash /> : <FaEye />}
                <span>{activeOtp.show ? 'Tutup' : 'Lihat'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyCode(activeOtp.code)}
                className="px-3 py-1.5 rounded-lg bg-[#079108] hover:bg-[#079108]/90 text-xs font-bold text-white flex items-center gap-1.5 transition shadow"
              >
                {copied ? <FaCheck /> : <FaCopy />}
                <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
            <FaExclamationTriangle className="shrink-0 mt-0.5" />
            <p>
              Kode OTP ini <b>hanya ditampilkan satu kali</b> pada sesi ini dan tidak akan bisa dilihat lagi setelah halaman ditutup atau direfresh. Di database hanya tersimpan hash enkripsi kode.
            </p>
          </div>
        </div>
      )}

      {/* RIWAYAT RESET TERAKHIR */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between text-xs font-bold text-zinc-300 pb-1">
          <span className="flex items-center gap-1.5">
            <FaHistory className="text-zinc-500" /> Riwayat Reset Terakhir
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">
            {history.length} aktivitas tercatat
          </span>
        </div>

        {history.length === 0 ? (
          <div className="bg-[#182032]/40 border border-white/5 rounded-xl p-3.5 text-center text-xs text-zinc-500">
            Belum ada riwayat aktivitas reset password untuk akun ini.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-[#182032] border border-white/5 rounded-lg px-3 py-2 flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-semibold text-white truncate flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        item.type === 'success'
                          ? 'bg-[#079108]'
                          : item.type === 'failed' || item.type === 'warning'
                          ? 'bg-red-400'
                          : 'bg-blue-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                    Oleh: <span className="text-zinc-300">{item.admin}</span>
                    {item.metadata?.masked_email && (
                      <span className="text-zinc-500"> · {item.metadata.masked_email}</span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 text-right text-[10px] text-zinc-500 font-mono">
                  {new Date(item.created_at).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default UserSecuritySection

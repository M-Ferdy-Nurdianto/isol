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

  useEffect(() => {
    if (user?.id) {
      fetchResetHistory(user.id)
    }
  }, [user?.id, fetchResetHistory])

  const handleSendEmail = async () => {
    if (!user?.email || user.email.includes('@refreshbreeze.com')) {
      Swal.fire({
        icon: 'warning',
        title: 'Email Tidak Valid',
        text: 'User ini tidak memiliki alamat email aktif yang terdaftar.',
        confirmButtonColor: '#E8944A'
      })
      return
    }

    const result = await Swal.fire({
      title: 'Kirim Link Reset Password?',
      html: `Link pengaturan password baru akan dikirim langsung ke email user:<br/><span style="color:#E8944A;font-weight:bold">${user.email}</span>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Kirim Link Sekarang',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#E8944A',
      cancelButtonColor: '#3A2E24'
    })

    if (!result.isConfirmed) return

    try {
      const res = await sendEmailReset(user.id)
      Swal.fire({
        icon: 'success',
        title: 'Link Terkirim!',
        text: res.message || `Link berhasil dikirim ke ${res.masked_email}`,
        confirmButtonColor: '#E8944A'
      })
      fetchResetHistory(user.id)
      onActionSuccess?.()
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengirim Link',
        text: err.message,
        confirmButtonColor: '#E8944A'
      })
    }
  }

  const handleGenerateOtp = async () => {
    const result = await Swal.fire({
      title: 'Generate Kode OTP Reset?',
      html: 'Sistem akan membuat <b>kode acak 6 digit</b> (berlaku 15 menit).<br/><span style="color:#B0A599;font-size:11px">Kode lama yang belum digunakan untuk user ini akan otomatis hangus.</span>',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Generate Kode',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#E8944A',
      cancelButtonColor: '#3A2E24'
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
        confirmButtonColor: '#E8944A'
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
    <div className="bg-[var(--background)] border border-[var(--border)] rounded-2xl p-5 space-y-5">
      {/* Header section */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/15 border border-[var(--primary)]/40 flex items-center justify-center text-[var(--primary)]">
            <FaShieldAlt className="text-sm" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--text-primary)] tracking-wide">
              Keamanan Akun & Reset Password
            </h4>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Admin tidak dapat melihat password user. Gunakan salah satu dari 2 opsi resmi di bawah.
            </p>
          </div>
        </div>
      </div>

      {/* 2 Reset Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Opsi 1: Link Email */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 text-[var(--text-primary)] font-bold text-xs">
              <FaEnvelope className="text-[var(--primary)]" />
              <span>Opsi 1: Reset Lewat Email</span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">
              Kirim tautan pemulihan ke email terdaftar ({user?.email || 'Tidak ada email'}). User klik link untuk setel password baru.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSendEmail}
            disabled={loading}
            className="w-full py-2.5 px-3 rounded-lg bg-[var(--border)] hover:bg-[var(--primary)]/15 border border-[var(--border)] text-[var(--text-primary)] font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? <FaSpinner className="animate-spin text-xs" /> : <FaEnvelope className="text-xs text-[var(--primary)]" />}
            <span>Kirim Link Reset ke Email</span>
          </button>
        </div>

        {/* Opsi 2: Kode OTP Admin */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 text-[var(--text-primary)] font-bold text-xs">
              <FaKey className="text-[var(--primary)]" />
              <span>Opsi 2: Reset dengan Kode OTP</span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">
              Generate kode acak 6 digit (berlaku 15 menit). Berikan kode ke user untuk dimasukkan di halaman reset.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerateOtp}
            disabled={loading}
            className="w-full py-2.5 px-3 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary)]/85 text-[var(--text-primary)] font-bold text-xs flex items-center justify-center gap-2 transition shadow-md disabled:opacity-50"
          >
            {loading ? <FaSpinner className="animate-spin text-xs" /> : <FaKey className="text-xs" />}
            <span>Generate Kode OTP</span>
          </button>
        </div>
      </div>

      {/* ACTIVE OTP DISPLAY BOX */}
      {activeOtp && (
        <div className="bg-[var(--surface)] border-2 border-[var(--primary)] rounded-xl p-4 space-y-3 shadow-lg animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[var(--primary)] flex items-center gap-1.5">
              <FaKey /> Kode OTP Dibuat Berhasil
            </span>
            <span className="text-[11px] font-mono text-[var(--text-secondary)] flex items-center gap-1">
              <FaClock className="text-amber-400" /> Berlaku 15 Menit
            </span>
          </div>

          <div className="flex items-center justify-between bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3">
            <span className="text-2xl font-mono font-black tracking-widest text-[var(--text-primary)] select-all">
              {activeOtp.show ? activeOtp.code : '••••••'}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleOtpVisibility}
                className="px-2.5 py-1.5 rounded-lg bg-[var(--border)] hover:bg-[var(--primary)]/15 border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5 transition"
                title={activeOtp.show ? 'Sembunyikan' : 'Tampilkan'}
              >
                {activeOtp.show ? <FaEyeSlash /> : <FaEye />}
                <span>{activeOtp.show ? 'Tutup' : 'Lihat'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyCode(activeOtp.code)}
                className="px-3 py-1.5 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary)]/85 text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5 transition shadow"
              >
                {copied ? <FaCheck /> : <FaCopy />}
                <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
            <FaExclamationTriangle className="shrink-0 mt-0.5" />
            <p>
              Kode OTP ini <b>hanya ditampilkan satu kali</b> pada sesi ini dan tidak akan bisa dilihat lagi setelah halaman ditutup atau direfresh.
            </p>
          </div>
        </div>
      )}

      {/* RIWAYAT RESET TERAKHIR */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between text-xs font-bold text-[var(--text-secondary)] pb-1">
          <span className="flex items-center gap-1.5">
            <FaHistory className="text-[var(--text-secondary)]" /> Riwayat Reset Terakhir
          </span>
          <span className="text-[10px] text-[var(--text-secondary)] font-mono">
            {history.length} aktivitas tercatat
          </span>
        </div>

        {history.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 text-center text-xs text-[var(--text-secondary)]">
            Belum ada riwayat aktivitas reset password untuk akun ini.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-semibold text-[var(--text-primary)] truncate flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        item.type === 'success'
                          ? 'bg-[var(--success)]'
                          : item.type === 'failed' || item.type === 'warning'
                          ? 'bg-[var(--danger)]'
                          : 'bg-blue-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)] truncate mt-0.5">
                    Oleh: <span className="text-[var(--text-primary)]">{item.admin}</span>
                    {item.metadata?.masked_email && (
                      <span className="text-[var(--text-secondary)]"> · {item.metadata.masked_email}</span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right text-[10px] text-[var(--text-secondary)] font-mono">
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


import React, { useState } from 'react'
import { FaTimes, FaTrash, FaExclamationTriangle, FaCopy, FaCheck, FaShieldAlt } from 'react-icons/fa'
import api from '../../../lib/api'
import { webAlert } from '../../../lib/toast'
import { kohiToast } from '../../../components/ui/KohiToast'

const CONFIRMATION_PHRASE = 'HAPUS SEMUA DATA DUMMY'

const WipeDummyDataModal = ({ onClose, onSuccess }) => {
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const isConfirmed = inputText.trim() === CONFIRMATION_PHRASE

  const handleCopyPhrase = () => {
    navigator.clipboard.writeText(CONFIRMATION_PHRASE)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExecuteWipe = async () => {
    if (!isConfirmed || loading) return

    const confirmed = await webAlert.confirm({
      title: 'Konfirmasi Terakhir Reset Data',
      text: 'Apakah Anda benar-benar yakin ingin menghapus seluruh data transaksi dan akun fan dummy? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.',
      confirmText: 'Ya, Wipe Seluruh Data!',
      cancelText: 'Batal',
      isDanger: true,
    })

    if (!confirmed) return

    try {
      setLoading(true)
      const res = await api.post('/config/reset-dummy-data', {
        confirmation: CONFIRMATION_PHRASE,
      })

      if (res.data?.success) {
        await webAlert.success('Wipe Database Selesai', res.data.message)
        if (typeof onSuccess === 'function') {
          onSuccess()
        }
        onClose()
      } else {
        throw new Error(res.data?.error || 'Gagal mereset database.')
      }
    } catch (err) {
      console.error('[Wipe DB Error]:', err)
      const errorMsg = err.response?.data?.error || err.message || 'Terjadi kesalahan server saat mereset database.'
      webAlert.error('Gagal Reset Database', errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in select-none font-outfit">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-[var(--background)] px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-[var(--danger)]">
              <FaExclamationTriangle className="text-base" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Reset Data Dummy Proyek
              </h2>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Pembersihan database sebelum data resmi digunakan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1.5 transition-colors disabled:opacity-40"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
          
          {/* Warning Banner */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <p className="text-xs text-red-300 leading-relaxed font-medium">
              <strong className="text-[var(--danger)] font-bold uppercase tracking-wider block mb-1">
                Perhatian Khusus
              </strong>
              Fitur ini akan mengosongkan seluruh transaksi dan akun fans pengujian (dummy). Jangan jalankan tindakan ini jika website sudah memiliki transaksi riil dari fans!
            </p>
          </div>

          {/* Scope Cards: Dihapus vs Disimpan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Yang Dihapus */}
            <div className="bg-[var(--background)] border border-red-500/30 rounded-xl p-3.5 space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--danger)] flex items-center gap-1.5">
                <FaTrash className="text-[10px]" /> Dihapus Bersih
              </span>
              <ul className="text-[11px] text-[var(--text-secondary)] space-y-1">
                <li>• Seluruh pesanan cheki & merch</li>
                <li>• Riwayat struk & bukti bayar</li>
                <li>• Seluruh akun fan testing</li>
                <li>• File dummy di Supabase Storage</li>
              </ul>
            </div>

            {/* Yang Aman / Disimpan */}
            <div className="bg-[var(--background)] border border-emerald-500/30 rounded-xl p-3.5 space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
                <FaShieldAlt className="text-[10px]" /> Tetap Aman (Disimpan)
              </span>
              <ul className="text-[11px] text-[var(--text-secondary)] space-y-1">
                <li>• Akun Admin Dashboard</li>
                <li>• Lineup Member Resmi</li>
                <li>• Katalog Merchandise</li>
                <li>• Konfigurasi Web & Jadwal Event</li>
              </ul>
            </div>
          </div>

          {/* Verification Code Box */}
          <div className="space-y-2 pt-2 border-t border-[var(--border)]">
            <label className="block text-xs font-bold text-[var(--text-primary)]">
              Ketik Teks Verifikasi untuk Membuka Tombol:
            </label>
            <div className="flex items-center justify-between px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl">
              <span className="font-mono text-xs font-bold text-[var(--danger)] tracking-wider">
                {CONFIRMATION_PHRASE}
              </span>
              <button
                type="button"
                onClick={handleCopyPhrase}
                className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--primary)] flex items-center gap-1 py-0.5 px-2 rounded hover:bg-[var(--surface)] transition"
              >
                {copied ? <FaCheck className="text-emerald-400 text-xs" /> : <FaCopy className="text-xs" />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Ketik "${CONFIRMATION_PHRASE}" di sini...`}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-secondary)]/40 focus:outline-none focus:border-[var(--danger)] transition"
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-[var(--background)] px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition disabled:opacity-40"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleExecuteWipe}
            disabled={!isConfirmed || loading}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition ${
              isConfirmed && !loading
                ? 'bg-[var(--danger)] hover:bg-[var(--danger)]/90 text-white shadow-lg shadow-red-500/20 active:scale-95'
                : 'bg-[var(--border)] text-[var(--text-secondary)]/40 cursor-not-allowed opacity-50'
            }`}
          >
            <FaTrash className="text-xs" />
            <span>{loading ? 'Memproses Wipe Data...' : 'Wipe Seluruh Data Dummy'}</span>
          </button>
        </div>

      </div>
    </div>
  )
}

export default WipeDummyDataModal
import React, { useState } from 'react'
import { FaSearch, FaUser, FaIdCard, FaWhatsapp, FaEnvelope } from 'react-icons/fa'
import MobileAppShell from '../components/layout/MobileAppShell'
import api from '../../lib/api'

/**
 * KSUserOTSPageMobile (Native-Feel Fan ID Verification Tool)
 */
const KSUserOTSPageMobile = () => {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setHasSearched(true)
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(query.trim())}`)
      if (res.data?.success && res.data.data) {
        setResult(res.data.data)
      } else {
        setResult(null)
      }
    } catch (err) {
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <MobileAppShell title="Cek Akun Fan OTS" showBack={true}>
      <div className="space-y-4 pb-6">

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-4 space-y-2 text-center">
          <FaIdCard className="text-2xl text-[var(--primary)] mx-auto" />
          <h2 className="text-sm font-bold text-[var(--text-primary)]">
            Verifikasi ID & Status Akun Fan
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Cari data keanggotaan fan Anda menggunakan Fan ID (contoh: 0007), email, atau nomor WhatsApp.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik Fan ID, Nama, atau Email..."
            className="flex-1 px-3.5 py-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] shadow-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="touch-target px-4 rounded-2xl bg-[var(--primary)] text-[var(--background)] font-black text-xs tap-active shadow-sm"
          >
            {loading ? 'Cari...' : <FaSearch />}
          </button>
        </form>

        {/* Result Display */}
        {hasSearched && (
          <div className="space-y-3 pt-2">
            {result ? (
              <div className="bg-[var(--surface)] border border-[var(--primary)] rounded-3xl p-5 space-y-3 shadow-md animate-fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                  <span className="text-xs font-mono font-bold text-[var(--text-secondary)]">
                    Kohi Sekai Fan Pass
                  </span>
                  <span className="text-sm font-mono font-black text-[var(--primary)]">
                    #{String(result.fan_id || '').padStart(4, '0')}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)]">
                    <FaUser size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[var(--text-primary)]">{result.nama}</h3>
                    <p className="text-xs text-[var(--text-secondary)] font-mono">{result.email || '-'}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
                  <span>Status Akun:</span>
                  <span className="font-bold text-[var(--success)]">Terdaftar & Aktif</span>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center text-xs text-[var(--text-secondary)]">
                Data akun fan tidak ditemukan. Pastikan Fan ID atau email sudah benar.
              </div>
            )}
          </div>
        )}

      </div>
    </MobileAppShell>
  )
}

export default KSUserOTSPageMobile

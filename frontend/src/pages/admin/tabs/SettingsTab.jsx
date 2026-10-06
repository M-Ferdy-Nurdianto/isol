import React, { useRef, useState } from 'react'
import { FaSave, FaTrash, FaWrench, FaQrcode, FaUniversity, FaUpload, FaTimes, FaExclamationTriangle, FaCopy, FaCheck, FaPlus, FaGripVertical } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../../lib/api'
import { showToast } from '../../../lib/toast'

const fmt = (val) => {
  if (val === undefined || val === null || val === '') return ''
  const n = String(val).replace(/\D/g, '')
  return n ? Number(n).toLocaleString('id-ID') : ''
}
const num = (v) => parseInt(String(v || 0).replace(/\D/g, '') || '0', 10)

// ── Shared toggle button ────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onChange}
    className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 focus:outline-none disabled:opacity-40 ${
      checked ? 'bg-[var(--primary)] shadow-[0_0_10px_rgba(232,148,74,0.35)]' : 'bg-[var(--border)]'
    }`}
  >
    <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition duration-300 ${checked ? 'translate-x-7' : 'translate-x-0'}`} />
  </button>
)

const SettingsTab = ({
  hargaPerMember, setHargaPerMember,
  hargaGrup, setHargaGrup,
  hargaOtsPerMember, setHargaOtsPerMember,
  hargaOtsGrup, setHargaOtsGrup,
  paymentBank, setPaymentBank,
  paymentRekening, setPaymentRekening,
  paymentAtasNama, setPaymentAtasNama,
  paymentMethod, setPaymentMethod,
  wideChekiEnabled, setWideChekiEnabled,
  regularChekiEnabled = true, setRegularChekiEnabled,
  chekiCustomOptions = [], setChekiCustomOptions,
  paymentEnableTf, setPaymentEnableTf,
  paymentEnableQris, setPaymentEnableQris,
  paymentQrisImageUrl, setPaymentQrisImageUrl,
  paymentQrisMerchantName, setPaymentQrisMerchantName,
  maintenanceMode, setMaintenanceMode,
  maintenanceMessage, setMaintenanceMessage,
  maintenanceEstimatedEnd, setMaintenanceEstimatedEnd,
  configLoading, updateConfig,
  onShowBulkDeleteModal, onPurgeOldPayments,
  chekiGrupEnabled, setChekiGrupEnabled,
  hargaChekiGrupPo, setHargaChekiGrupPo,
  hargaChekiGrupOts, setHargaChekiGrupOts,
}) => {
  const qrisFileRef = useRef(null)
  const [qrisUploading, setQrisUploading] = useState(false)
  const [qrisPreview, setQrisPreview] = useState(paymentQrisImageUrl || '')
  const [copied, setCopied] = useState(false)

  // Custom option form state
  const [newOptLabel, setNewOptLabel] = useState('')
  const [newOptPrice, setNewOptPrice] = useState('')

  const handleNumInput = (setter) => (e) => setter(e.target.value.replace(/\D/g, ''))

  // Simulation (only active types)
  // Wide Cheki sekarang = per member (3x seperti Regular, bukan "semua member")
  // Cheki Grup = foto semua member = 1x (jika enabled)
  const numPoMember     = num(hargaPerMember)
  const numPoWide       = num(hargaGrup)
  const numPoGrupCheki  = num(hargaChekiGrupPo)
  const numOtsMember    = num(hargaOtsPerMember)
  const numOtsWide      = num(hargaOtsGrup)
  const numOtsGrupCheki = num(hargaChekiGrupOts)
  const simPoTotal  = (regularChekiEnabled ? numPoMember * 3 : 0)
                     + (wideChekiEnabled ? numPoWide * 3 : 0)
                     + (chekiGrupEnabled ? numPoGrupCheki : 0)
  const simOtsTotal = (regularChekiEnabled ? numOtsMember * 3 : 0)
                     + (wideChekiEnabled ? numOtsWide * 3 : 0)
                     + (chekiGrupEnabled ? numOtsGrupCheki : 0)
  const diffRegular = numOtsMember - numPoMember
  const diffWide    = numOtsWide - numPoWide
  const diffGrup    = numOtsGrupCheki - numPoGrupCheki

  // ── Save handlers ──────────────────────────────────────────────────────────
  const saveHarga = () => {
    updateConfig({
      harga_cheki_per_member: String(num(hargaPerMember)),
      harga_cheki_grup:         String(num(hargaGrup)),
      harga_ots_per_member:     String(num(hargaOtsPerMember)),
      harga_ots_grup:           String(num(hargaOtsGrup)),
      wide_cheki_enabled:     wideChekiEnabled     ? 'true' : 'false',
      regular_cheki_enabled:   regularChekiEnabled  ? 'true' : 'false',
      cheki_custom_options:    JSON.stringify(chekiCustomOptions),
      cheki_grup_enabled:     chekiGrupEnabled   ? 'true' : 'false',
      harga_cheki_grup_po:     String(num(hargaChekiGrupPo)),
      harga_cheki_grup_ots:    String(num(hargaChekiGrupOts)),
    })
  }

  const savePayment = () => {
    if (!paymentEnableTf && !paymentEnableQris) {
      showToast.error('Minimal satu metode pembayaran harus aktif!')
      return
    }
    updateConfig({
      payment_enable_tf:           paymentEnableTf  ? 'true' : 'false',
      payment_enable_qris:         paymentEnableQris ? 'true' : 'false',
      payment_qris_image_url:      paymentQrisImageUrl || '',
      payment_qris_merchant_name:  paymentQrisMerchantName || '',
      payment_bank:                paymentBank || '',
      payment_rekening:            paymentRekening || '',
      payment_atas_nama:           paymentAtasNama || '',
      payment_method:              paymentMethod || 'Manual TF',
    })
  }

  const handleToggleMaintenance = async () => {
    const next = !maintenanceMode
    setMaintenanceMode(next)
    await updateConfig({ maintenance_mode: next ? 'true' : 'false', maintenance_message: maintenanceMessage || '', maintenance_estimated_end: maintenanceEstimatedEnd || '' }, true)
  }

  const handleBlurMaintenance = async () => {
    await updateConfig({ maintenance_message: maintenanceMessage || '', maintenance_estimated_end: maintenanceEstimatedEnd || '' }, true)
  }

  // QRIS upload
  const handleQrisFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { showToast.error('File harus berupa gambar'); return }
    try {
      setQrisUploading(true)
      setQrisPreview(URL.createObjectURL(file))
      const fd = new FormData(); fd.append('file', file)
      const res = await api.post('/upload/qris-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      const url = res.data?.data?.url || ''
      setPaymentQrisImageUrl(url)
      showToast.success('Gambar QRIS berhasil diupload')
    } catch (err) {
      showToast.error(err.response?.data?.error || 'Gagal upload QRIS')
      setQrisPreview(paymentQrisImageUrl || '')
    } finally { setQrisUploading(false) }
  }

  const handleCopyRekening = () => {
    navigator.clipboard.writeText(paymentRekening.replace(/[^0-9]/g, ''))
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  // Custom pricing helpers
  const addCustomOption = () => {
    const label = newOptLabel.trim()
    const price = num(newOptPrice)
    if (!label) { showToast.error('Nama opsi wajib diisi'); return }
    if (!price)  { showToast.error('Harga wajib diisi'); return }
    const newOpt = { id: `custom_${Date.now()}`, label, price }
    setChekiCustomOptions(prev => [...prev, newOpt])
    setNewOptLabel(''); setNewOptPrice('')
  }

  const removeCustomOption = (id) => {
    setChekiCustomOptions(prev => prev.filter(o => o.id !== id))
  }

  const updateCustomOption = (id, field, value) => {
    setChekiCustomOptions(prev => prev.map(o => o.id === id ? { ...o, [field]: field === 'price' ? num(value) : value } : o))
  }

  // ── Style helpers ──────────────────────────────────────────────────────────
  const inputCls = "w-full px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-colors text-[var(--text-primary)] font-bold text-sm placeholder:text-[var(--text-secondary)]/50 placeholder:font-normal"
  const rp = "absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] font-bold text-xs pointer-events-none"

  const SaveBtn = ({ onClick, label = 'Simpan', small }) => (
    <button type="button" onClick={onClick} disabled={configLoading}
      className={`bg-[var(--primary)] text-white font-bold uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 active:scale-95 hover:bg-[var(--primary)]/85 ${
        small ? 'py-2 px-4 text-xs' : 'w-full py-3.5 text-xs justify-center'
      }`}>
      <FaSave className="text-sm shrink-0" />
      {configLoading ? 'Menyimpan...' : label}
    </button>
  )

  const dimIf = (condition) => condition ? 'opacity-40 pointer-events-none select-none' : ''

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-black text-[var(--text-primary)] tracking-tight uppercase">
          Pengaturan <span className="text-[var(--primary)]">Sistem & Harga</span>
        </h2>
        <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">Harga tiket, metode pembayaran, dan konfigurasi sistem.</p>
      </div>

      {/* ═══ 1. HARGA TIKET ═══════════════════════════════════════════════════ */}
      <div className="bg-[var(--surface)] rounded-2xl shadow-xl p-6 border border-[var(--border)] space-y-6">
        <div className="pb-3 border-b border-[var(--border)]">
          <h3 className="text-base font-bold text-[var(--text-primary)]">Harga Tiket <span className="text-[var(--primary)]">Cheki</span></h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">Aktifkan/nonaktifkan setiap tipe cheki secara independen. Admin juga bisa menambah opsi harga kustom.</p>
        </div>

        {/* ─ Regular Cheki ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Toggle header */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--background)] border border-[var(--border)]">
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">Regular Cheki (2-Shot per Member)</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">1x foto 2-Shot dengan member pilihan. Kalau OFF, opsi ini disembunyikan di semua halaman.</p>
            </div>
            <Toggle checked={regularChekiEnabled} onChange={() => setRegularChekiEnabled(p => !p)} />
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 gap-5 ${dimIf(!regularChekiEnabled)}`}>
            <div className="space-y-1.5">
              <label className="block text-xs text-[var(--text-secondary)] font-medium">Regular Cheki PO — Priority Line</label>
              <div className="relative"><span className={rp}>Rp</span>
                <input type="text" value={fmt(hargaPerMember)} onChange={handleNumInput(setHargaPerMember)} disabled={!regularChekiEnabled} className={`${inputCls} pl-11`} placeholder="40.000" />
              </div>
              <p className="text-[10px] text-[var(--text-secondary)]">Pre-Order · 1x 2-Shot per member</p>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs text-[var(--text-secondary)] font-medium">Regular Cheki OTS — Regular Line</label>
              <div className="relative"><span className={rp}>Rp</span>
                <input type="text" value={fmt(hargaOtsPerMember)} onChange={handleNumInput(setHargaOtsPerMember)} disabled={!regularChekiEnabled} className={`${inputCls} pl-11`} placeholder="40.000" />
              </div>
              <p className="text-[10px] text-[var(--text-secondary)]">On The Spot · 1x 2-Shot per member</p>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--border)]" />

        {/* ─ Wide Cheki (Polaroid 16:9) ─────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--background)] border border-[var(--border)]">
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">Wide Cheki (Polaroid 16:9)</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">1x foto polaroid format 16:9 dengan member pilihan (per member, sama seperti Regular Cheki). Independen dari Regular Cheki. Kalau OFF, ditolak juga di server.</p>
            </div>
            <Toggle checked={wideChekiEnabled} onChange={() => setWideChekiEnabled(p => !p)} />
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 gap-5 ${dimIf(!wideChekiEnabled)}`}>
            <div className="space-y-1.5">
              <label className="block text-xs text-[var(--text-secondary)] font-medium">Wide Cheki PO — VIP Line</label>
              <div className="relative"><span className={rp}>Rp</span>
                <input type="text" value={fmt(hargaGrup)} onChange={handleNumInput(setHargaGrup)} disabled={!wideChekiEnabled} className={`${inputCls} pl-11`} placeholder="70.000" />
              </div>
              <p className="text-[10px] text-[var(--text-secondary)]">Pre-Order · 1x Polaroid 16:9 per member</p>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs text-[var(--text-secondary)] font-medium">Wide Cheki OTS — VIP Line</label>
              <div className="relative"><span className={rp}>Rp</span>
                <input type="text" value={fmt(hargaOtsGrup)} onChange={handleNumInput(setHargaOtsGrup)} disabled={!wideChekiEnabled} className={`${inputCls} pl-11`} placeholder="80.000" />
              </div>
              <p className="text-[10px] text-[var(--text-secondary)]">On The Spot · 1x Polaroid 16:9 per member</p>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--border)]" />

        {/* ─ Cheki Grup (Foto Semua Member) ───────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--background)] border border-[var(--border)]">
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">Cheki Grup (Foto Bersama Semua Member)</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">1x foto bersama seluruh member lineup dalam satu frame. Default OFF. Saat OFF: disembunyikan di semua halaman dan ditolak di server.</p>
            </div>
            <Toggle checked={chekiGrupEnabled} onChange={() => setChekiGrupEnabled(p => !p)} />
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 gap-5 ${dimIf(!chekiGrupEnabled)}`}>
            <div className="space-y-1.5">
              <label className="block text-xs text-[var(--text-secondary)] font-medium">Cheki Grup PO — Exclusive Line</label>
              <div className="relative"><span className={rp}>Rp</span>
                <input type="text" value={fmt(hargaChekiGrupPo)} onChange={handleNumInput(setHargaChekiGrupPo)} disabled={!chekiGrupEnabled} className={`${inputCls} pl-11`} placeholder="150.000" />
              </div>
              <p className="text-[10px] text-[var(--text-secondary)]">Pre-Order · 1x foto semua member lineup</p>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs text-[var(--text-secondary)] font-medium">Cheki Grup OTS — Exclusive Line</label>
              <div className="relative"><span className={rp}>Rp</span>
                <input type="text" value={fmt(hargaChekiGrupOts)} onChange={handleNumInput(setHargaChekiGrupOts)} disabled={!chekiGrupEnabled} className={`${inputCls} pl-11`} placeholder="170.000" />
              </div>
              <p className="text-[10px] text-[var(--text-secondary)]">On The Spot · 1x foto semua member lineup</p>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--border)]" />

        {/* ─ Custom Pricing ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div>
            <p className="text-sm font-bold text-[var(--text-primary)]">Opsi Harga Kustom</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Tambah tipe cheki dengan nama dan harga bebas. Ditampilkan sebagai opsi tambahan di halaman checkout.</p>
          </div>

          {/* Existing custom options */}
          {chekiCustomOptions.length > 0 && (
            <div className="space-y-2">
              {chekiCustomOptions.map((opt) => (
                <div key={opt.id} className="flex items-center gap-3 p-3 bg-[var(--background)] border border-[var(--border)] rounded-xl">
                  <FaGripVertical className="text-[var(--text-secondary)] shrink-0" />
                  <input
                    type="text"
                    value={opt.label}
                    onChange={e => updateCustomOption(opt.id, 'label', e.target.value)}
                    placeholder="Nama opsi (e.g. Polaroid 1-Shot)"
                    className="flex-1 min-w-0 px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                  />
                  <div className="relative w-36 shrink-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-xs font-bold pointer-events-none">Rp</span>
                    <input
                      type="text"
                      value={fmt(opt.price)}
                      onChange={e => updateCustomOption(opt.id, 'price', e.target.value)}
                      placeholder="50.000"
                      className="w-full pl-9 pr-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] font-bold focus:border-[var(--primary)] focus:outline-none transition-colors"
                    />
                  </div>
                  <button type="button" onClick={() => removeCustomOption(opt.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/20 transition shrink-0">
                    <FaTimes className="text-xs" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new */}
          <div className="flex items-center gap-3 p-3 bg-[var(--background)] border border-dashed border-[var(--border)] rounded-xl">
            <input
              type="text"
              value={newOptLabel}
              onChange={e => setNewOptLabel(e.target.value)}
              placeholder="Nama opsi baru..."
              className="flex-1 min-w-0 px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none transition-colors"
            />
            <div className="relative w-36 shrink-0">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-xs font-bold pointer-events-none">Rp</span>
              <input
                type="text"
                value={newOptPrice}
                onChange={e => setNewOptPrice(e.target.value.replace(/\D/g, ''))}
                placeholder="50.000"
                className="w-full pl-9 pr-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] font-bold focus:border-[var(--primary)] focus:outline-none transition-colors"
              />
            </div>
            <button type="button" onClick={addCustomOption}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--primary)]/15 text-[var(--primary)] hover:bg-[var(--primary)]/25 transition shrink-0">
              <FaPlus className="text-xs" />
            </button>
          </div>
          {chekiCustomOptions.length === 0 && (
            <p className="text-[11px] text-[var(--text-secondary)] text-center">Belum ada opsi kustom. Klik + untuk menambah.</p>
          )}
        </div>

        <div className="border-t border-[var(--border)]" />

        {/* ─ Simulasi ───────────────────────────────────────────────────── */}
        <div className="bg-[var(--background)] rounded-xl p-4 border border-[var(--border)] space-y-3">
          <p className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-wider">
            Simulasi: {regularChekiEnabled ? '3× Regular' : ''}{(regularChekiEnabled && wideChekiEnabled) ? ' + ' : ''}{wideChekiEnabled ? '3× Wide' : ''}{(regularChekiEnabled || wideChekiEnabled) && chekiGrupEnabled ? ' + ' : ''}{chekiGrupEnabled ? '1× Cheki Grup' : ''}{!regularChekiEnabled && !wideChekiEnabled && !chekiGrupEnabled ? 'Semua nonaktif' : ''}
          </p>
          {(regularChekiEnabled || wideChekiEnabled || chekiGrupEnabled) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                <span className="text-[var(--primary)] font-medium">Total PO</span>
                <span className="font-black text-[var(--text-primary)]">Rp {simPoTotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                <span className="text-amber-400 font-medium">Total OTS</span>
                <span className="font-black text-[var(--text-primary)]">Rp {simOtsTotal.toLocaleString('id-ID')}</span>
              </div>
              {regularChekiEnabled && (
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                  <span className="text-[var(--text-secondary)]">Selisih Regular (3 member)</span>
                  <span className={`font-semibold ${diffRegular > 0 ? 'text-amber-400' : diffRegular < 0 ? 'text-[var(--danger)]' : 'text-[var(--text-secondary)]'}`}>
                    {diffRegular === 0 ? 'Sama' : `${diffRegular > 0 ? '+' : ''}Rp ${(Math.abs(diffRegular) * 3).toLocaleString('id-ID')} di OTS`}
                  </span>
                </div>
              )}
              {wideChekiEnabled && (
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                  <span className="text-[var(--text-secondary)]">Selisih Wide (3 member)</span>
                  <span className={`font-semibold ${diffWide > 0 ? 'text-amber-400' : diffWide < 0 ? 'text-[var(--danger)]' : 'text-[var(--text-secondary)]'}`}>
                    {diffWide === 0 ? 'Sama' : `${diffWide > 0 ? '+' : ''}Rp ${(Math.abs(diffWide) * 3).toLocaleString('id-ID')} di OTS`}
                  </span>
                </div>
              )}
              {chekiGrupEnabled && (
                <div className="sm:col-span-2 flex justify-between items-center p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                  <span className="text-[var(--text-secondary)]">Selisih Cheki Grup (1x)</span>
                  <span className={`font-semibold ${diffGrup > 0 ? 'text-amber-400' : diffGrup < 0 ? 'text-[var(--danger)]' : 'text-[var(--text-secondary)]'}`}>
                    {diffGrup === 0 ? 'Sama' : `${diffGrup > 0 ? '+' : ''}Rp ${Math.abs(diffGrup).toLocaleString('id-ID')} di OTS`}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-center text-[var(--text-secondary)]">Aktifkan minimal satu tipe cheki untuk melihat simulasi.</p>
          )}
        </div>

        <SaveBtn onClick={saveHarga} label="Simpan Pengaturan Harga" />
      </div>

      {/* ═══ 2. METODE PEMBAYARAN ══════════════════════════════════════════════ */}
      <div className="bg-[var(--surface)] rounded-2xl shadow-xl p-6 border border-[var(--border)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
          <h3 className="text-base font-bold text-[var(--text-primary)]">Metode Pembayaran <span className="text-[var(--primary)]">& Rekening</span></h3>
          <SaveBtn onClick={savePayment} label="Simpan Pembayaran" small />
        </div>

        {!paymentEnableTf && !paymentEnableQris && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/30">
            <FaExclamationTriangle className="text-[var(--danger)] mt-0.5 shrink-0" />
            <p className="text-xs text-[var(--danger)] font-semibold">Minimal satu metode harus aktif sebelum menyimpan.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Transfer */}
          <div className={`rounded-xl border p-5 space-y-4 ${paymentEnableTf ? 'border-[var(--primary)]/40 bg-[var(--background)]' : 'border-[var(--border)] bg-[var(--background)] opacity-60'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                <FaUniversity className="text-[var(--primary)]" /> Transfer Bank
              </div>
              <Toggle checked={paymentEnableTf} onChange={() => setPaymentEnableTf(p => !p)} />
            </div>
            <div className="space-y-3">
              {[
                { label: 'Nama Bank / E-Wallet', val: paymentBank, set: setPaymentBank, ph: 'BCA, Mandiri, Seabank...' },
                { label: 'Nomor Rekening', val: paymentRekening, set: setPaymentRekening, ph: '0902683273', mono: true },
                { label: 'Atas Nama', val: paymentAtasNama, set: setPaymentAtasNama, ph: 'Nama Pemilik Rekening' },
                { label: 'Label Metode', val: paymentMethod, set: setPaymentMethod, ph: 'Manual TF, QRIS...' },
              ].map(({ label, val, set, ph, mono }) => (
                <div key={label}>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">{label}</label>
                  <div className="relative">
                    <input type="text" value={val} onChange={e => set(e.target.value)} placeholder={ph} disabled={!paymentEnableTf}
                      className={`${inputCls} ${mono ? 'font-mono' : ''} ${val === paymentRekening ? 'pr-10' : ''}`} />
                    {val === paymentRekening && (
                      <button type="button" onClick={handleCopyRekening}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition">
                        {copied ? <FaCheck className="text-[var(--success)]" /> : <FaCopy />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* QRIS */}
          <div className={`rounded-xl border p-5 space-y-4 ${paymentEnableQris ? 'border-[var(--primary)]/40 bg-[var(--background)]' : 'border-[var(--border)] bg-[var(--background)] opacity-60'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                <FaQrcode className="text-[var(--primary)]" /> QRIS
              </div>
              <Toggle checked={paymentEnableQris} onChange={() => setPaymentEnableQris(p => !p)} />
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">Nama Merchant</label>
                <input type="text" value={paymentQrisMerchantName} onChange={e => setPaymentQrisMerchantName(e.target.value)} disabled={!paymentEnableQris} placeholder="Kohi Sekai Official" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-2">Gambar QR Code</label>
                {(qrisPreview || paymentQrisImageUrl) ? (
                  <div className="relative w-full aspect-square max-w-[160px] mx-auto mb-3 rounded-xl overflow-hidden border border-[var(--border)] bg-white">
                    <img src={qrisPreview || paymentQrisImageUrl} alt="QRIS" className="w-full h-full object-contain p-2" />
                    <button type="button" onClick={() => { setQrisPreview(''); setPaymentQrisImageUrl('') }}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[var(--danger)]/80 text-white flex items-center justify-center text-xs hover:bg-[var(--danger)] transition">
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <div className="w-full aspect-square max-w-[160px] mx-auto mb-3 rounded-xl border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-2 text-[var(--text-secondary)]">
                    <FaQrcode className="text-3xl opacity-40" /><span className="text-xs">Belum ada QR</span>
                  </div>
                )}
                <input type="file" ref={qrisFileRef} accept="image/*" onChange={handleQrisFileChange} className="hidden" />
                <button type="button" onClick={() => qrisFileRef.current?.click()} disabled={!paymentEnableQris || qrisUploading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 border border-[var(--primary)]/30 text-[var(--primary)] text-xs font-bold transition disabled:opacity-40">
                  <FaUpload /> {qrisUploading ? 'Mengupload...' : 'Upload Gambar QR'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 3. MODE PEMELIHARAAN ═════════════════════════════════════════════ */}
      <div className="bg-[var(--surface)] rounded-2xl shadow-xl p-6 border border-[var(--border)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[var(--text-primary)]">Mode Pemeliharaan Website</h3>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase ${maintenanceMode ? 'bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30' : 'bg-[var(--border)] text-[var(--text-secondary)] border border-[var(--border)]'}`}>
              {maintenanceMode ? 'Aktif' : 'Live'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold uppercase tracking-wider ${maintenanceMode ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'}`}>{maintenanceMode ? 'MT Aktif' : 'MT Nonaktif'}</span>
            <Toggle checked={maintenanceMode} onChange={handleToggleMaintenance} disabled={configLoading} />
          </div>
        </div>
        <AnimatePresence>
          {maintenanceMode && (
            <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 20 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden border-t border-[var(--border)] pt-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Pesan Pengumuman</label>
                  <textarea rows={3} value={maintenanceMessage} onChange={e => setMaintenanceMessage(e.target.value)} onBlur={handleBlurMaintenance} placeholder="Website sedang dalam pemeliharaan..."
                    className="w-full px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl focus:border-[var(--primary)] focus:outline-none transition text-[var(--text-primary)] text-xs resize-none placeholder:text-[var(--text-secondary)]/50" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Estimasi Selesai (Opsional)</label>
                  <input type="datetime-local" value={maintenanceEstimatedEnd} onChange={e => setMaintenanceEstimatedEnd(e.target.value)} onBlur={handleBlurMaintenance}
                    className="w-full px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl focus:border-[var(--primary)] focus:outline-none transition text-[var(--text-primary)] text-xs [color-scheme:dark]" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ 4. MANAJEMEN DATA ════════════════════════════════════════════════ */}
      <div className="bg-[var(--surface)] rounded-2xl shadow-xl p-6 border border-[var(--border)] space-y-5">
        <div className="pb-4 border-b border-[var(--border)]">
          <h3 className="text-base font-bold text-[var(--text-primary)] uppercase tracking-tight">Manajemen Data & <span className="text-[var(--danger)]">Storage</span></h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-[var(--background)] rounded-xl p-5 border border-[var(--border)] flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span><h4 className="text-sm font-bold text-[var(--text-primary)]">Auto-Purge Bukti Bayar (&gt; 1 Bulan)</h4></div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">Hapus foto bukti transfer lama dari Supabase Storage untuk menghemat kuota.</p>
            </div>
            <button type="button" onClick={onPurgeOldPayments} className="w-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 active:scale-95">
              <FaWrench /> Bersihkan &gt; 1 Bulan
            </button>
          </div>
          <div className="bg-[var(--background)] rounded-xl p-5 border border-[var(--danger)]/30 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2"><span className="w-2.5 h-2.5 rounded-full bg-[var(--danger)]"></span><h4 className="text-sm font-bold text-[var(--text-primary)]">Hapus Data Pembelian</h4></div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">Hapus transaksi + bukti bayar (full reset atau per event).</p>
            </div>
            <button type="button" onClick={onShowBulkDeleteModal} className="w-full bg-[var(--danger)]/15 hover:bg-[var(--danger)]/25 border border-[var(--danger)]/40 text-[var(--danger)] py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 active:scale-95">
              <FaTrash /> Buka Opsi Hapus Data
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsTab

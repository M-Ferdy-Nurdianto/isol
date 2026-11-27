import React, { useRef, useState } from 'react'
import { FaSave, FaTrash, FaWrench, FaQrcode, FaUniversity, FaUpload, FaTimes, FaExclamationTriangle, FaCopy, FaCheck, FaPlus, FaGripVertical } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../../lib/api'
import { showToast } from '../../../lib/toast'
import ImageUploadDropzone from '../../../components/ui/ImageUploadDropzone'
import { parsePriceInput, formatPriceDisplay } from '../../../lib/priceInput'

const fmt = formatPriceDisplay
const num = (v) => parseInt(String(v || 0).replace(/\D/g, '') || '0', 10)

// ── Shared toggle button ────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onChange}
    className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 focus:outline-none disabled:opacity-40 ${checked ? 'bg-[var(--primary)] shadow-[0_0_10px_rgba(232,148,74,0.35)]' : 'bg-[var(--border)]'
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
  paymentEnableTf, setPaymentEnableTf,
  paymentEnableQris, setPaymentEnableQris,
  paymentQrisImageUrl, setPaymentQrisImageUrl,
  paymentQrisMerchantName, setPaymentQrisMerchantName,
  maintenanceMode, setMaintenanceMode,
  maintenanceMessage, setMaintenanceMessage,
  maintenanceEstimatedEnd, setMaintenanceEstimatedEnd,
  configLoading, updateConfig,
  onShowBulkDeleteModal, onPurgeOldPayments,
  onShowWipeModal,
  chekiGrupEnabled, setChekiGrupEnabled,
  hargaChekiGrupPo, setHargaChekiGrupPo,
  hargaChekiGrupOts, setHargaChekiGrupOts,
}) => {
  const qrisFileRef = useRef(null)
  const [qrisUploading, setQrisUploading] = useState(false)
  const [qrisPreview, setQrisPreview] = useState(paymentQrisImageUrl || '')
  const [copied, setCopied] = useState(false)

  const handleNumInput = (setter) => (e) => setter(parsePriceInput(e.target.value))

  // ── Save handlers ──────────────────────────────────────────────────────────
  const saveHarga = () => {
    updateConfig({
      harga_cheki_per_member: String(num(hargaPerMember)),
      harga_cheki_grup: String(num(hargaGrup)),
      harga_ots_per_member: String(num(hargaOtsPerMember)),
      harga_ots_grup: String(num(hargaOtsGrup)),
      wide_cheki_enabled: wideChekiEnabled ? 'true' : 'false',
      regular_cheki_enabled: regularChekiEnabled ? 'true' : 'false',
      cheki_grup_enabled: chekiGrupEnabled ? 'true' : 'false',
      harga_cheki_grup_po: String(num(hargaChekiGrupPo)),
      harga_cheki_grup_ots: String(num(hargaChekiGrupOts)),
    })
  }

  const savePayment = () => {
    if (!paymentEnableTf && !paymentEnableQris) {
      showToast.error('Minimal satu metode pembayaran harus aktif!')
      return
    }
    updateConfig({
      payment_enable_tf: paymentEnableTf ? 'true' : 'false',
      payment_enable_qris: paymentEnableQris ? 'true' : 'false',
      payment_qris_image_url: paymentQrisImageUrl || '',
      payment_qris_merchant_name: paymentQrisMerchantName || '',
      payment_bank: paymentBank || '',
      payment_rekening: paymentRekening || '',
      payment_atas_nama: paymentAtasNama || '',
      payment_method: paymentMethod || 'Manual TF',
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

  // ── Style helpers ──────────────────────────────────────────────────────────
  const inputCls = "w-full px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-colors text-[var(--text-primary)] font-bold text-sm placeholder:text-[var(--text-secondary)]/50 placeholder:font-normal"
  const rp = "absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] font-bold text-xs pointer-events-none"

  const SaveBtn = ({ onClick, label = 'Simpan', small }) => (
    <button type="button" onClick={onClick} disabled={configLoading}
      className={`bg-[var(--primary)] text-white font-bold uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 active:scale-95 hover:bg-[var(--primary)]/85 ${small ? 'py-2 px-4 text-xs' : 'w-full py-3.5 text-xs justify-center'
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
            <p className="text-sm font-bold text-[var(--text-primary)]">Regular Cheki (2-Shot per Member)</p>
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

        {/* ─ Wide Cheki ─────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--background)] border border-[var(--border)]">
            <p className="text-sm font-bold text-[var(--text-primary)]">Wide Cheki</p>
            <Toggle checked={wideChekiEnabled} onChange={() => setWideChekiEnabled(p => !p)} />
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 gap-5 ${dimIf(!wideChekiEnabled)}`}>
            <div className="space-y-1.5">
              <label className="block text-xs text-[var(--text-secondary)] font-medium">Wide Cheki PO — VIP Line</label>
              <div className="relative"><span className={rp}>Rp</span>
                <input type="text" value={fmt(hargaGrup)} onChange={handleNumInput(setHargaGrup)} disabled={!wideChekiEnabled} className={`${inputCls} pl-11`} placeholder="70.000" />
              </div>
              <p className="text-[10px] text-[var(--text-secondary)]">Pre-Order · 1x Wide Cheki per member</p>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs text-[var(--text-secondary)] font-medium">Wide Cheki OTS — VIP Line</label>
              <div className="relative"><span className={rp}>Rp</span>
                <input type="text" value={fmt(hargaOtsGrup)} onChange={handleNumInput(setHargaOtsGrup)} disabled={!wideChekiEnabled} className={`${inputCls} pl-11`} placeholder="80.000" />
              </div>
              <p className="text-[10px] text-[var(--text-secondary)]">On The Spot · 1x Wide Cheki per member</p>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--border)]" />

        {/* ─ Cheki Grup (Foto Semua Member) ───────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--background)] border border-[var(--border)]">
            <p className="text-sm font-bold text-[var(--text-primary)]">Cheki Grup (Foto Bersama Semua Member)</p>
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
                <ImageUploadDropzone
                  label="Gambar QR Code *"
                  previewUrl={qrisPreview || paymentQrisImageUrl}
                  onImageChange={async (compressedWebpFile, blobUrl) => {
                    try {
                      setQrisUploading(true)
                      setQrisPreview(blobUrl)
                      const fd = new FormData()
                      fd.append('file', compressedWebpFile)
                      const res = await api.post('/upload/qris-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                      const url = res.data?.data?.url
                      setPaymentQrisImageUrl(url)
                      showToast.success('Gambar QRIS berhasil diupload')
                    } catch (err) {
                      showToast.error(err.response?.data?.error || 'Gagal upload QRIS')
                      setQrisPreview(paymentQrisImageUrl || '')
                    } finally {
                      setQrisUploading(false)
                    }
                  }}
                  onRemove={() => {
                    setQrisPreview('')
                    setPaymentQrisImageUrl('')
                  }}
                  disabled={!paymentEnableQris || qrisUploading}
                  hint="Drag & drop QRIS (Auto WebP). Klik kotak untuk perbesar."
                  compact={true}
                />
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

          {/* Wipe Dummy Data Card (Wipe DB) */}
          <div className="bg-[var(--background)] rounded-xl p-5 border border-red-500/40 flex flex-col justify-between gap-4 md:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--danger)]"></span>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">
                    Reset Data Dummy (Wipe Database)
                  </h4>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-2xl">
                  Bersihkan seluruh transaksi (pesanan cheki & merch), riwayat struk, dan seluruh akun fans testing.
                  Lineup Member, Merchandise, Konfigurasi Web, dan Akun Admin tetap aman dan tidak akan terhapus.
                </p>
              </div>
              <button
                type="button"
                onClick={onShowWipeModal}
                className="shrink-0 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 active:scale-95"
              >
                <FaExclamationTriangle /> Reset Data Dummy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsTab

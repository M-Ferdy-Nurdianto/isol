import React from 'react'
import { FaSave, FaTrash, FaWrench } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'

// Helper to format string into thousand separator (e.g. "30000" -> "30.000")
const formatThousand = (val) => {
  if (val === undefined || val === null || val === '') return ''
  const numStr = String(val).replace(/\D/g, '')
  if (!numStr) return ''
  return Number(numStr).toLocaleString('id-ID')
}

const SettingsTab = ({
  hargaPerMember, setHargaPerMember,
  hargaGrup, setHargaGrup,
  hargaOtsPerMember, setHargaOtsPerMember,
  hargaOtsGrup, setHargaOtsGrup,
  paymentBank, setPaymentBank,
  paymentRekening, setPaymentRekening,
  paymentAtasNama, setPaymentAtasNama,
  paymentMethod, setPaymentMethod,
  maintenanceMode, setMaintenanceMode,
  maintenanceMessage, setMaintenanceMessage,
  maintenanceEstimatedEnd, setMaintenanceEstimatedEnd,
  configLoading, updateConfig,
  onShowBulkDeleteModal,
  onPurgeOldPayments
}) => {
  const handleSaveSettings = () => {
    updateConfig({
      harga_cheki_per_member: String(hargaPerMember).replace(/\D/g, ''),
      harga_cheki_grup: String(hargaGrup).replace(/\D/g, ''),
      harga_ots_per_member: String(hargaOtsPerMember).replace(/\D/g, ''),
      harga_ots_grup: String(hargaOtsGrup).replace(/\D/g, ''),
      payment_bank: paymentBank || '',
      payment_rekening: paymentRekening || '',
      payment_atas_nama: paymentAtasNama || '',
      payment_method: paymentMethod || 'Manual TF',
      maintenance_mode: maintenanceMode ? 'true' : 'false',
      maintenance_message: maintenanceMessage || '',
      maintenance_estimated_end: maintenanceEstimatedEnd || ''
    })
  }

  const handleToggleMaintenance = async () => {
    const nextState = !maintenanceMode
    setMaintenanceMode(nextState)
    await updateConfig({
      maintenance_mode: nextState ? 'true' : 'false',
      maintenance_message: maintenanceMessage || '',
      maintenance_estimated_end: maintenanceEstimatedEnd || ''
    }, true)
  }

  const handleBlurMaintenanceDetails = async () => {
    await updateConfig({
      maintenance_message: maintenanceMessage || '',
      maintenance_estimated_end: maintenanceEstimatedEnd || ''
    }, true)
  }

  // Handle formatted input change
  const handleInputChange = (setter) => (e) => {
    const rawDigits = e.target.value.replace(/\D/g, '')
    setter(rawDigits)
  }

  // Numeric values for calculation
  const numPoMember = parseInt(String(hargaPerMember).replace(/\D/g, '') || '0', 10)
  const numPoGroup = parseInt(String(hargaGrup).replace(/\D/g, '') || '0', 10)
  const numOtsMember = parseInt(String(hargaOtsPerMember).replace(/\D/g, '') || '0', 10)
  const numOtsGroup = parseInt(String(hargaOtsGrup).replace(/\D/g, '') || '0', 10)

  // Simulation: Fan orders 3 individual chekis + 1 group cheki
  const simQtyIndividual = 3
  const simPoTotal = (numPoMember * simQtyIndividual) + numPoGroup
  const simOtsTotal = (numOtsMember * simQtyIndividual) + numOtsGroup

  // Difference between PO & OTS per member
  const otsMarkupPerMember = numOtsMember - numPoMember
  const otsMarkupGroup = numOtsGroup - numPoGroup

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">
          Pengaturan <span className="text-[#079108]">Sistem & Harga</span>
        </h2>
        <p className="text-xs text-zinc-400 font-medium mt-1">
          Harga tiket, rekening, dan konfigurasi sistem.
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. HARGA PO & OTS (2 Kolom Sejajar)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Kolom 1: Harga Pre-Order (PO) */}
        <div className="bg-[#111726]/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/10 flex flex-col justify-between gap-4">
          <div className="pb-3 border-b border-white/10">
            <h3 className="text-base font-bold text-white">Harga Pre-Order (PO)</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-300 font-medium mb-1.5">
                Harga cheki per member
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">
                  Rp
                </span>
                <input
                  type="text"
                  value={formatThousand(hargaPerMember)}
                  onChange={handleInputChange(setHargaPerMember)}
                  className="w-full pl-11 pr-4 py-2.5 bg-[#182032] border border-white/10 rounded-xl focus:border-cyan-400 focus:outline-none transition-colors text-white font-bold text-sm"
                  placeholder="25.000"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-300 font-medium mb-1.5">
                Harga cheki grup (semua member)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">
                  Rp
                </span>
                <input
                  type="text"
                  value={formatThousand(hargaGrup)}
                  onChange={handleInputChange(setHargaGrup)}
                  className="w-full pl-11 pr-4 py-2.5 bg-[#182032] border border-white/10 rounded-xl focus:border-cyan-400 focus:outline-none transition-colors text-white font-bold text-sm"
                  placeholder="30.000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Kolom 2: Harga OTS (On The Spot) */}
        <div className="bg-[#111726]/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/10 flex flex-col justify-between gap-4">
          <div className="pb-3 border-b border-white/10">
            <h3 className="text-base font-bold text-white">Harga OTS (On The Spot)</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-300 font-medium mb-1.5">
                Harga OTS per member
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">
                  Rp
                </span>
                <input
                  type="text"
                  value={formatThousand(hargaOtsPerMember)}
                  onChange={handleInputChange(setHargaOtsPerMember)}
                  className="w-full pl-11 pr-4 py-2.5 bg-[#182032] border border-white/10 rounded-xl focus:border-amber-400 focus:outline-none transition-colors text-white font-bold text-sm"
                  placeholder="25.000"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-300 font-medium mb-1.5">
                Harga OTS grup (semua member)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">
                  Rp
                </span>
                <input
                  type="text"
                  value={formatThousand(hargaOtsGrup)}
                  onChange={handleInputChange(setHargaOtsGrup)}
                  className="w-full pl-11 pr-4 py-2.5 bg-[#182032] border border-white/10 rounded-xl focus:border-amber-400 focus:outline-none transition-colors text-white font-bold text-sm"
                  placeholder="30.000"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. SIMULASI & PERBANDINGAN (Full-Width, Horizontal)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#111726]/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/10 space-y-5">
        <div className="pb-3 border-b border-white/10">
          <h3 className="text-base font-bold text-white">Simulasi & Perbandingan</h3>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Kotak 1: Simulasi Belanja */}
          <div className="bg-[#161f33] rounded-xl p-4 border border-white/10 space-y-2.5">
            <span className="text-xs font-bold text-zinc-200 block">
              Simulasi (3 Member + 1 Grup)
            </span>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center p-2 rounded-lg bg-[#111726] border border-white/5">
                <span className="text-cyan-300 font-medium">Total PO:</span>
                <span className="font-bold text-white">
                  Rp {simPoTotal.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-[#111726] border border-white/5">
                <span className="text-amber-300 font-medium">Total OTS:</span>
                <span className="font-bold text-white">
                  Rp {simOtsTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Kotak 2: Selisih Harga */}
          <div className="bg-[#161f33] rounded-xl p-4 border border-white/10 space-y-2.5">
            <span className="text-xs font-bold text-zinc-200 block">Selisih Harga</span>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center p-2 rounded-lg bg-[#111726] border border-white/5">
                <span className="text-zinc-400">Per Member:</span>
                <span className={`font-semibold ${otsMarkupPerMember > 0 ? 'text-amber-300' : 'text-zinc-400'}`}>
                  {otsMarkupPerMember > 0 ? `+Rp ${otsMarkupPerMember.toLocaleString('id-ID')} di OTS` : 'Sama'}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-[#111726] border border-white/5">
                <span className="text-zinc-400">Grup:</span>
                <span className={`font-semibold ${otsMarkupGroup > 0 ? 'text-amber-300' : 'text-zinc-400'}`}>
                  {otsMarkupGroup > 0 ? `+Rp ${otsMarkupGroup.toLocaleString('id-ID')} di OTS` : 'Sama'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tombol Simpan Tunggal untuk Section Harga */}
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={configLoading}
          className="w-full bg-[#079108] text-white py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(7,145,8,0.3)] hover:bg-[#067a07] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
        >
          <FaSave className="text-sm" />
          {configLoading ? 'Menyimpan...' : 'Simpan Pengaturan Harga'}
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. METODE PEMBAYARAN & REKENING (Grid 4 Kolom)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#111726]/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/10 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-tight">
              Metode Pembayaran & <span className="text-emerald-400">Rekening Resmi</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={configLoading}
            className="self-start sm:self-auto bg-[#079108] text-white py-2.5 px-5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(7,145,8,0.3)] hover:bg-[#067a07] transition-all disabled:opacity-50 flex items-center gap-2 active:scale-95"
          >
            <FaSave className="text-xs" />
            <span>{configLoading ? 'Menyimpan...' : 'Simpan Rekening'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-zinc-300 font-medium mb-1.5">
              Nama Bank / E-Wallet
            </label>
            <input
              type="text"
              value={paymentBank}
              onChange={(e) => setPaymentBank(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#182032] border border-white/10 rounded-xl focus:border-emerald-400 focus:outline-none transition-colors text-white font-bold text-sm"
              placeholder="Contoh: BCA, Mandiri, Seabank"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-300 font-medium mb-1.5">
              Nomor Rekening / Akun
            </label>
            <input
              type="text"
              value={paymentRekening}
              onChange={(e) => setPaymentRekening(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#182032] border border-white/10 rounded-xl focus:border-emerald-400 focus:outline-none transition-colors text-white font-mono font-bold text-sm"
              placeholder="Contoh: 0902683273"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-300 font-medium mb-1.5">
              Nama Pemilik (A/N)
            </label>
            <input
              type="text"
              value={paymentAtasNama}
              onChange={(e) => setPaymentAtasNama(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#182032] border border-white/10 rounded-xl focus:border-emerald-400 focus:outline-none transition-colors text-white font-bold text-sm"
              placeholder="Contoh: Natasya Angelina Putri"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-300 font-medium mb-1.5">
              Metode Pembayaran
            </label>
            <input
              type="text"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#182032] border border-white/10 rounded-xl focus:border-emerald-400 focus:outline-none transition-colors text-white font-bold text-sm"
              placeholder="Contoh: Manual TF, QRIS"
            />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. MODE PEMELIHARAAN WEBSITE (Collapsible)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#111726]/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/10 transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">Mode Pemeliharaan Website (MT Barrier)</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase ${
              maintenanceMode 
                ? 'bg-[#079108]/20 text-[#079108] border border-[#079108]/30 shadow-[0_0_10px_rgba(7,145,8,0.2)]' 
                : 'bg-zinc-800 text-zinc-400 border border-white/10'
            }`}>
              {maintenanceMode ? 'Aktif' : 'Website Live'}
            </span>
          </div>

          {/* Instant Toggle Switch */}
          <div className="flex items-center gap-3 self-end sm:self-center">
            <span className={`text-xs font-bold uppercase tracking-wider ${maintenanceMode ? 'text-[#079108]' : 'text-zinc-400'}`}>
              {maintenanceMode ? 'MT Aktif' : 'MT Nonaktif'}
            </span>
            <button
              type="button"
              disabled={configLoading}
              onClick={handleToggleMaintenance}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none disabled:opacity-50 ${
                maintenanceMode ? 'bg-[#079108] shadow-[0_0_15px_rgba(7,145,8,0.5)]' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out ${
                  maintenanceMode ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Collapsible Detail Inputs (Hanya Render saat MT Aktif) */}
        <AnimatePresence>
          {maintenanceMode && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 20 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden border-t border-white/10 pt-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs text-zinc-300 font-medium mb-1.5">
                    Pesan Pengumuman untuk Pengunjung
                  </label>
                  <textarea
                    rows={3}
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    onBlur={handleBlurMaintenanceDetails}
                    placeholder="Contoh: Website sedang dalam pemeliharaan sementara..."
                    className="w-full px-4 py-2.5 bg-[#182032] border border-white/10 rounded-xl focus:border-[#079108] focus:outline-none transition-colors text-white text-xs resize-none placeholder:text-zinc-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-300 font-medium mb-1.5">
                    Estimasi Waktu Selesai (Opsional)
                  </label>
                  <input
                    type="datetime-local"
                    value={maintenanceEstimatedEnd}
                    onChange={(e) => setMaintenanceEstimatedEnd(e.target.value)}
                    onBlur={handleBlurMaintenanceDetails}
                    className="w-full px-4 py-2.5 bg-[#182032] border border-white/10 rounded-xl focus:border-[#079108] focus:outline-none transition-colors text-white text-xs [color-scheme:dark]"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. MANAJEMEN DATA & PEMBERSIHAN STORAGE (Border Luar Netral)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#111726]/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/10 space-y-5">
        <div className="pb-4 border-b border-white/10">
          <h3 className="text-base font-bold text-white uppercase tracking-tight">
            Manajemen Data & <span className="text-red-400">Pembersihan Storage</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Purge Bukti Pembayaran Lama (Aksi Rutin - Border Netral) */}
          <div className="bg-[#161f33] rounded-xl p-5 border border-white/10 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]"></span>
                <h4 className="text-sm font-bold text-white">Auto-Purge Bukti Bayar (&gt; 1 Bulan)</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Pembersihan file foto bukti transfer lama di Supabase Storage agar kuota storage tetap hemat.
              </p>
            </div>

            <button
              type="button"
              onClick={onPurgeOldPayments}
              className="w-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md"
            >
              <FaWrench className="text-xs" />
              <span>Bersihkan Bukti Bayar &gt; 1 Bulan</span>
            </button>
          </div>

          {/* Card 2: Hapus Data Pembelian (Destruktif - Border Merah) */}
          <div className="bg-[#161f33] rounded-xl p-5 border border-red-500/30 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></span>
                <h4 className="text-sm font-bold text-white">Hapus Data Pembelian</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Hapus transaksi order beserta file bukti bayar di Storage (full reset 0 atau filter per event).
              </p>
            </div>

            <button
              type="button"
              onClick={onShowBulkDeleteModal}
              className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 hover:text-red-300 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md"
            >
              <FaTrash className="text-xs" />
              <span>Buka Opsi Hapus Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsTab


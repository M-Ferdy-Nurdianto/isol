import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaChevronRight, FaPlus, FaMinus, FaCamera, FaSpinner, 
  FaUniversity, FaRegCopy, FaCheckCircle, FaTrash, 
  FaInstagram, FaDownload, FaWhatsapp, FaChevronDown 
} from 'react-icons/fa'
import { useState, useRef, useEffect } from 'react'
import DigitalReceipt from './DigitalReceipt'
import imageCompression from 'browser-image-compression'

// --- SHARED SUB-COMPONENTS ---

const InternalPaymentInfo = ({ payment, copyToClipboard, copied }) => (
  <div className="bg-emerald-50/50 dark:bg-[#151c2e] rounded-2xl p-4 sm:p-5 shadow-sm border border-emerald-100/80 dark:border-white/10 transition-colors">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/25 shrink-0">
          <FaUniversity className="text-emerald-600 dark:text-emerald-400 text-base" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight truncate">
              {payment?.bank || 'Bank Central Asia'}
            </h4>
            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {payment?.method || 'Manual TF'}
            </span>
          </div>
          <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 truncate">
            a.n. {payment?.atasNama || 'Natasya Angelina Putri'}
          </p>
        </div>
      </div>

      <div 
        onClick={() => copyToClipboard(payment?.rekening)}
        className="flex items-center justify-between sm:justify-end gap-3 bg-white dark:bg-white/5 border border-emerald-100 dark:border-white/10 rounded-xl px-3 py-2 cursor-pointer hover:border-emerald-300 dark:hover:border-white/20 transition-all group shadow-sm"
      >
        <span className="text-sm sm:text-base font-mono font-black text-gray-900 dark:text-white tracking-wider">
          {payment?.rekening || '0902683273'}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            copyToClipboard(payment?.rekening)
          }}
          aria-label="Salin nomor rekening"
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0 ${
            copied 
              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30' 
              : 'bg-emerald-50 text-[var(--primary)] border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 active:scale-95'
          }`}
        >
          {copied ? <FaCheckCircle className="text-xs" /> : <FaRegCopy className="text-xs" />}
        </button>
      </div>
    </div>
  </div>
)

const InternalCartSummary = ({
  items,
  type,
  total,
  onConfirm,
  isDisabled,
  onUpdateQty,
  onRemoveItem,
  onBackToShop,
}) => {
  const hasItems = items && items.length > 0

  return (
    <div className="flex flex-col h-full">
      {/* Header ringkas */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Ringkasan Pesanan
        </span>
        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          {items?.length || 0} items
        </span>
      </div>

      {/* List item dengan kontrol tambah / kurang / hapus */}
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar mb-4 space-y-3">
        {hasItems ? (
          <AnimatePresence initial={false}>
            {items.map((item) => {
              const itemId = item.cartId || item.id
              const itemName = (item.name || item.nama || '').replace(/cheki/gi, '').trim()
              const itemImg = item.image || item.gambar_url

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={itemId}
                  className="p-2.5 rounded-2xl bg-gray-50/70 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex flex-col gap-2 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/10 overflow-hidden flex-shrink-0 border border-gray-200 dark:border-white/10">
                      {itemImg ? (
                        <img
                          src={itemImg}
                          alt={itemName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                          KS
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate leading-tight">
                        {itemName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                          Rp {(item.price || item.harga || 0).toLocaleString()}
                        </span>
                        {item.size && (
                          <span className="text-[9px] bg-gray-200 dark:bg-white/10 px-1.5 py-0.2 rounded text-gray-600 dark:text-gray-300 font-bold uppercase">
                            {item.size}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Kontrol Qty (+ / -) & Hapus */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200/60 dark:border-white/5">
                    <div className="flex items-center bg-white dark:bg-white/10 rounded-lg p-0.5 border border-gray-200 dark:border-white/10 shadow-sm">
                      <button
                        type="button"
                        onClick={() => onUpdateQty && onUpdateQty(item, -1)}
                        className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 rounded text-gray-500 dark:text-gray-400 transition-colors"
                        title="Kurangi"
                      >
                        <FaMinus className="text-[8px]" />
                      </button>
                      <span className="w-7 text-center text-xs font-black text-gray-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty && onUpdateQty(item, 1)}
                        className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 rounded text-emerald-600 dark:text-emerald-400 transition-colors"
                        title="Tambah"
                      >
                        <FaPlus className="text-[8px]" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                        Subtotal: <span className="text-gray-900 dark:text-white font-black">Rp {((item.price || item.harga || 0) * item.quantity).toLocaleString()}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveItem && onRemoveItem(item)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        title="Hapus dari keranjang"
                      >
                        <FaTrash className="text-[11px]" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        ) : (
          <div className="py-8 px-4 text-center rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3">
              Keranjang kamu kosong
            </p>
            <button
              type="button"
              onClick={onBackToShop}
              className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              + Tambah Pesanan
            </button>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/10 mb-4">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          Total
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-xs font-bold text-gray-400">IDR</span>
          <span className="text-lg font-black text-gray-900 dark:text-white">
            {(total || 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Tombol Confirm â€” hidden di mobile, tampil di desktop */}
      <button
        type="button"
        onClick={onConfirm}
        disabled={isDisabled || !hasItems}
        className="hidden lg:flex w-full bg-[var(--primary)] hover:bg-[var(--primary)]/85 text-white py-3.5 rounded-2xl font-bold text-sm items-center justify-center transition-all disabled:opacity-50 active:scale-95 shadow-md shadow-emerald-500/20"
      >
        CONFIRM PESANAN
      </button>
    </div>
  )
}

// --- MAIN COMPONENT ---

const CheckoutProcess = ({
  step, setStep, cart, merchCart, totalHarga, totalMerchHarga, updateQuantity, removeFromCart,
  updateMerchQuantity, removeFromMerchCart, formData, setFormData, merchForm, setMerchForm,
  file, setFile, filePreview, setFilePreview, merchFile, setMerchFile, merchFilePreview, setMerchFilePreview,
  events = [], submitting, uploading, merchSubmitting, merchUploading, handleSubmit, handleMerchSubmit,
  receiptData, merchReceiptData, payment, copied, setCopied, fileInputRef, merchFileInputRef
}) => {
  const [eventDropdownOpen, setEventDropdownOpen] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const eventDropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (eventDropdownRef.current && !eventDropdownRef.current.contains(e.target)) {
        setEventDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedEventObj = events.find(ev => ev.id === formData.event_id)
  const copyToClipboard = (text) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const onFileSelect = async (e, type) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    
    // Immediate preview
    const previewUrl = URL.createObjectURL(selectedFile)
    if (type === 'cheki') setFilePreview(previewUrl)
    else setMerchFilePreview(previewUrl)

    try {
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1280, useWebWorker: true, fileType: 'image/webp' }
      const compressedFile = await imageCompression(selectedFile, options)
      const webpFile = new File([compressedFile], selectedFile.name.replace(/\.[^/.]+$/, "") + ".webp", { type: 'image/webp' })
      if (type === 'cheki') setFile(webpFile)
      else setMerchFile(webpFile)
    } catch (error) {
      console.error("Compression error:", error)
      if (type === 'cheki') setFile(selectedFile)
      else setMerchFile(selectedFile)
    }
  }

  if (step === 3 || step === 5) {
    const data = step === 3 ? receiptData : merchReceiptData;
    
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto text-center space-y-4 pt-2 pb-0 px-4">
        <div className="relative inline-block">
          <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white text-2xl shadow-2xl shadow-emerald-500/40 relative z-10 animate-bounce"><FaCheckCircle /></div>
          <div className="absolute inset-0 bg-emerald-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
        </div>
        
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-white">Terima Kasih!</h2>
          <p className="text-xs text-gray-500 font-bold leading-relaxed">Pesanan kamu sudah diterima oleh <span className="text-emerald-600">Kohi Sekai</span>.</p>
        </div>

        <div className="space-y-3">
          <DigitalReceipt data={data} payment={payment} isPreview />
          
          <div className="max-w-md mx-auto space-y-3">
            {/* WhatsApp Channel Info Button */}
            <div className="space-y-1.5">
              <a 
                href="https://whatsapp.com/channel/0029VbDVjJzDJ6GwgUQ9cP32"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white py-3.5 px-6 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all group border border-emerald-400/30"
              >
                <FaWhatsapp className="text-xl text-emerald-200 group-hover:scale-110 transition-transform" />
                <span>Gabung Channel WhatsApp</span>
              </a>
              <p className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-relaxed">
                Info lebih lanjut akan kami share di IG maupun CH WA
              </p>
            </div>

            {/* IG Story Button */}
            <div className="space-y-1.5">
              <a 
                href="https://instagram.com/kohisekai"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-500 hover:to-orange-400 text-white py-3.5 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <FaInstagram className="text-lg" /> Post Nota ke IG Story
              </a>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                Tag <span className="text-emerald-600">@kohisekai</span> dan Oshimu bagikan momen seru kamu!
              </p>
            </div>
          </div>
        </div>

        <button type="button" onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-emerald-600 font-black uppercase tracking-widest text-[10px] hover:tracking-[0.2em] transition-all flex items-center gap-2 mx-auto group pt-1 pb-2">
          Lanjut ke Shop <FaChevronRight className="text-[8px] group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>
    )
  }

  const currentTotal = step === 2 ? totalHarga : totalMerchHarga
  const isSubmitDisabled =
    (step === 2 ? submitting : merchSubmitting) ||
    (step === 2 ? cart.length === 0 : merchCart.length === 0)

  const activeFilePreview = step === 2 ? filePreview : merchFilePreview

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto px-4 pb-4 lg:pb-10"
    >
      {/* Grid utama: flex row di desktop, column di mobile */}
      <div className="flex flex-col lg:flex-row gap-6 lg:items-stretch">

        {/* ===== KOLOM KIRI: FORM CHECKOUT ===== */}
        <div className="w-full lg:flex-1 bg-white dark:bg-[#111726] rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 dark:border-white/10 transition-colors flex flex-col">
          <div className="space-y-6 flex flex-col flex-1">

            {/* Nav bar atas */}
            <div className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-white/5 p-2 rounded-2xl border border-gray-100 dark:border-white/10">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2.5 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors group px-2 py-1"
              >
                <div className="w-7 h-7 rounded-full bg-white dark:bg-white/10 flex items-center justify-center group-hover:scale-105 shadow-sm border border-gray-200 dark:border-white/10">
                  <FaChevronRight className="rotate-180 text-[10px]" />
                </div>
                <span className="text-xs font-semibold">
                  Ganti Member / Tambah Pesanan
                </span>
              </button>
              <div className="flex items-center gap-2 pl-3 border-l border-gray-200 dark:border-white/10">
                <span className="bg-[var(--primary)] text-white px-3 py-1 rounded-full text-[10px] font-bold">
                  {step === 2 ? 'Tickets' : 'Merchandise'}
                </span>
              </div>
            </div>

            {/* Judul */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none mb-2">
                Checkout Data
              </h2>
              <div className="h-1 w-16 bg-emerald-500 rounded-full" />
            </div>

            {/* Info rekening â€” vertikal di mobile, compact di desktop */}
            <div className="bg-emerald-50/50 dark:bg-[#151c2e] border border-emerald-100/80 dark:border-white/10 rounded-2xl p-4 transition-all">
              {/* Baris 1: Icon + Nama Bank + Badge Metode */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 shrink-0 rounded-lg bg-emerald-500/15 dark:bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <FaUniversity className="text-emerald-600 dark:text-emerald-400 text-sm" />
                </div>
                <span className="text-sm font-black text-gray-900 dark:text-white">
                  {payment?.bank || 'BCA'}
                </span>
                <span className="ml-auto text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20 shrink-0">
                  {payment?.method || 'Manual TF'}
                </span>
              </div>

              {/* Baris 2: Atas Nama â€” full width, tidak truncate */}
              <div className="mt-3">
                <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">
                  Atas nama
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white break-words leading-snug">
                  {payment?.atasNama || 'Natasya Angelina Putri'}
                </p>
              </div>

              {/* Baris 3: Nomor Rekening + Tombol Copy â€” baris sendiri */}
              <div className="mt-3 flex items-center justify-between gap-3 bg-white/70 dark:bg-[var(--surface)] border border-emerald-100 dark:border-white/10 rounded-xl px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">
                    Nomor rekening
                  </p>
                  <p className="font-mono font-black text-gray-900 dark:text-white text-base tracking-wider">
                    {payment?.rekening || '0902683273'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(payment?.rekening)}
                  aria-label="Salin nomor rekening"
                  className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all active:scale-95 ${
                    copied
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                      : 'bg-emerald-50 text-[var(--primary)] border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
                  }`}
                >
                  {copied ? (
                    <FaCheckCircle className="text-sm" />
                  ) : (
                    <FaRegCopy className="text-sm" />
                  )}
                </button>
              </div>
            </div>

            {/* Form */}
            <form
              id="checkout-form"
              onSubmit={step === 2 ? handleSubmit : handleMerchSubmit}
              className="space-y-5 flex flex-col flex-1"
            >
              {/* Event dropdown */}
              {step === 2 && events.length > 0 && (
                <div className="space-y-2 relative z-30" ref={eventDropdownRef}>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 ml-1">
                    Jadwal event *
                  </label>
                  <div
                    onClick={() => setEventDropdownOpen(!eventDropdownOpen)}
                    className={`w-full bg-gray-50/70 dark:bg-white/5 border transition-all cursor-pointer rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-sm ${
                      eventDropdownOpen
                        ? 'border-emerald-500 bg-white dark:bg-[#162035] ring-4 ring-emerald-500/10'
                        : 'border-gray-200 dark:border-white/10 hover:border-emerald-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          formData.event_id ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'
                        }`}
                      />
                      <span
                        className={`font-semibold text-sm truncate ${
                          formData.event_id
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-400'
                        }`}
                      >
                        {selectedEventObj ? selectedEventObj.nama : '-- Pilih Jadwal Event --'}
                      </span>
                    </div>
                    <FaChevronDown
                      className={`text-gray-400 text-sm shrink-0 transition-transform duration-300 ${
                        eventDropdownOpen ? 'rotate-180 text-emerald-500' : ''
                      }`}
                    />
                  </div>
                  <AnimatePresence>
                    {eventDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#162035] rounded-2xl shadow-2xl z-[100] overflow-hidden border border-emerald-100/50 dark:border-white/10"
                      >
                        <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                          {events.map((ev) => {
                            const isSelected = formData.event_id === ev.id
                            return (
                              <div
                                key={ev.id}
                                onClick={() => {
                                  setFormData({ ...formData, event_id: ev.id })
                                  setEventDropdownOpen(false)
                                }}
                                className={`px-6 py-3.5 cursor-pointer flex items-center justify-between transition-all ${
                                  isSelected
                                    ? 'bg-emerald-50 dark:bg-emerald-500/20'
                                    : 'hover:bg-gray-50 dark:hover:bg-white/5'
                                }`}
                              >
                                <div className="flex flex-col">
                                  <span
                                    className={`font-bold text-sm ${
                                      isSelected
                                        ? 'text-[var(--primary)] dark:text-emerald-400'
                                        : 'text-gray-900 dark:text-white'
                                    }`}
                                  >
                                    {ev.nama}
                                  </span>
                                  <span className="text-[11px] text-gray-400 mt-0.5">
                                    {ev.tanggal} {ev.bulan} {ev.tahun}
                                  </span>
                                </div>
                                {isSelected && (
                                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ml-2" />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Nama & kontak */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 ml-1">
                    Nama panggilan *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Contoh: Kiki"
                    value={step === 2 ? formData.nama_panggilan : merchForm.nama_lengkap}
                    onChange={(e) =>
                      step === 2
                        ? setFormData({ ...formData, nama_panggilan: e.target.value })
                        : setMerchForm({ ...merchForm, nama_lengkap: e.target.value })
                    }
                    className="w-full text-sm bg-gray-50/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#162035] focus:ring-4 focus:ring-emerald-500/10 rounded-2xl px-5 py-3.5 font-medium outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-white shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 ml-1">
                    {step === 2 ? 'WhatsApp / IG *' : 'Nomor WhatsApp *'}
                  </label>
                  <input
                    required
                    type="text"
                    placeholder={step === 2 ? '08xxx / @username' : '08xxxxxxxxx'}
                    value={step === 2 ? formData.kontak : merchForm.whatsapp}
                    onChange={(e) =>
                      step === 2
                        ? setFormData({ ...formData, kontak: e.target.value })
                        : setMerchForm({ ...merchForm, whatsapp: e.target.value })
                    }
                    className="w-full text-sm bg-gray-50/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#162035] focus:ring-4 focus:ring-emerald-500/10 rounded-2xl px-5 py-3.5 font-medium outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-white shadow-sm"
                  />
                </div>
              </div>

              {/* Instagram â€” khusus merch */}
              {step === 4 && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 ml-1">
                    Instagram (opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="@username"
                    value={merchForm.instagram}
                    onChange={(e) =>
                      setMerchForm({ ...merchForm, instagram: e.target.value })
                    }
                    className="w-full text-sm bg-gray-50/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#162035] focus:ring-4 focus:ring-emerald-500/10 rounded-2xl px-5 py-3.5 font-medium outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-white shadow-sm"
                  />
                </div>
              )}

              {/* Upload bukti transfer â€” SELALU tinggi fixed, preview via modal */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Bukti transfer (screenshot) *
                  </label>
                  {activeFilePreview && (
                    <button
                      type="button"
                      onClick={() => setShowPhotoModal(true)}
                      className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 transition-all"
                    >
                      <FaCheckCircle className="text-[10px]" /> Terpilih â€” Lihat foto
                    </button>
                  )}
                </div>

                {/* Area upload â€” tinggi FIXED, tidak berubah walau ada preview */}
                <div
                  onClick={() =>
                    step === 2
                      ? fileInputRef.current?.click()
                      : merchFileInputRef.current?.click()
                  }
                  className={`relative rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden group h-28 flex items-center justify-center ${
                    activeFilePreview
                      ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-500/5'
                      : 'border-gray-200 dark:border-white/15 border-dashed hover:border-emerald-500 bg-gray-50 dark:bg-[var(--input-bg)]'
                  }`}
                >
                  {activeFilePreview ? (
                    /* State: sudah ada foto â€” tampilkan thumbnail kecil + info */
                    <div className="flex items-center gap-4 px-5 w-full">
                      {/* Thumbnail kecil */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowPhotoModal(true)
                        }}
                        className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 border-emerald-500/40 shadow-md"
                      >
                        <img
                          src={activeFilePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          Foto sudah dipilih
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                          Ketuk foto untuk lihat preview Â· Ketuk area ini untuk ganti
                        </p>
                      </div>
                      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/30">
                        <FaCheckCircle className="text-emerald-500 text-sm" />
                      </div>
                    </div>
                  ) : (
                    /* State: belum ada foto */
                    <div className="flex flex-row items-center gap-4 px-5 w-full">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/10 shadow-sm border border-gray-200 dark:border-white/10 flex items-center justify-center group-hover:scale-105 group-hover:border-emerald-200 transition-all flex-shrink-0">
                        <FaCamera className="text-gray-400 group-hover:text-emerald-500 transition-colors text-lg" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          Upload bukti transfer
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                          Ketuk untuk memilih foto / screenshot
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={step === 2 ? fileInputRef : merchFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => onFileSelect(e, step === 2 ? 'cheki' : 'merch')}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Catatan */}
              <div className="space-y-2 flex-1 flex flex-col">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 ml-1">
                  Catatan pesanan (opsional)
                </label>
                <textarea
                  placeholder="Bisa ditulis bila tidak datang / pesan khusus"
                  value={step === 2 ? formData.catatan : merchForm.catatan}
                  onChange={(e) =>
                    step === 2
                      ? setFormData({ ...formData, catatan: e.target.value })
                      : setMerchForm({ ...merchForm, catatan: e.target.value })
                  }
                  className="w-full flex-1 text-sm bg-gray-50/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#162035] focus:ring-4 focus:ring-emerald-500/10 rounded-2xl px-5 py-3.5 font-medium outline-none min-h-[90px] resize-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-white shadow-sm"
                />
              </div>
            </form>
          </div>
        </div>

        {/* ===== KOLOM KANAN: SIDEBAR STICKY ===== */}
        <div className="w-full lg:w-[320px] lg:sticky lg:top-24 lg:self-start flex-shrink-0">
          <div className="bg-white dark:bg-[#111726] rounded-3xl p-5 shadow-xl border border-gray-100 dark:border-white/10 transition-colors">
            <InternalCartSummary
              items={step === 2 ? cart : merchCart}
              type={step === 2 ? 'cheki' : 'merch'}
              total={currentTotal}
              onConfirm={() =>
                document.getElementById('checkout-form').requestSubmit()
              }
              isDisabled={isSubmitDisabled}
              onUpdateQty={(item, delta) => {
                if (step === 2) {
                  updateQuantity(item.id, delta)
                } else {
                  updateMerchQuantity(item.cartId, delta)
                }
              }}
              onRemoveItem={(item) => {
                if (step === 2) {
                  removeFromCart(item.id)
                } else {
                  removeFromMerchCart(item.cartId)
                }
              }}
              onBackToShop={() => {
                setStep(1)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          </div>
        </div>
      </div>

      {/* ===== MODAL PREVIEW FOTO BUKTI TRANSFER ===== */}
      <AnimatePresence>
        {showPhotoModal && activeFilePreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPhotoModal(false)}
            className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white dark:bg-[#111726] rounded-3xl overflow-hidden shadow-2xl max-w-lg w-full"
            >
              {/* Header modal */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-emerald-500 text-sm" />
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    Preview Bukti Transfer
                  </span>
                </div>
                <button
                  onClick={() => setShowPhotoModal(false)}
                  className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
                >
                  âœ•
                </button>
              </div>

              {/* Foto */}
              <div className="p-4">
                <img
                  src={activeFilePreview}
                  alt="Bukti Transfer"
                  className="w-full rounded-2xl object-contain max-h-[60vh]"
                />
              </div>

              {/* Footer modal */}
              <div className="px-5 pb-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPhotoModal(false)
                    setTimeout(() => {
                      step === 2
                        ? fileInputRef.current?.click()
                        : merchFileInputRef.current?.click()
                    }, 200)
                  }}
                  className="flex-1 py-3 rounded-2xl border border-gray-200 dark:border-white/10 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                >
                  Ganti Foto
                </button>
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(false)}
                  className="flex-1 py-3 rounded-2xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-all"
                >
                  Sudah Benar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STICKY BOTTOM BAR MOBILE */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-[#111726]/95 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.15)]">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-none">
              Total pesanan
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[11px] font-bold text-gray-400">IDR</span>
              <span className="text-lg font-black text-gray-900 dark:text-white truncate">
                {(currentTotal || 0).toLocaleString()}
              </span>
            </div>
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={isSubmitDisabled}
            className="flex-1 bg-[var(--primary)] hover:bg-[var(--primary)]/85 text-white py-3.5 px-6 rounded-2xl font-bold text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-all disabled:opacity-50 active:scale-95"
          >
            CONFIRM
          </button>
        </div>
      </div>

       <LoadingOverlay isVisible={(step === 2 ? submitting : merchSubmitting)} message={(step === 2 ? uploading : merchUploading) ? 'Optimizing Receipt...' : 'Processing Order...'} />
    </motion.div>
  )
}

const LoadingOverlay = ({ isVisible, message }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="fixed inset-0 z-[9999] bg-white/90 dark:bg-[var(--background)]/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
      >
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-emerald-100 dark:border-emerald-950 border-t-emerald-500 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center justify-center">
               <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="mt-10 space-y-3">
          <h3 className="text-2xl font-black uppercase tracking-tighter text-gray-900 dark:text-white">{message}</h3>
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></span>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></span>
          </div>
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] mt-4">Mohon tunggu sebentar ya!</p>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
)

export default CheckoutProcess



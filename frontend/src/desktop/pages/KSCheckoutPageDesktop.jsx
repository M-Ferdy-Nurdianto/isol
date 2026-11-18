import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaClock,
  FaUsers,
  FaCheckCircle,
  FaCheck,
  FaCopy,
  FaInstagram,
  FaUser,
  FaExternalLinkAlt,
  FaCreditCard,
  FaQrcode,
  FaPlus,
  FaTrash,
  FaShoppingCart,
  FaUserCheck,
  FaEdit,
  FaInfoCircle
} from 'react-icons/fa'
import KSHeader from '../../components/KSHeader'
import FanAuthModal from '../../components/auth/FanAuthModal'
import { useCheckout } from '../../shared/context/CheckoutContext'
import { getAssetPath } from '../../lib/pathUtils'
import ImageUploadDropzone from '../../components/ui/ImageUploadDropzone'

const KSCheckoutPageDesktop = () => {
  const {
    event,
    filteredMembers,
    selectedMember,
    ticketType,
    handleSelectMember,
    handleSelectGroup,
    isRegularEnabled,
    wideChekiEnabled,
    chekiGrupEnabled,
    customOptions,
    regularPrice,
    widePrice,
    groupChekiPrice,
    unitPrice,
    totalPrice,
    chekiVariant,
    setChekiVariant,
    sesiMode,
    setSesiMode,
    quantity,
    setQuantity,
    cartItems,
    handleAddToCart,
    handleRemoveCartItem,
    grandTotal,
    catatan,
    setCatatan,
    form,
    file,
    setFile,
    filePreview,
    setFilePreview,
    uploading,
    submitting,
    orderSuccess,
    copiedRekening,
    handleCopyRekening,
    paymentMethodSelected,
    setPaymentMethodSelected,
    enableTf,
    enableQris,
    qrisImageUrl,
    qrisMerchantName,
    bankName,
    rekeningNumber,
    rekeningName,
    handleSubmitOrder,
    loading
  } = useCheckout()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs font-black tracking-widest text-text-secondary uppercase">
            Memuat Checkout Tiket...
          </p>
        </div>
      </div>
    )
  }

  // Active member preview photo for dashed live preview
  const activeSelectedPhoto = ticketType === 'group'
    ? '/images/members/group.webp'
    : (selectedMember?.shop_image_url || selectedMember?.image_url || '/images/members/placeholder.svg')

  const activeSelectedName = ticketType === 'group'
    ? 'Cheki Grup (Semua Member)'
    : `${chekiVariant === 'wide' ? 'Wide Cheki' : 'Regular Cheki'} ${selectedMember?.nama_panggung || 'Member'}`

  return (
    <div className="min-h-screen bg-background bg-pattern-dots text-text-primary selection:bg-primary/30">
      <KSHeader />

      <main className="pt-24 sm:pt-28 pb-20">
        <div className="container mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 space-y-6">

          {/* === NAVIGATION BREADCRUMB & HEADER === */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-primary transition-colors group"
            >
              <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
              <span>Kembali ke Kalender Shop</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black tracking-widest uppercase text-text-secondary">
                Kohi Stage · Ticket Checkout
              </span>
            </div>
          </div>

          {/* === SUCCESS VIEW === */}
          {orderSuccess ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto bg-surface border border-border rounded-3xl p-6 sm:p-12 text-center space-y-8 shadow-sm"
            >
              <div className="w-20 h-20 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto border border-success/30">
                <FaCheckCircle size={40} />
              </div>

              <div>
                <span className="text-xs font-mono font-bold text-primary tracking-widest block uppercase mb-1">
                  ORDER RECAP #{orderSuccess.order_number}
                </span>
                <h1 className="text-3xl sm:text-4xl font-black uppercase text-text-primary tracking-tight">
                  PESANAN TIKET BERHASIL!
                </h1>
                <p className="text-xs sm:text-sm text-text-secondary mt-2 max-w-md mx-auto leading-relaxed font-medium">
                  Bukti pembayaran atas nama <strong className="text-text-primary font-bold">{form.nama_lengkap}</strong> telah diterima dan sedang diproses oleh staf Kohi Sekai.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-background border border-border text-left space-y-3 text-xs">
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-text-secondary font-medium">Jadwal Event:</span>
                  <span className="font-bold text-text-primary">{event?.nama}</span>
                </div>
                <div className="flex justify-between items-start pb-3 border-b border-border">
                  <span className="text-text-secondary font-medium">Rincian Tiket:</span>
                  <div className="text-right space-y-1">
                    {orderSuccess.submittedItems && orderSuccess.submittedItems.length > 0 ? (
                      orderSuccess.submittedItems.map((it, idx) => (
                        <div key={idx} className="font-bold text-text-primary">
                          {it.quantity}x {it.memberName} ({it.chekiVariant === 'wide' ? 'Wide' : 'Regular'} · {it.sesiMode})
                        </div>
                      ))
                    ) : (
                      <span className="font-bold text-text-primary">
                        {quantity}x {ticketType === 'group' ? 'Group Cheki' : `2-Shot with ${selectedMember?.nama_panggung || 'Member'}`}
                      </span>
                    )}
                  </div>
                </div>
                {catatan && (
                  <div className="flex justify-between items-start pb-3 border-b border-border">
                    <span className="text-text-secondary font-medium">Catatan / Request:</span>
                    <span className="font-bold text-text-primary text-right max-w-xs">{catatan}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1 text-sm">
                  <span className="font-black text-text-primary uppercase">Total Pembayaran:</span>
                  <span className="font-black text-primary text-base font-mono">
                    Rp {orderSuccess.finalTotal.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  to="/profile"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-primary text-white font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-sm"
                >
                  <FaUser size={13} />
                  <span>Lihat di Profil</span>
                </Link>

                <a
                  href="https://instagram.com/kohisekai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-surface border border-border text-text-primary font-bold text-xs uppercase tracking-wider hover:border-primary transition-all shadow-sm"
                >
                  <FaInstagram size={15} />
                  <span>Instagram Official</span>
                  <FaExternalLinkAlt size={10} className="opacity-60" />
                </a>

                <Link
                  to="/shop"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-background border border-border text-text-secondary hover:text-text-primary font-bold text-xs uppercase tracking-wider hover:border-border/80 transition-all"
                >
                  <span>Cek Event Lain</span>
                </Link>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmitOrder} className="space-y-6">

              {/* === RINGKAS ATAS: JUDUL + STRIP EVENT + STRIP PEMBELI === */}
              <div className="space-y-3">
                <h1 className="text-2xl sm:text-3xl font-black uppercase text-text-primary tracking-tight">
                  Konfirmasi Pemesanan
                </h1>

                {/* Strip Event (1 baris tipis ringkas) */}
                {event && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-secondary py-2.5 px-3.5 rounded-xl bg-surface border border-border">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20 shrink-0">
                      Jadwal Panggung
                    </span>
                    <strong className="font-black text-text-primary uppercase tracking-wide">
                      {event.nama}
                    </strong>
                    <span className="hidden sm:inline text-border">·</span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <FaCalendarAlt className="text-primary text-[11px]" />
                      <span>{event.tanggal} {event.bulan} {event.tahun}</span>
                    </span>
                    <span className="hidden sm:inline text-border">·</span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <FaMapMarkerAlt className="text-primary text-[11px]" />
                      <span>{event.lokasi}</span>
                    </span>
                    <span className="hidden sm:inline text-border">·</span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <FaClock className="text-primary text-[11px]" />
                      <span>{event.cheki_time || event.event_time || 'Sesi Cheki'}</span>
                    </span>
                  </div>
                )}

                {/* Strip Pembeli (1 baris tipis ringkas dengan tombol Ubah Profil) */}
                <div className="flex flex-wrap items-center justify-between gap-3 py-2 px-3.5 rounded-xl bg-surface border border-border text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <FaUserCheck className="text-success text-xs shrink-0" />
                    <span className="text-text-secondary">Memesan sebagai:</span>
                    <strong className="text-text-primary font-bold">{form.nama_lengkap || 'Penggemar'}</strong>
                    <span className="text-border">·</span>
                    <span className="text-text-secondary font-mono">{form.whatsapp || 'WA belum diisi'}</span>
                    {form.instagram && (
                      <>
                        <span className="text-border">·</span>
                        <span className="text-text-secondary">{form.instagram}</span>
                      </>
                    )}
                  </div>
                  <Link
                    to="/profile"
                    className="px-3 py-1 rounded-lg bg-background border border-border text-[11px] font-bold text-primary hover:border-primary transition-colors inline-flex items-center gap-1.5 shrink-0"
                  >
                    <FaEdit size={11} />
                    <span>Ubah Profil</span>
                  </Link>
                </div>
              </div>

              {/* === GRID 2 KOLOM (KIRI ~58%, KANAN ~42% STICKY) === */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* === KOLOM KIRI (lg:col-span-7): PILIH MEMBER & SESI === */}
                <div className="lg:col-span-7 bg-surface border border-border rounded-3xl p-6 space-y-6">
                  
                  {/* Header Panel Kiri */}
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary text-xs font-black flex items-center justify-center">
                        1
                      </span>
                      <h2 className="text-base sm:text-lg font-black uppercase text-text-primary tracking-tight">
                        Pilih Member & Sesi
                      </h2>
                    </div>
                    <span className="text-[11px] font-bold text-text-secondary bg-background border border-border px-3 py-1 rounded-full">
                      {filteredMembers.length} Member Lineup
                    </span>
                  </div>

                  {/* Member Grid Auto-fit (repeat(auto-fit, minmax(140px, 1fr))) */}
                  <div className="space-y-3">
                    <label className="block text-xs font-black uppercase tracking-wider text-text-secondary">
                      Lineup Member
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {/* Cheki Grup (Semua Member) jika aktif */}
                      {chekiGrupEnabled && (
                        <button
                          type="button"
                          onClick={handleSelectGroup}
                          className="group text-left flex flex-col cursor-pointer focus:outline-none"
                        >
                          <div
                            className={`relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-background border transition-all duration-200 flex flex-col items-center justify-center p-3 ${
                              ticketType === 'group'
                                ? 'border-primary ring-2 ring-primary/40 shadow-md'
                                : 'border-border opacity-80 hover:opacity-100 hover:border-text-secondary/50'
                            }`}
                          >
                            {ticketType === 'group' && (
                              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow-md z-10">
                                <FaCheck size={9} />
                              </div>
                            )}
                            <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-2">
                              <FaUsers size={22} />
                            </div>
                            <span className="text-[11px] font-black uppercase text-text-primary text-center tracking-wide block">
                              Cheki Grup
                            </span>
                            <span className="text-[9px] text-text-secondary text-center mt-0.5 font-medium">
                              Semua Member
                            </span>
                          </div>
                        </button>
                      )}

                      {/* Individual Members */}
                      {filteredMembers.map((m) => {
                        const isSelected = ticketType === 'member' && (selectedMember?.id === m.id || selectedMember?.member_id === m.member_id)
                        const photoSrc = m.shop_image_url || m.image_url || '/images/members/placeholder.svg'

                        return (
                          <button
                            key={m.id || m.member_id}
                            type="button"
                            onClick={() => handleSelectMember(m)}
                            className="group text-left flex flex-col cursor-pointer focus:outline-none"
                          >
                            <div
                              className={`relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-background border transition-all duration-200 ${
                                isSelected
                                  ? 'border-primary ring-2 ring-primary/40 shadow-md'
                                  : 'border-border opacity-80 hover:opacity-100 hover:border-text-secondary/50'
                              }`}
                            >
                              {isSelected && (
                                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow-md z-10">
                                  <FaCheck size={9} />
                                </div>
                              )}

                              <img
                                src={getAssetPath(photoSrc)}
                                alt={m.nama_panggung}
                                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  e.target.onerror = null
                                  e.target.src = getAssetPath('/images/members/placeholder.svg')
                                }}
                              />
                              <div className="absolute inset-x-0 bottom-0 py-2 px-2.5 bg-black/85 text-left border-t border-white/10">
                                <span className="text-[11px] font-black uppercase text-white tracking-wide block truncate">
                                  {m.nama_panggung}
                                </span>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    {/* Ringkasan Member Terpilih (Satu baris ringkas, tanpa kartu duplikat) */}
                    {selectedMember && ticketType === 'member' && (
                      <div className="pt-1 flex items-center justify-between text-xs text-text-secondary">
                        <span className="truncate">
                          Dipilih: <strong className="text-text-primary uppercase">{selectedMember.nama_panggung}</strong>
                          {selectedMember.tagline ? ` (${selectedMember.tagline})` : ''}
                        </span>
                        <span className="font-mono text-primary font-bold shrink-0 ml-2">
                          Rp {unitPrice.toLocaleString('id-ID')} / sesi
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Opsi Sesi: Grid 2 Kolom (Tipe Polaroid | Opsi Kehadiran) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/60">
                    
                    {/* Tipe & Opsi Sesi Polaroid */}
                    <div className="space-y-2">
                      <label className="block text-xs font-black uppercase tracking-wider text-text-secondary mb-1">
                        Tipe Polaroid
                      </label>

                      {ticketType === 'group' ? (
                        <div className="p-3.5 rounded-2xl border bg-primary/10 border-primary text-text-primary font-bold flex items-center justify-between min-h-[52px]">
                          <div>
                            <span className="text-xs font-black uppercase block">Cheki Grup</span>
                            <span className="text-[10px] text-text-secondary block font-normal">1 frame semua member</span>
                          </div>
                          <span className="text-xs font-bold text-text-primary font-mono">
                            Rp {groupChekiPrice.toLocaleString('id-ID')}
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {isRegularEnabled && (
                            <label
                              onClick={() => setChekiVariant('regular')}
                              className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex items-center justify-between min-h-[52px] ${
                                chekiVariant === 'regular'
                                  ? 'bg-primary/10 border-primary text-text-primary font-bold'
                                  : 'bg-background border-border text-text-secondary hover:border-text-secondary/40'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="radio"
                                  name="chekiVariant"
                                  value="regular"
                                  checked={chekiVariant === 'regular'}
                                  onChange={() => setChekiVariant('regular')}
                                  className="accent-primary w-3.5 h-3.5 cursor-pointer"
                                />
                                <div>
                                  <span className="text-xs font-black uppercase text-text-primary block">Regular Cheki</span>
                                  <span className="text-[10px] text-text-secondary block font-normal">Standar 2-Shot</span>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-text-primary font-mono">
                                Rp {regularPrice.toLocaleString('id-ID')}
                              </span>
                            </label>
                          )}

                          {wideChekiEnabled && (
                            <label
                              onClick={() => setChekiVariant('wide')}
                              className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex items-center justify-between min-h-[52px] ${
                                chekiVariant === 'wide'
                                  ? 'bg-primary/10 border-primary text-text-primary font-bold'
                                  : 'bg-background border-border text-text-secondary hover:border-text-secondary/40'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="radio"
                                  name="chekiVariant"
                                  value="wide"
                                  checked={chekiVariant === 'wide'}
                                  onChange={() => setChekiVariant('wide')}
                                  className="accent-primary w-3.5 h-3.5 cursor-pointer"
                                />
                                <div>
                                  <span className="text-xs font-black uppercase text-text-primary block">Wide Cheki (16:9)</span>
                                  <span className="text-[10px] text-text-secondary block font-normal">Format Lebar VIP</span>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-text-primary font-mono">
                                Rp {widePrice.toLocaleString('id-ID')}
                              </span>
                            </label>
                          )}

                          {customOptions.map((opt) => (
                            <label
                              key={opt.id}
                              onClick={() => setChekiVariant(opt.label)}
                              className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex items-center justify-between min-h-[52px] ${
                                chekiVariant === opt.label
                                  ? 'bg-primary/10 border-primary text-text-primary font-bold'
                                  : 'bg-background border-border text-text-secondary hover:border-text-secondary/40'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="radio"
                                  name="chekiVariant"
                                  value={opt.label}
                                  checked={chekiVariant === opt.label}
                                  onChange={() => setChekiVariant(opt.label)}
                                  className="accent-primary w-3.5 h-3.5 cursor-pointer"
                                />
                                <div>
                                  <span className="text-xs font-black uppercase text-text-primary block">{opt.label}</span>
                                  <span className="text-[10px] text-text-secondary block font-normal">{opt.description || 'Kustom'}</span>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-text-primary font-mono">
                                Rp {Number(opt.price || 0).toLocaleString('id-ID')}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Opsi Kehadiran */}
                    <div className="space-y-2">
                      <label className="block text-xs font-black uppercase tracking-wider text-text-secondary mb-1">
                        Opsi Kehadiran
                      </label>

                      <div className="space-y-2">
                        <label
                          onClick={() => setSesiMode('2SHT')}
                          className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex items-center justify-between min-h-[52px] ${
                            sesiMode === '2SHT'
                              ? 'bg-primary/10 border-primary text-text-primary font-bold'
                              : 'bg-background border-border text-text-secondary hover:border-text-secondary/40'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="sesiMode"
                              value="2SHT"
                              checked={sesiMode === '2SHT'}
                              onChange={() => setSesiMode('2SHT')}
                              className="accent-primary w-3.5 h-3.5 cursor-pointer"
                            />
                            <div>
                              <span className="text-xs font-black uppercase text-text-primary block">2-Shot (Hadir Event)</span>
                              <span className="text-[10px] text-text-secondary block font-normal">Foto bareng di lokasi event</span>
                            </div>
                          </div>
                        </label>

                        <label
                          onClick={() => setSesiMode('1SHT')}
                          className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex items-center justify-between min-h-[52px] ${
                            sesiMode === '1SHT'
                              ? 'bg-primary/10 border-primary text-text-primary font-bold'
                              : 'bg-background border-border text-text-secondary hover:border-text-secondary/40'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="sesiMode"
                              value="1SHT"
                              checked={sesiMode === '1SHT'}
                              onChange={() => setSesiMode('1SHT')}
                              className="accent-primary w-3.5 h-3.5 cursor-pointer"
                            />
                            <div>
                              <span className="text-xs font-black uppercase text-text-primary block">1-Shot (Tidak Datang)</span>
                              <span className="text-[10px] text-text-secondary block font-normal">Foto solo member (nitip pose)</span>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>

                  </div>

                  {/* Baris Aksi: Stepper Jumlah Tiket di Kiri, Tombol Tambah di Kanan */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                    <div className="flex items-center justify-between sm:justify-start gap-3 p-2.5 rounded-2xl bg-background border border-border shrink-0">
                      <span className="text-xs font-bold text-text-secondary px-1 uppercase tracking-wider text-[11px]">
                        Jumlah:
                      </span>
                      <div className="flex items-center rounded-xl bg-surface border border-border p-0.5">
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-background transition-colors text-sm font-black"
                        >
                          -
                        </button>
                        <span className="w-9 text-center text-sm font-black text-text-primary font-mono">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.min(10, quantity + 1))}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-background transition-colors text-sm font-black"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="flex-1 py-3.5 px-6 rounded-2xl bg-primary hover:bg-primary-hover text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.99] min-h-[48px] shadow-sm"
                    >
                      <FaPlus size={13} />
                      <span>Tambah ke Rincian Pesanan</span>
                    </button>
                  </div>

                  {/* Catatan / Request Pose (Dipindah dari kolom kanan ke kiri) */}
                  <div className="space-y-1.5 pt-2 border-t border-border/60">
                    <label className="block text-xs font-black uppercase tracking-wider text-text-secondary">
                      Catatan / Request Pose Pesanan
                    </label>
                    <textarea
                      rows={3}
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      placeholder="Tuliskan request pose khusus, nama panggilan, atau pesan untuk idol dalam pesanan ini..."
                      className="w-full px-4 py-3 rounded-2xl text-xs bg-background border border-border text-text-primary placeholder:text-text-secondary/40 focus:outline-none focus:border-primary transition-colors resize-none font-medium"
                    />
                  </div>

                </div>

                {/* === KOLOM KANAN (lg:col-span-5 sticky top-24): RINGKASAN & PEMBAYARAN === */}
                <div className="lg:col-span-5 sticky top-24 space-y-5">
                  <div className="bg-surface border border-border rounded-3xl p-6 space-y-5">
                    
                    {/* Header Panel Kanan */}
                    <div className="flex items-center justify-between border-b border-border pb-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary text-xs font-black flex items-center justify-center">
                          2
                        </span>
                        <h3 className="text-base sm:text-lg font-black uppercase text-text-primary tracking-tight">
                          Ringkasan & Pembayaran
                        </h3>
                      </div>
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full font-mono border border-primary/20">
                        {cartItems.length} Item
                      </span>
                    </div>

                    {/* Rincian Pesanan: Item List ATAU Dashed Live Preview jika kosong */}
                    {cartItems.length === 0 ? (
                      <div className="p-4 rounded-2xl bg-primary/5 border border-dashed border-primary/40 space-y-2">
                        <div className="flex items-center justify-between text-xs text-primary font-bold">
                          <span className="flex items-center gap-1.5">
                            <FaShoppingCart size={11} />
                            <span>Preview Pilihan Saat Ini</span>
                          </span>
                          <span className="font-mono">Rp {totalPrice.toLocaleString('id-ID')}</span>
                        </div>

                        <div className="flex items-center gap-3 pt-1">
                          <div className="w-10 h-12 rounded-lg overflow-hidden bg-background border border-border shrink-0">
                            <img
                              src={getAssetPath(activeSelectedPhoto)}
                              alt="Preview"
                              className="w-full h-full object-cover object-top"
                              onError={(e) => {
                                e.target.onerror = null
                                e.target.src = getAssetPath('/images/members/placeholder.svg')
                              }}
                            />
                          </div>
                          <div className="truncate text-xs space-y-0.5">
                            <div className="font-black text-text-primary uppercase truncate">
                              {activeSelectedName}
                            </div>
                            <div className="text-[10px] text-text-secondary truncate">
                              {quantity}x · {chekiVariant === 'wide' ? 'Wide (16:9)' : 'Regular'} · {sesiMode === '2SHT' ? 'Hadir Event' : '1-Shot Nitip'}
                            </div>
                          </div>
                        </div>

                        <p className="text-[10px] text-text-secondary/80 pt-1 leading-relaxed border-t border-primary/20">
                          Klik tombol <strong>"Tambah ke Rincian Pesanan"</strong> di kolom kiri untuk memasukkan ke keranjang.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                        {cartItems.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="p-3 rounded-2xl bg-background border border-border flex items-center justify-between gap-3 hover:border-primary/40 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <div className="w-9 h-11 aspect-[3/4] rounded-lg overflow-hidden bg-surface border border-border shrink-0">
                                <img
                                  src={getAssetPath(item.memberPhoto)}
                                  alt={item.memberName}
                                  className="w-full h-full object-cover object-top"
                                  onError={(e) => {
                                    e.target.onerror = null
                                    e.target.src = getAssetPath('/images/members/placeholder.svg')
                                  }}
                                />
                              </div>
                              <div className="truncate space-y-0.5 text-xs">
                                <h5 className="font-black uppercase text-text-primary truncate text-[11px]">
                                  {item.memberName}
                                </h5>
                                <span className="text-[10px] text-text-secondary block truncate">
                                  {item.quantity}x {item.chekiVariant} ({item.sesiMode})
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              <span className="text-xs font-black text-primary font-mono">
                                Rp {item.totalPrice.toLocaleString('id-ID')}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveCartItem(idx)}
                                className="text-text-secondary hover:text-danger transition-colors p-1"
                                title="Hapus Item"
                              >
                                <FaTrash size={11} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Total Akhir Pembayaran */}
                    <div className="pt-3 border-t border-border flex items-center justify-between">
                      <span className="text-xs uppercase font-black text-text-secondary tracking-wider">
                        Total Akhir:
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-primary font-mono leading-none">
                        Rp {grandTotal.toLocaleString('id-ID')}
                      </div>
                    </div>

                    {/* Metode Pembayaran & Upload Bukti (Nonaktif jika cartItems kosong) */}
                    <div className={`space-y-4 pt-3 border-t border-border transition-opacity ${
                      cartItems.length === 0 ? 'opacity-40 pointer-events-none select-none' : 'opacity-100'
                    }`}>
                      {cartItems.length === 0 && (
                        <p className="text-[10px] text-[var(--warning)] font-bold text-center">
                          Tambahkan minimal 1 item ke keranjang untuk menyelesaikan pembayaran
                        </p>
                      )}

                      {/* Payment Method Switch Tabs */}
                      {enableTf && enableQris && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setPaymentMethodSelected('tf')}
                            className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 text-xs ${
                              paymentMethodSelected === 'tf'
                                ? 'bg-primary/10 border-primary text-text-primary font-bold'
                                : 'bg-background border-border text-text-secondary hover:border-text-secondary/40'
                            }`}
                          >
                            <FaCreditCard size={13} />
                            <span className="uppercase font-black text-[11px]">Transfer Bank</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPaymentMethodSelected('qris')}
                            className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 text-xs ${
                              paymentMethodSelected === 'qris'
                                ? 'bg-primary/10 border-primary text-text-primary font-bold'
                                : 'bg-background border-border text-text-secondary hover:border-text-secondary/40'
                            }`}
                          >
                            <FaQrcode size={13} />
                            <span className="uppercase font-black text-[11px]">Scan QRIS</span>
                          </button>
                        </div>
                      )}

                      {/* Bank Transfer Info */}
                      {paymentMethodSelected === 'tf' && (
                        <div className="p-3.5 rounded-2xl bg-background border border-border flex items-center justify-between gap-2 text-xs">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-text-secondary block">
                              {bankName}
                            </span>
                            <span className="font-mono text-base font-black text-text-primary tracking-wider block">
                              {rekeningNumber}
                            </span>
                            <span className="text-[10px] text-text-secondary block">
                              a.n. <strong className="text-text-primary">{rekeningName}</strong>
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyRekening}
                            className="px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-bold text-text-primary hover:border-primary transition-colors shrink-0 flex items-center gap-1.5"
                          >
                            <FaCopy className="text-primary" size={11} />
                            <span className="text-[11px]">{copiedRekening ? 'Tersalin!' : 'Salin'}</span>
                          </button>
                        </div>
                      )}

                      {/* QRIS Scan Info */}
                      {paymentMethodSelected === 'qris' && (
                        <div className="p-4 rounded-2xl bg-background border border-border flex flex-col items-center text-center space-y-2">
                          {qrisImageUrl ? (
                            <img
                              src={qrisImageUrl}
                              alt="QRIS Barcode"
                              className="w-40 h-40 object-contain rounded-xl border border-border bg-white p-2"
                            />
                          ) : (
                            <div className="w-40 h-40 flex flex-col items-center justify-center bg-surface rounded-xl p-3 text-text-secondary border border-dashed border-border">
                              <FaQrcode size={40} className="mb-2 text-text-secondary" />
                              <span className="text-[11px] font-black uppercase text-text-primary">QRIS Kohi Sekai</span>
                            </div>
                          )}
                          {qrisMerchantName && (
                            <p className="text-[11px] font-black text-text-primary uppercase tracking-wider">{qrisMerchantName}</p>
                          )}
                        </div>
                      )}

                      {/* Unggah Bukti Transfer */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-black uppercase tracking-wider text-text-secondary">
                          Unggah Bukti Pembayaran <span className="text-danger">*</span>
                        </label>
                        <ImageUploadDropzone
                          previewUrl={filePreview}
                          onImageChange={(compressedWebpFile, blobUrl) => {
                            setFile(compressedWebpFile)
                            setFilePreview(blobUrl)
                          }}
                          onRemove={() => {
                            setFile(null)
                            setFilePreview(null)
                          }}
                          hint="Drop foto bukti (JPG, PNG, WebP) ke sini"
                        />
                      </div>
                    </div>

                    {/* Tombol Submit Order (Disabled jika cart kosong atau bukti belum ada) */}
                    <button
                      type="submit"
                      disabled={submitting || uploading || cartItems.length === 0 || !file}
                      className="w-full py-4 px-6 rounded-2xl bg-primary hover:bg-primary-hover text-white font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-40 min-h-[48px] active:scale-[0.99] shadow-sm"
                    >
                      {submitting || uploading ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          <span>Memproses Pesanan...</span>
                        </>
                      ) : (
                        <>
                          <FaCheckCircle size={15} />
                          <span>Konfirmasi & Bayar Sekarang</span>
                        </>
                      )}
                    </button>

                  </div>
                </div>

              </div>

            </form>
          )}

        </div>
      </main>

      {/* Global Fan Authentication Modal */}
      <FanAuthModal />
    </div>
  )
}

export default KSCheckoutPageDesktop

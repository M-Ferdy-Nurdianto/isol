import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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
  FaChevronUp,
  FaChevronDown,
  FaTimes
} from 'react-icons/fa'
import { useCheckout } from '../../shared/context/CheckoutContext'
import { getAssetPath } from '../../lib/pathUtils'
import ImageUploadDropzone from '../../components/ui/ImageUploadDropzone'
import { webAlert } from '../../lib/webAlert'
import { useHideBottomNav } from '../../context/UIContext'
import '../styles/mobile.css'

export default function KSCheckoutPageMobile() {
  useHideBottomNav(true)
  const navigate = useNavigate()
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

  // Wizard Step: 1 (Member) -> 2 (Sesi) -> 3 (Bayar)
  const [step, setStep] = useState(1)
  const [showItemAddedSheet, setShowItemAddedSheet] = useState(false)
  const [showCartDrawer, setShowCartDrawer] = useState(false)

  // Handle hardware & header back button
  const handleBack = async () => {
    if (showCartDrawer) {
      setShowCartDrawer(false)
      return
    }
    if (showItemAddedSheet) {
      setShowItemAddedSheet(false)
      return
    }
    if (step === 3) {
      setStep(2)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (step === 2) {
      setStep(1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (step === 1) {
      if (cartItems.length > 0) {
        const confirmed = await webAlert.confirm({
          title: 'Batalkan Pesanan?',
          text: 'Item yang sudah kamu tambahkan ke keranjang akan hilang jika kamu keluar.',
          confirmText: 'Ya, Keluar',
          cancelText: 'Tetap di Sini',
          isDanger: true
        })
        if (!confirmed) return
      }
      navigate('/shop')
    }
  }

  // Capacitor back button integration
  useEffect(() => {
    let backHandler = null
    try {
      if (typeof window !== 'undefined' && window.Capacitor?.Plugins?.App?.addListener) {
        backHandler = window.Capacitor.Plugins.App.addListener('backButton', () => {
          handleBack()
        })
      }
    } catch (e) {
      // Browser environment fallback
    }

    return () => {
      if (backHandler && backHandler.remove) {
        backHandler.remove()
      }
    }
  }, [step, cartItems.length, showCartDrawer, showItemAddedSheet])

  // Add to cart with bottom sheet confirmation
  const handleMobileAddToCart = () => {
    handleAddToCart()
    setShowItemAddedSheet(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs font-black tracking-widest text-text-secondary uppercase">
            Memuat Checkout...
          </p>
        </div>
      </div>
    )
  }

  // Active member photo for step 2 preview
  const activeSelectedPhoto = ticketType === 'group'
    ? '/images/members/group.webp'
    : (selectedMember?.shop_image_url || selectedMember?.image_url || '/images/members/placeholder.webp')

  const activeSelectedName = ticketType === 'group'
    ? 'Cheki Grup'
    : (selectedMember?.nama_panggung || 'Member')

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col selection:bg-primary/30">
      
      {/* === CUSTOM MOBILE CHECKOUT HEADER === */}
      <header className="sticky top-0 z-30 bg-surface/95 border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center text-text-secondary active:text-primary transition-colors shrink-0"
            aria-label="Kembali"
          >
            <FaArrowLeft size={13} />
          </button>

          <div className="text-center">
            <h1 className="text-sm font-black uppercase text-text-primary tracking-wide leading-none">
              Checkout Cheki
            </h1>
            <span className="text-[10px] text-text-secondary font-mono">
              Langkah {step} dari 3
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowCartDrawer(true)}
            className="relative w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center text-text-secondary shrink-0"
            aria-label="Buka Keranjang"
          >
            <FaShoppingCart size={13} />
            {cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-black flex items-center justify-center shadow">
                {cartItems.length}
              </span>
            )}
          </button>
        </div>

        {/* 3-Step Progress Indicator Bar */}
        <div className="grid grid-cols-3 gap-1.5 mt-2.5">
          <div className={`h-1 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-primary' : 'bg-border'}`} />
          <div className={`h-1 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-primary' : 'bg-border'}`} />
          <div className={`h-1 rounded-full transition-all duration-300 ${step >= 3 ? 'bg-primary' : 'bg-border'}`} />
        </div>
      </header>

      {/* === SUCCESS VIEW === */}
      {orderSuccess ? (
        <div className="flex-1 p-5 pb-24 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto border border-success/30 mt-4">
            <FaCheckCircle size={32} />
          </div>

          <div>
            <span className="text-[10px] font-mono font-bold text-primary tracking-widest block uppercase mb-1">
              ORDER RECAP #{orderSuccess.order_number}
            </span>
            <h2 className="text-2xl font-black uppercase text-text-primary tracking-tight">
              PESANAN BERHASIL!
            </h2>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              Bukti bayar atas nama <strong className="text-text-primary font-bold">{form.nama_lengkap}</strong> sedang diverifikasi oleh staf.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface border border-border text-left space-y-2.5 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <span className="text-text-secondary">Event:</span>
              <span className="font-bold text-text-primary truncate max-w-[180px]">{event?.nama}</span>
            </div>
            <div className="space-y-1 pb-2 border-b border-border">
              <span className="text-text-secondary block">Rincian Tiket:</span>
              {orderSuccess.submittedItems?.map((it, idx) => (
                <div key={idx} className="font-bold text-text-primary text-[11px]">
                  {it.quantity}x {it.memberName} ({it.sesiMode})
                </div>
              ))}
            </div>
            {catatan && (
              <div className="pb-2 border-b border-border text-[11px]">
                <span className="text-text-secondary block">Catatan / Request:</span>
                <p className="font-bold text-text-primary italic mt-0.5">{catatan}</p>
              </div>
            )}
            <div className="flex justify-between items-center pt-1">
              <span className="font-black text-text-primary uppercase text-xs">Total:</span>
              <span className="font-black text-primary text-base font-mono">
                Rp {orderSuccess.finalTotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <Link
              to="/profile"
              className="w-full py-3.5 rounded-xl bg-primary text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <FaUser size={12} />
              <span>Lihat di Profil</span>
            </Link>
            <Link
              to="/shop"
              className="w-full py-3.5 rounded-xl bg-surface border border-border text-text-secondary font-bold text-xs uppercase tracking-wider flex items-center justify-center"
            >
              <span>Cek Jadwal Event Lain</span>
            </Link>
          </div>
        </div>
      ) : (
        /* === 3-STEP WIZARD BODY === */
        <main className="flex-1 p-4 pb-32">
          <AnimatePresence mode="wait">
            
            {/* ─────────────────────────────────────────────────────────────
                LANGKAH 1: PILIH MEMBER
                ───────────────────────────────────────────────────────────── */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Strip Pembeli 1 Baris */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-border text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FaUserCheck className="text-success shrink-0" size={12} />
                    <span className="text-text-secondary truncate text-[11px]">
                      Pemesan: <strong className="text-text-primary">{form.nama_lengkap || 'Penggemar'}</strong>
                      {form.whatsapp ? ` · ${form.whatsapp}` : ''}
                    </span>
                  </div>
                  <Link
                    to="/profile"
                    className="text-[10px] text-primary font-bold uppercase tracking-wider shrink-0 ml-2"
                  >
                    Ubah
                  </Link>
                </div>

                {/* Event Strip Ringkas */}
                {event && (
                  <div className="p-3 rounded-2xl bg-surface border border-border space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                      Jadwal Event
                    </span>
                    <h3 className="font-black text-text-primary uppercase text-sm tracking-wide leading-tight mt-1">
                      {event.nama}
                    </h3>
                    <div className="flex items-center gap-3 text-[11px] text-text-secondary pt-1 font-medium">
                      <span className="flex items-center gap-1">
                        <FaCalendarAlt className="text-primary text-[10px]" />
                        {event.tanggal} {event.bulan}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <FaClock className="text-primary text-[10px]" />
                        {event.cheki_time || event.event_time || 'Cheki'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Member Grid (3 Kolom Sebaris Rapi, Tidak Jatuh 2+1) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-text-secondary">
                      Pilih Member ({filteredMembers.length})
                    </label>
                    <span className="text-[10px] text-text-secondary">Ketuk untuk memilih</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    {/* Cheki Grup (Jika Aktif) */}
                    {chekiGrupEnabled && (
                      <button
                        type="button"
                        onClick={handleSelectGroup}
                        className={`group text-left flex flex-col rounded-2xl overflow-hidden border p-2 transition-all ${
                          ticketType === 'group'
                            ? 'border-primary ring-2 ring-primary/40 bg-surface shadow-md'
                            : 'border-border bg-surface/60 opacity-80'
                        }`}
                      >
                        <div className="aspect-[3/4] rounded-xl bg-background flex flex-col items-center justify-center p-2 mb-1.5 relative">
                          {ticketType === 'group' && (
                            <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center shadow z-10">
                              <FaCheck size={8} />
                            </div>
                          )}
                          <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center mb-1">
                            <FaUsers size={18} />
                          </div>
                        </div>
                        <span className="text-[11px] font-black uppercase text-text-primary truncate block text-center">
                          Grup
                        </span>
                        <span className="text-[9px] text-primary font-mono text-center block font-bold">
                          150k
                        </span>
                      </button>
                    )}

                    {/* Member Individu */}
                    {filteredMembers.map((m) => {
                      const isSelected = ticketType === 'member' && (selectedMember?.id === m.id || selectedMember?.member_id === m.member_id)
                      const photoSrc = m.shop_image_url || m.image_url || '/images/members/placeholder.webp'

                      return (
                        <button
                          key={m.id || m.member_id}
                          type="button"
                          onClick={() => handleSelectMember(m)}
                          className={`group text-left flex flex-col rounded-2xl overflow-hidden border transition-all ${
                            isSelected
                              ? 'border-primary ring-2 ring-primary/40 bg-surface shadow-md'
                              : 'border-border bg-surface/60 opacity-80'
                          }`}
                        >
                          <div className="relative aspect-[3/4] w-full overflow-hidden bg-background">
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center shadow z-10">
                                <FaCheck size={8} />
                              </div>
                            )}
                            <img
                              src={getAssetPath(photoSrc)}
                              alt={m.nama_panggung}
                              className="w-full h-full object-cover object-top"
                              onError={(e) => {
                                e.target.onerror = null
                                e.target.src = getAssetPath('/images/members/placeholder.webp')
                              }}
                            />
                            <div className="absolute inset-x-0 bottom-0 py-1 px-1.5 bg-black/85 text-center">
                              <span className="text-[10px] font-black uppercase text-white tracking-wide block truncate">
                                {m.nama_panggung}
                              </span>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                LANGKAH 2: DETAIL & OPSI SESI
                ───────────────────────────────────────────────────────────── */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Ringkasan Member Terpilih (Satu Baris) */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface border border-border">
                  <div className="w-12 h-14 rounded-xl overflow-hidden bg-background border border-border shrink-0">
                    <img
                      src={getAssetPath(activeSelectedPhoto)}
                      alt={activeSelectedName}
                      className="w-full h-full object-cover object-top"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = getAssetPath('/images/members/placeholder.webp')
                      }}
                    />
                  </div>
                  <div className="truncate flex-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary block">
                      Member Terpilih
                    </span>
                    <h3 className="font-black text-text-primary uppercase text-sm truncate leading-tight">
                      {activeSelectedName}
                    </h3>
                    <p className="text-[11px] font-mono text-primary font-bold mt-0.5">
                      Rp {unitPrice.toLocaleString('id-ID')} / tiket
                    </p>
                  </div>
                </div>

                {/* Tipe & Opsi Sesi Polaroid (1 Kolom, min-h-[56px]) */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-text-secondary block">
                    Tipe Polaroid
                  </label>

                  {ticketType === 'group' ? (
                    <div className="p-3.5 rounded-2xl border bg-primary/10 border-primary flex items-center justify-between min-h-[56px]">
                      <div>
                        <span className="text-xs font-black uppercase block text-text-primary">Cheki Grup</span>
                        <span className="text-[10px] text-text-secondary block">1 frame bersama semua idol</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-text-primary">
                        Rp {groupChekiPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {isRegularEnabled && (
                        <label
                          onClick={() => setChekiVariant('regular')}
                          className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex items-center justify-between min-h-[56px] ${
                            chekiVariant === 'regular'
                              ? 'bg-primary/10 border-primary text-text-primary font-bold'
                              : 'bg-surface border-border text-text-secondary'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="mChekiVariant"
                              value="regular"
                              checked={chekiVariant === 'regular'}
                              onChange={() => setChekiVariant('regular')}
                              className="accent-primary w-4 h-4"
                            />
                            <div>
                              <span className="text-xs font-black uppercase text-text-primary block">Regular Cheki</span>
                              <span className="text-[10px] text-text-secondary block font-normal">Standar 2-Shot</span>
                            </div>
                          </div>
                          <span className="font-mono text-xs font-bold text-text-primary">
                            Rp {regularPrice.toLocaleString('id-ID')}
                          </span>
                        </label>
                      )}

                      {wideChekiEnabled && (
                        <label
                          onClick={() => setChekiVariant('wide')}
                          className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex items-center justify-between min-h-[56px] ${
                            chekiVariant === 'wide'
                              ? 'bg-primary/10 border-primary text-text-primary font-bold'
                              : 'bg-surface border-border text-text-secondary'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="mChekiVariant"
                              value="wide"
                              checked={chekiVariant === 'wide'}
                              onChange={() => setChekiVariant('wide')}
                              className="accent-primary w-4 h-4"
                            />
                            <div>
                              <span className="text-xs font-black uppercase text-text-primary block">Wide Cheki</span>
                              <span className="text-[10px] text-text-secondary block font-normal">Format Lebar VIP</span>
                            </div>
                          </div>
                          <span className="font-mono text-xs font-bold text-text-primary">
                            Rp {widePrice.toLocaleString('id-ID')}
                          </span>
                        </label>
                      )}

                      {customOptions.map((opt) => (
                        <label
                          key={opt.id}
                          onClick={() => setChekiVariant(opt.label)}
                          className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex items-center justify-between min-h-[56px] ${
                            chekiVariant === opt.label
                              ? 'bg-primary/10 border-primary text-text-primary font-bold'
                              : 'bg-surface border-border text-text-secondary'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="mChekiVariant"
                              value={opt.label}
                              checked={chekiVariant === opt.label}
                              onChange={() => setChekiVariant(opt.label)}
                              className="accent-primary w-4 h-4"
                            />
                            <div>
                              <span className="text-xs font-black uppercase text-text-primary block">{opt.label}</span>
                              <span className="text-[10px] text-text-secondary block font-normal">{opt.description || 'Kustom'}</span>
                            </div>
                          </div>
                          <span className="font-mono text-xs font-bold text-text-primary">
                            Rp {Number(opt.price || 0).toLocaleString('id-ID')}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Opsi Kehadiran */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-text-secondary block">
                    Opsi Kehadiran
                  </label>

                  <div className="space-y-2">
                    <label
                      onClick={() => setSesiMode('2SHT')}
                      className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex items-center justify-between min-h-[56px] ${
                        sesiMode === '2SHT'
                          ? 'bg-primary/10 border-primary text-text-primary font-bold'
                          : 'bg-surface border-border text-text-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="mSesiMode"
                          value="2SHT"
                          checked={sesiMode === '2SHT'}
                          onChange={() => setSesiMode('2SHT')}
                          className="accent-primary w-4 h-4"
                        />
                        <div>
                          <span className="text-xs font-black uppercase text-text-primary block">2-Shot (Hadir Event)</span>
                          <span className="text-[10px] text-text-secondary block font-normal">Foto bareng di lokasi</span>
                        </div>
                      </div>
                    </label>

                    <label
                      onClick={() => setSesiMode('1SHT')}
                      className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex items-center justify-between min-h-[56px] ${
                        sesiMode === '1SHT'
                          ? 'bg-primary/10 border-primary text-text-primary font-bold'
                          : 'bg-surface border-border text-text-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="mSesiMode"
                          value="1SHT"
                          checked={sesiMode === '1SHT'}
                          onChange={() => setSesiMode('1SHT')}
                          className="accent-primary w-4 h-4"
                        />
                        <div>
                          <span className="text-xs font-black uppercase text-text-primary block">1-Shot (Tidak Datang)</span>
                          <span className="text-[10px] text-text-secondary block font-normal">Foto solo idol (nitip pose)</span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Stepper Jumlah Tiket */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface border border-border">
                  <div>
                    <span className="text-xs font-black uppercase text-text-primary block">Jumlah Tiket</span>
                    <span className="text-[10px] text-text-secondary">Maks. 10 per pesanan</span>
                  </div>

                  <div className="flex items-center rounded-xl bg-background border border-border p-0.5">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary text-sm font-black"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-black text-text-primary font-mono">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(10, quantity + 1))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary text-sm font-black"
                    >
                      +
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                LANGKAH 3: BAYAR & KONFIRMASI (TERMASUK CATATAN / REQUEST POSE)
                ───────────────────────────────────────────────────────────── */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Daftar Item di Keranjang */}
                <div className="p-3.5 rounded-2xl bg-surface border border-border space-y-2.5">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <span className="text-xs font-black uppercase text-text-primary">
                      Item Pesanan ({cartItems.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-[11px] font-bold text-primary"
                    >
                      + Tambah Item Lain
                    </button>
                  </div>

                  {cartItems.length === 0 ? (
                    <div className="text-center py-4 text-xs text-text-secondary">
                      Keranjang masih kosong. Kembali ke langkah 1 untuk memilih member.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cartItems.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="flex items-center justify-between p-2 rounded-xl bg-background border border-border text-xs"
                        >
                          <div className="truncate pr-2">
                            <span className="font-bold text-text-primary block truncate text-[11px]">
                              {item.quantity}x {item.memberName}
                            </span>
                            <span className="text-[10px] text-text-secondary">
                              {item.chekiVariant} · {item.sesiMode === '2SHT' ? 'Hadir' : 'Nitip'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono font-bold text-primary text-xs">
                              Rp {item.totalPrice.toLocaleString('id-ID')}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCartItem(idx)}
                              className="text-text-secondary hover:text-danger p-1"
                              aria-label="Hapus item"
                            >
                              <FaTrash size={11} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* === CATATAN / REQUEST POSE PESANAN (KHUSUS MOBILE) === */}
                <div className="p-3.5 rounded-2xl bg-surface border border-border space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-text-secondary block">
                    Catatan / Request Pose Pesanan
                  </label>
                  <textarea
                    rows={3}
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Tuliskan pose khusus, pesan untuk idol, atau nama panggilan untuk tiket cheki ini..."
                    className="w-full p-3 rounded-xl text-xs bg-background border border-border text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-primary transition-colors resize-none font-medium"
                  />
                  <p className="text-[10px] text-text-secondary">
                    *Opsional: Idola kamu akan membaca request pose ini saat sesi foto.
                  </p>
                </div>

                {/* Metode Pembayaran */}
                <div className="p-3.5 rounded-2xl bg-surface border border-border space-y-3">
                  <label className="text-xs font-black uppercase tracking-wider text-text-secondary block">
                    Metode Pembayaran
                  </label>

                  {/* Switch Tab TF / QRIS */}
                  {enableTf && enableQris && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethodSelected('tf')}
                        className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                          paymentMethodSelected === 'tf'
                            ? 'bg-primary/10 border-primary text-text-primary font-black'
                            : 'bg-background border-border text-text-secondary'
                        }`}
                      >
                        Transfer Bank
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethodSelected('qris')}
                        className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                          paymentMethodSelected === 'qris'
                            ? 'bg-primary/10 border-primary text-text-primary font-black'
                            : 'bg-background border-border text-text-secondary'
                        }`}
                      >
                        Scan QRIS
                      </button>
                    </div>
                  )}

                  {/* Bank Transfer */}
                  {paymentMethodSelected === 'tf' && (
                    <div className="p-3 rounded-xl bg-background border border-border flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-text-secondary block">
                          Bank {bankName}
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
                        className="px-3 py-1.5 rounded-lg bg-surface border border-border text-[11px] font-bold text-primary flex items-center gap-1.5 shrink-0"
                      >
                        <FaCopy size={11} />
                        <span>{copiedRekening ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    </div>
                  )}

                  {/* QRIS */}
                  {paymentMethodSelected === 'qris' && (
                    <div className="p-3 rounded-xl bg-background border border-border text-center space-y-2">
                      {qrisImageUrl ? (
                        <img
                          src={qrisImageUrl}
                          alt="QRIS"
                          className="w-36 h-36 object-contain rounded-lg border border-border bg-white mx-auto p-1"
                        />
                      ) : (
                        <div className="w-36 h-36 flex flex-col items-center justify-center bg-surface rounded-lg mx-auto border border-dashed border-border text-text-secondary">
                          <FaQrcode size={32} />
                          <span className="text-[10px] font-bold mt-1">QRIS Kohi Sekai</span>
                        </div>
                      )}
                      {qrisMerchantName && (
                        <p className="text-[10px] font-black text-text-primary uppercase">{qrisMerchantName}</p>
                      )}
                    </div>
                  )}

                  {/* Upload Bukti Bayar */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-black uppercase tracking-wider text-text-secondary block">
                      Unggah Bukti Bayar <span className="text-danger">*</span>
                    </label>
                    <ImageUploadDropzone
                      previewUrl={filePreview}
                      emptyText="Ketuk untuk pilih foto bukti transfer"
                      onImageChange={(compressedWebpFile, blobUrl) => {
                        setFile(compressedWebpFile)
                        setFilePreview(blobUrl)
                      }}
                      onRemove={() => {
                        setFile(null)
                        setFilePreview(null)
                      }}
                      hint="Format: JPG, PNG, WebP (Auto-kompres WebP)"
                    />
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SATU STICKY BOTTOM BAR (HANYA SATU, TIDAK BERTUMPUK)
          ───────────────────────────────────────────────────────────── */}
      {!orderSuccess && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-border p-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))] shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            
            {/* Total Section (Tap untuk buka drawer keranjang) */}
            <div
              onClick={() => setShowCartDrawer(true)}
              className="cursor-pointer space-y-0.5"
            >
              <div className="flex items-center gap-1 text-[9px] font-black uppercase text-text-secondary">
                <span>Total ({cartItems.length} item)</span>
                <FaChevronUp size={8} />
              </div>
              <div className="text-lg font-black text-primary font-mono leading-none">
                Rp {grandTotal.toLocaleString('id-ID')}
              </div>
            </div>

            {/* Action Button sesuai Step Aktif */}
            {step === 1 && (
              <button
                type="button"
                onClick={() => {
                  setStep(2)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                disabled={!selectedMember && ticketType !== 'group'}
                className="py-3 px-5 rounded-xl bg-primary hover:bg-primary-hover text-white font-black text-xs uppercase tracking-wider disabled:opacity-40 min-h-[44px] shrink-0 active:scale-95 transition-all"
              >
                Pilih Sesi →
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={handleMobileAddToCart}
                className="py-3 px-5 rounded-xl bg-primary hover:bg-primary-hover text-white font-black text-xs uppercase tracking-wider min-h-[44px] shrink-0 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <FaPlus size={11} />
                <span>Tambah Item</span>
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={submitting || uploading || cartItems.length === 0 || !file}
                className="py-3 px-5 rounded-xl bg-primary hover:bg-primary-hover text-white font-black text-xs uppercase tracking-wider disabled:opacity-40 min-h-[44px] shrink-0 active:scale-95 transition-all flex items-center gap-1.5"
              >
                {submitting || uploading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>
                    <FaCheckCircle size={13} />
                    <span>Konfirmasi Bayar</span>
                  </>
                )}
              </button>
            )}

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          BOTTOM SHEET: KONFIRMASI SETELAH ITEM DITAMBAHKAN (STEP 2)
          ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showItemAddedSheet && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80">
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="w-full max-w-lg bg-surface border-t border-border rounded-t-3xl p-5 space-y-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]"
            >
              <div className="w-10 h-1 rounded-full bg-border mx-auto" />
              
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto mb-2 border border-success/30">
                  <FaCheck size={16} />
                </div>
                <h4 className="text-base font-black uppercase text-text-primary tracking-tight">
                  Item Berhasil Ditambahkan!
                </h4>
                <p className="text-xs text-text-secondary">
                  Total keranjang saat ini: <strong className="text-primary font-mono font-bold">Rp {grandTotal.toLocaleString('id-ID')}</strong> ({cartItems.length} item)
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowItemAddedSheet(false)
                    setStep(3)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <span>Lanjut ke Pembayaran →</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowItemAddedSheet(false)
                    setStep(1)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="w-full py-3.5 rounded-xl bg-background border border-border text-text-primary font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <FaPlus size={11} />
                  <span>Tambah Member Lain</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          BOTTOM SHEET: RINCIAN KERANJANG (DI-TRIGGER DARI TOTAL BAR)
          ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCartDrawer && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80">
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="w-full max-w-lg bg-surface border-t border-border rounded-t-3xl p-5 space-y-4 max-h-[85vh] flex flex-col pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <FaShoppingCart className="text-primary" size={14} />
                  <h4 className="text-sm font-black uppercase text-text-primary tracking-tight">
                    Rincian Keranjang ({cartItems.length})
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCartDrawer(false)}
                  className="w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center text-text-secondary"
                  aria-label="Tutup"
                >
                  <FaTimes size={11} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {cartItems.length === 0 ? (
                  <p className="text-xs text-text-secondary text-center py-6">
                    Keranjang masih kosong.
                  </p>
                ) : (
                  cartItems.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3 rounded-xl bg-background border border-border flex items-center justify-between text-xs"
                    >
                      <div className="truncate pr-2">
                        <span className="font-bold text-text-primary block truncate text-[11px]">
                          {item.quantity}x {item.memberName}
                        </span>
                        <span className="text-[10px] text-text-secondary">
                          {item.chekiVariant} · {item.sesiMode === '2SHT' ? 'Hadir' : 'Nitip'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-bold text-primary text-xs">
                          Rp {item.totalPrice.toLocaleString('id-ID')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCartItem(idx)}
                          className="text-text-secondary hover:text-danger p-1"
                        >
                          <FaTrash size={11} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between">
                <span className="text-xs font-black uppercase text-text-secondary">Total:</span>
                <span className="text-lg font-black text-primary font-mono">
                  Rp {grandTotal.toLocaleString('id-ID')}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowCartDrawer(false)
                  if (cartItems.length > 0) {
                    setStep(3)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                }}
                disabled={cartItems.length === 0}
                className="w-full py-3.5 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-wider disabled:opacity-40"
              >
                {step === 3 ? 'Tutup Rincian' : 'Lanjut ke Pembayaran →'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

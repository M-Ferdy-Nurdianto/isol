import { useState, useMemo } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FaArrowLeft,
  FaShoppingBag,
  FaStore,
  FaTruck,
  FaMapMarkerAlt,
  FaCopy,
  FaQrcode,
  FaCheck,
  FaInfoCircle,
  FaBox,
  FaShieldAlt,
  FaUserCheck
} from 'react-icons/fa'
import KSHeader from '../components/KSHeader'
import KSFooter from '../components/KSFooter'
import { useMerchCart } from '../context/MerchCartContext'
import { useFanAuth } from '../context/FanAuthContext'
import { kohiToast } from '../components/ui/KohiToast'
import ImageUploadDropzone from '../components/ui/ImageUploadDropzone'
import { getAssetPath } from '../lib/pathUtils'
import api from '../lib/api'

const KSMerchCheckoutPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { fanUser, isLoggedIn, openAuthModal } = useFanAuth()
  const { cart, clearCart, totalItems: cartTotalItems, totalPrice: cartTotalPrice } = useMerchCart()

  // Support direct buy item passed via location.state (from "Beli Sekarang" modal)
  const directBuyItem = location.state?.directBuyItem || null

  const checkoutItems = useMemo(() => {
    if (directBuyItem) {
      return [directBuyItem]
    }
    return cart
  }, [directBuyItem, cart])

  const totalItemCount = useMemo(() => {
    return checkoutItems.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0)
  }, [checkoutItems])

  const subtotalPrice = useMemo(() => {
    return checkoutItems.reduce((sum, i) => sum + ((Number(i.harga) || 0) * (Number(i.quantity) || 1)), 0)
  }, [checkoutItems])

  // Form State
  const [buyer, setBuyer] = useState({
    nama: fanUser?.nama || '',
    whatsapp: fanUser?.whatsapp || fanUser?.nomor_telepon || '',
    instagram: fanUser?.instagram || '',
    catatan: '',
    delivery_method: 'pickup_event', // 'pickup_event' | 'shipping'
    shipping_address: '',
    shipping_city: '',
    shipping_postal_code: ''
  })

  const [paymentMethod, setPaymentMethod] = useState('tf') // 'tf' | 'qris'
  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState('')
  const [copiedRekening, setCopiedRekening] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [successOrder, setSuccessOrder] = useState(null)

  // Config fallback (Bank info & QRIS)
  const bankConfig = {
    bank: 'BCA',
    rekening: '0902683273',
    atas_nama: 'Kohi Sekai Official',
    qris_merchant: 'Kohi Sekai Official'
  }

  const handleCopyRekening = () => {
    navigator.clipboard.writeText(bankConfig.rekening)
    setCopiedRekening(true)
    kohiToast.success('Nomor rekening berhasil disalin!')
    setTimeout(() => setCopiedRekening(false), 2000)
  }

  const handleSubmitOrder = async (e) => {
    e.preventDefault()

    if (checkoutItems.length === 0) {
      kohiToast.error('Keranjang kosong, pilih merchandise terlebih dahulu.')
      return
    }

    if (!buyer.nama.trim()) {
      kohiToast.error('Nama lengkap pemesan wajib diisi.')
      return
    }

    if (!buyer.whatsapp.trim()) {
      kohiToast.error('Nomor WhatsApp wajib diisi.')
      return
    }

    if (buyer.delivery_method === 'shipping') {
      if (!buyer.shipping_address?.trim() || buyer.shipping_address.trim().length < 5) {
        kohiToast.error('Alamat lengkap pengiriman wajib diisi minimal 5 karakter.')
        return
      }
      if (!buyer.shipping_city?.trim() || buyer.shipping_city.trim().length < 2) {
        kohiToast.error('Kota / Kabupaten tujuan wajib diisi.')
        return
      }
    }

    setSubmitting(true)
    let paymentProofUrl = ''

    try {
      // 1. Upload payment proof if provided
      if (proofFile) {
        const uploadData = new FormData()
        uploadData.append('file', proofFile)
        const uploadRes = await api.post('/upload/payment-proof', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        paymentProofUrl = uploadRes.data?.data?.url || uploadRes.data?.url || ''
      }

      // 2. Prepare order payload
      const payload = {
        nama_lengkap: buyer.nama.trim(),
        whatsapp: buyer.whatsapp.trim(),
        instagram: buyer.instagram?.trim() || null,
        catatan: buyer.catatan?.trim() || null,
        delivery_method: buyer.delivery_method,
        shipping_address: buyer.delivery_method === 'shipping' ? buyer.shipping_address.trim() : null,
        shipping_city: buyer.delivery_method === 'shipping' ? buyer.shipping_city.trim() : null,
        shipping_postal_code: buyer.delivery_method === 'shipping' ? (buyer.shipping_postal_code?.trim() || null) : null,
        payment_proof_url: paymentProofUrl || null,
        user_id: fanUser?.id || null,
        email: fanUser?.email || null,
        items: checkoutItems.map(item => ({
          merchandise_id: item.merchandise_id || item.id,
          nama: item.nama,
          harga: Number(item.harga || 0),
          quantity: Number(item.quantity || 1),
          size: item.size || null
        }))
      }

      const res = await api.post('/merch-orders', payload)
      if (res.data?.success && res.data?.order) {
        setSuccessOrder(res.data.order)
        // Clear cart if checkout was from cart
        if (!directBuyItem) {
          clearCart()
        }
        kohiToast.success('Pesanan merchandise berhasil dibuat!')
      } else {
        throw new Error(res.data?.error || 'Gagal memproses pesanan')
      }
    } catch (err) {
      console.error('Error submitting merch order:', err)
      kohiToast.error(err.response?.data?.error || err.message || 'Gagal memproses pesanan merchandise.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1A1512] text-text-primary bg-pattern-dots overflow-x-hidden relative flex flex-col justify-between">
      <KSHeader />

      <main className="pt-24 sm:pt-32 pb-24 relative z-10 flex-1">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">

          {/* =========================================================================
              SUCCESS STATE (Celebration Receipt)
              ========================================================================= */}
          {successOrder ? (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-xl mx-auto bg-[#241E19] border border-[#3A2E24] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
            >
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center text-2xl mx-auto shadow-lg shadow-emerald-500/30">
                  <FaCheck />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-text-primary uppercase tracking-tight">
                  Pesanan Merchandise Berhasil!
                </h2>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Pesananmu sudah tersimpan di sistem Kohi Sekai. Admin akan memverifikasi pembayaran & mengemas barangmu.
                </p>
              </div>

              {/* Receipt Summary Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#1A1512] border border-[#3A2E24] space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-[#3A2E24]">
                  <span className="text-[10px] uppercase font-bold text-text-secondary">Nomor Pesanan</span>
                  <span className="text-sm font-mono font-black text-[#E8944A]">
                    {successOrder.order_number}
                  </span>
                </div>

                <div className="space-y-2 py-1">
                  <span className="text-[10px] uppercase font-bold text-text-secondary block">Daftar Item</span>
                  {checkoutItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="font-bold text-text-primary truncate max-w-[220px]">
                        {item.nama} {item.size ? `(${item.size})` : ''} x{item.quantity}
                      </span>
                      <span className="font-mono text-text-secondary">
                        Rp {(Number(item.harga || 0) * (item.quantity || 1)).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#3A2E24]">
                  <span className="text-[10px] uppercase font-bold text-text-secondary">Metode Pengambilan</span>
                  <span className="text-xs font-bold text-text-primary">
                    {successOrder.delivery_method === 'shipping' ? 'Dikirim via Ekspedisi' : 'Ambil di Event'}
                  </span>
                </div>

                {successOrder.delivery_method === 'shipping' && successOrder.shipping_address && (
                  <div className="pt-2 border-t border-[#3A2E24]">
                    <span className="text-[10px] uppercase font-bold text-text-secondary block mb-0.5">Alamat Tujuan</span>
                    <span className="text-xs text-text-primary block leading-relaxed">
                      {successOrder.shipping_address}
                      {successOrder.shipping_city ? `, ${successOrder.shipping_city}` : ''}
                      {successOrder.shipping_postal_code ? ` (${successOrder.shipping_postal_code})` : ''}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-[#3A2E24]">
                  <span className="text-xs font-black uppercase text-text-secondary">Total Bayar</span>
                  <span className="text-lg font-black text-[#E8944A] font-mono">
                    Rp {Number(successOrder.total_harga || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Link
                  to="/profile"
                  className="w-full py-3 px-4 rounded-xl bg-[#E8944A] hover:bg-[#E8944A]/90 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition"
                >
                  Lihat Riwayat Pesanan di Profil
                </Link>

                <Link
                  to="/shop"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#1A1512] hover:bg-[#241E19] border border-[#3A2E24] text-text-secondary hover:text-text-primary font-bold text-xs uppercase tracking-wider flex items-center justify-center transition"
                >
                  Kembali ke Toko
                </Link>
              </div>
            </motion.div>
          ) : checkoutItems.length === 0 ? (
            /* =========================================================================
                EMPTY STATE
                ========================================================================= */
            <div className="max-w-md mx-auto text-center py-20 space-y-4 bg-[#241E19] border border-[#3A2E24] rounded-3xl p-8 shadow-xl">
              <div className="w-16 h-16 rounded-full bg-[#1A1512] border border-[#3A2E24] flex items-center justify-center mx-auto text-text-secondary">
                <FaBox size={24} className="text-[#E8944A]/50" />
              </div>
              <h2 className="text-lg font-black text-text-primary uppercase">
                Tidak Ada Item untuk Di-Checkout
              </h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                Keranjang belanjamu saat ini kosong. Silakan pilih official merchandise terlebih dahulu di halaman Shop.
              </p>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#E8944A] text-white text-xs font-black uppercase tracking-wider shadow-lg hover:bg-[#E8944A]/90 transition"
              >
                <FaShoppingBag size={12} />
                <span>Lihat Official Merchandise</span>
              </Link>
            </div>
          ) : (
            /* =========================================================================
                CHECKOUT FORM CONTAINER
                ========================================================================= */
            <div>
              {/* Back link & Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#3A2E24]">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/shop')}
                    className="w-9 h-9 rounded-xl bg-[#241E19] border border-[#3A2E24] flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
                    aria-label="Kembali"
                  >
                    <FaArrowLeft size={12} />
                  </button>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-text-primary uppercase tracking-tight">
                      Checkout Merchandise
                    </h1>
                    <p className="text-xs text-text-secondary">
                      {totalItemCount} item · Rincian pengiriman & konfirmasi pembayaran
                    </p>
                  </div>
                </div>

                {!isLoggedIn && (
                  <button
                    type="button"
                    onClick={() => openAuthModal()}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#241E19] border border-[#3A2E24] text-xs text-text-secondary hover:text-[#E8944A] font-bold transition shrink-0"
                  >
                    <FaUserCheck className="text-[#E8944A]" />
                    <span>Masuk Fan ID untuk Auto-fill</span>
                  </button>
                )}
              </div>

              {/* Form starts */}
              <form onSubmit={handleSubmitOrder}>

                {/* =========================================================================
                    DESKTOP 2-COLUMN LAYOUT (hidden md:grid md:grid-cols-12 gap-8)
                    ========================================================================= */}
                <div className="hidden md:grid md:grid-cols-12 gap-8 items-start">
                  
                  {/* LEFT COLUMN: Customer, Shipping, Payment Forms (7 cols) */}
                  <div className="md:col-span-7 space-y-6">

                    {/* Section 1: Data Penerima */}
                    <div className="p-6 rounded-3xl bg-[#241E19] border border-[#3A2E24] shadow-xl space-y-4">
                      <div className="flex items-center gap-2.5 pb-3 border-b border-[#3A2E24]">
                        <span className="w-6 h-6 rounded-full bg-[#E8944A]/15 text-[#E8944A] text-xs font-black flex items-center justify-center">
                          1
                        </span>
                        <h2 className="text-sm font-black text-text-primary uppercase tracking-wider">
                          Data Penerima
                        </h2>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-text-secondary mb-1">
                            Nama Lengkap <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={buyer.nama}
                            onChange={(e) => setBuyer({ ...buyer, nama: e.target.value })}
                            placeholder="Contoh: Rian Pratama"
                            className="w-full px-4 py-2.5 rounded-xl bg-[#1A1512] border border-[#3A2E24] text-xs text-text-primary focus:outline-none focus:border-[#E8944A] transition-colors"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-text-secondary mb-1">
                              No. WhatsApp <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="tel"
                              required
                              value={buyer.whatsapp}
                              onChange={(e) => setBuyer({ ...buyer, whatsapp: e.target.value })}
                              placeholder="081234567890"
                              className="w-full px-4 py-2.5 rounded-xl bg-[#1A1512] border border-[#3A2E24] text-xs text-text-primary focus:outline-none focus:border-[#E8944A] transition-colors"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-text-secondary mb-1">
                              Instagram <span className="text-[10px] text-text-secondary font-normal">(opsional)</span>
                            </label>
                            <input
                              type="text"
                              value={buyer.instagram}
                              onChange={(e) => setBuyer({ ...buyer, instagram: e.target.value })}
                              placeholder="@username"
                              className="w-full px-4 py-2.5 rounded-xl bg-[#1A1512] border border-[#3A2E24] text-xs text-text-primary focus:outline-none focus:border-[#E8944A] transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Metode Pengambilan / Pengiriman */}
                    <div className="p-6 rounded-3xl bg-[#241E19] border border-[#3A2E24] shadow-xl space-y-4">
                      <div className="flex items-center gap-2.5 pb-3 border-b border-[#3A2E24]">
                        <span className="w-6 h-6 rounded-full bg-[#E8944A]/15 text-[#E8944A] text-xs font-black flex items-center justify-center">
                          2
                        </span>
                        <h2 className="text-sm font-black text-text-primary uppercase tracking-wider">
                          Metode Pengambilan & Alamat
                        </h2>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setBuyer({ ...buyer, delivery_method: 'pickup_event' })}
                          className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                            buyer.delivery_method === 'pickup_event'
                              ? 'bg-[#E8944A] text-white border-[#E8944A] shadow-md shadow-[#E8944A]/20'
                              : 'bg-[#1A1512] text-text-secondary border-[#3A2E24] hover:border-[#E8944A]/40 hover:text-text-primary'
                          }`}
                        >
                          <FaStore className="text-base mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-black uppercase leading-tight">Ambil di Event</p>
                            <p className={`text-[11px] mt-1 leading-tight ${buyer.delivery_method === 'pickup_event' ? 'text-white/80' : 'text-text-secondary'}`}>
                              Ambil langsung di merchandise booth saat event berikutnya
                            </p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setBuyer({ ...buyer, delivery_method: 'shipping' })}
                          className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                            buyer.delivery_method === 'shipping'
                              ? 'bg-[#E8944A] text-white border-[#E8944A] shadow-md shadow-[#E8944A]/20'
                              : 'bg-[#1A1512] text-text-secondary border-[#3A2E24] hover:border-[#E8944A]/40 hover:text-text-primary'
                          }`}
                        >
                          <FaTruck className="text-base mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-black uppercase leading-tight">Dikirim ke Rumah</p>
                            <p className={`text-[11px] mt-1 leading-tight ${buyer.delivery_method === 'shipping' ? 'text-white/80' : 'text-text-secondary'}`}>
                              Kirim via ekspedisi (J&T, JNE, SiCepat) dengan no. resi
                            </p>
                          </div>
                        </button>
                      </div>

                      {/* Conditional Shipping Form */}
                      {buyer.delivery_method === 'shipping' && (
                        <div className="p-4 rounded-2xl bg-[#1A1512] border border-[#E8944A]/30 space-y-3 mt-2">
                          <p className="text-xs font-black text-[#E8944A] uppercase tracking-wider flex items-center gap-1.5">
                            <FaMapMarkerAlt size={12} />
                            <span>Alamat Pengiriman Lengkap</span>
                          </p>

                          <div>
                            <label className="block text-xs font-bold text-text-secondary mb-1">
                              Alamat Jalan, RT/RW, Kelurahan, Kecamatan <span className="text-red-400">*</span>
                            </label>
                            <textarea
                              rows={3}
                              required={buyer.delivery_method === 'shipping'}
                              value={buyer.shipping_address}
                              onChange={(e) => setBuyer({ ...buyer, shipping_address: e.target.value })}
                              placeholder="Jl. Anggrek No. 12, RT 02/RW 05, Kel. Menteng, Kec. Menteng, patokan depan pos ronda"
                              className="w-full px-4 py-2.5 rounded-xl bg-[#241E19] border border-[#3A2E24] text-xs text-text-primary focus:outline-none focus:border-[#E8944A] resize-none transition-colors"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-text-secondary mb-1">
                                Kota / Kabupaten <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                required={buyer.delivery_method === 'shipping'}
                                value={buyer.shipping_city}
                                onChange={(e) => setBuyer({ ...buyer, shipping_city: e.target.value })}
                                placeholder="Contoh: Jakarta Pusat"
                                className="w-full px-4 py-2.5 rounded-xl bg-[#241E19] border border-[#3A2E24] text-xs text-text-primary focus:outline-none focus:border-[#E8944A] transition-colors"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-text-secondary mb-1">
                                Kode Pos <span className="text-[10px] text-text-secondary font-normal">(opsional)</span>
                              </label>
                              <input
                                type="text"
                                value={buyer.shipping_postal_code}
                                onChange={(e) => setBuyer({ ...buyer, shipping_postal_code: e.target.value })}
                                placeholder="10310"
                                className="w-full px-4 py-2.5 rounded-xl bg-[#241E19] border border-[#3A2E24] text-xs text-text-primary focus:outline-none focus:border-[#E8944A] transition-colors"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1">
                          Catatan Pesanan <span className="text-[10px] text-text-secondary font-normal">(opsional)</span>
                        </label>
                        <input
                          type="text"
                          value={buyer.catatan}
                          onChange={(e) => setBuyer({ ...buyer, catatan: e.target.value })}
                          placeholder={buyer.delivery_method === 'pickup_event' ? 'Contoh: Ambil tanggal 22 November' : 'Catatan untuk kurir paket'}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#1A1512] border border-[#3A2E24] text-xs text-text-primary focus:outline-none focus:border-[#E8944A] transition-colors"
                        />
                      </div>
                    </div>

                    {/* Section 3: Pembayaran & Bukti Transfer */}
                    <div className="p-6 rounded-3xl bg-[#241E19] border border-[#3A2E24] shadow-xl space-y-4">
                      <div className="flex items-center gap-2.5 pb-3 border-b border-[#3A2E24]">
                        <span className="w-6 h-6 rounded-full bg-[#E8944A]/15 text-[#E8944A] text-xs font-black flex items-center justify-center">
                          3
                        </span>
                        <h2 className="text-sm font-black text-text-primary uppercase tracking-wider">
                          Pembayaran
                        </h2>
                      </div>

                      {/* Payment Method Switcher */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('tf')}
                          className={`py-3 px-4 rounded-xl border text-xs font-black uppercase tracking-wider text-center transition-all ${
                            paymentMethod === 'tf'
                              ? 'bg-[#E8944A] text-white border-[#E8944A] shadow-md shadow-[#E8944A]/20'
                              : 'bg-[#1A1512] text-text-secondary border-[#3A2E24] hover:border-[#E8944A]/40'
                          }`}
                        >
                          Transfer Bank (BCA)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('qris')}
                          className={`py-3 px-4 rounded-xl border text-xs font-black uppercase tracking-wider text-center transition-all ${
                            paymentMethod === 'qris'
                              ? 'bg-[#E8944A] text-white border-[#E8944A] shadow-md shadow-[#E8944A]/20'
                              : 'bg-[#1A1512] text-text-secondary border-[#3A2E24] hover:border-[#E8944A]/40'
                          }`}
                        >
                          QRIS Kohi Sekai
                        </button>
                      </div>

                      {/* Transfer BCA Info */}
                      {paymentMethod === 'tf' && (
                        <div className="p-4 rounded-2xl bg-[#1A1512] border border-[#3A2E24] flex items-center justify-between gap-4">
                          <div>
                            <p className="text-[10px] font-mono text-text-secondary uppercase">
                              Bank {bankConfig.bank}
                            </p>
                            <p className="text-base font-mono font-black text-text-primary tracking-wider">
                              {bankConfig.rekening}
                            </p>
                            <p className="text-xs text-text-secondary">
                              a.n. {bankConfig.atas_nama}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyRekening}
                            className="px-3.5 py-2 rounded-xl bg-[#241E19] hover:bg-[#3A2E24] border border-[#3A2E24] text-[#E8944A] text-xs font-black flex items-center gap-1.5 transition shrink-0"
                          >
                            <FaCopy size={11} />
                            <span>{copiedRekening ? 'Tersalin!' : 'Salin Rekening'}</span>
                          </button>
                        </div>
                      )}

                      {/* QRIS Barcode */}
                      {paymentMethod === 'qris' && (
                        <div className="p-4 rounded-2xl bg-[#1A1512] border border-[#3A2E24] flex flex-col items-center text-center space-y-2">
                          <div className="w-44 h-44 bg-white rounded-xl p-2 border border-[#3A2E24] flex items-center justify-center">
                            <FaQrcode size={100} className="text-black" />
                          </div>
                          <p className="text-xs font-bold text-text-primary">
                            {bankConfig.qris_merchant}
                          </p>
                          <p className="text-[10px] text-text-secondary">
                            Scan menggunakan GoPay, OVO, Dana, BCA Mobile, atau aplikasi e-wallet lainnya.
                          </p>
                        </div>
                      )}

                      {/* Bukti Transfer Upload */}
                      <div className="pt-2">
                        <ImageUploadDropzone
                          label="Upload Bukti Pembayaran (opsional)"
                          previewUrl={proofPreview}
                          onImageChange={(compressedWebpFile, blobUrl) => {
                            setProofFile(compressedWebpFile)
                            setProofPreview(blobUrl)
                          }}
                          onRemove={() => {
                            setProofFile(null)
                            setProofPreview('')
                          }}
                          hint="Drag & drop foto struk transfer / screenshot QRIS ke sini."
                          compact={true}
                        />
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Sticky Order Summary & Submit (5 cols) */}
                  <div className="md:col-span-5 sticky top-28 space-y-4">
                    <div className="p-6 rounded-3xl bg-[#241E19] border border-[#3A2E24] shadow-2xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-[#3A2E24]">
                        <h2 className="text-sm font-black text-text-primary uppercase tracking-tight flex items-center gap-2">
                          <FaShoppingBag className="text-[#E8944A]" />
                          <span>Ringkasan Pesanan</span>
                        </h2>
                        <span className="text-xs font-mono font-bold text-text-secondary">
                          {totalItemCount} item
                        </span>
                      </div>

                      {/* Item list */}
                      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {checkoutItems.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#1A1512] border border-[#3A2E24]">
                            <div className="w-12 h-12 rounded-lg bg-[#241E19] border border-[#3A2E24] overflow-hidden shrink-0">
                              {item.gambar_url ? (
                                <img
                                  src={getAssetPath(item.gambar_url)}
                                  alt={item.nama}
                                  className="w-full h-full object-contain p-1"
                                  onError={(e) => {
                                    e.target.onerror = null
                                    e.target.src = getAssetPath('/images/merch/jersey.svg')
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <FaBox className="text-[#E8944A]/40" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-text-primary truncate">{item.nama}</p>
                              <div className="flex items-center gap-2 text-[10px] text-text-secondary mt-0.5">
                                {item.size && <span className="font-bold text-[#E8944A]">Size {item.size}</span>}
                                <span>Jumlah: {item.quantity}</span>
                              </div>
                            </div>
                            <span className="text-xs font-mono font-black text-text-primary shrink-0">
                              Rp {(Number(item.harga || 0) * (item.quantity || 1)).toLocaleString('id-ID')}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Subtotal & Delivery details */}
                      <div className="pt-3 border-t border-[#3A2E24] space-y-2 text-xs">
                        <div className="flex justify-between text-text-secondary">
                          <span>Subtotal Produk</span>
                          <span className="font-mono font-bold text-text-primary">Rp {subtotalPrice.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-text-secondary">
                          <span>Ongkir / Biaya Ambil</span>
                          <span className="font-bold text-emerald-400">
                            {buyer.delivery_method === 'shipping' ? 'Ditagih terpisah / COD' : 'Gratis di Event'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-black pt-3 border-t border-[#3A2E24]">
                          <span className="uppercase text-text-primary">Total Pembayaran</span>
                          <span className="text-xl font-mono text-[#E8944A]">
                            Rp {subtotalPrice.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      {/* Submit CTA Button */}
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3.5 px-6 rounded-2xl bg-[#E8944A] hover:bg-[#E8944A]/90 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-[#E8944A]/25 transition disabled:opacity-50 active:scale-95"
                      >
                        {submitting ? (
                          <>
                            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            <span>Memproses Pesanan...</span>
                          </>
                        ) : (
                          <>
                            <FaCheck size={12} />
                            <span>Konfirmasi & Bayar Pesanan</span>
                          </>
                        )}
                      </button>

                      {/* Security notice */}
                      <div className="flex items-center gap-2 text-[10px] text-text-secondary justify-center pt-1">
                        <FaShieldAlt className="text-emerald-400" />
                        <span>Transaksi resmi & terverifikasi admin Kohi Sekai</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* =========================================================================
                    MOBILE SINGLE COLUMN LAYOUT (md:hidden)
                    ========================================================================= */}
                <div className="md:hidden space-y-5">
                  {/* Item Recap Pill */}
                  <div className="p-4 rounded-2xl bg-[#241E19] border border-[#3A2E24] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-text-primary flex items-center gap-1.5">
                        <FaShoppingBag className="text-[#E8944A]" />
                        <span>Item Dipesan ({totalItemCount})</span>
                      </span>
                      <span className="text-xs font-mono font-black text-[#E8944A]">
                        Rp {subtotalPrice.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pt-1">
                      {checkoutItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-[#3A2E24]/50 last:border-0">
                          <span className="text-text-primary font-bold truncate max-w-[200px]">
                            {item.nama} {item.size ? `(${item.size})` : ''} x{item.quantity}
                          </span>
                          <span className="font-mono text-text-secondary text-[11px]">
                            Rp {(Number(item.harga || 0) * (item.quantity || 1)).toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mobile Form Section: Data Penerima */}
                  <div className="p-4 rounded-2xl bg-[#241E19] border border-[#3A2E24] space-y-3">
                    <p className="text-xs font-black uppercase text-text-primary tracking-wider border-b border-[#3A2E24] pb-2">
                      1. Data Penerima
                    </p>

                    <div>
                      <label className="block text-[11px] font-bold text-text-secondary mb-1">
                        Nama Lengkap <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={buyer.nama}
                        onChange={(e) => setBuyer({ ...buyer, nama: e.target.value })}
                        placeholder="Nama lengkap"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1512] border border-[#3A2E24] text-xs text-text-primary focus:outline-none focus:border-[#E8944A]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-text-secondary mb-1">
                        No. WhatsApp <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={buyer.whatsapp}
                        onChange={(e) => setBuyer({ ...buyer, whatsapp: e.target.value })}
                        placeholder="08xxxxxxxxxx"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1512] border border-[#3A2E24] text-xs text-text-primary focus:outline-none focus:border-[#E8944A]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-text-secondary mb-1">
                        Instagram <span className="text-[10px] text-text-secondary font-normal">(opsional)</span>
                      </label>
                      <input
                        type="text"
                        value={buyer.instagram}
                        onChange={(e) => setBuyer({ ...buyer, instagram: e.target.value })}
                        placeholder="@username"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1512] border border-[#3A2E24] text-xs text-text-primary focus:outline-none focus:border-[#E8944A]"
                      />
                    </div>
                  </div>

                  {/* Mobile Form Section: Pengambilan / Pengiriman */}
                  <div className="p-4 rounded-2xl bg-[#241E19] border border-[#3A2E24] space-y-3">
                    <p className="text-xs font-black uppercase text-text-primary tracking-wider border-b border-[#3A2E24] pb-2">
                      2. Metode Pengambilan
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBuyer({ ...buyer, delivery_method: 'pickup_event' })}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          buyer.delivery_method === 'pickup_event'
                            ? 'bg-[#E8944A] text-white border-[#E8944A]'
                            : 'bg-[#1A1512] text-text-secondary border-[#3A2E24]'
                        }`}
                      >
                        <FaStore className="mb-1 text-sm" />
                        <p className="text-xs font-black leading-tight">Ambil di Event</p>
                        <p className="text-[10px] opacity-80 mt-0.5 leading-tight">Booth saat event</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBuyer({ ...buyer, delivery_method: 'shipping' })}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          buyer.delivery_method === 'shipping'
                            ? 'bg-[#E8944A] text-white border-[#E8944A]'
                            : 'bg-[#1A1512] text-text-secondary border-[#3A2E24]'
                        }`}
                      >
                        <FaTruck className="mb-1 text-sm" />
                        <p className="text-xs font-black leading-tight">Dikirim</p>
                        <p className="text-[10px] opacity-80 mt-0.5 leading-tight">Via kurir paket</p>
                      </button>
                    </div>

                    {buyer.delivery_method === 'shipping' && (
                      <div className="space-y-2.5 p-3 rounded-xl bg-[#1A1512] border border-[#E8944A]/30">
                        <div>
                          <label className="block text-[11px] font-bold text-text-secondary mb-1">
                            Alamat Lengkap <span className="text-red-400">*</span>
                          </label>
                          <textarea
                            rows={3}
                            required={buyer.delivery_method === 'shipping'}
                            value={buyer.shipping_address}
                            onChange={(e) => setBuyer({ ...buyer, shipping_address: e.target.value })}
                            placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan"
                            className="w-full px-3 py-2 rounded-xl bg-[#241E19] border border-[#3A2E24] text-xs text-text-primary focus:outline-none focus:border-[#E8944A]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-text-secondary mb-1">
                              Kota / Kab <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="text"
                              required={buyer.delivery_method === 'shipping'}
                              value={buyer.shipping_city}
                              onChange={(e) => setBuyer({ ...buyer, shipping_city: e.target.value })}
                              placeholder="Kota"
                              className="w-full px-3 py-2 rounded-xl bg-[#241E19] border border-[#3A2E24] text-xs text-text-primary focus:outline-none focus:border-[#E8944A]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-text-secondary mb-1">
                              Kode Pos
                            </label>
                            <input
                              type="text"
                              value={buyer.shipping_postal_code}
                              onChange={(e) => setBuyer({ ...buyer, shipping_postal_code: e.target.value })}
                              placeholder="12345"
                              className="w-full px-3 py-2 rounded-xl bg-[#241E19] border border-[#3A2E24] text-xs text-text-primary focus:outline-none focus:border-[#E8944A]"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold text-text-secondary mb-1">
                        Catatan Pesanan
                      </label>
                      <input
                        type="text"
                        value={buyer.catatan}
                        onChange={(e) => setBuyer({ ...buyer, catatan: e.target.value })}
                        placeholder="Catatan tambahan (opsional)"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A1512] border border-[#3A2E24] text-xs text-text-primary focus:outline-none focus:border-[#E8944A]"
                      />
                    </div>
                  </div>

                  {/* Mobile Form Section: Pembayaran */}
                  <div className="p-4 rounded-2xl bg-[#241E19] border border-[#3A2E24] space-y-3">
                    <p className="text-xs font-black uppercase text-text-primary tracking-wider border-b border-[#3A2E24] pb-2">
                      3. Pembayaran
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('tf')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                          paymentMethod === 'tf'
                            ? 'bg-[#E8944A] text-white border-[#E8944A] font-black'
                            : 'bg-[#1A1512] text-text-secondary border-[#3A2E24]'
                        }`}
                      >
                        Transfer BCA
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('qris')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                          paymentMethod === 'qris'
                            ? 'bg-[#E8944A] text-white border-[#E8944A] font-black'
                            : 'bg-[#1A1512] text-text-secondary border-[#3A2E24]'
                        }`}
                      >
                        QRIS
                      </button>
                    </div>

                    {paymentMethod === 'tf' && (
                      <div className="p-3.5 rounded-xl bg-[#1A1512] border border-[#3A2E24] flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-mono text-text-secondary">BCA {bankConfig.rekening}</p>
                          <p className="text-xs font-bold text-text-primary">a.n. {bankConfig.atas_nama}</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyRekening}
                          className="px-3 py-1.5 rounded-lg bg-[#241E19] border border-[#3A2E24] text-[#E8944A] text-xs font-bold flex items-center gap-1"
                        >
                          <FaCopy size={10} />
                          <span>{copiedRekening ? 'Tersalin' : 'Salin'}</span>
                        </button>
                      </div>
                    )}

                    {paymentMethod === 'qris' && (
                      <div className="p-3 rounded-xl bg-[#1A1512] border border-[#3A2E24] flex flex-col items-center text-center space-y-1.5">
                        <div className="w-36 h-36 bg-white rounded-lg p-2 flex items-center justify-center">
                          <FaQrcode size={80} className="text-black" />
                        </div>
                        <p className="text-[11px] font-bold text-text-primary">{bankConfig.qris_merchant}</p>
                      </div>
                    )}

                    <div className="pt-1">
                      <ImageUploadDropzone
                        label="Bukti Pembayaran (opsional)"
                        previewUrl={proofPreview}
                        onImageChange={(file, url) => {
                          setProofFile(file)
                          setProofPreview(url)
                        }}
                        onRemove={() => {
                          setProofFile(null)
                          setProofPreview('')
                        }}
                        compact={true}
                      />
                    </div>
                  </div>

                  {/* Mobile Sticky Bottom Checkout Bar */}
                  <div className="p-4 rounded-2xl bg-[#241E19] border border-[#3A2E24] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-secondary uppercase font-bold">Total Pembayaran</span>
                      <span className="text-base font-black text-[#E8944A] font-mono">
                        Rp {subtotalPrice.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 px-4 rounded-xl bg-[#E8944A] hover:bg-[#E8944A]/90 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition disabled:opacity-50 active:scale-95"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          <span>Memproses Pesanan...</span>
                        </>
                      ) : (
                        <>
                          <FaCheck size={11} />
                          <span>Konfirmasi & Bayar Pesanan</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </form>
            </div>
          )}

        </div>
      </main>

      <KSFooter />
    </div>
  )
}

export default KSMerchCheckoutPage


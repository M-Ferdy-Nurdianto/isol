import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  FaArrowLeft,
  FaShoppingBag,
  FaCreditCard,
  FaQrcode,
  FaUpload,
  FaCheckCircle,
  FaTrash,
  FaCopy,
  FaInfoCircle
} from 'react-icons/fa'
import { useMerchCart, useFanAuth } from '@shared/context'
import { kohiToast } from '../../components/ui/KohiToast'
import api from '../../lib/api'
import MobileAppShell from '../components/layout/MobileAppShell'

/**
 * KSMerchCheckoutPageMobile (Native-Feel Merchandise Checkout)
 * Strictly non-blocking WhatsApp/IG, 44x44px touch targets.
 */
const KSMerchCheckoutPageMobile = () => {
  const navigate = useNavigate()
  const { cartItems, totalPrice, totalItems, clearCart, removeFromCart } = useMerchCart()
  const { fanUser, isLoggedIn, openAuthModal } = useFanAuth()

  const [buyer, setBuyer] = useState({
    nama: fanUser?.nama || '',
    whatsapp: fanUser?.whatsapp && fanUser.whatsapp !== '-' ? fanUser.whatsapp : '',
    email: fanUser?.email || '',
    alamat: '',
    catatan: ''
  })

  const [paymentMethod, setPaymentMethod] = useState('bca')
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(null)

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      setFilePreview(URL.createObjectURL(f))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isLoggedIn) {
      openAuthModal()
      return
    }

    if (cartItems.length === 0) {
      kohiToast.error('Keranjang belanja kosong.')
      return
    }

    if (!buyer.nama.trim()) {
      kohiToast.error('Silakan isi nama lengkap penerima.')
      return
    }

    if (!buyer.alamat.trim()) {
      kohiToast.error('Silakan isi alamat pengiriman.')
      return
    }

    if (!file) {
      kohiToast.error('Silakan unggah bukti transfer pembayaran.')
      return
    }

    setSubmitting(true)
    let paymentProofUrl = ''

    try {
      const uploadData = new FormData()
      uploadData.append('file', file)
      const uploadRes = await api.post('/upload/payment-proof', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      paymentProofUrl = uploadRes.data?.data?.url || uploadRes.data?.url
    } catch (uploadErr) {
      kohiToast.error('Gagal mengunggah bukti bayar.')
      setSubmitting(false)
      return
    }

    try {
      const payload = {
        user_id: fanUser?.id || null,
        nama_lengkap: buyer.nama.trim(),
        whatsapp: buyer.whatsapp?.trim() || '-',
        email: buyer.email.trim().toLowerCase(),
        alamat_pengiriman: buyer.alamat.trim(),
        catatan: buyer.catatan.trim() || null,
        metode_pembayaran: paymentMethod === 'qris' ? 'QRIS' : 'Transfer Bank',
        total_price: totalPrice,
        payment_proof_url: paymentProofUrl,
        items: cartItems.map(item => ({
          merchandise_id: item.merchId || item.id,
          nama: item.nama,
          harga: item.harga,
          quantity: item.quantity,
          size: item.size || null
        }))
      }

      const res = await api.post('/merch-orders', payload)
      if (res.data?.success) {
        setOrderSuccess(res.data.order || { id: Date.now() })
        clearCart()
        kohiToast.success('Pesanan merchandise berhasil dikirim!')
      } else {
        throw new Error(res.data?.error || 'Gagal memproses pesanan')
      }
    } catch (err) {
      kohiToast.error(err.response?.data?.error || err.message || 'Gagal mengirim pesanan')
    } finally {
      setSubmitting(false)
    }
  }

  if (orderSuccess) {
    return (
      <MobileAppShell title="Pesanan Berhasil" hideBottomNav={true}>
        <div className="space-y-5 text-center py-6 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-[var(--surface)] border border-[var(--success)] flex items-center justify-center mx-auto text-[var(--success)]">
            <FaCheckCircle size={32} />
          </div>
          <div>
            <h2 className="text-lg font-black text-[var(--text-primary)]">
              Pesanan Merchandise Diterima!
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Admin kami akan memverifikasi pembayaran dan memproses pengiriman ke alamat Anda.
            </p>
          </div>
          <Link
            to="/profile"
            className="w-full touch-target py-3.5 rounded-2xl bg-[var(--primary)] text-[var(--background)] font-black text-xs uppercase tracking-wider flex items-center justify-center tap-active shadow-md"
          >
            Lihat Status di Profil
          </Link>
        </div>
      </MobileAppShell>
    )
  }

  if (cartItems.length === 0) {
    return (
      <MobileAppShell title="Keranjang Merchandise" showBack={true}>
        <div className="p-8 text-center space-y-4">
          <FaShoppingBag className="text-4xl text-[var(--text-secondary)] mx-auto opacity-40" />
          <p className="text-xs text-[var(--text-secondary)]">
            Keranjang belanja merchandise Anda masih kosong.
          </p>
          <Link
            to="/shop"
            className="inline-flex touch-target py-3 px-5 rounded-xl bg-[var(--primary)] text-[var(--background)] font-black text-xs uppercase tracking-wider tap-active shadow-sm"
          >
            Beli Merchandise
          </Link>
        </div>
      </MobileAppShell>
    )
  }

  return (
    <MobileAppShell title="Checkout Merchandise" showBack={true} hideBottomNav={true}>
      <form onSubmit={handleSubmit} className="space-y-4 pb-28">

        {/* Cart Review */}
        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-3.5 space-y-2.5">
          <div className="flex justify-between items-center text-xs font-bold text-[var(--text-secondary)] pb-1 border-b border-[var(--border)]">
            <span>Item Dipesan ({totalItems})</span>
            <span className="font-mono text-[var(--primary)]">Rp {totalPrice.toLocaleString('id-ID')}</span>
          </div>
          {cartItems.map((item) => (
            <div key={item.id} className="flex justify-between items-center text-xs py-1">
              <div>
                <p className="font-bold text-[var(--text-primary)]">{item.quantity}x {item.nama}</p>
                {item.size && <span className="text-[10px] text-[var(--text-secondary)]">Size: {item.size}</span>}
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="font-bold text-[var(--primary)]">Rp {(item.harga * item.quantity).toLocaleString('id-ID')}</span>
                <button type="button" onClick={() => removeFromCart(item.id)} className="text-[var(--danger)] tap-active">
                  <FaTrash size={10} />
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* Shipping Address & Details */}
        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 space-y-3">
          <span className="text-xs font-bold text-[var(--text-primary)] block">Data Penerima & Alamat</span>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Nama Lengkap *</label>
            <input
              type="text"
              value={buyer.nama}
              onChange={(e) => setBuyer({ ...buyer, nama: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">No. WhatsApp (opsional)</label>
            <input
              type="tel"
              value={buyer.whatsapp}
              onChange={(e) => setBuyer({ ...buyer, whatsapp: e.target.value })}
              placeholder="08123456789"
              className="w-full px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Alamat Lengkap Pengiriman *</label>
            <textarea
              value={buyer.alamat}
              onChange={(e) => setBuyer({ ...buyer, alamat: e.target.value })}
              placeholder="Jalan, No. Rumah, RT/RW, Kelurahan, Kecamatan, Kota, Kode Pos"
              rows={2}
              required
              className="w-full px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] resize-none"
            />
          </div>
        </section>

        {/* Payment & Proof */}
        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 space-y-3">
          <span className="text-xs font-bold text-[var(--text-primary)] block">Pembayaran BCA (8020123456)</span>
          <label className="w-full p-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)] flex flex-col items-center justify-center text-center cursor-pointer tap-active">
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            {filePreview ? (
              <span className="text-xs text-[var(--success)] font-bold">Bukti transfer dipilih</span>
            ) : (
              <span className="text-xs text-[var(--primary)] font-bold">Pilih Foto Bukti Transfer *</span>
            )}
          </label>
        </section>

      </form>

      {/* Sticky Bottom Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)] border-t border-[var(--border)] p-3.5 shadow-2xl"
        style={{ paddingBottom: 'calc(0.85rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono text-[var(--text-secondary)]">Total Pembayaran</span>
            <p className="text-lg font-black font-mono text-[var(--primary)] leading-none">
              Rp {totalPrice.toLocaleString('id-ID')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="touch-target py-3.5 px-6 rounded-2xl bg-[var(--primary)] text-[var(--background)] font-black text-xs uppercase tracking-wider flex items-center gap-2 tap-active shadow-md disabled:opacity-50"
          >
            {submitting ? 'Memproses...' : 'Kirim Pesanan'}
          </button>
        </div>
      </div>
    </MobileAppShell>
  )
}

export default KSMerchCheckoutPageMobile

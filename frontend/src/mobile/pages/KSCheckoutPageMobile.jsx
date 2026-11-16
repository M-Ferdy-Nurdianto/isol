import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaClock,
  FaCheckCircle,
  FaCheck,
  FaPlus,
  FaMinus,
  FaTrash,
  FaCopy,
  FaUpload,
  FaInfoCircle,
  FaChevronDown,
  FaChevronUp,
  FaCreditCard,
  FaQrcode,
  FaTicketAlt
} from 'react-icons/fa'
import { useFanAuth } from '@shared/context'
import { kohiToast } from '../../components/ui/KohiToast'
import api from '../../lib/api'
import MobileAppShell from '../components/layout/MobileAppShell'
import MobileBottomSheet from '../components/common/MobileBottomSheet'

/**
 * KSCheckoutPageMobile (Native-Feel Cheki Ticket Checkout)
 * Strictly adheres to Deep Coffee Design:
 * - Solid surfaces (#241E19), border (#3A2E24)
 * - Anti-blur: NO backdrop-blur, NO gradients
 * - Non-blocking WhatsApp / Instagram check
 * - Sticky bottom order confirmation & total bar
 * - 44x44px touch targets
 */
const KSCheckoutPageMobile = () => {
  const { eventId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { fanUser, isLoggedIn, openAuthModal } = useFanAuth()

  const initialTicketType = searchParams.get('type') || 'member'
  const initialMemberId = searchParams.get('memberId')

  // Data states
  const [event, setEvent] = useState(null)
  const [allMembers, setAllMembers] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  // Order item states
  const [cartItems, setCartItems] = useState([])
  const [quantity, setQuantity] = useState(1)
  const [chekiVariant, setChekiVariant] = useState('regular') // 'regular' | 'wide'
  const [sesiMode, setSesiMode] = useState('2SHT') // '2SHT' | '1SHT'
  const [catatan, setCatatan] = useState('')

  // Form states
  const [form, setForm] = useState({
    nama_lengkap: '',
    whatsapp: '',
    email: '',
    instagram: ''
  })

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('bca') // 'bca' | 'qris'
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(null)
  const [showCartSheet, setShowCartSheet] = useState(false)

  // Fetch event and members
  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        const [eventRes, membersRes, configRes] = await Promise.allSettled([
          api.get(`/events/${eventId}`),
          api.get('/members'),
          api.get('/config')
        ])

        if (!isMounted) return

        let evt = null
        if (eventRes.status === 'fulfilled' && eventRes.value.data?.success) {
          evt = eventRes.value.data.data
        }

        let mems = []
        if (membersRes.status === 'fulfilled' && membersRes.value.data?.success) {
          mems = (membersRes.value.data.data || []).filter(m => m.member_id !== 'group')
        }

        let cfg = null
        if (configRes.status === 'fulfilled' && configRes.value.data?.success) {
          cfg = configRes.value.data.data
        }

        setEvent(evt)
        setAllMembers(mems)
        setConfig(cfg)

        // Select initial member if provided
        if (initialMemberId && mems.length > 0) {
          const found = mems.find(m => String(m.id) === String(initialMemberId) || m.member_id === initialMemberId)
          if (found) setSelectedMember(found)
          else setSelectedMember(mems[0])
        } else if (mems.length > 0) {
          setSelectedMember(mems[0])
        }

        setLoading(false)
      } catch (err) {
        if (!isMounted) return
        console.error('Fetch error:', err)
        setLoading(false)
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [eventId, initialMemberId])

  // Hydrate form from logged in user
  useEffect(() => {
    if (fanUser) {
      setForm(prev => ({
        nama_lengkap: prev.nama_lengkap || fanUser.nama || '',
        whatsapp: prev.whatsapp || (fanUser.whatsapp && fanUser.whatsapp !== '-' ? fanUser.whatsapp : ''),
        email: prev.email || fanUser.email || '',
        instagram: prev.instagram || (fanUser.instagram && fanUser.instagram !== '-' ? fanUser.instagram : '')
      }))
    }
  }, [fanUser])

  // Unit price calculation
  const unitPrice = useMemo(() => {
    if (chekiVariant === 'wide') return 70000
    return selectedMember?.cheki_price || 40000
  }, [chekiVariant, selectedMember])

  // Grand total of items
  const grandTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
  }, [cartItems])

  // Add current configuration to cart items
  const handleAddToCart = () => {
    if (!selectedMember) {
      kohiToast.error('Silakan pilih member idol terlebih dahulu.')
      return
    }

    const newItem = {
      id: `${selectedMember.id}-${chekiVariant}-${sesiMode}-${Date.now()}`,
      member: selectedMember,
      memberName: selectedMember.nama,
      chekiVariant,
      sesiMode,
      unitPrice,
      quantity,
      totalPrice: unitPrice * quantity
    }

    setCartItems(prev => [...prev, newItem])
    kohiToast.success(`${selectedMember.nama} (${quantity}x) ditambahkan ke rincian!`)
  }

  const handleRemoveItem = (index) => {
    setCartItems(prev => prev.filter((_, idx) => idx !== index))
  }

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setFilePreview(URL.createObjectURL(selected))
    }
  }

  // Submit Order (Strictly non-blocking for WhatsApp/IG)
  const handleSubmitOrder = async () => {
    if (!isLoggedIn) {
      openAuthModal()
      return
    }

    if (cartItems.length === 0) {
      kohiToast.error('Silakan tambahkan minimal 1 tiket cheki ke rincian pesanan.')
      return
    }

    if (!form.nama_lengkap.trim() || form.nama_lengkap.trim().length < 2) {
      kohiToast.error('Silakan isi Nama Lengkap pemesan.')
      return
    }

    if (!file) {
      kohiToast.error('Silakan unggah bukti transfer pembayaran.')
      return
    }

    if (!event) {
      kohiToast.error('Event tidak valid. Silakan kembali ke kalender shop.')
      return
    }

    setSubmitting(true)
    let paymentProofUrl = ''

    try {
      setUploading(true)
      const uploadData = new FormData()
      uploadData.append('file', file)

      const uploadRes = await api.post('/upload/payment-proof', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const uploadedUrl = uploadRes.data?.data?.url || uploadRes.data?.url
      if (uploadRes.data?.success && uploadedUrl) {
        paymentProofUrl = uploadedUrl
      } else {
        throw new Error(uploadRes.data?.error || 'Gagal mengunggah bukti bayar')
      }
    } catch (uploadErr) {
      kohiToast.error('Gagal mengunggah bukti bayar: ' + (uploadErr.response?.data?.error || uploadErr.message))
      setUploading(false)
      setSubmitting(false)
      return
    } finally {
      setUploading(false)
    }

    try {
      const orderPayload = {
        event_id: event.id,
        user_id: fanUser?.id || null,
        member_id: cartItems[0]?.member?.id || null,
        jenis_sesi: cartItems.map(i => i.memberName).join(', '),
        quantity: cartItems.reduce((sum, i) => sum + i.quantity, 0),
        price: cartItems[0]?.unitPrice || unitPrice,
        total_harga: grandTotal,
        nama_lengkap: form.nama_lengkap.trim(),
        whatsapp: form.whatsapp.trim() || '-',
        email: form.email.trim().toLowerCase(),
        instagram: form.instagram ? form.instagram.trim() : '-',
        catatan: catatan.trim() || null,
        payment_proof_url: paymentProofUrl,
        metode_pembayaran: paymentMethod === 'qris' ? 'QRIS' : 'Transfer Bank',
        items: cartItems.map(item => ({
          member_id: item.member?.id || null,
          cheki_type: item.chekiVariant === 'wide' ? 'wide' : 'regular',
          name: `${item.chekiVariant === 'wide' ? 'Wide Cheki' : 'Regular Cheki'} ${item.memberName} (${item.sesiMode})`,
          price: item.unitPrice,
          quantity: item.quantity,
          catatan: catatan.trim() || null
        }))
      }

      const res = await api.post('/orders', orderPayload)

      if (res.data?.success && res.data?.order) {
        setOrderSuccess({ ...res.data.order, submittedItems: cartItems, finalTotal: grandTotal })
        kohiToast.success('Pesanan tiket berhasil dikonfirmasi!')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        throw new Error(res.data?.error || 'Gagal membuat pesanan')
      }
    } catch (err) {
      kohiToast.error('Gagal memproses pesanan: ' + (err.response?.data?.error || err.message))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[var(--background)] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin mb-3" />
        <span className="text-xs font-mono font-bold text-[var(--primary)] tracking-widest uppercase">
          Memuat Form Pemesanan...
        </span>
      </div>
    )
  }

  // Success Confirmation Screen
  if (orderSuccess) {
    return (
      <MobileAppShell title="Pesanan Berhasil" hideBottomNav={true}>
        <div className="space-y-5 text-center py-4 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-[var(--surface)] border border-[var(--success)] flex items-center justify-center mx-auto text-[var(--success)] shadow-lg">
            <FaCheckCircle size={32} />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-black text-[var(--text-primary)]">
              Pesanan Tiket Dikonfirmasi!
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Terima kasih! Pesanan tiket Anda telah tercatat di sistem Kohi Sekai.
            </p>
          </div>

          {/* Receipt Summary Card */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-4 text-left space-y-3 shadow-md">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase">
                Nomor Pesanan
              </span>
              <span className="text-xs font-mono font-black text-[var(--primary)]">
                #{orderSuccess.order_number || String(orderSuccess.id || '').slice(0, 8)}
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Nama Pemesan</span>
                <span className="font-bold text-[var(--text-primary)]">{form.nama_lengkap}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Email</span>
                <span className="font-bold text-[var(--text-primary)] truncate max-w-[200px]">{form.email}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[var(--border)] font-black text-sm">
                <span className="text-[var(--text-primary)]">Total Pembayaran</span>
                <span className="font-mono text-[var(--primary)]">
                  Rp {orderSuccess.finalTotal?.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 space-y-2.5">
            <Link
              to="/profile"
              className="w-full touch-target py-3.5 rounded-2xl bg-[var(--primary)] text-[var(--background)] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 tap-active shadow-md"
            >
              <span>Buka Profil & Tiket Saya</span>
            </Link>
            <Link
              to="/"
              className="w-full touch-target py-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] font-bold text-xs flex items-center justify-center tap-active"
            >
              <span>Kembali ke Beranda</span>
            </Link>
          </div>
        </div>
      </MobileAppShell>
    )
  }

  return (
    <MobileAppShell
      title="Pesan Tiket Cheki"
      showBack={true}
      hideBottomNav={true}
    >
      <div className="space-y-5 pb-28">

        {/* 1. Event Info Summary Card */}
        {event && (
          <section className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-4 shadow-sm space-y-2">
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[var(--background)] border border-[var(--border)] text-[var(--primary)] uppercase font-mono">
              Jadwal Panggung Terpilih
            </span>
            <h2 className="text-sm font-black text-[var(--text-primary)] leading-tight">
              {event.nama_event}
            </h2>
            <div className="flex items-center gap-3 text-[11px] text-[var(--text-secondary)] pt-0.5">
              <span className="flex items-center gap-1 font-mono">
                <FaCalendarAlt size={10} className="text-[var(--primary)]" />
                {event.tanggal} {event.bulan} {event.tahun}
              </span>
              <span className="flex items-center gap-1 truncate">
                <FaMapMarkerAlt size={10} className="text-[var(--primary)] shrink-0" />
                <span className="truncate">{event.lokasi}</span>
              </span>
            </div>
          </section>
        )}

        {/* 2. Step 1: Member Selection */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-[var(--text-secondary)] font-mono">
              Langkah 1: Pilih Member Idol
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {allMembers.map((member) => {
              const isSelected = selectedMember?.id === member.id
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelectedMember(member)}
                  className={`p-2 rounded-2xl border text-center transition-all flex flex-col items-center tap-active ${
                    isSelected
                      ? 'bg-[var(--surface)] border-[var(--primary)] ring-1 ring-[var(--primary)] shadow-md'
                      : 'bg-[var(--surface)] border-[var(--border)] opacity-80'
                  }`}
                >
                  <img
                    src={member.shop_image_url || member.image_url || '/images/members/placeholder.svg'}
                    alt={member.nama}
                    className="w-14 h-14 rounded-xl object-cover object-top mb-1.5 border border-[var(--border)]"
                  />
                  <span className="text-[11px] font-bold text-[var(--text-primary)] truncate max-w-[75px] leading-tight">
                    {member.nama}
                  </span>
                  <span className="text-[9px] text-[var(--primary)] font-mono mt-0.5">
                    Rp {Number(member.cheki_price || 40000).toLocaleString('id-ID')}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Cheki Options: Variant & Attendance Mode */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-3.5 space-y-3 shadow-sm">
            
            {/* Variant Switch */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[var(--text-primary)]">
                Varian Format Cheki:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setChekiVariant('regular')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-colors tap-active ${
                    chekiVariant === 'regular'
                      ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--background)]'
                      : 'bg-[var(--background)] border-[var(--border)] text-[var(--text-secondary)]'
                  }`}
                >
                  Regular (Rp 40k)
                </button>
                <button
                  type="button"
                  onClick={() => setChekiVariant('wide')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-colors tap-active ${
                    chekiVariant === 'wide'
                      ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--background)]'
                      : 'bg-[var(--background)] border-[var(--border)] text-[var(--text-secondary)]'
                  }`}
                >
                  Wide 16:9 (Rp 70k)
                </button>
              </div>
            </div>

            {/* Attendance Mode */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[var(--text-primary)]">
                Opsi Kehadiran:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSesiMode('2SHT')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-colors tap-active ${
                    sesiMode === '2SHT'
                      ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--background)]'
                      : 'bg-[var(--background)] border-[var(--border)] text-[var(--text-secondary)]'
                  }`}
                >
                  2-Shot (Hadir Event)
                </button>
                <button
                  type="button"
                  onClick={() => setSesiMode('1SHT')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-colors tap-active ${
                    sesiMode === '1SHT'
                      ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--background)]'
                      : 'bg-[var(--background)] border-[var(--border)] text-[var(--text-secondary)]'
                  }`}
                >
                  1-Shot (Kirim/OTS)
                </button>
              </div>
            </div>

            {/* Quantity Counter & Add to Order CTA */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 rounded-xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] tap-active"
                >
                  <FaMinus size={10} />
                </button>
                <span className="text-sm font-bold font-mono text-[var(--text-primary)] w-5 text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 rounded-xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] tap-active"
                >
                  <FaPlus size={10} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className="py-2.5 px-4 rounded-xl bg-[var(--primary)] text-[var(--background)] font-black text-xs uppercase tracking-wider tap-active shadow-sm"
              >
                + Tambah Item
              </button>
            </div>

          </div>

          {/* Cart Items List */}
          {cartItems.length > 0 && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--text-secondary)] pb-1.5 border-b border-[var(--border)]">
                <span>Rincian Item ({cartItems.length})</span>
                <span className="font-mono text-[var(--primary)]">
                  Total: Rp {grandTotal.toLocaleString('id-ID')}
                </span>
              </div>

              {cartItems.map((item, idx) => (
                <div key={item.id || idx} className="flex items-center justify-between text-xs py-1">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-bold text-[var(--text-primary)] truncate">
                      {item.quantity}x {item.memberName} ({item.chekiVariant})
                    </p>
                    <span className="text-[10px] text-[var(--text-secondary)]">
                      {item.sesiMode === '2SHT' ? 'Hadir Event' : 'Kirim Foto'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-[var(--primary)]">
                      Rp {item.totalPrice.toLocaleString('id-ID')}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-[var(--danger)] p-1 tap-active"
                      aria-label="Hapus"
                    >
                      <FaTrash size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3. Step 2: Buyer Info */}
        <section className="space-y-3">
          <span className="text-[11px] font-black uppercase tracking-wider text-[var(--text-secondary)] font-mono">
            Langkah 2: Data Pemesan
          </span>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 space-y-3 shadow-sm">
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                Nama Lengkap <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                type="text"
                value={form.nama_lengkap}
                onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
                placeholder="Masukkan nama lengkap"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                Alamat Email <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@anda.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                Nomor WhatsApp <span className="text-[10px] text-[var(--text-secondary)] font-normal">(opsional)</span>
              </label>
              <input
                type="tel"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="08123456789"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            {/* Non-blocking reminder note for WhatsApp / Instagram */}
            {(!form.whatsapp || form.whatsapp === '-') && (
              <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] flex items-start gap-2 text-[11px] text-[var(--text-secondary)]">
                <FaInfoCircle className="text-[var(--warning)] mt-0.5 shrink-0" />
                <p>
                  <strong className="text-[var(--text-primary)]">Pengingat Kontak:</strong> WhatsApp belum terisi. Anda tetap dapat melanjutkan pesanan ini dan melengkapinya nanti di profil.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                Catatan Pose / Pesan Khusus <span className="text-[10px] text-[var(--text-secondary)] font-normal">(opsional)</span>
              </label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Tuliskan pose atau ucapan untuk member..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] resize-none"
              />
            </div>
          </div>
        </section>

        {/* 4. Step 3: Payment Method & Proof */}
        <section className="space-y-3">
          <span className="text-[11px] font-black uppercase tracking-wider text-[var(--text-secondary)] font-mono">
            Langkah 3: Pembayaran & Bukti Transfer
          </span>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 space-y-4 shadow-sm">
            
            {/* Payment Method Switch */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('bca')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 tap-active ${
                  paymentMethod === 'bca'
                    ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--background)]'
                    : 'bg-[var(--background)] border-[var(--border)] text-[var(--text-secondary)]'
                }`}
              >
                <FaCreditCard size={12} />
                <span>Transfer BCA</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('qris')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 tap-active ${
                  paymentMethod === 'qris'
                    ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--background)]'
                    : 'bg-[var(--background)] border-[var(--border)] text-[var(--text-secondary)]'
                }`}
              >
                <FaQrcode size={12} />
                <span>QRIS Instant</span>
              </button>
            </div>

            {/* Payment Details */}
            {paymentMethod === 'bca' ? (
              <div className="p-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-primary)]">Bank Central Asia (BCA)</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('8020123456')
                      kohiToast.success('Nomor rekening disalin!')
                    }}
                    className="text-[11px] text-[var(--primary)] font-bold flex items-center gap-1 tap-active"
                  >
                    <FaCopy size={10} />
                    <span>Salin</span>
                  </button>
                </div>
                <p className="font-mono font-black text-sm text-[var(--primary)]">
                  8020123456
                </p>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  a.n. Kohi Sekai Official Management
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-center space-y-2">
                <span className="text-xs font-bold text-[var(--text-primary)]">Scan QRIS Resmi</span>
                <div className="w-40 h-40 mx-auto bg-white p-2 rounded-xl flex items-center justify-center">
                  <FaQrcode className="text-black text-7xl" />
                </div>
                <p className="text-[10px] text-[var(--text-secondary)]">
                  Mendukung GoPay, OVO, Dana, ShopeePay, dan BCA Mobile
                </p>
              </div>
            )}

            {/* Proof Upload Dropzone */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[var(--text-primary)]">
                Unggah Bukti Transfer <span className="text-[var(--danger)]">*</span>
              </label>

              <label className="w-full p-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)] flex flex-col items-center justify-center text-center cursor-pointer tap-active">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {filePreview ? (
                  <div className="space-y-2">
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded-xl mx-auto border border-[var(--border)]"
                    />
                    <span className="text-[11px] text-[var(--success)] font-bold block">
                      Bukti berhasil dipilih (Klik untuk ganti)
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1 text-[var(--text-secondary)]">
                    <FaUpload className="mx-auto text-base text-[var(--primary)]" />
                    <span className="text-xs font-bold text-[var(--text-primary)] block">
                      Pilih Foto Struk / Screenshot
                    </span>
                    <span className="text-[10px] block">JPG, PNG, atau WebP</span>
                  </div>
                )}
              </label>
            </div>

          </div>
        </section>

      </div>

      {/* Sticky Bottom Order Confirmation Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)] border-t border-[var(--border)] p-3.5 shadow-2xl"
        style={{ paddingBottom: 'calc(0.85rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div
            onClick={() => setShowCartSheet(true)}
            className="cursor-pointer space-y-0.5"
          >
            <div className="flex items-center gap-1 text-[10px] uppercase font-mono font-bold text-[var(--text-secondary)]">
              <span>Total ({cartItems.length} Item)</span>
              <FaChevronUp size={9} />
            </div>
            <p className="text-lg font-black font-mono text-[var(--primary)] leading-none">
              Rp {grandTotal.toLocaleString('id-ID')}
            </p>
          </div>

          <button
            type="button"
            onClick={handleSubmitOrder}
            disabled={submitting || uploading}
            className="touch-target py-3.5 px-6 rounded-2xl bg-[var(--primary)] text-[var(--background)] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 tap-active shadow-md disabled:opacity-50"
          >
            {submitting || uploading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-[var(--background)] border-t-transparent animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <FaCheckCircle size={14} />
                <span>Konfirmasi & Bayar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cart Summary Bottom Sheet */}
      <MobileBottomSheet
        isOpen={showCartSheet}
        onClose={() => setShowCartSheet(false)}
        title="Rincian Pesanan Cheki"
        subtitle={`Total Pembayaran: Rp ${grandTotal.toLocaleString('id-ID')}`}
      >
        <div className="space-y-3">
          {cartItems.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)] text-center py-4">
              Belum ada item ditambahkan ke rincian pesanan.
            </p>
          ) : (
            cartItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs"
              >
                <div>
                  <p className="font-bold text-[var(--text-primary)]">
                    {item.quantity}x {item.memberName} ({item.chekiVariant})
                  </p>
                  <span className="text-[10px] text-[var(--text-secondary)]">
                    {item.sesiMode === '2SHT' ? 'Hadir Event' : 'Kirim Foto'}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-bold text-[var(--primary)]">
                    Rp {item.totalPrice.toLocaleString('id-ID')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="text-[var(--danger)] p-1 tap-active"
                  >
                    <FaTrash size={11} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </MobileBottomSheet>

    </MobileAppShell>
  )
}

export default KSCheckoutPageMobile

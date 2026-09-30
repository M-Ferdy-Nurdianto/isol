import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaClock,
  FaUsers,
  FaCheckCircle,
  FaCheck,
  FaUpload,
  FaCopy,
  FaWhatsapp,
  FaInstagram,
  FaUser,
  FaExternalLinkAlt,
  FaTicketAlt,
  FaQrcode,
  FaCreditCard,
  FaPlus,
  FaTrash,
  FaShoppingCart,
  FaChevronUp,
  FaChevronDown,
  FaUserCheck,
  FaEdit
} from 'react-icons/fa'
import KSHeader from '../components/KSHeader'
import FanAuthModal from '../components/auth/FanAuthModal'
import { useFanAuth } from '../context/FanAuthContext'
import { kohiToast } from '../components/ui/KohiToast'
import api from '../lib/api'
import { getAssetPath } from '../lib/pathUtils'

const KSCheckoutPage = () => {
  const { eventId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { fanUser, isLoggedIn, openAuthModal } = useFanAuth()

  const [ticketType, setTicketType] = useState(() => searchParams.get('type') || 'member') // 'member' or 'group'
  const memberId = searchParams.get('memberId')

  // Refs for smooth scroll UX
  const step2Ref = useRef(null)

  // Data states
  const [event, setEvent] = useState(null)
  const [allMembers, setAllMembers] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  // Order cart & form states
  const [cartItems, setCartItems] = useState([])
  const [quantity, setQuantity] = useState(1)
  const [chekiVariant, setChekiVariant] = useState('regular') // 'regular' (40k) | 'wide' (70k)
  const [sesiMode, setSesiMode] = useState('2SHT') // '2SHT' (Hadir Event) | '1SHT' (Tidak Datang)
  const [catatan, setCatatan] = useState('') // Global note for the order
  const [isMobileSummaryExpanded, setIsMobileSummaryExpanded] = useState(false)

  const [form, setForm] = useState({
    nama_lengkap: '',
    whatsapp: '',
    email: '',
    instagram: '',
  })

  // Group member record from allMembers if present
  const groupMember = useMemo(() => {
    return allMembers.find(m => {
      const idStr = String(m.id || m.member_id || '').toLowerCase()
      const nameStr = String(m.nama_panggung || '').toLowerCase()
      return idStr === 'group' || idStr === 'kohisekai' || nameStr.includes('group') || nameStr.includes('kohi sekai')
    })
  }, [allMembers])

  // Determine if Group Cheki is active globally
  const isGroupEnabled = useMemo(() => {
    if (groupMember && (groupMember.hadir === false || groupMember.hadir === 'false')) {
      return false
    }
    if (config) {
      if (
        config.enable_group_cheki === 'false' || config.enable_group_cheki === false ||
        config.enable_group === 'false' || config.enable_group === false
      ) {
        return false
      }
    }
    return true
  }, [groupMember, config])

  // Filter active individual members (hadir !== false) & match event lineup
  const filteredMembers = useMemo(() => {
    const eventLineup = event?.event_lineup || event?.lineup || []
    const hasLineup = Array.isArray(eventLineup) && eventLineup.length > 0

    return allMembers.filter(m => {
      if (m.hadir === false || m.hadir === 'false') {
        return false
      }

      const idStr = String(m.id || m.member_id || '').toLowerCase()
      const nameStr = String(m.nama_panggung || '').toLowerCase()
      if (
        idStr === 'group' || 
        idStr === 'kohisekai' || 
        nameStr.includes('kohi sekai') || 
        nameStr.includes('group cheki')
      ) {
        return false
      }

      if (hasLineup) {
        const isMemberInLineup = eventLineup.some(l => {
          const lId = String(typeof l === 'object' ? l.member_id || l.id : l).toLowerCase()
          return lId === idStr || lId === String(m.id).toLowerCase()
        })
        if (!isMemberInLineup) return false
      }

      return true
    })
  }, [allMembers, event])

  // Enforce fan authentication on load
  useEffect(() => {
    if (!isLoggedIn) {
      openAuthModal()
    }
  }, [isLoggedIn])

  // Payment states
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(null)
  const [copiedRekening, setCopiedRekening] = useState(false)
  const fileInputRef = useRef(null)

  // Pre-fill form from logged-in fan user
  useEffect(() => {
    if (fanUser) {
      setForm({
        nama_lengkap: fanUser.nama || '',
        whatsapp: fanUser.whatsapp || '',
        email: fanUser.email || '',
        instagram: fanUser.instagram || '',
      })
    }
  }, [fanUser])

  // Fetch event and member details
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventRes, membersRes, configRes] = await Promise.allSettled([
          api.get('/events'),
          api.get('/members'),
          api.get('/config'),
        ])

        if (configRes.status === 'fulfilled' && configRes.value.data?.success) {
          setConfig(configRes.value.data.data)
        }

        let ev = null
        if (eventRes.status === 'fulfilled' && eventRes.value.data?.success) {
          const allEvents = eventRes.value.data.data || []
          ev = allEvents.find(e => String(e.id) === String(eventId)) || allEvents[0]
        }
        setEvent(ev)

        if (membersRes.status === 'fulfilled' && membersRes.value.data?.success) {
          const fetchedMembers = membersRes.value.data.data || []
          setAllMembers(fetchedMembers)

          if (memberId) {
            const m = fetchedMembers.find(m => 
              String(m.id).toLowerCase() === String(memberId).toLowerCase() || 
              String(m.member_id).toLowerCase() === String(memberId).toLowerCase()
            )
            setSelectedMember(m || fetchedMembers[0] || null)
          } else if (fetchedMembers.length > 0) {
            setSelectedMember(fetchedMembers[0])
          }
        }
      } catch (err) {
        console.error('Error fetching checkout info:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [eventId, memberId])

  // Automatically adjust ticketType if group is disabled or selectedMember is invalid
  useEffect(() => {
    if (!isGroupEnabled && ticketType === 'group') {
      setTicketType('member')
    }
    if (filteredMembers.length > 0 && (!selectedMember || !filteredMembers.some(m => m.id === selectedMember.id || m.member_id === selectedMember.member_id))) {
      setSelectedMember(filteredMembers[0])
    }
  }, [isGroupEnabled, ticketType, filteredMembers, selectedMember])

  // Custom Price Options & Config prices
  const customOptions = useMemo(() => {
    if (!config?.cheki_custom_options) return []
    try {
      const parsed = typeof config.cheki_custom_options === 'string'
        ? JSON.parse(config.cheki_custom_options)
        : config.cheki_custom_options
      return Array.isArray(parsed) ? parsed : []
    } catch (e) {
      return []
    }
  }, [config])

  const regularPrice = config?.harga_cheki_per_member ? Number(config.harga_cheki_per_member) : 40000
  const widePrice = config?.harga_cheki_grup ? Number(config.harga_cheki_grup) : 70000
  const groupChekiPrice = config?.harga_group_cheki ? Number(config.harga_group_cheki) : 100000

  // Pricing calculations
  const basePrice = useMemo(() => {
    if (ticketType === 'group') {
      return groupChekiPrice
    }
    if (chekiVariant === 'regular') {
      return regularPrice
    }
    if (chekiVariant === 'wide') {
      return widePrice
    }
    const foundCustom = customOptions.find(opt => opt.id === chekiVariant || opt.label === chekiVariant)
    if (foundCustom) {
      return Number(foundCustom.price || 50000)
    }
    return regularPrice
  }, [ticketType, chekiVariant, regularPrice, widePrice, groupChekiPrice, customOptions])

  const urlPrice = searchParams.get('price') ? Number(searchParams.get('price')) : null
  const unitPrice = urlPrice || basePrice
  const totalPrice = unitPrice * quantity
  const chekiPriceId = searchParams.get('priceId') || null

  // Member selection handler with smooth scroll to Step 2
  const handleSelectMember = (m) => {
    setTicketType('member')
    setSelectedMember(m)
    setTimeout(() => {
      step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 100)
  }

  const handleSelectGroup = () => {
    setTicketType('group')
    setTimeout(() => {
      step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 100)
  }

  // Cart item management
  const handleAddToCart = () => {
    const isGroup = ticketType === 'group'
    const memberName = isGroup ? 'Group Cheki (Full Member)' : (selectedMember?.nama_panggung || 'Member')
    const memberPhoto = isGroup
      ? '/images/members/placeholder.svg'
      : (selectedMember?.shop_image_url || selectedMember?.image_url || '/images/members/placeholder.svg')

    const newItem = {
      id: Date.now() + Math.random(),
      ticketType,
      member: isGroup ? null : selectedMember,
      memberName,
      memberPhoto,
      chekiVariant,
      sesiMode,
      unitPrice,
      quantity,
      totalPrice,
    }

    setCartItems(prev => [...prev, newItem])
    kohiToast.success(`${memberName} (${quantity}x) ditambahkan ke Rincian Pesanan!`)
  }

  const handleRemoveCartItem = (indexToRemove) => {
    setCartItems(prev => prev.filter((_, idx) => idx !== indexToRemove))
    kohiToast.info('Item berhasil dihapus dari rincian pesanan.')
  }

  // Strictly calculate total from items currently added to cart (0 if cart is empty)
  const grandTotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.totalPrice, 0)
  }, [cartItems])

  // Payment account & QRIS info from config or fallback
  const enableTf = config ? (config.payment_enable_tf !== 'false' && config.payment_enable_tf !== false) : true
  const enableQris = config ? (config.payment_enable_qris !== 'false' && config.payment_enable_qris !== false) : true
  const qrisImageUrl = config?.payment_qris_image_url || ''
  const bankName = config?.payment_bank || config?.bank_name || 'BCA (Bank Central Asia)'
  const rekeningNumber = config?.payment_rekening || config?.no_rekening || '1234567890'
  const rekeningName = config?.payment_atas_nama || config?.atas_nama || 'Kohi Sekai Official'

  const [paymentMethodSelected, setPaymentMethodSelected] = useState('tf')

  useEffect(() => {
    if (!enableTf && enableQris) {
      setPaymentMethodSelected('qris')
    } else if (enableTf && !enableQris) {
      setPaymentMethodSelected('tf')
    }
  }, [enableTf, enableQris])

  const handleCopyRekening = () => {
    navigator.clipboard.writeText(rekeningNumber.replace(/[^0-9]/g, ''))
    setCopiedRekening(true)
    kohiToast.success('Nomor rekening berhasil disalin!')
    setTimeout(() => setCopiedRekening(false), 2000)
  }

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected) {
      if (!selected.type.startsWith('image/')) {
        kohiToast.error('Hanya file gambar yang diperbolehkan (JPG, PNG, WebP).')
        return
      }
      setFile(selected)
      const reader = new FileReader()
      reader.onloadend = () => setFilePreview(reader.result)
      reader.readAsDataURL(selected)
    }
  }

  const handleSubmitOrder = async (e) => {
    if (e && e.preventDefault) e.preventDefault()

    if (!isLoggedIn) {
      openAuthModal()
      return
    }

    if (cartItems.length === 0) {
      kohiToast.error('Silakan tambahkan minimal 1 item cheki ke rincian pesanan terlebih dahulu.')
      return
    }

    const itemsToSubmit = [...cartItems]
    const finalTotal = grandTotal

    if (!form.nama_lengkap.trim() || form.nama_lengkap.trim().length < 2) {
      kohiToast.error('Silakan isi Nama Lengkap pemesan.')
      return
    }

    if (!form.whatsapp.trim() || form.whatsapp.trim().length < 8) {
      kohiToast.error('Silakan isi nomor WhatsApp aktif.')
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
      console.error('Upload failed:', uploadErr)
      kohiToast.error('Gagal mengunggah bukti bayar: ' + (uploadErr.response?.data?.error || uploadErr.message))
      setUploading(false)
      setSubmitting(false)
      return
    } finally {
      setUploading(false)
    }

    try {
      const firstItem = itemsToSubmit[0]
      const orderPayload = {
        event_id: event.id,
        user_id: fanUser?.id || null,
        member_id: firstItem?.ticketType === 'group' ? null : (firstItem?.member?.id || null),
        cheki_price_id: chekiPriceId,
        jenis_sesi: itemsToSubmit.map(i => i.memberName).join(', '),
        quantity: itemsToSubmit.reduce((sum, i) => sum + i.quantity, 0),
        price: firstItem?.unitPrice || unitPrice,
        total_harga: finalTotal,
        nama_lengkap: form.nama_lengkap.trim(),
        whatsapp: form.whatsapp.trim(),
        email: form.email.trim().toLowerCase(),
        instagram: form.instagram ? form.instagram.trim() : null,
        catatan: catatan.trim() || null,
        payment_proof_url: paymentProofUrl,
        metode_pembayaran: paymentMethodSelected === 'qris' ? 'QRIS' : 'Transfer Bank',
        items: itemsToSubmit.map(item => ({
          member_id: item.ticketType === 'group' ? 'group' : (item.member?.id || item.member?.member_id || null),
          name: `${item.memberName} (${item.sesiMode === '1SHT' ? '1-Shot' : '2-Shot'} - ${item.chekiVariant === 'wide' ? 'Wide' : 'Regular'})`,
          price: item.unitPrice,
          quantity: item.quantity,
          catatan: catatan.trim() || null
        }))
      }

      const res = await api.post('/orders', orderPayload)

      if (res.data?.success && res.data?.order) {
        setOrderSuccess({ ...res.data.order, submittedItems: itemsToSubmit, finalTotal })
        kohiToast.success('Pesanan tiket berhasil dikonfirmasi!')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        throw new Error(res.data?.error || 'Gagal menyimpan pesanan')
      }
    } catch (orderErr) {
      console.error('Order creation error:', orderErr)
      kohiToast.error('Gagal memproses pesanan: ' + (orderErr.response?.data?.error || orderErr.message))
    } finally {
      setSubmitting(false)
    }
  }

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

  const activeSelectedPhoto = ticketType === 'group' 
    ? '/images/members/placeholder.svg' 
    : (selectedMember?.shop_image_url || selectedMember?.image_url || '/images/members/placeholder.svg')

  return (
    <div className="min-h-screen bg-background text-text-primary selection:bg-primary/30">
      <KSHeader />

      <main className="pt-24 sm:pt-28 pb-32 lg:pb-24">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* === NAVIGATION BREADCRUMB === */}
          <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
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
            <form onSubmit={handleSubmitOrder} className="space-y-8">

              {/* === FULL-WIDTH TOP SECTION (BEFORE 2 COLUMNS) === */}
              <div className="space-y-6">

                {/* HEADING TITLE */}
                <div>
                  <span className="text-xs font-black tracking-widest text-primary uppercase block mb-1">
                    Kohi Stage Official Checkout
                  </span>
                  <h1 className="text-3xl sm:text-5xl font-black uppercase text-text-primary tracking-tight leading-none">
                    Konfirmasi Pemesanan
                  </h1>
                  <p className="text-xs sm:text-sm text-text-secondary mt-2 font-medium">
                    Pilih idol favoritmu dan tentukan opsi sesi cheki sebelum menyelesaikan pembayaran.
                  </p>
                </div>

                {/* 1. NAMA EVENT / JADWAL PANGGUNG BANNER */}
                {event && (
                  <div className="p-6 rounded-3xl bg-surface border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                        Jadwal Panggung
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-text-primary uppercase tracking-wide">
                      {event.nama}
                    </h3>
                    <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm text-text-secondary font-medium border-t border-border/60 pt-3">
                      <span className="flex items-center gap-2">
                        <FaCalendarAlt className="text-primary" />
                        <strong className="text-text-primary">{event.tanggal} {event.bulan} {event.tahun}</strong>
                      </span>
                      <span className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-primary" />
                        <strong className="text-text-primary">{event.lokasi}</strong>
                      </span>
                      <span className="flex items-center gap-2">
                        <FaClock className="text-primary" />
                        <strong className="text-text-primary">{event.cheki_time || event.event_time || 'Sesi Cheki'}</strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* 2. INFORMASI PEMBELI BANNER (READ-ONLY WITH UBAH PROFIL LINK) */}
                <div className="p-6 rounded-3xl bg-surface border border-border space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <FaUserCheck className="text-success" />
                      <h2 className="text-base sm:text-lg font-black uppercase text-text-primary tracking-tight">
                        Informasi Pembeli
                      </h2>
                    </div>
                    <Link
                      to="/profile"
                      className="px-4 py-2 rounded-xl bg-background border border-border text-xs font-bold text-primary hover:border-primary transition-colors inline-flex items-center gap-2"
                    >
                      <FaEdit size={12} />
                      <span>Ubah Profil</span>
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div className="p-3.5 rounded-2xl bg-background border border-border">
                      <span className="text-text-secondary block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                        Nama Lengkap
                      </span>
                      <span className="font-bold text-text-primary text-sm truncate block">
                        {form.nama_lengkap || '-'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-background border border-border">
                      <span className="text-text-secondary block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                        Alamat Email
                      </span>
                      <span className="font-bold text-text-primary text-sm truncate block">
                        {form.email || '-'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-background border border-border">
                      <span className="text-text-secondary block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                        Nomor WhatsApp
                      </span>
                      <span className="font-bold text-text-primary text-sm truncate block">
                        {form.whatsapp || '-'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-background border border-border">
                      <span className="text-text-secondary block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                        Akun Instagram
                      </span>
                      <span className="font-bold text-text-primary text-sm truncate block">
                        {form.instagram || '-'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* === 2-COLUMN DESKTOP GRID === */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">

                {/* === KOLOM KIRI (lg:col-span-7) === */}
                <div className="lg:col-span-7 space-y-8">

                  {/* 1. PILIH LINEUP MEMBER */}
                  <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 space-y-6">
                    <div className="flex items-center justify-between border-b border-border pb-4">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary block">
                          Langkah 1 Dari 3
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black uppercase text-text-primary tracking-tight">
                          Pilih Lineup Member
                        </h2>
                      </div>
                      <span className="text-xs font-bold text-text-secondary bg-surface border border-border px-3.5 py-1.5 rounded-full">
                        {filteredMembers.length} Member Available
                      </span>
                    </div>

                    {/* Member Lineup Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {/* Group Cheki Option Card (Only shown if active) */}
                      {isGroupEnabled && (
                        <button
                          type="button"
                          onClick={handleSelectGroup}
                          className="group text-left flex flex-col cursor-pointer focus:outline-none"
                        >
                          <div
                            className={`relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-surface border transition-all duration-300 flex flex-col items-center justify-center p-4 ${
                              ticketType === 'group'
                                ? 'border-primary ring-2 ring-primary/40 shadow-lg scale-[1.02]'
                                : 'border-border opacity-75 hover:opacity-100 hover:border-text-secondary/50 hover:-translate-y-1'
                            }`}
                          >
                            {ticketType === 'group' && (
                              <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-md z-10">
                                <FaCheck size={11} />
                              </div>
                            )}
                            <div className="w-14 h-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                              <FaUsers size={26} />
                            </div>
                            <span className="text-xs font-black uppercase text-text-primary text-center tracking-wide block">
                              Group Cheki
                            </span>
                            <span className="text-[10px] text-text-secondary text-center mt-1 font-medium">
                              Full Member
                            </span>
                          </div>
                        </button>
                      )}

                      {/* Individual Member Cards */}
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
                              className={`relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-surface border transition-all duration-300 ${
                                isSelected
                                  ? 'border-primary ring-2 ring-primary/40 shadow-lg scale-[1.02]'
                                  : 'border-border opacity-75 hover:opacity-100 hover:border-text-secondary/50 hover:-translate-y-1'
                              }`}
                            >
                              {/* Selected Checkmark Badge in Top Right */}
                              {isSelected && (
                                <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-md z-10">
                                  <FaCheck size={11} />
                                </div>
                              )}

                              <img
                                src={getAssetPath(photoSrc)}
                                alt={m.nama_panggung}
                                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                                onError={(e) => {
                                  e.target.onerror = null
                                  e.target.src = getAssetPath('/images/members/placeholder.svg')
                                }}
                              />
                              <div className="absolute inset-x-0 bottom-0 pt-8 pb-3 px-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-left">
                                <span className="text-xs font-black uppercase text-white tracking-wide block truncate">
                                  {m.nama_panggung}
                                </span>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* 2. DETAIL & OPSI CHEKI */}
                  <div ref={step2Ref} className="bg-surface border border-border rounded-3xl p-6 sm:p-8 space-y-6">
                    <div className="border-b border-border pb-4 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary block">
                          Langkah 2 Dari 3
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black uppercase text-text-primary tracking-tight">
                          Detail & Opsi Tiket Cheki
                        </h2>
                      </div>
                    </div>

                    {/* Selected Member Hero Showcase Panel */}
                    <div className="p-5 rounded-2xl bg-background border border-border flex flex-col sm:flex-row items-center gap-6">
                      <div className="w-24 h-32 sm:w-28 sm:h-36 aspect-[3/4] rounded-xl overflow-hidden bg-surface border border-border shrink-0">
                        <img
                          src={getAssetPath(activeSelectedPhoto)}
                          alt={ticketType === 'group' ? 'Group Cheki' : (selectedMember?.nama_panggung || 'Member')}
                          className="w-full h-full object-cover object-top"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src = getAssetPath('/images/members/placeholder.svg')
                          }}
                        />
                      </div>

                      <div className="space-y-1 text-center sm:text-left flex-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary block">
                          {ticketType === 'group' ? 'Full Member Group Stage' : (selectedMember?.tagline || 'Kohi Sekai Idol')}
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-black uppercase text-text-primary tracking-tight leading-tight">
                          {ticketType === 'group' ? 'Group Cheki' : (selectedMember?.nama_panggung || 'Member')}
                        </h3>
                        <p className="text-xs text-text-secondary pt-1 font-medium">
                          Harga Satuan Sesi: <strong className="text-text-primary font-mono font-bold">Rp {unitPrice.toLocaleString('id-ID')}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Radio Option Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                      {/* Tipe Ukuran Cheki & Custom Options */}
                      <div className="space-y-2">
                        <label className="block text-xs font-black uppercase tracking-wider text-text-secondary mb-2">
                          Tipe & Opsi Sesi Polaroid
                        </label>

                        {ticketType === 'group' ? (
                          <label className="p-4 rounded-2xl border bg-primary/10 border-primary text-text-primary font-bold flex items-center justify-between min-h-[56px]">
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                checked
                                readOnly
                                className="accent-primary w-4 h-4"
                              />
                              <div>
                                <span className="text-xs font-black uppercase text-text-primary block">Group Cheki (Full Member)</span>
                                <span className="text-[10px] text-text-secondary block font-normal">Sesi Foto Bersama Seluruh Idol Stage</span>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-text-primary font-mono">
                              Rp {groupChekiPrice.toLocaleString('id-ID')}
                            </span>
                          </label>
                        ) : (
                          <>
                            <label
                              onClick={() => setChekiVariant('regular')}
                              className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-center justify-between min-h-[56px] ${
                                chekiVariant === 'regular'
                                  ? 'bg-primary/10 border-primary text-text-primary font-bold'
                                  : 'bg-background border-border text-text-secondary hover:border-text-secondary/40'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name="chekiVariant"
                                  value="regular"
                                  checked={chekiVariant === 'regular'}
                                  onChange={() => setChekiVariant('regular')}
                                  className="accent-primary w-4 h-4 cursor-pointer"
                                />
                                <div>
                                  <span className="text-xs font-black uppercase text-text-primary block">Regular Cheki</span>
                                  <span className="text-[10px] text-text-secondary block font-normal">Ukuran Standar</span>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-text-primary font-mono">
                                Rp {regularPrice.toLocaleString('id-ID')}
                              </span>
                            </label>

                            <label
                              onClick={() => setChekiVariant('wide')}
                              className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-center justify-between min-h-[56px] ${
                                chekiVariant === 'wide'
                                  ? 'bg-primary/10 border-primary text-text-primary font-bold'
                                  : 'bg-background border-border text-text-secondary hover:border-text-secondary/40'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name="chekiVariant"
                                  value="wide"
                                  checked={chekiVariant === 'wide'}
                                  onChange={() => setChekiVariant('wide')}
                                  className="accent-primary w-4 h-4 cursor-pointer"
                                />
                                <div>
                                  <span className="text-xs font-black uppercase text-text-primary block">Wide Cheki</span>
                                  <span className="text-[10px] text-text-secondary block font-normal">Ukuran Ekstra Lebar</span>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-text-primary font-mono">
                                Rp {widePrice.toLocaleString('id-ID')}
                              </span>
                            </label>

                            {/* Custom options added by Admin */}
                            {customOptions.map((opt) => (
                              <label
                                key={opt.id}
                                onClick={() => setChekiVariant(opt.label)}
                                className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-center justify-between min-h-[56px] ${
                                  chekiVariant === opt.label
                                    ? 'bg-primary/10 border-primary text-text-primary font-bold'
                                    : 'bg-background border-border text-text-secondary hover:border-text-secondary/40'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type="radio"
                                    name="chekiVariant"
                                    value={opt.label}
                                    checked={chekiVariant === opt.label}
                                    onChange={() => setChekiVariant(opt.label)}
                                    className="accent-primary w-4 h-4 cursor-pointer"
                                  />
                                  <div>
                                    <span className="text-xs font-black uppercase text-text-primary block">{opt.label}</span>
                                    <span className="text-[10px] text-text-secondary block font-normal">{opt.description || 'Opsi Sesi Kustom'}</span>
                                  </div>
                                </div>
                                <span className="text-xs font-bold text-text-primary font-mono">
                                  Rp {Number(opt.price || 0).toLocaleString('id-ID')}
                                </span>
                              </label>
                            ))}
                          </>
                        )}
                      </div>

                      {/* Mode Sesi Radio Option */}
                      <div className="space-y-2">
                        <label className="block text-xs font-black uppercase tracking-wider text-text-secondary mb-2">
                          Opsi Kehadiran
                        </label>

                        <label
                          onClick={() => setSesiMode('2SHT')}
                          className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-center justify-between min-h-[56px] ${
                            sesiMode === '2SHT'
                              ? 'bg-primary/10 border-primary text-text-primary font-bold'
                              : 'bg-background border-border text-text-secondary hover:border-text-secondary/40'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="sesiMode"
                              value="2SHT"
                              checked={sesiMode === '2SHT'}
                              onChange={() => setSesiMode('2SHT')}
                              className="accent-primary w-4 h-4 cursor-pointer"
                            />
                            <div>
                              <span className="text-xs font-black uppercase text-text-primary block">2-Shot (Hadir Event)</span>
                              <span className="text-[10px] text-text-secondary block font-normal">Foto bareng di lokasi event</span>
                            </div>
                          </div>
                        </label>

                        <label
                          onClick={() => setSesiMode('1SHT')}
                          className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-center justify-between min-h-[56px] ${
                            sesiMode === '1SHT'
                              ? 'bg-primary/10 border-primary text-text-primary font-bold'
                              : 'bg-background border-border text-text-secondary hover:border-text-secondary/40'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="sesiMode"
                              value="1SHT"
                              checked={sesiMode === '1SHT'}
                              onChange={() => setSesiMode('1SHT')}
                              className="accent-primary w-4 h-4 cursor-pointer"
                            />
                            <div>
                              <span className="text-xs font-black uppercase text-text-primary block">1-Shot (Tidak Datang)</span>
                              <span className="text-[10px] text-text-secondary block font-normal">Foto solo member (nitip pose)</span>
                            </div>
                          </div>
                        </label>
                      </div>

                    </div>

                    {/* Quantity Stepper Bar */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-background border border-border">
                      <div>
                        <span className="text-xs font-black uppercase text-text-primary block">Jumlah Tiket</span>
                        <span className="text-[10px] text-text-secondary font-medium">Maksimal 10 tiket per item</span>
                      </div>

                      <div className="flex items-center rounded-xl bg-surface border border-border p-1">
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-background transition-colors text-sm font-black min-h-[36px]"
                        >
                          -
                        </button>
                        <span className="w-10 text-center text-sm font-black text-text-primary font-mono">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.min(10, quantity + 1))}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-background transition-colors text-sm font-black min-h-[36px]"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Button: Tambah ke Rincian Pesanan (Solid Color) */}
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="w-full py-4 px-6 rounded-2xl bg-primary hover:bg-primary-hover text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all active:scale-[0.99] min-h-[48px]"
                    >
                      <FaPlus size={14} />
                      <span>Tambah ke Rincian Pesanan</span>
                    </button>
                  </div>

                  {/* 3. METODE PEMBAYARAN & UPLOAD BUKTI TRANSFER */}
                  <div className="bg-surface border border-border rounded-3xl p-6 sm:p-8 space-y-6">
                    <div className="border-b border-border pb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary block">
                        Langkah 3 Dari 3
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black uppercase text-text-primary tracking-tight">
                        Metode Pembayaran
                      </h2>
                    </div>

                    <div className="space-y-4">
                      {/* Payment Method Switch Tabs */}
                      {enableTf && enableQris && (
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setPaymentMethodSelected('tf')}
                            className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 min-h-[46px] ${
                              paymentMethodSelected === 'tf'
                                ? 'bg-primary/10 border-primary text-text-primary font-bold'
                                : 'bg-background border-border text-text-secondary hover:border-text-secondary/40'
                            }`}
                          >
                            <FaCreditCard size={16} />
                            <span className="text-xs uppercase font-black">Transfer Bank</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPaymentMethodSelected('qris')}
                            className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 min-h-[46px] ${
                              paymentMethodSelected === 'qris'
                                ? 'bg-primary/10 border-primary text-text-primary font-bold'
                                : 'bg-background border-border text-text-secondary hover:border-text-secondary/40'
                            }`}
                          >
                            <FaQrcode size={16} />
                            <span className="text-xs uppercase font-black">Scan QRIS</span>
                          </button>
                        </div>
                      )}

                      {/* Bank Transfer Info Card */}
                      {paymentMethodSelected === 'tf' && (
                        <div className="p-4 rounded-2xl bg-background border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-text-secondary">
                              {bankName}
                            </span>
                            <p className="font-mono text-lg font-black text-text-primary tracking-wider mt-0.5">
                              {rekeningNumber}
                            </p>
                            <p className="text-xs text-text-secondary">
                              a.n. <strong className="text-text-primary font-bold">{rekeningName}</strong>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyRekening}
                            className="px-4 py-2 rounded-xl bg-surface border border-border text-xs font-bold text-text-primary hover:border-primary transition-colors shrink-0 flex items-center gap-2"
                          >
                            <FaCopy className="text-primary" />
                            <span>{copiedRekening ? 'Tersalin!' : 'Salin Rekening'}</span>
                          </button>
                        </div>
                      )}

                      {/* QRIS Code Info */}
                      {paymentMethodSelected === 'qris' && (
                        <div className="p-5 rounded-2xl bg-background border border-border flex flex-col items-center text-center space-y-3">
                          {qrisImageUrl ? (
                            <img
                              src={qrisImageUrl}
                              alt="QRIS Barcode"
                              className="w-48 h-48 object-contain rounded-xl border border-border bg-white p-2"
                            />
                          ) : (
                            <div className="w-48 h-48 flex flex-col items-center justify-center bg-surface rounded-xl p-3 text-text-secondary">
                              <FaQrcode size={56} className="mb-2 text-text-secondary" />
                              <span className="text-xs font-black uppercase text-text-primary">QRIS Kohi Sekai</span>
                            </div>
                          )}
                          <p className="text-xs text-text-secondary max-w-sm leading-relaxed">
                            Buka aplikasi mobile banking atau e-wallet (GoPay, Dana, OVO, ShopeePay), scan barcode QRIS di atas dan masukkan nominal pembayaran.
                          </p>
                        </div>
                      )}

                      {/* Proof Upload Dropzone */}
                      <div className="space-y-2 pt-2">
                        <label className="block text-xs font-black uppercase tracking-wider text-text-secondary">
                          Unggah Bukti Transfer / Pembayaran <span className="text-danger">*</span>
                        </label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />

                        {filePreview ? (
                          <div className="p-4 rounded-2xl border border-border bg-background flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 truncate">
                              <img
                                src={filePreview}
                                alt="Bukti Transfer"
                                className="w-14 h-14 object-cover rounded-xl border border-border"
                              />
                              <div className="truncate">
                                <span className="text-xs font-bold truncate text-text-primary block">{file?.name}</span>
                                <span className="text-[10px] text-text-secondary block">
                                  {(file?.size / 1024).toFixed(1)} KB · Siap diunggah
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="text-xs font-bold text-primary hover:underline shrink-0"
                            >
                              Ganti File
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-border hover:border-primary rounded-2xl p-6 text-center cursor-pointer transition-colors bg-background flex flex-col items-center justify-center space-y-2 group"
                          >
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                              <FaUpload size={18} />
                            </div>
                            <span className="text-xs font-bold text-text-primary block">
                              Klik untuk upload foto bukti transfer
                            </span>
                            <span className="text-[10px] text-text-secondary block">
                              Format didukung: JPG, PNG, WebP (Maks 10MB)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

                {/* === KOLOM KANAN (STICKY DESKTOP) (lg:col-span-5) === */}
                <div className="hidden lg:block lg:col-span-5 sticky top-28 space-y-6">
                  <div className="bg-surface border border-border rounded-3xl p-6 space-y-6">
                    <div className="border-b border-border pb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FaShoppingCart className="text-primary" />
                        <h3 className="text-lg font-black uppercase text-text-primary tracking-tight">
                          Rincian Pesanan
                        </h3>
                      </div>
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full font-mono border border-primary/20">
                        {cartItems.length} Item
                      </span>
                    </div>

                    {/* Itemized Cart List */}
                    {cartItems.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-background border border-dashed border-border text-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                          <FaTicketAlt size={16} />
                        </div>
                        <p className="text-xs font-bold text-text-primary">
                          Belum ada item ditambahkan ke rincian
                        </p>
                        <p className="text-[10px] text-text-secondary leading-relaxed">
                          Pilih member dan opsi cheki di kolom kiri, lalu klik <strong>"Tambah ke Rincian Pesanan"</strong>.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {cartItems.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="p-3.5 rounded-2xl bg-background border border-border flex items-center justify-between gap-3 hover:border-primary/40 transition-colors"
                          >
                            <div className="flex items-center gap-3 truncate">
                              <div className="w-10 h-12 aspect-[3/4] rounded-lg overflow-hidden bg-surface border border-border shrink-0">
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
                              <div className="truncate space-y-0.5">
                                <h5 className="text-xs font-black uppercase text-text-primary truncate">
                                  {item.memberName}
                                </h5>
                                <span className="text-[10px] text-text-secondary block truncate">
                                  {item.quantity}x {item.chekiVariant} ({item.sesiMode})
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs font-black text-primary font-mono">
                                Rp {item.totalPrice.toLocaleString('id-ID')}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveCartItem(idx)}
                                className="text-text-secondary hover:text-danger transition-colors p-1"
                                title="Hapus Item"
                              >
                                <FaTrash size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* SATU KOLOM CATATAN / REQUEST POSE UNTUK KESELURUHAN PESANAN */}
                    <div className="pt-2 border-t border-border">
                      <label className="block text-xs font-black uppercase tracking-wider text-text-secondary mb-2">
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

                    {/* Grand Total Display (0 if cart is empty) */}
                    <div className="pt-4 border-t border-border space-y-1">
                      <span className="text-[10px] uppercase font-bold text-text-secondary tracking-widest block">
                        Total Akhir Pembayaran
                      </span>
                      <div className="text-3xl sm:text-4xl font-black text-primary font-mono leading-none">
                        Rp {grandTotal.toLocaleString('id-ID')}
                      </div>
                    </div>

                    {/* Solid Primary Action Button */}
                    <button
                      type="submit"
                      disabled={submitting || uploading}
                      className="w-full py-4 px-6 rounded-2xl bg-primary hover:bg-primary-hover text-white font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-h-[50px] active:scale-[0.99]"
                    >
                      {submitting || uploading ? (
                        <>
                          <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          <span>Memproses Pesanan...</span>
                        </>
                      ) : (
                        <>
                          <FaCheckCircle size={16} />
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

      {/* === MOBILE STICKY BOTTOM SUMMARY BAR (lg:hidden) === */}
      {!orderSuccess && (
        <div className="lg:hidden fixed bottom-[76px] left-3 right-3 z-40 bg-surface border border-border shadow-lg rounded-2xl p-4 transition-all">
          <div className="w-full space-y-3">

            {/* Expandable Order Details Panel */}
            <AnimatePresence>
              {isMobileSummaryExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pb-3 border-b border-border space-y-3 max-h-56 overflow-y-auto"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-text-secondary border-b border-border/50 pb-2">
                    <span>Rincian Cart ({cartItems.length} Item)</span>
                    <button
                      type="button"
                      onClick={() => setIsMobileSummaryExpanded(false)}
                      className="text-primary font-bold"
                    >
                      Tutup
                    </button>
                  </div>

                  {cartItems.length === 0 ? (
                    <p className="text-xs text-text-secondary text-center py-2">
                      Belum ada item ditambahkan ke rincian.
                    </p>
                  ) : (
                    cartItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1">
                        <span className="font-bold text-text-primary truncate max-w-[200px]">
                          {item.quantity}x {item.memberName} ({item.chekiVariant})
                        </span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-bold text-primary">Rp {item.totalPrice.toLocaleString('id-ID')}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCartItem(idx)}
                            className="text-danger"
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Sticky Row */}
            <div className="flex items-center justify-between gap-3">
              <div
                onClick={() => setIsMobileSummaryExpanded(!isMobileSummaryExpanded)}
                className="cursor-pointer space-y-0.5"
              >
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-text-secondary">
                  <span>Total Akhir Pembayaran</span>
                  {isMobileSummaryExpanded ? <FaChevronDown size={10} /> : <FaChevronUp size={10} />}
                </div>
                <div className="text-xl font-black text-primary font-mono leading-none">
                  Rp {grandTotal.toLocaleString('id-ID')}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={submitting || uploading}
                className="py-3.5 px-6 rounded-xl bg-primary hover:bg-primary-hover text-white font-black text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 min-h-[44px] shrink-0 active:scale-95"
              >
                {submitting || uploading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>
                    <FaCheckCircle size={14} />
                    <span>Lanjut Bayar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Fan Authentication Modal */}
      <FanAuthModal />
    </div>
  )
}

export default KSCheckoutPage

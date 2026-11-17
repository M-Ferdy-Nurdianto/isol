import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useFanAuth } from '../../context/FanAuthContext'
import { kohiToast } from '../../components/ui/KohiToast'
import api from '../../lib/api'

const CheckoutContext = createContext(null)

export function CheckoutProvider({ children }) {
  const { eventId } = useParams()
  const [searchParams] = useSearchParams()
  const { fanUser, isLoggedIn, openAuthModal } = useFanAuth()

  const [ticketType, setTicketType] = useState(() => searchParams.get('type') || 'member') // 'member' or 'group'
  const memberId = searchParams.get('memberId')

  // Data states
  const [event, setEvent] = useState(null)
  const [allMembers, setAllMembers] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  // Order cart & form states
  const [cartItems, setCartItems] = useState([])
  const [quantity, setQuantity] = useState(1)
  const [chekiVariant, setChekiVariant] = useState('regular') // 'regular' | 'wide' | custom
  const [sesiMode, setSesiMode] = useState('2SHT') // '2SHT' (Hadir Event) | '1SHT' (Tidak Datang)
  const [catatan, setCatatan] = useState('')

  const [form, setForm] = useState({
    nama_lengkap: '',
    whatsapp: '',
    email: '',
    instagram: '',
  })

  // Payment states
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(null)
  const [copiedRekening, setCopiedRekening] = useState(false)
  const [paymentMethodSelected, setPaymentMethodSelected] = useState('tf')

  // Group member record from allMembers if present
  const groupMember = useMemo(() => {
    return allMembers.find(m => {
      const idStr = String(m.id || m.member_id || '').toLowerCase()
      const nameStr = String(m.nama_panggung || '').toLowerCase()
      return idStr === 'group' || idStr === 'kohisekai' || nameStr.includes('group') || nameStr.includes('kohi sekai')
    })
  }, [allMembers])

  // 3 Toggle Independent
  const isRegularEnabled = useMemo(() => {
    if (!config) return true
    return config.regular_cheki_enabled !== 'false' && config.regular_cheki_enabled !== false
  }, [config])

  const wideChekiEnabled = useMemo(() => {
    if (!config) return false
    return config.wide_cheki_enabled === 'true' || config.wide_cheki_enabled === true
  }, [config])

  const chekiGrupEnabled = useMemo(() => {
    if (!config) return false
    if (groupMember && (groupMember.hadir === false || groupMember.hadir === 'false')) return false
    return config.cheki_grup_enabled === 'true' || config.cheki_grup_enabled === true
  }, [groupMember, config])

  const isGroupEnabled = chekiGrupEnabled

  // Filter active individual members
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

  // Auto-select first available chekiVariant when toggles change
  useEffect(() => {
    if (chekiVariant === 'regular' && !isRegularEnabled) {
      if (wideChekiEnabled) setChekiVariant('wide')
      else if (customOptions.length > 0) setChekiVariant(customOptions[0].label)
    }
    if (chekiVariant === 'wide' && !wideChekiEnabled) {
      if (isRegularEnabled) setChekiVariant('regular')
      else if (customOptions.length > 0) setChekiVariant(customOptions[0].label)
    }
  }, [isRegularEnabled, wideChekiEnabled, chekiVariant, customOptions])

  // Pricelist
  const regularPrice = config?.harga_cheki_per_member ? Number(config.harga_cheki_per_member) : 40000
  const widePrice = config?.harga_cheki_grup ? Number(config.harga_cheki_grup) : 70000
  const groupChekiPrice = config?.harga_cheki_grup_po ? Number(config.harga_cheki_grup_po) : 150000

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

  const handleSelectMember = (m) => {
    setTicketType('member')
    setSelectedMember(m)
  }

  const handleSelectGroup = () => {
    setTicketType('group')
  }

  const handleAddToCart = () => {
    const isGroup = ticketType === 'group'
    let finalChekiType = chekiVariant === 'wide' ? 'wide' : 'regular'
    if (isGroup) finalChekiType = 'grup'

    let finalLabelPrefix = 'Regular Cheki'
    let memberName = ''
    if (isGroup) {
      memberName = 'Cheki Grup (Semua Member)'
    } else {
      if (finalChekiType === 'wide') finalLabelPrefix = 'Wide Cheki (16:9)'
      memberName = `${finalLabelPrefix} ${selectedMember?.nama_panggung || 'Member'}`
    }

    const memberPhoto = isGroup
      ? '/images/members/group.webp'
      : (selectedMember?.shop_image_url || selectedMember?.image_url || '/images/members/placeholder.svg')

    const newItem = {
      id: Date.now() + Math.random(),
      ticketType,
      member: isGroup ? null : selectedMember,
      memberName,
      memberPhoto,
      chekiVariant,
      cheki_type: finalChekiType,
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

  const grandTotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.totalPrice, 0)
  }, [cartItems])

  // Payment settings
  const enableTf = config ? (config.payment_enable_tf !== 'false' && config.payment_enable_tf !== false) : true
  const enableQris = config ? (config.payment_enable_qris === 'true' || config.payment_enable_qris === true) : false
  const qrisImageUrl = config?.payment_qris_image_url || ''
  const qrisMerchantName = config?.payment_qris_merchant_name || 'Kohi Sekai Official'
  const bankName = config?.payment_bank || 'BCA'
  const rekeningNumber = config?.payment_rekening || '0902683273'
  const rekeningName = config?.payment_atas_nama || 'Kohi Sekai Official'

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
        items: itemsToSubmit.map(item => {
          const ct = item.cheki_type || (item.ticketType === 'group' ? 'grup' : (item.chekiVariant === 'wide' ? 'wide' : 'regular'))
          let finalName = item.memberName
          if (item.ticketType !== 'group' && !item.memberName.includes('Cheki')) {
            const prefix = ct === 'wide' ? 'Wide Cheki (16:9)' : 'Regular Cheki'
            finalName = `${prefix} ${item.memberName}`
          }
          return {
            member_id: ct === 'grup' ? 'grup' : (item.member?.id || item.member?.member_id || null),
            cheki_type: ct,
            name: `${finalName} (${item.sesiMode === '1SHT' ? '1-Shot' : '2-Shot'})`,
            price: item.unitPrice,
            quantity: item.quantity,
            catatan: catatan.trim() || null
          }
        })
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

  const value = {
    // Event & members
    eventId,
    event,
    allMembers,
    filteredMembers,
    selectedMember,
    setSelectedMember,
    ticketType,
    setTicketType,
    groupMember,
    handleSelectMember,
    handleSelectGroup,
    isRegularEnabled,
    wideChekiEnabled,
    chekiGrupEnabled,
    isGroupEnabled,
    // Pricing
    config,
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
    // Cart
    cartItems,
    setCartItems,
    handleAddToCart,
    handleRemoveCartItem,
    grandTotal,
    catatan,
    setCatatan,
    // Form & Auth
    form,
    setForm,
    fanUser,
    isLoggedIn,
    openAuthModal,
    // Payment
    file,
    setFile,
    filePreview,
    setFilePreview,
    uploading,
    submitting,
    orderSuccess,
    setOrderSuccess,
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
    loading,
  }

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  )
}

export function useCheckout() {
  const context = useContext(CheckoutContext)
  if (!context) {
    throw new Error('useCheckout must be used within a CheckoutProvider')
  }
  return context
}

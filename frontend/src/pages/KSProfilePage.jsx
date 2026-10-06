import { toPng } from 'html-to-image'
import { groupTitlesByPeriod } from '../lib/fanTitleUtils'
import DigitalReceipt from '../components/shop/DigitalReceipt'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaUser, FaEnvelope, FaWhatsapp, FaInstagram, FaSignOutAlt, 
  FaHistory, FaTicketAlt, FaCheck, FaHourglassHalf, FaExternalLinkAlt, 
  FaReceipt, FaCamera, FaSpinner, FaEdit, FaSave, FaTimes, FaShoppingBag,
  FaCheckCircle, FaCopy, FaCalendarAlt, FaQrcode, FaDownload, FaCrown, FaTrophy
} from 'react-icons/fa'
import { useFanAuth } from '../context/FanAuthContext'
import KSHeader from '../components/KSHeader'
import { kohiToast } from '../components/ui/KohiToast'
import ImageCropModal from '../components/ImageCropModal'
import api from '../lib/api'

const KSProfilePage = () => {
  const navigate = useNavigate()
  const { fanUser, isLoggedIn, logout, updateProfile } = useFanAuth()
  
  const [orders, setOrders] = useState([])
  const [fanTitles, setFanTitles] = useState([])
  const [showTitlesModal, setShowTitlesModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [cropModalData, setCropModalData] = useState(null)
  
  const [activeTab, setActiveTab] = useState('profile') // 'profile' or 'history'
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null)
  const [orderTypeFilter, setOrderTypeFilter] = useState('all') // 'all', 'po', 'ots'
  const [copiedId, setCopiedId] = useState(null)
  const [downloadingOrderId, setDownloadingOrderId] = useState(null)
  const [downloadingOrder, setDownloadingOrder] = useState(null)
  const receiptDownloadRef = useRef(null)

  const groupedTitles = groupTitlesByPeriod(fanTitles)

  const handleDirectDownload = async (order) => {
    const orderId = order.id || order.order_number
    try {
      setDownloadingOrderId(orderId)
      setDownloadingOrder(order)
      
      // Wait for offscreen render
      await new Promise(resolve => setTimeout(resolve, 280))

      if (receiptDownloadRef.current) {
        const dataUrl = await toPng(receiptDownloadRef.current, {
          quality: 0.95,
          pixelRatio: 2,
          backgroundColor: '#ffffff'
        })
        const link = document.createElement('a')
        const orderNum = order.order_number || order.id?.substring(0, 8) || 'receipt'
        link.download = `Nota-${orderNum}.png`
        link.href = dataUrl
        link.click()
        kohiToast.success('Nota berhasil diunduh!')
      }
    } catch (err) {
      console.error('Failed to download receipt:', err)
      kohiToast.error('Gagal mengunduh nota. Silakan coba lagi.')
    } finally {
      setDownloadingOrderId(null)
      setDownloadingOrder(null)
    }
  }

  const handleCopyOrderNumber = (orderNum) => {
    if (!orderNum) return
    navigator.clipboard.writeText(orderNum)
    setCopiedId(orderNum)
    kohiToast.success('Nomor pesanan disalin!')
    setTimeout(() => setCopiedId(null), 2000)
  }
  
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    nama: fanUser?.nama || '',
    whatsapp: fanUser?.whatsapp || '',
    instagram: fanUser?.instagram || ''
  })

  const avatarInputRef = useRef(null)
  const bannerInputRef = useRef(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { replace: true, state: { from: '/profile' } })
    }
  }, [isLoggedIn, navigate])

  useEffect(() => {
    if (fanUser?.email) {
      setLoading(true)
      api.get(`/auth/fan/orders?email=${encodeURIComponent(fanUser.email)}${fanUser?.id ? `&user_id=${fanUser.id}` : ""}`)
        .then(res => {
          if (res.data?.success) {
            setOrders(res.data.data || [])
          }
        })
        .catch(err => {
          console.error('Error fetching order history:', err)
        })
        .finally(() => setLoading(false))
    }
  }, [fanUser?.email])

  useEffect(() => {
    if (fanUser?.nama || fanUser?.email) {
      api.get(`/leaderboard/fan-titles?name=${encodeURIComponent(fanUser.nama || '')}&email=${encodeURIComponent(fanUser.email || '')}`)
        .then(res => {
          if (res.data?.success) {
            setFanTitles(res.data.data || [])
          }
        })
        .catch(err => console.error('Failed to load fan titles:', err))
    }
  }, [fanUser?.nama, fanUser?.email])


  if (!isLoggedIn || !fanUser) return null

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true)
      const token = localStorage.getItem('ks_fan_token')
      const cleanForm = {
        nama: profileForm.nama.trim(),
        whatsapp: profileForm.whatsapp.replace(/[^0-9+]/g, ''),
        instagram: profileForm.instagram.replace(/^@/, '').trim()
      }
      
      const res = await api.put('/auth/fan/profile', cleanForm, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (res.data?.success) {
        updateProfile(cleanForm)
        setIsEditingProfile(false)
        kohiToast.success('Profil berhasil diperbarui')
      }
    } catch (err) {
      kohiToast.error(err.response?.data?.error || 'Gagal memperbarui profil')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleImageChange = (event, type) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      kohiToast.error('Format file tidak didukung. Harap upload gambar.')
      return
    }

    const reader = new FileReader()
    reader.addEventListener('load', () => {
      setCropModalData({
        imageSrc: reader.result?.toString() || '',
        isBanner: type === 'banner',
        type
      })
      if (event.target) event.target.value = null
    })
    reader.readAsDataURL(file)
  }

  const handleUploadCroppedImage = async (file) => {
    if (!cropModalData) return
    const { isBanner, type } = cropModalData
    setCropModalData(null)

    isBanner ? setUploadingBanner(true) : setUploadingAvatar(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const uploadRes = await api.post(`/upload/fan-image?type=${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (uploadRes.data?.success) {
        const imageUrl = uploadRes.data.data.url
        const token = localStorage.getItem('ks_fan_token')
        const updateRes = await api.put('/auth/fan/profile', {
          [isBanner ? 'banner_url' : 'image_url']: imageUrl
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (updateRes.data?.success) {
          updateProfile({ [isBanner ? 'banner_url' : 'image_url']: imageUrl })
          kohiToast.success(`${isBanner ? 'Banner' : 'Foto profil'} berhasil diperbarui!`)
        } else {
          throw new Error('Gagal menyimpan ke database')
        }
      } else {
        throw new Error('Gagal mengupload gambar')
      }
    } catch (err) {
      console.error('Upload error:', err)
      const errorMsg = err.response?.data?.error || err.message || 'Terjadi kesalahan saat upload'
      kohiToast.error(errorMsg)
    } finally {
      isBanner ? setUploadingBanner(false) : setUploadingAvatar(false)
    }
  }

  const renderProfileInfo = () => (
    <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden h-full">
      <div className="flex items-center justify-between border-b border-border p-5">
        <h2 className="text-lg font-black flex items-center gap-2 text-text-primary tracking-tight">
          <FaUser className="text-primary" />
          Informasi Profil
        </h2>
        {!isEditingProfile ? (
          <button 
            onClick={() => setIsEditingProfile(true)}
            className="text-sm font-bold text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors"
          >
            <FaEdit /> Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setIsEditingProfile(false)
                setProfileForm({
                  nama: fanUser?.nama || '',
                  whatsapp: fanUser?.whatsapp || '',
                  instagram: fanUser?.instagram || ''
                })
              }}
              disabled={savingProfile}
              className="text-sm font-bold text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors"
            >
              <FaTimes /> Batal
            </button>
            <button 
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="text-sm font-bold text-primary hover:text-primary/80 flex items-center gap-1.5 ml-2 transition-colors"
            >
              {savingProfile ? <FaSpinner className="animate-spin" /> : <FaSave />} Simpan
            </button>
          </div>
        )}
      </div>
      
      <div className="p-5 grid grid-cols-1 gap-5">
        <div className="space-y-1.5 group">
          <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
            <FaUser className="opacity-70" /> Nama Lengkap
          </label>
          {isEditingProfile ? (
            <input 
              type="text"
              value={profileForm.nama}
              onChange={(e) => setProfileForm({...profileForm, nama: e.target.value})}
              className="w-full p-3 bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl font-medium text-text-primary outline-none transition-all"
            />
          ) : (
            <div className="p-3 bg-background border border-border rounded-xl font-medium text-text-primary">
              {fanUser.nama || '-'}
            </div>
          )}
        </div>
        
        <div className="space-y-1.5 group">
          <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
            <FaEnvelope className="opacity-70" /> Email
          </label>
          <div className="p-3 bg-background/50 border border-border rounded-xl font-medium text-text-secondary truncate cursor-not-allowed" title="Email tidak dapat diubah">
            {fanUser.email || '-'}
          </div>
        </div>

        <div className="space-y-1.5 group">
          <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
            <FaWhatsapp className="opacity-70" /> WhatsApp
          </label>
          {isEditingProfile ? (
            <input 
              type="text"
              value={profileForm.whatsapp}
              onChange={(e) => setProfileForm({...profileForm, whatsapp: e.target.value})}
              className="w-full p-3 bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl font-medium text-text-primary outline-none transition-all"
            />
          ) : (
            <div className="p-3 bg-background border border-border rounded-xl font-medium text-text-primary">
              {fanUser.whatsapp || '-'}
            </div>
          )}
        </div>

        <div className="space-y-1.5 group">
          <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
            <FaInstagram className="opacity-70" /> Instagram
          </label>
          {isEditingProfile ? (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary font-bold">@</span>
              <input 
                type="text"
                value={profileForm.instagram}
                onChange={(e) => setProfileForm({...profileForm, instagram: e.target.value})}
                className="w-full p-3 pl-8 bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl font-medium text-text-primary outline-none transition-all"
              />
            </div>
          ) : (
            <div className="p-3 bg-background border border-border rounded-xl font-medium text-text-primary">
              {fanUser.instagram ? `@${fanUser.instagram}` : '-'}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderOrderHistory = () => {
    const poCount = orders.filter(o => !(o.is_ots || o.order_number?.startsWith('KS-OTS'))).length
    const otsCount = orders.filter(o => (o.is_ots || o.order_number?.startsWith('KS-OTS'))).length

    const filteredOrders = orders.filter(order => {
      const isOts = order.is_ots || order.order_number?.startsWith('KS-OTS')
      if (orderTypeFilter === 'ots') return isOts
      if (orderTypeFilter === 'po') return !isOts
      return true
    })

    return (
      <div className="bg-surface border border-border rounded-3xl shadow-xl overflow-hidden h-full flex flex-col">
        {/* Header Panel - Solid Color, No Gradient */}
        <div className="p-5 sm:p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary block mb-0.5">
              Kohi Stage Fan Vault
            </span>
            <h2 className="text-xl font-black flex items-center gap-2.5 text-text-primary tracking-tight">
              <FaHistory className="text-primary text-base" />
              Riwayat Pesanan Tiket
            </h2>
          </div>

          {/* Filter PO vs OTS */}
          <div className="flex items-center gap-1.5 p-1 bg-background border border-border rounded-2xl self-start sm:self-auto text-xs font-bold">
            <button
              onClick={() => setOrderTypeFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl transition-all font-black text-xs ${orderTypeFilter === 'all' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Semua ({orders.length})
            </button>
            <button
              onClick={() => setOrderTypeFilter('po')}
              className={`px-3.5 py-1.5 rounded-xl transition-all font-black text-xs ${orderTypeFilter === 'po' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}
            >
              PO Online ({poCount})
            </button>
            <button
              onClick={() => setOrderTypeFilter('ots')}
              className={`px-3.5 py-1.5 rounded-xl transition-all font-black text-xs ${orderTypeFilter === 'ots' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}
            >
              OTS Venue ({otsCount})
            </button>
          </div>
        </div>
        
        {/* Content list */}
        <div className="p-5 sm:p-6 flex-1 max-h-[650px] overflow-y-auto custom-scrollbar space-y-4">
          {loading ? (
            <div className="h-48 flex flex-col items-center justify-center gap-3">
              <div className="w-9 h-9 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-xs text-text-secondary uppercase tracking-widest font-black">Memuat riwayat tiket...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center px-4 py-8">
              <div className="w-20 h-20 bg-background border border-border rounded-3xl flex items-center justify-center text-primary mb-4">
                <FaShoppingBag className="text-3xl" />
              </div>
              <h3 className="text-lg font-black text-text-primary mb-2 uppercase tracking-wide">
                {orderTypeFilter === 'ots' ? 'Belum Ada Pesanan OTS' : orderTypeFilter === 'po' ? 'Belum Ada Pesanan PO' : 'Belum Ada Riwayat Pesanan'}
              </h3>
              <p className="text-text-secondary text-xs max-w-sm mb-6 leading-relaxed">
                {orderTypeFilter === 'ots' 
                  ? 'Kamu belum memiliki transaksi tiket OTS di lokasi venue dengan akun ini.' 
                  : 'Mari dukung oshi kamu dengan memesan tiket Cheki atau merchandise eksklusif!'}
              </p>
              <button 
                onClick={() => navigate('/shop')}
                className="px-6 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-wider rounded-full hover:bg-primary/90 transition-all shadow-md"
              >
                Kunjungi Kalender Shop
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order, idx) => {
                const isOts = order.is_ots || order.order_number?.startsWith('KS-OTS')
                const isCompleted = order.status === 'completed'
  const isPaid = order.status === 'paid' || order.status === 'checked' || order.status === 'approved'
  const isPending = order.status === 'pending'
  const isCancelled = order.status === 'cancelled' || order.status === 'rejected'
  const canDownload = isPaid || isCompleted

                const displayOrderNumber = order.order_number || (order.id ? `#${order.id.substring(0,8).toUpperCase()}` : `#ORD-${idx+1}`)
                const totalItemCount = order.order_items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || 1
                const isCurrentlyDownloading = downloadingOrderId === (order.id || order.order_number)

                return (
                  <div
                    key={order.id || idx}
                    className="relative group bg-surface border border-border hover:border-primary/50 rounded-2xl p-5 shadow-lg transition-all duration-200 overflow-hidden"
                  >
                    {/* Solid status indicator bar on top */}
                    <div className={`absolute top-0 left-0 right-0 h-[2px] ${
                      isPaid ? 'bg-emerald-500' :
                      isPending ? 'bg-amber-500' :
                      'bg-zinc-600'
                    }`} />

                    {/* Top Row: PO/OTS badge, order number, and status */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-border">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isOts ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/30">
                            <FaQrcode size={10} /> OTS Venue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/15 text-teal-300 border border-teal-500/30">
                            <FaTicketAlt size={10} /> Pre-Order (PO)
                          </span>
                        )}
                        {isOts && (order.created_by === 'admin' || !order.created_by) ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            Admin Input
                          </span>
                        ) : null}
                        {isOts && order.created_by === 'customer' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-sky-500/15 text-sky-400 border border-sky-500/30">
                            Order Sendiri
                          </span>
                        ) : null}

                        <button
                          onClick={() => handleCopyOrderNumber(displayOrderNumber.replace('#', ''))}
                          className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-text-primary hover:text-primary transition-colors px-2 py-0.5 rounded-md hover:bg-background"
                          title="Klik untuk salin nomor pesanan"
                        >
                          <span>{displayOrderNumber}</span>
                          <FaCopy size={11} className={copiedId === displayOrderNumber.replace('#', '') ? 'text-primary' : 'opacity-40'} />
                        </button>
                      </div>

                      {/* Status Pill */}
                      <div>
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-primary/15 text-primary border border-primary/30">
                            <FaCheck size={11} /> Selesai
                          </span>
                        ) : isPaid ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <FaCheckCircle size={11} /> Paid
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <FaHourglassHalf size={11} /> Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30">
                            <FaTimes size={11} /> Dibatalkan
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Section: Event & Items Details */}
                    <div className="py-3.5 space-y-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-medium text-text-secondary mb-1">
                          <FaCalendarAlt size={11} className="text-primary" />
                          <span>
                            {order.events 
                              ? `${order.events.tanggal || ''} ${order.events.bulan || ''} ${order.events.tahun || ''}`.trim() || new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                              : new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span>•</span>
                          <span className="text-text-secondary">{order.events?.lokasi || 'Kohi Stage'}</span>
                        </div>

                        <h3 className="text-lg font-black uppercase tracking-tight text-text-primary">
                          {order.events ? order.events.nama : (order.merchandise ? order.merchandise.nama : 'Event Kohi Sekai')}
                        </h3>
                      </div>

                      {/* Items Details Box */}
                      <div className="bg-background rounded-xl p-3 border border-border space-y-2">
                        <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-text-secondary">
                          <span>Rincian Tiket & Sesi</span>
                          <span className="font-mono text-primary font-bold">{totalItemCount} Tiket</span>
                        </div>

                        {order.order_items && order.order_items.length > 0 ? (
                          <div className="space-y-1.5 divide-y divide-border">
                            {order.order_items.map((it, iIdx) => (
                              <div key={iIdx} className="flex justify-between items-center text-xs pt-1.5 first:pt-0">
                                <span className="font-bold text-text-primary flex items-center gap-2">
                                  <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary font-mono text-[10px] font-black">
                                    {it.quantity}x
                                  </span>
                                  <span>{it.item_name}</span>
                                </span>
                                <span className="font-mono text-zinc-400 font-medium">
                                  Rp {((it.price || 0) * (it.quantity || 1)).toLocaleString('id-ID')}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-text-primary flex items-center gap-1.5">
                              <FaUser className="text-primary text-[10px]" />
                              <span>{order.members?.nama_panggung ? `2-Shot with ${order.members.nama_panggung}` : 'Tiket Cheki'}</span>
                            </span>
                            <span className="font-mono text-zinc-400 font-medium">
                              Rp {(order.total_harga || 0).toLocaleString('id-ID')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Perforation / Dashed Ticket Divider */}
                    <div className="relative my-1">
                      <div className="border-b border-dashed border-border" />
                      <div className="absolute -left-7 -top-2 w-4 h-4 rounded-full bg-surface border border-border" />
                      <div className="absolute -right-7 -top-2 w-4 h-4 rounded-full bg-surface border border-border" />
                    </div>

                    {/* Bottom Row: Total Price & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary block">
                          Total Pembayaran
                        </span>
                        <span className="text-xl font-mono font-black text-primary">
                          Rp {(order.total_harga || 0).toLocaleString('id-ID')}
                        </span>
                      </div>

                      {/* Action Button - Langsung Unduh Saja */}
                      <div>
                        {canDownload ? (
                          <button
                            onClick={() => handleDirectDownload(order)}
                            disabled={isCurrentlyDownloading}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60"
                          >
                            {isCurrentlyDownloading ? (
                              <>
                                <FaSpinner className="animate-spin" size={13} />
                                <span>Mengunduh Nota...</span>
                              </>
                            ) : (
                              <>
                                <FaDownload size={13} />
                                <span>Unduh Nota</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-amber-400/90 bg-amber-500/10 px-3.5 py-2 rounded-xl border border-amber-500/20 inline-block">
                            Menunggu Verifikasi Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-text-primary font-outfit overflow-hidden flex flex-col transition-colors duration-500 pb-20 md:pb-0">
      <KSHeader />

      <main className="flex-grow pt-8 sm:pt-24 pb-8 relative z-10 container mx-auto px-4 max-w-6xl">
        {/* HERO / HEADER CARD */}
        <div className="bg-surface border border-border rounded-3xl shadow-sm overflow-hidden mb-6 sm:mb-8">
          
          {/* Cover Photo */}
          <div className="h-32 sm:h-48 relative group overflow-hidden bg-surface">
            {fanUser.banner_url && (
              <img 
                src={fanUser.banner_url} 
                alt="Cover" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            )}
            
            {/* Dark overlay for pattern if no banner */}
            {!fanUser.banner_url && (
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--primary) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            )}

            {/* Upload Cover Overlay */}
            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100 ${uploadingBanner ? 'opacity-100' : ''}`}>
              <button 
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploadingBanner}
                className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-black/50 hover:bg-black/80 backdrop-blur-md text-white rounded-full font-bold text-xs md:text-sm transition-all"
              >
                {uploadingBanner ? <FaSpinner className="animate-spin" /> : <FaCamera />}
                {uploadingBanner ? 'Mengunggah...' : 'Ganti Cover'}
              </button>
              <input 
                type="file" 
                ref={bannerInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={(e) => handleImageChange(e, 'banner')}
              />
            </div>
            
            {/* Desktop Sign Out Button (Top Right over cover) */}
            <div className="absolute top-4 right-4 hidden md:block">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-danger text-white backdrop-blur-md rounded-full text-sm font-bold transition-colors shadow-lg"
              >
                <FaSignOutAlt /> Sign Out
              </button>
            </div>
          </div>

          {/* Profile Details Container */}
          <div className="px-5 sm:px-8 pb-6 relative">
            {/* Avatar & Profile Identity */}
            <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6 -mt-12 md:-mt-16 relative z-10">
              
              <div className="relative group shrink-0">
                <div className="w-20 h-20 md:w-32 md:h-32 rounded-2xl border-4 border-surface bg-primary flex items-center justify-center text-white shadow-md overflow-hidden relative">
                  {fanUser.image_url ? (
                    <img src={fanUser.image_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary flex items-center justify-center">
                      <span className="text-3xl md:text-5xl font-black uppercase tracking-wider">{fanUser.nama?.charAt(0) || 'K'}</span>
                    </div>
                  )}
                  
                  {/* Upload Avatar Overlay */}
                  <div 
                    onClick={() => !uploadingAvatar && avatarInputRef.current?.click()}
                    className={`absolute inset-0 bg-black/40 transition-opacity duration-300 flex items-center justify-center cursor-pointer md:opacity-0 md:group-hover:opacity-100 ${uploadingAvatar ? 'opacity-100' : ''}`}
                  >
                    {uploadingAvatar ? <FaSpinner className="animate-spin text-xl md:text-2xl text-white" /> : <FaCamera className="text-xl md:text-2xl text-white" />}
                  </div>
                </div>
                {/* Small camera icon explicitly shown on mobile */}
                <button 
                  onClick={() => !uploadingAvatar && avatarInputRef.current?.click()}
                  className="md:hidden absolute -bottom-2 -right-2 w-8 h-8 bg-surface border-2 border-border text-primary rounded-full flex items-center justify-center shadow-sm z-20"
                >
                  <FaCamera className="text-xs" />
                </button>
                <input 
                  type="file" 
                  ref={avatarInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, 'avatar')}
                />
              </div>

              {/* Name, ID, Verification, and Titles */}
              <div className="flex-1 min-w-0 md:pt-16 pb-1">
                {/* Line 1: Name */}
                <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight truncate">
                  {fanUser.nama || 'Kiki'}
                </h1>

                {/* Line 2: ID & Verification */}
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <p className="text-text-secondary text-sm font-mono font-medium">
                    ID: {fanUser.fan_id ? String(fanUser.fan_id).padStart(4, '0') : (fanUser.id?.split('-')[1] || fanUser.id?.substring(0,8) || 'Member')}
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-success/10 text-success border border-success/20 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    <FaCheck className="text-[9px]" /> Fan Terverifikasi
                  </span>
                </div>

                {/* Line 3: Grouped Title Badges (Render only if titles exist) */}
                {groupedTitles.length > 0 && (
                  <div className="mt-2.5">
                    {/* -- MOBILE SPECIFIC: Maksimal 1 baris chip, sisanya langsung masuk "+N" -- */}
                    <div className="md:hidden flex items-center gap-1.5 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowTitlesModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm bg-amber-500/15 text-amber-300 border-amber-500/40 active:scale-95 transition-transform truncate max-w-[210px]"
                        title="Klik untuk melihat rincian gelar"
                      >
                        <FaCrown className="text-yellow-400 text-xs shrink-0" />
                        <span className="truncate">{groupedTitles[0].displayLabel}</span>
                      </button>

                      {groupedTitles.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setShowTitlesModal(true)}
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm bg-surface border-primary/40 text-primary hover:bg-primary/10 shrink-0 active:scale-95 transition-transform"
                          title="Lihat semua gelar"
                        >
                          +{groupedTitles.length - 1}
                        </button>
                      )}
                    </div>

                    {/* -- DESKTOP SPECIFIC: Tampilkan hingga 3 chip per periode, sisanya "+N" -- */}
                    <div className="hidden md:flex items-center gap-2 flex-wrap">
                      {groupedTitles.slice(0, 3).map((group, gIdx) => (
                        <button
                          key={gIdx}
                          type="button"
                          onClick={() => setShowTitlesModal(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer max-w-md truncate"
                          title="Klik untuk melihat rincian gelar"
                        >
                          <FaCrown className="text-yellow-400 text-xs shrink-0" />
                          <span className="truncate">{group.displayLabel}</span>
                        </button>
                      ))}

                      {groupedTitles.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setShowTitlesModal(true)}
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm bg-surface border-primary/40 text-primary hover:bg-primary/10 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
                          title="Lihat semua title"
                        >
                          +{groupedTitles.length - 3} Lainnya
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE TABS (Segmented Control) */}
        <div className="md:hidden mb-6 bg-surface p-1 rounded-xl border border-border flex">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary'}`}
          >
            Informasi Profil
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors ${activeTab === 'history' ? 'bg-primary text-white shadow-sm' : 'text-text-secondary'}`}
          >
            Riwayat Pesanan
          </button>
        </div>

        {/* CONTENT LAYOUT */}
        {/* Desktop: 2 Columns. Mobile: Conditional Render based on activeTab */}
        
        {/* Desktop Layout */}
        <div className="hidden md:grid grid-cols-12 gap-6 h-full items-start">
          <div className="col-span-5 lg:col-span-4 h-full sticky top-24">
            {renderProfileInfo()}
          </div>
          <div className="col-span-7 lg:col-span-8 h-full">
            {renderOrderHistory()}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                {renderProfileInfo()}
              </motion.div>
            )}
            
            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderOrderHistory()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Sign Out Button */}
          <div className="pt-6">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-background hover:bg-danger/10 text-danger border border-danger/30 rounded-xl font-bold transition-colors shadow-sm"
            >
              <FaSignOutAlt /> Keluar dari Akun
            </button>
          </div>
        </div>

      
      

      
      {/* Hidden Offscreen Container for Direct Download */}
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', pointerEvents: 'none', zIndex: -999 }}>
        {downloadingOrder && (
          <div ref={receiptDownloadRef}>
            <DigitalReceipt
              data={{
                orderNumber: downloadingOrder.order_number || `#${downloadingOrder.id?.substring(0,8)}`,
                eventName: downloadingOrder.events?.nama || 'Event Kohi Sekai',
                eventDate: downloadingOrder.events ? `${downloadingOrder.events.tanggal || ''} ${downloadingOrder.events.bulan || ''} ${downloadingOrder.events.tahun || ''}`.trim() : '-',
                isSpecial: !!downloadingOrder.events?.is_special,
                themeColor: downloadingOrder.events?.theme_color || 'var(--primary)',
                items: downloadingOrder.order_items && downloadingOrder.order_items.length > 0 
                  ? downloadingOrder.order_items.map(it => ({
                      name: it.item_name,
                      quantity: it.quantity,
                      price: it.price
                    }))
                  : [{
                      name: downloadingOrder.events?.nama || 'Tiket Cheki',
                      quantity: 1,
                      price: downloadingOrder.total_harga || 0
                    }],
                nama: downloadingOrder.nama_lengkap,
                kontak: downloadingOrder.whatsapp || downloadingOrder.email || '-',
                instagram: downloadingOrder.instagram || null,
                catatan: downloadingOrder.catatan || null,
                total: downloadingOrder.total_harga || 0,
                createdAt: new Date(downloadingOrder.created_at).toLocaleString('id-ID', {
                  day: 'numeric', month: 'numeric', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })
              }}
              isPreview={false}
            />
          </div>
        )}
      </div>

      </main>

      <ImageCropModal
        isOpen={!!cropModalData}
        onClose={() => setCropModalData(null)}
        imageSrc={cropModalData?.imageSrc}
        aspect={cropModalData?.isBanner ? 16/9 : 1/1}
        onCropComplete={handleUploadCroppedImage}
      />

      {/* Title Details Modal */}
      {showTitlesModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowTitlesModal(false) }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 animate-fade-in"
        >
          <div className="bg-[#111726] border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto custom-scrollbar text-white p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FaTrophy className="text-yellow-400 text-lg" />
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Daftar Gelar & Title Fan
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Peringkat perolehan cheki berdasarkan periode & member
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTitlesModal(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center text-sm transition"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              {groupedTitles.map((group, idx) => (
                <div key={idx} className="bg-[#182032] border border-white/5 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                      <FaCrown className="text-yellow-400 text-xs" />
                      Periode {group.periodName}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full">
                      {group.members.length} Gelar
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {group.members.map((m, mIdx) => (
                      <div
                        key={mIdx}
                        className="flex items-center justify-between bg-[#111726]/60 border border-white/5 px-3 py-2 rounded-lg text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                            m.rank === 1
                              ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/40'
                              : m.rank === 2
                              ? 'bg-zinc-300/20 text-zinc-200 border border-zinc-300/40'
                              : 'bg-amber-600/20 text-amber-400 border border-amber-600/40'
                          }`}>
                            #{m.rank}
                          </span>
                          <span className="font-semibold text-white">
                            {m.memberName}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px]">
                          {m.chekiCount > 0 && (
                            <span className="text-zinc-400 font-mono">
                              {m.chekiCount} Cheki
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary text-[10px] font-bold">
                            {m.title || `Top ${m.rank} ${group.periodName}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default KSProfilePage

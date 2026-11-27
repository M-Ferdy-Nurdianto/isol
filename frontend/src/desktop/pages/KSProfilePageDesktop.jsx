import { toPng } from 'html-to-image'
import { groupTitlesByPeriod, sortIndividualTitles, getRankBadgeStyle } from '../../lib/fanTitleUtils'
import DigitalReceipt from '../../components/shop/DigitalReceipt'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaUser, FaEnvelope, FaWhatsapp, FaInstagram, FaSignOutAlt, 
  FaHistory, FaTicketAlt, FaCheck, FaHourglassHalf, FaExternalLinkAlt, 
  FaReceipt, FaCamera, FaSpinner, FaEdit, FaSave, FaTimes, FaShoppingBag,
  FaCheckCircle, FaCopy, FaCalendarAlt, FaQrcode, FaDownload, FaCrown, FaTrophy,
  FaBox, FaTruck, FaStore, FaMapMarkerAlt, FaImage, FaPalette,
  FaLock, FaKey, FaShieldAlt, FaEye, FaEyeSlash, FaUserEdit
} from 'react-icons/fa'
import { useFanAuth } from '../../context/FanAuthContext'
import KSHeader from '../../components/KSHeader'
import { kohiToast } from '../../components/ui/KohiToast'
import { webAlert } from '../../lib/webAlert'
import { getAssetPath } from '../../lib/pathUtils'
import api from '../../lib/api'

const KSProfilePage = () => {
  const navigate = useNavigate()
  const { fanUser, isLoggedIn, logout, updateProfile } = useFanAuth()
  
  const [orders, setOrders] = useState([])
  const [merchOrders, setMerchOrders] = useState([])
  const [fanTitles, setFanTitles] = useState([])
  const [showTitlesModal, setShowTitlesModal] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Member & Official Asset Picker States (Anti Storage Bloat)
  const [members, setMembers] = useState([])
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [showBannerPicker, setShowBannerPicker] = useState(false)
  const [selectedAvatarOption, setSelectedAvatarOption] = useState('')
  const [selectedBannerOption, setSelectedBannerOption] = useState('')
  const [savingAsset, setSavingAsset] = useState(false)

  const [avatarLoadError, setAvatarLoadError] = useState(false)
  const [bannerLoadError, setBannerLoadError] = useState(false)
  const [customFanBanners, setCustomFanBanners] = useState(null) // null = not configured yet (use defaults), array = configured list

  useEffect(() => {
    setAvatarLoadError(false)
  }, [fanUser?.image_url])

  useEffect(() => {
    setBannerLoadError(false)
  }, [fanUser?.banner_url])

  // Fetch official members & admin-uploaded fan banners
  useEffect(() => {
    api.get('/members')
      .then(res => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setMembers(res.data.data)
        }
      })
      .catch(err => {
        console.error('Failed to load official members for avatar/banner picker:', err)
      })

    api.get('/config')
      .then(res => {
        const raw = res.data?.data?.fan_banner_options
        if (raw === undefined || raw === null || raw === '') return
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
        if (Array.isArray(parsed)) {
          setCustomFanBanners(parsed.filter(b => b && b.url))
        }
      })
      .catch(() => {})
  }, [])
  
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [activeTab, setActiveTab] = useState('history') // default to history
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null)
  const [orderTypeFilter, setOrderTypeFilter] = useState('po') // 'po', 'ots', 'merch'
  const [copiedId, setCopiedId] = useState(null)
  const [downloadingOrderId, setDownloadingOrderId] = useState(null)
  const [downloadingOrder, setDownloadingOrder] = useState(null)
  const [confirmingMerchOrder, setConfirmingMerchOrder] = useState(null)
  const [confirmingMerchLoading, setConfirmingMerchLoading] = useState(false)
  const receiptDownloadRef = useRef(null)

  const handleConfirmMerchReceived = async () => {
    if (!confirmingMerchOrder) return
    setConfirmingMerchLoading(true)
    try {
      const res = await api.patch(`/merch-orders/${confirmingMerchOrder.id}/confirm-received`)
      if (res.data?.success && res.data?.data) {
        setMerchOrders(prev => prev.map(m => (m.id === confirmingMerchOrder.id ? res.data.data : m)))
        kohiToast.success('Terima kasih! Pesanan merchandise telah dikonfirmasi diterima.')
        setConfirmingMerchOrder(null)
      } else {
        throw new Error(res.data?.error || 'Gagal mengonfirmasi pesanan')
      }
    } catch (err) {
      kohiToast.error(err.response?.data?.error || err.message || 'Gagal mengonfirmasi pesanan')
    } finally {
      setConfirmingMerchLoading(false)
    }
  }

  const groupedTitles = groupTitlesByPeriod(fanTitles)
  const individualTitles = sortIndividualTitles(fanTitles)

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
          backgroundColor: '#ffffff',
          filter: (node) => !node?.classList?.contains('receipt-actions')
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

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('ks_fan_token')
    const saved = localStorage.getItem('ks_fan_user')
    if (!isLoggedIn && !token && !saved) {
      navigate('/login', { replace: true, state: { from: '/profile' } })
    }
  }, [isLoggedIn, navigate])

  const savedLocalUser = useMemo(() => {
    try {
      const s = localStorage.getItem('ks_fan_user')
      return s ? JSON.parse(s) : null
    } catch {
      return null
    }
  }, [])

  const currentUser = fanUser || savedLocalUser

  useEffect(() => {
    const effectiveEmail = currentUser?.email
    const effectiveId = currentUser?.id
    const effectiveWa = currentUser?.whatsapp

    if (effectiveEmail || effectiveId || effectiveWa) {
      setLoading(true)
      const email = effectiveEmail ? encodeURIComponent(effectiveEmail) : ''
      const userId = effectiveId ? `&user_id=${effectiveId}` : ''
      const wa = effectiveWa ? `&whatsapp=${encodeURIComponent(effectiveWa)}` : ''

      Promise.all([
        api.get(`/auth/fan/orders?email=${email}${userId}`).catch(() => ({ data: { success: false } })),
        api.get(`/merch-orders/fan-orders?email=${email}${userId}${wa}`).catch(() => ({ data: { success: false } }))
      ])
        .then(([ticketRes, merchRes]) => {
          if (ticketRes.data?.success) setOrders(ticketRes.data.data || [])
          if (merchRes.data?.success) setMerchOrders(merchRes.data.data || [])
        })
        .catch(err => {
          console.error('Error fetching order history:', err)
        })
        .finally(() => setLoading(false))
    }
  }, [currentUser?.email, currentUser?.id, currentUser?.whatsapp])

  useEffect(() => {
    if (currentUser?.nama || currentUser?.email) {
      api.get(`/leaderboard/fan-titles?name=${encodeURIComponent(currentUser.nama || '')}&email=${encodeURIComponent(currentUser.email || '')}`)
        .then(res => {
          if (res.data?.success) {
            setFanTitles(res.data.data || [])
          }
        })
        .catch(err => console.error('Failed to load fan titles:', err))
    }
  }, [currentUser?.nama, currentUser?.email])

  if (!isLoggedIn && !currentUser) return null

  const handleOpenProfileModal = () => {
    setProfileForm({
      nama: currentUser?.nama || '',
      whatsapp: currentUser?.whatsapp || '',
      instagram: currentUser?.instagram || ''
    })
    setIsEditingProfile(true)
    setShowChangePassword(false)
    setShowProfileModal(true)
  }

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
        setShowProfileModal(false)
        kohiToast.success('Profil berhasil diperbarui')
      }
    } catch (err) {
      kohiToast.error(err.response?.data?.error || 'Gagal memperbarui profil')
    } finally {
      setSavingProfile(false)
    }
  }

  // Change Password States & Handler
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  const handleChangePassword = async (e) => {
    e?.preventDefault()
    if (!passwordForm.new_password || passwordForm.new_password.length < 6) {
      kohiToast.error('Password baru minimal harus 6 karakter')
      return
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      kohiToast.error('Konfirmasi password baru tidak cocok')
      return
    }

    setChangingPassword(true)
    try {
      const token = localStorage.getItem('ks_fan_token')
      const res = await api.post('/auth/fan/change-password', {
        current_password: passwordForm.current_password || undefined,
        new_password: passwordForm.new_password,
        confirm_password: passwordForm.confirm_password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.data?.success) {
        kohiToast.success(res.data.message || 'Password berhasil diperbarui!')
        setPasswordForm({
          current_password: '',
          new_password: '',
          confirm_password: ''
        })
        setShowChangePassword(false)
      } else {
        throw new Error(res.data?.error || 'Gagal mengubah password')
      }
    } catch (err) {
      kohiToast.error(err.response?.data?.error || err.message || 'Gagal mengubah password')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleLogout = async () => {
    const confirmed = await webAlert.confirm({
      title: 'Keluar dari Akun',
      text: 'Apakah Anda yakin ingin keluar dari akun Anda?',
      confirmText: 'Ya, Keluar',
      cancelText: 'Batal',
      isDanger: true
    })
    if (confirmed) {
      logout()
      navigate('/')
    }
  }

  const handleOpenAvatarPicker = () => {
    setSelectedAvatarOption(fanUser?.image_url || '')
    setShowAvatarPicker(true)
  }

  const handleOpenBannerPicker = () => {
    setSelectedBannerOption(fanUser?.banner_url || '')
    setShowBannerPicker(true)
  }

  // Official Avatar Options List
  const avatarOptions = useMemo(() => {
    const list = [
      {
        id: 'opt-initial',
        url: '',
        title: 'Inisial Nama',
        subtitle: 'Default Profil (Huruf Depan)',
        isInitial: true
      },
      {
        id: 'opt-group-avatar',
        url: '/images/members/group.webp',
        title: 'Kohi Sekai',
        subtitle: 'Official Group All Members',
        isGroup: true
      }
    ]

    members.forEach((m) => {
      if (m.member_id === 'group' || (m.nama_panggung || '').toLowerCase().includes('kohi sekai')) {
        return
      }

      if (m.image_url) {
        list.push({
          id: `opt-member-${m.id || m.member_id}-main`,
          url: m.image_url,
          title: m.nama_panggung,
          subtitle: m.tagline || 'Member Kohi Sekai',
          color: m.color
        })
      }

      if (m.shop_image_url && m.shop_image_url !== m.image_url) {
        list.push({
          id: `opt-member-${m.id || m.member_id}-shop`,
          url: m.shop_image_url,
          title: `${m.nama_panggung} (2-Shot)`,
          subtitle: 'Foto Edisi Shop',
          color: m.color
        })
      }
    })

    return list
  }, [members])

  // Official Banner Options List (ONLY real 16:9 banners — never member profile photos)
  const bannerOptions = useMemo(() => {
    const defaultBanners = [
      {
        id: 'opt-banner-default-espresso',
        url: '/images/banners/default-espresso.svg',
        title: 'Espresso Minimalist',
        subtitle: 'Default Kohi Sekai'
      },
      {
        id: 'opt-banner-default-logo',
        url: '/images/banners/default-logo.svg',
        title: 'Kohi Sekai Official Logo',
        subtitle: 'Logo Resmi Website'
      },
      {
        id: 'opt-banner-default-crema',
        url: '/images/banners/default-crema.svg',
        title: 'Warm Crema Roast',
        subtitle: 'Default Kohi Sekai'
      }
    ]

    const list = Array.isArray(customFanBanners)
      ? customFanBanners.map((b, idx) => ({
          id: b.id || `opt-banner-custom-${idx}`,
          url: b.url,
          title: b.title || `Banner Resmi ${idx + 1}`,
          subtitle: 'Banner Resmi Kohi Sekai',
          isUploadedLandscape: true
        }))
      : defaultBanners

    // Legacy member-specific landscape banners ONLY (strictly banner_image_url, never image_url)
    members.forEach((m) => {
      if (m.member_id === 'group' || (m.nama_panggung || '').toLowerCase().includes('kohi sekai')) {
        return
      }
      if (m.banner_image_url) {
        list.push({
          id: `opt-banner-member-${m.id || m.member_id}`,
          url: m.banner_image_url,
          title: m.nama_panggung,
          subtitle: 'Banner Resmi (16:9)',
          isUploadedLandscape: true,
          color: m.color
        })
      }
    })

    return list
  }, [members, customFanBanners])

  // Save selected avatar to Supabase
  const handleSaveAvatar = async (forcedUrl) => {
    const urlToSave = forcedUrl !== undefined ? forcedUrl : selectedAvatarOption
    try {
      setSavingAsset(true)
      const token = localStorage.getItem('ks_fan_token')
      const res = await api.put('/auth/fan/profile', {
        image_url: urlToSave || null,
        email: fanUser?.email
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.data?.success) {
        updateProfile({ image_url: urlToSave || null })
        setAvatarLoadError(false)
        setShowAvatarPicker(false)
        kohiToast.success('Foto profil berhasil diperbarui!')
      } else {
        throw new Error(res.data?.error || 'Gagal menyimpan foto profil')
      }
    } catch (err) {
      console.error('Failed to update avatar:', err)
      kohiToast.error(err.response?.data?.error || err.message || 'Gagal memperbarui foto profil')
    } finally {
      setSavingAsset(false)
    }
  }

  // Save selected banner to Supabase
  const handleSaveBanner = async (forcedUrl) => {
    const urlToSave = forcedUrl !== undefined ? forcedUrl : selectedBannerOption
    try {
      setSavingAsset(true)
      const token = localStorage.getItem('ks_fan_token')
      const res = await api.put('/auth/fan/profile', {
        banner_url: urlToSave || null,
        email: fanUser?.email
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.data?.success) {
        updateProfile({ banner_url: urlToSave || null })
        setBannerLoadError(false)
        setShowBannerPicker(false)
        kohiToast.success('Cover banner berhasil diperbarui!')
      } else {
        throw new Error(res.data?.error || 'Gagal menyimpan cover banner')
      }
    } catch (err) {
      console.error('Failed to update banner:', err)
      kohiToast.error(err.response?.data?.error || err.message || 'Gagal memperbarui cover banner')
    } finally {
      setSavingAsset(false)
    }
  }

  const renderProfileModal = () => {
    if (!showProfileModal) return null

    const profileBodyContent = (
      <div className="space-y-5">
        {/* Fan Identity Highlight Banner */}
        <div className="p-3.5 sm:p-4 bg-background border border-border rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xl shrink-0 overflow-hidden">
              {currentUser?.image_url && !avatarLoadError ? (
                <img
                  src={getAssetPath(currentUser.image_url)}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{currentUser?.nama?.charAt(0) || 'K'}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-text-primary truncate">
                {currentUser?.nama || 'Fan'}
              </p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-text-secondary text-xs font-mono">
                  ID: {currentUser?.fan_id ? String(currentUser.fan_id).padStart(4, '0') : (currentUser?.id?.split('-')[1] || currentUser?.id?.substring(0,8) || 'Member')}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success/10 text-success border border-success/20 rounded-full text-[9px] font-bold uppercase tracking-wider">
                  <FaCheck className="text-[8px]" /> Terverifikasi
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Info Form Fields */}
        <div className="space-y-4">
          {/* Nama Lengkap */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
              <FaUser className="text-primary text-xs" /> Nama Lengkap
            </label>
            <input 
              type="text"
              value={profileForm.nama}
              onChange={(e) => setProfileForm({...profileForm, nama: e.target.value})}
              placeholder="Masukkan nama lengkap Anda"
              className="w-full p-3 bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl font-medium text-text-primary text-sm outline-none transition-all"
            />
          </div>

          {/* Email (Readonly) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FaEnvelope className="text-primary text-xs" /> Email Akun
              </span>
              <span className="text-[10px] text-text-secondary/70 lowercase font-normal">
                (tidak dapat diubah)
              </span>
            </label>
            <div className="p-3 bg-background/50 border border-border rounded-xl font-medium text-text-secondary text-sm truncate cursor-not-allowed" title="Email akun terdaftar tidak dapat diubah">
              {currentUser?.email || '-'}
            </div>
          </div>

          {/* Nomor WhatsApp */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
              <FaWhatsapp className="text-primary text-xs" /> Nomor WhatsApp
            </label>
            <input 
              type="tel"
              value={profileForm.whatsapp}
              onChange={(e) => setProfileForm({...profileForm, whatsapp: e.target.value})}
              placeholder="Contoh: 081234567890"
              className="w-full p-3 bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl font-medium text-text-primary text-sm outline-none transition-all"
            />
          </div>

          {/* Instagram */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
              <FaInstagram className="text-primary text-xs" /> Username Instagram
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary font-bold text-sm">@</span>
              <input 
                type="text"
                value={profileForm.instagram}
                onChange={(e) => setProfileForm({...profileForm, instagram: e.target.value.replace(/^@/, '')})}
                placeholder="username_instagram"
                className="w-full p-3 pl-8 bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl font-medium text-text-primary text-sm outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Keamanan & Ganti Password */}
        <div className="pt-4 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-2">
              <FaShieldAlt className="text-primary" /> Keamanan & Password
            </label>
            {!showChangePassword ? (
              <button
                type="button"
                onClick={() => setShowChangePassword(true)}
                className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors"
              >
                <FaKey size={11} /> Ubah Password
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowChangePassword(false)
                  setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
                }}
                className="text-xs font-bold text-text-secondary hover:text-text-primary flex items-center gap-1 transition-colors"
              >
                <FaTimes size={11} /> Tutup Form Password
              </button>
            )}
          </div>

          {!showChangePassword ? (
            <div className="p-3.5 bg-background border border-border rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-primary shrink-0">
                  <FaLock size={13} />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-text-primary block tracking-wider">
                    ••••••••••••
                  </span>
                  <span className="text-[10px] text-text-secondary block truncate">
                    Bisa diperbarui kapan saja
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowChangePassword(true)}
                className="px-3 py-1.5 rounded-lg bg-surface hover:bg-background border border-border text-xs font-bold text-text-primary hover:text-primary transition-all flex items-center gap-1.5 shrink-0"
              >
                <FaKey size={10} className="text-primary" />
                <span>Ganti Password</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="p-4 bg-background border border-border rounded-xl space-y-3 animate-fade-in">
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Atur password pribadi Anda untuk login berikutnya. Password minimal 6 karakter.
              </p>

              {/* Password Saat Ini (Opsional jika login dari link email) */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-text-secondary block">
                  Password Saat Ini <span className="font-normal text-text-secondary/70">(Kosongkan jika login via link email)</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    placeholder="Masukkan password saat ini (jika ada)"
                    className="w-full p-2.5 pr-9 bg-surface border border-border focus:border-primary rounded-lg text-xs font-medium text-text-primary outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                  >
                    {showCurrentPw ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
                  </button>
                </div>
              </div>

              {/* Password Baru */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-text-secondary block">
                  Password Baru *
                </label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    placeholder="Minimal 6 karakter"
                    className="w-full p-2.5 pr-9 bg-surface border border-border focus:border-primary rounded-lg text-xs font-medium text-text-primary outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                  >
                    {showNewPw ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Password Baru */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-text-secondary block">
                  Ulangi Password Baru *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    placeholder="Ketik ulang password baru"
                    className="w-full p-2.5 pr-9 bg-surface border border-border focus:border-primary rounded-lg text-xs font-medium text-text-primary outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                  >
                    {showConfirmPw ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className="px-3 py-2 rounded-lg bg-surface border border-border text-xs font-bold text-text-secondary hover:text-text-primary transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-primary/20"
                >
                  {changingPassword ? <FaSpinner className="animate-spin" /> : <FaSave />}
                  <span>Simpan Password</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    )

    return (
      <>
        {/* DESKTOP MODAL (hidden md:flex) - SOLID DIALOG OVERLAY */}
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowProfileModal(false) }}
          className="hidden md:flex fixed inset-0 z-50 bg-black/85 items-center justify-center p-4 sm:p-6 animate-fade-in"
        >
          <div className="bg-surface border border-border rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden text-text-primary animate-scale-up">
            {/* Fixed Header */}
            <div className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <FaUserEdit size={18} />
                </div>
                <div>
                  <h2 className="text-base font-black text-text-primary tracking-tight uppercase">
                    Informasi Pribadi & Profil
                  </h2>
                  <p className="text-xs text-text-secondary">
                    Kelola data identitas dan kontak akun fan Anda
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="w-9 h-9 rounded-xl bg-background border border-border text-text-secondary hover:text-text-primary flex items-center justify-center transition hover:border-primary/40"
              >
                <FaTimes />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {profileBodyContent}
            </div>

            {/* Fixed Footer */}
            <div className="bg-surface border-t border-border px-6 py-4 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="px-5 py-2.5 rounded-xl bg-background border border-border text-xs font-bold text-text-secondary hover:text-text-primary transition"
              >
                Tutup
              </button>
              <button
                type="button"
                disabled={savingProfile}
                onClick={handleSaveProfile}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-50"
              >
                {savingProfile ? <FaSpinner className="animate-spin" /> : <FaSave />}
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE DRAWER (md:hidden) - BOTTOM-SHEET MODAL */}
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setShowProfileModal(false) }}
          className="md:hidden fixed inset-0 z-50 bg-black/85 flex flex-col justify-end animate-fade-in"
        >
          <div className="bg-surface border-t border-border rounded-t-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
            {/* Drag Handle Bar */}
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto my-3 shrink-0" />

            {/* Header */}
            <div className="px-5 pb-3 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <FaUserEdit size={14} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">
                    Informasi Pribadi
                  </h3>
                  <p className="text-[10px] text-text-secondary">
                    Perbarui profil & nomor kontak
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="w-8 h-8 rounded-lg bg-background border border-border text-text-secondary hover:text-text-primary flex items-center justify-center"
              >
                <FaTimes size={12} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
              {profileBodyContent}
            </div>

            {/* Sticky Bottom Action Bar */}
            <div className="sticky bottom-0 bg-surface border-t border-border p-4 flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="flex-1 py-3 rounded-xl bg-background border border-border text-xs font-bold text-text-secondary text-center active:scale-95 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={savingProfile}
                onClick={handleSaveProfile}
                className="flex-1 py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider text-center flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50 transition"
              >
                {savingProfile ? <FaSpinner className="animate-spin" /> : <FaSave />}
                <span>Simpan</span>
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

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
        {/* Header Panel - Solid Color, Deep Coffee */}
        <div className="p-4 sm:p-6 border-b border-border bg-surface flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary block mb-0.5">
                Kohi Stage Fan Vault
              </span>
              <h2 className="text-lg sm:text-xl font-black flex items-center gap-2 text-text-primary tracking-tight">
                <FaHistory className="text-primary text-base" />
                Riwayat Pesanan
              </h2>
            </div>
          </div>

          {/* Filter PO vs OTS vs Merch - Fixed Grid (Tanpa Geser, Tidak Kepotong) */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-1.5 bg-background border border-border rounded-2xl w-full">
            <button
              type="button"
              onClick={() => setOrderTypeFilter('po')}
              className={`py-2.5 px-1 sm:px-3 rounded-xl transition-colors font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 ${
                orderTypeFilter === 'po'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface/60'
              }`}
            >
              <span>PO</span>
              <span className="text-xs font-bold opacity-80 tabular-nums">({poCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setOrderTypeFilter('ots')}
              className={`py-2.5 px-1 sm:px-3 rounded-xl transition-colors font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 ${
                orderTypeFilter === 'ots'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface/60'
              }`}
            >
              <span>OTS</span>
              <span className="text-xs font-bold opacity-80 tabular-nums">({otsCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setOrderTypeFilter('merch')}
              className={`py-2.5 px-1 sm:px-3 rounded-xl transition-colors font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 ${
                orderTypeFilter === 'merch'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface/60'
              }`}
            >
              <span className="sm:hidden">Merch</span>
              <span className="hidden sm:inline">Merchandise</span>
              <span className="text-xs font-bold opacity-80 tabular-nums">({merchOrders.length})</span>
            </button>
          </div>
        </div>
        
        {/* Content list */}
        <div className="p-5 sm:p-6 flex-1 max-h-[650px] overflow-y-auto custom-scrollbar space-y-4">
          {loading ? (
            <div className="h-48 flex flex-col items-center justify-center gap-3">
              <div className="w-9 h-9 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-xs text-text-secondary uppercase tracking-widest font-black">Memuat riwayat...</p>
            </div>
          ) : orderTypeFilter === 'merch' ? (
            /* MERCHANDISE ORDERS LIST */
            merchOrders.length === 0 ? (
              <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center px-4 py-8">
                <div className="w-20 h-20 bg-background border border-border rounded-3xl flex items-center justify-center text-primary mb-4">
                  <FaBox className="text-3xl" />
                </div>
                <h3 className="text-lg font-black text-text-primary mb-2 uppercase tracking-wide">
                  Belum Ada Pesanan Merchandise
                </h3>
                <p className="text-text-secondary text-xs max-w-sm mb-6 leading-relaxed">
                  Kamu belum memiliki transaksi pemesanan merchandise. Kunjungi katalog Official Merch untuk mengoleksi item Kohi Sekai!
                </p>
                <button 
                  onClick={() => navigate('/shop')}
                  className="px-6 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-wider rounded-full hover:bg-primary-hover transition-all shadow-md"
                >
                  Lihat Official Merch
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {merchOrders.map((ord, idx) => {
                  const isCompleted = ord.status === 'completed'
                  const isShipped = ord.status === 'shipped'
                  const isPacking = ord.status === 'packing'
                  const isPaid = ord.status === 'paid' || ord.status === 'checked'
                  const isPending = ord.status === 'pending'
                  const isCancelled = ord.status === 'cancelled'
                  const isShipping = ord.delivery_method === 'shipping'
                  const canUserConfirm = isShipped || (!isShipping && (isPaid || isPacking || isShipped))

                  const statusLabel = isCompleted
                    ? 'Selesai / Diterima'
                    : isShipped
                    ? 'Sudah Dikirim'
                    : isPacking
                    ? 'Dikemas'
                    : isPaid
                    ? 'Lunas'
                    : isPending
                    ? 'Menunggu Verifikasi'
                    : 'Dibatalkan'

                  // Semantic Status Colors Only: Emerald (Success/Paid/Completed), Amber (Pending/Process), Red (Cancelled)
                  const statusBadgeClass = (isCompleted || isPaid)
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : (isShipped || isPacking || isPending)
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'bg-red-500/15 text-red-400 border border-red-500/30'

                  return (
                    <div
                      key={ord.id || idx}
                      className="relative group bg-surface border border-border hover:border-border/80 rounded-2xl p-5 shadow-lg transition-all duration-200 overflow-hidden space-y-3"
                    >
                      {/* Subtle neutral top divider */}
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-border" />

                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-background text-text-secondary border border-border">
                            <FaBox size={10} /> Merchandise
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-background text-text-secondary border border-border">
                            {isShipping ? <FaTruck size={10} /> : <FaStore size={10} />}
                            {isShipping ? 'Dikirim' : 'Ambil di Event'}
                          </span>
                          <button
                            onClick={() => handleCopyOrderNumber(ord.order_number)}
                            className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-text-primary hover:text-primary transition-colors px-2 py-0.5 rounded-md hover:bg-background"
                            title="Klik untuk salin"
                          >
                            <span>#{ord.order_number}</span>
                            <FaCopy size={11} className={copiedId === ord.order_number ? 'text-primary' : 'opacity-40'} />
                          </button>
                        </div>

                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusBadgeClass}`}>
                          {statusLabel}
                        </span>
                      </div>

                      <div className="space-y-1.5 py-1">
                        {(ord.merch_order_items || []).map((it, i) => (
                          <div key={i} className="flex justify-between items-center text-xs">
                            <span className="font-bold text-text-primary">
                              {it.quantity}x {it.item_name} {it.size ? `(${it.size})` : ''}
                            </span>
                            <span className="font-mono text-text-secondary">
                              Rp {((it.harga || 0) * (it.quantity || 1)).toLocaleString('id-ID')}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Shipping Address & Tracking Info */}
                      {isShipping && ord.shipping_address && (
                        <div className="text-[11px] text-text-secondary bg-background p-3 rounded-xl border border-border space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-text-primary">
                            <FaMapMarkerAlt size={11} className="text-primary shrink-0" />
                            <span>Alamat Pengiriman:</span>
                          </div>
                          <p className="leading-relaxed">
                            {ord.shipping_address}
                            {ord.shipping_city ? `, ${ord.shipping_city}` : ''}
                            {ord.shipping_postal_code ? ` (${ord.shipping_postal_code})` : ''}
                          </p>
                        </div>
                      )}

                      {(ord.shipping_courier || ord.tracking_number) && (
                        <div className="text-[11px] bg-background border border-border p-3 rounded-xl flex flex-wrap items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-text-secondary block">
                              Info Pengiriman / Resi
                            </span>
                            <p className="text-xs font-bold text-text-primary">
                              {ord.shipping_courier ? `${ord.shipping_courier}` : 'Ekspedisi'}
                              {ord.tracking_number ? ` — ${ord.tracking_number}` : ''}
                            </p>
                          </div>
                          {ord.tracking_number && (
                            <button
                              type="button"
                              onClick={() => handleCopyOrderNumber(ord.tracking_number)}
                              className="px-2.5 py-1 rounded-lg bg-surface border border-border hover:border-primary text-xs font-bold text-text-primary flex items-center gap-1.5"
                            >
                              <FaCopy size={10} className="text-primary" />
                              <span>{copiedId === ord.tracking_number ? 'Disalin' : 'Salin Resi'}</span>
                            </button>
                          )}
                        </div>
                      )}

                      {ord.catatan && (
                        <p className="text-[11px] text-text-secondary bg-background p-2.5 rounded-xl border border-border">
                          <strong className="text-text-primary">Catatan:</strong> {ord.catatan}
                        </p>
                      )}

                      {isCompleted && ord.confirmed_by && (
                        <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
                          <FaCheckCircle size={11} />
                          <span>
                            {ord.confirmed_by === 'admin'
                              ? 'Pesanan diselesaikan oleh Admin'
                              : 'Barang dikonfirmasi telah diterima oleh Kamu'}
                          </span>
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
                        <span className="text-xs font-bold text-text-secondary">
                          Total Bayar: <strong className="text-base font-black text-primary font-mono">Rp {(ord.total_harga || 0).toLocaleString('id-ID')}</strong>
                        </span>
                        <div className="flex items-center gap-3">
                          {ord.payment_proof_url && (
                            <a
                              href={ord.payment_proof_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1 font-bold"
                            >
                              <FaReceipt size={11} /> Bukti Bayar
                            </a>
                          )}
                          {canUserConfirm && !isCancelled && (
                            <button
                              type="button"
                              onClick={() => setConfirmingMerchOrder(ord)}
                              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-black text-xs flex items-center gap-1.5 transition-all active:scale-95"
                            >
                              <FaCheck size={11} />
                              <span>Konfirmasi Barang Sampai</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
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
                  ? 'Kamu belum memiliki transaksi tiket OTS dengan akun ini.' 
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
                    {/* Subtle neutral top divider */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-border" />

                    {/* Top Row: PO/OTS badge, order number, and status */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-border">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isOts ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-background text-text-secondary border border-border">
                            <FaQrcode size={10} /> OTS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-background text-text-secondary border border-border">
                            <FaTicketAlt size={10} /> PO
                          </span>
                        )}
                        {isOts && (order.created_by === 'admin' || !order.created_by) ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-background text-text-secondary border border-border">
                            Admin Input
                          </span>
                        ) : null}
                        {isOts && order.created_by === 'customer' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-background text-text-secondary border border-border">
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

                      {/* Status Pill - Semantic colors only: Green (Paid/Selesai), Yellow (Pending), Red (Dibatalkan) */}
                      <div>
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
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
    <div className="min-h-screen bg-background bg-pattern-cross text-text-primary font-outfit overflow-hidden flex flex-col transition-colors duration-500 pb-20 md:pb-0">
      <KSHeader />

      <main className="flex-grow pt-8 sm:pt-28 pb-8 relative z-10 container mx-auto px-4 max-w-6xl">
        {/* HERO / HEADER CARD */}
        <div className="bg-surface border border-border rounded-3xl shadow-sm overflow-hidden mb-6 sm:mb-8">
          
          {/* Cover Photo - Deep Coffee Frame */}
          <div className="h-36 sm:h-64 md:h-72 relative group overflow-hidden bg-[#100C0A] border-b-2 border-border">
            {currentUser?.banner_url && !bannerLoadError ? (
              <img 
                src={getAssetPath(currentUser.banner_url)} 
                alt="Cover" 
                className="w-full h-full object-cover"
                onError={() => setBannerLoadError(true)}
              />
            ) : (
              /* Dedicated Default Banner: Distinct Roasted Espresso with Kohi Brand Watermark */
              <div className="w-full h-full bg-[#120E0C] relative flex items-center justify-between px-5 sm:px-10 overflow-hidden select-none">
                {/* Top Accent Line */}
                <div className="absolute top-0 inset-x-0 h-[2px] bg-primary/80" />
                {/* Bottom Accent Line */}
                <div className="absolute bottom-0 inset-x-0 h-px bg-border/60" />

                {/* Dot Grid Pattern */}
                <div 
                  className="absolute inset-0 opacity-20 pointer-events-none" 
                  style={{ 
                    backgroundImage: 'radial-gradient(circle at 2px 2px, var(--primary) 1.5px, transparent 0)', 
                    backgroundSize: '20px 20px' 
                  }} 
                />

                {/* Left Side: Coffee Brand Emblem */}
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-surface border border-primary/30 flex items-center justify-center text-primary font-black text-base sm:text-lg shadow-inner shrink-0">
                    KS
                  </div>
                  <div>
                    <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.25em] font-mono text-primary font-bold block">
                      Official Fan Space
                    </span>
                    <span className="text-sm sm:text-base font-black tracking-wider text-text-primary">
                      KOHI SEKAI
                    </span>
                    <span className="text-[8px] text-text-secondary font-mono tracking-wider block mt-0.5 sm:hidden">
                      コーヒーの世界
                    </span>
                  </div>
                </div>

                {/* Right Side: Japanese Typography Watermark (desktop & tablet) */}
                <div className="relative z-10 text-right opacity-35 hidden sm:block">
                  <span className="text-2xl lg:text-3xl font-black tracking-tighter text-text-primary font-mono block">
                    コーヒーの世界
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-primary font-mono font-bold">
                    Kohi Sekai Yogyakarta
                  </span>
                </div>

                {/* Mobile Right: subtle decorative text stack */}
                <div className="relative z-10 text-right opacity-25 sm:hidden flex flex-col items-end gap-0.5">
                  <span className="text-lg font-black tracking-tight text-text-primary font-mono">世界</span>
                  <span className="text-[7px] uppercase tracking-widest text-primary font-mono font-bold">YGK</span>
                </div>
              </div>
            )}

            {/* Cover Overlay Button — mobile: tap-only via opacity-0 + active:opacity-100, desktop: hover */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 opacity-0 active:opacity-100 md:opacity-0 md:group-hover:opacity-100">
              <button 
                type="button"
                onClick={handleOpenBannerPicker}
                className="flex items-center gap-2 px-4 py-2 bg-black/85 hover:bg-black text-white border border-primary/50 hover:border-primary rounded-full font-bold text-xs md:text-sm transition-all shadow-xl active:scale-95"
              >
                <FaImage className="text-primary" />
                <span>Pilih Banner Cover</span>
              </button>
            </div>
          </div>

          {/* Profile Details Container */}
          <div className="px-5 sm:px-8 pb-6 relative">
            {/* Avatar & Profile Identity */}
            <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6 -mt-12 md:-mt-16 relative z-10">
              
              <div className="relative group shrink-0">
                <div className="w-20 h-20 md:w-32 md:h-32 rounded-2xl border-4 border-surface bg-primary flex items-center justify-center text-white shadow-md overflow-hidden relative">
                  {currentUser?.image_url && !avatarLoadError ? (
                    <img 
                      src={getAssetPath(currentUser.image_url)} 
                      alt="Profile" 
                      className="w-full h-full object-cover" 
                      onError={() => setAvatarLoadError(true)}
                    />
                  ) : (
                    <div className="w-full h-full bg-primary flex items-center justify-center">
                      <span className="text-3xl md:text-5xl font-black uppercase tracking-wider">{currentUser?.nama?.charAt(0) || 'K'}</span>
                    </div>
                  )}
                  
                  {/* Pick Avatar Overlay */}
                  <div 
                    onClick={handleOpenAvatarPicker}
                    className="absolute inset-0 bg-black/40 transition-opacity duration-300 flex items-center justify-center cursor-pointer md:opacity-0 md:group-hover:opacity-100"
                    title="Pilih foto profil resmi idol"
                  >
                    <FaCamera className="text-xl md:text-2xl text-white" />
                  </div>
                </div>
                {/* Small camera icon explicitly shown on mobile */}
                <button 
                  type="button"
                  onClick={handleOpenAvatarPicker}
                  className="md:hidden absolute -bottom-2 -right-2 w-8 h-8 bg-surface border-2 border-border text-primary rounded-full flex items-center justify-center shadow-sm z-20"
                  title="Pilih foto profil resmi idol"
                >
                  <FaCamera className="text-xs" />
                </button>
              </div>

              {/* Name, ID, Verification, Titles, and Actions */}
              <div className="flex-1 w-full min-w-0 md:pt-16 pb-1 flex flex-col gap-2.5">
                {/* Baris 1: Nama + Tombol Aksi Desktop (sejajar vertikal dengan baris nama) */}
                <div className="flex items-center justify-between gap-4 min-w-0">
                  <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight truncate min-w-0 flex-1">
                    {currentUser?.nama || 'Fan'}
                  </h1>

                  {/* Desktop Action Buttons: sejajar vertikal dengan nama, tinggi sama, gap 10px */}
                  <div className="hidden md:flex items-center gap-[10px] shrink-0">
                    <button
                      type="button"
                      onClick={handleOpenProfileModal}
                      className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-surface hover:bg-background border border-border hover:border-primary/50 text-text-primary hover:text-primary text-xs font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
                    >
                      <FaUserEdit className="text-primary text-sm shrink-0" />
                      <span>Informasi Pribadi</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-surface hover:bg-danger/10 border border-danger/30 text-danger text-xs font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap"
                      title="Keluar dari akun"
                    >
                      <FaSignOutAlt className="text-xs shrink-0" />
                      <span>Keluar</span>
                    </button>
                  </div>
                </div>

                {/* Baris 2: ID & Badge Fan Terverifikasi */}
                <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                  <p className="text-text-secondary text-sm font-mono font-medium">
                    ID: {currentUser?.fan_id ? String(currentUser.fan_id).padStart(4, '0') : (currentUser?.id?.split('-')[1] || currentUser?.id?.substring(0,8) || 'Member')}
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-success/10 text-success border border-success/20 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    <FaCheck className="text-[9px] shrink-0" /> Fan Terverifikasi
                  </span>
                </div>

                {/* Baris 3: Kumpulan Badge Gelar (wrap rapi, ukuran seragam, warna per peringkat) */}
                {individualTitles.length > 0 && (
                  <div className="flex items-center gap-1.5 md:gap-2 flex-wrap min-w-0">
                    {individualTitles.map((item, idx) => {
                      const rankStyle = getRankBadgeStyle(item.rank)
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setShowTitlesModal(true)}
                          className={`inline-flex items-center gap-1.5 h-7 px-2.5 md:px-3 rounded-full text-[10px] md:text-[11px] font-black uppercase tracking-wider border shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer max-w-full ${rankStyle.badge}`}
                          title="Klik untuk melihat rincian gelar"
                        >
                          <FaCrown className={`${rankStyle.icon} text-[11px] shrink-0`} />
                          <span className="truncate">{item.displayLabel}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Mobile Action Buttons: 1 baris penuh 2 kolom sama lebar, tinggi min 44px */}
                <div className="md:hidden grid grid-cols-2 gap-2.5 w-full pt-0.5">
                  <button
                    type="button"
                    onClick={handleOpenProfileModal}
                    className="inline-flex items-center justify-center gap-1.5 min-h-[44px] w-full px-3 rounded-xl bg-surface hover:bg-background border border-primary/40 text-primary text-xs font-bold shadow-sm active:scale-95 transition-all"
                  >
                    <FaUserEdit size={13} className="shrink-0" />
                    <span className="truncate">Informasi Pribadi</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center justify-center gap-1.5 min-h-[44px] w-full px-3 rounded-xl bg-surface hover:bg-danger/10 border border-danger/30 text-danger text-xs font-bold shadow-sm active:scale-95 transition-all"
                    title="Keluar dari akun"
                  >
                    <FaSignOutAlt size={12} className="shrink-0" />
                    <span className="truncate">Keluar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT LAYOUT - Riwayat Pesanan Sebagai Poin Utama */}
        {/* Desktop Layout - Riwayat Pesanan Full Width */}
        <div className="hidden md:block w-full">
          {renderOrderHistory()}
        </div>

        {/* Mobile Layout - Riwayat Pesanan Full Width */}
        <div className="md:hidden space-y-6">
          {renderOrderHistory()}
        </div>

      
      

      
      {/* Hidden Offscreen Container for Direct Download */}
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', pointerEvents: 'none', zIndex: -999 }}>
        {downloadingOrder && (
          <div ref={receiptDownloadRef}>
            <DigitalReceipt
              hideActions={true}
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

      {/* INFORMASI PRIBADI MODAL (DESKTOP DIALOG & MOBILE BOTTOM-SHEET) */}
      {renderProfileModal()}

      {/* =========================================================================
          MODAL 1: OFFICIAL AVATAR PICKER (DESKTOP FULLSCREEN & MOBILE BOTTOM-SHEET)
          Anti Storage Bloat: User picks curated idol member assets without uploading
          ========================================================================= */}
      {showAvatarPicker && (
        <>
          {/* DESKTOP (hidden md:flex) - FULLSCREEN OVERLAY IN-PLACE */}
          <div className="hidden md:flex fixed inset-0 z-50 bg-[var(--background)] flex-col overflow-hidden animate-fade-in">
            {/* Fixed Header Desktop */}
            <div className="bg-[var(--surface)] border-b border-[var(--border)] px-8 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <FaUser size={18} />
                </div>
                <div>
                  <h2 className="text-base font-black text-text-primary tracking-tight uppercase">
                    PILIH FOTO PROFIL RESMI (OSHI KOHI SEKAI)
                  </h2>
                  <p className="text-xs text-text-secondary">
                    Gunakan foto resmi idol favoritmu untuk foto profil tanpa membebani penyimpanan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAvatarPicker(false)}
                className="w-9 h-9 rounded-xl bg-background border border-border text-text-secondary hover:text-text-primary flex items-center justify-center transition"
              >
                <FaTimes />
              </button>
            </div>

            {/* Scrollable Body Desktop */}
            <div className="max-w-6xl mx-auto w-full p-8 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {avatarOptions.map((opt) => {
                  const isSelected = (selectedAvatarOption === '' && opt.url === '') || (selectedAvatarOption && opt.url === selectedAvatarOption)
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedAvatarOption(opt.url)}
                      className={`relative rounded-2xl p-4 border-2 transition-all flex flex-col items-center text-center cursor-pointer group ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-lg shadow-primary/5'
                          : 'border-border bg-surface hover:border-primary/50'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow-md text-[10px]">
                          <FaCheck />
                        </div>
                      )}

                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-background border border-border mb-3 flex items-center justify-center shrink-0">
                        {opt.isInitial ? (
                          <div className="w-full h-full bg-primary flex items-center justify-center text-white font-black text-3xl">
                            {fanUser?.nama?.charAt(0) || 'K'}
                          </div>
                        ) : (
                          <img
                            src={getAssetPath(opt.url)}
                            alt={opt.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = getAssetPath('/images/members/placeholder.webp')
                            }}
                          />
                        )}
                      </div>

                      <p className="text-xs font-black text-text-primary tracking-tight truncate w-full">
                        {opt.title}
                      </p>
                      <span className="text-[10px] text-text-secondary truncate w-full mt-0.5">
                        {opt.subtitle}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Fixed Footer Desktop */}
            <div className="bg-[var(--surface)] border-t border-[var(--border)] px-8 py-4 flex items-center justify-between shrink-0">
              <div className="text-xs text-text-secondary">
                Pilihan Avatar: <strong className="text-text-primary font-bold">{avatarOptions.find(o => (selectedAvatarOption === '' && o.url === '') || (selectedAvatarOption && o.url === selectedAvatarOption))?.title || 'Kustom'}</strong>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(false)}
                  className="px-5 py-2.5 rounded-xl bg-background border border-border text-xs font-bold text-text-secondary hover:text-text-primary transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={savingAsset}
                  onClick={() => handleSaveAvatar()}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-50"
                >
                  {savingAsset ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                  <span>Terapkan Foto Profil</span>
                </button>
              </div>
            </div>
          </div>

          {/* MOBILE (md:hidden) - BOTTOM-SHEET DRAWER */}
          <div className="md:hidden fixed inset-0 z-50 bg-black/85 flex flex-col justify-end animate-fade-in">
            <div className="absolute inset-0" onClick={() => setShowAvatarPicker(false)} />
            <div className="relative w-full rounded-t-3xl max-h-[88vh] flex flex-col bg-surface border-t border-border shadow-2xl z-10 animate-slide-up overflow-hidden">
              <div className="w-12 h-1.5 rounded-full bg-border mx-auto mt-3 mb-1 shrink-0" />

              <div className="px-5 py-3 border-b border-border flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">
                    Foto Profil Resmi
                  </h3>
                  <p className="text-[10px] text-text-secondary">
                    Pilih avatar oshi favoritmu
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(false)}
                  className="w-7 h-7 rounded-lg bg-background border border-border text-text-secondary flex items-center justify-center text-xs"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="p-4 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-2 gap-3">
                {avatarOptions.map((opt) => {
                  const isSelected = (selectedAvatarOption === '' && opt.url === '') || (selectedAvatarOption && opt.url === selectedAvatarOption)
                  return (
                    <div
                      key={`mob-${opt.id}`}
                      onClick={() => setSelectedAvatarOption(opt.url)}
                      className={`relative rounded-2xl p-3 border-2 transition-all flex flex-col items-center text-center cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-md'
                          : 'border-border bg-background/50'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center text-[9px]">
                          <FaCheck />
                        </div>
                      )}

                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface border border-border mb-2 flex items-center justify-center shrink-0">
                        {opt.isInitial ? (
                          <div className="w-full h-full bg-primary flex items-center justify-center text-white font-black text-2xl">
                            {fanUser?.nama?.charAt(0) || 'K'}
                          </div>
                        ) : (
                          <img
                            src={getAssetPath(opt.url)}
                            alt={opt.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = getAssetPath('/images/members/placeholder.webp')
                            }}
                          />
                        )}
                      </div>

                      <p className="text-xs font-black text-text-primary tracking-tight truncate w-full">
                        {opt.title}
                      </p>
                      <span className="text-[9px] text-text-secondary truncate w-full">
                        {opt.subtitle}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="sticky bottom-0 bg-surface border-t border-border p-4 flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(false)}
                  className="flex-1 py-3 rounded-xl bg-background border border-border text-xs font-bold text-text-secondary text-center"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={savingAsset}
                  onClick={() => handleSaveAvatar()}
                  className="flex-1 py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider text-center flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
                >
                  {savingAsset ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                  <span>Terapkan</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          MODAL 2: OFFICIAL BANNER PICKER (DESKTOP FULLSCREEN & MOBILE BOTTOM-SHEET)
          Landscape 16:9 Cover Provided by Admin / Official Assets
          ========================================================================= */}
      {showBannerPicker && (
        <>
          {/* DESKTOP (hidden md:flex) - FULLSCREEN OVERLAY IN-PLACE */}
          <div className="hidden md:flex fixed inset-0 z-50 bg-[var(--background)] flex-col overflow-hidden animate-fade-in">
            {/* Fixed Header Desktop */}
            <div className="bg-[var(--surface)] border-b border-[var(--border)] px-8 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <FaImage size={18} />
                </div>
                <div>
                  <h2 className="text-base font-black text-text-primary tracking-tight uppercase">
                    PILIH COVER BANNER PROFIL (16:9 LANDSCAPE)
                  </h2>
                  <p className="text-xs text-text-secondary">
                    Pilih dari katalog banner landscape resmi member & grup Kohi Sekai
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBannerPicker(false)}
                className="w-9 h-9 rounded-xl bg-background border border-border text-text-secondary hover:text-text-primary flex items-center justify-center transition"
              >
                <FaTimes />
              </button>
            </div>

            {/* Scrollable Body Desktop */}
            <div className="max-w-6xl mx-auto w-full p-8 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {bannerOptions.map((opt) => {
                  const isSelected = (selectedBannerOption === '' && opt.url === '') || (selectedBannerOption && opt.url === selectedBannerOption)
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedBannerOption(opt.url)}
                      className={`relative aspect-[16/9] rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group flex flex-col justify-between ${
                        isSelected
                          ? 'border-primary shadow-xl shadow-primary/10 ring-2 ring-primary/40'
                          : 'border-border bg-surface hover:border-primary/50'
                      }`}
                    >
                      {opt.isDefault ? (
                        <div className="w-full h-full bg-[#120E0C] border-b-2 border-border flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
                          <div className="absolute top-0 inset-x-0 h-1 bg-primary/70" />
                          <div 
                            className="absolute inset-0 opacity-25 pointer-events-none" 
                            style={{ 
                              backgroundImage: 'radial-gradient(circle at 2px 2px, var(--primary) 1.5px, transparent 0)', 
                              backgroundSize: '16px 16px' 
                            }} 
                          />
                          <div className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-primary mb-2 z-10 shadow-sm">
                            <FaPalette size={18} />
                          </div>
                          <p className="text-xs font-black text-text-primary z-10">Espresso Minimalist</p>
                          <span className="text-[10px] text-text-secondary z-10 font-mono">Pola Dark Deep Coffee Resmi</span>
                        </div>
                      ) : (
                        <>
                          <img
                            src={getAssetPath(opt.url)}
                            alt={opt.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = getAssetPath('/images/members/group.webp')
                            }}
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-black/85 p-3 flex items-center justify-between border-t border-white/10">
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-black text-white tracking-tight truncate">
                                {opt.title}
                              </p>
                              <span className="text-[10px] text-zinc-400 block truncate">
                                {opt.subtitle}
                              </span>
                            </div>
                          </div>
                        </>
                      )}

                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-primary text-white flex items-center gap-1 shadow-lg text-[10px] font-bold">
                          <FaCheck size={9} />
                          <span>Dipilih</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Fixed Footer Desktop */}
            <div className="bg-[var(--surface)] border-t border-[var(--border)] px-8 py-4 flex items-center justify-between shrink-0">
              <div className="text-xs text-text-secondary">
                Pilihan Banner: <strong className="text-text-primary font-bold">{bannerOptions.find(o => (selectedBannerOption === '' && o.url === '') || (selectedBannerOption && o.url === selectedBannerOption))?.title || 'Kustom'}</strong>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowBannerPicker(false)}
                  className="px-5 py-2.5 rounded-xl bg-background border border-border text-xs font-bold text-text-secondary hover:text-text-primary transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={savingAsset}
                  onClick={() => handleSaveBanner()}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-50"
                >
                  {savingAsset ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                  <span>Terapkan Cover Banner</span>
                </button>
              </div>
            </div>
          </div>

          {/* MOBILE (md:hidden) - BOTTOM-SHEET DRAWER */}
          <div className="md:hidden fixed inset-0 z-50 bg-black/85 flex flex-col justify-end animate-fade-in">
            <div className="absolute inset-0" onClick={() => setShowBannerPicker(false)} />
            <div className="relative w-full rounded-t-3xl max-h-[88vh] flex flex-col bg-surface border-t border-border shadow-2xl z-10 animate-slide-up overflow-hidden">
              <div className="w-12 h-1.5 rounded-full bg-border mx-auto mt-3 mb-1 shrink-0" />

              <div className="px-5 py-3 border-b border-border flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-sm font-black text-text-primary uppercase tracking-tight">
                    Cover Banner Resmi
                  </h3>
                  <p className="text-[10px] text-text-secondary">
                    Pilih banner landscape favoritmu
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBannerPicker(false)}
                  className="w-7 h-7 rounded-lg bg-background border border-border text-text-secondary flex items-center justify-center text-xs"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-3">
                {bannerOptions.map((opt) => {
                  const isSelected = (selectedBannerOption === '' && opt.url === '') || (selectedBannerOption && opt.url === selectedBannerOption)
                  return (
                    <div
                      key={`mob-${opt.id}`}
                      onClick={() => setSelectedBannerOption(opt.url)}
                      className={`relative aspect-[16/9] rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary shadow-lg ring-1 ring-primary/40'
                          : 'border-border bg-background/50'
                      }`}
                    >
                      {opt.isDefault ? (
                        <div className="w-full h-full bg-[#120E0C] border-b-2 border-border flex flex-col items-center justify-center p-3 text-center relative overflow-hidden">
                          <div className="absolute top-0 inset-x-0 h-1 bg-primary/70" />
                          <div 
                            className="absolute inset-0 opacity-25 pointer-events-none" 
                            style={{ 
                              backgroundImage: 'radial-gradient(circle at 2px 2px, var(--primary) 1.5px, transparent 0)', 
                              backgroundSize: '16px 16px' 
                            }} 
                          />
                          <FaPalette className="text-primary text-xl mb-1 z-10" />
                          <p className="text-xs font-black text-text-primary z-10">Espresso Minimalist</p>
                          <span className="text-[9px] text-text-secondary z-10 font-mono">Pola Dark Deep Coffee Resmi</span>
                        </div>
                      ) : (
                        <>
                          <img
                            src={getAssetPath(opt.url)}
                            alt={opt.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = getAssetPath('/images/members/group.webp')
                            }}
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-black/85 p-2.5 flex items-center justify-between">
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-black text-white tracking-tight truncate">
                                {opt.title}
                              </p>
                              <span className="text-[9px] text-zinc-400 block truncate">
                                {opt.subtitle}
                              </span>
                            </div>
                          </div>
                        </>
                      )}

                      {isSelected && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary text-white flex items-center gap-1 text-[9px] font-bold">
                          <FaCheck size={8} />
                          <span>Dipilih</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="sticky bottom-0 bg-surface border-t border-border p-4 flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowBannerPicker(false)}
                  className="flex-1 py-3 rounded-xl bg-background border border-border text-xs font-bold text-text-secondary text-center"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={savingAsset}
                  onClick={() => handleSaveBanner()}
                  className="flex-1 py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider text-center flex items-center justify-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
                >
                  {savingAsset ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                  <span>Terapkan</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Title Details Modal */}
      {showTitlesModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowTitlesModal(false) }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 animate-fade-in"
        >
          <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto custom-scrollbar text-text-primary p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <FaTrophy className="text-yellow-400 text-lg" />
                <div>
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                    Daftar Gelar & Title Fan
                  </h3>
                  <p className="text-[11px] text-text-secondary">
                    Peringkat perolehan cheki berdasarkan periode & member
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTitlesModal(false)}
                className="w-8 h-8 rounded-lg bg-background hover:bg-surface border border-border text-text-secondary hover:text-text-primary flex items-center justify-center text-sm transition"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              {groupedTitles.map((group, idx) => (
                <div key={idx} className="bg-background border border-border rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                      <FaCrown className="text-yellow-400 text-xs" />
                      Periode {group.periodName}
                    </span>
                    <span className="text-[10px] font-mono text-text-secondary bg-surface border border-border px-2 py-0.5 rounded-full">
                      {group.members.length} Gelar
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {group.members.map((m, mIdx) => (
                      <div
                        key={mIdx}
                        className="flex items-center justify-between bg-surface border border-border px-3 py-2 rounded-lg text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                            m.rank === 1
                              ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/40'
                              : m.rank === 2
                              ? 'bg-zinc-300/20 text-zinc-200 border border-zinc-300/40'
                              : 'bg-[#CD7F32]/20 text-[#E5A067] border border-[#CD7F32]/40'
                          }`}>
                            #{m.rank}
                          </span>
                          <span className="font-semibold text-text-primary">
                            {m.memberName}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px]">
                          {m.chekiCount > 0 && (
                            <span className="text-zinc-400 font-mono">
                              {m.chekiCount} Cheki
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getRankBadgeStyle(m.rank).badge}`}>
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

      {/* Modal Konfirmasi Barang Sampai (Merch) */}
      {confirmingMerchOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="w-full max-w-md bg-surface border border-border rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <FaCheckCircle size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-text-primary uppercase tracking-tight">
                  Konfirmasi Barang Sampai
                </h3>
                <p className="text-xs text-text-secondary font-mono">
                  #{confirmingMerchOrder.order_number}
                </p>
              </div>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Pastikan pesanan merchandise kamu sudah diterima dalam kondisi baik. Setelah dikonfirmasi, status pesanan akan diubah menjadi <strong className="text-emerald-400">Selesai</strong> dan tidak dapat diubah kembali.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={confirmingMerchLoading}
                onClick={() => setConfirmingMerchOrder(null)}
                className="px-4 py-2 rounded-xl bg-background border border-border text-xs font-bold text-text-secondary hover:text-text-primary transition-all disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={confirmingMerchLoading}
                onClick={handleConfirmMerchReceived}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-black flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {confirmingMerchLoading ? (
                  <>
                    <FaSpinner className="animate-spin" size={12} />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <FaCheck size={12} />
                    <span>Ya, Sudah Diterima</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default KSProfilePage

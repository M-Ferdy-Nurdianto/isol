import React, { useState, useEffect, useRef } from 'react'
import api from '../../../lib/api'
import { showToast } from '../../../lib/toast'
import Swal from 'sweetalert2'
import HeroSection from '../../../components/home/HeroSection'
import { getAssetPath } from '../../../lib/pathUtils'
import {
  FaSave,
  FaUndo,
  FaDesktop,
  FaMobileAlt,
  FaImage,
  FaSlidersH,
  FaPalette,
  FaUpload,
  FaEye,
  FaSync,
  FaExchangeAlt,
  FaArrowLeft,
  FaArrowRight,
  FaTrash,
  FaGripVertical,
  FaTimes,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa'

const DEFAULT_TITLE = "KOHI SEKAI"
const DEFAULT_SUBTITLE = "コヒ・セカイ"
const DEFAULT_TAGLINE = "Modern Idol Group • Indonesia"

const DEFAULT_MEMBERS = [
  { id: 'cissi', name: 'CISSI', color: 'bg-[#5A8F5A]', photo: getAssetPath('/images/hero/cissi.webp?v=33'), posX: 26, posY: 25, scale: 2.1, translateX: -27, translateY: 5, mobilePosX: 50, mobilePosY: 20, mobileScale: 1.4, mobileTranslateX: 0, mobileTranslateY: 0, flipX: false, mobileFlipX: false },
  { id: 'channie', name: 'CHANNIE', color: 'bg-[#6A9F6A]', photo: getAssetPath('/images/hero/channie.webp?v=33'), posX: 39, posY: 30, scale: 2.1, translateX: -8, translateY: 8, mobilePosX: 50, mobilePosY: 25, mobileScale: 1.4, mobileTranslateX: 0, mobileTranslateY: 0, flipX: false, mobileFlipX: false },
  { id: 'aca', name: 'ACA', color: 'bg-[#4A90B5]', photo: getAssetPath('/images/hero/aca.webp?v=33'), posX: 0, posY: 23, scale: 2.1, translateX: 18, translateY: 0, mobilePosX: 50, mobilePosY: 25, mobileScale: 1.4, mobileTranslateX: 0, mobileTranslateY: 0, flipX: false, mobileFlipX: false },
  { id: 'sinta', name: 'SINTA', color: 'bg-[#4C804C]', photo: getAssetPath('/images/hero/sinta.webp?v=33'), posX: 48, posY: 31, scale: 2, translateX: 18, translateY: 6, mobilePosX: 50, mobilePosY: 25, mobileScale: 1.4, mobileTranslateX: 0, mobileTranslateY: 0, flipX: false, mobileFlipX: false },
  { id: 'cally', name: 'CALLY', color: 'bg-[#9BBF9B]', photo: getAssetPath('/images/hero/cally.webp?v=33'), posX: 27, posY: 28, scale: 1.8, translateX: 18, translateY: 0, mobilePosX: 50, mobilePosY: 25, mobileScale: 1.4, mobileTranslateX: 0, mobileTranslateY: 0, flipX: false, mobileFlipX: false },
  { id: 'rara', name: 'RARA', color: 'bg-[#386638]', photo: getAssetPath('/images/hero/rara.webp?v=33'), posX: 34, posY: 28, scale: 1.8, translateX: -14, translateY: 0, mobilePosX: 50, mobilePosY: 25, mobileScale: 1.4, mobileTranslateX: 0, mobileTranslateY: 0, flipX: false, mobileFlipX: false },
]

// Ukuran referensi ini WAJIB SAMA dengan asumsi desain foto member (posX/posY/scale).
// Semua kalkulasi crop foto di preview mengacu ke angka ini, bukan window browser admin.
const REFERENCE_DESKTOP = { width: 1440, height: 800 }
const REFERENCE_MOBILE = { width: 390, height: 600 } // 600 = tinggi total area mobile (header + 6 member photo strips x 80px) agar semua member terlihat utuh

const COLOR_PRESETS = [
  { label: 'Green Deep', value: 'bg-[#386638]' },
  { label: 'Green Emerald', value: 'bg-[#5A8F5A]' },
  { label: 'Green Sage', value: 'bg-[#6A9F6A]' },
  { label: 'Green Mint', value: 'bg-[#9BBF9B]' },
  { label: 'Teal Ocean', value: 'bg-[#4A90B5]' },
  { label: 'Teal Dark', value: 'bg-[#079108]' },
  { label: 'Kawaii Pink', value: 'bg-[#E91E63]' },
  { label: 'Purple Metal', value: 'bg-[#9C27B0]' },
  { label: 'Amber Gold', value: 'bg-[#FF9800]' },
]

const HeroTab = () => {
  const [heroTitle, setHeroTitle] = useState(DEFAULT_TITLE)
  const [heroSubtitle, setHeroSubtitle] = useState(DEFAULT_SUBTITLE)
  const [heroTagline, setHeroTagline] = useState(DEFAULT_TAGLINE)

  const [heroTitleColor, setHeroTitleColor] = useState('#FFFFFF')
  const [heroSubtitleColor, setHeroSubtitleColor] = useState('#FBBF24')
  const [heroTaglineColor, setHeroTaglineColor] = useState('#FFFFFF')

  const [members, setMembers] = useState(DEFAULT_MEMBERS)
  
  const [selectedMemberId, setSelectedMemberId] = useState('cissi')
  const [previewMode, setPreviewMode] = useState('desktop') // 'desktop' | 'mobile'
  const [deviceEditMode, setDeviceEditMode] = useState('desktop') // 'desktop' | 'mobile'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingMemberId, setUploadingMemberId] = useState(null)
  const [activePreviewMemberId, setActivePreviewMemberId] = useState(null)
  const [showFullscreenModal, setShowFullscreenModal] = useState(false)

  const previewContainerRef = useRef(null)
  const [previewScale, setPreviewScale] = useState(1)

  // Horizontal Tab Scroll Controls
  const memberTabsScrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkTabScroll = () => {
    const el = memberTabsScrollRef.current
    if (!el) return
    const hasOverflow = el.scrollWidth > el.clientWidth + 2
    setCanScrollLeft(el.scrollLeft > 2)
    setCanScrollRight(hasOverflow && el.scrollLeft < (el.scrollWidth - el.clientWidth - 2))
  }

  useEffect(() => {
    checkTabScroll()
    window.addEventListener('resize', checkTabScroll)
    return () => window.removeEventListener('resize', checkTabScroll)
  }, [members])

  const scrollTabs = (direction) => {
    const el = memberTabsScrollRef.current
    if (!el) return
    const scrollAmount = 220
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
    setTimeout(checkTabScroll, 300)
  }

  useEffect(() => {
    const el = previewContainerRef.current
    if (!el) return
    const isMobile = previewMode === 'mobile'
    const refWidth = isMobile ? REFERENCE_MOBILE.width : REFERENCE_DESKTOP.width
    const refHeight = isMobile ? (REFERENCE_MOBILE.height + 60) : REFERENCE_DESKTOP.height

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          const scaleX = width / refWidth
          const scaleY = height / refHeight
          setPreviewScale(Math.min(scaleX, scaleY))
        }
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [previewMode])

  useEffect(() => {
    fetchHeroConfig()
  }, [])

  const fetchHeroConfig = async () => {
    try {
      setLoading(true)
      const res = await api.get('/config')
      const configData = res.data?.data || {}
      if (configData.hero_settings) {
        let settings = configData.hero_settings
        if (typeof settings === 'string') {
          try { settings = JSON.parse(settings) } catch (_) {}
        }
        if (settings.title) setHeroTitle(settings.title)
        if (settings.subtitle) setHeroSubtitle(settings.subtitle)
        if (settings.tagline) setHeroTagline(settings.tagline)
        if (settings.titleColor) setHeroTitleColor(settings.titleColor)
        if (settings.subtitleColor) setHeroSubtitleColor(settings.subtitleColor)
        if (settings.taglineColor) setHeroTaglineColor(settings.taglineColor)
        if (Array.isArray(settings.members) && settings.members.length > 0) {
          setMembers(settings.members)
        }
      }
    } catch (error) {
      console.error('Failed to load hero config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const heroPayload = {
        title: heroTitle,
        subtitle: heroSubtitle,
        tagline: heroTagline,
        titleColor: heroTitleColor,
        subtitleColor: heroSubtitleColor,
        taglineColor: heroTaglineColor,
        members: members
      }

      await api.patch('/config', {
        hero_settings: JSON.stringify(heroPayload)
      })

      showToast.success('Konfigurasi Hero berhasil disimpan!')
    } catch (error) {
      console.error('Error saving hero config:', error)
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: error.response?.data?.error || error.message
      })
    } finally {
      setSaving(false)
    }
  }

  const [syncing, setSyncing] = useState(false)

  const handleSyncFromMembers = async () => {
    try {
      setSyncing(true)
      const res = await api.get(`/members?_t=${Date.now()}`)
      const dbMembers = res.data?.data || []

      // Filter: hanya member aktif (hadir !== false) dan bukan entitas khusus 'group'
      const activeDbMembers = dbMembers
        .filter(m => m.hadir !== false && m.member_id !== 'group')
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))

      if (activeDbMembers.length === 0) {
        showToast.warning('Tidak ada member aktif di database untuk disinkronkan.')
        return
      }

      // Map & merge dengan settingan hero yang sudah ada
      const newHeroMembers = activeDbMembers.map(dbM => {
        const dbId = String(dbM.member_id || dbM.id || '').toLowerCase().trim()
        const dbName = String(dbM.nama_panggung || '').toLowerCase().trim()

        // Cari di hero settings: periksa apakah ID cocok persis, atau variasi slug (e.g. aca <-> acaa)
        const existingHeroM = members.find(m => {
          const heroId = String(m.id || '').toLowerCase().trim()
          const heroName = String(m.name || '').toLowerCase().trim()
          if (heroId === dbId || heroId === String(dbM.id).toLowerCase()) return true
          if (heroName === dbName) return true
          // Khusus toleransi aca vs acaa
          if ((heroId === 'aca' || heroId === 'acaa') && (dbId === 'aca' || dbId === 'acaa')) return true
          return false
        })

        if (existingHeroM) {
          // Tetap gunakan settingan hero & FOTO HERO yang sudah ada (tidak menimpa dengan foto profil)
          return {
            ...existingHeroM,
            id: dbId, // Selaraskan ID dengan database
            name: (dbM.nama_panggung || existingHeroM.name || '').toUpperCase()
          }
        }

        // Jika member baru yang belum ada di hero:
        // 1. Cek ketersediaan foto hero resmi (e.g. storage /hero/id.webp)
        // 2. Jika tidak ada, pakai foto galeri nomor 1
        // 3. Jika tidak ada, pakai placeholder siluet
        const galleryFirstPhoto = dbM.member_gallery?.[0]?.image_url
        let initialPhoto = getAssetPath('/images/members/placeholder.svg')
        
        // Jika member secret / silhouette
        if (dbM.is_secret && dbM.silhouette_image_url) {
          initialPhoto = dbM.silhouette_image_url
        } else if (galleryFirstPhoto && typeof galleryFirstPhoto === 'string' && galleryFirstPhoto.trim()) {
          initialPhoto = (galleryFirstPhoto.startsWith('http') || galleryFirstPhoto.startsWith('/')) 
            ? galleryFirstPhoto 
            : getAssetPath(`/images/members/${galleryFirstPhoto}`)
        } else if (dbM.image_url && typeof dbM.image_url === 'string' && dbM.image_url.trim()) {
          initialPhoto = dbM.image_url
        }

        return {
          id: dbId,
          name: dbM.is_secret ? '???' : (dbM.nama_panggung || 'MEMBER').toUpperCase(),
          color: dbM.color || 'bg-[#5A8F5A]',
          photo: initialPhoto,
          is_secret: Boolean(dbM.is_secret),
          posX: 50,
          posY: 30,
          scale: 1.8,
          translateX: 0,
          translateY: 0,
          mobilePosX: 50,
          mobilePosY: 25,
          mobileScale: 1.4,
          mobileTranslateX: 0,
          mobileTranslateY: 0,
          flipX: false,
          mobileFlipX: false
        }
      })

      setMembers(newHeroMembers)
      if (newHeroMembers.length > 0 && !newHeroMembers.some(m => m.id === selectedMemberId)) {
        setSelectedMemberId(newHeroMembers[0].id)
      }

      const diffCount = newHeroMembers.length - members.length
      if (diffCount > 0) {
        showToast.success(`Berhasil! ${diffCount} member baru ditambahkan ke Hero sesuai urutan. Jangan lupa klik "Simpan Perubahan".`)
      } else {
        showToast.success(`Daftar member Hero berhasil disinkronkan (${newHeroMembers.length} member). Jangan lupa klik "Simpan Perubahan".`)
      }
    } catch (error) {
      console.error('Error syncing members to hero:', error)
      showToast.error(error.response?.data?.error || error.message, 'Gagal sinkronisasi member')
    } finally {
      setSyncing(false)
    }
  }

  const handleResetDefault = () => {
    Swal.fire({
      title: 'Reset Konfigurasi Hero?',
      text: 'Mengembalikan judul, warna, dan tata letak hero ke setelan standar.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#079108',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Ya, Reset',
      cancelButtonText: 'Batal'
    }).then((res) => {
      if (res.isConfirmed) {
        setHeroTitle(DEFAULT_TITLE)
        setHeroSubtitle(DEFAULT_SUBTITLE)
        setHeroTagline(DEFAULT_TAGLINE)
        setHeroTitleColor('#FFFFFF')
        setHeroSubtitleColor('#FBBF24')
        setHeroTaglineColor('#FFFFFF')
        setMembers(DEFAULT_MEMBERS)
        showToast.info('Hero di-reset ke nilai default')
      }
    })
  }

  const updateSelectedMember = (key, value) => {
    setMembers(prev => prev.map(m => m.id === selectedMemberId ? { ...m, [key]: value } : m))
  }

  // Drag and drop sorting state
  const [draggedIdx, setDraggedIdx] = useState(null)
  const [dragOverIdx, setDragOverIdx] = useState(null)

  const handleDragStart = (e, index) => {
    setDraggedIdx(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverIdx !== index) {
      setDragOverIdx(index)
    }
  }

  const handleDrop = (e, targetIdx) => {
    e.preventDefault()
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null)
      setDragOverIdx(null)
      return
    }

    const updated = [...members]
    const [movedItem] = updated.splice(draggedIdx, 1)
    updated.splice(targetIdx, 0, movedItem)

    setMembers(updated)
    setDraggedIdx(null)
    setDragOverIdx(null)
    showToast.success(`Urutan ${movedItem.name} berhasil digeser!`)
  }

  const handleDragEnd = () => {
    setDraggedIdx(null)
    setDragOverIdx(null)
  }

  // Geser posisi urutan member panggung hero ke kiri (lebih dulu)
  const handleMoveMember = (index, direction) => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= members.length) return
    const newMembers = [...members]
    const temp = newMembers[index]
    newMembers[index] = newMembers[targetIndex]
    newMembers[targetIndex] = temp
    setMembers(newMembers)
    showToast.success(`Urutan ${temp.name} dipindah ke ${direction === 'left' ? 'kiri' : 'kanan'}.`)
  }

  // Keluarkan member dari panggung Hero
  const handleRemoveMemberFromHero = (memberId, memberName) => {
    if (members.length <= 1) {
      showToast.warning('Panggung Hero minimal harus memiliki 1 member!')
      return
    }
    Swal.fire({
      title: `Keluarkan ${memberName} dari Hero?`,
      text: 'Member ini akan disembunyikan dari kolom landing page Hero (tidak menghapus data aslinya di menu Member).',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Ya, Keluarkan',
      cancelButtonText: 'Batal'
    }).then((res) => {
      if (res.isConfirmed) {
        const remaining = members.filter(m => m.id !== memberId)
        setMembers(remaining)
        if (selectedMemberId === memberId) {
          setSelectedMemberId(remaining[0]?.id || null)
        }
        showToast.success(`${memberName} dikeluarkan dari barisan Hero. Jangan lupa klik "Simpan Perubahan".`)
      }
    })
  }

  const handleImageUpload = async (memberId, file) => {
    if (!file) return
    try {
      setUploadingMemberId(memberId)
      const formData = new FormData()
      formData.append('file', file)

      const res = await api.post('/upload/member-image?type=hero', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const imageUrl = res.data?.data?.url
      if (imageUrl) {
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, photo: imageUrl } : m))
        showToast.success('Foto Hero Member diperbarui!')
      }
    } catch (error) {
      console.error('Upload error:', error)
      Swal.fire({ icon: 'error', title: 'Upload Gagal', text: error.response?.data?.error || error.message })
    } finally {
      setUploadingMemberId(null)
    }
  }

  const currentMember = members.find(m => m.id === selectedMemberId) || members[0]

  const getMemberOverlayStyle = (colorVal) => {
    if (!colorVal) return {}
    if (colorVal.startsWith('#') || colorVal.startsWith('rgb') || colorVal.startsWith('hsl')) {
      return { backgroundColor: colorVal }
    }
    return {}
  }

  const getMemberOverlayClass = (colorVal) => {
    if (!colorVal) return 'bg-[#5A8F5A]'
    if (colorVal.startsWith('bg-')) return colorVal
    return ''
  }

  // Active key mappings based on deviceEditMode ('desktop' vs 'mobile')
  const posXKey = deviceEditMode === 'desktop' ? 'posX' : 'mobilePosX'
  const posYKey = deviceEditMode === 'desktop' ? 'posY' : 'mobilePosY'
  const scaleKey = deviceEditMode === 'desktop' ? 'scale' : 'mobileScale'
  const translateXKey = deviceEditMode === 'desktop' ? 'translateX' : 'mobileTranslateX'
  const translateYKey = deviceEditMode === 'desktop' ? 'translateY' : 'mobileTranslateY'
  const flipXKey = deviceEditMode === 'desktop' ? 'flipX' : 'mobileFlipX'

  const currentPosX = deviceEditMode === 'desktop' ? (currentMember?.posX ?? 50) : (currentMember?.mobilePosX ?? currentMember?.posX ?? 50)
  const currentPosY = deviceEditMode === 'desktop' ? (currentMember?.posY ?? 50) : (currentMember?.mobilePosY ?? currentMember?.posY ?? 50)
  const currentScale = deviceEditMode === 'desktop' ? (currentMember?.scale ?? 1) : (currentMember?.mobileScale ?? currentMember?.scale ?? 1)
  const currentTranslateX = deviceEditMode === 'desktop' ? (currentMember?.translateX ?? 0) : (currentMember?.mobileTranslateX ?? currentMember?.translateX ?? 0)
  const currentTranslateY = deviceEditMode === 'desktop' ? (currentMember?.translateY ?? 0) : (currentMember?.mobileTranslateY ?? currentMember?.translateY ?? 0)
  const currentFlipX = deviceEditMode === 'desktop' ? (currentMember?.flipX ?? false) : (currentMember?.mobileFlipX ?? currentMember?.flipX ?? false)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <FaSync className="animate-spin text-3xl text-[#079108]" />
          <span className="text-sm font-bold text-zinc-400">Memuat Konfigurasi Hero...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0c111d]/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-tight">
            Pengaturan Hero
          </h1>
          <p className="text-xs font-semibold text-zinc-400 mt-1">
            Visual & layout hero section.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSyncFromMembers}
            disabled={syncing || saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-teal-300 bg-teal-500/10 border border-teal-500/30 hover:bg-teal-500/20 transition-all disabled:opacity-50"
            title="Tarik member aktif dari database secara otomatis sesuai urutan order_index"
          >
            <FaSync className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Sinkronisasi...' : 'Sync dari Member'}
          </button>
          <button
            onClick={() => setShowFullscreenModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-[#079108] bg-[#079108]/10 border border-[#079108]/30 hover:bg-[#079108]/20 transition-all"
          >
            <FaEye /> Fullscreen View
          </button>
          <button
            onClick={handleResetDefault}
            disabled={saving || syncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
          >
            <FaUndo /> Reset Default
          </button>
          <button
            onClick={handleSave}
            disabled={saving || syncing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#079108] hover:bg-[#067a07] shadow-[0_0_15px_rgba(7,145,8,0.4)] transition-all disabled:opacity-50"
          >
            <FaSave /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>

      {/* Main Split Screen View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Controls & Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. General Hero Text & Color Settings */}
          <div className="bg-[#0c111d]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-[#079108]">
              Teks Header & Warna Judul
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Judul Utama */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-zinc-400 uppercase">
                  Judul Utama
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={heroTitle}
                    onChange={(e) => setHeroTitle(e.target.value)}
                    className="flex-1 bg-[#111726] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-bold focus:outline-none focus:border-[#079108] transition-all"
                    placeholder="KOHI SEKAI"
                  />
                  <div className="flex items-center gap-1.5 bg-[#111726] border border-white/10 rounded-xl px-2">
                    <input
                      type="color"
                      value={heroTitleColor || '#FFFFFF'}
                      onChange={(e) => setHeroTitleColor(e.target.value)}
                      className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                      title="Pilih Warna Judul Utama"
                    />
                  </div>
                </div>
              </div>

              {/* Subtitle Jepang */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase">
                    Subtitle Jepang
                  </label>
                  <span className="text-[10px] text-[#079108] font-bold">Bisa Ubah Warna</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={heroSubtitle}
                    onChange={(e) => setHeroSubtitle(e.target.value)}
                    className="flex-1 bg-[#111726] border border-white/10 rounded-xl px-3.5 py-2 text-sm font-bold focus:outline-none focus:border-[#079108] transition-all"
                    style={{ color: heroSubtitleColor || '#FBBF24' }}
                    placeholder="リフレッシュ・ブリーズ"
                  />
                  <div className="flex items-center gap-1.5 bg-[#111726] border border-white/10 rounded-xl px-2">
                    <input
                      type="color"
                      value={heroSubtitleColor || '#FBBF24'}
                      onChange={(e) => setHeroSubtitleColor(e.target.value)}
                      className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                      title="Pilih Warna Tulisan Jepang"
                    />
                  </div>
                </div>
              </div>

              {/* Tagline */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-[11px] font-bold text-zinc-400 uppercase">
                  Tagline / Sub-Header
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={heroTagline}
                    onChange={(e) => setHeroTagline(e.target.value)}
                    className="flex-1 bg-[#111726] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#079108] transition-all"
                    style={{ color: heroTaglineColor || '#FFFFFF' }}
                    placeholder="Japanese Style Idol Group • Tulungagung"
                  />
                  <div className="flex items-center gap-1.5 bg-[#111726] border border-white/10 rounded-xl px-2">
                    <input
                      type="color"
                      value={heroTaglineColor || '#FFFFFF'}
                      onChange={(e) => setHeroTaglineColor(e.target.value)}
                      className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                      title="Pilih Warna Tagline"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* 2. Member Hero Customizer */}
          <div className="bg-[#0c111d]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-[#079108]">
                Foto & Posisi Member
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/5 text-zinc-300 border border-white/10">
                  {members.length} Member Aktif di Hero
                </span>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#079108]/20 text-[#079108] border border-[#079108]/30">
                  Dipilih: {currentMember?.name}
                </span>
              </div>
            </div>

            {/* Member Selector Tabs with Horizontal Scroll, Arrows & Reorder Controls */}
            <div className="space-y-3 pb-3 border-b border-white/10">
              <div className="relative group">
                {/* Scroll Button Left */}
                {canScrollLeft && (
                  <button
                    type="button"
                    onClick={() => scrollTabs('left')}
                    className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-[#161f33] border border-white/20 text-white shadow-xl flex items-center justify-center hover:bg-[#079108] hover:border-[#079108] transition-all text-xs"
                    title="Geser ke kiri"
                  >
                    <FaChevronLeft className="text-[10px]" />
                  </button>
                )}

                {/* Left Gradient Fade Indicator */}
                {canScrollLeft && (
                  <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0c111d] to-transparent z-10" />
                )}

                {/* Horizontal Scrollable Tabs Container */}
                <div
                  ref={memberTabsScrollRef}
                  onScroll={checkTabScroll}
                  className="flex items-center gap-2 overflow-x-auto custom-scrollbar scroll-smooth py-1 px-0.5"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {members.map((m, idx) => (
                    <div
                      key={m.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={(e) => handleDrop(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center shrink-0 rounded-xl p-1 border cursor-grab active:cursor-grabbing select-none transition-all duration-150 ${
                        draggedIdx === idx ? 'opacity-40 scale-95 border-dashed border-[#079108]' : ''
                      } ${
                        dragOverIdx === idx && draggedIdx !== idx
                          ? 'border-2 border-teal-400 scale-105 bg-teal-500/20'
                          : ''
                      } ${
                        selectedMemberId === m.id
                          ? 'bg-[#079108] border-[#079108] shadow-[0_0_12px_rgba(7,145,8,0.5)]'
                          : 'bg-[#111726] border-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* Drag Grip Handle */}
                      <div 
                        className="text-zinc-400 hover:text-white px-1 cursor-grab"
                        title="Tahan dan geser (drag & drop) untuk ubah urutan"
                      >
                        <FaGripVertical className="text-xs opacity-60" />
                      </div>

                      {/* Member Select Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedMemberId(m.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase flex items-center gap-2 transition-all ${
                          selectedMemberId === m.id ? 'text-white' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <span 
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${getMemberOverlayClass(m.color)}`} 
                          style={getMemberOverlayStyle(m.color)}
                        />
                        <span className="whitespace-nowrap">{m.name}</span>
                      </button>

                      {/* Delete Member from Hero Button */}
                      <div className="flex items-center pr-1 pl-1 border-l border-white/10 ml-0.5">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRemoveMemberFromHero(m.id, m.name); }}
                          title="Keluarkan dari Hero Section"
                          className="p-1 text-[10px] rounded hover:bg-red-500/30 text-red-300 hover:text-red-200 transition"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Gradient Fade Indicator */}
                {canScrollRight && (
                  <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0c111d] to-transparent z-10" />
                )}

                {/* Scroll Button Right */}
                {canScrollRight && (
                  <button
                    type="button"
                    onClick={() => scrollTabs('right')}
                    className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-[#161f33] border border-white/20 text-white shadow-xl flex items-center justify-center hover:bg-[#079108] hover:border-[#079108] transition-all text-xs"
                    title="Geser ke kanan"
                  >
                    <FaChevronRight className="text-[10px]" />
                  </button>
                )}
              </div>
            </div>

            {/* Editing Panel for Selected Member */}
            {currentMember && (
              <div className="space-y-5">
                {/* Photo Upload & Preview Row */}
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#111726] border border-white/10 p-4 rounded-xl">
                  <div className="relative w-24 h-32 rounded-xl overflow-hidden border border-white/20 bg-black flex-shrink-0 group">
                    <img
                      src={currentMember.photo}
                      alt={currentMember.name}
                      className="w-full h-full object-cover"
                      style={{
                        objectPosition: `${currentPosX}% ${currentPosY}%`,
                        transform: `scale(${currentScale}) translate(${currentTranslateX}px, ${currentTranslateY}px) ${currentFlipX ? 'scaleX(-1)' : ''}`
                      }}
                    />
                    <div 
                      className={`absolute inset-0 ${getMemberOverlayClass(currentMember.color)} mix-blend-multiply opacity-40`} 
                      style={getMemberOverlayStyle(currentMember.color)}
                    />
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <h3 className="text-sm font-black text-white uppercase">{currentMember.name} - Hero Image</h3>
                    <p className="text-[11px] text-zinc-400">
                      Upload foto khusus untuk kolom hero (Rasio ideal vertical portrait 2:3).
                    </p>
                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#079108]/20 border border-[#079108]/40 hover:bg-[#079108]/30 text-[#079108] text-xs font-bold rounded-xl cursor-pointer transition-all">
                        <FaUpload />
                        {uploadingMemberId === currentMember.id ? 'Uploading...' : 'Upload Foto Hero'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(currentMember.id, e.target.files[0])}
                          disabled={uploadingMemberId === currentMember.id}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => updateSelectedMember(flipXKey, !currentFlipX)}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                          currentFlipX
                            ? 'bg-[#079108] text-white border-[#079108] shadow-[0_0_10px_rgba(7,145,8,0.4)]'
                            : 'bg-white/5 text-zinc-300 border-white/10 hover:text-white hover:bg-white/10'
                        }`}
                        title="Balik posisi foto secara horizontal (Efek Cermin Kiri - Kanan)"
                      >
                        <FaExchangeAlt /> {currentFlipX ? 'Cermin: Aktif (Di-flip)' : 'Cermin Foto (Flip)'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Device Edit Mode Selector Tab (Desktop vs Mobile) */}
                <div className="flex items-center justify-between bg-[#111726] border border-white/10 p-2 rounded-xl">
                  <span className="text-xs font-bold text-zinc-300 pl-2 flex items-center gap-1.5">
                    Pengaturan Mode:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => { setDeviceEditMode('desktop'); setPreviewMode('desktop'); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        deviceEditMode === 'desktop'
                          ? 'bg-[#079108] text-white shadow-[0_0_10px_rgba(7,145,8,0.4)]'
                          : 'text-zinc-400 hover:text-white bg-white/5'
                      }`}
                    >
                      Desktop
                    </button>
                    <button
                      onClick={() => { setDeviceEditMode('mobile'); setPreviewMode('mobile'); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        deviceEditMode === 'mobile'
                          ? 'bg-[#079108] text-white shadow-[0_0_10px_rgba(7,145,8,0.4)]'
                          : 'text-zinc-400 hover:text-white bg-white/5'
                      }`}
                    >
                      Mobile
                    </button>
                  </div>
                </div>

                {/* Sliders Grid - User Friendly Labels */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Position X */}
                  <div className="bg-[#111726] border border-white/10 p-3.5 rounded-xl space-y-1">
                    <div className="flex justify-between text-xs font-bold text-zinc-300">
                      <span>Fokus Foto ({deviceEditMode === 'mobile' ? 'Mobile' : 'Desktop'} Kiri - Kanan)</span>
                      <span className="text-[#079108] font-mono">{currentPosX}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={currentPosX}
                      onChange={(e) => updateSelectedMember(posXKey, parseInt(e.target.value, 10))}
                      className="w-full accent-[#079108] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-zinc-500 font-semibold">
                      <span>Kiri (0%)</span>
                      <span>Tengah (50%)</span>
                      <span>Kanan (100%)</span>
                    </div>
                  </div>

                  {/* Position Y */}
                  <div className="bg-[#111726] border border-white/10 p-3.5 rounded-xl space-y-1">
                    <div className="flex justify-between text-xs font-bold text-zinc-300">
                      <span>Fokus Foto ({deviceEditMode === 'mobile' ? 'Mobile' : 'Desktop'} Atas - Bawah)</span>
                      <span className="text-[#079108] font-mono">{currentPosY}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={currentPosY}
                      onChange={(e) => updateSelectedMember(posYKey, parseInt(e.target.value, 10))}
                      className="w-full accent-[#079108] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-zinc-500 font-semibold">
                      <span>Atas (0%)</span>
                      <span>Tengah (50%)</span>
                      <span>Bawah (100%)</span>
                    </div>
                  </div>

                  {/* Scale (Zoom) */}
                  <div className="bg-[#111726] border border-white/10 p-3.5 rounded-xl space-y-1">
                    <div className="flex justify-between text-xs font-bold text-zinc-300">
                      <span>Perbesaran Foto ({deviceEditMode === 'mobile' ? 'Mobile' : 'Desktop'} Zoom)</span>
                      <span className="text-[#079108] font-mono">{currentScale.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="3.5"
                      step="0.1"
                      value={currentScale}
                      onChange={(e) => updateSelectedMember(scaleKey, parseFloat(e.target.value))}
                      className="w-full accent-[#079108] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-zinc-500 font-semibold">
                      <span>Normal (1.0x)</span>
                      <span>Zoom (3.5x)</span>
                    </div>
                  </div>

                  {/* Offset Translate X */}
                  <div className="bg-[#111726] border border-white/10 p-3.5 rounded-xl space-y-1">
                    <div className="flex justify-between text-xs font-bold text-zinc-300">
                      <span>Geser Posisi ({deviceEditMode === 'mobile' ? 'Mobile' : 'Desktop'} Kiri - Kanan)</span>
                      <span className="text-[#079108] font-mono">{currentTranslateX}px</span>
                    </div>
                    <input
                      type="range"
                      min="-60"
                      max="60"
                      value={currentTranslateX}
                      onChange={(e) => updateSelectedMember(translateXKey, parseInt(e.target.value, 10))}
                      className="w-full accent-[#079108] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-zinc-500 font-semibold">
                      <span>Kiri (-60px)</span>
                      <span>Pas (0px)</span>
                      <span>Kanan (+60px)</span>
                    </div>
                  </div>

                  {/* Offset Translate Y */}
                  <div className="bg-[#111726] border border-white/10 p-3.5 rounded-xl space-y-1 sm:col-span-2">
                    <div className="flex justify-between text-xs font-bold text-zinc-300">
                      <span>Geser Posisi ({deviceEditMode === 'mobile' ? 'Mobile' : 'Desktop'} Atas - Bawah)</span>
                      <span className="text-[#079108] font-mono">{currentTranslateY}px</span>
                    </div>
                    <input
                      type="range"
                      min="-60"
                      max="60"
                      value={currentTranslateY}
                      onChange={(e) => updateSelectedMember(translateYKey, parseInt(e.target.value, 10))}
                      className="w-full accent-[#079108] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-zinc-500 font-semibold">
                      <span>Atas (-60px)</span>
                      <span>Pas (0px)</span>
                      <span>Bawah (+60px)</span>
                    </div>
                  </div>
                </div>

                {/* Color Overlay Selector + Custom Color Picker */}
                <div className="bg-[#111726] border border-white/10 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                      <FaPalette className="text-[#079108]" /> Warna Tint / Overlay Foto Member
                    </label>
                    <span className="text-[10px] font-mono text-[#079108] font-bold">
                      {currentMember.color}
                    </span>
                  </div>

                  {/* Preset Colors */}
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => updateSelectedMember('color', preset.value)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-2 border transition-all ${
                          currentMember.color === preset.value
                            ? 'border-white text-white shadow-md ring-2 ring-[#079108]'
                            : 'border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${preset.value}`} />
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Color Input Picker */}
                  <div className="pt-2 border-t border-white/10 flex items-center gap-3">
                    <span className="text-xs font-bold text-zinc-400">Pilih Warna Custom:</span>
                    <input
                      type="color"
                      value={currentMember.color?.startsWith('#') ? currentMember.color : '#5A8F5A'}
                      onChange={(e) => updateSelectedMember('color', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      title="Pilih Warna Kustom Sendiri"
                    />
                    <input
                      type="text"
                      value={currentMember.color || ''}
                      onChange={(e) => updateSelectedMember('color', e.target.value)}
                      className="w-32 bg-[#0c111d] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-[#079108]"
                      placeholder="#5A8F5A"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Live Preview Window (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-6 bg-[#0c111d]/90 backdrop-blur-xl border border-white/15 rounded-2xl p-4 shadow-2xl space-y-4">
            
            {/* Live Preview Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Live Preview
                </span>
              </div>

              {/* Viewport Mode Switcher */}
              <div className="flex items-center bg-[#111726] p-1 rounded-xl border border-white/10 gap-1">
                <button
                  onClick={() => { setPreviewMode('desktop'); setDeviceEditMode('desktop'); }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    previewMode === 'desktop'
                      ? 'bg-[#079108] text-white shadow-[0_0_8px_rgba(7,145,8,0.4)]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <FaDesktop /> Desktop
                </button>
                <button
                  onClick={() => { setPreviewMode('mobile'); setDeviceEditMode('mobile'); }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    previewMode === 'mobile'
                      ? 'bg-[#079108] text-white shadow-[0_0_8px_rgba(7,145,8,0.4)]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <FaMobileAlt /> Mobile
                </button>
                <button
                  onClick={() => setShowFullscreenModal(true)}
                  title="Fullscreen Preview"
                  className="px-2 py-1 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <FaEye />
                </button>
              </div>
            </div>

            {/* Preview Viewport Canvas Box */}
            <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black/60 backdrop-blur-md shadow-inner flex flex-col items-center justify-center min-h-[500px] p-2">
              {previewMode === 'desktop' ? (
                <div ref={previewContainerRef} className="w-full h-[480px] overflow-hidden relative flex items-center justify-center">
                  <div 
                    className="origin-center flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-white/20"
                    style={{
                      width: REFERENCE_DESKTOP.width,
                      height: REFERENCE_DESKTOP.height,
                      transform: `scale(${previewScale})`
                    }}
                  >
                    <HeroSection
                      members={members}
                      heroTitle={heroTitle}
                      heroSubtitle={heroSubtitle}
                      heroTagline={heroTagline}
                      heroTitleColor={heroTitleColor}
                      heroSubtitleColor={heroSubtitleColor}
                      heroTaglineColor={heroTaglineColor}
                      activeMemberId={activePreviewMemberId}
                      setActiveMemberId={setActivePreviewMemberId}
                      isPreview={true}
                      previewMode="desktop"
                      previewHeight={REFERENCE_DESKTOP.height}
                    />
                  </div>
                </div>
              ) : (
                <div ref={previewContainerRef} className="w-full h-[540px] overflow-hidden relative flex items-center justify-center">
                  <div 
                    className="origin-center flex-shrink-0 rounded-[40px] border-[8px] border-zinc-800 bg-[#0c111d] overflow-hidden shadow-2xl flex flex-col"
                    style={{
                      width: REFERENCE_MOBILE.width,
                      height: REFERENCE_MOBILE.height + 60, // +60 untuk status bar & app header yang ikut ditampilkan
                      transform: `scale(${previewScale})`
                    }}
                  >
                    {/* Top Status Bar */}
                    <div className="w-full bg-[#0c111d] pt-2.5 px-5 pb-1 flex items-center justify-between border-b border-white/5 text-zinc-400 text-[10px] font-mono flex-shrink-0">
                      <span>11:04 AM</span>
                      <div className="w-14 h-3 bg-zinc-800 rounded-full" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#079108] animate-pulse" />
                    </div>

                    {/* App Mini Header Bar */}
                    <div className="bg-[#0c111d] px-4 py-2.5 flex items-center justify-between border-b border-white/10 text-white flex-shrink-0">
                      <span className="text-xs font-black uppercase tracking-tight">REFRESH<span className="text-[#079108]">BREEZE</span></span>
                      <div className="w-5 h-5 rounded-full bg-[#079108]/20 flex items-center justify-center text-[9px] font-bold text-[#079108]">🌙</div>
                    </div>

                    {/* Scrollable Mobile Hero Canvas */}
                    <div className="flex-1 overflow-y-auto bg-[#0c111d] custom-scrollbar">
                      <HeroSection
                        members={members}
                        heroTitle={heroTitle}
                        heroSubtitle={heroSubtitle}
                        heroTagline={heroTagline}
                        heroTitleColor={heroTitleColor}
                        heroSubtitleColor={heroSubtitleColor}
                        heroTaglineColor={heroTaglineColor}
                        activeMemberId={activePreviewMemberId}
                        setActiveMemberId={setActivePreviewMemberId}
                        isPreview={true}
                        previewMode="mobile"
                        previewHeight={REFERENCE_MOBILE.height}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11px] text-center font-medium text-zinc-400">
              *Tampilan di atas langsung menyesuaikan hasil edit slider & warna secara instan.
            </p>
          </div>
        </div>

      </div>

      {/* FULLSCREEN PREVIEW MODAL */}
      {showFullscreenModal && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col animate-fade-in">
          {/* Modal Top Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0c111d]/90">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-[#079108] animate-pulse" />
              <h2 className="text-base font-black text-white uppercase tracking-wider">
                Full Screen Live Preview ({previewMode === 'mobile' ? 'Mobile View' : 'Desktop View'})
              </h2>
            </div>
            <button
              onClick={() => setShowFullscreenModal(false)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
            >
              Tutup Preview
            </button>
          </div>

          {/* Modal Full Content */}
          <div className="flex-1 w-full h-full relative overflow-y-auto bg-black flex items-center justify-center p-4">
            {previewMode === 'mobile' ? (
              <div className="w-[375px] h-[720px] bg-[#0c111d] shadow-2xl rounded-[40px] border-[8px] border-zinc-800 overflow-hidden flex flex-col">
                <div className="w-full bg-[#0c111d] pt-2 px-5 pb-1 flex items-center justify-between border-b border-white/5 text-zinc-400 text-[10px] font-mono flex-shrink-0">
                  <span>11:04 AM</span>
                  <div className="w-14 h-3 bg-zinc-800 rounded-full" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#079108]" />
                </div>
                <div className="flex-1 overflow-y-auto bg-[#0c111d] no-scrollbar">
                  <HeroSection
                    members={members}
                    heroTitle={heroTitle}
                    heroSubtitle={heroSubtitle}
                    heroTagline={heroTagline}
                    heroTitleColor={heroTitleColor}
                    heroSubtitleColor={heroSubtitleColor}
                    heroTaglineColor={heroTaglineColor}
                    activeMemberId={activePreviewMemberId}
                    setActiveMemberId={setActivePreviewMemberId}
                    isPreview={true}
                    previewMode="mobile"
                  />
                </div>
              </div>
            ) : (
              <div className="w-full h-full">
                <HeroSection
                  members={members}
                  heroTitle={heroTitle}
                  heroSubtitle={heroSubtitle}
                  heroTagline={heroTagline}
                  heroTitleColor={heroTitleColor}
                  heroSubtitleColor={heroSubtitleColor}
                  heroTaglineColor={heroTaglineColor}
                  activeMemberId={activePreviewMemberId}
                  setActiveMemberId={setActivePreviewMemberId}
                  isPreview={true}
                  previewMode="desktop"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default HeroTab

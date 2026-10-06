import React, { useState, useRef } from 'react'
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSync, 
  FaSearch, 
  FaUserCheck, 
  FaUserTimes, 
  FaUsers, 
  FaPalette,
  FaImages,
  FaInstagram,
  FaArrowLeft,
  FaUpload,
  FaCamera,
  FaCheck,
  FaInfoCircle,
  FaSave,
  FaTimes,
  FaUserSecret,
  FaEyeSlash,
  FaQuestion
} from 'react-icons/fa'
import Swal from 'sweetalert2'
import api from '../../../lib/api'
import { getAssetPath } from '../../../lib/pathUtils'
import { showToast } from '../../../lib/toast'

const PRESET_COLORS = [
  { name: 'Amber Gold', hex: '#FBBF24' },
  { name: 'Sky Blue', hex: '#3B82F6' },
  { name: 'Royal Purple', hex: '#6D28D9' },
  { name: 'Mint Teal', hex: '#2DD4BF' },
  { name: 'Emerald Green', hex: '#10B981' },
  { name: 'Breeze Green', hex: '#E8944A' },
  { name: 'Crimson Red', hex: '#9E1527' },
  { name: 'Rose Pink', hex: '#F472B6' },
  { name: 'Neon Coral', hex: '#FF6B9D' },
  { name: 'Vibrant Orange', hex: '#F97316' },
  { name: 'Lavender', hex: '#8B5CF6' },
  { name: 'Hot Pink', hex: '#EC4899' },
]

// Helper to resolve images safely with local fallbacks
const resolveMemberImage = (url, memberId, stageName) => {
  const clean = (memberId || stageName || '').toLowerCase().replace(/[^a-z0-9]/g, '')

  if (url && typeof url === 'string') {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url
    if (url.startsWith('/')) return getAssetPath(url)
    if (!url.startsWith('foto/')) return getAssetPath(`/images/members/${url}`)
  }

  if (clean === 'group' || clean === 'kohisekai') return getAssetPath('/images/members/group.webp')
  if (clean === 'aca' || clean === 'acaa') return getAssetPath('/images/members/aca.webp')
  if (clean) return getAssetPath(`/images/members/${clean}.webp`)
  return getAssetPath('/images/members/placeholder.svg')
}

// Helper to resolve shop images safely with local fallbacks
const resolveMemberShopImage = (url, memberId, stageName) => {
  const clean = (memberId || stageName || '').toLowerCase().replace(/[^a-z0-9]/g, '')

  if (url && typeof url === 'string') {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url
    if (url.startsWith('/')) return getAssetPath(url)
    if (!url.startsWith('foto/')) return getAssetPath(`/images/shop/${url}`)
  }

  if (clean === 'group' || clean === 'kohisekai') return getAssetPath('/images/members/group.webp')
  if (clean === 'aca' || clean === 'acaa') return getAssetPath('/images/shop/aca.webp')
  if (clean) return getAssetPath(`/images/shop/${clean}.webp`)
  return getAssetPath('/images/members/placeholder.svg')
}

const MembersTab = ({ members = [], onRefresh }) => {
  // View mode: 'list' | 'editor'
  const [viewMode, setViewMode] = useState('list')
  const [editingMember, setEditingMember] = useState(null)
  const isEditing = Boolean(editingMember)
  const isGroup = editingMember?.member_id === 'group'

  // Search & Filter in list view (default hanya tampilkan member aktif)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('active') // active, all, inactive

  // Form State for Full Page Editor
  const [formData, setFormData] = useState({
    member_id: '',
    nama_panggung: '',
    tagline: '',
    jikoshoukai: '',
    tanggal_lahir: '',
    hobi: '',
    instagram: '',
    color: '#10B981',
    order_index: 0,
    hadir: true,
    image_url: '',
    shop_image_url: '',
    is_secret: false,
    silhouette_image_url: ''
  })

  const [gallery, setGallery] = useState(['', '', ''])
  const [avatarPreview, setAvatarPreview] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [shopAvatarPreview, setShopAvatarPreview] = useState('')
  const [shopAvatarFile, setShopAvatarFile] = useState(null)
  const [silhouettePreview, setSilhouettePreview] = useState('')
  const [silhouetteFile, setSilhouetteFile] = useState(null)

  const [galleryFiles, setGalleryFiles] = useState([null, null, null])
  const [galleryPreviews, setGalleryPreviews] = useState(['', '', ''])
  const [saving, setSaving] = useState(false)

  const avatarInputRef = useRef(null)
  const shopAvatarInputRef = useRef(null)
  const silhouetteInputRef = useRef(null)
  const galleryInputRefs = [useRef(null), useRef(null), useRef(null)]

  // Open Full Page Editor
  const handleOpenEditor = (member = null) => {
    if (member) {
      setEditingMember(member)
      setFormData({
        member_id: member.member_id || '',
        nama_panggung: member.nama_panggung || '',
        tagline: member.tagline || '',
        jikoshoukai: member.jikoshoukai || '',
        tanggal_lahir: member.tanggal_lahir || '',
        hobi: member.hobi || '',
        instagram: member.instagram || '',
        color: member.color || '#10B981',
        order_index: member.order_index !== undefined ? member.order_index : 0,
        hadir: member.hadir !== undefined ? member.hadir : true,
        image_url: member.image_url || '',
        shop_image_url: member.shop_image_url || '',
        is_secret: Boolean(member.is_secret),
        silhouette_image_url: member.silhouette_image_url || ''
      })

      const initialGallery = [0, 1, 2].map(idx => {
        return member.member_gallery?.[idx]?.image_url || ''
      })
      setGallery(initialGallery)
      setGalleryPreviews(initialGallery)
      setGalleryFiles([null, null, null])

      setAvatarPreview(resolveMemberImage(member.image_url, member.member_id, member.nama_panggung))
      setAvatarFile(null)

      setShopAvatarPreview(resolveMemberShopImage(member.shop_image_url, member.member_id, member.nama_panggung))
      setShopAvatarFile(null)

      setSilhouettePreview(member.silhouette_image_url || '')
      setSilhouetteFile(null)
    } else {
      setEditingMember(null)
      setFormData({
        member_id: '',
        nama_panggung: '',
        tagline: '',
        jikoshoukai: '',
        tanggal_lahir: '',
        hobi: '',
        instagram: '',
        color: '#10B981',
        order_index: members.length,
        hadir: true,
        image_url: '',
        shop_image_url: '',
        is_secret: false,
        silhouette_image_url: ''
      })
      setGallery(['', '', ''])
      setGalleryPreviews(['', '', ''])
      setGalleryFiles([null, null, null])
      setAvatarPreview('')
      setAvatarFile(null)
      setShopAvatarPreview('')
      setShopAvatarFile(null)
      setSilhouettePreview('')
      setSilhouetteFile(null)
    }

    setViewMode('editor')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCloseEditor = () => {
    setViewMode('list')
    setEditingMember(null)
    setAvatarFile(null)
    setShopAvatarFile(null)
    setSilhouetteFile(null)
  }

  // Upload handler for member profile picture
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  // Upload handler for shop cheki picture
  const handleShopAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setShopAvatarFile(file)
      setShopAvatarPreview(URL.createObjectURL(file))
    }
  }

  // Upload handler for secret member silhouette teaser
  const handleSilhouetteChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSilhouetteFile(file)
      setSilhouettePreview(URL.createObjectURL(file))
    }
  }

  const handleGalleryChange = (idx, e) => {
    const file = e.target.files?.[0]
    if (file) {
      const newFiles = [...galleryFiles]
      newFiles[idx] = file
      setGalleryFiles(newFiles)

      const newPreviews = [...galleryPreviews]
      newPreviews[idx] = URL.createObjectURL(file)
      setGalleryPreviews(newPreviews)
    }
  }

  const handleRemoveGalleryItem = (idx) => {
    const newPreviews = [...galleryPreviews]
    newPreviews[idx] = ''
    setGalleryPreviews(newPreviews)

    const newFiles = [...galleryFiles]
    newFiles[idx] = null
    setGalleryFiles(newFiles)

    const newGallery = [...gallery]
    newGallery[idx] = ''
    setGallery(newGallery)
  }

  const uploadFile = async (file, type = 'avatars') => {
    const form = new FormData()
    form.append('file', file)
    const res = await api.post(`/upload/member-image?type=${type}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (res.data.success && res.data.data?.url) {
      return res.data.data.url
    }
    throw new Error(res.data.error || 'Gagal upload file')
  }

  const handleSaveMember = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      let finalAvatarUrl = formData.image_url
      let finalShopImageUrl = formData.shop_image_url
      let finalSilhouetteUrl = formData.silhouette_image_url

      // 1. Upload avatar if selected
      if (avatarFile) {
        showToast.info(isGroup ? 'Mengunggah banner grup...' : 'Mengunggah foto profil...')
        finalAvatarUrl = await uploadFile(avatarFile, isGroup ? 'banner' : 'avatars')
      }

      // 2. Upload shop image if selected
      if (shopAvatarFile) {
        showToast.info('Mengunggah foto pajangan shop...')
        finalShopImageUrl = await uploadFile(shopAvatarFile, 'shop')
      }

      // 3. Upload silhouette if selected
      if (silhouetteFile) {
        showToast.info('Mengunggah foto siluet teaser...')
        finalSilhouetteUrl = await uploadFile(silhouetteFile, 'silhouette')
      }

      // 4. Upload gallery files if selected
      const finalGalleryUrls = [...gallery]
      for (let i = 0; i < 3; i++) {
        if (galleryFiles[i]) {
          showToast.info(`Mengunggah foto galeri slot ${i + 1}...`)
          const uploadedUrl = await uploadFile(galleryFiles[i], 'gallery')
          finalGalleryUrls[i] = uploadedUrl
        } else if (galleryPreviews[i] === '') {
          finalGalleryUrls[i] = ''
        }
      }

      const payload = {
        ...formData,
        image_url: finalAvatarUrl,
        shop_image_url: finalShopImageUrl,
        silhouette_image_url: finalSilhouetteUrl,
        is_secret: Boolean(formData.is_secret),
        gallery: finalGalleryUrls.filter(u => Boolean(u && u.trim()))
      }

      let savedMember = null
      if (isEditing) {
        const res = await api.patch(`/members/${editingMember.id}`, payload)
        savedMember = res.data?.data || payload
        showToast.success(`Member ${payload.nama_panggung} berhasil diperbarui!`)
      } else {
        const res = await api.post('/members', payload)
        savedMember = res.data?.data || payload
        showToast.success(`Member ${payload.nama_panggung} berhasil ditambahkan!`)
      }

      // AUTO-SYNC TO HERO: Pastikan panggung Hero langsung mengenali member ini
      try {
        if (!isGroup) {
          const configRes = await api.get('/config')
          let heroConfig = configRes.data?.data?.hero_settings
          if (typeof heroConfig === 'string') {
            try { heroConfig = JSON.parse(heroConfig) } catch (_) {}
          }
          if (heroConfig && Array.isArray(heroConfig.members)) {
            const memberSlug = String(payload.member_id || '').toLowerCase().trim()
            const existingIdx = heroConfig.members.findIndex(m => String(m.id).toLowerCase() === memberSlug)

            let heroPhoto = payload.is_secret && finalSilhouetteUrl
              ? finalSilhouetteUrl
              : (finalAvatarUrl || getAssetPath('/images/members/placeholder.svg'))

            if (payload.hadir === false) {
              // Jika dinonaktifkan di form, hapus dari hero_settings
              heroConfig.members = heroConfig.members.filter(m => {
                const hId = String(m.id || '').toLowerCase().trim()
                const hName = String(m.name || '').toLowerCase().trim()
                return hId !== memberSlug && hName !== String(payload.nama_panggung || '').toLowerCase().trim()
              })
            } else if (existingIdx >= 0) {
              heroConfig.members[existingIdx] = {
                ...heroConfig.members[existingIdx],
                name: payload.is_secret ? '???' : payload.nama_panggung.toUpperCase(),
                // Pertahankan warna hero khusus yang sudah diatur di Tab Hero (jangan ditimpa warna kartu member)
                color: heroConfig.members[existingIdx].color || 'bg-[#5A8F5A]',
                photo: (payload.is_secret && finalSilhouetteUrl) ? finalSilhouetteUrl : (heroConfig.members[existingIdx].photo || heroPhoto)
              }
            } else {
              heroConfig.members.push({
                id: memberSlug,
                name: payload.is_secret ? '???' : payload.nama_panggung.toUpperCase(),
                color: 'bg-[#5A8F5A]', // Default Hero tint
                photo: heroPhoto,
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
              })
            }
            await api.patch('/config', { hero_settings: JSON.stringify(heroConfig) })
          }
        }
      } catch (heroSyncErr) {
        console.warn('Hero auto-sync failed (non-critical):', heroSyncErr)
      }

      onRefresh()
      setViewMode('list')
      setEditingMember(null)
    } catch (err) {
      console.error(err)
      showToast.error(err.response?.data?.error || err.message, 'Gagal menyimpan member')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleHadir = async (member) => {
    try {
      const newStatus = !member.hadir
      await api.patch(`/members/${member.id}`, { hadir: newStatus })

      // SINKRONISASI OTOMATIS KE HERO: Jika dinonaktifkan, langsung keluarkan dari Hero panggung
      try {
        const configRes = await api.get('/config')
        let heroConfig = configRes.data?.data?.hero_settings
        if (typeof heroConfig === 'string') {
          try { heroConfig = JSON.parse(heroConfig) } catch (_) {}
        }
        if (heroConfig && Array.isArray(heroConfig.members)) {
          const mSlug = String(member.member_id || member.id || '').toLowerCase().trim()
          const mName = String(member.nama_panggung || '').toLowerCase().trim()

          if (!newStatus) {
            // Hapus dari hero_settings
            heroConfig.members = heroConfig.members.filter(m => {
              const hId = String(m.id || '').toLowerCase().trim()
              const hName = String(m.name || '').toLowerCase().trim()
              return hId !== mSlug && hName !== mName
            })
            await api.patch('/config', { hero_settings: JSON.stringify(heroConfig) })
          } else {
            // Jika diaktifkan kembali, tambahkan jika belum ada di hero
            const exists = heroConfig.members.some(m => {
              const hId = String(m.id || '').toLowerCase().trim()
              const hName = String(m.name || '').toLowerCase().trim()
              return hId === mSlug || hName === mName
            })
            if (!exists) {
              const photo = member.is_secret && member.silhouette_image_url
                ? member.silhouette_image_url
                : (member.image_url || getAssetPath('/images/members/placeholder.svg'))
              heroConfig.members.push({
                id: mSlug,
                name: member.is_secret ? '???' : (member.nama_panggung || 'MEMBER').toUpperCase(),
                color: member.color || 'bg-[#5A8F5A]',
                photo: photo,
                is_secret: Boolean(member.is_secret),
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
              })
              await api.patch('/config', { hero_settings: JSON.stringify(heroConfig) })
            }
          }
        }
      } catch (heroSyncErr) {
        console.warn('Auto-sync toggle to hero failed (non-critical):', heroSyncErr)
      }

      showToast.success(`Status ${member.nama_panggung} diubah menjadi ${newStatus ? 'Aktif' : 'Nonaktif'}`)
      onRefresh()
    } catch (err) {
      showToast.error(err.response?.data?.error || err.message, 'Gagal mengubah status')
    }
  }

  const handleDeleteMember = async (member) => {
    const result = await Swal.fire({
      title: `Hapus Member ${member.nama_panggung}?`,
      text: 'Member dan foto galeri terkait akan dihapus secara permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#374151',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      background: 'var(--surface)',
      color: '#fff'
    })

    if (result.isConfirmed) {
      try {
        await api.delete(`/members/${member.id}`)

        // Bersihkan juga dari hero_settings jika ada
        try {
          const configRes = await api.get('/config')
          let heroConfig = configRes.data?.data?.hero_settings
          if (typeof heroConfig === 'string') {
            try { heroConfig = JSON.parse(heroConfig) } catch (_) {}
          }
          if (heroConfig && Array.isArray(heroConfig.members)) {
            const mSlug = String(member.member_id || member.id || '').toLowerCase().trim()
            const mName = String(member.nama_panggung || '').toLowerCase().trim()
            heroConfig.members = heroConfig.members.filter(m => {
              const hId = String(m.id || '').toLowerCase().trim()
              const hName = String(m.name || '').toLowerCase().trim()
              return hId !== mSlug && hName !== mName
            })
            await api.patch('/config', { hero_settings: JSON.stringify(heroConfig) })
          }
        } catch (_) {}

        showToast.success(`Member ${member.nama_panggung} telah dihapus.`)
        onRefresh()
      } catch (err) {
        showToast.error(err.response?.data?.error || err.message, 'Gagal menghapus member')
      }
    }
  }

  // =========================================================
  // VIEW MODE: FULL PAGE EDITOR
  // =========================================================
  if (viewMode === 'editor') {
    return (
      <div className="space-y-6 animate-fade-in text-[var(--text-primary)] pb-16">
        {/* Full Page Navigation Header */}
        <div className="bg-[var(--surface)] border border-[var(--border)] p-4 md:p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleCloseEditor}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--border)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold transition"
            >
              <FaArrowLeft /> Kembali ke Daftar Member
            </button>

            <div className="h-6 w-px bg-[var(--border)] hidden md:block" />

            <div className="flex items-center gap-2.5">
              <div
                className="w-4 h-4 rounded-full ring-2 ring-white/30 shadow-md"
                style={{ backgroundColor: formData.color }}
              />
              <div>
                <h2 className="text-base md:text-xl font-black uppercase tracking-tight text-[var(--text-primary)] flex items-center gap-2">
                  {isEditing ? (isGroup ? 'Edit Profil & Banner Grup' : `Edit Member: ${editingMember.nama_panggung}`) : 'Tambah Member Baru'}
                </h2>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  {isGroup ? 'Pengaturan visual banner utama & paket Cheki grup' : 'Pengaturan profil, foto, dan identitas idol'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end md:self-auto">
            <button
              type="button"
              onClick={handleCloseEditor}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-[var(--border)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold transition"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveMember}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/85 text-[var(--text-primary)] text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-emerald-900/40 disabled:opacity-50"
            >
              <FaSave /> {saving ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Tambah Member')}
            </button>
          </div>
        </div>

        {isGroup && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-start gap-3 text-emerald-300 text-xs">
            <FaInfoCircle className="mt-0.5 text-base shrink-0 text-emerald-400" />
            <div>
              <span className="font-bold block text-sm text-emerald-200 mb-0.5">Mode Pengaturan Entitas Grup (Kohi Sekai)</span>
              Foto profil ini digunakan sebagai <strong>Banner Utama</strong> di halaman Member publik (*Meet The Members*) dan foto Cheki Group di halaman Shop.
            </div>
          </div>
        )}

        {/* Form Body - Two Column Spacious Layout */}
        <form onSubmit={handleSaveMember} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Visual Assets (Avatar, Color, 3 Gallery Slots) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Foto Utama Card */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  Foto {isGroup ? 'Banner / Cover Utama' : 'Profil Member'}
                </label>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {isGroup ? '1200 Ã— 675 px (16:9)' : '800 Ã— 800 px (1:1)'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-[var(--background)] border border-[var(--border)] rounded-xl">
                <div
                  className="relative w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border-2 cursor-pointer group shadow-xl shrink-0 bg-black/50"
                  style={{ borderColor: formData.color }}
                  onClick={() => avatarInputRef.current?.click()}
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Preview Avatar"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = resolveMemberImage('', formData.member_id, formData.nama_panggung)
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-secondary)] p-2 text-center">
                      <FaCamera className="text-3xl mb-1" />
                      <span className="text-[10px]">Pilih Foto</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[var(--text-primary)] text-xs font-semibold gap-1.5">
                    <FaUpload /> Ganti Foto
                  </div>
                </div>

                <div className="space-y-2 text-center sm:text-left">
                  <p className="text-xs text-[var(--text-secondary)] font-medium">
                    {avatarFile ? avatarFile.name : (formData.image_url ? 'Foto profil aktif' : 'Belum ada foto yang dipilih')}
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    {isGroup 
                      ? 'Format JPG, PNG, WEBP. Otomatis di-crop dan dikonversi ke WebP 16:9 (1200Ã—675 px).' 
                      : 'Format JPG, PNG, WEBP. Otomatis di-crop 1:1 fokus wajah dan dikonversi ke WebP 800Ã—800 px.'}
                  </p>
                  <input
                    type="file"
                    ref={avatarInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--border)] hover:bg-[var(--primary)]/15 border border-[var(--border)] text-xs font-bold text-[var(--text-primary)] transition"
                  >
                    <FaUpload /> Unggah Foto Baru
                  </button>
                </div>
              </div>
            </div>

            {/* Foto Pajangan Shop (Tiket Cheki) Card */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  Foto Pajangan Shop (Tiket Cheki)
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                    600 Ã— 800 px (3:4)
                  </span>
                  <span className="text-[10px] text-teal-400/90 font-bold bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                    Tampil di /shop
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-[var(--background)] border border-[var(--border)] rounded-xl">
                <div
                  className="relative w-28 h-36 md:w-32 md:h-40 rounded-2xl overflow-hidden border-2 cursor-pointer group shadow-xl shrink-0 bg-black/50"
                  style={{ borderColor: formData.color || '#2DD4BF' }}
                  onClick={() => shopAvatarInputRef.current?.click()}
                >
                  {shopAvatarPreview ? (
                    <img
                      src={shopAvatarPreview}
                      alt="Preview Foto Shop"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = resolveMemberShopImage('', formData.member_id, formData.nama_panggung)
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-secondary)] p-2 text-center">
                      <FaCamera className="text-3xl mb-1 text-teal-400/60" />
                      <span className="text-[10px]">Pilih Foto Shop</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[var(--text-primary)] text-xs font-semibold gap-1.5 text-center p-2">
                    <FaUpload /> Ganti Foto Shop
                  </div>
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-teal-300 rounded text-[9px] font-bold">
                    Tiket Cheki
                  </span>
                </div>

                <div className="space-y-2 text-center sm:text-left">
                  <p className="text-xs text-[var(--text-secondary)] font-medium">
                    {shopAvatarFile ? shopAvatarFile.name : (formData.shop_image_url ? 'Foto tiket shop aktif' : 'Belum ada foto khusus shop')}
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Foto idol vertikal untuk kartu <strong>Tiket Cheki 2-Shot</strong> di /shop. Otomatis di-crop 3:4 fokus badan & wajah.
                  </p>
                  <input
                    type="file"
                    ref={shopAvatarInputRef}
                    onChange={handleShopAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => shopAvatarInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-xs font-bold text-teal-200 transition"
                  >
                    <FaUpload /> Unggah Foto Shop Baru
                  </button>
                </div>
              </div>
            </div>

            {/* Color Branding Card */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                  <FaPalette style={{ color: formData.color }} />
                  Warna Identitas Member (HEX)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.color || '#10B981'}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                  />
                  <input
                    type="text"
                    value={formData.color || ''}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#10B981"
                    className="w-24 px-2.5 py-1 bg-[var(--background)] border border-[var(--border)] rounded-lg text-xs font-mono font-bold text-center focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <span className="text-[11px] text-[var(--text-secondary)] block mb-2">Preset Palet Warna Idol:</span>
                <div className="grid grid-cols-6 gap-2">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: preset.hex })}
                      title={preset.name}
                      className={`h-9 rounded-xl flex items-center justify-center transition-all ${
                        formData.color?.toLowerCase() === preset.hex.toLowerCase()
                          ? 'ring-2 ring-white scale-105 shadow-lg'
                          : 'opacity-80 hover:opacity-100 hover:scale-102'
                      }`}
                      style={{ backgroundColor: preset.hex }}
                    >
                      {formData.color?.toLowerCase() === preset.hex.toLowerCase() && (
                        <FaCheck className="text-[var(--text-primary)] text-xs drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3 Gallery Photos Card */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    3 Slot Galeri Foto
                  </label>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Tampil pada popup detail profil member di halaman publik</p>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  600 Ã— 800 px (3:4)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((idx) => {
                  const previewUrl = galleryPreviews[idx]
                  return (
                    <div
                      key={idx}
                      className="relative aspect-[3/4] bg-[var(--background)] border border-[var(--border)] rounded-xl overflow-hidden flex flex-col items-center justify-center group shadow-md"
                    >
                      {previewUrl ? (
                        <>
                          <img
                            src={previewUrl.startsWith('http') || previewUrl.startsWith('blob:') ? previewUrl : getAssetPath(previewUrl)}
                            alt={`Galeri Slot ${idx + 1}`}
                            className="w-full h-full object-cover object-top"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = getAssetPath('/images/members/placeholder.svg')
                            }}
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                            <button
                              type="button"
                              onClick={() => galleryInputRefs[idx].current?.click()}
                              className="p-2 bg-[var(--primary)] hover:bg-[var(--primary)]/85 rounded-lg text-[var(--text-primary)] text-xs transition"
                              title="Ganti Foto"
                            >
                              <FaUpload />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryItem(idx)}
                              className="p-2 bg-red-600/80 hover:bg-red-600 rounded-lg text-[var(--text-primary)] text-xs transition"
                              title="Hapus Foto"
                            >
                              <FaTrash />
                            </button>
                          </div>
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-[var(--text-primary)] rounded text-[9px] font-mono">
                            Slot {idx + 1}
                          </span>
                        </>
                      ) : (
                        <div
                          onClick={() => galleryInputRefs[idx].current?.click()}
                          className="w-full h-full flex flex-col items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-secondary)] cursor-pointer p-2 text-center transition hover:bg-[var(--border)]"
                        >
                          <FaCamera className="text-xl mb-1 text-[var(--text-secondary)]" />
                          <span className="text-[10px] font-bold">Slot {idx + 1}</span>
                          <span className="text-[8px] text-[var(--text-secondary)]">Klik untuk upload</span>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={galleryInputRefs[idx]}
                        onChange={(e) => handleGalleryChange(idx, e)}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Bio, Identity, and CMS Details */}
          <div className="lg:col-span-7 space-y-6">
            {/* Identity Card */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider pb-2 border-b border-[var(--border)]">
                Identitas Panggung
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                    Nama Panggung <span className="text-pink-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nama_panggung}
                    onChange={(e) => setFormData({ ...formData, nama_panggung: e.target.value })}
                    placeholder="Contoh: Sinta"
                    required
                    className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/60 text-xs focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                    Member ID / Slug <span className="text-pink-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.member_id}
                    onChange={(e) => setFormData({ ...formData, member_id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                    placeholder="Contoh: sinta"
                    required
                    disabled={isEditing && isGroup}
                    className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/60 text-xs focus:outline-none focus:border-[var(--primary)] disabled:opacity-40"
                  />
                  <span className="text-[10px] text-[var(--text-secondary)] mt-1 block">ID unik huruf kecil tanpa spasi (e.g. cissi, acaa).</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Tagline Member</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="Contoh: Morning Breeze, Forest Breeze"
                  className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/60 text-xs focus:outline-none focus:border-[var(--primary)]"
                />
                <span className="text-[10px] text-[var(--text-secondary)] mt-1 block">Konsep tema elemen member (e.g. Morning Breeze, Forest Breeze).</span>
              </div>
            </div>

            {/* Jikoshoukai Card */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-lg space-y-3">
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Jikoshoukai (Salam Perkenalan Panggung)
              </label>
              <textarea
                rows={3}
                value={formData.jikoshoukai}
                onChange={(e) => setFormData({ ...formData, jikoshoukai: e.target.value })}
                placeholder='"Si pemalu tetapi suka hal-hal baru, haloo semuanya aku Sintaa!"'
                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/60 text-xs focus:outline-none focus:border-[var(--primary)] leading-relaxed"
              />
              <p className="text-[10px] text-[var(--text-secondary)]">Kalimat ciri khas ikonik member saat menyapa audiens dan fans.</p>
            </div>

            {/* Biodata & Social Card */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider pb-2 border-b border-[var(--border)]">
                Biodata & Media Sosial
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Tanggal Lahir</label>
                  <input
                    type="text"
                    value={formData.tanggal_lahir}
                    onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                    placeholder="e.g. 12 Oktober"
                    className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/60 text-xs focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Hobi</label>
                  <input
                    type="text"
                    value={formData.hobi}
                    onChange={(e) => setFormData({ ...formData, hobi: e.target.value })}
                    placeholder="e.g. Memasak, menyanyi"
                    className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/60 text-xs focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Instagram</label>
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    placeholder="e.g. @sii_ntaa"
                    className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl placeholder-[var(--text-secondary)]/60 text-xs focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>
            </div>

            {/* Secret / Teaser Member Card */}
            {!isGroup && (
              <div className="bg-[var(--surface)] border border-purple-500/30 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <FaUserSecret className="text-purple-400 text-base" />
                    <div>
                      <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                        Mode Secret / Siluet Teaser Member
                      </h3>
                      <p className="text-[10px] text-[var(--text-secondary)]">
                        Untuk member baru atau trainee yang identitas aslinya masih dirahasiakan
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_secret: !formData.is_secret })}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        formData.is_secret ? 'bg-purple-600' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          formData.is_secret ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className={`text-xs font-bold ${formData.is_secret ? 'text-purple-300' : 'text-[var(--text-secondary)]'}`}>
                      {formData.is_secret ? 'SECRET AKTIF' : 'NORMAL'}
                    </span>
                  </div>
                </div>

                {formData.is_secret && (
                  <div className="space-y-3 pt-1">
                    <div className="p-3 bg-purple-950/30 border border-purple-500/20 rounded-xl text-[11px] text-purple-200 flex items-start gap-2">
                      <FaEyeSlash className="text-purple-400 shrink-0 mt-0.5 text-xs" />
                      <span>
                        Ketika aktif: Foto di <strong>Hero Beranda, Toko Shop Cheki, dan Daftar Member</strong> akan otomatis digantikan oleh <strong>Foto Siluet</strong> ini. Nama panggung di panggung Hero akan otomatis disamarkan sebagai <strong>"???"</strong> hingga Anda menonaktifkan status secret ini.
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-[var(--background)] border border-purple-500/20 rounded-xl">
                      <div
                        className="relative w-28 h-36 md:w-32 md:h-40 rounded-2xl overflow-hidden border-2 border-dashed border-purple-400 cursor-pointer group shadow-xl shrink-0 bg-black/60"
                        onClick={() => silhouetteInputRef.current?.click()}
                      >
                        {silhouettePreview ? (
                          <img
                            src={silhouettePreview}
                            alt="Preview Siluet"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = getAssetPath('/images/members/placeholder.svg')
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-secondary)] p-2 text-center">
                            <FaQuestion className="text-3xl mb-1 text-purple-400/80" />
                            <span className="text-[10px] text-purple-300 font-bold">Pilih Foto Siluet</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[var(--text-primary)] text-xs font-semibold gap-1.5 text-center p-2">
                          <FaUpload /> Ganti Siluet
                        </div>
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-purple-900/90 text-purple-200 rounded text-[9px] font-bold">
                          SILUET
                        </span>
                      </div>

                      <div className="space-y-2 text-center sm:text-left">
                        <p className="text-xs text-[var(--text-secondary)] font-medium">
                          {silhouetteFile ? silhouetteFile.name : (formData.silhouette_image_url ? 'Foto siluet tersimpan' : 'Belum ada foto siluet khusus')}
                        </p>
                        <p className="text-[11px] text-[var(--text-secondary)]">
                          Unggah foto siluet gelap berlatar transparan atau gelap untuk teaser teaser idol. Jika dikosongkan, sistem memakai siluet standar.
                        </p>
                        <input
                          type="file"
                          ref={silhouetteInputRef}
                          onChange={handleSilhouetteChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => silhouetteInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-xs font-bold text-purple-200 transition"
                        >
                          <FaUpload /> Unggah Foto Siluet
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CMS Sorting & Status Settings */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider pb-2 border-b border-[var(--border)]">
                Pengaturan Tampilan & Status
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                    Urutan Tampil
                  </label>
                  <input
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl focus:border-[var(--primary)] focus:outline-none"
                  />
                  <span className="text-[10px] text-[var(--text-secondary)] mt-1 block">Urutan kemunculan kartu member di halaman website</span>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, hadir: !formData.hadir })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formData.hadir ? 'bg-[var(--primary)]' : 'bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        formData.hadir ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <div>
                    <span className="text-xs font-bold text-[var(--text-primary)] block">
                      {formData.hadir ? 'Status Aktif (Tampil)' : 'Nonaktif (Sembunyi)'}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)]">
                      {formData.hadir ? 'Member aktif di halaman publik dan shop' : 'Member disembunyikan sementara'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons in Bottom */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseEditor}
                className="px-5 py-2.5 rounded-xl bg-[var(--border)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/85 text-[var(--text-primary)] text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-emerald-900/40 disabled:opacity-50"
              >
                <FaSave /> {saving ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Tambah Member')}
              </button>
            </div>
          </div>
        </form>
      </div>
    )
  }

  // =========================================================
  // VIEW MODE: LIST VIEW
  // =========================================================
  const groupEntity = members.find(m => m.member_id === 'group')
  const individualMembers = members.filter(m => m.member_id !== 'group')

  const filteredMembers = individualMembers.filter(member => {
    const matchesSearch = 
      (member.nama_panggung || '').toLowerCase().includes(search.toLowerCase()) ||
      (member.member_id || '').toLowerCase().includes(search.toLowerCase()) ||
      (member.tagline || '').toLowerCase().includes(search.toLowerCase())
    
    if (!matchesSearch) return false
    if (filterStatus === 'active') return member.hadir !== false
    if (filterStatus === 'inactive') return member.hadir === false
    return true
  })

  return (
    <div className="space-y-6 animate-fade-in text-[var(--text-primary)] pb-12">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surface)] border border-[var(--border)] p-4 md:p-6 rounded-2xl">
        <div>
          <h2 className="text-lg md:text-xl font-black uppercase tracking-wider">
            Manajemen Member & Grup
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Daftar member & profil idol.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onRefresh}
            className="p-2.5 bg-[var(--border)] hover:bg-[var(--border)] border border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            title="Muat Ulang Data"
          >
            <FaSync />
          </button>
          <button
            onClick={() => handleOpenEditor(null)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)]/85 text-[var(--text-primary)] rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-[0_2px_10px_rgba(232,148,74,0.3)] active:scale-95"
          >
            <FaPlus /> Tambah Member
          </button>
        </div>
      </div>

      {/* Group Profile / Banner Section */}
      {groupEntity && (
        <div className="relative overflow-hidden rounded-2xl border border-[var(--primary)]/30 bg-gradient-to-r from-[var(--surface)] via-[var(--background)] to-[var(--surface)] p-4 md:p-6 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-md shrink-0 bg-black/40">
                <img
                  src={resolveMemberImage(groupEntity.image_url, 'group', 'Kohi Sekai')}
                  alt="Kohi Sekai Group"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = getAssetPath('/images/members/group.webp')
                  }}
                />
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-wider uppercase mb-1.5 border border-emerald-500/30">
                  <FaUsers className="text-xs" /> Profil & Banner Grup
                </div>
                <h3 className="text-lg md:text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">
                  {groupEntity.nama_panggung || 'Kohi Sekai'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-xl line-clamp-2 mt-0.5">
                  {groupEntity.tagline || '6 individu berbakat yang siap menghibur dan menginspirasi dengan energi positif mereka!'}
                </p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-[var(--text-secondary)]">
                  <span>Urutan: #{groupEntity.order_index}</span>
                  <span>â€¢</span>
                  <span>Total Member Aktif: {individualMembers.filter(m => m.hadir !== false).length}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
              <button
                onClick={() => handleOpenEditor(groupEntity)}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold uppercase tracking-wider transition"
              >
                <FaEdit /> Edit Banner & Grup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[var(--surface)] border border-[var(--border)] p-3.5 rounded-xl">
        <div className="relative w-full sm:w-72">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-xs" />
          <input
            type="text"
            placeholder="Cari nama, slug, atau tagline..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-[11px] text-[var(--text-secondary)]">Filter:</span>
          <div className="inline-flex rounded-lg bg-[var(--background)] p-0.5 border border-[var(--border)] text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-md transition ${filterStatus === 'all' ? 'bg-[var(--primary)] text-[var(--text-primary)] font-bold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              Semua ({individualMembers.length})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1 rounded-md transition ${filterStatus === 'active' ? 'bg-[var(--primary)] text-[var(--text-primary)] font-bold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              Aktif ({individualMembers.filter(m => m.hadir !== false).length})
            </button>
            <button
              onClick={() => setFilterStatus('inactive')}
              className={`px-3 py-1 rounded-md transition ${filterStatus === 'inactive' ? 'bg-[var(--primary)] text-[var(--text-primary)] font-bold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              Nonaktif ({individualMembers.filter(m => m.hadir === false).length})
            </button>
          </div>
        </div>
      </div>

      {/* Individual Members Grid */}
      {filteredMembers.length === 0 ? (
        <div className="text-center py-16 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
          <FaUsers className="mx-auto text-4xl text-[var(--text-secondary)] mb-2" />
          <p className="text-[var(--text-secondary)] text-sm">Tidak ada member yang sesuai filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const memberColor = member.color || '#10B981'
            const galleryCount = member.member_gallery?.length || 0

            return (
              <div
                key={member.id}
                className="bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-xl group"
                style={{
                  boxShadow: `0 8px 24px -10px ${memberColor}25`
                }}
              >
                <div>
                  {/* Card Header: Avatar, Name, Color badge */}
                  <div className="flex items-start gap-3.5">
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Avatar Profil */}
                      <div
                        className="relative w-16 h-20 rounded-xl overflow-hidden border-2 shrink-0 shadow-md bg-[var(--surface)] group/img"
                        style={{ borderColor: memberColor }}
                        title="Foto Profil Member (Meet The Members)"
                      >
                        <img
                          src={resolveMemberImage(member.image_url, member.member_id, member.nama_panggung)}
                          alt={member.nama_panggung}
                          className="w-full h-full object-cover object-top group-hover/img:scale-105 transition-transform"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src = resolveMemberImage('', member.member_id, member.nama_panggung)
                          }}
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[8px] font-bold text-center text-[var(--text-secondary)] py-0.5">
                          PROFIL
                        </span>
                      </div>

                      {/* Foto Pajangan Shop */}
                      <div
                        className="relative w-14 h-20 rounded-xl overflow-hidden border border-teal-500/40 shrink-0 shadow-md bg-[var(--surface)] group/shop"
                        title="Foto Pajangan Shop (Tiket Cheki)"
                      >
                        <img
                          src={resolveMemberShopImage(member.shop_image_url, member.member_id, member.nama_panggung)}
                          alt={`Shop ${member.nama_panggung}`}
                          className="w-full h-full object-cover group-hover/shop:scale-105 transition-transform"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src = resolveMemberShopImage('', member.member_id, member.nama_panggung)
                          }}
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[8px] font-bold text-center text-teal-300 py-0.5">
                          SHOP
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="font-bold text-base text-[var(--text-primary)] truncate group-hover:text-emerald-300 transition-colors">
                            {member.nama_panggung}
                          </h4>
                          {member.is_secret && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-black uppercase tracking-wider shrink-0">
                              <FaUserSecret className="text-[10px]" /> SECRET
                            </span>
                          )}
                        </div>
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-wider shrink-0 shadow-sm"
                          style={{ backgroundColor: memberColor }}
                        >
                          {memberColor}
                        </span>
                      </div>

                      <p className="text-[11px] text-[var(--text-secondary)] font-mono">@{member.member_id}</p>
                      
                      {member.tagline && (
                        <p className="text-xs text-[var(--text-secondary)] italic line-clamp-2 mt-1">
                          "{member.tagline}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Member Details */}
                  <div className="mt-3.5 pt-3 border-t border-[var(--border)] space-y-1 text-xs text-[var(--text-secondary)]">
                    {member.tanggal_lahir && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[var(--text-secondary)]">Lahir:</span>
                        <span className="text-[var(--text-secondary)] font-medium">{member.tanggal_lahir}</span>
                      </div>
                    )}
                    {member.instagram && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[var(--text-secondary)] flex items-center gap-1"><FaInstagram /> IG:</span>
                        <span className="text-emerald-400 font-mono">{member.instagram}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-secondary)] flex items-center gap-1"><FaImages /> Galeri:</span>
                      <span className="text-[var(--text-secondary)] font-medium">{galleryCount} / 3 foto terpasang</span>
                    </div>
                  </div>

                  {/* Gallery Thumbnails Preview */}
                  {galleryCount > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {[0, 1, 2].map((idx) => {
                        const img = member.member_gallery?.[idx]?.image_url
                        return (
                          <div
                            key={idx}
                            className="aspect-[3/4] rounded-xl overflow-hidden bg-black/40 border border-[var(--border)] shadow-sm"
                          >
                            {img ? (
                              <img
                                src={img.startsWith('http') ? img : getAssetPath(img)}
                                alt={`Slot ${idx + 1}`}
                                className="w-full h-full object-cover object-top hover:scale-110 transition-transform duration-300"
                                onError={(e) => {
                                  e.target.onerror = null
                                  e.target.src = getAssetPath('/images/members/placeholder.svg')
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[9px] text-[var(--text-secondary)]">
                                Kosong
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Card Footer: Status & Actions */}
                <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleHadir(member)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition ${
                        member.hadir !== false
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                          : 'bg-zinc-800 text-[var(--text-secondary)] hover:bg-zinc-700 border border-zinc-700'
                      }`}
                      title="Klik untuk toggle status aktif/hadir"
                    >
                      {member.hadir !== false ? <FaUserCheck /> : <FaUserTimes />}
                      {member.hadir !== false ? 'Aktif' : 'Nonaktif'}
                    </button>
                    <span className="text-[10px] text-[var(--text-secondary)]">Urutan: #{member.order_index}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditor(member)}
                      className="p-2 bg-[var(--border)] hover:bg-emerald-600/20 hover:text-emerald-300 text-[var(--text-secondary)] border border-[var(--border)] rounded-lg text-xs transition"
                      title="Edit Member"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteMember(member)}
                      className="p-2 bg-[var(--border)] hover:bg-red-600/20 hover:text-red-400 text-[var(--text-secondary)] border border-[var(--border)] rounded-lg text-xs transition"
                      title="Hapus Member"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MembersTab







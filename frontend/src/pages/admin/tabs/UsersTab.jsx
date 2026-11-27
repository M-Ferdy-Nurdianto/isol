import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  FaUsers,
  FaSearch,
  FaShieldAlt,
  FaUser,
  FaEnvelope,
  FaWhatsapp,
  FaInstagram,
  FaSync,
  FaSpinner,
  FaKey,
  FaIdBadge,
  FaUserPlus,
  FaChevronDown,
  FaImage,
  FaUpload,
  FaTrash
} from 'react-icons/fa'
import api from '../../../lib/api'
import { showToast, webAlert } from '../../../lib/toast'
import UserDetailModal from '../modals/UserDetailModal'
import UserOTSModal from '../modals/UserOTSModal'
import WipeDummyDataModal from '../modals/WipeDummyDataModal'
import ImageCropModal from '../../../components/ImageCropModal'
import { FaTrashAlt } from 'react-icons/fa'

const DEFAULT_FAN_BANNERS = [
  { id: 'opt-banner-default-espresso', title: 'Espresso Minimalist', url: '/images/banners/default-espresso.svg' },
  { id: 'opt-banner-default-logo', title: 'Kohi Sekai Official Logo', url: '/images/banners/default-logo.svg' },
  { id: 'opt-banner-default-crema', title: 'Warm Crema Roast', url: '/images/banners/default-crema.svg' }
]

const UsersTab = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showOTSForm, setShowOTSForm] = useState(false)
  const [showWipeModal, setShowWipeModal] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  // Fan Profile Banner Catalog (16:9)
  const [fanBanners, setFanBanners] = useState([])
  const [bannerTitle, setBannerTitle] = useState('')
  const [bannerUploading, setBannerUploading] = useState(false)
  const [isDraggingBanner, setIsDraggingBanner] = useState(false)
  const [cropModal, setCropModal] = useState({ isOpen: false, imageSrc: null, originalName: '' })
  const bannerFileRef = useRef(null)

  const fetchFanBanners = useCallback(async () => {
    try {
      const res = await api.get('/config', { skipCache: true })
      const raw = res.data?.data?.fan_banner_options
      if (raw !== undefined && raw !== null && raw !== '') {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
        if (Array.isArray(parsed)) {
          setFanBanners(parsed.filter(b => b && b.url))
          return
        }
      }
      setFanBanners(DEFAULT_FAN_BANNERS)
    } catch {
      setFanBanners(DEFAULT_FAN_BANNERS)
    }
  }, [])

  useEffect(() => {
    fetchFanBanners()
  }, [fetchFanBanners])

  const uploadFanBannerFile = async (file) => {
    if (!file) return
    if (!file.type?.startsWith('image/')) {
      showToast.error('File harus berupa gambar (JPG, PNG, WebP).')
      return
    }

    setBannerUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const uploadRes = await api.post('/upload/fan-image?type=banner', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const url = uploadRes.data?.data?.url
      if (!url) throw new Error('Gagal mendapatkan URL banner')

      const newEntry = {
        id: `fan-banner-${Date.now()}`,
        title: bannerTitle.trim() || file.name.replace(/\.[^.]+$/, ''),
        url
      }
      const nextList = [...fanBanners, newEntry]
      await api.patch('/config', { fan_banner_options: JSON.stringify(nextList) })
      setFanBanners(nextList)
      setBannerTitle('')
      showToast.success('Banner fan berhasil ditambahkan!')
    } catch (err) {
      showToast.error(err.message || 'Gagal mengunggah banner fan.')
    } finally {
      setBannerUploading(false)
    }
  }

  const openBannerCropper = (file) => {
    if (!file) return
    if (!file.type?.startsWith('image/')) {
      showToast.error('File harus berupa gambar (JPG, PNG, WebP).')
      return
    }
    const imageUrl = URL.createObjectURL(file)
    setCropModal({ isOpen: true, imageSrc: imageUrl, originalName: file.name })
  }

  const handleBannerCropClose = () => {
    if (cropModal.imageSrc) URL.revokeObjectURL(cropModal.imageSrc)
    setCropModal({ isOpen: false, imageSrc: null, originalName: '' })
  }

  const handleBannerCropComplete = async (croppedFile) => {
    const baseName = (cropModal.originalName || 'banner').replace(/\.[^.]+$/, '')
    const namedFile = new File([croppedFile], `${baseName}.jpg`, { type: croppedFile.type || 'image/jpeg' })
    handleBannerCropClose()
    await uploadFanBannerFile(namedFile)
  }

  const handleUploadFanBanner = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    openBannerCropper(file)
  }

  const handleBannerDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingBanner(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) openBannerCropper(file)
  }

  const handleDeleteFanBanner = async (banner) => {
    const confirmed = await webAlert.confirm({
      title: 'Hapus Banner?',
      text: `Banner "${banner.title}" akan dihapus dari pilihan profil fan.`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      isDanger: true
    })
    if (!confirmed) return
    try {
      const nextList = fanBanners.filter(b => b.id !== banner.id && b.url !== banner.url)
      await api.patch('/config', { fan_banner_options: JSON.stringify(nextList) })
      setFanBanners(nextList)
      showToast.delete('Banner fan dihapus.')
    } catch (err) {
      showToast.error(err.message || 'Gagal menghapus banner.')
    }
  }

  const fetchUsers = useCallback(async (query = '') => {
    setLoading(true)
    try {
      const res = await api.get('/users', {
        params: { search: query, limit: 50 }
      })
      const list = res.data?.data || []
      setUsers(list)
      setTotalCount(res.data?.total || list.length)
    } catch (err) {
      console.error('[UsersTab] Failed to fetch users:', err)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, fetchUsers])

  const handleOpenDetail = (user) => {
    setSelectedUser(user)
    setShowDetailModal(true)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-[var(--text-primary)] tracking-tight uppercase flex items-center gap-2.5">
            Akun Fan & <span className="text-[var(--primary)]">Keamanan</span>
          </h2>
          <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">
            Kelola data akun member fan, reset password via email, dan generate kode OTP admin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOTSForm(prev => !prev)}
            className={`px-4 py-2 rounded-xl text-[var(--text-primary)] text-xs font-bold transition flex items-center gap-2 shadow-[0_2px_10px_rgba(232,148,74,0.25)] ${
              showOTSForm
                ? 'bg-[var(--primary)]/70 hover:bg-[var(--primary)]/60'
                : 'bg-[var(--primary)] hover:bg-[var(--primary)]/85'
            }`}
          >
            {showOTSForm ? (
              <>
                <FaChevronDown className="rotate-180" /> Sembunyikan Form
              </>
            ) : (
              <>
                <FaUserPlus /> Register OTS
              </>
            )}
          </button>
          {/* Tombol Reset Dummy dinonaktifkan sementara (disimpan jika sewaktu-waktu dibutuhkan):
          <button
            onClick={() => setShowWipeModal(true)}
            className="px-3.5 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300 text-xs font-bold transition flex items-center gap-1.5"
            title="Reset Database & Hapus Seluruh Data Dummy"
          >
            <FaTrashAlt className="text-xs" /> Reset Dummy
          </button>
          */}
          <span className="hidden sm:inline-block px-3 py-1.5 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/30 text-xs font-mono font-bold text-[var(--primary)]">
            {totalCount} Akun Terdaftar
          </span>
          <button
            onClick={() => fetchUsers(search)}
            disabled={loading}
            className="p-2.5 rounded-xl bg-[var(--border)] hover:bg-[var(--primary)]/15 border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--primary)] transition disabled:opacity-50"
            title="Muat Ulang"
          >
            <FaSync className={`text-xs ${loading ? 'animate-spin text-[var(--primary)]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Inline OTS Registration Form */}
      {showOTSForm && (
        <UserOTSModal
          onRefresh={() => fetchUsers(search)}
          onDone={() => setShowOTSForm(false)}
        />
      )}

      {/* Search Input Bar */}
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none">
          <FaSearch className="text-xs" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari ID fan (misal: 0002), nama lengkap, atau alamat email..."
          className="w-full pl-9 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-xl placeholder-[var(--text-secondary)]/60 focus:border-[var(--primary)] focus:outline-none transition"
        />
      </div>

      {/* Users Display (Desktop Table + Mobile Cards) */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-[var(--text-secondary)] flex flex-col items-center justify-center gap-3">
            <FaSpinner className="animate-spin text-2xl text-[var(--primary)]" />
            <span className="text-xs font-semibold">Memuat daftar akun fan...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--border)] text-[var(--text-secondary)] flex items-center justify-center mx-auto mb-3 text-lg">
              <FaUsers />
            </div>
            <p className="text-sm font-bold text-[var(--text-primary)]">Tidak ada akun ditemukan</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {search ? `Tidak ada akun yang cocok dengan kata kunci "${search}"` : 'Belum ada data akun fan terdaftar.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--background)] text-[var(--text-secondary)] font-bold uppercase tracking-wider border-b border-[var(--border)] text-[10px]">
                  <tr>
                    <th className="py-3 px-4">ID Fan</th>
                    <th className="py-3 px-4">Nama User</th>
                    <th className="py-3 px-4">Email Terdaftar</th>
                    <th className="py-3 px-4">Kontak</th>
                    <th className="py-3 px-4">Bergabung</th>
                    <th className="py-3 px-4 text-right">Aksi Keamanan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {users.map((u) => {
                    const fanCode = u.fan_code || String(u.fan_id || '').padStart(4, '0')
                    return (
                      <tr key={u.id} className="hover:bg-[var(--primary)]/5 transition">
                        <td className="py-3 px-4 font-mono font-bold text-[var(--primary)]">
                          #{fanCode}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full overflow-hidden bg-[var(--border)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
                              {u.image_url ? (
                                <img
                                  src={u.image_url}
                                  alt={u.nama}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null
                                    e.target.style.display = 'none'
                                  }}
                                />
                              ) : (
                                <FaUser className="text-[10px]" />
                              )}
                            </div>
                            <span className="font-bold text-[var(--text-primary)] truncate max-w-[150px]">
                              {u.nama}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[var(--text-secondary)]">
                          {u.email || '-'}
                        </td>
                        <td className="py-3 px-4 text-[var(--text-secondary)]">
                          <div className="space-y-0.5">
                            {u.whatsapp && u.whatsapp !== '-' && (
                              <div className="flex items-center gap-1.5 text-[11px]">
                                <FaWhatsapp className="text-[var(--primary)] text-[10px]" />
                                <span>{u.whatsapp}</span>
                              </div>
                            )}
                            {u.instagram && u.instagram !== '-' && (
                              <div className="flex items-center gap-1.5 text-[11px]">
                                <FaInstagram className="text-[var(--accent)] text-[10px]" />
                                <span>@{u.instagram.replace(/^@/, '')}</span>
                              </div>
                            )}
                            {(!u.whatsapp || u.whatsapp === '-') && (!u.instagram || u.instagram === '-') && (
                              <span>-</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[var(--text-secondary)] font-mono text-[11px]">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenDetail(u)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 border border-[var(--primary)]/40 text-[var(--primary)] font-bold text-xs transition"
                          >
                            <FaShieldAlt className="text-[10px]" />
                            <span>Reset Password</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (< md) */}
            <div className="md:hidden divide-y divide-[var(--border)]">
              {users.map((u) => {
                const fanCode = u.fan_code || String(u.fan_id || '').padStart(4, '0')
                return (
                  <div key={u.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--border)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
                          {u.image_url ? (
                            <img
                              src={u.image_url}
                              alt={u.nama}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null
                                e.target.style.display = 'none'
                              }}
                            />
                          ) : (
                            <FaUser className="text-xs" />
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-[var(--text-primary)] text-sm block">
                            {u.nama}
                          </span>
                          <span className="text-[11px] text-[var(--text-secondary)]">
                            {u.email || '-'}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-[var(--primary)]/10 border border-[var(--primary)]/40 text-[var(--primary)] text-[10px] font-mono font-bold">
                        #{fanCode}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        {u.whatsapp && u.whatsapp !== '-' ? u.whatsapp : (u.instagram ? `@${u.instagram.replace(/^@/, '')}` : '-')}
                      </div>
                      <button
                        onClick={() => handleOpenDetail(u)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/40 text-[var(--primary)] font-bold text-xs transition"
                      >
                        <FaShieldAlt className="text-[10px]" />
                        <span>Reset Password</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Katalog Banner Profil Fan (16:9) */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <FaImage className="text-[var(--primary)]" />
              <span>Banner Profil Fan</span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Unggah banner landscape (16:9) agar dapat dipilih oleh fan di halaman profil mereka.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={bannerTitle}
              onChange={(e) => setBannerTitle(e.target.value)}
              placeholder="Judul banner (opsional)"
              className="px-3.5 py-2 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--primary)]"
            />
            <input
              ref={bannerFileRef}
              type="file"
              accept="image/*"
              onChange={handleUploadFanBanner}
              className="hidden"
            />
            <button
              type="button"
              disabled={bannerUploading}
              onClick={() => bannerFileRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/85 text-white text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {bannerUploading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
              <span>{bannerUploading ? 'Mengunggah...' : 'Unggah Banner'}</span>
            </button>
          </div>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingBanner(true) }}
          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingBanner(true) }}
          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingBanner(false) }}
          onDrop={handleBannerDrop}
          onClick={() => !bannerUploading && bannerFileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
            isDraggingBanner
              ? 'border-[var(--primary)] bg-[var(--primary)]/10'
              : 'border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]/60'
          } ${bannerUploading ? 'opacity-60 pointer-events-none' : ''}`}
        >
          <div className="flex flex-col items-center gap-1.5">
            {bannerUploading ? (
              <FaSpinner className="animate-spin text-xl text-[var(--primary)]" />
            ) : (
              <FaUpload className="text-xl text-[var(--primary)]" />
            )}
            <p className="text-xs font-bold text-[var(--text-primary)]">
              {bannerUploading
                ? 'Mengunggah banner...'
                : isDraggingBanner
                  ? 'Lepas gambar di sini untuk mengunggah'
                  : 'Drag & drop gambar banner ke sini, atau klik untuk memilih file'}
            </p>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Rasio 3:1 (JPG, PNG, WebP) · Crop & posisikan sebelum unggah
            </p>
          </div>
        </div>

        {fanBanners.length === 0 ? (
          <div className="py-8 text-center text-xs text-[var(--text-secondary)] bg-[var(--background)] border border-[var(--border)] rounded-xl">
            Belum ada banner tambahan. Saat ini fan menggunakan 3 banner default Kohi Sekai.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fanBanners.map((b) => (
              <div key={b.id || b.url} className="bg-[var(--background)] border border-[var(--border)] rounded-xl overflow-hidden flex flex-col">
                <div className="aspect-[3/1] bg-black/50 overflow-hidden">
                  <img src={b.url} alt={b.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[var(--text-primary)] truncate">{b.title}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteFanBanner(b)}
                    className="p-1.5 rounded-lg bg-[var(--danger)]/10 hover:bg-[var(--danger)]/20 text-[var(--danger)] border border-[var(--danger)]/25 transition-colors shrink-0"
                    title="Hapus Banner"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Detail & Security Modal */}
      {showDetailModal && selectedUser && (
        <UserDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedUser(null)
          }}
          user={selectedUser}
          onRefresh={() => fetchUsers(search)}
        />
      )}

      {/* Wipe Dummy Data Modal */}
      {showWipeModal && (
        <WipeDummyDataModal
          onClose={() => setShowWipeModal(false)}
          onSuccess={() => fetchUsers(search)}
        />
      )}

      {/* Crop Banner Modal (3:1) */}
      <ImageCropModal
        isOpen={cropModal.isOpen}
        onClose={handleBannerCropClose}
        imageSrc={cropModal.imageSrc}
        aspect={3}
        onCropComplete={handleBannerCropComplete}
      />
    </div>
  )
}

export default UsersTab


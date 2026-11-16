import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  FaUser,
  FaEnvelope,
  FaWhatsapp,
  FaInstagram,
  FaTicketAlt,
  FaBox,
  FaLock,
  FaSignOutAlt,
  FaEdit,
  FaCheckCircle,
  FaClock,
  FaQrcode,
  FaDownload,
  FaKey,
  FaChevronRight,
  FaChevronDown,
  FaChevronUp,
  FaCrown,
  FaTimes,
  FaCopy,
  FaMapMarkerAlt
} from 'react-icons/fa'
import { useFanAuth, useTheme } from '@shared/context'
import { kohiToast } from '../../components/ui/KohiToast'
import api from '../../lib/api'
import MobileAppShell from '../components/layout/MobileAppShell'
import MobileBottomSheet from '../components/common/MobileBottomSheet'

/**
 * KSProfilePageMobile (Native-Feel Fan Profile & Digital Pass)
 * Strictly adheres to Deep Coffee Design:
 * - Solid surfaces (#241E19), border (#3A2E24)
 * - Anti-blur: NO backdrop-blur, NO gradients
 * - Digital Member Pass Card
 * - Ticket & Merch order history card lists
 * - Bottom sheets for Edit Profile and Change Password
 * - Minimum 44x44px touch targets
 */
const KSProfilePageMobile = () => {
  const navigate = useNavigate()
  const { fanUser, isLoggedIn, logout, updateProfile } = useFanAuth()
  const { isDark, toggleTheme } = useTheme()

  // Navigation redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn && !localStorage.getItem('ks_fan_token')) {
      navigate('/login')
    }
  }, [isLoggedIn, navigate])

  const [activeTab, setActiveTab] = useState('tickets') // 'tickets' | 'merch' | 'settings'
  const [orders, setOrders] = useState([])
  const [merchOrders, setMerchOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null)

  // Edit Profile Sheet State
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    nama: '',
    whatsapp: '',
    instagram: ''
  })
  const [savingProfile, setSavingProfile] = useState(false)

  // Change Password Sheet State
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [changingPassword, setChangingPassword] = useState(false)

  // Initialize form
  useEffect(() => {
    if (fanUser) {
      setProfileForm({
        nama: fanUser.nama || '',
        whatsapp: fanUser.whatsapp && fanUser.whatsapp !== '-' ? fanUser.whatsapp : '',
        instagram: fanUser.instagram && fanUser.instagram !== '-' ? fanUser.instagram : ''
      })
    }
  }, [fanUser])

  // Fetch Order Histories
  useEffect(() => {
    const email = fanUser?.email
    const userId = fanUser?.id
    const wa = fanUser?.whatsapp

    if (email || userId || wa) {
      setLoadingOrders(true)
      const emailQuery = email ? encodeURIComponent(email) : ''
      const userIdQuery = userId ? `&user_id=${userId}` : ''
      const waQuery = wa ? `&whatsapp=${encodeURIComponent(wa)}` : ''

      Promise.all([
        api.get(`/auth/fan/orders?email=${emailQuery}${userIdQuery}`).catch(() => ({ data: { success: false } })),
        api.get(`/merch-orders/fan-orders?email=${emailQuery}${userIdQuery}${waQuery}`).catch(() => ({ data: { success: false } }))
      ])
        .then(([ticketRes, merchRes]) => {
          if (ticketRes.data?.success) setOrders(ticketRes.data.data || [])
          if (merchRes.data?.success) setMerchOrders(merchRes.data.data || [])
        })
        .finally(() => setLoadingOrders(false))
    }
  }, [fanUser?.email, fanUser?.id, fanUser?.whatsapp])

  const handleSaveProfile = async () => {
    if (!profileForm.nama.trim()) {
      kohiToast.error('Nama lengkap tidak boleh kosong.')
      return
    }

    setSavingProfile(true)
    try {
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
        setShowEditProfile(false)
        kohiToast.success('Profil berhasil diperbarui!')
      } else {
        throw new Error(res.data?.error || 'Gagal menyimpan profil')
      }
    } catch (err) {
      kohiToast.error(err.response?.data?.error || err.message || 'Gagal menyimpan profil')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async (e) => {
    e?.preventDefault()
    if (!passwordForm.new_password || passwordForm.new_password.length < 6) {
      kohiToast.error('Password baru minimal 6 karakter')
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
        throw new Error(res.data?.error || 'Gagal memperbarui password')
      }
    } catch (err) {
      kohiToast.error(err.response?.data?.error || err.message || 'Gagal memperbarui password')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const fanCodeFormatted = String(fanUser?.fan_id || '').padStart(4, '0')

  return (
    <MobileAppShell title="Fan Space">
      <div className="space-y-5 pb-8">

        {/* 1. Official Digital Fan Pass Card */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-5 shadow-xl relative overflow-hidden space-y-4">
          
          {/* Top Row: Emblem & Fan Code */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] font-black text-xs shadow-inner">
                KS
              </div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[var(--text-secondary)] uppercase">
                Official Fan Pass
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--background)] border border-[var(--border)]">
              <span className="text-[10px] text-[var(--text-secondary)] font-mono">ID</span>
              <span className="text-xs font-mono font-black text-[var(--primary)]">
                #{fanCodeFormatted}
              </span>
            </div>
          </div>

          {/* User Details */}
          <div className="flex items-center gap-3.5">
            <div className="relative">
              {fanUser?.image_url ? (
                <img
                  src={fanUser.image_url}
                  alt={fanUser.nama}
                  className="w-16 h-16 rounded-2xl object-cover border border-[var(--primary)] shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] shadow-inner">
                  <FaUser size={24} />
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[var(--success)] border-2 border-[var(--surface)]" />
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-base font-black text-[var(--text-primary)] leading-tight truncate">
                {fanUser?.nama || 'Akun Fan'}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5 font-mono">
                {fanUser?.email || '-'}
              </p>

              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--background)] border border-[var(--border)] text-[9px] font-bold text-[var(--success)] font-mono">
                  <FaCheckCircle size={8} />
                  <span>Terverifikasi</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowEditProfile(true)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--background)] border border-[var(--border)] text-[9px] font-bold text-[var(--text-secondary)] hover:text-[var(--primary)] tap-active"
                >
                  <FaEdit size={8} />
                  <span>Ubah</span>
                </button>
              </div>
            </div>
          </div>

          {/* Contact Details Quick Strip */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--border)] text-xs text-[var(--text-secondary)]">
            <div className="flex items-center gap-2 truncate">
              <FaWhatsapp className="text-[var(--primary)] shrink-0 text-xs" />
              <span className="truncate">{fanUser?.whatsapp && fanUser.whatsapp !== '-' ? fanUser.whatsapp : 'Belum diisi'}</span>
            </div>
            <div className="flex items-center gap-2 truncate">
              <FaInstagram className="text-[var(--primary)] shrink-0 text-xs" />
              <span className="truncate">{fanUser?.instagram && fanUser.instagram !== '-' ? `@${fanUser.instagram.replace(/^@/, '')}` : 'Belum diisi'}</span>
            </div>
          </div>

        </div>

        {/* 2. Unified Brand Segmented Tabs */}
        <div className="flex rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('tickets')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all tap-active ${
              activeTab === 'tickets'
                ? 'bg-[var(--primary)] text-[var(--background)] shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <FaTicketAlt size={12} />
            <span>Tiket ({orders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('merch')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all tap-active ${
              activeTab === 'merch'
                ? 'bg-[var(--primary)] text-[var(--background)] shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <FaBox size={12} />
            <span>Merch ({merchOrders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all tap-active ${
              activeTab === 'settings'
                ? 'bg-[var(--primary)] text-[var(--background)] shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <FaLock size={12} />
            <span>Pengaturan</span>
          </button>
        </div>

        {/* ==================================================================== */}
        {/* TAB 1: TIKET CHEKI HISTORY                                           */}
        {/* ==================================================================== */}
        {activeTab === 'tickets' && (
          <div className="space-y-3">
            {loadingOrders ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin mx-auto mb-2" />
                <span className="text-xs text-[var(--text-secondary)] font-mono">Memuat riwayat tiket...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 text-center space-y-3">
                <FaTicketAlt className="text-3xl text-[var(--text-secondary)] mx-auto opacity-40" />
                <p className="text-xs text-[var(--text-secondary)]">
                  Anda belum memiliki riwayat pesanan tiket cheki.
                </p>
                <Link
                  to="/shop"
                  className="inline-flex touch-target py-2.5 px-4 rounded-xl bg-[var(--primary)] text-[var(--background)] font-black text-xs uppercase tracking-wider tap-active shadow-sm"
                >
                  Pesan Tiket Sekarang
                </Link>
              </div>
            ) : (
              orders.map((order) => {
                const isPaid = order.status === 'paid' || order.status === 'confirmed' || order.status === 'lunas'
                return (
                  <div
                    key={order.id}
                    className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 space-y-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                      <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)]">
                        #{order.order_number || String(order.id).slice(0, 8)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                          isPaid
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {isPaid ? 'Lunas / Terverifikasi' : 'Menunggu Verifikasi'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-[var(--text-primary)] leading-snug">
                        {order.nama_event || 'Live Stage Cheki Session'}
                      </h4>
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        {order.quantity}x Tiket ({order.jenis_sesi || '2-Shot'})
                      </p>
                      <p className="text-xs font-mono font-black text-[var(--primary)] pt-1">
                        Rp {Number(order.total_harga || order.price || 0).toLocaleString('id-ID')}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedReceiptOrder(order)}
                      className="w-full py-2.5 px-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--primary)] font-bold text-xs flex items-center justify-center gap-1.5 tap-active"
                    >
                      <FaQrcode size={12} />
                      <span>Lihat Tiket & Struk Digital</span>
                    </button>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: MERCH ORDERS HISTORY                                          */}
        {/* ==================================================================== */}
        {activeTab === 'merch' && (
          <div className="space-y-3">
            {loadingOrders ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin mx-auto mb-2" />
                <span className="text-xs text-[var(--text-secondary)] font-mono">Memuat pesanan merch...</span>
              </div>
            ) : merchOrders.length === 0 ? (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 text-center space-y-3">
                <FaBox className="text-3xl text-[var(--text-secondary)] mx-auto opacity-40" />
                <p className="text-xs text-[var(--text-secondary)]">
                  Anda belum pernah memesan merchandise.
                </p>
                <Link
                  to="/shop"
                  className="inline-flex touch-target py-2.5 px-4 rounded-xl bg-[var(--primary)] text-[var(--background)] font-black text-xs uppercase tracking-wider tap-active shadow-sm"
                >
                  Buka Katalog Merch
                </Link>
              </div>
            ) : (
              merchOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 space-y-2.5 shadow-sm"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                    <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)]">
                      #{order.order_number || String(order.id).slice(0, 8)}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-[var(--background)] text-[var(--primary)] border border-[var(--border)]">
                      {order.status || 'Diproses'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-[var(--text-primary)]">
                      {order.item_name || 'Official Merchandise'}
                    </h4>
                    <p className="text-xs font-mono font-black text-[var(--primary)]">
                      Rp {Number(order.total_price || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: SETTINGS & PASSWORD                                           */}
        {/* ==================================================================== */}
        {activeTab === 'settings' && (
          <div className="space-y-3">
            
            {/* Quick Actions List */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setShowEditProfile(true)}
                className="w-full flex items-center justify-between p-4 text-left border-b border-[var(--border)] tap-active min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <FaEdit className="text-[var(--primary)] text-sm" />
                  <div>
                    <p className="text-xs font-bold text-[var(--text-primary)]">Edit Informasi Profil</p>
                    <p className="text-[10px] text-[var(--text-secondary)]">Perbarui nama, WhatsApp, & Instagram</p>
                  </div>
                </div>
                <FaChevronRight size={11} className="text-[var(--text-secondary)]" />
              </button>

              <button
                type="button"
                onClick={() => setShowChangePassword(true)}
                className="w-full flex items-center justify-between p-4 text-left border-b border-[var(--border)] tap-active min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <FaKey className="text-[var(--primary)] text-sm" />
                  <div>
                    <p className="text-xs font-bold text-[var(--text-primary)]">Ubah Password Akun</p>
                    <p className="text-[10px] text-[var(--text-secondary)]">Ganti kata sandi untuk login</p>
                  </div>
                </div>
                <FaChevronRight size={11} className="text-[var(--text-secondary)]" />
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center justify-between p-4 text-left tap-active min-h-[48px]"
              >
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)]">Mode Tampilan</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">Tema Dark Coffee atau Light</p>
                </div>
                <span className="text-[10px] uppercase font-mono text-[var(--primary)] bg-[var(--background)] px-2.5 py-1 rounded-md border border-[var(--border)]">
                  {isDark ? 'Dark Coffee' : 'Light'}
                </span>
              </button>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full touch-target py-3.5 rounded-2xl bg-[var(--surface)] border border-[var(--danger)] text-[var(--danger)] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 tap-active shadow-sm"
            >
              <FaSignOutAlt size={14} />
              <span>Keluar dari Akun</span>
            </button>

          </div>
        )}

      </div>

      {/* Edit Profile Bottom Sheet */}
      <MobileBottomSheet
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        title="Edit Profil Fan"
        subtitle="Perbarui data kontak akun Anda"
        footer={
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="w-full touch-target py-3.5 rounded-2xl bg-[var(--primary)] text-[var(--background)] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 tap-active shadow-md disabled:opacity-50"
          >
            {savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        }
      >
        <div className="space-y-3 py-1">
          <div>
            <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
              Nama Lengkap <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              type="text"
              value={profileForm.nama}
              onChange={(e) => setProfileForm({ ...profileForm, nama: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
              Nomor WhatsApp
            </label>
            <input
              type="tel"
              value={profileForm.whatsapp}
              onChange={(e) => setProfileForm({ ...profileForm, whatsapp: e.target.value })}
              placeholder="08123456789"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
              Akun Instagram
            </label>
            <input
              type="text"
              value={profileForm.instagram}
              onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value })}
              placeholder="username_ig"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>
        </div>
      </MobileBottomSheet>

      {/* Change Password Bottom Sheet */}
      <MobileBottomSheet
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        title="Ubah Password"
        subtitle="Pastikan password baru minimal 6 karakter"
        footer={
          <button
            type="button"
            onClick={handleChangePassword}
            disabled={changingPassword}
            className="w-full touch-target py-3.5 rounded-2xl bg-[var(--primary)] text-[var(--background)] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 tap-active shadow-md disabled:opacity-50"
          >
            {changingPassword ? 'Memperbarui...' : 'Simpan Password Baru'}
          </button>
        }
      >
        <form onSubmit={handleChangePassword} className="space-y-3 py-1">
          <div>
            <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
              Password Saat Ini <span className="text-[10px] text-[var(--text-secondary)] font-normal">(opsional untuk akun OTS)</span>
            </label>
            <input
              type="password"
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
              placeholder="Masukkan password saat ini"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
              Password Baru <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              type="password"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              placeholder="Minimal 6 karakter"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
              Konfirmasi Password Baru <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              type="password"
              value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
              placeholder="Ulangi password baru"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>
        </form>
      </MobileBottomSheet>

      {/* Digital Receipt Bottom Sheet */}
      <MobileBottomSheet
        isOpen={Boolean(selectedReceiptOrder)}
        onClose={() => setSelectedReceiptOrder(null)}
        title="Tiket & Struk Digital"
        subtitle={`Order #${selectedReceiptOrder?.order_number || String(selectedReceiptOrder?.id || '').slice(0, 8)}`}
      >
        {selectedReceiptOrder && (
          <div className="space-y-4 text-center py-2">
            <div className="p-4 rounded-2xl bg-[var(--background)] border border-[var(--border)] space-y-3">
              <span className="text-[10px] font-mono uppercase font-bold text-[var(--primary)]">
                Kohi Sekai Live Event Ticket
              </span>
              <h3 className="text-sm font-black text-[var(--text-primary)]">
                {selectedReceiptOrder.nama_event || 'Live Stage'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                {selectedReceiptOrder.quantity}x Sesi {selectedReceiptOrder.jenis_sesi}
              </p>

              {/* QR Code Placeholder / Display */}
              <div className="w-36 h-36 mx-auto bg-white p-2 rounded-xl flex items-center justify-center my-2 shadow-inner">
                <FaQrcode className="text-black text-6xl" />
              </div>

              <div className="pt-2 border-t border-[var(--border)] flex justify-between text-xs">
                <span className="text-[var(--text-secondary)]">Total Bayar:</span>
                <span className="font-mono font-black text-[var(--primary)]">
                  Rp {Number(selectedReceiptOrder.total_harga || selectedReceiptOrder.price || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedReceiptOrder(null)}
              className="w-full py-3 rounded-2xl bg-[var(--primary)] text-[var(--background)] font-black text-xs uppercase tracking-wider tap-active"
            >
              Tutup Struk
            </button>
          </div>
        )}
      </MobileBottomSheet>

    </MobileAppShell>
  )
}

export default KSProfilePageMobile

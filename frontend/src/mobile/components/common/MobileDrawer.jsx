import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaTimes,
  FaHome,
  FaStore,
  FaMusic,
  FaInfoCircle,
  FaUser,
  FaSignOutAlt,
  FaSignInAlt,
  FaLock,
  FaMoon,
  FaSun,
  FaInstagram,
  FaTiktok,
  FaYoutube,
  FaWhatsapp,
  FaIdCard
} from 'react-icons/fa'
import { useFanAuth, useTheme } from '../../shared/context'

/**
 * MobileDrawer (Kohi Sekai Native-Feel Slide-out Side Drawer)
 * Strict Deep Coffee Protocol:
 * - Solid surfaces (#241E19), border (#3A2E24)
 * - Solid black overlay (NO backdrop-blur, NO gradients)
 * - Slide-in spring animation
 * - Min 44x44px touch targets
 * - Respects safe-area-inset top & bottom
 */
const MobileDrawer = ({ isOpen, onClose }) => {
  const { fanUser, isLoggedIn, logout } = useFanAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleLinkClick = (to) => {
    onClose?.()
    if (to) navigate(to)
  }

  const handleLogout = () => {
    logout()
    onClose?.()
    navigate('/')
  }

  const navLinks = [
    { label: 'Beranda', to: '/', icon: FaHome },
    { label: 'Shop & Tiket Cheki', to: '/shop', icon: FaStore },
    { label: 'Discography & Musik', to: '/music', icon: FaMusic },
    { label: 'Tentang Kami', to: '/about', icon: FaInfoCircle },
    { label: 'Verifikasi Akun OTS', to: '/ots-check', icon: FaIdCard }
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          
          {/* Solid Dark Overlay (NO BLUR) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 z-40"
            aria-hidden="true"
          />

          {/* Drawer Sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="relative z-50 w-[84vw] max-w-[320px] h-full bg-[var(--surface)] border-r border-[var(--border)] flex flex-col shadow-2xl overflow-hidden no-select"
            style={{
              paddingTop: 'env(safe-area-inset-top, 0px)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)'
            }}
          >

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] font-black text-xs shadow-inner">
                  KS
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black tracking-wider text-[var(--text-primary)] leading-tight">
                    KOHI SEKAI
                  </span>
                  <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                    Dunia Kopi · Jogja
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup Menu"
                className="touch-target rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:bg-[var(--background)] tap-active"
              >
                <FaTimes className="text-base" />
              </button>
            </div>

            {/* User Account Card */}
            <div className="p-4 border-b border-[var(--border)] bg-[var(--background)]">
              {isLoggedIn ? (
                <div
                  onClick={() => handleLinkClick('/profile')}
                  className="flex items-center gap-3 p-2.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] tap-active cursor-pointer"
                >
                  {fanUser?.image_url ? (
                    <img
                      src={fanUser.image_url}
                      alt={fanUser.nama}
                      className="w-11 h-11 rounded-full object-cover border border-[var(--primary)] shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] shrink-0">
                      <FaUser className="text-base" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-[var(--text-primary)] truncate">
                      {fanUser?.nama || 'Akun Fan'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-mono font-bold text-[var(--primary)]">
                        #{String(fanUser?.fan_id || '').padStart(4, '0')}
                      </span>
                      <span className="text-[10px] text-[var(--text-secondary)]">· Terverifikasi</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => handleLinkClick('/login')}
                  className="flex items-center justify-between p-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] tap-active cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] shrink-0">
                      <FaSignInAlt className="text-sm" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-[var(--text-primary)]">Masuk / Daftar</p>
                      <p className="text-[10px] text-[var(--text-secondary)]">Akses Fan Space & Tiket</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
              {navLinks.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => handleLinkClick(item.to)}
                    className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-left text-xs font-bold text-[var(--text-primary)] hover:text-[var(--primary)] hover:bg-[var(--background)] active:bg-[var(--background)] tap-active min-h-[44px]"
                  >
                    <Icon className="text-base text-[var(--primary)] shrink-0" />
                    <span>{item.label}</span>
                  </button>
                )
              })}

              <div className="my-2 border-t border-[var(--border)]" />

              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--background)] active:bg-[var(--background)] tap-active min-h-[44px]"
              >
                <div className="flex items-center gap-3.5">
                  {isDark ? (
                    <FaSun className="text-base text-[var(--warning)] shrink-0" />
                  ) : (
                    <FaMoon className="text-base text-[var(--text-secondary)] shrink-0" />
                  )}
                  <span>Mode Tampilan</span>
                </div>
                <span className="text-[10px] uppercase font-mono text-[var(--text-secondary)] bg-[var(--background)] px-2 py-0.5 rounded-md border border-[var(--border)]">
                  {isDark ? 'Dark Coffee' : 'Light'}
                </span>
              </button>

              {/* Admin Portal Link */}
              <button
                type="button"
                onClick={() => handleLinkClick('/admin')}
                className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-left text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--background)] active:bg-[var(--background)] tap-active min-h-[44px]"
              >
                <FaLock className="text-sm shrink-0" />
                <span>Admin Portal</span>
              </button>

              {/* Logout (if logged in) */}
              {isLoggedIn && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-left text-xs font-bold text-[#D65656] bg-[#D65656]/10 border border-[#D65656]/25 hover:bg-[#D65656] hover:text-white hover:border-[#D65656] active:scale-[0.98] transition-all tap-active min-h-[44px] cursor-pointer"
                >
                  <FaSignOutAlt className="text-base shrink-0" />
                  <span>Keluar dari Akun</span>
                </button>
              )}
            </nav>

            {/* Footer with Social Links */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--background)] space-y-3">
              <div className="flex items-center justify-around">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="touch-target text-[var(--text-secondary)] hover:text-[var(--primary)] tap-active"
                >
                  <FaInstagram className="text-base" />
                </a>
                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="TikTok"
                  className="touch-target text-[var(--text-secondary)] hover:text-[var(--primary)] tap-active"
                >
                  <FaTiktok className="text-base" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube"
                  className="touch-target text-[var(--text-secondary)] hover:text-[var(--primary)] tap-active"
                >
                  <FaYoutube className="text-base" />
                </a>
                <a
                  href="https://wa.me/628123456789"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp"
                  className="touch-target text-[var(--text-secondary)] hover:text-[var(--primary)] tap-active"
                >
                  <FaWhatsapp className="text-base" />
                </a>
              </div>

              <p className="text-[10px] text-center text-[var(--text-secondary)] font-mono">
                Kohi Sekai Mobile v1.0.0
              </p>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default MobileDrawer

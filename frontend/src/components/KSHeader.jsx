import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaBars, FaTimes, FaSun, FaMoon, FaUser, FaHistory, FaSignOutAlt, FaCoffee } from 'react-icons/fa'
import { useTheme } from '../context/ThemeContext'
import { useFanAuth } from '../context/FanAuthContext'
import FanAuthModal from './auth/FanAuthModal'
import FanOrderHistoryModal from './auth/FanOrderHistoryModal'

const KSHeader = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const profileDropdownRef = useRef(null)

  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const { fanUser, isLoggedIn, openAuthModal, logout, openOrderHistory } = useFanAuth()

  useEffect(() => {
    setMobileOpen(false)
    setProfileDropdownOpen(false)
  }, [location.pathname])

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About Us', href: '/about' },
    { name: 'Shop', href: '/shop' },
    { name: 'Music', href: '/music' },
  ]

  const isActive = (href) => {
    if (href === '/') return location.pathname === '/'
    return location.pathname.startsWith(href)
  }

  return (
    <header className="fixed bottom-4 sm:bottom-auto sm:top-5 inset-x-0 z-50 flex justify-center px-3 sm:px-6 pointer-events-none">
      <div className="relative w-full max-w-4xl lg:max-w-5xl pointer-events-auto">
        {/* Main Floating Rounded Navbar Island - 100% Solid Opaque Background */}
        <nav 
          className="w-full rounded-full border px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between transition-all duration-300 relative z-50 bg-white dark:bg-[#251E19] border-[#E8DDD0] dark:border-[#3E3228] shadow-xl shadow-black/10 dark:shadow-2xl dark:shadow-black/70"
          style={{ opacity: 1 }}
        >
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="relative">
              <span className="text-lg sm:text-xl font-black tracking-tighter text-text-primary group-hover:text-primary transition-colors duration-200">
                KOHI
              </span>
              <span className="text-lg sm:text-xl font-black tracking-tighter text-primary">
                SEKAI
              </span>
            </div>
            <span className="text-[9px] font-bold tracking-widest text-text-secondary/60 uppercase hidden lg:block leading-tight">
              コーヒーの世界
            </span>
          </Link>

          {/* Desktop Navigation - Centered Pill Group (Solid Opaque Background) */}
          <div 
            className="hidden md:flex items-center gap-1 p-1 rounded-full border transition-all duration-200 bg-[#F2E8DC] dark:bg-[#1A1512] border-[#E2D4C3] dark:border-[#352A21]"
          >
            {navLinks.map((link) => {
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  style={active ? { backgroundColor: 'var(--primary)', color: '#ffffff' } : {}}
                  className={`relative px-4 py-1.5 text-xs font-black tracking-widest uppercase transition-all duration-200 rounded-full ${
                    active
                      ? 'shadow-md shadow-primary/30 text-white'
                      : 'text-[#736253] dark:text-[#B0A599] hover:text-[#2B2420] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                >
                  {link.name}
                </Link>
              )
            })}
          </div>

          {/* Actions: Theme Toggle & Fan Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 border bg-[#F2E8DC] dark:bg-[#1A1512] border-[#E2D4C3] dark:border-[#352A21] text-[#736253] dark:text-[#B0A599] hover:text-[#2B2420] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <FaSun size={14} /> : <FaMoon size={14} />}
            </button>

            {/* Fan User Button */}
            <Link
              to={isLoggedIn ? "/profile" : "/login"}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 border bg-[#F2E8DC] dark:bg-[#1A1512] border-[#E2D4C3] dark:border-[#352A21] hover:bg-black/5 dark:hover:bg-white/10 ${
                isLoggedIn 
                  ? 'text-primary' 
                  : 'text-[#736253] dark:text-white hover:text-[#2B2420]'
              }`}
              aria-label="Profil Penggemar"
            >
              <FaUser size={13} />
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors border bg-[#F2E8DC] dark:bg-[#1A1512] border-[#E2D4C3] dark:border-[#352A21]"
              aria-label="Toggle Menu"
            >
              {mobileOpen ? <FaTimes size={16} /> : <FaBars size={16} />}
            </button>
          </div>
        </nav>

        {/* Mobile Floating Dropdown Menu Card */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 mt-2 rounded-3xl border shadow-2xl md:hidden p-5 z-40 bg-white dark:bg-[#251E19] border-[#E8DDD0] dark:border-[#3E3228]"
              style={{ opacity: 1 }}
            >
              <div className="flex flex-col gap-1.5">
                {navLinks.map((link) => {
                  const active = isActive(link.href)
                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setMobileOpen(false)}
                      style={active ? { backgroundColor: 'var(--primary)', color: '#ffffff' } : {}}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-black tracking-widest uppercase transition-colors ${
                        active
                          ? 'shadow-md shadow-primary/25 text-white'
                          : 'text-[#736253] dark:text-[#B0A599] hover:text-[#2B2420] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
                      }`}
                    >
                      {link.name}
                    </Link>
                  )
                })}

                <div className="pt-3 mt-1 border-t border-border">
                  {isLoggedIn ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-3 py-1.5">
                        <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                          {fanUser?.nama?.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-text-primary truncate">{fanUser?.nama}</span>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setMobileOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-background text-text-primary text-xs font-bold"
                      >
                        <FaUser className="text-primary" />
                        <span>Profil & Riwayat</span>
                      </Link>

                      <button
                        onClick={() => {
                          setMobileOpen(false)
                          logout()
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-danger text-xs font-bold hover:bg-danger/10"
                      >
                        <FaSignOutAlt />
                        <span>Keluar Akun</span>
                      </button>
                    </div>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      style={{ backgroundColor: 'var(--primary)', color: '#ffffff' }}
                      className="w-full py-2.5 rounded-2xl text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-primary/20 transition-all hover:brightness-110 active:scale-95"
                    >
                      <span>Login</span>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Global Modals for Fan Authentication & Order History */}
      <FanAuthModal />
      <FanOrderHistoryModal />
    </header>
  )
}

export default KSHeader

import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FaBars, FaTimes, FaShoppingCart, FaHome, FaUsers, FaMusic, FaCalendarAlt, FaCamera, FaStore, FaInfoCircle, FaInstagram, FaTwitter, FaYoutube, FaTiktok, FaSun, FaMoon } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import { getAssetPath } from '../lib/pathUtils'
import { useTheme } from '../context/ThemeContext'

const Header = ({ cartCount = 0, onCartClick }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()

  const navLinks = [
    { name: 'HOME', href: '/', icon: FaHome },
    { name: 'ABOUT US', href: '/story', icon: FaInfoCircle },
    { name: 'MEMBERS', href: '/members', icon: FaUsers },
    { name: 'MUSIC', href: '/music', icon: FaMusic },
    { name: 'SCHEDULE', href: '/schedule', icon: FaCalendarAlt },
    { name: 'MEDIA', href: '/media', icon: FaCamera },
    { name: 'SHOP', href: '/shop', icon: FaStore },
  ]

  // Primary links featured on the mobile bottom bar
  const mobilePrimaryLinks = [
    { name: 'Home', href: '/', icon: FaHome },
    { name: 'Members', href: '/members', icon: FaUsers },
    { name: 'Schedule', href: '/schedule', icon: FaCalendarAlt },
    { name: 'Shop', href: '/shop', icon: FaStore },
  ]

  const socialLinks = [
    { icon: FaInstagram, href: 'https://instagram.com/kohisekai', label: '@kohisekai' },
    { icon: FaTwitter, href: 'https://twitter.com/kohi_sekai' },
    { icon: FaYoutube, href: 'https://youtube.com/@KohiSekai' },
    { icon: FaTiktok, href: 'https://tiktok.com/@kohisekai' },
  ]

  const isActive = (href) => {
    const [path] = href.split('#')
    if (href === '/') return location.pathname === '/'
    if (path === '/') return location.pathname === '/' && (location.hash === href.split('#')[1] || !href.includes('#'))
    return location.pathname.startsWith(path)
  }

  const handleNavLinkClick = (e, link) => {
    setMobileMenuOpen(false)
  }

  return (
    <>
      <header className={`fixed top-0 left-0 w-full z-50 transition-colors duration-300 ${
        theme === 'dark'
          ? 'bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--primary)]/20'
          : 'bg-white/80 backdrop-blur-md border-b-2 border-[var(--primary)]/20'
      }`}>
        <nav className="container mx-auto px-4 py-4 sm:py-6 flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center gap-2 group"
          >
            <div data-aos="zoom-in-right" data-aos-duration="1000">
              <img src={getAssetPath('/images/logos/logo.svg')} alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-sm" />
            </div>
            <span className={`text-sm sm:text-xl font-black tracking-widest group-hover:text-[var(--primary)] transition-colors line-clamp-1 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              KOHI SEKAI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={(e) => handleNavLinkClick(e, link)}
                className={`text-xs font-bold tracking-[0.2em] transition-colors relative group ${
                  isActive(link.href) 
                    ? 'text-[var(--primary)]' 
                    : theme === 'dark' 
                      ? 'text-gray-300 hover:text-[var(--primary)]' 
                      : 'text-gray-500 hover:text-[var(--primary)]'
                }`}
              >
                {link.name}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-[var(--primary)] transition-all ${
                  isActive(link.href) ? 'w-full' : 'w-0 group-hover:w-full'
                }`}></span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Premium Theme Switcher Capsule */}
            <button
              onClick={toggleTheme}
              className={`relative h-9 px-1 rounded-full flex items-center transition-all duration-300 select-none group ${
                theme === 'dark'
                  ? 'w-[72px] bg-[var(--surface)]/80 border border-emerald-500/30 hover:border-emerald-400/60 shadow-[0_0_15px_rgba(7,145,8,0.2)]'
                  : 'w-[72px] bg-white border border-emerald-500/30 hover:border-[var(--primary)] shadow-[0_2px_12px_rgba(7,145,8,0.15)]'
              }`}
              title={theme === 'dark' ? 'Switch to White Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {/* Background ambient indicator icons */}
              <div className="absolute inset-0 px-2.5 flex items-center justify-between text-[11px] pointer-events-none">
                <FaSun className={`transition-opacity duration-300 ${theme === 'dark' ? 'text-amber-400/70' : 'opacity-0'}`} />
                <FaMoon className={`transition-opacity duration-300 ${theme === 'light' ? 'text-emerald-600/70' : 'opacity-0'}`} />
              </div>

              {/* Sliding Thumb Handle */}
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`w-7 h-7 rounded-full flex items-center justify-center shadow-md ${
                  theme === 'dark'
                    ? 'ml-auto bg-gradient-to-tr from-emerald-500 to-[var(--primary)] text-slate-950 shadow-emerald-500/30'
                    : 'mr-auto bg-gradient-to-tr from-amber-300 to-amber-400 text-amber-950 shadow-amber-300/40'
                }`}
              >
                {theme === 'dark' ? (
                  <FaMoon className="text-[11px] text-white" />
                ) : (
                  <FaSun className="text-[12px] text-amber-950" />
                )}
              </motion.div>
            </button>

            {/* Cart Icon */}
            <button
              onClick={onCartClick}
              aria-label="Shopping Cart"
              className={`relative p-2 transition-colors group ${
                theme === 'dark' ? 'text-gray-200 hover:text-[var(--primary)]' : 'text-gray-700 hover:text-[var(--primary)]'
              }`}
            >
              <div className="relative" data-cart-icon>
                <FaShoppingCart className="text-xl sm:text-2xl" />
                <span className="absolute -top-2 -right-2 bg-[var(--primary)] text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-black shadow-lg">
                  {cartCount}
                </span>
              </div>
            </button>
          </div>
        </nav>
      </header>

      {/* Floating Bottom Navbar for Mobile */}
      <nav 
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-3 inset-x-0 z-50 lg:hidden px-3 pointer-events-none"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
          <div className={`mx-auto max-w-md w-full pointer-events-auto rounded-3xl p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition-all duration-300 border flex items-center justify-between ${
            theme === 'dark'
              ? 'bg-[var(--input-bg)]/90 border-white/15 text-white shadow-black/80'
              : 'bg-white/90 border-emerald-500/20 text-gray-800 shadow-emerald-950/10'
          }`}>
            {/* Main Quick Nav Items */}
            {mobilePrimaryLinks.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl select-none transition-all duration-300 ${
                    active
                      ? 'text-white'
                      : theme === 'dark'
                        ? 'text-gray-400 hover:text-gray-200'
                        : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {/* Active Highlight Glow Pill with layout animation */}
                  {active && (
                    <motion.div
                      layoutId="activeBottomNavPill"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      className="absolute inset-0 bg-gradient-to-tr from-[var(--primary)] to-emerald-400 rounded-2xl shadow-[0_4px_20px_rgba(7,145,8,0.45)] -z-0"
                    />
                  )}

                  {/* Animated Icon & Label */}
                  <motion.div
                    animate={{
                      scale: active ? 1.15 : 1,
                      y: active ? -2 : 0,
                    }}
                    whileTap={{ scale: 0.88 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="relative z-10 flex flex-col items-center justify-center gap-0.5"
                  >
                    <Icon className={`text-base transition-transform duration-200 ${active ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]' : ''}`} />
                    <span className={`text-[10px] font-black tracking-tight leading-none uppercase ${
                      active 
                        ? 'text-white' 
                        : theme === 'dark' 
                          ? 'text-gray-400 font-semibold' 
                          : 'text-gray-500 font-semibold'
                    }`}>
                      {item.name}
                    </span>
                  </motion.div>
                </Link>
              )
            })}

            {/* More / Menu Drawer Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open Full Menu"
              className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl select-none transition-all duration-300 ${
                mobileMenuOpen
                  ? 'text-white'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {mobileMenuOpen && (
                <motion.div
                  layoutId="activeBottomNavPill"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  className="absolute inset-0 bg-gradient-to-tr from-[var(--primary)] to-emerald-400 rounded-2xl shadow-[0_4px_20px_rgba(7,145,8,0.45)] -z-0"
                />
              )}
              <motion.div
                animate={{
                  scale: mobileMenuOpen ? 1.15 : 1,
                  y: mobileMenuOpen ? -2 : 0,
                }}
                whileTap={{ scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="relative z-10 flex flex-col items-center justify-center gap-0.5"
              >
                <FaBars className={`text-base transition-transform duration-200 ${mobileMenuOpen ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]' : ''}`} />
                <span className={`text-[10px] font-semibold tracking-tight leading-none uppercase ${
                  mobileMenuOpen ? 'text-white font-black' : ''
                }`}>
                  Menu
                </span>
              </motion.div>
            </button>
          </div>
        </nav>

      {/* Mobile Bottom Sheet Menu (Drawer for complete navigation & socials) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className={`fixed inset-0 backdrop-blur-sm z-[100] lg:hidden ${
                theme === 'dark' ? 'bg-black/70' : 'bg-black/50'
              }`}
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className={`fixed bottom-0 left-0 right-0 rounded-t-[2.5rem] z-[101] lg:hidden shadow-2xl ${
                theme === 'dark'
                  ? 'bg-[var(--surface)] text-white border-t border-white/15'
                  : 'bg-white text-gray-900 border-t border-gray-100'
              }`}
              style={{ 
                paddingBottom: 'max(env(safe-area-inset-bottom), 1.5rem)',
                maxHeight: '85vh'
              }}
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-2 cursor-pointer" onClick={() => setMobileMenuOpen(false)}>
                <div className={`w-12 h-1.5 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`} />
              </div>

              {/* Header */}
              <div className={`flex items-center justify-between px-6 pb-4 border-b ${
                theme === 'dark' ? 'border-white/10' : 'border-gray-100'
              }`}>
                <div className="flex items-center gap-3">
                  <img src={getAssetPath('/images/logos/logo.svg')} alt="Logo" className="w-8 h-8 object-contain" />
                  <div>
                    <span className={`font-black text-sm tracking-widest block leading-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      KOHI SEKAI
                    </span>
                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Navigation & Links</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleTheme}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shadow-sm ${
                      theme === 'dark'
                        ? 'bg-[var(--surface)]/90 text-white border-emerald-500/30 hover:border-emerald-500/60 shadow-[0_0_12px_rgba(7,145,8,0.2)]'
                        : 'bg-white text-gray-800 border-gray-200 hover:border-[var(--primary)] shadow-sm'
                    }`}
                  >
                    {theme === 'dark' ? (
                      <>
                        <div className="w-4 h-4 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-400">
                          <FaSun className="text-[10px]" />
                        </div>
                        <span className="text-[9px] tracking-wider uppercase font-black text-gray-200">White</span>
                      </>
                    ) : (
                      <>
                        <div className="w-4 h-4 rounded-full bg-[var(--primary)]/15 flex items-center justify-center text-[var(--primary)]">
                          <FaMoon className="text-[9px]" />
                        </div>
                        <span className="text-[9px] tracking-wider uppercase font-black text-gray-700">Dark</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
                      theme === 'dark'
                        ? 'bg-white/10 text-gray-300 hover:bg-white/20'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>

              {/* Navigation Links Grid */}
              <div className="px-4 py-4 space-y-1.5 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 200px)' }}>
                {navLinks.map((link, idx) => {
                  const Icon = link.icon
                  const active = isActive(link.href)
                  return (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <Link
                        to={link.href}
                        onClick={(e) => handleNavLinkClick(e, link)}
                        className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all ${
                          active 
                            ? 'bg-gradient-to-r from-[var(--primary)] to-emerald-500 text-white shadow-lg shadow-[var(--primary)]/30 font-bold' 
                            : theme === 'dark'
                              ? 'text-gray-300 hover:bg-white/5'
                              : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          active 
                            ? 'bg-white/20 text-white' 
                            : theme === 'dark' 
                              ? 'bg-white/5 text-[var(--primary)]' 
                              : 'bg-gray-100 text-[var(--primary)]'
                        }`}>
                          <Icon className="text-base" />
                        </div>
                        <span className="font-bold tracking-wider text-xs sm:text-sm">{link.name}</span>
                        {active && (
                          <div className="ml-auto w-2 h-2 rounded-full bg-white shadow-sm" />
                        )}
                      </Link>
                    </motion.div>
                  )
                })}
              </div>

              {/* Social Links */}
              <div className={`px-6 py-3.5 border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-100'}`}>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Follow Official Socials</p>
                <div className="flex items-center gap-3">
                  {socialLinks.map((social, idx) => {
                    const Icon = social.icon
                    return (
                      <motion.a
                        key={idx}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 + idx * 0.04 }}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          theme === 'dark'
                            ? 'bg-white/5 border border-white/10 text-gray-400 hover:bg-[var(--primary)] hover:border-[var(--primary)] hover:text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-[var(--primary)] hover:text-white'
                        }`}
                      >
                        <Icon className="text-xs" />
                      </motion.a>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Header




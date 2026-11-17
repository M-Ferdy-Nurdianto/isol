import { Link, useLocation } from 'react-router-dom'
import { FaHome, FaUsers, FaStore, FaMusic, FaUser, FaSun, FaMoon, FaShoppingBag } from 'react-icons/fa'
import { useTheme } from '../context/ThemeContext'
import { useFanAuth } from '../context/FanAuthContext'
import { useMerchCart } from '../context/MerchCartContext'
import { getAssetPath } from '../lib/pathUtils'
import FanAuthModal from './auth/FanAuthModal'
import FanOrderHistoryModal from './auth/FanOrderHistoryModal'

const KSHeader = () => {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const { isLoggedIn, fanUser } = useFanAuth()
  const { openCart, totalItems } = useMerchCart()

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About Us', href: '/about' },
    { name: 'Shop', href: '/shop' },
    { name: 'Music', href: '/music' },
  ]

  const bottomTabs = [
    { name: 'Home', href: '/', icon: FaHome },
    { name: 'About', href: '/about', icon: FaUsers },
    { name: 'Shop', href: '/shop', icon: FaStore },
    { name: 'Music', href: '/music', icon: FaMusic },
    { name: 'Profil', href: isLoggedIn ? '/profile' : '/login', icon: FaUser },
  ]

  const isActive = (href) => {
    if (href === '/') return location.pathname === '/'
    return location.pathname.startsWith(href)
  }

  const isTabActive = (tab) => {
    if (tab.name === 'Profil') {
      return location.pathname.startsWith('/profile') || location.pathname.startsWith('/login')
    }
    return isActive(tab.href)
  }

  return (
    <>
      {/* =========================================================================
          DESKTOP FLOATING ISLAND NAVBAR (hidden md:flex)
          ========================================================================= */}
      <header className="hidden md:flex fixed top-0 inset-x-0 z-50 justify-center px-6 pt-3 pb-3 bg-[#F5EDE2] dark:bg-[#28211B] border-b border-[#E8DDD0] dark:border-[#3E3228] shadow-md shadow-black/20">
        <div className="relative w-full max-w-4xl lg:max-w-5xl">
          <nav 
            className="w-full rounded-full border px-6 h-14 flex items-center justify-between transition-all duration-300 relative z-50 bg-white dark:bg-[#342B23] border-[#E8DDD0] dark:border-[#46392F] shadow-sm"
          >
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
              <div className="relative">
                <span className="text-xl font-black tracking-tighter text-text-primary group-hover:text-primary transition-colors duration-200">
                  KOHI
                </span>
                <span className="text-xl font-black tracking-tighter text-primary">
                  SEKAI
                </span>
              </div>
              <span className="text-[9px] font-bold tracking-widest text-text-secondary/60 uppercase hidden lg:block leading-tight">
                コーヒーの世界
              </span>
            </Link>

            {/* Desktop Navigation - Centered Pill Group */}
            <div 
              className="flex items-center gap-1 p-1 rounded-full border transition-all duration-200 bg-[#EADBCC] dark:bg-[#28211B] border-[#DFD1BF] dark:border-[#3E3228]"
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

            {/* Actions: Theme Toggle, Cart & Fan Profile */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              {/* Cart Button */}
              <button
                type="button"
                data-cart-icon
                onClick={openCart}
                className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 border bg-[#EADBCC] dark:bg-[#28211B] border-[#DFD1BF] dark:border-[#3E3228] text-[#736253] dark:text-[#B0A599] hover:text-[#2B2420] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Keranjang Belanja"
                title="Buka Keranjang"
              >
                <FaShoppingBag size={13} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E8944A] text-white text-[9px] font-mono font-black flex items-center justify-center shadow-md animate-pulse">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 border bg-[#EADBCC] dark:bg-[#28211B] border-[#DFD1BF] dark:border-[#3E3228] text-[#736253] dark:text-[#B0A599] hover:text-[#2B2420] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <FaSun size={14} /> : <FaMoon size={14} />}
              </button>

              {/* Fan User Button */}
              <Link
                to={isLoggedIn ? "/profile" : "/login"}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 border bg-[#EADBCC] dark:bg-[#28211B] border-[#DFD1BF] dark:border-[#3E3228] hover:bg-black/5 dark:hover:bg-white/10 overflow-hidden ${
                  isLoggedIn 
                    ? 'text-primary' 
                    : 'text-[#736253] dark:text-white hover:text-[#2B2420]'
                }`}
                aria-label="Profil Penggemar"
              >
                {isLoggedIn && fanUser?.image_url ? (
                  <img 
                    src={getAssetPath(fanUser.image_url)} 
                    alt={fanUser?.nama || 'Profil'} 
                    className="w-full h-full object-cover" 
                    onError={(e) => { e.currentTarget.style.display = 'none'; if (e.currentTarget.nextElementSibling) e.currentTarget.nextElementSibling.style.display = 'inline-block'; }}
                  />
                ) : null}
                <FaUser size={13} style={{ display: isLoggedIn && fanUser?.image_url ? 'none' : 'inline-block' }} />
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* =========================================================================
          MOBILE TOP BAR (md:hidden)
          Brand Logo di kiri + Tombol Ganti Tema di ATAS KANAN SAJA
          Warna Selaras & Sedikit Lebih Terang (#28211B)
          ========================================================================= */}
      <header className="md:hidden fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 pt-3 pb-2.5 bg-[#F5EDE2] dark:bg-[#28211B] border-b border-[#E8DDD0] dark:border-[#3E3228] shadow-sm">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="relative">
            <span className="text-lg font-black tracking-tighter text-text-primary">
              KOHI <span className="text-primary">SEKAI</span>
            </span>
          </div>
          <span className="text-[9px] font-bold tracking-widest text-text-secondary/70 uppercase font-mono">
            コーヒー
          </span>
        </Link>

        {/* Top Right Controls: Theme Toggle Button (+ Cart jika ada item) */}
        <div className="flex items-center gap-2">
          {totalItems > 0 && (
            <button
              type="button"
              data-cart-icon
              onClick={openCart}
              className="relative w-9 h-9 rounded-full flex items-center justify-center border bg-[#EADBCC] dark:bg-[#342B23] border-[#DFD1BF] dark:border-[#46392F] text-primary active:scale-95 transition-transform"
              aria-label="Keranjang Belanja"
            >
              <FaShoppingBag size={13} />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E8944A] text-white text-[9px] font-mono font-black flex items-center justify-center shadow-md">
                {totalItems}
              </span>
            </button>
          )}

          {/* Tombol Ganti Tema - Di Atas Kanan Saja */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full flex items-center justify-center border bg-[#EADBCC] dark:bg-[#342B23] border-[#DFD1BF] dark:border-[#46392F] text-[#736253] dark:text-[#B0A599] active:scale-95 transition-transform shadow-sm"
            aria-label="Ganti Tema"
            title="Ganti Tema"
          >
            {theme === 'dark' ? <FaSun size={14} className="text-[#E8944A]" /> : <FaMoon size={14} className="text-[#736253]" />}
          </button>
        </div>
      </header>

      {/* =========================================================================
          MOBILE FLOATING CIRCLE CAPSULE BOTTOM NAVBAR (md:hidden)
          Icon Only (Tanpa Teks) + Shop Icon Store + Safe Area Padding
          Warna Selaras & Sedikit Lebih Terang (#28211B)
          ========================================================================= */}
      <div 
        className="md:hidden fixed bottom-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <nav
          aria-label="Mobile Navigation"
          className="pointer-events-auto w-full max-w-[320px] rounded-full p-1.5 flex items-center justify-between border bg-[#F5EDE2] dark:bg-[#28211B] border-[#E8DDD0] dark:border-[#3E3228] shadow-2xl shadow-black/60"
        >
          {bottomTabs.map((tab) => {
            const active = isTabActive(tab)
            const Icon = tab.icon

            return (
              <Link
                key={tab.name}
                to={tab.href}
                aria-label={tab.name}
                title={tab.name}
                style={active ? { backgroundColor: 'var(--primary)', color: '#ffffff' } : {}}
                className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-200 active:scale-95 ${
                  active
                    ? 'shadow-md shadow-primary/30 text-white font-black'
                    : 'text-[#736253] dark:text-[#B0A599] hover:text-[#2B2420] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                {tab.name === 'Profil' && isLoggedIn && fanUser?.image_url ? (
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-current shrink-0">
                    <img 
                      src={getAssetPath(fanUser.image_url)} 
                      alt="PP" 
                      className="w-full h-full object-cover" 
                      onError={(e) => { e.currentTarget.style.display = 'none'; if (e.currentTarget.nextElementSibling) e.currentTarget.nextElementSibling.style.display = 'block'; }}
                    />
                    <Icon size={18} style={{ display: 'none' }} />
                  </div>
                ) : (
                  <Icon size={18} />
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Global Modals for Fan Authentication & Order History */}
      <FanAuthModal />
      <FanOrderHistoryModal />
    </>
  )
}

export default KSHeader

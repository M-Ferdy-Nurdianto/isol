import { Link, useLocation } from 'react-router-dom'
import { FaHome, FaUsers, FaTicketAlt, FaMusic, FaUser, FaSun, FaMoon, FaShoppingBag } from 'react-icons/fa'
import { useTheme } from '../context/ThemeContext'
import { useFanAuth } from '../context/FanAuthContext'
import { useMerchCart } from '../context/MerchCartContext'
import FanAuthModal from './auth/FanAuthModal'
import FanOrderHistoryModal from './auth/FanOrderHistoryModal'

const KSHeader = () => {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const { isLoggedIn } = useFanAuth()
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
    { name: 'Shop', href: '/shop', icon: FaTicketAlt },
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
      <header className="hidden md:flex fixed top-5 inset-x-0 z-50 justify-center px-6 pointer-events-none">
        <div className="relative w-full max-w-4xl lg:max-w-5xl pointer-events-auto">
          <nav 
            className="w-full rounded-full border px-6 h-16 flex items-center justify-between transition-all duration-300 relative z-50 bg-white dark:bg-[#251E19] border-[#E8DDD0] dark:border-[#3E3228] shadow-xl shadow-black/10 dark:shadow-2xl dark:shadow-black/70"
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
              className="flex items-center gap-1 p-1 rounded-full border transition-all duration-200 bg-[#F2E8DC] dark:bg-[#1A1512] border-[#E2D4C3] dark:border-[#352A21]"
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
                className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 border bg-[#F2E8DC] dark:bg-[#1A1512] border-[#E2D4C3] dark:border-[#352A21] text-[#736253] dark:text-[#B0A599] hover:text-[#2B2420] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
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
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 border bg-[#F2E8DC] dark:bg-[#1A1512] border-[#E2D4C3] dark:border-[#352A21] text-[#736253] dark:text-[#B0A599] hover:text-[#2B2420] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <FaSun size={14} /> : <FaMoon size={14} />}
              </button>

              {/* Fan User Button */}
              <Link
                to={isLoggedIn ? "/profile" : "/login"}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 border bg-[#F2E8DC] dark:bg-[#1A1512] border-[#E2D4C3] dark:border-[#352A21] hover:bg-black/5 dark:hover:bg-white/10 ${
                  isLoggedIn 
                    ? 'text-primary' 
                    : 'text-[#736253] dark:text-white hover:text-[#2B2420]'
                }`}
                aria-label="Profil Penggemar"
              >
                <FaUser size={13} />
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* =========================================================================
          MOBILE FLOATING CIRCLE CAPSULE BOTTOM NAVBAR (md:hidden)
          Melayang sedikit (bottom-4) + Rounded-full circle kayak desktop + Pill active
          ========================================================================= */}
      <div className="md:hidden fixed bottom-4 inset-x-0 z-50 flex justify-center px-3 pointer-events-none">
        <nav
          aria-label="Mobile Navigation"
          className="pointer-events-auto w-full max-w-[360px] rounded-full p-1.5 flex items-center justify-between border bg-white dark:bg-[#251E19] border-[#E8DDD0] dark:border-[#3E3228] shadow-2xl shadow-black/60"
        >
          {bottomTabs.map((tab) => {
            const active = isTabActive(tab)
            const Icon = tab.icon

            return (
              <Link
                key={tab.name}
                to={tab.href}
                style={active ? { backgroundColor: 'var(--primary)', color: '#ffffff' } : {}}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-full transition-all duration-200 ${
                  active
                    ? 'shadow-md shadow-primary/30 text-white font-black'
                    : 'text-[#736253] dark:text-[#B0A599] hover:text-[#2B2420] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 font-bold'
                }`}
              >
                <Icon size={16} />
                <span className="text-[9px] mt-0.5 uppercase tracking-wider leading-none">
                  {tab.name}
                </span>
              </Link>
            )
          })}

          {/* Theme Toggle Button inside the pill */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full flex items-center justify-center border bg-[#F2E8DC] dark:bg-[#1A1512] border-[#E2D4C3] dark:border-[#352A21] text-[#736253] dark:text-[#B0A599] shrink-0 ml-1 active:scale-95 transition-transform"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <FaSun size={13} /> : <FaMoon size={13} />}
          </button>
        </nav>
      </div>

      {/* =========================================================================
          MOBILE FLOATING CART BUTTON (md:hidden)
          Muncul melayang di atas bottom navbar saat ada item di cart atau di halaman shop
          ========================================================================= */}
      {totalItems > 0 && (
        <div className="md:hidden fixed bottom-20 right-4 z-40">
          <button
            type="button"
            data-cart-icon
            onClick={openCart}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#E8944A] text-white shadow-2xl shadow-black/80 font-black text-xs uppercase tracking-wider active:scale-95 transition-transform border border-white/20"
            aria-label="Buka Keranjang"
          >
            <FaShoppingBag size={13} />
            <span>Keranjang</span>
            <span className="w-5 h-5 rounded-full bg-black/30 text-white text-[10px] font-mono font-black flex items-center justify-center">
              {totalItems}
            </span>
          </button>
        </div>
      )}

      {/* Global Modals for Fan Authentication & Order History */}
      <FanAuthModal />
      <FanOrderHistoryModal />
    </>
  )
}

export default KSHeader

import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaBars, FaArrowLeft, FaShoppingBag } from 'react-icons/fa'
import { useMerchCart, useFanAuth } from '../../shared/context'

/**
 * MobileHeader (Kohi Sekai Native-Feel Sticky Top Header)
 * Strictly Deep Coffee:
 * - Solid surface (#241E19), border (#3A2E24)
 * - Anti-blur: NO backdrop-blur, NO gradients
 * - Respects env(safe-area-inset-top) for camera punch hole & notch
 * - Min 44x44px touch targets
 */
const MobileHeader = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  onOpenDrawer,
  rightAction,
  hideCart = false
}) => {
  const navigate = useNavigate()
  const { totalItems } = useMerchCart()
  const { isLoggedIn, fanUser } = useFanAuth()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  return (
    <header
      role="banner"
      className="sticky top-0 left-0 right-0 z-40 bg-[var(--surface)] border-b border-[var(--border)] no-select transition-colors"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="flex items-center justify-between h-14 px-3 max-w-md mx-auto">
        
        {/* Left Action: Back Button OR Drawer Hamburger */}
        <div className="flex items-center min-w-[44px]">
          {showBack ? (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Kembali"
              className="touch-target rounded-xl text-[var(--text-primary)] hover:text-[var(--primary)] active:bg-[var(--background)] tap-active"
            >
              <FaArrowLeft className="text-base" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenDrawer}
              aria-label="Buka Menu"
              className="touch-target rounded-xl text-[var(--text-primary)] hover:text-[var(--primary)] active:bg-[var(--background)] tap-active"
            >
              <FaBars className="text-lg" />
            </button>
          )}
        </div>

        {/* Center: Title OR Brand Logo */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-2 overflow-hidden">
          {title ? (
            <div className="truncate max-w-[220px]">
              <h1 className="text-sm font-bold text-[var(--text-primary)] leading-tight truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-[10px] text-[var(--text-secondary)] font-medium leading-none truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          ) : (
            <Link to="/" className="flex items-center gap-2 tap-active">
              <div className="w-7 h-7 rounded-lg bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] font-black text-xs shadow-inner">
                KS
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-black tracking-wider text-[var(--text-primary)] leading-tight">
                  KOHI SEKAI
                </span>
                <span className="text-[9px] text-[var(--primary)] font-mono font-bold leading-none tracking-tight">
                  コーヒーの世界
                </span>
              </div>
            </Link>
          )}
        </div>

        {/* Right Action: Custom Action OR Shopping Bag Cart Shortcut */}
        <div className="flex items-center justify-end min-w-[44px]">
          {rightAction ? (
            rightAction
          ) : !hideCart ? (
            <Link
              to="/merch-checkout"
              aria-label="Keranjang Belanja"
              className="touch-target rounded-xl text-[var(--text-primary)] hover:text-[var(--primary)] active:bg-[var(--background)] tap-active relative"
            >
              <FaShoppingBag className="text-base" />
              {totalItems > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--primary)] text-[var(--background)] font-black text-[10px] flex items-center justify-center font-mono leading-none border border-[var(--surface)] animate-fade-in">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>
          ) : (
            <div className="w-11 h-11" />
          )}
        </div>

      </div>
    </header>
  )
}

export default MobileHeader

import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FaHome, FaStore, FaMusic, FaUser } from 'react-icons/fa'
import { useFanAuth } from '@shared/context'

/**
 * MobileBottomNav (Kohi Sekai Native-Feel Bottom Navigation)
 * Adheres strictly to Deep Coffee Design Tokens:
 * - Solid surfaces (#241E19), solid border (#3A2E24)
 * - Anti-blur: NO backdrop-blur, NO gradients
 * - Respects env(safe-area-inset-bottom) for gesture bars
 * - Minimum 44x44px touch targets
 */
const MobileBottomNav = () => {
  const location = useLocation()
  const { fanUser, isLoggedIn } = useFanAuth()
  const currentPath = location.pathname

  const navItems = [
    {
      id: 'home',
      label: 'Beranda',
      to: '/',
      icon: FaHome,
      isActive: currentPath === '/'
    },
    {
      id: 'shop',
      label: 'Shop',
      to: '/shop',
      icon: FaStore,
      isActive: currentPath.startsWith('/shop') || currentPath.startsWith('/checkout') || currentPath.startsWith('/merch-checkout')
    },
    {
      id: 'music',
      label: 'Musik',
      to: '/music',
      icon: FaMusic,
      isActive: currentPath.startsWith('/music')
    },
    {
      id: 'profile',
      label: isLoggedIn ? (fanUser?.nama?.split(' ')[0] || 'Profil') : 'Profil',
      to: isLoggedIn ? '/profile' : '/login',
      icon: FaUser,
      avatarUrl: fanUser?.image_url,
      isActive: currentPath.startsWith('/profile') || currentPath.startsWith('/login')
    }
  ]

  return (
    <nav
      role="navigation"
      aria-label="Navigasi Utama Mobile"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)] border-t border-[var(--border)] no-select transition-colors"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = item.isActive

          return (
            <Link
              key={item.id}
              to={item.to}
              className={`flex-1 flex flex-col items-center justify-center min-h-[44px] py-1.5 px-1 rounded-xl transition-all tap-active relative ${
                active
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {/* Active Pill Indicator at Top */}
              {active && (
                <span className="absolute top-0 w-8 h-1 bg-[var(--primary)] rounded-full animate-fade-in" />
              )}

              {/* Icon / Avatar */}
              <div className="relative flex items-center justify-center w-7 h-7 mb-0.5">
                {item.avatarUrl ? (
                  <img
                    src={item.avatarUrl}
                    alt={item.label}
                    className={`w-6 h-6 rounded-full object-cover border ${
                      active ? 'border-[var(--primary)] ring-1 ring-[var(--primary)]' : 'border-[var(--border)]'
                    }`}
                  />
                ) : (
                  <Icon className={`text-lg transition-transform ${active ? 'scale-110' : ''}`} />
                )}

                {/* Status Dot for Logged-In Fan on Profile Tab */}
                {item.id === 'profile' && isLoggedIn && !item.avatarUrl && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--success)]" />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[11px] tracking-tight leading-tight truncate max-w-[70px] ${
                  active ? 'font-black text-[var(--primary)]' : 'font-semibold'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default MobileBottomNav

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import MobileHeader from './MobileHeader'
import MobileBottomNav from './MobileBottomNav'
import MobileDrawer from '../common/MobileDrawer'

/**
 * MobileAppShell (Root Native-Feel Shell for Kohi Sekai Mobile)
 * Provides:
 * - Safe-area inset handling (top, bottom, notch, home bar)
 * - Sticky compact top header
 * - Fixed native bottom navigation
 * - Slide-out drawer menu
 * - 100dvh full viewport container
 * - Anti-blur and solid coffee theme styling
 */
const MobileAppShell = ({
  children,
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  hideHeader = false,
  hideBottomNav = false,
  hideCart = false,
  className = ''
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="mobile-app-root relative flex flex-col bg-[var(--background)] text-[var(--text-primary)] no-overscroll">
      
      {/* Sticky Mobile Header */}
      {!hideHeader && (
        <MobileHeader
          title={title}
          subtitle={subtitle}
          showBack={showBack}
          onBack={onBack}
          onOpenDrawer={() => setDrawerOpen(true)}
          rightAction={rightAction}
          hideCart={hideCart}
        />
      )}

      {/* Main Content Area */}
      <motion.main
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2 }}
        className={`flex-1 w-full max-w-md mx-auto px-4 py-4 ${
          !hideBottomNav ? 'pb-24' : 'pb-6'
        } ${className}`}
      >
        {children}
      </motion.main>

      {/* Fixed Bottom Navigation Bar */}
      {!hideBottomNav && <MobileBottomNav />}

      {/* Slide-out Navigation Drawer */}
      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

    </div>
  )
}

export default MobileAppShell

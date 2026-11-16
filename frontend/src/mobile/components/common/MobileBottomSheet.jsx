import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaTimes } from 'react-icons/fa'

/**
 * MobileBottomSheet (Kohi Sekai Native-Feel Bottom Sheet Drawer)
 * Strict Deep Coffee Protocol:
 * - Solid surface (#241E19), border (#3A2E24)
 * - Solid black overlay (NO backdrop-blur, NO gradient)
 * - Rounded top 3xl, visual drag handle on top
 * - Comfortable 1-column scrollable body
 * - Sticky action bar at the bottom with safe-area padding
 * - Minimum 44x44px touch targets
 */
const MobileBottomSheet = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxHeight = 'max-h-[92vh]',
  showClose = true
}) => {
  const sheetRef = useRef(null)

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.()
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          
          {/* Solid Dark Overlay (NO BLUR) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 z-40 tap-active"
            aria-hidden="true"
          />

          {/* Bottom Sheet Drawer Container */}
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={`relative z-50 w-full ${maxHeight} flex flex-col bg-[var(--surface)] border-t border-[var(--border)] rounded-t-3xl shadow-2xl overflow-hidden`}
          >
            
            {/* Visual Drag Bar */}
            <div className="pt-3 pb-1 cursor-grab active:cursor-grabbing flex justify-center">
              <span className="w-12 h-1.5 bg-[var(--border)] rounded-full" />
            </div>

            {/* Header */}
            {(title || showClose) && (
              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
                <div className="flex-1 pr-3">
                  {title && (
                    <h2 className="text-base font-bold text-[var(--text-primary)] leading-snug">
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-normal">
                      {subtitle}
                    </p>
                  )}
                </div>

                {showClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Tutup"
                    className="touch-target rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:bg-[var(--background)] tap-active -mr-2"
                  >
                    <FaTimes className="text-base" />
                  </button>
                )}
              </div>
            )}

            {/* Scrollable Body (1-Column Thumb-Friendly Layout) */}
            <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar space-y-4">
              {children}
            </div>

            {/* Sticky Action Bar at Bottom (if provided) */}
            {footer && (
              <div
                className="sticky bottom-0 bg-[var(--surface)] border-t border-[var(--border)] p-4 shadow-lg"
                style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
              >
                {footer}
              </div>
            )}

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default MobileBottomSheet

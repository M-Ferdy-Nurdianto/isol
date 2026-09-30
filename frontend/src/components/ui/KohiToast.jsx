/**
 * KohiToast.jsx — Kohi Sekai Custom Toast System (Pure Framer Motion)
 * Icons: react-icons (flat, monochrome)
 */

import { createPortal } from 'react-dom'
import { useState, useEffect, useCallback, useRef, forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'
import { FaCheckCircle, FaTimesCircle, FaInfoCircle, FaShoppingBag, FaShoppingCart } from 'react-icons/fa'

// ── Event Bus Global ──────────────────────────────────────────────────────────
let _dispatch = null
const bus = {
  subscribe: (fn) => { _dispatch = fn },
  unsubscribe: () => { _dispatch = null },
  emit: (toast) => { if (_dispatch) _dispatch(toast) }
}

let _id = 0
const nextId = () => ++_id

const DURATION = 1600

// Icon map — flat react-icons
const ICON_MAP = {
  success: FaCheckCircle,
  error: FaTimesCircle,
  info: FaInfoCircle,
  cart: FaShoppingCart,
  merch: FaShoppingBag,
}

const ICON_COLOR = {
  success: '#22c55e',
  error: '#ef4444',
  info: '#60a5fa',
  cart: 'var(--primary)',
  merch: '#a78bfa',
}

// ── Single Toast Pill Component (forwardRef wrapped to fix motion ref warning) ──
const ToastCard = forwardRef(({ t, isDark, onDismiss }, ref) => {
  const IconComp = ICON_MAP[t.type] || FaInfoCircle
  const iconColor = ICON_COLOR[t.type] || '#60a5fa'

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: -20, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      onClick={onDismiss}
      className={`pointer-events-auto flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-full shadow-2xl border select-none cursor-pointer ${
        isDark
          ? 'bg-surface border-white/10 text-white shadow-black/50'
          : 'bg-white border-gray-200/80 text-gray-900 shadow-xl'
      }`}
      style={{ maxWidth: '90vw' }}
    >
      <IconComp style={{ color: iconColor, fontSize: '15px' }} className="shrink-0" />
      <span className={`text-xs font-medium leading-snug ${isDark ? 'text-[#f0efec]' : 'text-gray-900'}`}>
        {t.title}
      </span>
    </motion.div>
  )
})
ToastCard.displayName = 'ToastCard'

// ── Toast Container Portal ────────────────────────────────────────────────────
export const KohiToastContainer = () => {
  const [toasts, setToasts] = useState([])
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id])
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const add = useCallback((toast) => {
    const id = nextId()
    setToasts(prev => {
      prev.forEach(t => clearTimeout(timers.current[t.id]))
      return [{ ...toast, id }]
    })
    timers.current[id] = setTimeout(() => dismiss(id), DURATION)
  }, [dismiss])

  useEffect(() => {
    bus.subscribe(add)
    return () => bus.unsubscribe()
  }, [add])

  return createPortal(
    <div className="fixed top-24 inset-x-0 z-[999999] flex flex-col items-center pointer-events-none px-4">
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <ToastCard key={t.id} t={t} isDark={isDark} onDismiss={() => dismiss(t.id)} />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  )
}

// Backwards compatibility alias
export const RBToastContainer = KohiToastContainer

// ── Public API ────────────────────────────────────────────────────────────────
export const kohiToast = {
  cart: (memberName, qty = 1) => {
    bus.emit({
      type: 'cart',
      title: qty > 1 ? `${memberName} (${qty}x di keranjang)` : `${memberName} masuk ke keranjang`,
    })
  },

  group: (qty = 1) => {
    bus.emit({
      type: 'cart',
      title: qty > 1 ? `Cheki Group (${qty}x di keranjang)` : 'Cheki Group masuk ke keranjang',
    })
  },

  merch: (itemName, qty = 1) => {
    bus.emit({
      type: 'merch',
      title: qty > 1 ? `${itemName} (${qty}x di keranjang)` : `${itemName} masuk ke keranjang`,
    })
  },

  success: (message) => bus.emit({ type: 'success', title: message }),
  error: (message) => bus.emit({ type: 'error', title: message }),
  info: (message) => bus.emit({ type: 'info', title: message }),
}

// Backwards compatibility export
export const rbToast = kohiToast

export default kohiToast

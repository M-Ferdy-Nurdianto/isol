/**
 * KohiToast.jsx — Kohi Sekai Custom Toast System (Pure Framer Motion)
 * Design System: Deep Coffee Metal
 * Icons: react-icons (flat, monochrome)
 */

import { createPortal } from 'react-dom'
import React, { useState, useEffect, useCallback, useRef, forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaExclamationTriangle,
  FaShoppingBag,
  FaShoppingCart
} from 'react-icons/fa'
import { webAlert, kohiAlert } from '../../lib/webAlert'

// ── Event Bus Global ──────────────────────────────────────────────────────────
let _dispatch = null
const bus = {
  subscribe: (fn) => { _dispatch = fn },
  unsubscribe: () => { _dispatch = null },
  emit: (toast) => { if (_dispatch) _dispatch(toast) }
}

let _id = 0
const nextId = () => ++_id

const DURATION = 2200

// Icon map — flat react-icons
const ICON_MAP = {
  success: FaCheckCircle,
  error: FaTimesCircle,
  warning: FaExclamationTriangle,
  info: FaInfoCircle,
  cart: FaShoppingCart,
  merch: FaShoppingBag,
}

const ICON_COLOR = {
  success: '#6FAE73',
  error: '#D65656',
  warning: '#E5A93C',
  info: '#E8944A',
  cart: '#E8944A',
  merch: '#E8944A',
}

// ── Single Toast Pill Component ──
const ToastCard = forwardRef(({ t, onDismiss }, ref) => {
  const IconComp = ICON_MAP[t.type] || FaInfoCircle
  const iconColor = ICON_COLOR[t.type] || '#E8944A'

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      onClick={onDismiss}
      className="pointer-events-auto flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-xl bg-[var(--surface,#241E19)] border border-[var(--border,#3A2E24)] text-[var(--text-primary,#F5E6D3)] shadow-2xl shadow-black/80 select-none cursor-pointer"
      style={{ maxWidth: '90vw' }}
    >
      <IconComp style={{ color: iconColor, fontSize: '15px' }} className="shrink-0" />
      <span className="text-xs font-semibold text-[var(--text-primary,#F5E6D3)] leading-snug">
        {t.title}
      </span>
    </motion.div>
  )
})
ToastCard.displayName = 'ToastCard'

// ── Toast Container Portal ────────────────────────────────────────────────────
export const KohiToastContainer = () => {
  const [toasts, setToasts] = useState([])
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
    <div className="fixed top-20 inset-x-0 z-[999999] flex flex-col items-center pointer-events-none px-4 gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <ToastCard key={t.id} t={t} onDismiss={() => dismiss(t.id)} />
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
  warning: (message) => bus.emit({ type: 'warning', title: message }),
  info: (message) => bus.emit({ type: 'info', title: message }),
  alert: webAlert,
}

// Backwards compatibility export
export const rbToast = kohiToast
export { webAlert, kohiAlert }
export default kohiToast

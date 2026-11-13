import React from 'react'
import { toast } from 'react-toastify'
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaExclamationTriangle,
  FaTrash,
  FaSignInAlt,
  FaSignOutAlt,
  FaFileDownload,
  FaShoppingCart
} from 'react-icons/fa'
import { webAlert, kohiAlert } from './webAlert'

/**
 * Toast Styles sesuai tema Deep Coffee Metal:
 * - background: #241E19 (Dark Coffee Card & Surface)
 * - border: #3A2E24 (Subtle Coffee Border)
 * - text: #F5E6D3 (Warm Cream Light Text)
 * - success: #6FAE73 (Hijau sukses)
 * - error: #D65656 (Merah status)
 * - info / primary: #E8944A (Amber brand)
 * - warning: #E5A93C (Kuning status)
 * - delete: #D65656 (Merah hapus)
 * - auth: #E8944A (Amber brand)
 * - logout: #B0A599 (Muted Coffee)
 * - download: #6FAE73 (Hijau sukses)
 * - cart: #E8944A (Amber brand)
 */
const toastStyles = {
  success: {
    icon: <FaCheckCircle />,
    color: '#6FAE73'
  },
  error: {
    icon: <FaExclamationCircle />,
    color: '#D65656'
  },
  info: {
    icon: <FaInfoCircle />,
    color: '#E8944A'
  },
  warning: {
    icon: <FaExclamationTriangle />,
    color: '#E5A93C'
  },
  delete: {
    icon: <FaTrash />,
    color: '#D65656'
  },
  auth: {
    icon: <FaSignInAlt />,
    color: '#E8944A'
  },
  logout: {
    icon: <FaSignOutAlt />,
    color: '#B0A599'
  },
  download: {
    icon: <FaFileDownload />,
    color: '#6FAE73'
  },
  cart: {
    icon: <FaShoppingCart />,
    color: '#E8944A'
  }
}

const CustomToast = ({ message, type = 'info', customIcon, customColor }) => {
  const style = toastStyles[type] || toastStyles.info
  const icon = customIcon || style.icon
  const color = customColor || style.color

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[var(--surface,#241E19)] border border-[var(--border,#3A2E24)] rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.8)] w-[92vw] sm:w-auto sm:min-w-[280px] sm:max-w-[420px] mx-auto select-none">
      <span style={{ color }} className="text-base shrink-0">
        {icon}
      </span>
      <p className="text-xs font-semibold text-[var(--text-primary,#F5E6D3)] leading-snug truncate sm:whitespace-normal">
        {message}
      </p>
    </div>
  )
}

const toastOptions = (id) => ({
  toastId: id,
  position: 'bottom-center',
  autoClose: 2200,
  className: '!bg-transparent !p-0 !shadow-none min-h-0',
  bodyClassName: '!p-0 !m-0',
  closeButton: false,
})

export const showToast = {
  success: (message) => {
    const id = `success-${message}`
    const content = <CustomToast message={message} type="success" />
    if (toast.isActive(id)) toast.update(id, { render: content, ...toastOptions(id) })
    else toast(content, toastOptions(id))
  },
  error: (message) => {
    const id = `error-${message}`
    const content = <CustomToast message={message} type="error" />
    if (toast.isActive(id)) toast.update(id, { render: content, ...toastOptions(id) })
    else toast(content, toastOptions(id))
  },
  info: (message) => {
    const id = `info-${message}`
    const content = <CustomToast message={message} type="info" />
    if (toast.isActive(id)) toast.update(id, { render: content, ...toastOptions(id) })
    else toast(content, toastOptions(id))
  },
  warning: (message) => {
    const id = `warn-${message}`
    const content = <CustomToast message={message} type="warning" />
    if (toast.isActive(id)) toast.update(id, { render: content, ...toastOptions(id) })
    else toast(content, toastOptions(id))
  },
  // Toast keranjang belanja — menggunakan icon SVG resmi tanpa emoji
  cart: (message) => {
    const id = `cart-${message}`
    const content = <CustomToast message={message} type="cart" customIcon={<FaShoppingCart />} />
    if (toast.isActive(id)) toast.update(id, { render: content, ...toastOptions(id) })
    else toast(content, toastOptions(id))
  },
  // Helper opsional untuk kasus umum lainnya
  delete: (message) => {
    const id = `del-${message}`
    const content = <CustomToast message={message} type="delete" />
    if (toast.isActive(id)) toast.update(id, { render: content, ...toastOptions(id) })
    else toast(content, toastOptions(id))
  },
  auth: (message) => {
    const id = `auth-${message}`
    const content = <CustomToast message={message} type="auth" />
    if (toast.isActive(id)) toast.update(id, { render: content, ...toastOptions(id) })
    else toast(content, toastOptions(id))
  },
  logout: (message) => {
    const id = `logout-${message}`
    const content = <CustomToast message={message} type="logout" />
    if (toast.isActive(id)) toast.update(id, { render: content, ...toastOptions(id) })
    else toast(content, toastOptions(id))
  },
  download: (message) => {
    const id = `dl-${message}`
    const content = <CustomToast message={message} type="download" />
    if (toast.isActive(id)) toast.update(id, { render: content, ...toastOptions(id) })
    else toast(content, toastOptions(id))
  },
  // Shortcut ke webAlert modal dialog
  alert: webAlert
}

// Re-export webAlert untuk kemudahan import dari satu module
export { webAlert, kohiAlert }
export default showToast

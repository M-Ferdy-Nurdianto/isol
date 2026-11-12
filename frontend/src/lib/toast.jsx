import { toast } from 'react-toastify'
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaExclamationTriangle,
  FaTrash,
  FaSignInAlt,
  FaSignOutAlt,
  FaFileDownload
} from 'react-icons/fa'

// Palet warna minimalis sesuai tema Kohi Sekai:
// - success  -> #6FAE73 (hijau sukses)
// - error    -> #D65656 (merah status)
// - info     -> #E8944A (amber brand)
// - warning  -> #E5A93C (kuning pending)
// - delete   -> #D65656 (merah hapus)
// - auth     -> #F5E6D3 (netral login/logout)
// - download -> #6FAE73 (hijau sukses)
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
    color: '#F5E6D3'
  },
  logout: {
    icon: <FaSignOutAlt />,
    color: '#F5E6D3'
  },
  download: {
    icon: <FaFileDownload />,
    color: '#6FAE73'
  }
}

const CustomToast = ({ message, type = 'info', customIcon, customColor }) => {
  const style = toastStyles[type] || toastStyles.info
  const icon = customIcon || style.icon
  const color = customColor || style.color

  return (
    <div className="flex items-center gap-2.5 px-4 py-3.5 bg-[#111726] border border-white/10 rounded-2xl shadow-xl w-[92vw] sm:w-auto sm:min-w-[280px] sm:max-w-[380px] mx-auto">
      <span style={{ color }} className="text-[17px] shrink-0">
        {icon}
      </span>
      <p className="text-[13px] font-normal text-[#f0efec] leading-snug truncate sm:whitespace-normal">
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
  // Toast khusus keranjang belanja / cart (emoji polos + teks tanpa bulatan background & tanpa label)
  cart: (message, emoji = 'ðŸ›’') => {
    const id = `cart-${message}`
    const content = (
      <div className="flex items-center gap-2.5 px-4 py-3.5 bg-[#111726] border border-white/10 rounded-2xl shadow-xl w-[92vw] sm:w-auto sm:min-w-[280px] sm:max-w-[380px] mx-auto">
        <span className="text-[17px] shrink-0">{emoji}</span>
        <p className="text-[13px] font-normal text-[#f0efec] leading-snug truncate sm:whitespace-normal">
          {message}
        </p>
      </div>
    )
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
  }
}

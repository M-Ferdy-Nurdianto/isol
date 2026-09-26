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

// Palet warna minimalis sesuai tema admin Kohi Sekai:
// - success  -> #079108 (hijau brand)
// - error    -> #f76464 (merah status)
// - info     -> #00e5e5 (cyan status checked)
// - warning  -> #f59e0b (amber)
// - delete   -> #f76464 (merah hapus)
// - auth     -> #f0efec (netral login/logout)
// - download -> #079108 (hijau brand)
const toastStyles = {
  success: {
    icon: <FaCheckCircle />,
    color: '#079108'
  },
  error: {
    icon: <FaExclamationCircle />,
    color: '#f76464'
  },
  info: {
    icon: <FaInfoCircle />,
    color: '#00e5e5'
  },
  warning: {
    icon: <FaExclamationTriangle />,
    color: '#f59e0b'
  },
  delete: {
    icon: <FaTrash />,
    color: '#f76464'
  },
  auth: {
    icon: <FaSignInAlt />,
    color: '#f0efec'
  },
  logout: {
    icon: <FaSignOutAlt />,
    color: '#f0efec'
  },
  download: {
    icon: <FaFileDownload />,
    color: '#079108'
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

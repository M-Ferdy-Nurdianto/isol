// Auth Session & Inactivity Tracker (7 Days / 1 Week Auto-Logout)

const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 hari (1 minggu)
const LAST_ACTIVITY_KEY = 'admin_last_activity'

const isJwtExpired = (token) => {
  try {
    const parts = String(token || '').split('.')
    if (parts.length !== 3) return false
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload?.exp === 'number' && Date.now() >= payload.exp * 1000
  } catch {
    return false
  }
}

/**
 * Update timestamp aktivitas admin terakhir (dipanggil saat login atau ada interaksi di admin)
 */
export const touchAdminSession = () => {
  if (typeof window === 'undefined') return
  localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()))
}

/**
 * Memeriksa apakah token admin masih valid dan belum melewati batas 1 minggu inaktivitas / JWT exp.
 * Jika kadaluarsa atau tidak ada token, otomatis logout/bersihkan storage.
 */
export const getValidAdminToken = () => {
  if (typeof window === 'undefined') return null

  const token = localStorage.getItem('admin_token')
  if (!token) return null

  if (isJwtExpired(token)) {
    logoutAdminSession()
    return null
  }

  const lastActivityStr = localStorage.getItem(LAST_ACTIVITY_KEY)
  const now = Date.now()

  // Jika sudah lewat dari 7 hari (1 minggu)
  if (lastActivityStr) {
    const lastActivity = parseInt(lastActivityStr, 10)
    if (!Number.isNaN(lastActivity) && (now - lastActivity > SESSION_EXPIRY_MS)) {
      logoutAdminSession()
      return null
    }
  }

  // Perbarui waktu aktivitas terakhir
  touchAdminSession()
  return token
}

/**
 * Bersihkan sesi admin & guest dari localStorage
 */
export const logoutAdminSession = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_user')
  localStorage.removeItem('is_guest_mode')
  localStorage.removeItem(LAST_ACTIVITY_KEY)
}

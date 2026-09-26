// Auth Session & Inactivity Tracker (1 Day / 24 Hours Auto-Logout)

const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 jam (1 hari)
const LAST_ACTIVITY_KEY = 'admin_last_activity'

/**
 * Update timestamp aktivitas admin terakhir (dipanggil saat login atau ada interaksi di admin)
 */
export const touchAdminSession = () => {
  if (typeof window === 'undefined') return
  localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()))
}

/**
 * Memeriksa apakah token admin masih valid dan belum melewati batas 1 hari inaktivitas.
 * Jika melewati 1 hari atau tidak ada token, otomatis logout/bersihkan storage.
 */
export const getValidAdminToken = () => {
  if (typeof window === 'undefined') return null

  const token = localStorage.getItem('admin_token')
  if (!token) return null

  const lastActivityStr = localStorage.getItem(LAST_ACTIVITY_KEY)
  const now = Date.now()

  // Jika tidak ada catatan aktivitas atau sudah lewat dari 24 jam (1 hari)
  if (lastActivityStr) {
    const lastActivity = parseInt(lastActivityStr, 10)
    if (!Number.isNaN(lastActivity) && (now - lastActivity > SESSION_EXPIRY_MS)) {
      // Sesi kadaluarsa karena tidak membuka website selama lebih dari 1 hari
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

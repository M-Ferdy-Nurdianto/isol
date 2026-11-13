import Swal from 'sweetalert2'

/**
 * webAlert — Kohi Sekai Unified Web Alert & Confirmation System
 * Design System: Deep Coffee Metal
 * 
 * Sesuai manifesto:
 * - Solid color background (#241E19 surface, #1A1512 background, #3A2E24 border)
 * - Anti-blur / Tanpa glassmorphism (solid backdrop overlay)
 * - Warna fungsional: Merah (#D65656), Hijau (#6FAE73), Kuning (#E5A93C), Brand Primary (#E8944A)
 * - Reusable di seluruh komponen (Admin, Modals, Checkout, User OTS, dll.)
 */

// Custom classNames untuk styling yang presisi
const DEFAULT_CUSTOM_CLASS = {
  container: 'kohi-swal-container',
  popup: 'kohi-swal-popup',
  title: 'kohi-swal-title',
  htmlContainer: 'kohi-swal-html',
  confirmButton: 'kohi-swal-confirm',
  cancelButton: 'kohi-swal-cancel',
  actions: 'kohi-swal-actions'
}

/**
 * Base configuration dengan token Deep Coffee Metal
 */
const getBaseConfig = () => ({
  background: '#241E19',
  color: '#F5E6D3',
  confirmButtonColor: '#E8944A',
  cancelButtonColor: '#1A1512',
  backdrop: 'rgba(10, 8, 6, 0.88)',
  customClass: DEFAULT_CUSTOM_CLASS,
  reverseButtons: true, // Cancel di kiri, Confirm di kanan
  buttonsStyling: true,
})

export const webAlert = {
  /**
   * Dialog konfirmasi aksi (contoh: Hapus data, Logout, Perubahan status)
   * Mengembalikan Promise<boolean> (true jika user konfirmasi, false jika batal)
   */
  confirm: async ({
    title = 'Konfirmasi Aksi',
    text = 'Apakah Anda yakin ingin melanjutkan?',
    confirmText = 'Ya, Lanjutkan',
    cancelText = 'Batal',
    isDanger = false,
    icon = 'warning'
  } = {}) => {
    const config = getBaseConfig()
    
    const result = await Swal.fire({
      ...config,
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      confirmButtonColor: isDanger ? '#D65656' : '#E8944A',
      cancelButtonColor: '#1A1512',
    })

    return result.isConfirmed
  },

  /**
   * Alert Sukses (bisa auto-close timer atau dengan tombol OK)
   */
  success: (title = 'Berhasil!', text = '', { timer = 1800, showConfirmButton = false } = {}) => {
    const config = getBaseConfig()
    return Swal.fire({
      ...config,
      icon: 'success',
      title,
      text,
      timer: showConfirmButton ? undefined : timer,
      showConfirmButton,
      confirmButtonText: 'Selesai',
      confirmButtonColor: '#6FAE73'
    })
  },

  /**
   * Alert Error / Gagal
   */
  error: (title = 'Terjadi Kesalahan', text = '', { confirmText = 'Tutup' } = {}) => {
    const config = getBaseConfig()
    return Swal.fire({
      ...config,
      icon: 'error',
      title,
      text,
      confirmButtonText: confirmText,
      confirmButtonColor: '#D65656'
    })
  },

  /**
   * Alert Peringatan / Validasi
   */
  warning: (title = 'Perhatian', text = '', { confirmText = 'Mengerti' } = {}) => {
    const config = getBaseConfig()
    return Swal.fire({
      ...config,
      icon: 'warning',
      title,
      text,
      confirmButtonText: confirmText,
      confirmButtonColor: '#E8944A'
    })
  },

  /**
   * Alert Informasi
   */
  info: (title = 'Informasi', text = '', { confirmText = 'OK' } = {}) => {
    const config = getBaseConfig()
    return Swal.fire({
      ...config,
      icon: 'info',
      title,
      text,
      confirmButtonText: confirmText,
      confirmButtonColor: '#E8944A'
    })
  },

  /**
   * Loading state modal (misal saat download file berat atau sinkronisasi)
   */
  loading: (title = 'Memproses...', text = 'Mohon tunggu beberapa saat') => {
    const config = getBaseConfig()
    return Swal.fire({
      ...config,
      title,
      text,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading()
      }
    })
  },

  /**
   * Menutup alert/loading yang sedang aktif
   */
  close: () => {
    Swal.close()
  },

  /**
   * Raw Swal wrapper dengan default tema Kohi Sekai tetap aktif
   */
  fire: (options = {}) => {
    const config = getBaseConfig()
    return Swal.fire({
      ...config,
      ...options,
      customClass: {
        ...config.customClass,
        ...(options.customClass || {})
      }
    })
  }
}

// Aliases
export const kohiAlert = webAlert
export default webAlert


import React from 'react'
import {
  FaTimes,
  FaUser,
  FaEnvelope,
  FaWhatsapp,
  FaInstagram,
  FaCalendarAlt,
  FaIdBadge
} from 'react-icons/fa'
import UserSecuritySection from '../components/UserSecuritySection'

/**
 * User Account Detail Modal for Admin Dashboard
 */
const UserDetailModal = ({ isOpen, onClose, user, onRefresh }) => {
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!isOpen || !user) return null

  const fanCode = user.fan_code || String(user.fan_id || '').padStart(4, '0')

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 animate-fade-in"
    >
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto custom-scrollbar text-[var(--text-primary)]">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--background)] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--border)] border border-[var(--primary)]/40 flex items-center justify-center text-[var(--text-secondary)] shrink-0">
              {user.image_url ? (
                <img
                  src={user.image_url}
                  alt={user.nama}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.style.display = 'none'
                  }}
                />
              ) : (
                <FaUser className="text-base" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-[var(--text-primary)] tracking-wide">
                  {user.nama}
                </h3>
                <span className="px-2 py-0.5 rounded bg-[var(--primary)]/15 border border-[var(--primary)]/50 text-[var(--primary)] text-[10px] font-mono font-black">
                  ID #{fanCode}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Detail Akun Fan & Manajemen Keamanan
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[var(--border)] hover:bg-[var(--primary)]/20 text-[var(--text-secondary)] hover:text-[var(--primary)] flex items-center justify-center transition text-sm"
            title="Tutup Modal"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5">
          {/* User Profile Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-3">
              <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider block mb-1">
                Email
              </span>
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)] truncate">
                <FaEnvelope className="text-[var(--primary)] shrink-0 text-[11px]" />
                <span className="truncate">{user.email || '-'}</span>
              </div>
            </div>

            <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-3">
              <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider block mb-1">
                WhatsApp
              </span>
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)] truncate">
                <FaWhatsapp className="text-[var(--primary)] shrink-0 text-[11px]" />
                <span className="truncate">{user.whatsapp || '-'}</span>
              </div>
            </div>

            <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-3">
              <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider block mb-1">
                Instagram
              </span>
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)] truncate">
                <FaInstagram className="text-[var(--accent)] shrink-0 text-[11px]" />
                <span className="truncate">{user.instagram ? `@${user.instagram.replace(/^@/, '')}` : '-'}</span>
              </div>
            </div>
          </div>

          {/* Account Security & Password Reset Section */}
          <UserSecuritySection user={user} onActionSuccess={onRefresh} />
        </div>
      </div>
    </div>
  )
}

export default UserDetailModal


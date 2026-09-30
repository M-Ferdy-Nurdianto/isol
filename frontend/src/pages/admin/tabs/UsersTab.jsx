import React, { useState, useEffect, useCallback } from 'react'
import {
  FaUsers,
  FaSearch,
  FaShieldAlt,
  FaUser,
  FaEnvelope,
  FaWhatsapp,
  FaInstagram,
  FaSync,
  FaSpinner,
  FaKey,
  FaIdBadge
} from 'react-icons/fa'
import api from '../../../lib/api'
import UserDetailModal from '../modals/UserDetailModal'

const UsersTab = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  const fetchUsers = useCallback(async (query = '') => {
    setLoading(true)
    try {
      const res = await api.get('/users', {
        params: { search: query, limit: 50 }
      })
      const list = res.data?.data || []
      setUsers(list)
      setTotalCount(res.data?.total || list.length)
    } catch (err) {
      console.error('[UsersTab] Failed to fetch users:', err)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, fetchUsers])

  const handleOpenDetail = (user) => {
    setSelectedUser(user)
    setShowDetailModal(true)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase flex items-center gap-2.5">
            Akun Fan & <span className="text-[#079108]">Keamanan</span>
          </h2>
          <p className="text-xs text-zinc-400 font-medium mt-1">
            Kelola data akun member fan, reset password via email, dan generate kode OTP admin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono font-bold text-[#079108]">
            {totalCount} Akun Terdaftar
          </span>
          <button
            onClick={() => fetchUsers(search)}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition disabled:opacity-50"
            title="Muat Ulang"
          >
            <FaSync className={`text-xs ${loading ? 'animate-spin text-[#079108]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
          <FaSearch className="text-xs" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari ID fan (misal: 0002), nama lengkap, atau alamat email..."
          className="w-full pl-9 pr-4 py-2.5 bg-[#111726] border border-white/10 text-white text-xs rounded-xl placeholder-zinc-500 focus:border-[#079108] focus:outline-none transition"
        />
      </div>

      {/* Users Display (Desktop Table + Mobile Cards) */}
      <div className="bg-[#111726] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
            <FaSpinner className="animate-spin text-2xl text-[#079108]" />
            <span className="text-xs font-semibold">Memuat daftar akun fan...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 text-zinc-500 flex items-center justify-center mx-auto mb-3 text-lg">
              <FaUsers />
            </div>
            <p className="text-sm font-bold text-white">Tidak ada akun ditemukan</p>
            <p className="text-xs text-zinc-400 mt-1">
              {search ? `Tidak ada akun yang cocok dengan kata kunci "${search}"` : 'Belum ada data akun fan terdaftar.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#182032] text-zinc-400 font-bold uppercase tracking-wider border-b border-white/10 text-[10px]">
                  <tr>
                    <th className="py-3 px-4">ID Fan</th>
                    <th className="py-3 px-4">Nama User</th>
                    <th className="py-3 px-4">Email Terdaftar</th>
                    <th className="py-3 px-4">Kontak</th>
                    <th className="py-3 px-4">Bergabung</th>
                    <th className="py-3 px-4 text-right">Aksi Keamanan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((u) => {
                    const fanCode = u.fan_code || String(u.fan_id || '').padStart(4, '0')
                    return (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-3 px-4 font-mono font-bold text-[#079108]">
                          #{fanCode}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full overflow-hidden bg-white/10 border border-white/10 flex items-center justify-center text-zinc-400 shrink-0">
                              {u.image_url ? (
                                <img
                                  src={u.image_url}
                                  alt={u.nama}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null
                                    e.target.style.display = 'none'
                                  }}
                                />
                              ) : (
                                <FaUser className="text-[10px]" />
                              )}
                            </div>
                            <span className="font-bold text-white truncate max-w-[150px]">
                              {u.nama}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-zinc-300">
                          {u.email || '-'}
                        </td>
                        <td className="py-3 px-4 text-zinc-400">
                          <div className="space-y-0.5">
                            {u.whatsapp && u.whatsapp !== '-' && (
                              <div className="flex items-center gap-1.5 text-[11px]">
                                <FaWhatsapp className="text-emerald-400 text-[10px]" />
                                <span>{u.whatsapp}</span>
                              </div>
                            )}
                            {u.instagram && u.instagram !== '-' && (
                              <div className="flex items-center gap-1.5 text-[11px]">
                                <FaInstagram className="text-pink-400 text-[10px]" />
                                <span>@{u.instagram.replace(/^@/, '')}</span>
                              </div>
                            )}
                            {(!u.whatsapp || u.whatsapp === '-') && (!u.instagram || u.instagram === '-') && (
                              <span>-</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenDetail(u)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#079108]/15 hover:bg-[#079108]/25 border border-[#079108]/40 text-[#079108] font-bold text-xs transition"
                          >
                            <FaShieldAlt className="text-[10px]" />
                            <span>Reset Password</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (< md) */}
            <div className="md:hidden divide-y divide-white/5">
              {users.map((u) => {
                const fanCode = u.fan_code || String(u.fan_id || '').padStart(4, '0')
                return (
                  <div key={u.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 border border-white/10 flex items-center justify-center text-zinc-400 shrink-0">
                          {u.image_url ? (
                            <img
                              src={u.image_url}
                              alt={u.nama}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null
                                e.target.style.display = 'none'
                              }}
                            />
                          ) : (
                            <FaUser className="text-xs" />
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-white text-sm block">
                            {u.nama}
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            {u.email || '-'}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-[#182032] border border-[#079108]/50 text-[#079108] text-[10px] font-mono font-bold">
                        #{fanCode}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="text-[11px] text-zinc-500">
                        {u.whatsapp && u.whatsapp !== '-' ? u.whatsapp : (u.instagram ? `@${u.instagram.replace(/^@/, '')}` : '-')}
                      </div>
                      <button
                        onClick={() => handleOpenDetail(u)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#079108]/20 border border-[#079108]/50 text-[#079108] font-bold text-xs transition"
                      >
                        <FaShieldAlt className="text-[10px]" />
                        <span>Reset Password</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* User Detail & Security Modal */}
      {showDetailModal && selectedUser && (
        <UserDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedUser(null)
          }}
          user={selectedUser}
          onRefresh={() => fetchUsers(search)}
        />
      )}
    </div>
  )
}

export default UsersTab

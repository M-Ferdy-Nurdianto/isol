import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaTools, FaExternalLinkAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { useMaintenance } from '../context/MaintenanceContext'
import { getValidAdminToken } from '../lib/authSession'

const MaintenanceAdminBadge = () => {
  const { isMaintenance } = useMaintenance()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMinimized, setIsMinimized] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640
    }
    return false
  })

  useEffect(() => {
    const checkAdmin = () => {
      const token = getValidAdminToken()
      setIsAdmin(Boolean(token))
    }

    checkAdmin()
    // Dengarkan event storage bila login/logout di tab lain
    window.addEventListener('storage', checkAdmin)
    return () => window.removeEventListener('storage', checkAdmin)
  }, [])

  // Hanya tampilkan jika website dalam mode maintenance DAN user adalah admin
  if (!isMaintenance || !isAdmin) {
    return null
  }

  return (
    <div
      className="fixed top-4 left-4 z-[99999] pointer-events-auto transition-all duration-300 select-none"
      style={{ isolation: 'isolate' }}
    >
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          title="Mode MT Aktif (Admin Preview). Klik untuk perbesar."
          className="group flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/50 backdrop-blur-xl shadow-[0_4px_20px_rgba(245,158,11,0.35)] transition-all active:scale-95"
        >
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          <FaTools className="text-sm group-hover:rotate-12 transition-transform duration-200" />
        </button>
      ) : (
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-zinc-950/85 hover:bg-zinc-950/95 border border-amber-500/40 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_15px_rgba(245,158,11,0.2)] transition-all">
          {/* Status Dot */}
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </div>

          {/* Label Info */}
          <div className="flex flex-col leading-tight pr-1">
            <div className="flex items-center gap-1.5">
              <FaTools className="text-[10px] text-amber-400" />
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 font-mono">
                MT ACTIVE
              </span>
            </div>
            <span className="text-[9px] font-medium text-zinc-400">
              Admin Preview Mode
            </span>
          </div>

          {/* Quick link ke Admin Panel */}
          <Link
            to="/admin"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 hover:text-white"
          >
            <span>Dashboard</span>
            <FaExternalLinkAlt className="text-[8px]" />
          </Link>

          {/* Minimize button */}
          <button
            onClick={() => setIsMinimized(true)}
            title="Kecilkan indikator"
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors ml-0.5"
          >
            <FaChevronLeft className="text-[10px]" />
          </button>
        </div>
      )}
    </div>
  )
}

export default MaintenanceAdminBadge

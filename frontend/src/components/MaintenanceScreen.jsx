import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaRedo, FaInstagram, FaShieldAlt, FaClock } from 'react-icons/fa'
import { getAssetPath } from '../lib/pathUtils'

const MaintenanceScreen = ({ message, estimatedEnd }) => {
  const [timeLeft, setTimeLeft] = useState(null)

  useEffect(() => {
    if (!estimatedEnd) {
      setTimeLeft(null)
      return
    }

    const calculateTimeLeft = () => {
      const diff = new Date(estimatedEnd) - new Date()
      if (diff <= 0) {
        setTimeLeft(null)
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft({ hours, minutes, seconds })
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [estimatedEnd])

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 text-white overflow-hidden select-none font-sans">
      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          REAL MEMBER PHOTO BACKGROUND (100% dari foto member asli)
          Foto grup beresolusi tinggi dengan blur kuat & brightness optimal.
          â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src={getAssetPath('/images/members/group.webp')}
          alt="Kohi Sekai Member"
          className="w-full h-full object-cover"
          style={{
            filter: 'blur(20px) brightness(0.65) saturate(1.15)',
            transform: 'scale(1.15)'
          }}
          onError={(e) => {
            console.error('Maintenance background gagal dimuat:', e.target.src)
            // Fallback jika path webp bermasalah
            if (!e.target.src.includes('aca.webp')) {
              e.target.src = getAssetPath('/images/members/aca.webp')
            }
          }}
        />
        {/* HANYA SATU layer overlay tipis transparan */}
        <div className="absolute inset-0 bg-[#090d16]/50" />
      </div>

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          MAIN CONTENT CARD (Glassmorphism & High Contrast)
          â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-xl bg-[#111726]/90 backdrop-blur-2xl border border-white/15 rounded-[2rem] p-6 sm:p-10 shadow-[0_25px_70px_rgba(0,0,0,0.95)] text-center"
      >
        {/* Top Accent Line */}
        <div className="absolute -top-px left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-[#079108] to-transparent shadow-[0_0_15px_#079108]" />

        {/* Brand Logo Container */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-5">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#161f33] border border-white/15 p-4 flex items-center justify-center shadow-[0_0_30px_rgba(7,145,8,0.25)] relative overflow-hidden group">
              <img
                src={getAssetPath('/images/logos/logo.webp')}
                alt="Kohi Sekai Logo"
                className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(7,145,8,0.6)] group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.target.src = getAssetPath('logo.webp')
                }}
              />
            </div>
            {/* Pulsing Dot */}
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#079108] opacity-80"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[#079108] border-2 border-[#111726] shadow-[0_0_10px_#079108]"></span>
            </span>
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#079108]/15 border border-[#079108]/40 text-[#079108] text-xs font-bold uppercase tracking-widest mb-3 shadow-[0_0_12px_rgba(7,145,8,0.25)]">
            <span className="w-2 h-2 rounded-full bg-[#079108] animate-pulse shadow-[0_0_6px_#079108]"></span>
            <span>Pemeliharaan Sistem</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight uppercase text-white font-heading">
            KOHI <span className="text-[#079108] drop-shadow-[0_0_20px_rgba(7,145,8,0.4)]">SEKAI</span>
          </h1>
          <p className="text-[11px] sm:text-xs font-bold text-zinc-400 tracking-[0.25em] uppercase mt-1">
            ã‚³ãƒ’ãƒ»ã‚»ã‚«ã‚¤ â€¢ Under Maintenance
          </p>
        </div>

        {/* Message Panel */}
        <div className="bg-[#182238]/70 border border-white/10 rounded-2xl p-5 mb-6 text-zinc-300 text-sm leading-relaxed shadow-inner">
          <p className="font-medium">
            {message || 'Sori ya, web-nya belum bisa dipakai buat sementara. Kita lagi benerin beberapa bagian biar pas kalian order tiket atau cek jadwal, prosesnya lebih lancar. Pantengin Instagram buat kabar terbarunya.'}
          </p>
        </div>

        {/* Countdown Timer if estimatedEnd exists */}
        {timeLeft && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-[#161f33]/80 border border-[#079108]/30 shadow-[0_0_20px_rgba(7,145,8,0.1)]">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#079108] uppercase tracking-wider mb-3">
              <FaClock className="text-xs" />
              <span>Estimasi Selesai</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <div className="flex flex-col items-center">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono bg-[#0e1422] px-3.5 py-2 rounded-xl border border-white/10 min-w-[56px] shadow-md">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold mt-1.5">Jam</span>
              </div>
              <span className="text-[#079108] font-black text-xl -mt-5 animate-pulse">:</span>
              <div className="flex flex-col items-center">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono bg-[#0e1422] px-3.5 py-2 rounded-xl border border-white/10 min-w-[56px] shadow-md">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold mt-1.5">Menit</span>
              </div>
              <span className="text-[#079108] font-black text-xl -mt-5 animate-pulse">:</span>
              <div className="flex flex-col items-center">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono bg-[#0e1422] px-3.5 py-2 rounded-xl border border-white/10 min-w-[56px] shadow-md">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold mt-1.5">Detik</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleRefresh}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#1c2438] hover:bg-[#25304a] text-zinc-200 hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-md"
          >
            <FaRedo className="text-xs" />
            <span>Muat Ulang Halaman</span>
          </button>

          <a
            href="https://instagram.com/kohisekai"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#079108] hover:bg-[#067a07] text-white text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-[0_0_20px_rgba(7,145,8,0.35)]"
          >
            <FaInstagram className="text-sm" />
            <span>Instagram Resmi</span>
          </a>
        </div>

        {/* Footer info & Admin entry */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500 gap-2">
          <span>&copy; {new Date().getFullYear()} Kohi Sekai Project</span>
          <a
            href="/admin/login"
            className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-[#079108] transition-colors font-medium"
          >
            <FaShieldAlt className="text-[10px]" />
            <span>Portal Manajemen</span>
          </a>
        </div>
      </motion.div>
    </div>
  )
}

export default MaintenanceScreen

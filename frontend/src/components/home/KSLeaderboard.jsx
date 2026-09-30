import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaCrown, FaMedal, FaStar, FaTrophy, FaCalendarAlt, FaUserFriends } from 'react-icons/fa'
import api from '../../lib/api'

const getInitials = (name) => {
  if (!name) return 'FK'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

const KSLeaderboard = ({ members = [] }) => {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('all') // all, minggu, bulan, tahun
  const [memberId, setMemberId] = useState('all')

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/leaderboard?period=${period}&member_id=${memberId}`)
      if (res.data.success) {
        setLeaderboard(res.data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [period, memberId])

  const isAllMembers = !memberId || memberId === 'all'

  return (
    <section className="py-20 px-4 bg-background relative overflow-hidden">
      {/* Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-accent/5 blur-[160px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[140px] pointer-events-none" />

      <div className="container mx-auto max-w-5xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-xs font-black tracking-[0.5em] text-accent uppercase mb-3 flex items-center justify-center gap-2">
            <FaTrophy /> Top Fans Ranking
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-text-primary uppercase">
            WALL OF <span className="text-accent">FAME</span>
          </h2>
          <p className="text-sm text-text-secondary mt-4 max-w-lg mx-auto leading-relaxed">
            Terima kasih atas dukungan luar biasa kalian. Berikut adalah para penggemar paling berdedikasi!
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row gap-6 items-center justify-center mb-12"
        >
          {/* Member Filter */}
          <div className="flex flex-col items-center gap-2 max-w-full">
            <span className="text-[10px] font-black tracking-widest text-text-secondary uppercase">Pilih Kategori:</span>
            <div className="flex flex-wrap justify-center bg-surface/90 border border-border rounded-xl p-1.5 max-w-2xl gap-1 shadow-lg backdrop-blur-md">
              <button
                type="button"
                onClick={() => setMemberId('all')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${isAllMembers ? 'bg-accent text-white shadow-lg shadow-accent/25 scale-[1.02]' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`}
              >
                <FaUserFriends /> All Members
              </button>
              {members.map(m => {
                const idVal = m.id || m.member_id
                const isSelected = memberId === idVal
                return (
                  <button
                    type="button"
                    key={idVal}
                    onClick={() => setMemberId(idVal)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${isSelected ? 'bg-accent text-white shadow-lg shadow-accent/25 scale-[1.02]' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`}
                  >
                    {m.nama_panggung}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Period Filter */}
          <div className="flex flex-col items-center gap-2 max-w-full">
            <span className="text-[10px] font-black tracking-widest text-text-secondary uppercase">Pilih Waktu:</span>
            <div className="flex flex-wrap justify-center bg-surface/90 border border-border rounded-xl p-1.5 max-w-md gap-1 shadow-lg backdrop-blur-md">
              {[
                { id: 'all', label: 'All Time' },
                { id: 'tahun', label: 'Tahun Ini' },
                { id: 'bulan', label: 'Bulan Ini' },
                { id: 'minggu', label: 'Minggu Ini' }
              ].map(p => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${period === p.id ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-[1.02]' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`}
                >
                  <FaCalendarAlt size={10} /> {p.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Leaderboard Content */}
        <div className="relative min-h-[360px]">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
              </motion.div>
            ) : leaderboard.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-border/80 rounded-3xl bg-surface/50 backdrop-blur-sm"
              >
                <FaStar className="text-4xl text-border mb-4" />
                <p className="text-text-secondary font-bold">Belum ada data untuk periode/kategori ini.</p>
                <p className="text-xs text-text-secondary/60 mt-1">Jadilah yang pertama mendukung!</p>
              </motion.div>
            ) : (
              <motion.div 
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col gap-8"
              >
                {/* Elevated Outer Container Frame for Top 3 Podium (Makes Podium pop out) */}
                <div className="relative p-6 sm:p-10 rounded-3xl bg-gradient-to-b from-surface/90 via-surface/60 to-surface/90 border border-border/80 shadow-2xl backdrop-blur-md overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
                  
                  {/* Metallic Elevated Podium Section (Ranks 1-3) */}
                  <div className="flex flex-col md:flex-row justify-center items-end gap-5 pt-4 pb-2">
                    {[1, 0, 2].map((podiumIndex) => {
                      const fan = leaderboard[podiumIndex]
                      if (!fan) return null

                      const isFirst = podiumIndex === 0
                      const isSecond = podiumIndex === 1

                      // Distinct metallic themes for podiums
                      const podiumConfig = isFirst
                        ? {
                            rankLabel: '1ST',
                            bg: 'bg-gradient-to-b from-[#2d2516] via-[#1a160d] to-[#0f0c07]',
                            border: 'border-[#ffd700]/50',
                            glow: 'shadow-[0_0_50px_rgba(255,215,0,0.25)]',
                            avatarBorder: 'from-amber-300 via-yellow-400 to-amber-600',
                            badgeBg: 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black',
                            scoreBg: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300',
                            icon: <FaCrown className="text-3xl text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]" />,
                            height: 'md:h-[300px]',
                            scale: 'scale-[1.04] z-30'
                          }
                        : isSecond
                        ? {
                            rankLabel: '2ND',
                            bg: 'bg-gradient-to-b from-[#222733] via-[#141822] to-[#0a0d13]',
                            border: 'border-slate-300/40',
                            glow: 'shadow-[0_0_35px_rgba(203,213,225,0.15)]',
                            avatarBorder: 'from-slate-200 via-gray-300 to-slate-500',
                            badgeBg: 'bg-gradient-to-r from-slate-300 to-gray-400 text-black',
                            scoreBg: 'bg-slate-400/20 border-slate-400/40 text-slate-200',
                            icon: <FaMedal className="text-2xl text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.6)]" />,
                            height: 'md:h-[250px]',
                            scale: 'z-20'
                          }
                        : {
                            rankLabel: '3RD',
                            bg: 'bg-gradient-to-b from-[#2b1e17] via-[#19110d] to-[#0d0806]',
                            border: 'border-amber-700/40',
                            glow: 'shadow-[0_0_35px_rgba(217,119,6,0.15)]',
                            avatarBorder: 'from-amber-600 via-amber-700 to-amber-900',
                            badgeBg: 'bg-gradient-to-r from-amber-600 to-amber-800 text-white',
                            scoreBg: 'bg-amber-700/20 border-amber-600/40 text-amber-300',
                            icon: <FaMedal className="text-2xl text-amber-500 drop-shadow-[0_0_8px_rgba(217,119,6,0.6)]" />,
                            height: 'md:h-[230px]',
                            scale: 'z-10'
                          }

                      const chekiValue = fan.chekiCount !== undefined ? fan.chekiCount : (fan.points || 0)

                      return (
                        <motion.div
                          key={fan.name}
                          initial={{ opacity: 0, y: 40 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: podiumIndex * 0.1, duration: 0.5 }}
                          className={`relative flex flex-col items-center justify-between p-6 rounded-3xl border ${podiumConfig.bg} ${podiumConfig.border} ${podiumConfig.glow} ${podiumConfig.height} ${podiumConfig.scale} w-full md:w-64 transition-all duration-300 hover:-translate-y-1.5`}
                        >
                          {/* Metallic Header Icon */}
                          <div className="flex flex-col items-center">
                            <div className="mb-2">{podiumConfig.icon}</div>

                            {/* Profile Picture Avatar */}
                            <div className={`relative w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr ${podiumConfig.avatarBorder} shadow-lg mb-3`}>
                              <div className="w-full h-full rounded-full bg-background border border-black/50 flex items-center justify-center font-black text-base text-text-primary overflow-hidden">
                                {getInitials(fan.name)}
                              </div>
                              {/* Rank Badge Indicator */}
                              <div className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase shadow-md ${podiumConfig.badgeBg}`}>
                                {podiumConfig.rankLabel}
                              </div>
                            </div>

                            <h4 className="text-base font-black tracking-tight text-center text-text-primary line-clamp-1 w-full px-2">
                              {fan.name}
                            </h4>

                            {/* Only show member name badge if All Members tab is active */}
                            {isAllMembers && fan.memberName && (
                              <span className="text-[10px] font-bold text-accent uppercase tracking-wider bg-accent/10 border border-accent/20 px-2.5 py-0.5 rounded-full mt-1.5 block">
                                Top {fan.memberName}
                              </span>
                            )}
                          </div>

                          {/* Cheki Count Score Display */}
                          <div className={`mt-4 px-4 py-1.5 rounded-full border text-xs font-black tracking-wide flex items-center gap-1.5 shadow-inner backdrop-blur-md ${podiumConfig.scoreBg}`}>
                            <FaStar className="text-yellow-400" size={11} /> 
                            <span>{chekiValue} Cheki</span>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>

                {/* Ranking List Cards Container (Ranks 4-10 in Single Column with Backing Shape & Scroll) */}
                {leaderboard.length > 3 && (
                  <div className="bg-[#0e131f] border border-border rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4">
                    <h3 className="text-xs font-black tracking-[0.3em] uppercase text-text-secondary px-1">
                      Peringkat #4 - #{leaderboard.length}
                    </h3>

                    {/* Scrollable Single-Column List (Displays ranks 4 & 5 initially, scrollable for 6-10) */}
                    <div className="max-h-[195px] overflow-y-auto space-y-3 pr-1 scrollbar-none">
                      {leaderboard.slice(3).map((fan, idx) => {
                        const rankNum = idx + 4
                        const chekiVal = fan.chekiCount !== undefined ? fan.chekiCount : (fan.points || 0)

                        return (
                          <motion.div
                            key={fan.name}
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className="flex items-center justify-between p-4 rounded-2xl bg-[#161c2b] border border-border/70 hover:border-accent/50 hover:bg-[#1b2336] hover:-translate-y-0.5 transition-all duration-300 shadow-md group"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              {/* Rank Number Circular Badge */}
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-700/20 border border-amber-500/40 flex items-center justify-center text-xs font-black text-amber-400 shadow-sm flex-shrink-0">
                                #{rankNum}
                              </div>

                              {/* Fan Avatar Placeholder */}
                              <div className="w-10 h-10 rounded-full bg-background border border-border/80 flex items-center justify-center text-xs font-black text-text-secondary flex-shrink-0 shadow-inner group-hover:border-accent/40 transition-colors">
                                {getInitials(fan.name)}
                              </div>

                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-text-primary text-sm md:text-base tracking-tight truncate">
                                  {fan.name}
                                </span>
                                {/* Only show member name badge if All Members tab is active */}
                                {isAllMembers && fan.memberName && (
                                  <span className="text-[11px] font-bold text-accent tracking-wide truncate">
                                    Top Spender {fan.memberName}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Score Badge */}
                            <div className="flex items-center gap-1.5 text-xs font-black text-accent bg-accent/10 border border-accent/20 px-3.5 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 shadow-sm">
                              <FaStar size={11} className="text-yellow-400" />
                              <span>{chekiVal} Cheki</span>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

export default KSLeaderboard

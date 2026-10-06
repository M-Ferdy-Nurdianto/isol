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

// ── Podium configs (1st / 2nd / 3rd) — warm brown-harmonic palette ──────────
const PODIUM = [
  // index 0 = rank 1st (center, tallest)
  {
    rankLabel: '1ST',
    icon: <FaCrown className="text-2xl" style={{ color: '#F5C842', filter: 'drop-shadow(0 0 8px rgba(245,200,66,0.7))' }} />,
    avatarRing: 'from-yellow-300 via-amber-400 to-yellow-600',
    badgeText: 'text-amber-900',
    badgeBg: 'from-yellow-400 to-amber-500',
    scoreBg: 'bg-amber-500/15 border-amber-400/40 text-amber-300',
    cardBg: 'bg-[var(--surface)]',
    cardBorder: 'border-amber-400/50',
    cardGlow: 'shadow-[0_0_32px_rgba(245,158,11,0.2)]',
    offset: 'md:-translate-y-5',   // lifted
    zIndex: 'z-20',
  },
  // index 1 = rank 2nd (left)
  {
    rankLabel: '2ND',
    icon: <FaMedal className="text-xl" style={{ color: '#C0A882', filter: 'drop-shadow(0 0 6px rgba(192,168,130,0.5))' }} />,
    avatarRing: 'from-stone-300 via-amber-200 to-stone-400',
    badgeText: 'text-stone-900',
    badgeBg: 'from-stone-300 to-stone-400',
    scoreBg: 'bg-stone-400/15 border-stone-300/40 text-stone-300',
    cardBg: 'bg-[var(--surface)]',
    cardBorder: 'border-stone-400/30',
    cardGlow: 'shadow-[0_4px_20px_rgba(0,0,0,0.3)]',
    offset: '',
    zIndex: 'z-10',
  },
  // index 2 = rank 3rd (right)
  {
    rankLabel: '3RD',
    icon: <FaMedal className="text-xl" style={{ color: '#CD7F32', filter: 'drop-shadow(0 0 6px rgba(205,127,50,0.5))' }} />,
    avatarRing: 'from-amber-600 via-orange-700 to-amber-900',
    badgeText: 'text-amber-100',
    badgeBg: 'from-amber-700 to-orange-800',
    scoreBg: 'bg-amber-700/15 border-amber-600/40 text-amber-400',
    cardBg: 'bg-[var(--surface)]',
    cardBorder: 'border-amber-700/30',
    cardGlow: 'shadow-[0_4px_20px_rgba(0,0,0,0.3)]',
    offset: '',
    zIndex: 'z-10',
  },
]

// Render order: 2nd (left), 1st (centre), 3rd (right)
const RENDER_ORDER = [1, 0, 2]

const KSLeaderboard = ({ members = [] }) => {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('all')
  const [memberId, setMemberId] = useState('all')

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/leaderboard?period=${period}&member_id=${memberId}`)
      if (res.data.success) {
        const raw = res.data.data || []

        // Deduplicate: jika fan sama muncul > 1x, ambil entry chekiCount tertinggi
        const seen = new Map()
        raw.forEach(entry => {
          const key = (entry.name || '').trim().toUpperCase()
          const existing = seen.get(key)
          if (!existing || entry.chekiCount > existing.chekiCount) {
            seen.set(key, entry)
          }
        })

        const deduped = Array.from(seen.values())
          .sort((a, b) => b.chekiCount - a.chekiCount)
          .slice(0, 10)

        setLeaderboard(deduped)
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
  const top3 = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  return (
    <section className="py-20 px-4 bg-[var(--background)] relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[var(--primary)]/5 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] rounded-full bg-[var(--accent)]/5 blur-[120px] pointer-events-none" />

      <div className="container mx-auto max-w-4xl relative z-10">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-xs font-black tracking-[0.5em] text-[var(--accent)] uppercase mb-3 flex items-center justify-center gap-2">
            <FaTrophy /> Top Fans Ranking
          </p>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-[var(--text-primary)] uppercase">
            WALL OF <span className="text-[var(--accent)]">FAME</span>
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-4 max-w-lg mx-auto leading-relaxed">
            Terima kasih atas dukungan luar biasa kalian. Berikut adalah para penggemar paling berdedikasi!
          </p>
        </motion.div>

        {/* ── Filters ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row gap-5 items-center justify-center mb-12"
        >
          {/* Member filter */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-black tracking-widest text-[var(--text-secondary)] uppercase">Pilih Kategori:</span>
            <div className="flex flex-wrap justify-center bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1.5 gap-1 shadow-md max-w-sm md:max-w-none">
              <button
                type="button"
                onClick={() => setMemberId('all')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  isAllMembers
                    ? 'bg-[var(--accent)] text-white shadow-md'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
                }`}
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
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-[var(--accent)] text-white shadow-md'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
                    }`}
                  >
                    {m.nama_panggung}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Period filter */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-black tracking-widest text-[var(--text-secondary)] uppercase">Pilih Waktu:</span>
            <div className="flex flex-wrap justify-center bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1.5 gap-1 shadow-md">
              {[
                { id: 'all', label: 'All Time' },
                { id: 'tahun', label: 'Tahun Ini' },
                { id: 'bulan', label: 'Bulan Ini' },
                { id: 'minggu', label: 'Minggu Ini' },
              ].map(p => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    period === p.id
                      ? 'bg-[var(--primary)] text-white shadow-md'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
                  }`}
                >
                  <FaCalendarAlt size={10} /> {p.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Leaderboard Content ── */}
        <div className="relative min-h-[320px]">
          <AnimatePresence mode="wait">

            {/* Loading */}
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
              </motion.div>
            )}

            {/* Empty */}
            {!loading && leaderboard.length === 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-[var(--border)] rounded-3xl bg-[var(--surface)]"
              >
                <FaStar className="text-4xl text-[var(--border)] mb-4" />
                <p className="text-[var(--text-secondary)] font-bold">Belum ada data untuk periode/kategori ini.</p>
                <p className="text-xs text-[var(--text-secondary)]/60 mt-1">Jadilah yang pertama mendukung!</p>
              </motion.div>
            )}

            {/* Main list */}
            {!loading && leaderboard.length > 0 && (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col gap-6"
              >

                {/* ── PODIUM TOP 3 ── */}
                <div className="relative rounded-3xl bg-[var(--surface)] border border-[var(--primary)]/20 shadow-xl overflow-hidden p-6 sm:p-8">
                  {/* subtle top shine */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/40 to-transparent" />

                  <div className="flex items-end justify-center gap-3 sm:gap-5">
                    {RENDER_ORDER.map(rankIdx => {
                      const fan = top3[rankIdx]
                      const cfg = PODIUM[rankIdx]

                      // Placeholder card if not enough data
                      if (!fan) {
                        return (
                          <div
                            key={`placeholder-${rankIdx}`}
                            className={`flex flex-col items-center justify-between w-[28%] sm:w-48 min-h-[180px] sm:min-h-[210px] p-4 rounded-2xl border border-dashed border-[var(--border)] opacity-30 ${cfg.zIndex}`}
                          >
                            <div className="text-[var(--text-secondary)] text-xs font-bold mt-4">{cfg.rankLabel}</div>
                          </div>
                        )
                      }

                      const chekiValue = fan.chekiCount ?? fan.points ?? 0

                      return (
                        <motion.div
                          key={fan.name}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: rankIdx * 0.08, duration: 0.45 }}
                          className={`
                            flex flex-col items-center
                            w-[28%] sm:w-48
                            min-h-[180px] sm:min-h-[220px]
                            p-3 sm:p-5
                            rounded-2xl border
                            ${cfg.cardBg} ${cfg.cardBorder} ${cfg.cardGlow} ${cfg.offset} ${cfg.zIndex}
                            transition-transform duration-300 hover:-translate-y-1
                          `}
                        >
                          {/* Medal icon */}
                          <div className="mb-2 mt-1">{cfg.icon}</div>

                          {/* Avatar */}
                          <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2.5px] bg-gradient-to-tr ${cfg.avatarRing} shadow-md mb-2.5 shrink-0`}>
                            <div className="w-full h-full rounded-full bg-[var(--background)] flex items-center justify-center font-black text-sm sm:text-base text-[var(--text-primary)]">
                              {getInitials(fan.name)}
                            </div>
                            {/* Rank badge on avatar */}
                            <div className={`absolute -bottom-1 -right-1 bg-gradient-to-r ${cfg.badgeBg} ${cfg.badgeText} px-1.5 py-0.5 rounded-full text-[9px] font-black shadow-md`}>
                              {cfg.rankLabel}
                            </div>
                          </div>

                          {/* Name */}
                          <h4 className="text-xs sm:text-sm font-black text-[var(--text-primary)] text-center w-full truncate px-1 leading-tight">
                            {fan.name}
                          </h4>

                          {/* Favorite member badge (All Members mode) */}
                          {isAllMembers && fan.memberName && (
                            <span className="text-[9px] sm:text-[10px] font-bold text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-2 py-0.5 rounded-full mt-1 truncate max-w-full">
                              ♥ {fan.memberName}
                            </span>
                          )}

                          {/* Cheki score */}
                          <div className={`mt-auto pt-2 px-3 py-1 rounded-full border text-[10px] sm:text-xs font-black flex items-center gap-1 ${cfg.scoreBg}`}>
                            <FaStar size={9} className="text-yellow-400 shrink-0" />
                            <span>{chekiValue} Cheki</span>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>

                {/* ── LIST #4 – #10 ── */}
                {rest.length > 0 && (
                  <div className="rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="px-5 pt-5 pb-3">
                      <h3 className="text-[10px] font-black tracking-[0.3em] uppercase text-[var(--text-secondary)]">
                        Peringkat #4 – #{leaderboard.length}
                      </h3>
                    </div>

                    {/* Scrollable list — scrollbar hidden */}
                    <div className="relative px-4 pb-4">
                      <style>{`.ks-lb-scroll::-webkit-scrollbar { display: none; }`}</style>

                      <div
                        className="ks-lb-scroll space-y-2"
                        style={{ maxHeight: '260px', overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      >
                        {rest.map((fan, idx) => {
                          const rankNum = idx + 4
                          const chekiVal = fan.chekiCount ?? fan.points ?? 0

                          return (
                            <motion.div
                              key={fan.name}
                              initial={{ opacity: 0, x: -12 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.04 }}
                              className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5 hover:-translate-y-px transition-all duration-200"
                            >
                              {/* Rank badge */}
                              <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/30 flex items-center justify-center text-[11px] font-black text-[var(--primary)] shrink-0">
                                #{rankNum}
                              </div>

                              {/* Avatar */}
                              <div className="w-9 h-9 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-xs font-black text-[var(--text-secondary)] shrink-0">
                                {getInitials(fan.name)}
                              </div>

                              {/* Name + optional member */}
                              <div className="flex-1 min-w-0">
                                <span className="font-bold text-[var(--text-primary)] text-sm truncate block leading-tight">
                                  {fan.name}
                                </span>
                                {isAllMembers && fan.memberName && (
                                  <span className="text-[10px] font-semibold text-[var(--accent)] truncate block">
                                    ♥ {fan.memberName}
                                  </span>
                                )}
                              </div>

                              {/* Cheki badge */}
                              <div className="flex items-center gap-1.5 text-xs font-black text-[var(--primary)] bg-[var(--primary)]/10 border border-[var(--primary)]/25 px-3 py-1.5 rounded-full whitespace-nowrap shrink-0">
                                <FaStar size={10} className="text-yellow-400" />
                                <span>{chekiVal} Cheki</span>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>

                      {/* Bottom fade hint */}
                      {rest.length > 3 && (
                        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[var(--surface)] to-transparent pointer-events-none rounded-b-3xl" />
                      )}
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

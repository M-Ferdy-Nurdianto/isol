import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FaCrown, FaMedal, FaStar, FaTrophy, FaCalendarAlt, FaUserFriends, FaHeart } from 'react-icons/fa'
import api from '../../lib/api'

const getInitials = (name) => {
  if (!name) return 'FK'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

// ── Podium configs (1st / 2nd / 3rd) — solid metal palette ──────────
const PODIUM = [
  // index 0 = rank 1st (center, tallest)
  {
    rankLabel: '1ST',
    icon: <FaCrown className="text-2xl" style={{ color: '#F5C842', filter: 'drop-shadow(0 0 8px rgba(245,200,66,0.7))' }} />,
    avatarRing: 'border-2 border-amber-400 bg-amber-400/20',
    badgeText: 'text-amber-900',
    badgeBg: 'bg-amber-400',
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
    avatarRing: 'border-2 border-stone-300 bg-stone-300/20',
    badgeText: 'text-stone-900',
    badgeBg: 'bg-stone-300',
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
    avatarRing: 'border-2 border-amber-600 bg-amber-600/20',
    badgeText: 'text-amber-100',
    badgeBg: 'bg-amber-700',
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
    <section className="py-10 sm:py-20 px-4 bg-[var(--background)] bg-pattern-cross relative overflow-hidden">
      <div className="container mx-auto max-w-4xl relative z-10">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6 sm:mb-10"
        >
          <p className="text-[10px] sm:text-xs font-black tracking-[0.4em] text-[var(--accent)] uppercase mb-2 flex items-center justify-center gap-1.5">
            <FaTrophy /> Top Fans Ranking
          </p>
          <h2 className="text-2xl sm:text-5xl font-black tracking-tight text-[var(--text-primary)] uppercase">
            WALL OF <span className="text-[var(--accent)]">FAME</span>
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2 sm:mt-3 max-w-lg mx-auto leading-relaxed px-2">
            Terima kasih atas dukungan luar biasa kalian. Berikut adalah para penggemar paling berdedikasi!
          </p>
        </motion.div>

        {/* ── Filters Hub ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="w-full max-w-2xl mx-auto mb-6 sm:mb-10"
        >
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-2.5 sm:p-3 shadow-xl flex flex-col gap-2.5">
            {/* Category / Member Filter */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide justify-start sm:justify-center">
              <button
                type="button"
                onClick={() => setMemberId('all')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shrink-0 ${isAllMembers
                    ? 'bg-[var(--accent)] text-white shadow-md'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                  }`}
              >
                <FaUserFriends className="text-xs" />
                <span>All Members</span>
              </button>

              {members.filter(m => !m.is_secret).map(m => {
                const idVal = m.id || m.member_id
                const isSelected = memberId === idVal
                const mKey = (m.member_id || m.nama_panggung || '').toLowerCase()
                const dotColor = m.color || '#E8944A'

                return (
                  <button
                    type="button"
                    key={idVal}
                    onClick={() => setMemberId(idVal)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shrink-0 ${isSelected
                        ? 'bg-white/10 text-white border border-white/25 shadow-md'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 border border-transparent'
                      }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: dotColor, boxShadow: isSelected ? `0 0 8px ${dotColor}` : 'none' }}
                    />
                    <span>{m.nama_panggung}</span>
                  </button>
                )
              })}
            </div>

            {/* Divider */}
            <div className="h-px bg-[var(--border)] w-full opacity-60" />

            {/* Period Filter */}
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pt-0.5 sm:pt-0 scrollbar-hide justify-start sm:justify-center">
              {[
                { id: 'all', label: 'All Time' },
                { id: 'tahun', label: 'Tahun Ini' },
                { id: 'bulan', label: 'Bulan Ini' },
                { id: 'minggu', label: 'Minggu Ini' },
              ].map(p => {
                const isPeriodActive = period === p.id
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setPeriod(p.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0 ${isPeriodActive
                        ? 'bg-[var(--primary)] text-white shadow-md'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                      }`}
                  >
                    <FaCalendarAlt size={10} className={isPeriodActive ? 'text-white' : 'text-[var(--text-secondary)]'} />
                    <span>{p.label}</span>
                  </button>
                )
              })}
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

            {/* Empty State */}
            {!loading && leaderboard.length === 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3 }}
                className="relative flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xl overflow-hidden"
              >
                {/* Floating Trophy Emblem */}
                <div className="relative inline-flex items-center justify-center mb-5">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center shadow-[0_0_24px_rgba(245,158,11,0.15)]">
                    <FaTrophy className="text-3xl sm:text-4xl text-amber-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[10px] font-black uppercase tracking-wider shadow-md">
                    #1
                  </div>
                </div>

                {/* Status Pill */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
                  <FaCrown size={12} className="text-amber-400" />
                  <span>Tahta Supporter Masih Terbuka</span>
                </div>

                {/* Heading */}
                <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight mb-2">
                  Jadilah Fan Nomor 1 di Sini!
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed mb-6">
                  Belum ada catatan supporter untuk kategori dan periode ini. Ambil tahta pertamamu dan ukir namamu di puncak Wall of Fame Kohi Sekai!
                </p>

                {/* Direct CTA */}
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-[var(--primary)]/25 transition-all hover:scale-105 active:scale-95"
                >
                  <FaHeart className="text-sm" />
                  <span>Dukung & Pesan Cheki Sekarang</span>
                </Link>

                {/* Micro Perks / Incentives */}
                <div className="mt-8 pt-6 border-t border-[var(--border)] w-full max-w-lg flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[11px] font-bold text-[var(--text-secondary)]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                    <span>Peringkat Realtime</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                    <span>Digital Receipt Eksklusif</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                    <span>Apresiasi Resmi Member</span>
                  </div>
                </div>
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
                <div className="relative rounded-2xl sm:rounded-3xl bg-[var(--surface)] border border-[var(--primary)]/20 shadow-xl overflow-hidden p-3 sm:p-8">
                  {/* subtle top line */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-[var(--primary)]/30" />

                  <div className="flex items-end justify-center gap-2 sm:gap-5">
                    {RENDER_ORDER.map(rankIdx => {
                      const fan = top3[rankIdx]
                      const cfg = PODIUM[rankIdx]

                      // Placeholder card if not enough data
                      if (!fan) {
                        return (
                          <div
                            key={`placeholder-${rankIdx}`}
                            className={`flex flex-col items-center justify-between w-[31%] sm:w-48 min-h-[160px] sm:min-h-[210px] p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-dashed border-[var(--border)] opacity-30 ${cfg.zIndex}`}
                          >
                            <div className="text-[var(--text-secondary)] text-[10px] sm:text-xs font-bold mt-4">{cfg.rankLabel}</div>
                          </div>
                        )
                      }

                      const chekiValue = fan.chekiCount ?? fan.points ?? 0

                      return (
                        <motion.div
                          key={fan.name}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: rankIdx * 0.08, duration: 0.4 }}
                          className={`
                            flex flex-col items-center
                            w-[31%] sm:w-48
                            min-h-[160px] sm:min-h-[220px]
                            p-2 sm:p-5
                            rounded-xl sm:rounded-2xl border
                            ${cfg.cardBg} ${cfg.cardBorder} ${cfg.cardGlow} ${cfg.offset} ${cfg.zIndex}
                            transition-transform duration-300 hover:-translate-y-1
                          `}
                        >
                          {/* Medal icon */}
                          <div className="mb-1.5 sm:mb-2 mt-0.5 sm:mt-1 scale-90 sm:scale-100">{cfg.icon}</div>

                          {/* Avatar */}
                          <div className={`relative w-11 h-11 sm:w-16 sm:h-16 rounded-full p-[2px] ${cfg.avatarRing} shadow-md mb-2 shrink-0`}>
                            <div className="w-full h-full rounded-full bg-[var(--background)] flex items-center justify-center font-black text-xs sm:text-base text-[var(--text-primary)]">
                              {getInitials(fan.name)}
                            </div>
                            {/* Rank badge on avatar */}
                            <div className={`absolute -bottom-1 -right-1 ${cfg.badgeBg} ${cfg.badgeText} px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-black shadow-md`}>
                              {cfg.rankLabel}
                            </div>
                          </div>

                          {/* Name */}
                          <h4 className="text-[10px] sm:text-sm font-black text-[var(--text-primary)] text-center w-full truncate px-0.5 leading-tight">
                            {fan.name}
                          </h4>

                          {/* Favorite member badge (All Members mode) */}
                          {isAllMembers && fan.memberName && (
                            <span className="text-[8px] sm:text-[10px] font-bold text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-1.5 py-0.5 rounded-full mt-1 truncate max-w-full inline-flex items-center gap-1">
                              <FaHeart className="text-[7px]" /> {fan.memberName}
                            </span>
                          )}

                          {/* Cheki score */}
                          <div className={`mt-auto pt-1.5 sm:pt-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border text-[9px] sm:text-xs font-black flex items-center gap-1 ${cfg.scoreBg}`}>
                            <FaStar size={8} className="text-yellow-400 shrink-0" />
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
                                  <span className="text-[10px] font-semibold text-[var(--accent)] truncate flex items-center gap-1">
                                    <FaHeart className="text-[7px]" /> {fan.memberName}
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

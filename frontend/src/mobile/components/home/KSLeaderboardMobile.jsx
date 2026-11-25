import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FaCrown, FaMedal, FaStar, FaTrophy, FaCalendarAlt, FaUserFriends, FaHeart } from 'react-icons/fa'
import api from '../../../lib/api'

const getInitials = (name) => {
  if (!name) return 'FK'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

// ── Podium configs (1st / 2nd / 3rd) — Deep Coffee Theme ──────────
const PODIUM = [
  // index 0 = rank 1st (center, tallest)
  {
    rankLabel: '1ST',
    icon: <FaCrown className="text-xl" style={{ color: '#F5C842', filter: 'drop-shadow(0 0 8px rgba(245,200,66,0.7))' }} />,
    avatarRing: 'border-2 border-amber-400 bg-amber-400/20',
    badgeText: 'text-amber-950',
    badgeBg: 'bg-amber-400',
    scoreBg: 'bg-amber-500/15 border-amber-400/40 text-amber-300',
    cardBg: 'bg-[var(--surface)]',
    cardBorder: 'border-amber-400/50',
    cardGlow: 'shadow-[0_0_24px_rgba(245,158,11,0.2)]',
    offset: '-translate-y-2.5',
    zIndex: 'z-20',
    minHeight: 'min-h-[220px]',
  },
  // index 1 = rank 2nd (left)
  {
    rankLabel: '2ND',
    icon: <FaMedal className="text-lg" style={{ color: '#C0A882', filter: 'drop-shadow(0 0 6px rgba(192,168,130,0.5))' }} />,
    avatarRing: 'border-2 border-stone-300 bg-stone-300/20',
    badgeText: 'text-stone-900',
    badgeBg: 'bg-stone-300',
    scoreBg: 'bg-stone-400/15 border-stone-300/40 text-stone-300',
    cardBg: 'bg-[var(--surface)]',
    cardBorder: 'border-stone-400/30',
    cardGlow: 'shadow-[0_4px_16px_rgba(0,0,0,0.3)]',
    offset: '',
    zIndex: 'z-10',
    minHeight: 'min-h-[195px]',
  },
  // index 2 = rank 3rd (right)
  {
    rankLabel: '3RD',
    icon: <FaMedal className="text-lg" style={{ color: '#CD7F32', filter: 'drop-shadow(0 0 6px rgba(205,127,50,0.5))' }} />,
    avatarRing: 'border-2 border-amber-600 bg-amber-600/20',
    badgeText: 'text-amber-100',
    badgeBg: 'bg-amber-700',
    scoreBg: 'bg-amber-700/15 border-amber-600/40 text-amber-400',
    cardBg: 'bg-[var(--surface)]',
    cardBorder: 'border-amber-700/30',
    cardGlow: 'shadow-[0_4px_16px_rgba(0,0,0,0.3)]',
    offset: '',
    zIndex: 'z-10',
    minHeight: 'min-h-[195px]',
  },
]

// Render order: 2nd (left), 1st (centre), 3rd (right)
const RENDER_ORDER = [1, 0, 2]

const KSLeaderboardMobile = ({ members = [] }) => {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('all')
  const [memberId, setMemberId] = useState('all')

  const activeMemberRef = useRef(null)
  const activePeriodRef = useRef(null)
  const memberScrollRef = useRef(null)
  const periodScrollRef = useRef(null)
  const isFirstMemberRender = useRef(true)
  const isFirstPeriodRender = useRef(true)

  const scrollActiveIntoContainer = (container, activeEl) => {
    if (!container || !activeEl) return
    const containerRect = container.getBoundingClientRect()
    const activeRect = activeEl.getBoundingClientRect()
    const diff = activeRect.left - containerRect.left - (containerRect.width / 2) + (activeRect.width / 2)
    container.scrollBy({
      left: diff,
      behavior: 'smooth'
    })
  }

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/leaderboard?period=${period}&member_id=${memberId}`)
      if (res.data?.success) {
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

  // Auto-scroll active tab into center view smoothly (only container scroll, never page scroll, skipped on mount)
  useEffect(() => {
    if (isFirstMemberRender.current) {
      isFirstMemberRender.current = false
      return
    }
    if (memberScrollRef.current && activeMemberRef.current) {
      scrollActiveIntoContainer(memberScrollRef.current, activeMemberRef.current)
    }
  }, [memberId])

  useEffect(() => {
    if (isFirstPeriodRender.current) {
      isFirstPeriodRender.current = false
      return
    }
    if (periodScrollRef.current && activePeriodRef.current) {
      scrollActiveIntoContainer(periodScrollRef.current, activePeriodRef.current)
    }
  }, [period])

  const isAllMembers = !memberId || memberId === 'all'
  const top3 = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  return (
    <section className="w-full box-border py-10 px-4 bg-[var(--background)] bg-pattern-cross relative overflow-hidden">
      <div className="w-full max-w-[420px] mx-auto relative z-10 box-border">

        {/* ── Header (Wall of Fame / Top Fans Ranking) ── */}
        <div className="text-center mb-6">
          <p className="text-[10px] font-black tracking-[0.35em] text-[var(--accent)] uppercase mb-1.5 flex items-center justify-center gap-1.5 font-mono">
            <FaTrophy /> Top Fans Ranking
          </p>
          <h2 
            style={{ fontSize: 'clamp(1.75rem, 7.5vw, 2.25rem)' }}
            className="font-black tracking-tight text-[var(--text-primary)] uppercase leading-none"
          >
            WALL OF <span className="text-[var(--accent)]">FAME</span>
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-2.5 max-w-[32ch] mx-auto leading-relaxed text-balance">
            Terima kasih atas dukungan luar biasa kalian. Berikut adalah para penggemar paling berdedikasi!
          </p>
        </div>

        {/* ── Filters Hub (Two-Row Horizontal Scroll with Edge Indicators) ── */}
        <div className="w-full mb-6">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-2.5 shadow-xl flex flex-col gap-2 relative">
            
            {/* ROW 1: Category / Member Filter (No color dots, text-only, purple active pill) */}
            <div className="relative w-full overflow-hidden">
              {/* Subtle edge fade indicators */}
              <div 
                className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 z-10"
                style={{ background: 'linear-gradient(to right, var(--surface), transparent)' }}
                aria-hidden="true"
              />
              <div 
                className="pointer-events-none absolute right-0 top-0 bottom-0 w-4 z-10"
                style={{ background: 'linear-gradient(to left, var(--surface), transparent)' }}
                aria-hidden="true"
              />

              <div 
                ref={memberScrollRef}
                className="flex items-center gap-1.5 overflow-x-auto scroll-smooth py-0.5 px-1 hide-scrollbar"
                style={{ 
                  scrollSnapType: 'x proximity', 
                  scrollbarWidth: 'none', 
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {/* All Members Button */}
                <button
                  type="button"
                  ref={isAllMembers ? activeMemberRef : null}
                  onClick={() => setMemberId('all')}
                  className={`min-h-[40px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 snap-center transition-all ${
                    isAllMembers
                      ? 'bg-[var(--accent)] text-white shadow-md'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                  }`}
                >
                  <FaUserFriends className="text-xs shrink-0" />
                  <span>All Members</span>
                </button>

                {/* Member Specific Buttons - DOT REMOVED per instruction A */}
                {members.map(m => {
                  const idVal = m.id || m.member_id
                  const isSelected = memberId === idVal

                  return (
                    <button
                      type="button"
                      key={idVal}
                      ref={isSelected ? activeMemberRef : null}
                      onClick={() => setMemberId(idVal)}
                      className={`min-h-[40px] flex items-center px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 snap-center transition-all ${
                        isSelected
                          ? 'bg-[var(--accent)] text-white shadow-md'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                      }`}
                    >
                      <span>{m.nama_panggung}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-[var(--border)] w-full opacity-60" />

            {/* ROW 2: Period Filter (Horizontal scroll, orange active pill) */}
            <div className="relative w-full overflow-hidden">
              {/* Subtle edge fade indicators */}
              <div 
                className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 z-10"
                style={{ background: 'linear-gradient(to right, var(--surface), transparent)' }}
                aria-hidden="true"
              />
              <div 
                className="pointer-events-none absolute right-0 top-0 bottom-0 w-4 z-10"
                style={{ background: 'linear-gradient(to left, var(--surface), transparent)' }}
                aria-hidden="true"
              />

              <div 
                ref={periodScrollRef}
                className="flex items-center gap-1.5 overflow-x-auto scroll-smooth py-0.5 px-1 hide-scrollbar"
                style={{ 
                  scrollSnapType: 'x proximity', 
                  scrollbarWidth: 'none', 
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
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
                      ref={isPeriodActive ? activePeriodRef : null}
                      onClick={() => setPeriod(p.id)}
                      className={`min-h-[40px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 snap-center transition-all ${
                        isPeriodActive
                          ? 'bg-[var(--primary)] text-white shadow-md'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                      }`}
                    >
                      <FaCalendarAlt size={11} className={isPeriodActive ? 'text-white' : 'text-[var(--text-secondary)]'} />
                      <span>{p.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

          </div>
        </div>

        {/* ── Leaderboard Content ── */}
        <div className="relative min-h-[300px] w-full">
          <AnimatePresence mode="wait">

            {/* Loading */}
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-16 flex items-center justify-center w-full"
              >
                <div className="w-9 h-9 border-3 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
              </motion.div>
            )}

            {/* Empty State */}
            {!loading && leaderboard.length === 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xl w-full box-border"
              >
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
                  <FaTrophy className="text-2xl text-amber-400" />
                </div>
                <h3 className="text-base font-black text-[var(--text-primary)] uppercase tracking-tight mb-1.5">
                  Jadilah Fan Nomor 1 di Sini!
                </h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-[28ch] mx-auto leading-relaxed mb-5">
                  Belum ada catatan supporter untuk kategori dan periode ini.
                </p>
                <Link
                  to="/shop"
                  className="w-full max-w-[280px] min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[var(--primary)] text-white font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-transform"
                >
                  <FaHeart className="text-xs" />
                  <span>Dukung Sekarang</span>
                </Link>
              </motion.div>
            )}

            {/* Main List & Podium */}
            {!loading && leaderboard.length > 0 && (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-4 w-full"
              >

                {/* ── PODIUM TOP 3 ── */}
                <div className="relative rounded-2xl bg-[var(--surface)] border border-[var(--primary)]/20 shadow-xl overflow-hidden p-2.5 sm:p-4 w-full box-border">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-[var(--primary)]/30" />

                  <div className="flex items-end justify-center gap-1.5 sm:gap-2.5 w-full box-border">
                    {RENDER_ORDER.map(rankIdx => {
                      const fan = top3[rankIdx]
                      const cfg = PODIUM[rankIdx]

                      if (!fan) {
                        return (
                          <div
                            key={`placeholder-${rankIdx}`}
                            className={`flex-1 min-w-0 flex flex-col items-center justify-between p-2 rounded-xl border border-dashed border-[var(--border)] opacity-30 ${cfg.minHeight} ${cfg.zIndex}`}
                          >
                            <div className="text-[var(--text-secondary)] text-[10px] font-bold mt-4">{cfg.rankLabel}</div>
                          </div>
                        )
                      }

                      const chekiValue = fan.chekiCount ?? fan.points ?? 0
                      // Clean favorite member name (e.g. "Kohi Macchiato" -> "Macchiato" or keep as is)
                      const displayMember = (fan.memberName || '').replace(/^Kohi\s+/i, '')

                      return (
                        <div
                          key={fan.name}
                          className={`
                            flex-1 min-w-0
                            flex flex-col items-center justify-between
                            ${cfg.minHeight}
                            p-1.5 sm:p-2.5
                            rounded-xl sm:rounded-2xl border
                            ${cfg.cardBg} ${cfg.cardBorder} ${cfg.cardGlow} ${cfg.offset} ${cfg.zIndex}
                            box-border
                          `}
                        >
                          {/* Top: Medal/Crown Icon */}
                          <div className="mb-1 mt-0.5">{cfg.icon}</div>

                          {/* Middle: Avatar + Rank Badge */}
                          <div className={`relative w-11 h-11 rounded-full p-[2px] ${cfg.avatarRing} shadow-md mb-1.5 shrink-0`}>
                            <div className="w-full h-full rounded-full bg-[var(--background)] flex items-center justify-center font-black text-xs text-[var(--text-primary)]">
                              {getInitials(fan.name)}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 ${cfg.badgeBg} ${cfg.badgeText} px-1.5 py-0.5 rounded-full text-[8px] font-black shadow-md leading-none`}>
                              {cfg.rankLabel}
                            </div>
                          </div>

                          {/* Fan Name: Max 2 lines with line-clamp-2, font min 12px */}
                          <h4 
                            title={fan.name}
                            className="text-xs font-black text-[var(--text-primary)] text-center w-full line-clamp-2 leading-tight px-0.5 min-h-[2rem] flex items-center justify-center"
                          >
                            {fan.name}
                          </h4>

                          {/* Favorite member badge: Legible font min 11px */}
                          {isAllMembers && fan.memberName && (
                            <span 
                              title={fan.memberName}
                              className="text-[11px] font-bold text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-1.5 py-0.5 rounded-full mt-0.5 truncate max-w-full inline-flex items-center gap-1"
                            >
                              <FaHeart className="text-[8px] shrink-0" />
                              <span className="truncate">{displayMember}</span>
                            </span>
                          )}

                          {/* Cheki Score: Font 11px-12px, single line whitespace-nowrap, clearly legible */}
                          <div className={`mt-auto pt-0.5 pb-0.5 px-1.5 sm:px-2 rounded-full border text-[11px] sm:text-xs font-black flex items-center justify-center gap-1 shrink-0 whitespace-nowrap ${cfg.scoreBg}`}>
                            <FaStar size={8} className="text-yellow-400 shrink-0" />
                            <span>{chekiValue} Cheki</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* ── LIST #4 – #10 ── */}
                {rest.length > 0 && (
                  <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xl overflow-hidden w-full box-border">
                    {/* Header */}
                    <div className="px-4 pt-3.5 pb-2 border-b border-[var(--border)]/40 flex items-center justify-between">
                      <h3 className="text-[10px] font-black tracking-[0.25em] uppercase text-[var(--text-secondary)]">
                        Peringkat #4 – #{leaderboard.length}
                      </h3>
                      <span className="text-[10px] font-bold text-[var(--text-secondary)]/60">
                        Top Supporters
                      </span>
                    </div>

                    {/* List Items - Each min-h-[56px], flexible name column line-clamp-2 */}
                    <div className="p-3 flex flex-col gap-2">
                      {rest.map((fan, idx) => {
                        const rankNum = idx + 4
                        const chekiVal = fan.chekiCount ?? fan.points ?? 0

                        return (
                          <div
                            key={fan.name}
                            className="w-full min-h-[56px] flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] box-border"
                          >
                            {/* 1. Rank Badge */}
                            <div className="w-7 h-7 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/30 flex items-center justify-center text-xs font-black text-[var(--primary)] shrink-0">
                              #{rankNum}
                            </div>

                            {/* 2. Avatar Inisial */}
                            <div className="w-8 h-8 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-xs font-black text-[var(--text-secondary)] shrink-0">
                              {getInitials(fan.name)}
                            </div>

                            {/* 3. Kolom Nama + Badge Member (min-width: 0, flex: 1, line-clamp-2) */}
                            <div className="flex-1 min-w-0 pr-1">
                              <span 
                                title={fan.name}
                                className="font-bold text-[var(--text-primary)] text-xs sm:text-sm line-clamp-2 leading-snug block"
                              >
                                {fan.name}
                              </span>
                              {isAllMembers && fan.memberName && (
                                <span className="text-[11px] font-semibold text-[var(--accent)] truncate flex items-center gap-1 mt-0.5">
                                  <FaHeart className="text-[8px] shrink-0" />
                                  <span className="truncate">{fan.memberName}</span>
                                </span>
                              )}
                            </div>

                            {/* 4. Badge Cheki (Fixed width / shrink-0) */}
                            <div className="flex items-center gap-1 text-xs font-black text-[var(--primary)] bg-[var(--primary)]/10 border border-[var(--primary)]/25 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">
                              <FaStar size={10} className="text-yellow-400 shrink-0" />
                              <span>{chekiVal} Cheki</span>
                            </div>
                          </div>
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

export default KSLeaderboardMobile

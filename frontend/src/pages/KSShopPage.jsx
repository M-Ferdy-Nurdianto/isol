import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaMapMarkerAlt,
  FaClock,
  FaCamera,
  FaTicketAlt,
  FaUsers,
  FaStar,
  FaArrowRight,
  FaCheckCircle,
  FaUserCheck,
  FaInfoCircle
} from 'react-icons/fa'
import { kohiToast } from '../components/ui/KohiToast'
import KSHeader from '../components/KSHeader'
import KSFooter from '../components/KSFooter'
import FanAuthModal from '../components/auth/FanAuthModal'
import FanOrderHistoryModal from '../components/auth/FanOrderHistoryModal'
import { useFanAuth } from '../context/FanAuthContext'
import api from '../lib/api'
import { getAssetPath } from '../lib/pathUtils'

const INDO_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

const KSShopPage = () => {
  const navigate = useNavigate()
  const { fanUser, isLoggedIn, openAuthModal } = useFanAuth()

  // Data states
  const [events, setEvents] = useState([])
  const [members, setMembers] = useState([])
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  // Calendar states
  const today = useMemo(() => new Date(), [])
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonthIndex, setCurrentMonthIndex] = useState(today.getMonth()) // 0 - 11
  const [selectedDateKey, setSelectedDateKey] = useState(null) // 'YYYY-MM-DD'
  const [selectedEventId, setSelectedEventId] = useState(null)

  const handleScrollToCalendar = () => {
    kohiToast.info('Silakan pilih tanggal & event pada kalender di bawah untuk memesan tiket cheki.')
    const el = document.getElementById('monthly-calendar') || document.getElementById('event-detail')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const handleBookCurrentEvent = (type = 'member', member = null) => {
    if (!currentEvent) {
      handleScrollToCalendar()
      return
    }

    const executeCheckout = () => {
      let priceId = null
      let priceVal = null

      if (type === 'group' && groupChekiPriceObj) {
        priceId = groupChekiPriceObj.id
        priceVal = groupChekiPriceObj.price
      } else if (type === 'member' && member) {
        const memPrice = getMemberChekiPrice(member)
        if (memPrice) {
          priceId = memPrice.id
          priceVal = memPrice.price
        }
      }

      const params = {
        type,
        ...(member ? { memberId: member.id || member.member_id, memberName: member.nama_panggung } : {}),
        ...(priceId ? { priceId } : {}),
        ...(priceVal ? { price: priceVal } : {})
      }

      const query = new URLSearchParams(params).toString()
      navigate(`/checkout/${currentEvent.id}?${query}`)
    }

    if (!isLoggedIn) {
      openAuthModal(() => {
        executeCheckout()
      })
    } else {
      executeCheckout()
    }
  }


  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, membersRes, configRes] = await Promise.allSettled([
          api.get('/events'),
          api.get('/members'),
          api.get('/config'),
        ])

        let fetchedEvents = []
        if (eventsRes.status === 'fulfilled' && eventsRes.value.data?.success) {
          fetchedEvents = eventsRes.value.data.data || []
        }

        let fetchedMembers = []
        let groupObj = null
        if (membersRes.status === 'fulfilled' && membersRes.value.data?.success) {
          const rawMembers = membersRes.value.data.data || []
          groupObj = rawMembers.find(m => m.member_id === 'group')
          fetchedMembers = rawMembers.filter(m => m.member_id !== 'group')
        }

        if (configRes.status === 'fulfilled' && configRes.value.data?.success) {
          setConfig(configRes.value.data.data)
        }

        // Fallback dummy events if database is empty so calendar looks rich and interactive
        if (fetchedEvents.length === 0) {
          fetchedEvents = [
            {
              id: 'ev-oct-15',
              nama: 'Kohi Stage Vol. 1: First Brew',
              tanggal: 15,
              bulan: 'Oktober',
              tahun: 2026,
              lokasi: 'Grand Ballroom Jakarta, Kuningan',
              event_time: '14:00 - 19:00 WIB',
              cheki_time: '16:30 - 18:30 WIB',
              is_special: true,
              theme_name: 'First Brew Debut',
              theme_color: 'var(--primary)',
              deskripsi: 'Penampilan debut panggung perdana Kohi Sekai membawakan single orisinal dan sesi Cheki eksklusif bersama fans.',
              event_lineup: []
            },
            {
              id: 'ev-nov-05',
              nama: 'Kohi Acoustic Afternoon',
              tanggal: 5,
              bulan: 'November',
              tahun: 2026,
              lokasi: 'Kohi Cafe & Studio Bandung',
              event_time: '15:00 - 18:00 WIB',
              cheki_time: '16:00 - 17:30 WIB',
              is_special: false,
              theme_name: 'Acoustic Warmth',
              theme_color: 'var(--accent)',
              deskripsi: 'Sesi santai akustik intim dengan aroma kopi hangat dan interaksi dekat bersama semua member Kohi Sekai.',
              event_lineup: []
            },
            {
              id: 'ev-nov-22',
              nama: 'Kohi Sunday Festival 2026',
              tanggal: 22,
              bulan: 'November',
              tahun: 2026,
              lokasi: 'Senayan Park, Jakarta Pusat',
              event_time: '13:00 - 21:00 WIB',
              cheki_time: '15:30 - 19:00 WIB',
              is_special: true,
              theme_name: 'Sunday Kawaii Metal',
              theme_color: 'var(--primary)',
              deskripsi: 'Panggung akbar festival idol dengan lighting megah, merchandise eksklusif, dan sesi 2-Shot Cheki seharian penuh.',
              event_lineup: []
            }
          ]
        }

        setEvents(fetchedEvents)
        setMembers(fetchedMembers)
        if (groupObj) setConfig(prev => ({ ...prev, _groupMember: groupObj }))


        // Select nearest upcoming event by default
        const now = new Date()
        now.setHours(0, 0, 0, 0)

        const sortedUpcoming = [...fetchedEvents]
          .filter(e => {
            const mIdx = INDO_MONTHS.indexOf(e.bulan)
            const d = new Date(e.tahun, mIdx >= 0 ? mIdx : 0, e.tanggal)
            return d >= now
          })
          .sort((a, b) => {
            const ma = INDO_MONTHS.indexOf(a.bulan)
            const mb = INDO_MONTHS.indexOf(b.bulan)
            return new Date(a.tahun, ma, a.tanggal) - new Date(b.tahun, mb, b.tanggal)
          })

        const defaultEvent = sortedUpcoming[0] || fetchedEvents[0]
        if (defaultEvent) {
          const mIdx = INDO_MONTHS.indexOf(defaultEvent.bulan)
          const monthNum = mIdx >= 0 ? mIdx : 0
          setCurrentYear(defaultEvent.tahun)
          setCurrentMonthIndex(monthNum)
          setSelectedDateKey(`${defaultEvent.tahun}-${String(monthNum + 1).padStart(2, '0')}-${String(defaultEvent.tanggal).padStart(2, '0')}`)
          setSelectedEventId(defaultEvent.id)
        }
      } catch (err) {
        console.error('Error fetching shop data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Map events to date keys ('YYYY-MM-DD')
  const eventsByDateKey = useMemo(() => {
    const map = {}
    events.forEach(e => {
      let mIdx = INDO_MONTHS.indexOf(e.bulan)
      if (mIdx === -1) {
        // Try parsing month index if numeric
        const parsed = parseInt(e.bulan, 10)
        mIdx = !isNaN(parsed) && parsed >= 1 && parsed <= 12 ? parsed - 1 : 0
      }
      const key = `${e.tahun}-${String(mIdx + 1).padStart(2, '0')}-${String(e.tanggal).padStart(2, '0')}`
      if (!map[key]) map[key] = []
      map[key].push(e)
    })
    return map
  }, [events])

  // Calendar calculations for currentMonthIndex and currentYear
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonthIndex, 1).getDay() // 0 (Sun) - 6 (Sat)
    const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate()

    const days = []
    // Previous month padding
    const prevMonthDays = new Date(currentYear, currentMonthIndex, 0).getDate()
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: prevMonthDays - i,
        month: currentMonthIndex - 1,
        year: currentMonthIndex === 0 ? currentYear - 1 : currentYear,
        isCurrentMonth: false,
      })
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        date: d,
        month: currentMonthIndex,
        year: currentYear,
        isCurrentMonth: true,
      })
    }

    // Next month padding to complete grid of rows
    const totalCells = Math.ceil(days.length / 7) * 7
    const remaining = totalCells - days.length
    for (let n = 1; n <= remaining; n++) {
      days.push({
        date: n,
        month: currentMonthIndex + 1,
        year: currentMonthIndex === 11 ? currentYear + 1 : currentYear,
        isCurrentMonth: false,
      })
    }

    return days
  }, [currentYear, currentMonthIndex])

  // Current active event
  const currentEvent = useMemo(() => {
    if (selectedEventId) {
      const found = events.find(e => String(e.id) === String(selectedEventId))
      if (found) return found
    }
    if (selectedDateKey && eventsByDateKey[selectedDateKey]?.length > 0) {
      return eventsByDateKey[selectedDateKey][0]
    }
    return events[0] || null
  }, [selectedEventId, selectedDateKey, events, eventsByDateKey])

  // Events on the selected date
  const eventsOnSelectedDate = useMemo(() => {
    if (!selectedDateKey) return []
    return eventsByDateKey[selectedDateKey] || []
  }, [selectedDateKey, eventsByDateKey])

  // Calendar month navigation
  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11)
      setCurrentYear(prev => prev - 1)
    } else {
      setCurrentMonthIndex(prev => prev - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0)
      setCurrentYear(prev => prev + 1)
    } else {
      setCurrentMonthIndex(prev => prev + 1)
    }
  }

  const handleJumpToToday = () => {
    const now = new Date()
    setCurrentYear(now.getFullYear())
    setCurrentMonthIndex(now.getMonth())
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    setSelectedDateKey(key)
    if (eventsByDateKey[key]?.length > 0) {
      setSelectedEventId(eventsByDateKey[key][0].id)
    }
  }

  const handleSelectDay = (day) => {
    if (!day.isCurrentMonth) {
      setCurrentMonthIndex(day.month)
      setCurrentYear(day.year)
    }
    const key = `${day.year}-${String(day.month + 1).padStart(2, '0')}-${String(day.date).padStart(2, '0')}`
    setSelectedDateKey(key)
    const evs = eventsByDateKey[key] || []
    if (evs.length > 0) {
      setSelectedEventId(evs[0].id)
    }
  }

  // Cheki prices from currentEvent.cheki_prices or config fallback
  const groupChekiPriceObj = useMemo(() => {
    if (currentEvent?.cheki_prices?.length > 0) {
      return currentEvent.cheki_prices.find(cp => !cp.member_id || cp.jenis_sesi?.toLowerCase().includes('group'))
    }
    return null
  }, [currentEvent])

  // === NEW: 3 TOGGLE TERBARU (Sesuai migration/config baru)
  // regularChekiEnabled: Regular Cheki per-member (2-shot, Rp40k)
  // wideChekiEnabled:    Wide Cheki 16:9 per-member (Rp70k PO / Rp80k OTS) — BUKAN semua member!
  // chekiGrupEnabled:    Cheki Grup (semua member dalam 1 frame), DEFAULT OFF
  const regularChekiEnabled = useMemo(() => {
    if (!config) return true
    return config.regular_cheki_enabled !== 'false' && config.regular_cheki_enabled !== false
  }, [config])

  const wideChekiEnabled = useMemo(() => {
    if (!config) return false
    return config.wide_cheki_enabled === 'true' || config.wide_cheki_enabled === true
  }, [config])

  const chekiGrupEnabled = useMemo(() => {
    if (!config) return false // DEFAULT OFF
    if (config?._groupMember && (config._groupMember.hadir === false || config._groupMember.hadir === 'false')) return false
    return config.cheki_grup_enabled === 'true' || config.cheki_grup_enabled === true
  }, [config])

  // === HARGA BARU SESUAI PRICELIST POSTER ===
  // Regular: harga_per_member config key (harga_cheki_per_member)
  // Wide PO: harga_grup config key (=70k, OTS 80k nanti di OTS form)
  // Cheki Grup PO: harga_cheki_grup_po config key
  const hargaMember = Number(config?.harga_cheki_per_member) || 40000
  const hargaWidePo = Number(config?.harga_cheki_grup) || 70000
  const hargaChekiGrupPo = Number(config?.harga_cheki_grup_po) || 150000
  void groupChekiPriceObj
  const hargaGrup = hargaWidePo // backward compat: hargaGrup di codebase=Wide PO (bukan Grup)

  // Backward-compat alias (variable isGroupActive/isRegularActive untuk existing code sections):
  const isGroupActive = chekiGrupEnabled // Hero chekiGrupEnabled dipakai untuk section Hero
  const isRegularActive = regularChekiEnabled || wideChekiEnabled // Section lineup tampil jika salah satu enable

  // Helper to find member-specific cheki price
  const getMemberChekiPrice = (member) => {
    if (currentEvent?.cheki_prices?.length > 0 && member) {
      const match = currentEvent.cheki_prices.find(cp => 
        String(cp.member_id) === String(member.id) || 
        String(cp.member_id) === String(member.member_id) ||
        cp.jenis_sesi?.toLowerCase().includes(member.nama_panggung?.toLowerCase())
      )
      if (match) return match
    }
    return null
  }

  const hargaMemberFallback = hargaMember

  // Lineup for current event
  const currentLineup = useMemo(() => {
    if (!currentEvent) return members
    if (currentEvent.event_lineup && currentEvent.event_lineup.length > 0) {
      const lineupMemberIds = currentEvent.event_lineup.map(l => String(l.member_id))
      return members.filter(m => lineupMemberIds.includes(String(m.id)) || lineupMemberIds.includes(String(m.member_id)))
    }
    return members
  }, [currentEvent, members])

  // Direct checkout action handler (NO CART)
  const handleDirectCheckout = (type, member = null) => {
    if (!currentEvent) return

    const executeCheckout = (user) => {
      let priceId = null
      let priceVal = null

      if (type === 'group' && groupChekiPriceObj) {
        priceId = groupChekiPriceObj.id
        priceVal = groupChekiPriceObj.price
      } else if (type === 'member' && member) {
        const memPrice = getMemberChekiPrice(member)
        if (memPrice) {
          priceId = memPrice.id
          priceVal = memPrice.price
        }
      }

      // Direct navigation to checkout page with eventId and query params
      const params = {
        type, // 'member' or 'group'
        ...(member ? { memberId: member.id || member.member_id, memberName: member.nama_panggung } : {}),
        ...(priceId ? { priceId } : {}),
        ...(priceVal ? { price: priceVal } : {})
      }

      const query = new URLSearchParams(params).toString()
      navigate(`/checkout/${currentEvent.id}?${query}`)
    }

    if (!isLoggedIn) {
      // Require fan login before checkout
      openAuthModal((user) => {
        executeCheckout(user)
      })
    } else {
      executeCheckout(fanUser)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs font-black tracking-widest text-text-secondary uppercase">
            Memuat Kalender Tiket Kohi Sekai...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-text-primary overflow-x-hidden">
      <KSHeader />

      <main className="pt-24 sm:pt-28 pb-24">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">

          {/* === HERO TITLE === */}
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-4">
              <FaTicketAlt size={12} />
              <span>Jadwal & Tiket Cheki Resmi</span>
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter text-text-primary leading-none uppercase mb-4">
              KOHI <span className="text-primary">TICKETS</span>
            </h1>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              Pilih tanggal event pada kalender bulanan, tentukan member idol favoritmu, dan langsung pesan tiket 2-Shot Cheki tanpa perlu sistem keranjang.
            </p>

            {/* Fan Status Pill */}
            <div className="mt-6 flex items-center justify-center gap-3">
              {isLoggedIn ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-surface border border-border text-xs">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-text-secondary font-medium">Terhubung sebagai:</span>
                  <span className="font-bold text-text-primary">{fanUser?.nama}</span>
                  <span className="text-[10px] text-primary font-black uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-lg">
                    Fan Active
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => openAuthModal()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-surface hover:bg-surface/80 border border-border text-xs text-text-secondary hover:text-primary transition-all font-bold group"
                >
                  <FaUserCheck className="text-primary group-hover:scale-110 transition-transform" />
                  <span>Masuk Fan ID untuk Auto-Fill Checkout</span>
                </button>
              )}
            </div>
          </div>

          {/* === SECTION 1: KALENDER BESAR (MONTHLY CALENDAR) === */}
          <section id="monthly-calendar" className="mb-16 sm:mb-20">
            <div className="bg-surface border border-border rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 md:p-10 shadow-xl relative overflow-hidden">
              {/* Calendar Decorative Ambient Glow */}
              <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-primary/4 blur-[120px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-accent/4 blur-[100px] pointer-events-none" />

              {/* Calendar Header Navigation */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-black">
                    <FaCalendarAlt size={20} />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
                      {INDO_MONTHS[currentMonthIndex]} {currentYear}
                    </h2>
                    <p className="text-xs text-text-secondary">
                      {events.filter(e => INDO_MONTHS.indexOf(e.bulan) === currentMonthIndex && e.tahun === currentYear).length} event dijadwalkan bulan ini
                    </p>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleJumpToToday}
                    className="px-3.5 py-2 rounded-xl bg-background border border-border text-xs font-bold text-text-secondary hover:text-primary hover:border-primary/40 transition-colors"
                  >
                    Hari Ini
                  </button>
                  <button
                    onClick={handlePrevMonth}
                    className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary/40 transition-colors"
                    aria-label="Bulan Sebelumnya"
                  >
                    <FaChevronLeft size={13} />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary/40 transition-colors"
                    aria-label="Bulan Berikutnya"
                  >
                    <FaChevronRight size={13} />
                  </button>
                </div>
              </div>

              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
                {DAY_NAMES.map((day, idx) => (
                  <div
                    key={day}
                    className={`py-2 text-[10px] sm:text-xs font-black uppercase tracking-wider ${
                      idx === 0 ? 'text-accent' : 'text-text-secondary/70'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {calendarDays.map((dayObj, i) => {
                  const dateKey = `${dayObj.year}-${String(dayObj.month + 1).padStart(2, '0')}-${String(dayObj.date).padStart(2, '0')}`
                  const dayEvents = eventsByDateKey[dateKey] || []
                  const hasEvents = dayEvents.length > 0
                  const isSelected = selectedDateKey === dateKey
                  const isToday =
                    today.getDate() === dayObj.date &&
                    today.getMonth() === dayObj.month &&
                    today.getFullYear() === dayObj.year

                  return (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectDay(dayObj)}
                      className={`relative min-h-[70px] sm:min-h-[96px] md:min-h-[110px] p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                        !dayObj.isCurrentMonth
                          ? 'opacity-30 bg-transparent border-transparent'
                          : isSelected
                          ? 'bg-primary/10 border-primary shadow-md shadow-primary/10'
                          : hasEvents
                          ? 'bg-background border-primary/30 hover:border-primary shadow-sm'
                          : 'bg-background/60 border-border/60 hover:border-border'
                      }`}
                    >
                      {/* Top Date Header in cell */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs font-black ${
                            isToday
                              ? 'bg-primary text-white shadow-sm'
                              : isSelected
                              ? 'bg-primary/20 text-primary'
                              : 'text-text-primary'
                          }`}
                        >
                          {dayObj.date}
                        </span>

                        {hasEvents && (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            {dayEvents.some(e => e.is_special) && (
                              <FaStar className="text-accent text-[9px]" />
                            )}
                          </span>
                        )}
                      </div>

                      {/* Event preview chip in cell */}
                      {hasEvents && dayObj.isCurrentMonth && (
                        <div className="mt-1 space-y-1">
                          {dayEvents.slice(0, 2).map((ev) => (
                            <div
                              key={ev.id}
                              className={`px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold truncate leading-tight transition-colors ${
                                ev.is_special
                                  ? 'bg-accent/15 text-accent border border-accent/20'
                                  : 'bg-primary/15 text-primary'
                              }`}
                            >
                              {ev.nama}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <span className="text-[8px] font-bold text-text-secondary block pl-1">
                              +{dayEvents.length - 2} event lagi
                            </span>
                          )}
                        </div>
                      )}
                    </motion.button>
                  )
                })}
              </div>

              {/* Legend & Hint */}
              <div className="mt-6 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs text-text-secondary">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <span>Ada Event</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FaStar className="text-accent text-[11px]" />
                    <span>Special Stage</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary/20 border border-primary" />
                    <span>Tanggal Terpilih</span>
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary/70">
                  Klik pada tanggal yang ditandai untuk melihat detail dan memesan tiket.
                </p>
              </div>
            </div>
          </section>

          {/* === SECTION 2: DETAIL EVENT (DI BAWAH KALENDER) === */}
          <section id="event-detail" className="mb-16 sm:mb-20">
            {eventsOnSelectedDate.length > 1 && (
              <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                <span className="text-xs font-bold text-text-secondary whitespace-nowrap">Pilih Event:</span>
                {eventsOnSelectedDate.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => setSelectedEventId(ev.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      currentEvent?.id === ev.id
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {ev.nama}
                  </button>
                ))}
              </div>
            )}

            {currentEvent ? (
              <motion.div
                key={currentEvent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-surface border border-border rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 shadow-sm relative overflow-hidden"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                  {/* Event Information */}
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="px-3.5 py-1 rounded-full bg-primary/10 border border-border text-primary text-xs font-black uppercase tracking-wider">
                        EVENT TERPILIH · TIKET OPEN
                      </span>
                      {currentEvent.is_special && (
                        <span className="px-3.5 py-1 rounded-full bg-accent/10 border border-border text-accent text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                          <FaStar size={10} /> SPECIAL STAGE
                        </span>
                      )}
                    </div>

                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase text-text-primary tracking-tight leading-tight">
                      {currentEvent.nama}
                    </h2>

                    <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-2xl font-medium">
                      {currentEvent.deskripsi || currentEvent.description || 'Panggung pertunjukan dan sesi interaktif 2-Shot Cheki bersama member idol Kohi Sekai.'}
                    </p>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-background border border-border">
                        <FaCalendarAlt className="text-primary text-base flex-shrink-0" />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-text-secondary/70">Tanggal Event</p>
                          <p className="text-xs sm:text-sm font-bold text-text-primary">
                            {currentEvent.tanggal} {currentEvent.bulan} {currentEvent.tahun}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-background border border-border">
                        <FaClock className="text-primary text-base flex-shrink-0" />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-text-secondary/70">Waktu & Sesi</p>
                          <p className="text-xs sm:text-sm font-bold text-text-primary">
                            {currentEvent.cheki_time || currentEvent.event_time || '15:00 - 18:00 WIB'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-background border border-border">
                        <FaMapMarkerAlt className="text-primary text-base flex-shrink-0" />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-text-secondary/70">Lokasi / Venue</p>
                          <p className="text-xs sm:text-sm font-bold text-text-primary truncate">
                            {currentEvent.lokasi}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CTA Button to Order for this Event */}
                  <div className="lg:w-auto flex flex-col justify-center items-start lg:items-end border-t lg:border-t-0 lg:border-l border-border pt-6 lg:pt-0 lg:pl-8 space-y-3">
                    <span className="text-xs text-text-secondary font-medium block">Sudah punya akun Fan ID?</span>
                    <button
                      onClick={() => handleBookCurrentEvent()}
                      className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-primary hover:bg-primary-hover text-white font-black text-xs sm:text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 min-h-[48px]"
                    >
                      <span>Pesan Tiket Event Ini</span>
                      <FaArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-surface border border-border rounded-3xl p-12 text-center space-y-4">
                <FaInfoCircle className="text-4xl text-primary/40 mx-auto" />
                <h3 className="text-xl font-bold text-text-primary">Tidak Ada Event di Tanggal Ini</h3>
                <p className="text-xs text-text-secondary max-w-md mx-auto">
                  Pilih salah satu tanggal yang memiliki tanda titik pink/oranye pada kalender di atas untuk melihat detail event dan memesan tiket.
                </p>
              </div>
            )}
          </section>

          {/* === SECTION 3: HARGA CHEKI & CHART MEMBER === */}
          {currentEvent && (
            <section id="cheki-pricing" className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-black tracking-[0.4em] text-primary uppercase mb-2">Pilihan Tiket</p>
                  <h2 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight">
                    DAFTAR CHEKI & LINEUP MEMBER
                  </h2>
                  <p className="text-xs sm:text-sm text-text-secondary mt-1">
                    Lihat foto lineup member & grup. Klik tanggal / event di atas untuk memulai pemesanan.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  {regularChekiEnabled && (
                    <>
                      <span className="text-xs font-medium text-text-secondary">
                        Regular: <strong className="text-text-primary">Rp {hargaMember.toLocaleString('id-ID')}</strong>
                      </span>
                      {wideChekiEnabled && <span className="text-border">•</span>}
                    </>
                  )}
                  {wideChekiEnabled && (
                    <>
                      <span className="text-xs font-medium text-text-secondary">
                        Wide 16:9: <strong className="text-text-primary">Rp {hargaWidePo.toLocaleString('id-ID')}</strong>
                      </span>
                      {chekiGrupEnabled && <span className="text-border">•</span>}
                    </>
                  )}
                  {chekiGrupEnabled && (
                    <span className="text-xs font-medium text-text-secondary">
                      Cheki Grup: <strong className="text-text-primary">Rp {hargaChekiGrupPo.toLocaleString('id-ID')}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* OPTION 1: CHEKI GRUP HERO BANNER CARD (Only rendered if chekiGrupEnabled) — DEFAULT OFF */}
              {chekiGrupEnabled && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="relative rounded-3xl sm:rounded-[2.5rem] overflow-hidden bg-surface border border-primary/20 shadow-xl group hover:border-primary/40 transition-all"
                >
                  <div className="flex flex-col md:flex-row items-stretch">
                    <div className="md:w-1/2 relative min-h-[220px] sm:min-h-[260px] overflow-hidden bg-black/40">
                      <img
                        src={
                          config?._groupMember?.shop_image_url || config?._groupMember?.image_url
                            ? getAssetPath(config._groupMember.shop_image_url || config._groupMember.image_url)
                            : getAssetPath('/images/members/group.webp')
                        }
                        alt="Cheki Grup Kohi Sekai"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 rounded-full bg-gradient-to-r from-primary to-accent text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                          <FaUsers className="inline mr-1.5" /> Limited · All Members
                        </span>
                      </div>
                    </div>

                    <div className="md:w-1/2 p-6 sm:p-8 md:p-10 flex flex-col justify-between space-y-6">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-primary mb-1">
                          <FaUsers size={14} />
                          <span>SESI GRUP KHUSUS</span>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
                          Cheki Grup (Semua Member)
                        </h3>
                        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mt-2">
                          Foto polaroid eksklusif bersama SELURUH member Kohi Sekai sekaligus dalam satu frame kenangan. Hanya tersedia di event terpilih.
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-text-secondary font-bold block">Biaya Tiket</span>
                          <span className="text-2xl sm:text-3xl font-black text-text-primary">
                            Rp {hargaChekiGrupPo.toLocaleString('id-ID')}
                          </span>
                        </div>

                        <button
                          onClick={handleScrollToCalendar}
                          className="py-3 px-6 sm:px-8 rounded-full bg-primary/20 border border-primary/40 hover:bg-primary text-primary hover:text-white font-black text-xs sm:text-sm uppercase tracking-widest shadow-md transition-all flex items-center gap-2"
                        >
                          <span>Pilih Event untuk Pesan</span>
                          <FaArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* OPTION 2: MEMBER LINEUP CHART CARDS — tampil jika Regular ATAU Wide enabled */}
              {isRegularActive && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <FaCamera className="text-primary" />
                    <h3 className="text-xl font-black text-text-primary tracking-tight uppercase">
                      Member Cheki Lineup
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[9px] sm:text-[10px]">
                    {regularChekiEnabled && (
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/25 text-primary font-bold">
                        Regular 4:3
                      </span>
                    )}
                    {wideChekiEnabled && (
                      <span className="px-2 py-0.5 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/25 text-[var(--primary)] font-bold">
                        Wide 16:9
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {currentLineup.map((member, idx) => {
                    const memPriceObj = getMemberChekiPrice(member)
                    const memberPrice = memPriceObj ? Number(memPriceObj.price) : hargaMemberFallback
                    const slotCount = memPriceObj?.slot_available
                    const memberColor = member.color || 'var(--primary)'
                    const photoUrl = member.shop_image_url || member.image_url ? getAssetPath(member.shop_image_url || member.image_url) : null

                    return (
                      <motion.div
                        key={member.id || member.member_id || idx}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.08 }}
                        className="group relative rounded-3xl overflow-hidden bg-surface border border-border hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all flex flex-col justify-between"
                      >
                        <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-surface to-background">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={member.nama_panggung}
                              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/10">
                              <span className="text-4xl font-black text-primary/40">
                                {member.nama_panggung?.charAt(0) || 'K'}
                              </span>
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />

                          <div className="absolute top-3 left-3">
                            <span
                              className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-white shadow-sm"
                              style={{ backgroundColor: memberColor }}
                            >
                              {member.tagline || 'Kohi Sekai'}
                            </span>
                          </div>

                          <div className="absolute bottom-3 left-3 right-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">
                              {member.nama_kanji || 'コーヒー・アイドル'}
                            </p>
                            <h4 className="text-xl font-black text-text-primary tracking-tight truncate">
                              {member.nama_panggung}
                            </h4>
                          </div>
                        </div>

                        {/* Card Footer: 2 baris harga (Regular + Wide jika aktif) */}
                        <div className="p-5 space-y-3 border-t border-border">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] uppercase tracking-wider text-text-secondary font-bold">
                                Daftar Harga
                              </span>
                              {slotCount !== undefined && (
                                <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                  Sisa: {slotCount} slot
                                </span>
                              )}
                            </div>
                            {regularChekiEnabled && (
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-text-secondary">Regular · 2-Shot</span>
                                <span className="text-sm font-black text-text-primary">
                                  Rp {memberPrice.toLocaleString('id-ID')}
                                </span>
                              </div>
                            )}
                            {wideChekiEnabled && (
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-[var(--primary)]">Wide · 16:9</span>
                                <span className="text-sm font-black text-[var(--primary)]">
                                  Rp {hargaWidePo.toLocaleString('id-ID')}
                                </span>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={handleScrollToCalendar}
                            className="w-full py-2.5 px-5 rounded-full bg-primary/20 border border-primary/40 hover:bg-primary text-primary hover:text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                          >
                            <span>Pilih Event untuk Pesan</span>
                            <FaArrowRight size={10} />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
              )}
            </section>
          )}


        </div>
      </main>

      <KSFooter />

      {/* Global Modals for Fan Authentication & History */}
      <FanAuthModal />
      <FanOrderHistoryModal />
    </div>
  )
}

export default KSShopPage




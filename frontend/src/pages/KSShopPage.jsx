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
  FaInfoCircle,
  FaBox,
  FaWhatsapp,
  FaTimes,
  FaShoppingBag
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

const DEFAULT_OFFICIAL_MERCH = [
  {
    id: 'merch-tshirt-01',
    nama: 'Kohi Sekai Official T-Shirt - Kawaii Metal Vol. 1',
    deskripsi: 'Kaos katun combed 24s premium bertema Kawaii Metal dengan sablon plastisol halus tahan lama. Nyaman dipakai nonton live maupun daily outfit.',
    harga: 175000,
    stok: 25,
    available: true,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    gambar_url: '/images/members/placeholder.svg'
  },
  {
    id: 'merch-lightstick-01',
    nama: 'Official Lightstick - Neon Glow Stick 15 Colors',
    deskripsi: 'Lightstick resmi Kohi Sekai dengan 15 pilihan warna cerah dan tali lanyard eksklusif. Siap temani momen seru chant idol di setiap event!',
    harga: 150000,
    stok: 40,
    available: true,
    sizes: [],
    gambar_url: '/images/members/placeholder.svg'
  },
  {
    id: 'merch-photocard-01',
    nama: 'Exclusive Photocard Pack Vol. 1 (5 Cards)',
    deskripsi: 'Set photocard holographic eksklusif isi 5 kartu menampilkan seluruh member idol Kohi Sekai lengkap dengan printed signature khusus.',
    harga: 50000,
    stok: 60,
    available: true,
    sizes: [],
    gambar_url: '/images/members/placeholder.svg'
  },
  {
    id: 'merch-acrylic-01',
    nama: 'Kohi Sekai Idol Acrylic Standee',
    deskripsi: 'Standee akrilik premium tebal 3mm tinggi 12cm dengan cetakan UV jernih dan base stand berlogo Kohi Sekai.',
    harga: 65000,
    stok: 35,
    available: true,
    sizes: [],
    gambar_url: '/images/members/placeholder.svg'
  }
]

const KSShopPage = () => {
  const navigate = useNavigate()
  const { fanUser, isLoggedIn, openAuthModal } = useFanAuth()

  // Data states
  const [events, setEvents] = useState([])
  const [members, setMembers] = useState([])
  const [config, setConfig] = useState(null)
  const [merchandise, setMerchandise] = useState([])
  const [selectedMerch, setSelectedMerch] = useState(null)
  const [selectedSize, setSelectedSize] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeShopTab, setActiveShopTab] = useState('cheki') // 'cheki' | 'merch'

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
        const [eventsRes, membersRes, configRes, merchRes] = await Promise.allSettled([
          api.get('/events'),
          api.get('/members'),
          api.get('/config'),
          api.get('/merchandise'),
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

        let fetchedMerch = []
        if (merchRes.status === 'fulfilled' && merchRes.value.data?.success) {
          fetchedMerch = merchRes.value.data.data || []
        }
        setMerchandise(fetchedMerch)

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

  // Official Merchandise memo & WA Order Link
  const displayMerch = useMemo(() => {
    return merchandise.length > 0 ? merchandise : DEFAULT_OFFICIAL_MERCH
  }, [merchandise])

  const waMerchLink = useMemo(() => {
    if (!selectedMerch) return '#'
    const phone = config?.faq_section?.cta_link?.replace(/[^0-9]/g, '') || '6281234567890'
    const fanInfo = isLoggedIn && fanUser?.nama ? `\n- Pemesan (Fan ID): ${fanUser.nama} (${fanUser.nomor_telepon || fanUser.whatsapp || ''})` : ''
    const text = `Halo Admin Kohi Sekai, saya ingin memesan official merchandise:\n- Produk: ${selectedMerch.nama}${selectedSize ? `\n- Ukuran: ${selectedSize}` : ''}\n- Harga: Rp ${selectedMerch.harga?.toLocaleString('id-ID')}${fanInfo}\n\nMohon info ketersediaan stok & cara pembayarannya. Terima kasih!`
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
  }, [selectedMerch, selectedSize, config, isLoggedIn, fanUser])

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
    <div className="min-h-screen bg-background bg-pattern-dots text-text-primary overflow-x-hidden relative">
      <KSHeader />

      <main className="pt-20 sm:pt-28 pb-16 sm:pb-24 relative z-10">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">

          {/* === HERO TITLE === */}
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] sm:text-xs font-black uppercase tracking-wider mb-3">
              <FaTicketAlt size={11} />
              <span>Jadwal & Tiket Cheki Resmi</span>
            </div>
            <h1 className="text-3xl sm:text-6xl md:text-7xl font-black tracking-tight text-text-primary leading-none uppercase mb-3">
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

            {/* === SHOP CATEGORY SWITCHER TABS (CHEKI vs MERCH) === */}
            <div className="mt-8 flex items-center justify-center">
              <div className="p-1 rounded-2xl bg-surface border border-border inline-flex gap-1.5 shadow-lg">
                <button
                  type="button"
                  onClick={() => setActiveShopTab('cheki')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all ${
                    activeShopTab === 'cheki'
                      ? 'bg-primary text-white shadow-md shadow-primary/25'
                      : 'text-text-secondary hover:text-text-primary hover:bg-background'
                  }`}
                >
                  <FaTicketAlt size={13} />
                  <span>Tiket Cheki & Event</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveShopTab('merch')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all ${
                    activeShopTab === 'merch'
                      ? 'bg-teal-500 text-black shadow-md shadow-teal-500/25 font-black'
                      : 'text-text-secondary hover:text-text-primary hover:bg-background'
                  }`}
                >
                  <FaBox size={13} />
                  <span>Official Merch</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${activeShopTab === 'merch' ? 'bg-black/20 text-black' : 'bg-background text-teal-400 border border-teal-500/30'}`}>
                    {displayMerch.length}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {activeShopTab === 'cheki' && (
            <>
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
                      <div className="absolute inset-0 bg-black/60" />
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-wider shadow-md">
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

                {/* =========================================================================
                    MEMBER LINEUP - MANUAL RESPONSIVE: MOBILE (md:hidden) — 2 COLUMNS
                    ========================================================================= */}
                <div className="md:hidden grid grid-cols-2 gap-2.5">
                  {currentLineup.map((member, idx) => {
                    const memPriceObj = getMemberChekiPrice(member)
                    const memberPrice = memPriceObj ? Number(memPriceObj.price) : hargaMemberFallback
                    const slotCount = memPriceObj?.slot_available
                    const memberColor = member.color || 'var(--primary)'
                    const photoUrl = member.shop_image_url || member.image_url ? getAssetPath(member.shop_image_url || member.image_url) : null

                    return (
                      <motion.div
                        key={`mob-${member.id || member.member_id || idx}`}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.05 }}
                        className="group relative rounded-2xl overflow-hidden bg-surface border border-border flex flex-col justify-between"
                      >
                        <div className="relative aspect-[4/5] overflow-hidden bg-surface">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={member.nama_panggung}
                              className="w-full h-full object-cover object-top"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/10">
                              <span className="text-3xl font-black text-primary/40">
                                {member.nama_panggung?.charAt(0) || 'K'}
                              </span>
                            </div>
                          )}

                          <div className="absolute inset-x-0 bottom-0 h-12 bg-black/85" />

                          <div className="absolute top-2 left-2">
                            <span
                              className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider text-white shadow-sm"
                              style={{ backgroundColor: memberColor }}
                            >
                              {member.tagline || 'Kohi'}
                            </span>
                          </div>

                          <div className="absolute bottom-1.5 left-2 right-2">
                            <p className="text-[7px] font-black uppercase tracking-wider text-primary/80 truncate">
                              {member.nama_kanji || 'コーヒー'}
                            </p>
                            <h4 className="text-xs font-black text-text-primary tracking-tight truncate leading-tight">
                              {member.nama_panggung}
                            </h4>
                          </div>
                        </div>

                        {/* Card Footer Mobile - Compact */}
                        <div className="p-2 space-y-1.5 border-t border-border">
                          <div className="space-y-0.5">
                            {regularChekiEnabled && (
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-[8px] font-bold text-text-secondary uppercase">Regular</span>
                                <span className="font-black text-text-primary text-[11px]">
                                  Rp {memberPrice.toLocaleString('id-ID')}
                                </span>
                              </div>
                            )}
                            {wideChekiEnabled && (
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-[8px] font-bold text-primary uppercase">Wide</span>
                                <span className="font-black text-primary text-[11px]">
                                  Rp {hargaWidePo.toLocaleString('id-ID')}
                                </span>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={handleScrollToCalendar}
                            className="w-full py-1.5 px-2 rounded-xl bg-primary/15 border border-primary/30 hover:bg-primary text-primary hover:text-white font-bold text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 active:scale-95"
                          >
                            <span>Pilih Event</span>
                            <FaArrowRight size={7} />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                {/* =========================================================================
                    MEMBER LINEUP - MANUAL RESPONSIVE: DESKTOP (hidden md:grid)
                    ========================================================================= */}
                <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentLineup.map((member, idx) => {
                    const memPriceObj = getMemberChekiPrice(member)
                    const memberPrice = memPriceObj ? Number(memPriceObj.price) : hargaMemberFallback
                    const slotCount = memPriceObj?.slot_available
                    const memberColor = member.color || 'var(--primary)'
                    const photoUrl = member.shop_image_url || member.image_url ? getAssetPath(member.shop_image_url || member.image_url) : null

                    return (
                      <motion.div
                        key={`desk-${member.id || member.member_id || idx}`}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.08 }}
                        className="group relative rounded-3xl overflow-hidden bg-surface border border-border hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all flex flex-col justify-between"
                      >
                        <div className="relative aspect-[3/4] overflow-hidden bg-surface">
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

                          <div className="absolute inset-x-0 bottom-0 h-16 bg-black/85" />

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

            {/* Shortcut Banner to Merch */}
            <div className="mt-12 p-6 rounded-3xl bg-surface border border-teal-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center text-xl shrink-0">
                  <FaBox />
                </div>
                <div>
                  <h3 className="text-base font-black text-text-primary uppercase">Cari Kaos, Lightstick, atau Standee?</h3>
                  <p className="text-xs text-text-secondary mt-0.5">Lihat koleksi merchandise resmi Kohi Sekai sekarang.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveShopTab('merch')}
                className="px-6 py-3 rounded-full bg-teal-500 text-black font-black text-xs uppercase tracking-wider shadow-md hover:bg-teal-400 transition shrink-0"
              >
                Buka Official Merch →
              </button>
            </div>
            </>
          )}

          {/* === SECTION 4: OFFICIAL MERCHANDISE === */}
          {activeShopTab === 'merch' && (
          <section id="official-merchandise" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-400 text-[10px] sm:text-xs font-black uppercase tracking-wider mb-2">
                  <FaBox size={11} />
                  <span>Official Merchandise</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-text-primary tracking-tight uppercase">
                  KOHI OFFICIAL MERCH
                </h2>
                <p className="text-xs sm:text-sm text-text-secondary mt-1">
                  Koleksi merchandise resmi Kohi Sekai untuk melengkapi dukunganmu di setiap panggung.
                </p>
              </div>
            </div>

            {/* Mobile Merch Layout (md:hidden) — 2 Columns! */}
            <div className="md:hidden grid grid-cols-2 gap-2.5">
              {displayMerch.map((item, idx) => {
                const isPreOrder = !item.stok || item.stok === 0
                const isClosed = item.available === false
                const itemImg = item.gambar_url ? getAssetPath(item.gambar_url) : null

                return (
                  <motion.div
                    key={`mob-merch-${item.id || idx}`}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => {
                      setSelectedMerch(item)
                      setSelectedSize(item.sizes && item.sizes.length > 0 ? item.sizes[0] : '')
                    }}
                    className="group relative rounded-2xl overflow-hidden bg-surface border border-border flex flex-col justify-between cursor-pointer active:scale-95 transition-transform"
                  >
                    <div className="relative aspect-square overflow-hidden bg-background">
                      {itemImg ? (
                        <img
                          src={itemImg}
                          alt={item.nama}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src = getAssetPath('/images/members/placeholder.svg')
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                          <FaBox className="text-3xl text-primary/40" />
                        </div>
                      )}

                      {/* Status Badge */}
                      <div className="absolute top-2 left-2">
                        {isClosed ? (
                          <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700">
                            Closed
                          </span>
                        ) : isPreOrder ? (
                          <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-accent/20 text-accent border border-accent/30">
                            Pre-Order
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-success/20 text-success border border-success/30">
                            Tersedia
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 space-y-2 border-t border-border flex flex-col justify-between flex-1">
                      <div>
                        <h4 className="text-xs font-black text-text-primary uppercase tracking-tight line-clamp-1 leading-tight">
                          {item.nama}
                        </h4>
                        <p className="text-xs font-black text-primary mt-1">
                          Rp {Number(item.harga || 0).toLocaleString('id-ID')}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="w-full py-1.5 px-2 rounded-full bg-primary/20 border border-primary/40 hover:bg-primary text-primary hover:text-white font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                      >
                        <FaShoppingBag size={10} />
                        <span>Detail & Pesan</span>
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Desktop Merch Layout (hidden md:grid md:grid-cols-3 lg:grid-cols-4) */}
            <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {displayMerch.map((item, idx) => {
                const isPreOrder = !item.stok || item.stok === 0
                const isClosed = item.available === false
                const itemImg = item.gambar_url ? getAssetPath(item.gambar_url) : null

                return (
                  <motion.div
                    key={`desk-merch-${item.id || idx}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.06 }}
                    onClick={() => {
                      setSelectedMerch(item)
                      setSelectedSize(item.sizes && item.sizes.length > 0 ? item.sizes[0] : '')
                    }}
                    className="group relative rounded-3xl overflow-hidden bg-surface border border-border hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all flex flex-col justify-between cursor-pointer"
                  >
                    <div className="relative aspect-square overflow-hidden bg-background">
                      {itemImg ? (
                        <img
                          src={itemImg}
                          alt={item.nama}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src = getAssetPath('/images/members/placeholder.svg')
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                          <FaBox className="text-4xl text-primary/40" />
                        </div>
                      )}

                      <div className="absolute top-3 left-3">
                        {isClosed ? (
                          <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700">
                            Closed
                          </span>
                        ) : isPreOrder ? (
                          <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-accent/20 text-accent border border-accent/30">
                            Pre-Order
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-success/20 text-success border border-success/30">
                            Tersedia ({item.stok} stok)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-5 space-y-3 border-t border-border flex flex-col justify-between flex-1">
                      <div>
                        <h4 className="text-sm font-black text-text-primary uppercase tracking-tight line-clamp-1">
                          {item.nama}
                        </h4>
                        {item.deskripsi && (
                          <p className="text-xs text-text-secondary line-clamp-2 mt-1 leading-relaxed">
                            {item.deskripsi}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-wider text-text-secondary font-bold">
                            Harga Satuan
                          </span>
                          <span className="text-base font-black text-primary">
                            Rp {Number(item.harga || 0).toLocaleString('id-ID')}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="w-full py-2.5 px-4 rounded-full bg-primary/20 border border-primary/40 hover:bg-primary text-primary hover:text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2"
                        >
                          <FaShoppingBag size={12} />
                          <span>Detail & Pesan</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Shortcut Banner back to Cheki Tickets */}
            <div className="mt-12 p-6 rounded-3xl bg-surface border border-primary/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center text-xl shrink-0">
                  <FaTicketAlt />
                </div>
                <div>
                  <h3 className="text-base font-black text-text-primary uppercase">Mau Pesan Tiket 2-Shot Cheki?</h3>
                  <p className="text-xs text-text-secondary mt-0.5">Pilih tanggal event dan foto polaroid bersama idolamu.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveShopTab('cheki')}
                className="px-6 py-3 rounded-full bg-primary text-white font-black text-xs uppercase tracking-wider shadow-md hover:bg-primary-hover transition shrink-0"
              >
                Lihat Tiket Cheki →
              </button>
            </div>
          </section>
          )}


        </div>
      </main>

      <KSFooter />

      {/* Merch Detail Modal (Kawaii Metal, Solid Color, Anti-Blur) */}
      <AnimatePresence>
        {selectedMerch && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
            onClick={() => setSelectedMerch(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface border border-border rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-7 relative shadow-2xl"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedMerch(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center text-text-secondary hover:text-primary transition-colors"
                aria-label="Tutup"
              >
                <FaTimes size={13} />
              </button>

              <div className="space-y-5">
                {/* Image */}
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-background border border-border relative">
                  {selectedMerch.gambar_url ? (
                    <img
                      src={getAssetPath(selectedMerch.gambar_url)}
                      alt={selectedMerch.nama}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = getAssetPath('/images/members/placeholder.svg')
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                      <FaBox className="text-5xl text-primary/40" />
                    </div>
                  )}

                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 rounded-lg bg-primary text-white text-[10px] font-black uppercase tracking-wider">
                      Official Merchandise
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-text-primary uppercase tracking-tight">
                    {selectedMerch.nama}
                  </h3>
                  <p className="text-xl font-black text-primary mt-1">
                    Rp {Number(selectedMerch.harga || 0).toLocaleString('id-ID')}
                  </p>
                </div>

                {selectedMerch.deskripsi && (
                  <div className="p-3.5 rounded-xl bg-background border border-border">
                    <p className="text-xs sm:text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                      {selectedMerch.deskripsi}
                    </p>
                  </div>
                )}

                {/* Sizes Selection */}
                {selectedMerch.sizes && selectedMerch.sizes.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block">
                      Pilih Ukuran:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedMerch.sizes.map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedSize(sz)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                            selectedSize === sz
                              ? 'bg-primary text-white shadow-md'
                              : 'bg-background border border-border text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action button */}
                <div className="pt-2">
                  <a
                    href={waMerchLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-6 rounded-2xl bg-primary hover:bg-primary-hover text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <FaWhatsapp size={16} />
                    <span>Pesan via WhatsApp</span>
                  </a>
                  <p className="text-[10px] text-text-secondary text-center mt-2">
                    Pesanan akan langsung terhubung ke WhatsApp Admin Official Kohi Sekai.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Modals for Fan Authentication & History */}
      <FanAuthModal />
      <FanOrderHistoryModal />
    </div>
  )
}

export default KSShopPage




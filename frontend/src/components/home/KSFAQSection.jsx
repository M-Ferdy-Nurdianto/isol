import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FaChevronDown,
  FaQuestionCircle,
  FaWhatsapp,
  FaInstagram,
  FaCheck,
  FaArrowRight,
  FaShoppingBag,
  FaTicketAlt,
  FaUsers,
  FaMapMarkerAlt
} from 'react-icons/fa'

const DEFAULT_FAQS = [
  {
    id: 1,
    tanya: 'Bagaimana cara membeli tiket / OTS Kohi Sekai?',
    jawab: 'Kamu bisa langsung memesan tiket melalui halaman Shop di website ini. Pilih tanggal event, tentukan tiket yang diinginkan, lalu selesaikan pembayaran. Untuk pembelian langsung di venue (On The Spot), silakan temui kru kami di merchandise booth.',
    kategori: 'tiket'
  },
  {
    id: 2,
    tanya: 'Apa itu Cheki dan bagaimana cara memesan?',
    jawab: 'Cheki adalah foto polaroid eksklusif bersama member Kohi Sekai (2-Shot) lengkap dengan tanda tangan dan pesan personal. Kamu bisa memesan Cheki Reguler (instax mini), Wide (16:9), atau Cheki Grup bersama seluruh member di halaman Shop atau langsung saat OTS di venue.',
    kategori: 'cheki'
  },
  {
    id: 3,
    tanya: 'Apakah ada merchandise resmi Kohi Sekai?',
    jawab: 'Ya! Kami menjual berbagai merchandise resmi mulai dari T-Shirt Kawaii Metal, Official Lightstick 15 Colors, Photocard Pack eksklusif, hingga Acrylic Standee member di halaman Shop dan booth official saat live concert berlangsung.',
    kategori: 'merch'
  },
  {
    id: 4,
    tanya: 'Bagaimana cara bergabung dengan fanbase Kohi Sekai?',
    jawab: 'Ikuti akun resmi kami di Instagram (@kohisekai) dan TikTok. Kamu juga bisa mendaftar akun Fan di website ini untuk mendapatkan Fan ID resmi, mengumpulkan digital receipt cheki, serta menikmati prioritas tiket pre-order event mendatang.',
    kategori: 'fanbase'
  },
  {
    id: 5,
    tanya: 'Apakah event Kohi Sekai selalu di Jakarta?',
    jawab: 'Tidak, Kohi Sekai aktif tampil di berbagai festival budaya Jepang, konser idol, dan tour di berbagai kota besar di Indonesia. Cek jadwal panggung terbaru di menu About Us atau pantau kalender event di halaman Shop kami.',
    kategori: 'event'
  }
]

// Helper untuk deteksi kategori otomatis berdasarkan isi pertanyaan/jawaban
const detectCategory = (q = '', a = '') => {
  const text = `${q} ${a}`.toLowerCase()
  if (text.includes('cheki') || text.includes('polaroid') || text.includes('2-shot')) {
    return { id: 'cheki', label: '2-Shot Cheki', color: 'pink' }
  }
  if (text.includes('merch') || text.includes('kaos') || text.includes('t-shirt') || text.includes('lightstick') || text.includes('photocard') || text.includes('standee')) {
    return { id: 'merch', label: 'Merchandise', color: 'teal' }
  }
  if (text.includes('tiket') || text.includes('ots') || text.includes('beli') || text.includes('checkout') || text.includes('harga')) {
    return { id: 'tiket', label: 'Tiket & OTS', color: 'amber' }
  }
  if (text.includes('fanbase') || text.includes('komunitas') || text.includes('akun') || text.includes('fan id')) {
    return { id: 'fanbase', label: 'Fanbase & Akun', color: 'purple' }
  }
  if (text.includes('event') || text.includes('kota') || text.includes('jakarta') || text.includes('konser') || text.includes('jadwal')) {
    return { id: 'event', label: 'Tour & Event', color: 'blue' }
  }
  return { id: 'umum', label: 'Info Official', color: 'neutral' }
}

const getBadgeStyle = (color) => {
  switch (color) {
    case 'pink':
      return 'bg-[var(--primary)]/15 text-[var(--primary)] border-[var(--primary)]/30'
    case 'teal':
      return 'bg-teal-500/15 text-teal-300 border-teal-500/30'
    case 'amber':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    case 'purple':
      return 'bg-purple-500/15 text-purple-300 border-purple-500/30'
    case 'blue':
      return 'bg-blue-500/15 text-blue-300 border-blue-500/30'
    default:
      return 'bg-zinc-800 text-zinc-300 border-zinc-700'
  }
}

const KSFAQSection = ({ faqs = [], config = {} }) => {
  const navigate = useNavigate()
  const [openId, setOpenId] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')

  // Normalisasi data dari DB (bisa berupa { tanya, jawab } atau { q, a } atau { pertanyaan, jawaban })
  const normalizedFaqs = useMemo(() => {
    let rawList = []
    if (Array.isArray(faqs) && faqs.length > 0) {
      rawList = faqs
    } else if (config?.faq_items) {
      try {
        const parsed = typeof config.faq_items === 'string' ? JSON.parse(config.faq_items) : config.faq_items
        if (Array.isArray(parsed) && parsed.length > 0) rawList = parsed
      } catch (e) {
        rawList = DEFAULT_FAQS
      }
    } else {
      rawList = DEFAULT_FAQS
    }

    if (rawList.length === 0) rawList = DEFAULT_FAQS

    return rawList.map((item, idx) => {
      const q = item.tanya || item.pertanyaan || item.q || ''
      const a = item.jawab || item.jawaban || item.a || ''
      const category = detectCategory(q, a)
      return {
        id: item.id || `faq-${idx}`,
        number: String(idx + 1).padStart(2, '0'),
        tanya: q,
        jawab: a,
        category
      }
    })
  }, [faqs, config])

  // Filter FAQ sesuai chip yang diklik
  const filteredFaqs = useMemo(() => {
    if (activeFilter === 'all') return normalizedFaqs
    return normalizedFaqs.filter(item => item.category.id === activeFilter)
  }, [normalizedFaqs, activeFilter])

  // Data CP WhatsApp dari config
  const cpData = useMemo(() => {
    let name = 'Kiki'
    let phone = '6281234567890'
    try {
      const cp = typeof config?.faq_cp === 'string' ? JSON.parse(config.faq_cp) : config?.faq_cp
      if (cp && cp.name) name = cp.name
      if (cp && cp.phone) phone = cp.phone
    } catch (e) {}
    return { name, phone }
  }, [config])

  const filterOptions = [
    { id: 'all', label: 'Semua Pertanyaan', count: normalizedFaqs.length },
    { id: 'tiket', label: 'Tiket & OTS' },
    { id: 'cheki', label: '2-Shot Cheki' },
    { id: 'merch', label: 'Merchandise' },
    { id: 'fanbase', label: 'Fanbase' },
    { id: 'event', label: 'Tour & Event' }
  ]

  return (
    <section className="py-14 sm:py-24 px-4 bg-[var(--background)] border-t border-[var(--border)] relative overflow-hidden font-outfit">
      <div className="container mx-auto max-w-4xl relative z-10">
        
        {/* ==================== SECTION HEADER ==================== */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-12"
        >
          {/* Badge Header Kawaii Metal */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[11px] font-mono tracking-widest text-[var(--primary)] uppercase mb-3.5 shadow-sm">
            <FaQuestionCircle className="text-xs" />
            <span>OFFICIAL HELP & KNOWLEDGE BASE</span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-[var(--text-primary)] leading-tight uppercase font-space">
            FREQUENTLY ASKED <span className="text-[var(--primary)]">QUESTIONS</span>
          </h2>
          <p className="text-[var(--text-secondary)] text-xs sm:text-sm mt-3 max-w-xl mx-auto leading-relaxed">
            {config?.description || 'Temukan jawaban lengkap seputar cara pembelian tiket, sesi 2-Shot Cheki, official merchandise, hingga komunitas fan Kohi Sekai.'}
          </p>

          {/* Quick Filter Chips */}
          <div className="flex items-center justify-start sm:justify-center gap-2 mt-6 overflow-x-auto no-scrollbar pb-2 pt-1 px-1">
            {filterOptions.map((opt) => {
              const isActive = activeFilter === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setActiveFilter(opt.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                    isActive
                      ? 'bg-[var(--primary)] text-black border-[var(--primary)] shadow-md font-black'
                      : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)]/50 hover:text-[var(--text-primary)]'
                  }`}
                >
                  {opt.label}
                  {opt.count !== undefined && (
                    <span className={`ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-mono ${isActive ? 'bg-black/20 text-black' : 'bg-[var(--background)] text-[var(--text-secondary)]'}`}>
                      {opt.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* ==================== FAQ ACCORDION LIST ==================== */}
        <div className="space-y-3.5">
          {filteredFaqs.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center text-xs text-[var(--text-secondary)]">
              Tidak ada pertanyaan di kategori ini.
            </div>
          ) : (
            filteredFaqs.map((faq, i) => {
              const isOpen = openId === faq.id
              return (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? 'border-[var(--primary)] bg-[var(--surface)] shadow-lg shadow-[var(--primary)]/5 border-l-4 border-l-[var(--primary)]'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/40'
                  }`}
                >
                  {/* Accordion Toggle Header */}
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    className="w-full flex items-center justify-between gap-3 px-4 sm:px-6 py-4 sm:py-5 min-h-[56px] text-left transition group"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      {/* Nomor Urut Metal */}
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-black shrink-0 border transition-all ${
                        isOpen
                          ? 'bg-[var(--primary)] text-black border-[var(--primary)]'
                          : 'bg-[var(--background)] text-[var(--text-secondary)] border-[var(--border)] group-hover:text-[var(--primary)] group-hover:border-[var(--primary)]/40'
                      }`}>
                        {faq.number}
                      </span>

                      <div className="min-w-0 flex-1">
                        {/* Category Badge */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border font-mono ${getBadgeStyle(faq.category.color)}`}>
                            {faq.category.label}
                          </span>
                        </div>
                        {/* Question Text */}
                        <h3 className={`text-sm sm:text-base font-bold leading-snug transition-colors ${
                          isOpen ? 'text-[var(--text-primary)] font-black' : 'text-[var(--text-primary)]/85 group-hover:text-[var(--text-primary)]'
                        }`}>
                          {faq.tanya}
                        </h3>
                      </div>
                    </div>

                    {/* Toggle Icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-transform duration-200 ${
                      isOpen
                        ? 'bg-[var(--primary)] text-black border-[var(--primary)] rotate-180'
                        : 'bg-[var(--background)] text-[var(--text-secondary)] border-[var(--border)] group-hover:text-[var(--primary)] group-hover:border-[var(--primary)]/40'
                    }`}>
                      <FaChevronDown className="text-xs" />
                    </div>
                  </button>

                  {/* Accordion Body Answer */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <div className="px-4 sm:px-6 pb-5 pt-1">
                          <div className="h-px w-full bg-[var(--border)] mb-3.5" />
                          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line pl-0 sm:pl-11">
                            {faq.jawab}
                          </p>

                          {/* Contextual Shortcut Link */}
                          {(faq.category.id === 'cheki' || faq.category.id === 'merch' || faq.category.id === 'tiket') && (
                            <div className="mt-4 pt-3 border-t border-[var(--border)]/60 flex items-center justify-between flex-wrap gap-2 pl-0 sm:pl-11">
                              <span className="text-[11px] text-[var(--text-secondary)]">
                                Ingin langsung memesan item ini?
                              </span>
                              <button
                                type="button"
                                onClick={() => navigate('/shop')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)]/15 hover:bg-[var(--primary)]/25 text-[var(--primary)] border border-[var(--primary)]/30 text-xs font-bold transition active:scale-95"
                              >
                                <FaShoppingBag className="text-xs" />
                                <span>Buka Halaman Shop</span>
                                <FaArrowRight className="text-[10px]" />
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })
          )}
        </div>

        {/* ==================== CONTACT PERSON & SUPPORT DESK ==================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 sm:mt-16"
        >
          <div className="p-5 sm:p-7 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xl relative overflow-hidden">
            {/* Top Bar Header */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-[var(--border)] flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-[11px] font-black tracking-widest text-[var(--text-primary)] uppercase font-mono">
                  KOHI SEKAI · FAN HELPLINE & BOOKING
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold font-mono">
                Crew Online & Siap Membantu
              </span>
            </div>

            {/* Layout: Responsif Manual (Desktop & Mobile) */}
            {/* DESKTOP LAYOUT (hidden md:flex) */}
            <div className="hidden md:flex items-center justify-between gap-6">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                  <FaWhatsapp />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-black text-[var(--text-primary)] uppercase tracking-wide">
                      {cpData.name} (Official CP)
                    </h4>
                    <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[8px]" title="Terverifikasi">
                      <FaCheck />
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Hubungi kami untuk tanya jawab event, pembelian tiket rombongan, atau kolaborasi panggung.
                  </p>
                  <p className="text-sm font-mono font-black text-[var(--primary)] mt-1">
                    +{cpData.phone.replace(/[^0-9]/g, '')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <a
                  href={`https://wa.me/${cpData.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-md active:scale-95"
                >
                  <FaWhatsapp className="text-base" /> Chat WhatsApp
                </a>
                <a
                  href="https://instagram.com/kohisekai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-[var(--surface)] hover:bg-[var(--border)] border border-[var(--border)] hover:border-[var(--primary)]/50 text-[var(--text-primary)] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 active:scale-95"
                >
                  <FaInstagram className="text-base text-[var(--primary)]" /> DM Instagram
                </a>
              </div>
            </div>

            {/* MOBILE LAYOUT (md:hidden) */}
            <div className="md:hidden space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xl shrink-0">
                  <FaWhatsapp />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-black text-[var(--text-primary)] uppercase">
                      {cpData.name} (Official CP)
                    </h4>
                    <span className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[7px]">
                      <FaCheck />
                    </span>
                  </div>
                  <p className="text-xs font-mono font-black text-[var(--primary)] mt-0.5">
                    +{cpData.phone.replace(/[^0-9]/g, '')}
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                Ada pertanyaan seputar pemesanan tiket, cheki, atau merchandise? Crew Kohi Sekai siap membantu melalui WhatsApp atau Instagram.
              </p>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <a
                  href={`https://wa.me/${cpData.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-emerald-500 text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm active:scale-95 text-center"
                >
                  <FaWhatsapp className="text-sm" /> WhatsApp
                </a>
                <a
                  href="https://instagram.com/kohisekai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 text-center"
                >
                  <FaInstagram className="text-sm text-[var(--primary)]" /> Instagram
                </a>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}

export default KSFAQSection

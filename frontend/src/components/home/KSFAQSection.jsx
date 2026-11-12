import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FaChevronDown,
  FaWhatsapp,
  FaInstagram,
  FaCheck,
  FaArrowRight,
  FaShoppingBag,
  FaTicketAlt,
  FaCameraRetro,
  FaShoppingCart,
  FaUsers,
  FaCalendarAlt,
  FaQuestionCircle
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

// Helper deteksi kategori otomatis
const detectCategory = (q = '', a = '') => {
  const text = `${q} ${a}`.toLowerCase()
  if (text.includes('cheki') || text.includes('polaroid') || text.includes('2-shot')) {
    return { id: 'cheki', label: '2-Shot Cheki', Icon: FaCameraRetro }
  }
  if (text.includes('merch') || text.includes('kaos') || text.includes('t-shirt') || text.includes('lightstick') || text.includes('photocard') || text.includes('standee')) {
    return { id: 'merch', label: 'Merchandise', Icon: FaShoppingCart }
  }
  if (text.includes('tiket') || text.includes('ots') || text.includes('beli') || text.includes('checkout') || text.includes('harga')) {
    return { id: 'tiket', label: 'Tiket & OTS', Icon: FaTicketAlt }
  }
  if (text.includes('fanbase') || text.includes('komunitas') || text.includes('akun') || text.includes('fan id')) {
    return { id: 'fanbase', label: 'Fanbase', Icon: FaUsers }
  }
  if (text.includes('event') || text.includes('kota') || text.includes('jakarta') || text.includes('konser') || text.includes('jadwal')) {
    return { id: 'event', label: 'Tour & Event', Icon: FaCalendarAlt }
  }
  return { id: 'umum', label: 'Info Official', Icon: FaCheck }
}

const KSFAQSection = ({ faqs = [], config = {} }) => {
  const navigate = useNavigate()
  const [openId, setOpenId] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')

  // Normalisasi data dari DB
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
    { id: 'all',     label: 'Semua',     Icon: null },
    { id: 'tiket',   label: 'Tiket',     Icon: FaTicketAlt },
    { id: 'cheki',   label: 'Cheki',     Icon: FaCameraRetro },
    { id: 'merch',   label: 'Merch',     Icon: FaShoppingCart },
    { id: 'fanbase', label: 'Fanbase',   Icon: FaUsers },
    { id: 'event',   label: 'Events',    Icon: FaCalendarAlt },
  ]

  return (
    <section className="py-14 sm:py-24 px-4 bg-background bg-pattern-dots border-t border-border relative overflow-hidden font-outfit text-text-primary">
      <div className="container mx-auto max-w-3xl relative z-10">

        {/* ==================== SECTION HEADER ==================== */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="text-center mb-10 sm:mb-12"
        >
          {/* Badge senada tema Shop */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] sm:text-xs font-black uppercase tracking-wider mb-3">
            <FaQuestionCircle className="text-xs" />
            <span>KNOWLEDGE BASE & BANTUAN</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-text-primary leading-tight uppercase font-space">
            FREQUENTLY ASKED <span className="text-primary">QUESTIONS</span>
          </h2>
          <p className="text-text-secondary text-xs sm:text-sm mt-2 max-w-lg mx-auto leading-relaxed">
            {config?.description || 'Jawaban lengkap seputar tiket, sesi 2-Shot Cheki, official merchandise, hingga fanbase Kohi Sekai.'}
          </p>

          {/* Filter Bar Kapsul Selaras Halaman Shop */}
          <div className="mt-6 flex items-center justify-center">
            <div className="p-1 rounded-2xl bg-surface border border-border inline-flex gap-1 overflow-x-auto no-scrollbar max-w-full shadow-md">
              {filterOptions.map((opt) => {
                const isActive = activeFilter === opt.id
                const Icon = opt.Icon
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setActiveFilter(opt.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                      isActive
                        ? 'bg-primary text-white shadow-sm font-black'
                        : 'text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    {Icon && <Icon className="text-[10px] shrink-0" />}
                    <span>{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* ==================== FAQ ACCORDION LIST ==================== */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="p-10 rounded-2xl bg-surface border border-border text-center text-sm text-text-secondary">
              Belum ada pertanyaan di kategori ini.
            </div>
          ) : (
            filteredFaqs.map((faq, i) => {
              const isOpen = openId === faq.id
              const CategoryIcon = faq.category.Icon
              return (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? 'border-primary/60 bg-surface shadow-md'
                      : 'border-border bg-surface hover:border-primary/30'
                  }`}
                >
                  {/* Accordion Toggle Header */}
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    className="w-full flex items-start gap-3.5 px-4 sm:px-6 py-4 text-left transition group"
                    aria-expanded={isOpen}
                  >
                    {/* Nomor Urut */}
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-mono font-black shrink-0 border transition-all tabular-nums mt-0.5 ${
                      isOpen
                        ? 'bg-primary text-white border-primary'
                        : 'bg-background text-text-secondary border-border group-hover:border-primary/40 group-hover:text-primary'
                    }`}>
                      {faq.number}
                    </span>

                    <div className="min-w-0 flex-1">
                      {/* Badge Kategori Netral / Soft Coffee */}
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          isOpen
                            ? 'bg-primary/10 text-primary border-primary/25'
                            : 'bg-background text-text-secondary border-border'
                        }`}>
                          {CategoryIcon && <CategoryIcon className="text-[9px]" />}
                          {faq.category.label}
                        </span>
                      </div>
                      <h3 className={`text-sm sm:text-base font-bold leading-snug transition-colors ${
                        isOpen ? 'text-text-primary' : 'text-text-primary/90 group-hover:text-text-primary'
                      }`}>
                        {faq.tanya}
                      </h3>
                    </div>

                    {/* Toggle Icon */}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-200 mt-0.5 ${
                      isOpen
                        ? 'bg-primary text-white border-primary rotate-180'
                        : 'bg-background text-text-secondary border-border group-hover:border-primary/40'
                    }`}>
                      <FaChevronDown className="text-[10px]" />
                    </div>
                  </button>

                  {/* Accordion Body Answer */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-4 sm:px-6 pb-5 pt-0">
                          <div className="ml-11.5">
                            <div className="h-px w-full bg-border mb-3.5" />
                            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                              {faq.jawab}
                            </p>

                            {/* Tombol ke Shop */}
                            {(faq.category.id === 'cheki' || faq.category.id === 'merch' || faq.category.id === 'tiket') && (
                              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between flex-wrap gap-2">
                                <span className="text-[11px] text-text-secondary">
                                  Ingin langsung memesan tiket / produk ini?
                                </span>
                                <button
                                  type="button"
                                  onClick={() => navigate('/shop')}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold transition hover:opacity-90 active:scale-95"
                                >
                                  <FaShoppingBag className="text-xs" />
                                  <span>Buka Shop</span>
                                  <FaArrowRight className="text-[10px]" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })
          )}
        </div>

        {/* ==================== CONTACT PERSON & MANAGEMENT DESK ==================== */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="mt-10 sm:mt-14"
        >
          <div className="p-5 sm:p-7 rounded-2xl bg-surface border border-border shadow-md">
            {/* Top Bar Header */}
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-border flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <span className="text-xs font-black tracking-wider text-text-primary uppercase font-space">
                  MANAGEMENT & BOOKING HELPLINE
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold font-mono">
                Official Contact Person
              </span>
            </div>

            {/* DESKTOP LAYOUT (hidden md:flex) */}
            <div className="hidden md:flex items-center justify-between gap-6">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-xl shrink-0">
                  <FaWhatsapp />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-sm font-black text-text-primary uppercase tracking-wide">
                      {cpData.name}
                    </h4>
                    <span className="w-3.5 h-3.5 rounded-full bg-primary text-white flex items-center justify-center text-[7px]" title="Terverifikasi">
                      <FaCheck />
                    </span>
                    <span className="text-[11px] text-text-secondary font-medium">· Official CP & Manager</span>
                  </div>
                  <p className="text-sm font-mono font-black text-primary tabular-nums">
                    +{cpData.phone.replace(/[^0-9]/g, '')}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Untuk booking, mengisi acara, kolaborasi, sponsorship, atau pertanyaan managerial lainnya.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <a
                  href={`https://wa.me/${cpData.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-primary hover:opacity-90 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm active:scale-95"
                >
                  <FaWhatsapp className="text-sm" /> Chat WhatsApp
                </a>
                <a
                  href="https://instagram.com/kohisekai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-background hover:bg-border/30 border border-border hover:border-primary/40 text-text-primary text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 active:scale-95"
                >
                  <FaInstagram className="text-sm text-primary" /> DM Instagram
                </a>
              </div>
            </div>

            {/* MOBILE LAYOUT (md:hidden) */}
            <div className="md:hidden space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-lg shrink-0">
                  <FaWhatsapp />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-black text-text-primary uppercase">
                      {cpData.name}
                    </h4>
                    <span className="w-3.5 h-3.5 rounded-full bg-primary text-white flex items-center justify-center text-[7px]">
                      <FaCheck />
                    </span>
                    <span className="text-[10px] text-text-secondary">· Manager</span>
                  </div>
                  <p className="text-xs font-mono font-black text-primary tabular-nums mt-0.5">
                    +{cpData.phone.replace(/[^0-9]/g, '')}
                  </p>
                </div>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed">
                Hubungi CP untuk keperluan booking, mengisi acara, kolaborasi, sponsorship, atau pertanyaan managerial lainnya.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={`https://wa.me/${cpData.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-95 text-center"
                >
                  <FaWhatsapp className="text-sm" /> WhatsApp
                </a>
                <a
                  href="https://instagram.com/kohisekai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-background border border-border text-text-primary text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 text-center"
                >
                  <FaInstagram className="text-sm text-primary" /> Instagram
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

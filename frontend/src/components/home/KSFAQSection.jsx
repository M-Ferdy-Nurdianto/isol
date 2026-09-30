import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaChevronDown, FaQuestionCircle, FaWhatsapp, FaCheck } from 'react-icons/fa'

const DEFAULT_FAQS = [
  { id: 1, pertanyaan: 'Bagaimana cara membeli tiket / OTS Kohi Sekai?', jawaban: 'Kamu bisa langsung memesan melalui halaman Shop di website ini. Pilih event, isi data, lalu submit. Kami akan konfirmasi via WhatsApp atau Instagram dalam 1x24 jam.' },
  { id: 2, pertanyaan: 'Apa itu Cheki dan bagaimana cara memesan?', jawaban: 'Cheki adalah foto polaroid eksklusif bersama member Kohi Sekai yang bisa kamu pesan di halaman Shop. Tersedia pilihan member individu maupun grup (2-shot).' },
  { id: 3, pertanyaan: 'Apakah ada merchandise resmi Kohi Sekai?', jawaban: 'Ya! Kami menjual berbagai merchandise resmi di halaman Shop, mulai dari photocard, kaos, hingga item eksklusif edisi terbatas. Stok terbatas, jadi jangan sampai ketinggalan.' },
  { id: 4, pertanyaan: 'Bagaimana cara bergabung dengan fanbase Kohi Sekai?', jawaban: 'Ikuti kami di Instagram, TikTok, dan bergabung di WhatsApp Channel kami untuk info terbaru. Fanbase resmi akan diumumkan segera setelah komunitas berkembang!' },
  { id: 5, pertanyaan: 'Apakah event Kohi Sekai selalu di Jakarta?', jawaban: 'Tidak. Kami berencana mengadakan event di berbagai kota di Indonesia. Pantau terus halaman event kami untuk informasi lokasi terbaru.' },
]

const FAQItem = ({ faq, isOpen, onToggle, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isOpen
          ? 'border-primary/40 bg-primary/5 shadow-lg shadow-primary/5'
          : 'border-border bg-surface hover:border-primary/20'
      }`}
    >
      <button
        onClick={onToggle}
        className="group w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
        aria-expanded={isOpen}
      >
        <span className={`text-sm sm:text-base font-bold leading-snug transition-colors ${isOpen ? 'text-text-primary' : 'text-text-primary/80 group-hover:text-text-primary'}`}>
          {faq.pertanyaan || faq.q}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <FaChevronDown className={`transition-colors ${isOpen ? 'text-primary' : 'text-text-secondary/50'}`} size={14} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="px-6 pb-5">
              <div className="h-px w-full bg-primary/20 mb-4" />
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                {faq.jawaban || faq.a}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const KSFAQSection = ({ faqs = [], config = {} }) => {
  const [openId, setOpenId] = useState(null)
  const displayFaqs = faqs.length > 0 ? faqs : DEFAULT_FAQS

  return (
    <section className="py-20 sm:py-32 px-4 bg-surface relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-text-primary leading-none uppercase">
            {config?.title || 'FAQ'}
          </h2>
          <p className="text-text-secondary text-sm mt-4 max-w-md mx-auto">
            {config?.description || 'Ada yang ingin ditanyakan? Cek dulu FAQ kami sebelum menghubungi kami langsung.'}
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {displayFaqs.map((faq, i) => {
            const currentId = faq.id || `faq-${i}`
            return (
              <FAQItem
                key={currentId}
                faq={faq}
                index={i}
                isOpen={openId === currentId}
                onToggle={() => setOpenId(openId === currentId ? null : currentId)}
              />
            )
          })}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-text-secondary text-sm mb-4">Punya pertanyaan? DM Instagram kami</p>
          <a
            href="https://instagram.com/kohisekai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary font-black text-sm uppercase tracking-widest px-6 py-3 rounded-full transition-all border border-primary/20 hover:border-primary/40 shadow-lg"
          >
            <FaQuestionCircle />
            Tanya via IG
          </a>
          
          {(() => {
            let name = 'Kiki'
            let phone = ''
            try {
              const cp = typeof config?.faq_cp === 'string' ? JSON.parse(config.faq_cp) : config?.faq_cp
              if (cp && cp.name) name = cp.name
              if (cp && cp.phone) phone = cp.phone
            } catch(e) {}

            return (
              <div className="mt-16 max-w-xl mx-auto relative group">
                <div className="relative p-6 sm:p-8 rounded-2xl bg-background border border-white/10 flex flex-col shadow-2xl">
                  {/* Branding Header */}
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/50">
                    <div className="text-sm font-black tracking-widest text-text-primary">
                      KOHI<span className="text-primary">SEKAI</span>
                    </div>
                    <div className="inline-flex items-center justify-center px-3 py-1 rounded bg-primary text-black text-[10px] font-black uppercase tracking-widest shadow-md shadow-primary/20">
                      Official Contact Person
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    {/* Icon Container Bermerk Kohi Sekai */}
                    <div className="w-16 h-16 shrink-0 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 rotate-3 group-hover:rotate-6 transition-transform">
                      <FaWhatsapp className="text-4xl text-black" />
                    </div>
                    
                    {/* Identity */}
                    <div className="flex-1 text-center sm:text-left">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                        Untuk Kerja Sama & Booking Event
                      </h4>
                      <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                        <h3 className="text-2xl font-black text-text-primary uppercase tracking-tight">{name}</h3>
                        {/* Micro-badge Terverifikasi */}
                        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-[8px]" title="Official Account">
                          <FaCheck />
                        </div>
                      </div>
                      <p className="text-lg text-primary font-black tracking-widest mb-6">
                        {phone || '(Nomor Menyusul)'}
                      </p>
                      
                      {/* Action Button */}
                      {phone ? (
                        <a 
                          href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-primary hover:bg-white text-black font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-primary/20 hover:-translate-y-1 w-full sm:w-auto"
                        >
                          <FaWhatsapp className="text-xl" />
                          Chat via WhatsApp
                        </a>
                      ) : (
                        <div className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-surface border border-border text-zinc-500 font-bold text-sm uppercase tracking-widest w-full sm:w-auto cursor-not-allowed">
                          Segera Hadir
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </motion.div>
      </div>
    </section>
  )
}

export default KSFAQSection

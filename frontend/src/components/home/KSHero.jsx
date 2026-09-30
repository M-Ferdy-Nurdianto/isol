import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FaArrowRight, FaChevronDown } from 'react-icons/fa'

const KSHero = ({ config = {}, events = [] }) => {
  const nextEvent = events[0] || null

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* Background radial accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-accent/4 blur-[120px]" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] rounded-full bg-secondary/15 blur-[100px]" />
      </div>

      {/* Decorative grid lines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
        style={{ backgroundImage: 'linear-gradient(var(--text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
      />



      {/* Corner accent label */}
      <div className="absolute top-24 sm:top-28 left-4 sm:left-8 z-10">
        <span className="text-[9px] sm:text-[10px] font-black tracking-[0.4em] text-text-secondary/50 uppercase block">
          {config?.corner_left_1 || 'コーヒーの世界へ'}
        </span>
        <span className="text-[9px] sm:text-[10px] font-black tracking-[0.3em] text-primary/60 uppercase block mt-0.5">
          {config?.corner_left_2 || 'Kohi Sekai 2026'}
        </span>
      </div>
      
      <div className="absolute top-24 sm:top-28 right-4 sm:right-8 z-10 text-right">
        <span className="text-[9px] sm:text-[10px] font-black tracking-[0.4em] text-text-secondary/50 uppercase block">
          {config?.corner_right_1 || 'ラテ · マキアート'}
        </span>
        <span className="text-[9px] sm:text-[10px] font-black tracking-[0.3em] text-accent/60 uppercase block mt-0.5">
          {config?.corner_right_2 || 'アフォガート'}
        </span>
      </div>

      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto pt-20 pb-16">
        {/* Pre-title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-3 mb-6 sm:mb-8"
        >
          <div className="h-px w-12 bg-primary/50" />
          <span className="text-[10px] sm:text-xs font-black tracking-[0.5em] text-primary uppercase">
            {config?.tagline || 'コーヒーの世界へようこそ'}
          </span>
          <div className="h-px w-12 bg-primary/50" />
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-[14vw] sm:text-[12vw] md:text-[10vw] lg:text-[9vw] font-black uppercase tracking-tighter leading-none text-text-primary mb-2"
        >
          {config?.title ? (
            config.title
          ) : (
            <>
              KOHI<br className="sm:hidden" />
              <span className="text-primary"> SEKAI</span>
            </>
          )}
        </motion.h1>

        {/* Katakana accent */}
        {config?.bottom_title_accent && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-sm sm:text-base md:text-xl font-black tracking-[0.3em] text-primary/70 uppercase mt-2 mb-6 sm:mb-8"
          >
            {config.bottom_title_accent}
          </motion.p>
        )}

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-sm sm:text-base md:text-lg text-text-secondary max-w-xl mx-auto leading-relaxed mb-10 sm:mb-12"
        >
          {config?.subtitle || 'Tiga rasa, satu dunia. Kohi Sekai hadir membawa energi idol yang hangat, kuat, dan penuh semangat.'}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to={config?.cta_1_link || "/shop"}
            className="group flex items-center gap-3 bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-widest px-8 py-4 rounded-full transition-all duration-200 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-95"
          >
            {config?.cta_1_text || "Lihat Jadwal"}
            <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to={config?.cta_2_link || "/about"}
            className="flex items-center gap-3 border border-border hover:border-primary text-text-primary hover:text-primary font-bold text-sm uppercase tracking-widest px-8 py-4 rounded-full transition-all duration-200 hover:-translate-y-0.5 active:scale-95 bg-surface/50"
          >
            {config?.cta_2_text || "Kenali Kami"}
          </Link>
        </motion.div>

        {/* Upcoming event badge */}
        {nextEvent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 inline-flex items-center gap-3 bg-surface border border-border rounded-full px-5 py-2.5"
          >
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-bold text-text-secondary">
              Event Terdekat:
            </span>
            <span className="text-xs font-black text-text-primary">
              {nextEvent.nama_event || nextEvent.nama}
            </span>
            <span className="text-xs text-primary font-bold">
              {nextEvent.tanggal} {nextEvent.bulan}
            </span>
          </motion.div>
        )}
      </div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <FaChevronDown className="text-text-secondary/40" size={20} />
        </motion.div>
        <span className="text-[9px] font-black tracking-[0.4em] text-text-secondary/40 uppercase">Scroll</span>
      </motion.div>
    </section>
  )
}

export default KSHero

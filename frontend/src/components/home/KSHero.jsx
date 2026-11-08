import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FaArrowRight, FaChevronDown } from 'react-icons/fa'

const KSHero = ({ config = {}, events = [] }) => {
  const nextEvent = events[0] || null

  return (
    <section className="relative min-h-[90svh] sm:min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background bg-pattern-cross pt-4 sm:pt-0">


      {/* Structural Vertical Framing Guides */}
      <div className="absolute inset-y-0 inset-x-4 max-w-5xl mx-auto border-x border-white/[0.03] pointer-events-none hidden sm:block" aria-hidden="true" />

      {/* Precision Tech Crosshair Anchors */}
      <div className="absolute top-1/3 left-6 text-text-primary/15 select-none pointer-events-none text-xs font-mono hidden sm:block" aria-hidden="true">+</div>
      <div className="absolute top-1/3 right-6 text-text-primary/15 select-none pointer-events-none text-xs font-mono hidden sm:block" aria-hidden="true">+</div>
      <div className="absolute bottom-1/3 left-6 text-text-primary/15 select-none pointer-events-none text-xs font-mono hidden sm:block" aria-hidden="true">+</div>
      <div className="absolute bottom-1/3 right-6 text-text-primary/15 select-none pointer-events-none text-xs font-mono hidden sm:block" aria-hidden="true">+</div>




      {/* Corner accent label (Desktop only - hidden on mobile to prevent clutter) */}
      <div className="absolute top-24 sm:top-28 left-4 sm:left-8 z-10 hidden sm:block">
        <span className="text-[9px] sm:text-[10px] font-black tracking-[0.4em] text-text-secondary/50 uppercase block">
          {config?.corner_left_1 || 'コーヒーの世界へ'}
        </span>
        <span className="text-[9px] sm:text-[10px] font-black tracking-[0.3em] text-primary/60 uppercase block mt-0.5">
          {config?.corner_left_2 || 'Kohi Sekai 2026'}
        </span>
      </div>
      
      <div className="absolute top-24 sm:top-28 right-4 sm:right-8 z-10 text-right hidden sm:block">
        <span className="text-[9px] sm:text-[10px] font-black tracking-[0.4em] text-text-secondary/50 uppercase block">
          {config?.corner_right_1 || 'ラテ · マキアート'}
        </span>
        <span className="text-[9px] sm:text-[10px] font-black tracking-[0.3em] text-accent/60 uppercase block mt-0.5">
          {config?.corner_right_2 || 'アフォガート'}
        </span>
      </div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto pt-6 sm:pt-20 pb-8 sm:pb-16">
        {/* Pre-title */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center gap-3 mb-4 sm:mb-6"
        >
          <div className="h-px w-8 sm:w-12 bg-primary/50" />
          <span className="text-[10px] sm:text-xs font-black tracking-[0.35em] text-primary uppercase">
            {config?.tagline || 'コーヒーの世界へようこそ'}
          </span>
          <div className="h-px w-8 sm:w-12 bg-primary/50" />
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight leading-none text-text-primary mb-2 sm:mb-3"
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
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xs sm:text-base md:text-xl font-black tracking-[0.25em] text-primary/70 uppercase mt-1 mb-4 sm:mb-6"
          >
            {config.bottom_title_accent}
          </motion.p>
        )}

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-xs sm:text-base text-text-secondary max-w-lg mx-auto leading-relaxed mb-6 sm:mb-10 px-2"
        >
          {config?.subtitle || 'Tiga rasa, satu dunia. Kohi Sekai hadir membawa energi idol yang hangat, kuat, dan penuh semangat.'}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xs sm:max-w-none mx-auto"
        >
          <Link
            to={config?.cta_1_link || "/shop"}
            className="w-full sm:w-auto min-h-[46px] group flex items-center justify-center gap-2.5 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest px-7 py-3 rounded-full transition-all duration-200 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-95"
          >
            {config?.cta_1_text || "Lihat Jadwal"}
            <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to={config?.cta_2_link || "/about"}
            className="w-full sm:w-auto min-h-[46px] flex items-center justify-center gap-2.5 border border-border hover:border-primary text-text-primary hover:text-primary font-bold text-xs uppercase tracking-widest px-7 py-3 rounded-full transition-all duration-200 hover:-translate-y-0.5 active:scale-95 bg-surface/50"
          >
            {config?.cta_2_text || "Kenali Kami"}
          </Link>
        </motion.div>

        {/* Upcoming event badge */}
        {nextEvent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 sm:mt-10 inline-flex items-center gap-2.5 bg-surface border border-border rounded-full px-4 py-2 max-w-[95%] truncate text-left"
          >
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" />
            <span className="text-[11px] font-bold text-text-secondary truncate">
              Event Terdekat:
            </span>
            <span className="text-[11px] font-black text-text-primary truncate">
              {nextEvent.nama_event || nextEvent.nama}
            </span>
            <span className="text-[11px] text-primary font-bold shrink-0">
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

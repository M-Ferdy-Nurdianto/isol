import React from 'react'
import { Link } from 'react-router-dom'
import { FaArrowRight, FaChevronDown } from 'react-icons/fa'

export default function KSHeroMobile({ config = {}, events = [] }) {
  const nextEvent = events[0] || null

  return (
    <section 
      className="relative w-full overflow-hidden bg-background bg-pattern-cross flex flex-col items-center justify-between box-border"
      style={{
        minHeight: '100dvh',
        paddingTop: 'calc(56px + env(safe-area-inset-top, 0px) + 8px)',
        paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* =====================================================================
          1. DEKORASI DESKTOP (Dipindah & dikecilkan, absolute di tepi layar,
             pointer-events: none agar tidak memicu overflow atau makan ruang)
          ===================================================================== */}
      {/* Vertical Framing Rails di Tepi Layar */}
      <div 
        className="absolute inset-y-0 left-3 right-3 border-x border-white/[0.03] pointer-events-none select-none"
        aria-hidden="true" 
      />

      {/* Tech Crosshair Anchors (+) */}
      <div className="absolute top-1/4 left-3 text-[10px] font-mono text-text-primary/10 select-none pointer-events-none" aria-hidden="true">+</div>
      <div className="absolute top-1/4 right-3 text-[10px] font-mono text-text-primary/10 select-none pointer-events-none" aria-hidden="true">+</div>
      <div className="absolute bottom-1/4 left-3 text-[10px] font-mono text-text-primary/10 select-none pointer-events-none" aria-hidden="true">+</div>
      <div className="absolute bottom-1/4 right-3 text-[10px] font-mono text-text-primary/10 select-none pointer-events-none" aria-hidden="true">+</div>

      {/* Teks Jepang Pojok Kiri (Kecil, elegan, di dalam batas layar) */}
      <div className="absolute top-[62px] left-3.5 z-0 pointer-events-none select-none text-left opacity-35 max-w-[120px]">
        <span className="text-[8px] font-black tracking-[0.2em] text-text-secondary uppercase block truncate">
          {config?.corner_left_1 || 'コーヒーの世界へ'}
        </span>
        <span className="text-[7px] font-black tracking-[0.15em] text-primary uppercase block mt-0.5 truncate">
          {config?.corner_left_2 || 'Kohi Sekai 2026'}
        </span>
      </div>

      {/* Teks Jepang Pojok Kanan (Kecil, elegan, di dalam batas layar) */}
      <div className="absolute top-[62px] right-3.5 z-0 pointer-events-none select-none text-right opacity-35 max-w-[120px]">
        <span className="text-[8px] font-black tracking-[0.2em] text-text-secondary uppercase block truncate">
          {config?.corner_right_1 || 'ラテ · マキアート'}
        </span>
        <span className="text-[7px] font-black tracking-[0.15em] text-accent uppercase block mt-0.5 truncate">
          {config?.corner_right_2 || 'アフォガート'}
        </span>
      </div>

      {/* =====================================================================
          2. KONTEN UTAMA HERO (Single Column, Width 100%, Padding 20px,
             Center Vertikal & Horisontal, Skala Proporsional clamp())
          ===================================================================== */}
      <div className="w-full max-w-[390px] mx-auto px-5 box-border flex-1 flex flex-col items-center justify-center text-center relative z-10">
        
        {/* 1. WE ARE (Pre-title dengan aksen garis simetris) */}
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <span className="h-[1px] w-6 bg-primary inline-block opacity-60 shrink-0" />
          <span className="text-[10px] font-black tracking-[0.35em] text-primary uppercase font-mono">
            {config?.tagline || 'WE ARE'}
          </span>
          <span className="h-[1px] w-6 bg-primary inline-block opacity-60 shrink-0" />
        </div>

        {/* 2. KOHI SEKAI (Judul Utama Dual Tone - Proporsional clamp()) */}
        <h1 
          style={{ fontSize: 'clamp(2.1rem, 9.5vw, 2.75rem)' }}
          className="font-black uppercase tracking-tight leading-none text-text-primary mb-2.5 text-center select-none"
        >
          KOHI <span className="text-primary">SEKAI</span>
        </h1>

        {/* Katakana Accent (Jika di-set di config) */}
        {config?.bottom_title_accent && (
          <p className="text-[11px] font-black tracking-[0.2em] text-primary/70 uppercase mb-2 text-center">
            {config.bottom_title_accent}
          </p>
        )}

        {/* 3. Paragraf Subtitle (Max ~32ch, Text-Align Center, Wrap Normal) */}
        <p 
          style={{ maxWidth: '32ch', fontSize: 'clamp(0.75rem, 3.2vw, 0.875rem)' }}
          className="text-text-secondary leading-relaxed mb-4 text-center mx-auto text-balance"
        >
          {config?.subtitle || 'Tiga rasa, satu dunia. Kohi Sekai hadir membawa energi idol yang hangat, kuat, dan penuh semangat.'}
        </p>

        {/* 4. Dua Tombol CTA (Ditumpuk Vertikal, Lebar Penuh max 320px, Tinggi min 48px) */}
        <div className="w-full max-w-[320px] flex flex-col items-center gap-2.5 mx-auto mb-3.5">
          <Link
            to={config?.cta_1_link || "/shop"}
            className="w-full min-h-[48px] flex items-center justify-center gap-2.5 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-full shadow-md shadow-primary/20 active:scale-95 transition-transform"
          >
            {config?.cta_1_text || "Lihat Jadwal"}
            <FaArrowRight size={11} />
          </Link>
          <Link
            to={config?.cta_2_link || "/about"}
            className="w-full min-h-[48px] flex items-center justify-center gap-2.5 border border-border hover:border-primary text-text-primary hover:text-primary font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-full active:scale-95 transition-transform bg-surface/50"
          >
            {config?.cta_2_text || "Kenali Kami"}
          </Link>
        </div>

        {/* 5. Pill "Event Terdekat" (Gaya Desktop, Wrap 2 Baris jika panjang, Tanggal selalu terlihat) */}
        {nextEvent && (
          <div className="w-full max-w-[320px] mx-auto bg-surface border border-border rounded-2xl px-3.5 py-2 flex items-center justify-center gap-2 text-center">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" />
            <div className="text-[11px] leading-snug flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5">
              <span className="font-bold text-text-secondary shrink-0">
                Event Terdekat:
              </span>
              <span className="font-black text-text-primary">
                {nextEvent.nama_event || nextEvent.nama}
              </span>
              <span className="text-primary font-bold shrink-0">
                {nextEvent.tanggal} {nextEvent.bulan}
              </span>
            </div>
          </div>
        )}

      </div>

      {/* =====================================================================
          3. SCROLL INDICATOR (Pinned di Dasar Hero, Selalu Terlihat,
             di Atas Bottom Capsule Navbar)
          ===================================================================== */}
      <div className="w-full flex flex-col items-center justify-center gap-1 z-10 pointer-events-none select-none pt-2">
        <FaChevronDown className="text-text-secondary/40 animate-bounce" size={14} />
        <span className="text-[8px] font-black tracking-[0.3em] text-text-secondary/40 uppercase">
          Scroll
        </span>
      </div>
    </section>
  )
}

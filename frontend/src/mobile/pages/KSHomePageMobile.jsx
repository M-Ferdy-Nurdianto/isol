import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FaTicketAlt,
  FaMusic,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaClock,
  FaChevronRight,
  FaChevronDown,
  FaChevronUp,
  FaCrown,
  FaNewspaper,
  FaInstagram,
  FaTiktok,
  FaYoutube,
  FaWhatsapp,
  FaQuestionCircle,
  FaUsers
} from 'react-icons/fa'
import { useHomeData } from '@shared/hooks/useHomeData'
import MobileAppShell from '../components/layout/MobileAppShell'
import MobileBottomSheet from '../components/common/MobileBottomSheet'

/**
 * KSHomePageMobile (Native-Feel Home Page for Mobile App)
 * Strictly adheres to Deep Coffee Design:
 * - Solid surfaces (#241E19), border (#3A2E24)
 * - NO gradients, NO backdrop-blur
 * - Thumb-friendly touch targets (min 44x44px)
 * - Horizontal swipeable member story chips
 * - Single-column event cards, leaderboard podium, news, and FAQ accordion
 */
const KSHomePageMobile = () => {
  const data = useHomeData()
  const navigate = useNavigate()

  // Selected member for detail bottom sheet
  const [selectedMember, setSelectedMember] = useState(null)
  // FAQ accordion open state
  const [expandedFaq, setExpandedFaq] = useState(null)

  if (data.loading) {
    return (
      <div className="min-h-[100dvh] bg-[var(--background)] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin mb-3" />
        <span className="text-xs font-mono font-bold text-[var(--primary)] tracking-widest uppercase">
          Kohi Sekai...
        </span>
      </div>
    )
  }

  const { events, members, faqs, news, config } = data
  const nextEvent = events?.[0] || null

  const toggleFaq = (idx) => {
    setExpandedFaq(expandedFaq === idx ? null : idx)
  }

  return (
    <MobileAppShell>
      <div className="space-y-6 pb-4">

        {/* 1. Horizontal Member Stories / Chips Carousel */}
        {members && members.length > 0 && (
          <section className="-mx-4 px-4 overflow-hidden" aria-label="Member Lineup">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-[var(--text-secondary)] font-mono">
                Member Lineup
              </span>
              <Link to="/about" className="text-[11px] font-bold text-[var(--primary)] flex items-center gap-1">
                <span>Lihat Semua</span>
                <FaChevronRight size={9} />
              </Link>
            </div>

            <div className="flex items-center gap-3.5 overflow-x-auto hide-scrollbar pb-1">
              {members.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelectedMember(member)}
                  className="flex flex-col items-center shrink-0 tap-active touch-manipulation group"
                >
                  <div className="w-16 h-16 rounded-full p-0.5 border-2 border-[var(--primary)] bg-[var(--surface)] overflow-hidden shadow-md">
                    <img
                      src={member.image_url || '/images/members/placeholder.svg'}
                      alt={member.nama}
                      className="w-full h-full rounded-full object-cover object-top"
                      loading="lazy"
                    />
                  </div>
                  <span className="text-[11px] font-bold text-[var(--text-primary)] mt-1.5 truncate max-w-[68px] leading-tight">
                    {member.nama}
                  </span>
                  <span className="text-[9px] text-[var(--primary)] font-mono leading-none">
                    {member.member_id || 'IDOL'}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 2. Hero Banner Card */}
        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-5 shadow-lg space-y-4">
          <div className="space-y-1.5">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[var(--background)] border border-[var(--border)] text-[9px] font-mono font-bold text-[var(--primary)] uppercase tracking-wider">
              Official Fan Space
            </span>
            <h1 className="text-xl font-black text-[var(--text-primary)] tracking-tight leading-snug">
              Kohi Sekai
              <span className="block text-xs font-normal text-[var(--text-secondary)] font-mono mt-0.5">
                コーヒーの世界 · Indonesian Japanese-Style Idol Group
              </span>
            </h1>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Selamat datang di dunia kopi yang manis, hangat, dan bersemangat. Dapatkan tiket 2-Shot Cheki resmi dan dukung idol favoritmu.
            </p>
          </div>

          {/* Quick Action CTAs */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <Link
              to="/shop"
              className="touch-target py-3 px-3 rounded-2xl bg-[var(--primary)] text-[var(--background)] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 tap-active shadow-md"
            >
              <FaTicketAlt className="text-sm" />
              <span>Pesan Tiket</span>
            </Link>
            <Link
              to="/music"
              className="touch-target py-3 px-3 rounded-2xl bg-[var(--background)] border border-[var(--border)] text-[var(--text-primary)] font-bold text-xs flex items-center justify-center gap-2 tap-active"
            >
              <FaMusic className="text-xs text-[var(--primary)]" />
              <span>Musik</span>
            </Link>
          </div>
        </section>

        {/* 3. Next Upcoming Event Card */}
        {nextEvent && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[var(--text-secondary)] font-mono">
                Panggung Terdekat
              </span>
              <Link to="/shop" className="text-[11px] font-bold text-[var(--primary)] flex items-center gap-1">
                <span>Jadwal Lengkap</span>
                <FaChevronRight size={9} />
              </Link>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-4 shadow-md space-y-3.5">
              <div className="flex gap-3.5 items-start">
                {/* Date Badge */}
                <div className="w-14 h-14 rounded-2xl bg-[var(--primary)] text-[var(--background)] flex flex-col items-center justify-center shrink-0 shadow-inner">
                  <span className="text-xl font-black font-mono leading-none">
                    {nextEvent.tanggal}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5 leading-none">
                    {nextEvent.bulan?.slice(0, 3)}
                  </span>
                </div>

                {/* Event Info */}
                <div className="flex-1 min-w-0">
                  <span className="inline-block px-2 py-0.5 rounded-md bg-[var(--background)] border border-[var(--border)] text-[9px] font-bold text-[var(--primary)] uppercase font-mono mb-1">
                    {nextEvent.is_special ? 'Special Stage' : 'Live Perform'}
                  </span>
                  <h3 className="text-sm font-black text-[var(--text-primary)] leading-tight truncate">
                    {nextEvent.nama_event}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mt-1.5">
                    <FaMapMarkerAlt className="text-[var(--primary)] shrink-0 text-[10px]" />
                    <span className="truncate">{nextEvent.lokasi || 'Venue Yogyakarta'}</span>
                  </div>
                  {nextEvent.jam && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] mt-0.5">
                      <FaClock className="text-[var(--text-secondary)] shrink-0 text-[10px]" />
                      <span>{nextEvent.jam}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <Link
                to={`/checkout/${nextEvent.id}?type=member`}
                className="w-full touch-target py-3 rounded-2xl bg-[var(--primary)] text-[var(--background)] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 tap-active shadow-sm"
              >
                <FaTicketAlt size={13} />
                <span>Pesan Tiket Event Ini</span>
              </Link>
            </div>
          </section>
        )}

        {/* 4. Latest News List */}
        {news && news.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-[var(--text-secondary)] font-mono">
                Kabar Terbaru
              </span>
            </div>

            <div className="space-y-2.5">
              {news.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-3.5 flex gap-3 items-center shadow-sm"
                >
                  {item.thumbnail_url && (
                    <img
                      src={item.thumbnail_url}
                      alt={item.judul}
                      className="w-16 h-16 rounded-xl object-cover bg-[var(--background)] shrink-0 border border-[var(--border)]"
                      loading="lazy"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-mono font-bold text-[var(--primary)] uppercase">
                      {item.kategori || 'News'}
                    </span>
                    <h4 className="text-xs font-bold text-[var(--text-primary)] leading-snug line-clamp-2 mt-0.5">
                      {item.judul}
                    </h4>
                    <span className="text-[10px] text-[var(--text-secondary)] mt-1 block">
                      {item.tanggal || item.created_at?.slice(0, 10)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. Mobile FAQ Accordion */}
        {faqs && faqs.length > 0 && (
          <section className="space-y-2.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-[var(--text-secondary)] font-mono">
              Pertanyaan Umum (FAQ)
            </span>

            <div className="space-y-2">
              {faqs.slice(0, 4).map((faq, idx) => {
                const isOpen = expandedFaq === idx
                return (
                  <div
                    key={faq.id || idx}
                    className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      className="w-full flex items-center justify-between p-3.5 text-left tap-active"
                    >
                      <span className="text-xs font-bold text-[var(--text-primary)] pr-2 leading-snug">
                        {faq.pertanyaan}
                      </span>
                      {isOpen ? (
                        <FaChevronUp className="text-[var(--primary)] text-xs shrink-0" />
                      ) : (
                        <FaChevronDown className="text-[var(--text-secondary)] text-xs shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-3.5 pb-3.5 pt-1 text-xs text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border)] animate-fade-in">
                        {faq.jawaban}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* 6. Social Channels Grid */}
        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-4 text-center space-y-3">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[var(--primary)]">
            Hubungkan dengan Kohi Sekai
          </span>
          <p className="text-xs text-[var(--text-secondary)]">
            Ikuti kami di media sosial resmi untuk update jadwal, konten eksklusif, dan keseruan member.
          </p>

          <div className="grid grid-cols-4 gap-2 pt-1">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="touch-target py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] flex flex-col items-center justify-center gap-1 tap-active text-[var(--text-primary)] hover:text-[var(--primary)]"
            >
              <FaInstagram className="text-base text-[var(--primary)]" />
              <span className="text-[9px] font-bold font-mono">Instagram</span>
            </a>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noreferrer"
              className="touch-target py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] flex flex-col items-center justify-center gap-1 tap-active text-[var(--text-primary)] hover:text-[var(--primary)]"
            >
              <FaTiktok className="text-base text-[var(--primary)]" />
              <span className="text-[9px] font-bold font-mono">TikTok</span>
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              className="touch-target py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] flex flex-col items-center justify-center gap-1 tap-active text-[var(--text-primary)] hover:text-[var(--primary)]"
            >
              <FaYoutube className="text-base text-[var(--primary)]" />
              <span className="text-[9px] font-bold font-mono">YouTube</span>
            </a>
            <a
              href="https://wa.me/628123456789"
              target="_blank"
              rel="noreferrer"
              className="touch-target py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] flex flex-col items-center justify-center gap-1 tap-active text-[var(--text-primary)] hover:text-[var(--primary)]"
            >
              <FaWhatsapp className="text-base text-[var(--primary)]" />
              <span className="text-[9px] font-bold font-mono">WhatsApp</span>
            </a>
          </div>
        </section>

      </div>

      {/* Member Quick Detail Bottom Sheet */}
      <MobileBottomSheet
        isOpen={Boolean(selectedMember)}
        onClose={() => setSelectedMember(null)}
        title={selectedMember?.nama}
        subtitle={selectedMember?.catchphrase || `Kohi Sekai Idol Member`}
      >
        {selectedMember && (
          <div className="space-y-4">
            <div className="w-full h-56 rounded-2xl overflow-hidden bg-[var(--background)] border border-[var(--border)] shadow-md">
              <img
                src={selectedMember.image_url || '/images/members/placeholder.svg'}
                alt={selectedMember.nama}
                className="w-full h-full object-cover object-top"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs py-1 border-b border-[var(--border)]">
                <span className="text-[var(--text-secondary)]">Panggilan</span>
                <span className="font-bold text-[var(--text-primary)]">{selectedMember.panggilan || selectedMember.nama}</span>
              </div>
              {selectedMember.salam && (
                <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--text-secondary)] italic">
                  "{selectedMember.salam}"
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedMember(null)
                  navigate('/shop')
                }}
                className="w-full touch-target py-3.5 rounded-2xl bg-[var(--primary)] text-[var(--background)] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 tap-active shadow-md"
              >
                <FaTicketAlt size={14} />
                <span>Pesan Cheki dengan {selectedMember.nama}</span>
              </button>
            </div>
          </div>
        )}
      </MobileBottomSheet>

    </MobileAppShell>
  )
}

export default KSHomePageMobile

import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { FaCalendarAlt, FaMapMarkerAlt, FaTicketAlt, FaClock, FaStar, FaArrowRight } from 'react-icons/fa'

const KSUpcomingEvent = ({ events = [], config = {} }) => {
  const navigate = useNavigate()
  const displayEvents = Array.isArray(events) && events.length > 0 ? events : []

  const handleBookEvent = (evt) => {
    if (!evt?.id) {
      navigate('/shop')
      return
    }
    navigate(`/checkout/${evt.id}`)
  }

  return (
    <section className="py-10 sm:py-20 px-4 bg-surface/50 border-y border-white/5 bg-pattern-grid relative overflow-hidden">
      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row items-start sm:items-baseline justify-between gap-3 border-b border-border pb-4 sm:pb-5"
        >
          <div>
            <p className="text-[10px] sm:text-xs font-black tracking-[0.35em] text-primary uppercase mb-1">
              Upcoming Event
            </p>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight uppercase text-text-primary leading-none">
              KOHI <span className="text-primary">STAGE</span>
            </h2>
          </div>
          <Link
            to="/shop"
            className="group inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary hover:text-primary-hover transition-colors"
          >
            <span>Lihat Seluruh Event</span>
            <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Event List Container - Jarak header ke kartu 24px-28px */}
        <div className="mt-6 sm:mt-7 space-y-6">
          {displayEvents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center py-16 rounded-3xl border border-dashed border-border bg-surface p-8 space-y-3"
            >
              <FaCalendarAlt className="text-4xl text-primary/40 mx-auto" />
              <p className="text-xs sm:text-sm text-text-secondary font-medium max-w-md mx-auto whitespace-pre-wrap">
                {config?.empty_text || 'Belum ada event yang dijadwalkan.\nPantau terus Instagram kami untuk update event terbaru!'}
              </p>
            </motion.div>
          ) : (
            displayEvents.map((event, idx) => {
              const isSpecial = Boolean(event.is_special)
              const venueName = event.nama_venue ? `${event.nama_venue}, ` : ''
              const venueLocation = event.lokasi || 'Kohi Stage Venue'
              const fullVenue = `${venueName}${venueLocation}`

              return (
                <motion.div
                  key={event.id || idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="event-card bg-surface border border-border rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 lg:p-10 shadow-sm relative overflow-hidden space-y-6 sm:space-y-8"
                >
                  {/* BARIS ATAS: Kiri (Badge, Judul, Deskripsi) & Kanan (Blok CTA ~300-340px) */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 lg:gap-8">
                    {/* Kiri */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="px-3.5 py-1 rounded-full bg-primary/10 border border-border text-primary text-xs font-black uppercase tracking-wider">
                          JADWAL STAGE UTAMA
                        </span>
                        {isSpecial && (
                          <span className="px-3.5 py-1 rounded-full bg-accent/10 border border-border text-accent text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                            <FaStar size={10} /> SPECIAL STAGE
                          </span>
                        )}
                      </div>

                      <h3 className="text-2xl sm:text-3xl md:text-[clamp(1.75rem,2.2vw,2.6rem)] font-black uppercase text-text-primary tracking-tight leading-[1.15] [text-wrap:balance] max-w-3xl">
                        {event.nama_event || event.nama || 'Kohi Sekai Stage'}
                      </h3>

                      <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-medium max-w-2xl">
                        {event.deskripsi || event.description || 'Panggung pertunjukan dan sesi interaktif 2-Shot Cheki bersama member idol Kohi Sekai.'}
                      </p>
                    </div>

                    {/* Kanan: Blok CTA (Lebar ~300-340px, rata tengah vertikal terhadap blok kiri) */}
                    <div className="w-full md:w-[300px] lg:w-[320px] shrink-0 flex flex-col items-center justify-center text-center space-y-2">
                      <span className="text-[11px] sm:text-xs text-text-secondary font-bold uppercase tracking-wider block">
                        Pemesanan Tiket Direct
                      </span>
                      <button
                        type="button"
                        onClick={() => handleBookEvent(event)}
                        className="w-full px-8 py-3.5 sm:py-4 rounded-full bg-primary hover:bg-primary-hover text-white font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 min-h-[48px] shadow-md shadow-primary/20 active:scale-[0.98]"
                      >
                        <FaTicketAlt size={14} />
                        <span>Pesan Tiket / Order</span>
                      </button>
                    </div>
                  </div>

                  {/* BARIS BAWAH: Tiga kartu info memenuhi SELURUH lebar kartu (1fr 1fr 1.5fr) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-[1fr_1fr_1.5fr] items-stretch gap-3 sm:gap-4 pt-5 sm:pt-6 border-t border-border/60">
                    {/* Kartu 1: Tanggal Event */}
                    <div className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-background border border-border min-w-0 h-full">
                      <div className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0">
                        <FaCalendarAlt className="text-primary text-sm shrink-0" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-wider text-text-secondary/70">
                          Tanggal Event
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-text-primary [overflow-wrap:anywhere] break-words">
                          {event.tanggal} {event.bulan} {event.tahun || '2026'}
                        </p>
                      </div>
                    </div>

                    {/* Kartu 2: Waktu & Sesi */}
                    <div className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-background border border-border min-w-0 h-full">
                      <div className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0">
                        <FaClock className="text-primary text-sm shrink-0" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-wider text-text-secondary/70">
                          Waktu & Sesi
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-text-primary [overflow-wrap:anywhere] break-words">
                          {event.cheki_time || event.event_time || event.waktu || '15:00 - 18:00 WIB'}
                        </p>
                      </div>
                    </div>

                    {/* Kartu 3: Lokasi / Venue (1.5fr - Terlebar, wrap 2 baris jika perlu, tidak overflow) */}
                    <div className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-background border border-border min-w-0 h-full">
                      <div className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0">
                        <FaMapMarkerAlt className="text-primary text-sm shrink-0" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-wider text-text-secondary/70">
                          Lokasi / Venue
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-text-primary [overflow-wrap:anywhere] break-words line-clamp-2 leading-snug">
                          {fullVenue}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}

export default KSUpcomingEvent

import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { FaCalendarAlt, FaMapMarkerAlt, FaTicketAlt, FaClock, FaStar, FaArrowRight } from 'react-icons/fa'

const KSUpcomingEvent = ({ events = [], config = {} }) => {
  const event = events[0] || null
  const isSpecial = event ? event.is_special : false
  const navigate = useNavigate()

  const handleBookEvent = () => {
    if (!event) {
      navigate('/shop')
      return
    }
    navigate(`/checkout/${event.id}`)
  }

  return (
    <section className="py-20 sm:py-32 px-4 bg-background relative overflow-hidden">
      <div className="container mx-auto max-w-7xl relative z-10 space-y-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-border pb-6"
        >
          <div>
            <p className="text-xs font-black tracking-[0.4em] text-primary uppercase mb-2">Upcoming Event</p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight uppercase text-text-primary leading-none">
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

        {!event ? (
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
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="bg-surface border border-border rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 shadow-sm relative overflow-hidden"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              {/* Event Information */}
              <div className="flex-1 space-y-4">
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

                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase text-text-primary tracking-tight leading-tight">
                  {event.nama_event || event.nama || 'Kohi Sekai Stage'}
                </h3>

                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-2xl font-medium">
                  {event.deskripsi || event.description || 'Panggung pertunjukan dan sesi interaktif 2-Shot Cheki bersama member idol Kohi Sekai.'}
                </p>

                {/* Metadata Grid (Samakan persis 3 info card dengan schedule) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-background border border-border">
                    <FaCalendarAlt className="text-primary text-base flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-text-secondary/70">Tanggal Event</p>
                      <p className="text-xs sm:text-sm font-bold text-text-primary">
                        {event.tanggal} {event.bulan} {event.tahun || '2026'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-background border border-border">
                    <FaClock className="text-primary text-base flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-text-secondary/70">Waktu & Sesi</p>
                      <p className="text-xs sm:text-sm font-bold text-text-primary">
                        {event.cheki_time || event.event_time || event.waktu || '15:00 - 18:00 WIB'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-background border border-border">
                    <FaMapMarkerAlt className="text-primary text-base flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-text-secondary/70">Lokasi / Venue</p>
                      <p className="text-xs sm:text-sm font-bold text-text-primary truncate">
                        {event.nama_venue ? `${event.nama_venue}, ` : ''}{event.lokasi || 'Kohi Stage Venue'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Button Column matching Schedule Event Card style */}
              <div className="lg:w-auto flex flex-col justify-center items-start lg:items-end border-t lg:border-t-0 lg:border-l border-border pt-6 lg:pt-0 lg:pl-8 space-y-3">
                <span className="text-xs text-text-secondary font-medium block">Pemesanan Tiket Direct</span>
                <button
                  onClick={handleBookEvent}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-primary hover:bg-primary-hover text-white font-black text-xs sm:text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 min-h-[48px]"
                >
                  <FaTicketAlt size={14} />
                  <span>Pesan Tiket / Order</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}

export default KSUpcomingEvent

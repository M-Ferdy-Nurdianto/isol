import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaBullhorn, FaTimes, FaInstagram, FaChevronLeft, FaChevronRight } from 'react-icons/fa'

const KSNewsSection = ({ news = [], config = {} }) => {
  const [selectedNews, setSelectedNews] = useState(null)
  const carouselRef = useRef(null)

  // Reverse to show newest first, limit to 9
  const displayNews = config?.news_items?.length > 0 
    ? [...config.news_items].reverse().slice(0, 9)
    : (Array.isArray(news) && news.length > 0 ? [...news].reverse().slice(0, 9) : [])

  const title = config?.news_title || 'News'

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }

  return (
    <section className="py-20 sm:py-32 px-4 bg-surface relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-[400px] h-[300px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />

      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-left flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-black tracking-[0.5em] text-accent uppercase mb-2">Update</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-text-primary leading-none uppercase">
              {title}
            </h2>
          </div>
          <div className="hidden sm:flex gap-2">
            <button onClick={scrollLeft} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors">
              <FaChevronLeft />
            </button>
            <button onClick={scrollRight} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors">
              <FaChevronRight />
            </button>
          </div>
        </motion.div>

        {/* Carousel or Empty State */}
        {displayNews.length > 0 ? (
          <div 
            ref={carouselRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-8 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {displayNews.map((item, idx) => (
              <motion.div
                key={item.id || idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setSelectedNews(item)}
                className="snap-start shrink-0 w-[280px] sm:w-[320px] bg-background border border-border rounded-2xl overflow-hidden cursor-pointer group hover:border-primary/50 transition-all hover:-translate-y-1 shadow-lg shadow-black/20"
              >
                <div className="h-[160px] sm:h-[180px] w-full bg-surface relative overflow-hidden">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                      <FaBullhorn className="text-4xl text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-text-primary mb-2 line-clamp-2">{item.title}</h3>
                  <p className="text-sm text-text-secondary line-clamp-2">{item.summary}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center py-20 rounded-3xl border border-dashed border-border w-full"
          >
            <FaBullhorn className="text-4xl text-accent/40 mx-auto mb-4" />
            <p className="text-text-secondary font-bold whitespace-pre-wrap">Belum ada berita.<br />Nantikan update berita terbaru dari Kohi Sekai.</p>
          </motion.div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedNews && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNews(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-background border border-border rounded-3xl overflow-hidden shadow-2xl z-10"
            >
              <button 
                onClick={() => setSelectedNews(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 z-20"
              >
                <FaTimes />
              </button>
              
              <div className="w-full aspect-video bg-surface relative">
                {selectedNews.image_url ? (
                  <img src={selectedNews.image_url} alt={selectedNews.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FaBullhorn className="text-6xl text-white/20" />
                  </div>
                )}
              </div>
              
              <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto">
                <h3 className="text-xl sm:text-2xl font-black text-text-primary mb-3 leading-tight">{selectedNews.title}</h3>
                <div className="text-text-secondary text-sm sm:text-base leading-relaxed mb-6 whitespace-pre-line">
                  {selectedNews.content || selectedNews.summary}
                </div>
                
                {selectedNews.source_url || selectedNews.ig_link ? (
                  <a 
                    href={selectedNews.source_url || selectedNews.ig_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-primary/25"
                  >
                    Baca Selengkapnya (Sumber Asli)
                  </a>
                ) : (
                  <button onClick={() => setSelectedNews(null)} className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-xl transition-all">
                    Tutup
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default KSNewsSection

import { motion } from 'framer-motion'
import { FaSpotify } from 'react-icons/fa'

const SpotifySection = () => {
  return (
    <section className="py-12 sm:py-16 relative overflow-hidden bg-transparent">
      <div className="container mx-auto max-w-4xl px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-[#0a0a0a] border border-white/10 p-5 sm:p-6 md:p-8 rounded-[24px] shadow-2xl text-center md:text-left relative overflow-hidden group flex flex-col md:flex-row items-center gap-6 md:gap-8"
        >
          {/* Subtle neon glow for Kawaii Metal feel */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#1DB954]/10 rounded-full blur-[80px] pointer-events-none transition-all duration-700 group-hover:bg-[#1DB954]/20 group-hover:scale-110"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#4A90B5]/15 rounded-full blur-[80px] pointer-events-none transition-all duration-700 group-hover:bg-[#4A90B5]/25 group-hover:scale-110"></div>

          {/* Spotify Icon */}
          <div className="flex-shrink-0 relative z-10">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-20 h-20 bg-[#1DB954]/10 rounded-full flex items-center justify-center border border-[#1DB954]/30 shadow-[0_0_20px_rgba(29,185,84,0.15)] cursor-pointer"
            >
                <FaSpotify className="text-[#1DB954] text-4xl" />
            </motion.div>
          </div>

          {/* Text Content */}
          <div className="flex-grow relative z-10 w-full">
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider mb-2 text-white">
              Debut Single
            </h2>
            <p className="text-gray-400 font-medium text-xs sm:text-sm md:text-base mb-6 md:mb-0 max-w-md mx-auto md:mx-0 px-2 sm:px-0 leading-relaxed">
              Dengarkan single terbaru dari <span className="text-[#079108] font-bold drop-shadow-[0_0_8px_rgba(7,145,8,0.5)]">Kohi Sekai</span>. Tambahkan ke playlist favoritmu sekarang!
            </p>
          </div>

          {/* Iframe */}
          <div className="w-full md:w-[350px] lg:w-[400px] flex-shrink-0 relative z-10">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <iframe 
                data-testid="embed-iframe" 
                style={{ borderRadius: '12px' }} 
                src="https://open.spotify.com/embed/album/1vepdJVgDRoSnpLd0P7XH1?utm_source=generator&theme=0&si=657d1b5c1f8444ff" 
                width="100%" 
                height="152" 
                frameBorder="0" 
                allowFullScreen="" 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                loading="lazy"
                className="w-full block shadow-xl ring-1 ring-white/10"
              ></iframe>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default SpotifySection

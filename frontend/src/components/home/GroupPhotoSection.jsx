import { motion } from 'framer-motion'

const GroupPhotoSection = ({ config }) => {
  if (!config?.url) return null

  return (
    <section className="py-12 sm:py-20 px-4 bg-background">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-3xl overflow-hidden aspect-video shadow-2xl border border-white/5 group cursor-pointer"
        >
          <img 
            src={config.url} 
            alt="Kohi Sekai Group" 
            className="w-full h-full object-cover"
          />
          {/* Base gradient overlay (thicker at the bottom-left for text readability) */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/20 to-transparent transition-opacity duration-500 group-hover:opacity-0" />
          
          {/* Text Container at bottom-left */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 md:p-12 transition-opacity duration-500 group-hover:opacity-0">
            <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white uppercase tracking-wider drop-shadow-lg max-w-3xl leading-tight">
              {config.overlay_text || 'KOHI SEKAI'}
            </h2>
            {config.overlay_desc && (
              <p className="mt-2 sm:mt-4 text-sm sm:text-base md:text-lg text-white/90 font-medium drop-shadow-md max-w-2xl leading-relaxed">
                {config.overlay_desc}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default GroupPhotoSection

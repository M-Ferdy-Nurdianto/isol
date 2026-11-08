import { motion } from 'framer-motion'

const GroupPhotoSection = ({ config }) => {
  if (!config?.url) return null

  const overlayText = config.overlay_text || 'KOHI SEKAI'
  const overlayDesc = config.overlay_desc || ''

  return (
    <section className="py-6 sm:py-8 px-4 bg-surface/40 border-y border-white/5 bg-pattern-diagonal relative">
      <div className="container mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="group relative rounded-2xl overflow-hidden aspect-[16/10] sm:aspect-video border border-white/10 hover:border-white/30 transition-all duration-300 bg-surface"
        >
          {/* Group Photo */}
          <img
            src={config.url}
            alt="Kohi Sekai Group"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Clean Solid Dark Overlay */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Mobile Text (md:hidden) */}
          <div className="md:hidden absolute inset-0 flex flex-col justify-end p-3.5">
            <h2 className="text-base font-black text-white uppercase tracking-wider">
              {overlayText}
            </h2>
            {overlayDesc && (
              <p className="mt-0.5 text-xs text-white/80 line-clamp-2 leading-relaxed">
                {overlayDesc}
              </p>
            )}
          </div>

          {/* Desktop Text (hidden md:flex) */}
          <div className="hidden md:flex absolute inset-0 flex-col justify-end p-5">
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider">
              {overlayText}
            </h2>
            {overlayDesc && (
              <p className="mt-1 text-xs sm:text-sm text-white/80 max-w-md line-clamp-2 leading-relaxed">
                {overlayDesc}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default GroupPhotoSection

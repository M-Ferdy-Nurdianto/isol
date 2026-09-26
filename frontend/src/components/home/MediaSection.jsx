import { motion } from 'framer-motion'
import { FaArrowRight, FaPlay } from 'react-icons/fa'

const MediaSection = ({ navigate, getAssetPath }) => {
  return (
    <section className="py-12 sm:py-16 md:py-24 bg-[#079108]/5 text-dark overflow-hidden relative">
       <div className={`absolute top-0 left-0 w-full h-full bg-[url('${getAssetPath('/noise.png')}')] opacity-5`}></div>
       <div className="container mx-auto max-w-7xl px-4 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-10 sm:mb-16 gap-4 md:gap-6 text-center md:text-left">
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter text-dark">
                 Latest <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#079108] to-emerald-400">Media</span>
              </h2>
              <button onClick={() => navigate('/media')} className="w-full md:w-auto px-6 py-3 rounded-full border border-gray-200 text-gray-500 hover:text-dark font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                 View Gallery <FaArrowRight />
              </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {[
                  { type: 'video', title: 'JEWEL KISS - 恋華 (Lovers Flower)', thumb: 'https://img.youtube.com/vi/77iP-nJ4b8Q/sddefault.jpg', url: 'https://youtu.be/77iP-nJ4b8Q?si=CfZ3haCys12C7ONg' },
                  { type: 'video', title: 'FRUiTY - LOVE SONG FOR YOU', thumb: 'https://img.youtube.com/vi/Twin7LVhnHI/sddefault.jpg', url: 'https://youtu.be/Twin7LVhnHI?si=r-REpbjFgJkvrv7r' },
                  { type: 'video', title: 'MARY ANGEL - LIKE A ANGEL', thumb: 'https://img.youtube.com/vi/dKcq3tR69sM/sddefault.jpg', url: 'https://youtu.be/dKcq3tR69sM?si=DnheTptSVN-FK-cl' },
              ].map((item, i) => (
                  <motion.div 
                      key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                      className="group aspect-video relative rounded-2xl overflow-hidden bg-gray-100 cursor-pointer shadow-lg hover:shadow-xl transition-all"
                      onClick={() => navigate('/media')}
                  >
                      <img src={item.thumb} alt={item.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80' }} />
                       <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all scale-50 group-hover:scale-100 shadow-2xl"><FaPlay className="ml-1" /></div>
                       </div>
                       <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform"><p className="text-xs font-bold truncate text-white">{item.title}</p></div>
                  </motion.div>
              ))}
          </div>
       </div>
    </section>
  )
}

export default MediaSection

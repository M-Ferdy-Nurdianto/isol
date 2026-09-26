import { motion } from 'framer-motion'
import { FaMusic, FaInstagram, FaTwitter, FaYoutube, FaTiktok, FaWhatsapp, FaSpotify } from 'react-icons/fa'
import Header from '../components/Header'
import { getAssetPath } from '../lib/pathUtils'
import FeaturedMusic from '../components/FeaturedMusic'

const MusicPage = () => {
  return (
    <div className="min-h-screen bg-white text-dark overflow-x-hidden relative pb-16">
      <div className="noise-bg opacity-10"></div>
      <Header />
      
      <main className="container mx-auto max-w-7xl px-3 sm:px-4 py-20 sm:py-32 flex flex-col items-center justify-center min-h-[90vh] relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-12"
        >
          {/* Decorative Icon Wrapper */}
          <div className="relative inline-block">
             <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-8 border-2 border-dashed border-[#079108]/20 rounded-full"
             ></motion.div>
             <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="w-32 h-32 bg-gradient-to-br from-[#079108] to-[#4A90B5] rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl relative z-10"
             >
               <FaMusic className="text-5xl" />
             </motion.div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col items-center gap-2">
                <span className="text-[#079108] font-black tracking-[0.5em] text-xs uppercase">COLLECTION</span>
                <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-dark uppercase leading-none">
                  OUR <span className="text-[#079108]">MUSIC</span>
                </h1>
            </div>
            <div className="w-24 h-2 bg-dark mx-auto rounded-full"></div>
          </div>

          <div className="w-full mt-12 sm:mt-16">
             <FeaturedMusic />
          </div>

          {/* Social Links to stay updated - Stacked 3 top, 3 bottom */}
          <div className="pt-12 space-y-10">
            <h3 className="text-[10px] font-black tracking-[0.5em] text-gray-300 uppercase">Follow Our Beats</h3>
            <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-[260px] sm:max-w-md mx-auto justify-items-center">
              {[
                { icon: <FaInstagram />, href: 'https://whatsapp.com/channel/0029VbDVjJzDJ6GwgUQ9cP32' },
                { icon: <FaTwitter />, href: 'https://whatsapp.com/channel/0029VbDVjJzDJ6GwgUQ9cP32' },
                { icon: <FaYoutube />, href: 'https://whatsapp.com/channel/0029VbDVjJzDJ6GwgUQ9cP32' },
                { icon: <FaTiktok />, href: 'https://whatsapp.com/channel/0029VbDVjJzDJ6GwgUQ9cP32' },
                { icon: <FaWhatsapp />, href: 'https://whatsapp.com/channel/0029VbDVjJzDJ6GwgUQ9cP32' },
                { icon: <FaSpotify />, href: 'https://open.spotify.com/artist/5k89pO7XY1xNhiZWJ8IGaW?si=FAT85cI5TeCFhKp30gCC3w' },
              ].map((social, idx) => (
                <motion.a
                  key={idx}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -8, scale: 1.1 }}
                  className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-50 rounded-3xl flex items-center justify-center text-xl sm:text-2xl text-gray-400 hover:text-white hover:bg-dark transition-all shadow-sm hover:shadow-2xl"
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Decorative Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-full h-full max-w-4xl opacity-20 pointer-events-none">
            <div className="absolute top-0 left-0 w-64 h-64 bg-[#079108] rounded-full blur-[120px]"></div>
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#4A90B5] rounded-full blur-[150px]"></div>
        </div>
      </main>
    </div>
  )
}

export default MusicPage

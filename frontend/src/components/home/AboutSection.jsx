import { motion } from 'framer-motion'
import { FaArrowRight, FaBolt, FaLeaf, FaMagic, FaUsers } from 'react-icons/fa'

const AboutSection = ({ navigate, getAssetPath }) => {
  return (
    <section id="about" className="py-20 md:py-40 container mx-auto max-w-7xl px-4 relative z-40 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="relative group order-2 lg:order-1">
          <div className="absolute -left-12 md:-left-20 top-1/2 -translate-y-1/2 z-0 opacity-[0.07] select-none pointer-events-none">
            <span className="vertical-rl text-orientation-mixed font-black text-6xl md:text-9xl tracking-[0.3em] text-[#079108] whitespace-nowrap">
              KOHI SEKAI
            </span>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 1 }} className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
            <img src={getAssetPath('/images/members/group.webp')} alt="Kohi Sekai Group" className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          </motion.div>
          <motion.div initial={{ rotate: -10, opacity: 0 }} whileInView={{ rotate: 12, opacity: 1 }} viewport={{ once: true }} className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#079108] rounded-full flex items-center justify-center z-20 shadow-xl border-4 border-white">
            <span className="text-white font-black text-[10px] tracking-tighter text-center leading-tight">EST.<br/>2026</span>
          </motion.div>
        </div>

        <div className="space-y-8 order-1 lg:order-2">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-1 bg-[#079108]"></div>
              <span className="text-[#079108] font-black tracking-[0.5em] text-xs uppercase text-left">ABOUT US</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-dark leading-none text-left">
              OUR <span className="text-[#079108]">STORY</span>
            </h2>
          </div>
          <div className="space-y-6 text-gray-500 text-lg leading-relaxed text-left">
            <p className="font-medium text-dark"><span className="text-[#079108] font-black">Kohi Sekai</span> adalah grup idola modern yang membawa semangat inspiratif dan energi panggung penuh keceriaan.</p>
            <p>Berdiri dengan visi menyebarkan energi positif, kami hadir lewat penampilan yang penuh warna, musik yang memikat, dan interaksi yang hangat dengan para penggemar.</p>
            <p>Kami percaya bahwa setiap pertemuan adalah sebuah momen berharga yang patut dirayakan bersama.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[ 
              { label: 'Energy', icon: FaBolt }, 
              { label: 'Fresh', icon: FaLeaf }, 
              { label: 'Youth', icon: FaMagic }, 
              { label: 'Together', icon: FaUsers } 
            ].map((point, idx) => {
              const Icon = point.icon
              return (
                <motion.div key={idx} whileHover={{ scale: 1.05 }} className="flex items-center gap-3.5 p-4 bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm transition-all">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#079108]/10 dark:bg-[#079108]/20 text-[#079108]">
                    <Icon size={16} />
                  </div>
                  <span className="font-black text-[10px] uppercase tracking-widest text-gray-800 dark:text-gray-200">{point.label}</span>
                </motion.div>
              )
            })}
          </div>
          <div className="pt-6 flex justify-start">
            <button onClick={() => navigate('/story')} className="group flex items-center gap-4 px-8 py-4 bg-[#4A90B5] text-white rounded-full font-black text-xs uppercase tracking-[0.2em] hover:bg-[#3a718f] transition-all shadow-xl hover:shadow-[#4A90B5]/30">
              Read Full History <FaArrowRight className="group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AboutSection

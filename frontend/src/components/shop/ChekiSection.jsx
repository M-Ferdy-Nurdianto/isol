import { motion, AnimatePresence } from 'framer-motion'
import { FaTicketAlt, FaPlus, FaUsers } from 'react-icons/fa'
import MemberCard from './MemberCard'
import Skeleton from '../Skeleton'

import { useTheme } from '../../context/ThemeContext'

import { useFlyToCart } from '../../context/FlyToCartContext'

const ChekiSection = ({ 
  loading, 
  members, 
  hargaGrup, 
  hargaMember, 
  hargaWide,
  addToCart, 
  getMemberImage, 
  getAssetPath,
  selectedEvent,
  chekiGrupEnabled = false,
  regularChekiEnabled = true,
  wideChekiEnabled = false,
  hargaChekiGrupPo = 150000
}) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { triggerFly } = useFlyToCart()

  const isMemberInLineup = (memberId) => {
    if (!selectedEvent || !selectedEvent.event_lineup || selectedEvent.event_lineup.length === 0) return true;
    return selectedEvent.event_lineup.some(l => String(l.member_id) === String(memberId));
  }

  const handleGroupClick = (e) => {
    if (!chekiGrupEnabled) return
    const rect = e.currentTarget.getBoundingClientRect()
    const startPos = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    }
    triggerFly?.(startPos)
    addToCart('group', null, startPos, 'grup')
  }

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
         <h1 
           className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-2 sm:mb-3 transition-colors duration-300"
           style={{ color: isDark ? '#ffffff' : '#0f172a' }}
         >
           Shop Tickets
         </h1>
         <p 
           className="font-semibold text-sm sm:text-base transition-colors duration-300"
           style={{ color: isDark ? '#94a3b8' : '#475569' }}
         >
           Pilih Regular Cheki atau Wide Cheki (16:9) bersama member favoritmu!
         </p>
         <div className="absolute -bottom-4 left-0 w-16 sm:w-24 h-1.5 bg-gradient-to-r from-[var(--primary)] to-emerald-300 rounded-full"></div>
      </motion.div>

      {/* Cheki Grup Hero Banner — HANYA TAMPIL JIKA ENABLED */}
      <AnimatePresence>
      {chekiGrupEnabled && (
        <motion.div 
            key="cheki-grup-hero"
            initial={{ opacity: 0, scale: 0.95, height: 0 }}
            animate={{ opacity: 1, scale: 1, height: 'auto' }}
            exit={{ opacity: 0, scale: 0.95, height: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            whileHover={{ y: -6 }}
            transition={{ duration: 0.3 }}
            className="relative w-full h-56 sm:h-64 md:h-72 lg:h-96 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-2xl shadow-black/20 hover:shadow-[0_15px_40px_rgba(7,145,8,0.4)] group cursor-pointer border border-emerald-500/20 hover:border-emerald-500/60 transition-all duration-300"
            onClick={handleGroupClick}
        >
            <div className="absolute inset-0">
                <img 
                   src={getAssetPath('/images/members/group.webp')} 
                   alt="Cheki Grup (Semua Member)" 
                   className="w-full h-full object-cover transition-all duration-500 group-hover:brightness-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
            
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-10" />
            
            <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-center items-start z-10">
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-r from-[var(--primary)] to-emerald-500 text-white px-3 sm:px-5 py-1 sm:py-2 rounded-full text-[9px] sm:text-xs font-black uppercase tracking-widest mb-4 sm:mb-6 shadow-lg shadow-[var(--primary)]/30 flex items-center gap-1.5"
                >
                   <FaUsers /> Limited Package
                </motion.div>
                <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-6xl font-black text-white uppercase tracking-tight mb-1 sm:mb-3 drop-shadow-2xl">
                   Cheki Grup
                </h2>
                <p className="text-gray-300 font-medium max-w-md text-xs sm:text-sm md:text-base leading-relaxed mb-4 sm:mb-8 hidden sm:block">
                   Foto eksklusif bersama seluruh member Kohi Sekai sekaligus dalam satu frame.
                </p>
                <div className="flex items-center gap-3 sm:gap-8">
                   <span className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white">IDR {Number(hargaChekiGrupPo).toLocaleString('id-ID')}</span>
                   <motion.button 
                     whileHover={{ scale: 1.1 }}
                     whileTap={{ scale: 0.95 }}
                     className="bg-white text-[var(--primary)] w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-xl shadow-white/20 group-hover:bg-[var(--primary)] group-hover:text-white transition-colors duration-300"
                   >
                      <FaPlus className="text-sm sm:text-lg" />
                   </motion.button>
                </div>
            </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Member Solo Cheki Section */}
      <div className="space-y-8">
         <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[var(--primary)] to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-[var(--primary)]/20">
                <FaTicketAlt className="text-white" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-wide">Member Cheki</h3>
            </div>
            {(regularChekiEnabled || wideChekiEnabled) && (
              <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs">
                {regularChekiEnabled && (
                  <span className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary font-bold">
                    Regular · Rp {Number(hargaMember).toLocaleString('id-ID')}
                  </span>
                )}
                {wideChekiEnabled && (
                  <span className="px-2.5 py-1 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/25 text-[var(--primary)] font-bold">
                    Wide 16:9 · Rp {Number(hargaWide || hargaGrup).toLocaleString('id-ID')}
                  </span>
                )}
              </div>
            )}
         </div>
         
         <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
           {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-3xl bg-white/50 backdrop-blur-sm border border-white/50 p-4">
                   <Skeleton className="w-full h-full rounded-2xl" />
                </div>
              ))
           ) : (
              members.map((member, idx) => (
                <MemberCard 
                  key={member.id}
                  member={member}
                  idx={idx}
                  addToCart={addToCart}
                  getMemberImage={getMemberImage}
                  hargaMember={hargaMember}
                  hargaWide={hargaWide || hargaGrup}
                  inLineup={isMemberInLineup(member.id)}
                  regularEnabled={regularChekiEnabled}
                  wideEnabled={wideChekiEnabled}
                />
              ))
           )}
         </div>
      </div>
    </div>
  )
}

export default ChekiSection


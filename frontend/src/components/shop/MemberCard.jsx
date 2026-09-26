import { motion } from 'framer-motion'
import { FaPlus, FaLock } from 'react-icons/fa'
import { getMemberColor, formatMemberName } from '../../lib/memberUtils'
import { useFlyToCart } from '../../context/FlyToCartContext'

const MemberCard = ({ member, idx, addToCart, getMemberImage, hargaMember, inLineup = true }) => {
  const accentColor = member?.color || getMemberColor(member?.nama_panggung)
  const { triggerFly } = useFlyToCart()
  
  const handleClick = (e) => {
    if (!inLineup) return
    const rect = e.currentTarget.getBoundingClientRect()
    const startPos = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    }
    addToCart('member', member, startPos)
  }

  return (
    <motion.div 
       initial={{ opacity: 0, y: 30 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ delay: idx * 0.1 }}
       whileHover={inLineup ? { y: -6 } : {}}
       className={`group relative aspect-[4/5] sm:aspect-[3/4] rounded-3xl overflow-hidden transition-all duration-300 ${inLineup ? 'cursor-pointer hover:shadow-[0_12px_35px_rgba(7,145,8,0.35)]' : 'cursor-not-allowed'}`}
       onClick={handleClick}
       style={{
         boxShadow: inLineup ? `0 4px 20px ${accentColor}25` : 'none',
         border: `1px solid ${inLineup ? accentColor + '40' : 'rgba(200,200,200,0.15)'}`
       }}
    >
      {/* Photo — fills the entire card edge-to-edge */}
      <div className={`absolute inset-0 ${!inLineup ? 'grayscale' : ''}`}>
        <img 
           src={getMemberImage(member)}
           alt={member.nama_panggung} 
           className="w-full h-full object-cover object-top transition-all duration-500 group-hover:brightness-105"
        />
        {/* Gradient: blend photo into info section */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, transparent 35%, ${inLineup ? accentColor : '#0f172a'}ee 95%)`
          }}
        />
      </div>

      {/* Hologram Shimmer Sweep */}
      {inLineup && (
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-10" />
      )}

      {/* Hover glow ring */}
      <div 
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ boxShadow: `inset 0 0 50px ${accentColor}40, 0 0 25px ${accentColor}50` }}
      />

      {/* Info section — floating over the gradient at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-4 space-y-1 sm:space-y-1.5">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span 
            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: inLineup ? accentColor : '#94a3b8' }}
          />
          <h4 className="text-xs sm:text-base font-black uppercase tracking-tight text-white truncate leading-none drop-shadow-lg">
            {member.is_secret ? '??? (SECRET)' : formatMemberName(member.nama_panggung)}
          </h4>
        </div>
        <p className="text-[8px] sm:text-[9px] font-bold text-white/70 uppercase tracking-widest pl-3 sm:pl-4">
          {member.is_secret ? 'Mystery 2-Shot Ticket' : '2-Shot Ticket'}
        </p>
        <div className="flex items-center justify-between pl-3 sm:pl-4 pt-0.5">
          <span className="text-xs sm:text-sm font-black text-white drop-shadow">
            IDR {hargaMember.toLocaleString()}
          </span>
          <motion.div 
             whileHover={inLineup ? { scale: 1.2 } : {}}
             whileTap={inLineup ? { scale: 0.9 } : {}}
             className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white shadow-lg ${inLineup ? '' : 'bg-gray-500'}`}
             style={inLineup ? { backgroundColor: accentColor, boxShadow: `0 4px 14px ${accentColor}80` } : {}}
           >
              {inLineup ? <FaPlus className="text-[10px] sm:text-xs" /> : <FaLock style={{ fontSize: '8px' }} />}
           </motion.div>
        </div>
      </div>

      {/* Not in lineup overlay */}
      {!inLineup && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full transform -rotate-12 border border-white/20">
            <span className="text-white font-black uppercase tracking-widest text-[10px]">Not in Lineup</span>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default MemberCard

import { motion } from 'framer-motion'
import { FaPlus, FaLock, FaPhotoFilm } from 'react-icons/fa'
import { getMemberColor, formatMemberName } from '../../lib/memberUtils'
import { useFlyToCart } from '../../context/FlyToCartContext'

const MemberCard = ({ 
  member, 
  idx, 
  addToCart, 
  getMemberImage, 
  hargaMember, 
  hargaWide, 
  inLineup = true, 
  regularEnabled = true, 
  wideEnabled = false 
}) => {
  const accentColor = member?.color || getMemberColor(member?.nama_panggung)
  const { triggerFly } = useFlyToCart()

  const handleBuy = (e, chekiType) => {
    e.stopPropagation()
    if (!inLineup) return
    const rect = e.currentTarget.getBoundingClientRect()
    const startPos = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    }
    triggerFly?.(startPos)
    addToCart('member', member, startPos, chekiType)
  }

  return (
    <motion.div 
       initial={{ opacity: 0, y: 30 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ delay: idx * 0.1 }}
       whileHover={inLineup ? { y: -6 } : {}}
       className={`group relative aspect-[4/5] sm:aspect-[3/4] rounded-3xl overflow-hidden transition-all duration-300 ${inLineup ? '' : 'cursor-not-allowed'}`}
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
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, transparent 25%, ${inLineup ? accentColor : '#0f172a'}f0 98%)`
          }}
        />
      </div>

      {inLineup && (
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-10" />
      )}

      <div 
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ boxShadow: `inset 0 0 50px ${accentColor}40, 0 0 25px ${accentColor}50` }}
      />

      {/* Top: Name + status */}
      <div className="absolute top-0 left-0 right-0 p-2.5 sm:p-4 space-y-1 sm:space-y-1.5 z-20">
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
          {member.is_secret ? 'Mystery Member' : member.tagline || 'Kohi Sekai Idol'}
        </p>
      </div>

      {/* Bottom: CTA buttons */}
      {inLineup ? (
        <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 space-y-1.5 z-20">
          {regularEnabled && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={(e) => handleBuy(e, 'regular')}
              className="w-full flex items-center justify-between px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-white font-bold text-[10px] sm:text-xs shadow-lg transition-colors"
              style={{ backgroundColor: accentColor, boxShadow: `0 4px 12px ${accentColor}70` }}
            >
              <span className="flex items-center gap-1 min-w-0">
                <FaPlus className="shrink-0" style={{ fontSize: '8px' }} />
                <span className="truncate">Regular</span>
              </span>
              <span className="shrink-0 font-black">
                Rp {Number(hargaMember).toLocaleString('id-ID')}
              </span>
            </motion.button>
          )}

          {wideEnabled && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={(e) => handleBuy(e, 'wide')}
              className="w-full flex items-center justify-between px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl font-bold text-[10px] sm:text-xs shadow-lg transition-colors bg-white/10 backdrop-blur-md border border-white/25 hover:bg-white/20 text-white"
            >
              <span className="flex items-center gap-1 min-w-0">
                <FaPhotoFilm className="shrink-0" style={{ fontSize: '8px' }} />
                <span className="truncate">Wide 16:9</span>
              </span>
              <span className="shrink-0 font-black">
                Rp {Number(hargaWide).toLocaleString('id-ID')}
              </span>
            </motion.button>
          )}

          {!regularEnabled && !wideEnabled && (
            <div className="w-full px-2.5 py-2 rounded-xl bg-gray-500/40 backdrop-blur text-center">
              <span className="text-[9px] font-bold uppercase text-white/80 tracking-wider">Not Available</span>
            </div>
          )}
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full transform -rotate-12 border border-white/20">
            <span className="text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-1.5">
              <FaLock style={{ fontSize: '9px' }} /> Not in Lineup
            </span>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default MemberCard

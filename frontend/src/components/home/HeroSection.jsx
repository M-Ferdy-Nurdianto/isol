import { motion } from 'framer-motion'
import { getAssetPath } from '../../lib/pathUtils'

const HeroSection = ({ 
  members = [], 
  activeMemberId, 
  setActiveMemberId, 
  navigate,
  heroTitle,
  heroSubtitle,
  heroTagline,
  heroTitleColor = '#FFFFFF',
  heroSubtitleColor = '#FBBF24',
  heroTaglineColor = '#FFFFFF',
  isPreview = false,
  previewMode = 'desktop', // 'desktop' | 'mobile'
  previewHeight,
  previewWidth,
}) => {
  const getMemberStyle = (member) => ({
    objectPosition: `${member.posX ?? 50}% ${member.posY ?? 50}%`,
    transform: `scale(${member.scale ?? 1}) translate(${member.translateX ?? 0}px, ${member.translateY ?? 0}px) ${member.flipX ? 'scaleX(-1)' : ''}`
  })

  const getMobileMemberStyle = (member) => ({
    objectPosition: `${member.mobilePosX ?? member.posX ?? 50}% ${member.mobilePosY ?? member.posY ?? 50}%`,
    transform: `scale(${member.mobileScale ?? member.scale ?? 1}) translate(${member.mobileTranslateX ?? member.translateX ?? 0}px, ${member.mobileTranslateY ?? member.translateY ?? 0}px) ${(member.mobileFlipX ?? member.flipX) ? 'scaleX(-1)' : ''}`
  })

  const titleText = heroTitle || "KOHI SEKAI"
  const subtitleText = heroSubtitle || "ãƒªãƒ•ãƒ¬ãƒƒã‚·ãƒ¥ãƒ»ãƒ–ãƒªãƒ¼ã‚º"
  const taglineText = heroTagline || "Japanese Style Idol Group â€¢ Tulungagung"

  const handleMemberClick = (memberId) => {
    if (isPreview) {
      if (setActiveMemberId) setActiveMemberId(activeMemberId === memberId ? null : memberId)
      return
    }
    if (navigate) navigate('/members')
  }

  const getOverlayStyle = (colorVal) => {
    if (!colorVal) return {}
    if (colorVal.startsWith('#') || colorVal.startsWith('rgb') || colorVal.startsWith('hsl')) {
      return { backgroundColor: colorVal }
    }
    return {}
  }

  const getOverlayClass = (colorVal) => {
    if (!colorVal) return 'bg-[#5A8F5A]'
    if (colorVal.startsWith('bg-')) return colorVal
    return ''
  }

  const showDesktop = isPreview ? previewMode === 'desktop' : true
  const showMobile = isPreview ? previewMode === 'mobile' : true

  return (
    <>
      {/* Desktop Hero */}
      {showDesktop && (
        <section 
          className={`relative w-full overflow-hidden ${isPreview ? 'flex' : 'h-[100vh] hidden md:flex'}`}
          style={isPreview ? { height: previewHeight || 460 } : undefined}
        >
          {members.map((member, idx) => (
            <motion.div 
              key={member.id || idx}
              initial={isPreview ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: Math.abs(idx - 3) * 0.1, ease: "easeOut" }}
              className="hero-column min-w-0 flex-1 relative group cursor-pointer"
              onClick={() => handleMemberClick(member.id)}
            >
              <div className="absolute inset-0 overflow-hidden">
                <img 
                  src={member.photo || getAssetPath('/images/members/placeholder.svg')} 
                  alt={member.name} 
                  fetchpriority={idx < 3 ? "high" : "auto"}
                  loading="eager"
                  className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                  style={getMemberStyle(member)}
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = getAssetPath('/images/members/placeholder.svg')
                  }}
                />
                <div 
                  className={`absolute inset-0 ${getOverlayClass(member.color)} mix-blend-multiply opacity-30 group-hover:opacity-0 transition-opacity duration-700`}
                  style={getOverlayStyle(member.color)}
                />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent"></div>
              </div>
              <div className={`absolute inset-x-0 flex justify-center z-10 pointer-events-none group-hover:opacity-0 transition-opacity duration-500 ${isPreview ? 'bottom-8' : 'bottom-24'}`}>
                <span className={`vertical-rl text-orientation-mixed text-white font-black tracking-[0.15em] opacity-80 drop-shadow-2xl ${isPreview ? 'text-xs sm:text-sm' : 'text-xl md:text-2xl'}`}>
                  {member.name}
                </span>
              </div>
            </motion.div>
          ))}

          <div className="absolute inset-x-0 bottom-[34%] sm:bottom-[32%] flex flex-col items-center justify-center z-20 pointer-events-none px-2">
            <motion.div 
              initial={isPreview ? false : "hidden"} 
              animate="visible"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.8 } } }}
              className="text-center w-full max-w-full"
            >
              <motion.div 
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 0.8, y: 0 } }} 
                className={`mb-1 font-bold uppercase tracking-[0.25em] truncate ${isPreview ? 'text-[8px] sm:text-[9px]' : 'text-[9px]'}`}
                style={{ color: heroTaglineColor || '#FFFFFF' }}
              >
                {taglineText}
              </motion.div>
              <motion.h1 
                variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }} 
                className={`${isPreview ? 'text-lg sm:text-2xl' : 'text-3xl'} font-black tracking-[0.1em] my-0.5 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] uppercase truncate`}
                style={{ color: heroTitleColor || '#FFFFFF' }}
              >
                {titleText}
              </motion.h1>
              <motion.div 
                variants={{ hidden: { opacity: 0, y: -10 }, visible: { opacity: 1, y: 0 } }} 
                className={`font-black uppercase tracking-[0.3em] truncate ${isPreview ? 'text-[9px] sm:text-[10px]' : 'text-xs'}`}
                style={{ color: heroSubtitleColor || '#FBBF24' }}
              >
                {subtitleText}
              </motion.div>
            </motion.div>
          </div>
          <div className="absolute bottom-0 w-full h-2 caution-pattern z-30 opacity-60"></div>
        </section>
      )}

      {/* Mobile Hero */}
      {showMobile && (
        <section className={`relative bg-[var(--surface)] text-white flex flex-col ${isPreview ? 'w-full' : 'md:hidden pt-16'}`}>
          <motion.div initial={isPreview ? false : { opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-6 py-6 text-center bg-[var(--surface)] border-b border-white/10">
            <p className="text-[8px] tracking-[0.5em] font-black text-white/70 uppercase mb-2" style={{ color: heroTaglineColor || 'rgba(255,255,255,0.7)' }}>
              {taglineText}
            </p>
            <h1 className="text-3xl font-black tracking-tight text-[var(--primary)] mb-1 uppercase" style={{ color: heroTitleColor || '#079108' }}>
              {titleText}
            </h1>
            <p className="text-xs font-black tracking-[0.4em] text-accent-yellow" style={{ color: heroSubtitleColor || '#FBBF24' }}>
              {subtitleText}
            </p>
          </motion.div>
          <div className="flex flex-col relative bg-[var(--surface)]">
            {members.map((member, idx) => (
              <motion.div
                key={member.id || idx}
                initial={isPreview ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setActiveMemberId && setActiveMemberId(activeMemberId === member.id ? null : member.id)}
                className="relative h-20 overflow-hidden cursor-pointer group border-b border-white/5"
              >
                <img 
                  src={member.photo || getAssetPath('/images/members/placeholder.svg')} 
                  alt={member.name}
                  fetchpriority={idx < 2 ? "high" : "auto"}
                  loading="eager"
                  className={`absolute inset-0 w-full h-full object-cover z-0 transition-all duration-500 ${
                    activeMemberId === member.id 
                      ? 'grayscale-0 opacity-100 brightness-105' 
                      : 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100'
                  }`}
                  style={getMobileMemberStyle(member)}
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = getAssetPath('/images/members/placeholder.svg')
                  }}
                />
                <div 
                  className={`absolute inset-0 ${getOverlayClass(member.color)} transition-opacity duration-500 z-10 ${
                    activeMemberId === member.id ? 'opacity-0' : 'opacity-40 mix-blend-multiply group-hover:opacity-0'
                  }`}
                  style={getOverlayStyle(member.color)}
                />
                {/* Member Name Label on Left Side */}
                <div className="absolute inset-y-0 left-0 flex items-center z-20 px-4 pointer-events-none">
                  <span className={`text-xs font-black tracking-widest uppercase transition-all duration-300 ${
                    activeMemberId === member.id 
                      ? 'text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] translate-x-1' 
                      : 'text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:text-white group-hover:translate-x-1'
                  }`}>
                    {member.name}
                  </span>
                </div>
              </motion.div>
            ))}
            <div className="h-2 w-full caution-pattern opacity-60"></div>
          </div>
        </section>
      )}
    </>
  )
}

export default HeroSection


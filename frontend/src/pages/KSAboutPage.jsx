import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaHeart, FaBirthdayCake, FaInstagram, FaTwitter, FaLock, FaArrowLeft } from 'react-icons/fa'
import KSHeader from '../components/KSHeader'
import KSFooter from '../components/KSFooter'
import api from '../lib/api'
import { getAssetPath } from '../lib/pathUtils'
import { useInView, animate } from 'framer-motion'
import { useRef } from 'react'

// === Animated Counter ===
const AnimatedCounter = ({ from = 0, to }) => {
  const nodeRef = useRef()
  const inView = useInView(nodeRef, { once: true })

  useEffect(() => {
    if (!inView) return
    const controls = animate(from, to, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate(value) {
        if (nodeRef.current) {
          nodeRef.current.textContent = Math.round(value)
        }
      }
    })
    return () => controls.stop()
  }, [from, to, inView])

  return <span ref={nodeRef}>{from}</span>
}

// === Group Photo Carousel ===
const GroupPhotoCarousel = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const displayImages = images && images.length > 0 ? images.map(img => getAssetPath(img)) : [getAssetPath('/images/members/placeholder.svg')];

  useEffect(() => {
    if (displayImages.length <= 1 || isHovered) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayImages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [displayImages.length, isHovered, currentIndex]);

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % displayImages.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  
  const handleDragEnd = (e, { offset }) => {
    const swipe = offset.x;
    if (swipe < -50) handleNext();
    else if (swipe > 50) handlePrev();
  };

  return (
    <div 
      className="group relative w-full sm:w-[480px] lg:w-[560px] aspect-video rounded-2xl overflow-hidden border border-border shadow-lg bg-surface"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={currentIndex}
          src={displayImages[currentIndex]}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute inset-0 w-full h-full object-cover"
          alt="Kohi Sekai Group"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
        />
      </AnimatePresence>

      {displayImages.length > 1 && (
        <>
          <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button onClick={handlePrev} className="pointer-events-auto w-10 h-10 rounded-full bg-background/80 text-text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors backdrop-blur-md">
              <FaArrowLeft size={12} />
            </button>
            <button onClick={handleNext} className="pointer-events-auto w-10 h-10 rounded-full bg-background/80 text-text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors backdrop-blur-md transform rotate-180">
              <FaArrowLeft size={12} />
            </button>
          </div>
          
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
            {displayImages.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${currentIndex === idx ? 'w-6 bg-primary' : 'bg-white/50 hover:bg-white'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// === Member Detail Modal ===
const MemberDetail = ({ member, members, onNavigate, onClose }) => {
  const isSecret = member.is_secret;
  const name = isSecret ? '???' : (member.nama_panggung || 'Member');
  const imageUrl = member.image_url ? getAssetPath(member.image_url) : null;
  const currentIndex = members.findIndex(m => (m.id || m.member_id) === (member.id || member.member_id));
  
  const handlePrev = (e) => {
    e.stopPropagation();
    const prevIdx = (currentIndex - 1 + members.length) % members.length;
    onNavigate(members[prevIdx]);
  };
  const handleNext = (e) => {
    e.stopPropagation();
    const nextIdx = (currentIndex + 1) % members.length;
    onNavigate(members[nextIdx]);
  };

  const handleDragEnd = (e, { offset }) => {
    if (offset.y > 100) onClose(); // swipe down to close
    else if (offset.x < -50) handleNext(e);
    else if (offset.x > 50) handlePrev(e);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80" />
      
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        className="relative w-full sm:max-w-4xl bg-surface sm:rounded-3xl rounded-t-3xl overflow-hidden max-h-[90vh] sm:max-h-[85vh] flex flex-col sm:flex-row shadow-2xl"
      >
        {/* Mobile Swipe Handle */}
        <div className="w-full flex justify-center py-3 sm:hidden absolute top-0 left-0 z-20">
          <div className="w-12 h-1.5 rounded-full bg-white/20" />
        </div>

        {/* Close Button (Desktop) */}
        <button
          onClick={onClose}
          className="hidden sm:flex absolute top-6 right-6 z-20 w-10 h-10 items-center justify-center rounded-full bg-background/50 hover:bg-background text-text-secondary hover:text-white transition-colors"
        >
          &times;
        </button>

        {/* Left Column: Photo */}
        <div className="w-full sm:w-[40%] flex-shrink-0 relative bg-background">
          <div className="w-full aspect-[4/5] sm:h-full relative overflow-hidden">
            {imageUrl && !isSecret ? (
              <img src={imageUrl} alt={name} className="absolute inset-0 w-full h-full object-cover object-top" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-surface border-r border-border">
                {isSecret && <FaLock size={56} className="text-zinc-600" />}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent sm:hidden" />
          </div>
          
          {/* Mobile Close X (Top Right corner of image) */}
          <button
            onClick={onClose}
            className="sm:hidden absolute top-4 right-4 z-20 w-10 h-10 items-center justify-center rounded-full bg-black/50 text-white flex"
          >
            &times;
          </button>
        </div>

        {/* Right Column: Info */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-surface">
          <div className="space-y-8 pb-16 sm:pb-0">
            {/* Header */}
            <div>
              <p className="text-xs font-bold tracking-[0.3em] uppercase text-text-secondary/60 mb-2">
                {isSecret ? '?????·?????·?????' : (member.nama_kanji || 'Kohi Sekai')}
              </p>
              <h2 className="text-4xl sm:text-5xl font-black text-text-primary tracking-tight">
                {name}
              </h2>
              <p className="text-sm font-bold text-text-secondary mt-2">
                {isSecret ? 'Identitas rahasia' : (member.tagline || 'Idol Profile')}
              </p>
            </div>

            {/* Content */}
            {!isSecret && (
              <div className="space-y-6">
                {member.jikoshoukai && (
                  <div>
                    <h3 className="text-[11px] font-bold tracking-wider text-text-secondary/50 uppercase mb-2">Profile</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{member.jikoshoukai}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {member.tanggal_lahir && (
                    <div className="bg-background/50 rounded-xl p-4 border border-border/50">
                      <p className="text-[10px] font-bold tracking-wider text-text-secondary/50 uppercase mb-1">Ulang Tahun</p>
                      <p className="text-sm font-bold text-text-primary">{member.tanggal_lahir}</p>
                    </div>
                  )}
                  {member.catatan && (
                    <div className="bg-background/50 rounded-xl p-4 border border-border/50">
                      <p className="text-[10px] font-bold tracking-wider text-text-secondary/50 uppercase mb-1">Catatan</p>
                      <p className="text-sm font-bold text-text-primary">{member.catatan}</p>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                {(member.instagram || member.tiktok || member.twitter) && (
                  <div className="pt-2 flex flex-wrap gap-3">
                    {member.instagram && (
                      <a href={`https://instagram.com/${member.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-background border border-border text-xs font-bold hover:border-primary hover:text-primary transition-colors min-h-[44px]">
                        <FaInstagram size={14} /> {member.instagram}
                      </a>
                    )}
                    {member.tiktok && (
                      <a href={`https://tiktok.com/${member.tiktok.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-background border border-border text-xs font-bold hover:border-primary hover:text-primary transition-colors min-h-[44px]">
                        TikTok
                      </a>
                    )}
                    {member.twitter && (
                      <a href={`https://x.com/${member.twitter.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-background border border-border text-xs font-bold hover:border-primary hover:text-primary transition-colors min-h-[44px]">
                        <FaTwitter size={14} /> {member.twitter}
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Controls (Floating Bottom) */}
        <div className="absolute bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-auto p-4 sm:p-0 bg-surface sm:bg-transparent border-t border-border sm:border-none flex justify-between sm:justify-end gap-3 z-20">
          <button onClick={handlePrev} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 min-h-[44px] rounded-full bg-background border border-border text-text-secondary hover:text-white hover:border-zinc-500 transition-colors text-xs font-bold">
            <FaArrowLeft size={10} /> Prev
          </button>
          <button onClick={handleNext} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 min-h-[44px] rounded-full bg-primary text-white hover:bg-primary/90 transition-colors text-xs font-bold">
            Next <FaArrowLeft size={10} className="transform rotate-180" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// === Member Grid Card ===
const MemberGridCard = ({ member, onClick, index }) => {
  const isSecret = member.is_secret
  const name = isSecret ? '???' : (member.nama_panggung || 'Member')
  const imageUrl = member.image_url ? getAssetPath(member.image_url) : null

  return (
    <motion.button
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.08 }}
      onClick={() => onClick(member)}
      className="group text-left relative flex flex-col rounded-2xl sm:rounded-3xl overflow-hidden bg-surface border border-border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      {/* Photo area */}
      <div className="relative aspect-[3/4] overflow-hidden bg-background">
        {imageUrl && !isSecret ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isSecret ? <FaLock size={40} className="text-zinc-600 opacity-40" /> : null}
          </div>
        )}
      </div>

      {/* Name area */}
      <div className="p-4 sm:p-5">
        <p className="text-[9px] font-black tracking-[0.3em] uppercase text-text-secondary/60 truncate">
          {isSecret ? '???·???·???' : (member.nama_kanji || 'Kohi Sekai')}
        </p>
        <p className="text-base font-black text-text-primary tracking-tight mt-1 truncate">{name}</p>
        <p className="text-xs text-text-secondary mt-0.5 truncate">
          {isSecret ? '???' : (member.tagline || 'Member')}
        </p>
      </div>
    </motion.button>
  )
}

// === Main About Page ===
const KSAboutPage = () => {
  const [members, setMembers] = useState([])
  const [groupInfo, setGroupInfo] = useState(null)
  const [selectedMember, setSelectedMember] = useState(null)
  const [aboutUs, setAboutUs] = useState({ title: '', subtitle: '', description: '', images: [], since: '2026' })
  const [stats, setStats] = useState({ members: 0, events: 0, music: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/members').then(res => {
      if (res.data.success) {
        const all = res.data.data || []
        const group = all.find(m => m.member_id === 'group')
        setGroupInfo(group || null)
        setMembers(all.filter(m => m.member_id !== 'group'))
      }
    }).catch(console.error)

    api.get('/config').then(res => {
      if (res.data.success) {
        const configStr = res.data.data.about_us
        if (configStr) {
          try {
            setAboutUs(JSON.parse(configStr))
          } catch(e) {}
        }
      }
    }).catch(console.error)

    api.get('/config/stats').then(res => {
      if (res.data.success) {
        setStats(res.data.data)
      }
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const placeholderMembers = [
    { id: 'latte', member_id: 'latte', nama_panggung: 'Kohi Latte', tagline: 'Manis seperti latte.', color: 'var(--primary)', nama_kanji: 'コーヒー・ラテ' },
    { id: 'macchiato', member_id: 'macchiato', nama_panggung: 'Kohi Macchiato', tagline: 'Tegas seperti macchiato.', color: 'var(--accent)', nama_kanji: 'コーヒー・マキアート' },
    { id: 'affogato', member_id: 'affogato', nama_panggung: 'Kohi Affogato', tagline: 'Misterius seperti affogato.', color: '#C9A97E', nama_kanji: 'コーヒー・アフォガート' },
  ]

  const displayMembers = members.length > 0 ? members : placeholderMembers

  return (
    <div className="min-h-screen bg-background text-text-primary overflow-x-hidden">
      <KSHeader />

      <main>
        {/* === GROUP STORY SECTION === */}
        <section className="relative pt-32 sm:pt-40 pb-20 sm:pb-32 px-4 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/4 blur-[140px]" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/3 blur-[120px]" />
          </div>

          <div className="container mx-auto max-w-7xl relative z-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
              {/* Text */}
              <div className="flex-1 w-full text-center lg:text-left">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                >
                  <p className="text-xs font-black tracking-[0.5em] text-primary uppercase mb-4">About Us</p>
                  <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-text-primary leading-none mb-6">
                    {aboutUs.title ? (
                      <span dangerouslySetInnerHTML={{ __html: aboutUs.title.replace(/\n/g, '<br />') }} />
                    ) : (
                      <>KOHI<br /><span className="text-primary">SEKAI</span></>
                    )}
                  </h1>
                  <p className="text-sm font-black tracking-[0.3em] text-primary/70 uppercase mb-8">
                    {aboutUs.subtitle || groupInfo?.nama_kanji || 'コーヒーの世界へようこそ'}
                  </p>
                  <p className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-lg whitespace-pre-wrap">
                    {aboutUs.description || groupInfo?.jikoshoukai || 
                      'Kohi Sekai (コーヒー・世界) adalah grup idol Indonesia yang terinspirasi dari budaya kopi Jepang dan semangat idol modern. Nama ini berarti "Dunia Kopi" — tempat di mana tiga rasa yang berbeda berpadu menjadi satu harmoni yang kuat.\n\nSetiap member membawa karakter uniknya sendiri, seperti tiga varian kopi favorit yang tak tergantikan: Latte, Macchiato, dan Affogato.'
                    }
                  </p>
                </motion.div>
              </div>

              {/* Decorative visual */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className="w-full lg:w-auto flex justify-center"
              >
                <GroupPhotoCarousel images={aboutUs.images} />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Milestones strip */}
        <section className="py-12 px-4 bg-surface border-y border-border overflow-hidden">
          <div className="container mx-auto max-w-7xl">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
              {[
                { label: 'Member', value: stats.members },
                { label: 'Event', value: stats.events },
                { label: 'Lagu', value: stats.music },
                { label: 'Since', value: aboutUs.since || '2026', isString: true },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <p className="text-4xl sm:text-5xl font-black text-primary leading-none">
                    {stat.isString ? stat.value : <AnimatedCounter from={0} to={stat.value} />}
                  </p>
                  <p className="text-xs font-black tracking-widest text-text-secondary uppercase mt-2">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* === MEMBERS SECTION === */}
        <section className="py-20 sm:py-32 px-4 bg-background relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/4 blur-[140px] pointer-events-none" />

          <div className="container mx-auto max-w-7xl flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12 sm:mb-16 text-center flex flex-col items-center"
            >
              <p className="text-xs font-black tracking-[0.5em] text-primary uppercase mb-3">Members</p>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-text-primary leading-none text-center">
                TIGA<br /><span className="text-primary">RASA KOPI</span>
              </h2>
              <p className="text-text-secondary mt-4 max-w-md text-center">
                Klik pada member untuk melihat profil lengkap.
              </p>
            </motion.div>

            {loading ? (
              <div className="flex flex-wrap justify-center gap-4 w-full">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-1rem)] lg:w-64 aspect-[3/4] rounded-2xl bg-surface animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 w-full">
                {displayMembers.map((member, i) => (
                  <div key={member.id || member.member_id || i} className="w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-1rem)] lg:w-64">
                    <MemberGridCard
                      member={member}
                      index={i}
                      onClick={setSelectedMember}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <KSFooter />

      {/* Member Detail Modal */}
      <AnimatePresence>
        {selectedMember && (
          <MemberDetail member={selectedMember} members={displayMembers} onNavigate={setSelectedMember} onClose={() => setSelectedMember(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}

export default KSAboutPage

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaHeart, FaArrowLeft, FaBirthdayCake, FaInstagram, FaPalette, FaQuoteLeft, FaLock } from 'react-icons/fa'
import { getAssetPath } from '../lib/pathUtils'
import Header from '../components/Header'
import api from '../lib/api'
import Skeleton from '../components/Skeleton'

let cachedMembers = null
let cachedGroup = null

const MembersPage = () => {
  const [members, setMembers] = useState(cachedMembers || [])
  const [groupInfo, setGroupInfo] = useState(cachedGroup || null)
  const [selectedMember, setSelectedMember] = useState(null)
  const [loading, setLoading] = useState(!cachedMembers)

  const sanitizeName = (name) => (name || '').toLowerCase().replace(/[^a-z0-9]/g, '')

  const getMemberData = (member) => {
    if (!member) return {}
    if (member.is_secret) {
      return {
        color: member.color || '#9333ea',
        namaPanggung: '??? (SECRET)',
        tagline: 'Secret Teaser Member',
        jiko: 'Identitas member ini masih menjadi misteri. Nantikan pengumuman resminya segera!',
        tanggalLahir: 'Rahasia',
        hobi: 'Rahasia',
        instagram: '@kohisekai'
      }
    }
    return {
      color: member.color || '#079108',
      namaPanggung: member.nama_panggung,
      tagline: member.tagline || 'Member',
      jiko: member.jikoshoukai || '',
      tanggalLahir: member.tanggal_lahir || '-',
      hobi: member.hobi || '-',
      instagram: member.instagram || '-'
    }
  }

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await api.get('/members')
        if (response.data.success) {
          const allData = response.data.data || []
          const group = allData.find(m => m.member_id === 'group')
          if (group) {
            cachedGroup = group
            setGroupInfo(group)
          }

          const activeMembers = allData
            .filter(m => m.member_id !== 'group' && m.hadir !== false)
            .sort((a, b) => (a.order_index ?? 99) - (b.order_index ?? 99))

          cachedMembers = activeMembers
          setMembers(activeMembers)
        }
      } catch (error) {
        console.error('Failed to fetch members:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchMembers()
  }, [])

  // Dynamic Profile image helper
  const getProfileImage = (member) => {
    // Jika member secret / silhouette
    if (member?.is_secret) {
      if (member.silhouette_image_url) {
        if (member.silhouette_image_url.startsWith('http')) return member.silhouette_image_url
        if (member.silhouette_image_url.startsWith('/')) return getAssetPath(member.silhouette_image_url)
        return getAssetPath(`/images/members/${member.silhouette_image_url}`)
      }
      return getAssetPath('/images/members/placeholder.svg')
    }

    if (member?.image_url) {
      if (member.image_url.startsWith('http')) return member.image_url
      if (member.image_url.startsWith('/')) return getAssetPath(member.image_url)
      return getAssetPath(`/images/members/${member.image_url}`)
    }
    const clean = sanitizeName(member?.nama_panggung)
    if (clean === 'acaa' || clean === 'aca') return getAssetPath('/images/members/aca.webp')
    return getAssetPath(`/images/members/${clean}.webp`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900 overflow-x-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[var(--primary)]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 right-20 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-pink-100/20 via-purple-100/20 to-blue-100/20 rounded-full blur-3xl"></div>
      </div>

      <Header />

      <main className="relative pt-28 pb-20 container mx-auto max-w-6xl px-4">
        <AnimatePresence mode="wait">
          {!selectedMember ? (
            // GRID VIEW
            <motion.div 
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              {/* Hero Section */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-[2rem] overflow-hidden h-64 md:h-80"
              >
                <img 
                  src={
                    groupInfo?.image_url
                      ? (groupInfo.image_url.startsWith('http') ? groupInfo.image_url : (groupInfo.image_url.startsWith('/') ? getAssetPath(groupInfo.image_url) : getAssetPath(`/images/members/${groupInfo.image_url}`)))
                      : getAssetPath('/images/members/group.webp')
                  } 
                  alt="Kohi Sekai Members" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = getAssetPath('/images/members/group.webp')
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
                <div className="absolute inset-0 flex items-center p-8 md:p-12">
                  <div>
                    <motion.p 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-emerald-400 text-xs font-black uppercase tracking-[0.3em] mb-3"
                    >
                      Kohi Sekai
                    </motion.p>
                    <motion.h1 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight mb-4"
                    >
                      Meet The<br/>Members
                    </motion.h1>
                    <motion.p 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-white max-w-lg text-sm md:text-base font-bold drop-shadow-md mb-1"
                    >
                      {groupInfo?.tagline || 'Kompak & Ceria'}
                    </motion.p>
                    {groupInfo?.jikoshoukai && (
                      <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.45 }}
                        className="text-emerald-300/95 max-w-lg text-xs md:text-sm font-medium italic drop-shadow-md"
                      >
                        "{groupInfo.jikoshoukai}"
                      </motion.p>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Members Grid - Card Layout */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-6">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <div key={i} className="aspect-[3/4] rounded-3xl bg-white/50 backdrop-blur-sm border border-white/50 overflow-hidden">
                      <Skeleton className="w-full h-full" />
                    </div>
                  ))
                ) : (
                  members.map((member, idx) => {
                    const data = getMemberData(member)
                    return (
                      <motion.div 
                        key={member.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ y: -10, scale: 1.02 }}
                        onClick={() => setSelectedMember(member)}
                        className="group relative aspect-[3/4] rounded-3xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-shadow duration-500"
                        style={{
                          boxShadow: `0 10px 40px ${data.color}20`
                        }}
                      >
                        {/* Image */}
                        <img 
                          src={getProfileImage(member)} 
                          alt={data.namaPanggung}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        
                        {/* Gradient overlay */}
                        <div 
                          className="absolute inset-0 opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                          style={{
                            background: `linear-gradient(to top, ${data.color}, transparent 60%)`
                          }}
                        ></div>

                        {/* Glow effect on hover */}
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          style={{
                            boxShadow: `inset 0 0 60px ${data.color}40`
                          }}
                        ></div>

                        {/* Content */}
                        <div className="absolute bottom-0 left-0 right-0 p-5">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight drop-shadow-lg">
                              {data.namaPanggung}
                            </h3>
                          </div>
                          <p className="text-white/80 text-xs font-medium">{data.tagline}</p>
                        </div>

                        {/* View Profile indicator */}
                        <div className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                          <FaHeart className="text-white text-sm" />
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>
            </motion.div>
          ) : (
            // DETAIL VIEW
            <motion.div
              key="detail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-5xl mx-auto"
            >
              {(() => {
                const data = getMemberData(selectedMember)
                const clean = sanitizeName(selectedMember.nama_panggung)
                
                return (
                  <>
                    {/* Back Button */}
                    <motion.button 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => setSelectedMember(null)}
                      className="mb-8 flex items-center gap-3 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors group"
                    >
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                        style={{ backgroundColor: `${data.color}20` }}
                      >
                        <FaArrowLeft style={{ color: data.color }} />
                      </div>
                      Back to Members
                    </motion.button>

                    {/* Profile Hero - Polaroid Style Redesign */}
                    <div className="relative mb-12 flex flex-col lg:flex-row items-center lg:items-center rounded-[3rem] overflow-hidden bg-white dark:bg-[#111726]/90 shadow-xl border border-gray-100 dark:border-white/10 p-6 md:p-12 gap-8 md:gap-16">
                      
                      {/* Visual Stage - Polaroid Frame */}
                      <motion.div 
                        initial={{ rotate: -2, scale: 0.9, opacity: 0 }}
                        animate={{ rotate: -1, scale: 1, opacity: 1 }}
                        whileHover={{ rotate: 0, scale: 1.02 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative w-full lg:w-[45%] aspect-[4/5] bg-white dark:bg-[#182238] p-4 pb-16 md:p-6 md:pb-24 shadow-2xl rounded-sm border-t border-l border-gray-100 dark:border-white/10 flex-shrink-0"
                      >
                        <div className="w-full h-full overflow-hidden bg-gray-50 dark:bg-[var(--surface)] rounded-sm">
                          <img 
                            src={getProfileImage(selectedMember)} 
                            alt={data.namaPanggung}
                            className="w-full h-full object-cover"
                            style={{ objectPosition: data.objectPosition || 'center 20%' }}
                          />
                        </div>
                        
                        {/* Decorative Tape or Label could go here, but keeping it clean for now */}
                        <div className="absolute bottom-4 md:bottom-8 left-0 right-0 text-center">
                          <span className="font-marker text-2xl md:text-3xl text-gray-400 dark:text-gray-300 opacity-40 select-none">
                            {data.namaPanggung}
                          </span>
                        </div>
                      </motion.div>

                      {/* Content Stage */}
                      <div className="relative flex-1 flex flex-col justify-center">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          <div className="flex items-center gap-3 mb-6">
                            <span 
                              className="px-5 py-2 rounded-full text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg"
                              style={{ backgroundColor: data.color }}
                            >
                              {data.tagline}
                            </span>
                          </div>
                          
                          <h1 
                            className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-tight mb-8"
                            style={{ color: data.color }}
                          >
                            {data.namaPanggung}
                          </h1>

                          {/* Minimal Bio */}
                          <div className="mb-10 text-gray-600 dark:text-gray-300">
                             <p className="text-lg md:text-xl leading-relaxed italic font-medium border-l-4 pl-6" style={{ borderColor: data.color }}>
                                "{data.jiko || selectedMember.jikoshoukai || 'Salam kenal semuanya!'}"
                             </p>
                          </div>

                          {/* Stats Grid - Clean Cards */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 flex items-center gap-4 hover:shadow-md transition-shadow">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-gray-50 dark:bg-white/10" style={{ color: data.color }}>
                                <FaBirthdayCake />
                              </div>
                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Birthday</p>
                                <p className="font-bold text-gray-900 dark:text-white text-sm">{data.tanggalLahir}</p>
                              </div>
                            </div>

                            <a 
                              href={`https://instagram.com/${data.instagram?.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 flex items-center gap-4 hover:shadow-md transition-shadow group"
                            >
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-gray-50 dark:bg-white/10 group-hover:bg-[#E1306C] group-hover:text-white transition-colors" style={{ color: data.color }}>
                                <FaInstagram />
                              </div>
                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Contact</p>
                                <p className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-[#E1306C] transition-colors">{data.instagram}</p>
                              </div>
                            </a>
                            
                            <div className="md:col-span-2 bg-white dark:bg-white/5 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 flex items-start gap-4 hover:shadow-md transition-shadow">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-gray-50 dark:bg-white/10 flex-shrink-0" style={{ color: data.color }}>
                                <FaPalette />
                              </div>
                              <div className="flex-1">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Hobbies & Interests</p>
                                <p className="font-bold text-gray-900 dark:text-white text-sm leading-snug">{data.hobi}</p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </div>

                    {/* Gallery */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: data.color }}
                        >
                          <FaHeart className="text-white" />
                        </div>
                        <h2 className="text-xl font-black uppercase tracking-widest">Gallery</h2>
                      </div>

                      <div className="grid grid-cols-3 gap-3 md:gap-5">
                        {(() => {
                          if (selectedMember.is_secret) {
                            return [1, 2, 3].map((num) => (
                              <div
                                key={num}
                                className="aspect-square rounded-2xl overflow-hidden shadow-lg bg-black/40 border border-purple-500/30 flex flex-col items-center justify-center text-purple-300 p-4 text-center"
                              >
                                <FaLock className="text-xl md:text-2xl mb-2 text-purple-400 opacity-80" />
                                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">Terkunci</span>
                                <span className="text-[8px] text-zinc-500 mt-0.5">Teaser Member</span>
                              </div>
                            ))
                          }

                          const galleryList = (selectedMember.member_gallery && selectedMember.member_gallery.length > 0)
                            ? selectedMember.member_gallery.map(g => g.image_url)
                            : [1, 2, 3].map(num => {
                                const fileBase = clean === 'acaa' ? 'aca' : clean
                                return `/images/members/gallery/${clean}/${fileBase} (${num}).webp`
                              })

                          return galleryList.slice(0, 3).map((imgUrl, idx) => {
                            const resolvedSrc = imgUrl.startsWith('http')
                              ? imgUrl
                              : (imgUrl.startsWith('/') ? getAssetPath(imgUrl) : getAssetPath(`/images/members/${imgUrl}`))

                            return (
                              <motion.div 
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 + idx * 0.1 }}
                                whileHover={{ scale: 1.03 }}
                                className="aspect-square rounded-2xl overflow-hidden shadow-lg group cursor-pointer"
                                style={{
                                  boxShadow: `0 10px 30px ${data.color}20`
                                }}
                              >
                                <img 
                                  src={resolvedSrc} 
                                  alt={`${data.namaPanggung} Gallery ${idx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                  onError={(e) => {
                                    e.target.onerror = null
                                    e.target.src = getAssetPath('/images/members/placeholder.svg')
                                  }}
                                />
                              </motion.div>
                            )
                          })
                        })()}
                      </div>
                    </motion.div>
                  </>
                )
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

    </div>
  )
}

export default MembersPage


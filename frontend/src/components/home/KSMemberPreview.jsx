import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FaArrowRight, FaLock } from 'react-icons/fa'
import { getAssetPath } from '../../lib/pathUtils'

const MEMBER_FLAVORS = {
  latte: { kanji: 'ラテ', role: 'Kohi Latte', accent: 'var(--primary)' },
  macchiato: { kanji: 'マキアート', role: 'Kohi Macchiato', accent: 'var(--accent)' },
  affogato: { kanji: 'アフォガート', role: 'Kohi Affogato', accent: '#C9A97E' },
}

const MemberCard = ({ member, index }) => {
  const isSecret = member.is_secret
  const color = member.color || 'var(--primary)'
  const name = isSecret ? '???' : (member.nama_panggung || member.name || 'Member')
  const tagline = isSecret ? 'Secret Teaser' : (member.tagline || 'Kohi Sekai Member')
  const imageUrl = member.image_url ? getAssetPath(member.image_url) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: index * 0.12 }}
      className="group relative flex flex-col rounded-3xl overflow-hidden bg-surface border border-border hover:border-primary/40 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/8"
    >
      {/* Photo */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-surface to-background">
        {imageUrl && !isSecret ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${color}20, ${color}40)` }}>
            {isSecret ? (
              <FaLock size={48} style={{ color }} className="opacity-60" />
            ) : (
              <img
                src={getAssetPath('/images/members/placeholder.svg')}
                alt="Placeholder"
                className="w-full h-full object-cover opacity-30 grayscale mix-blend-overlay"
              />
            )}
          </div>
        )}
        {/* Color accent stripe */}
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: color }} />
        {/* Kanji overlay */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-xs font-black text-white bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg">
            {member.member_id || 'ks'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-5 flex flex-col gap-2 flex-1">
        <div>
          <p className="text-[10px] font-black tracking-[0.3em] uppercase" style={{ color }}>
            {isSecret ? '?????・?????・?????' : (member.nama_kanji || member.kanji || 'コーヒー・セカイ')}
          </p>
          <h3 className="text-xl font-black text-text-primary mt-1 tracking-tight">{name}</h3>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed flex-1 line-clamp-2">
          {tagline}
        </p>
      </div>
    </motion.div>
  )
}

const KSMemberPreview = ({ members = [], config = {} }) => {
  // Show max 3 non-group members
  const preview = members
    .filter(m => m.member_id !== 'group')
    .slice(0, 3)

  // Fallback placeholder members when DB is empty
  const placeholders = [
    { id: 'latte', nama_panggung: 'Kohi Latte', tagline: 'Manis seperti latte, hangat dan menyenangkan.', color: 'var(--primary)', nama_kanji: 'コーヒー・ラテ', member_id: 'latte' },
    { id: 'macchiato', nama_panggung: 'Kohi Macchiato', tagline: 'Tegas dan bersemangat, macchiato sejati.', color: 'var(--accent)', nama_kanji: 'コーヒー・マキアート', member_id: 'macchiato' },
    { id: 'affogato', nama_panggung: 'Kohi Affogato', tagline: 'Misterius dan intens seperti affogato.', color: '#C9A97E', nama_kanji: 'コーヒー・アフォガート', member_id: 'affogato' },
  ]

  const displayMembers = preview.length > 0 ? preview : placeholders

  return (
    <section className="py-20 sm:py-32 px-4 bg-background relative overflow-hidden">
      {/* Subtle background accent */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      <div className="container mx-auto max-w-7xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between gap-6 mb-8 sm:mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-text-primary leading-none uppercase">
            {config?.title || 'Members'}
          </h2>
          <Link
            to="/about"
            className="group flex items-center gap-2 text-sm font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
          >
            Lihat Semua
            <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Member Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {displayMembers.map((member, i) => (
            <MemberCard key={member.id || member.member_id || i} member={member} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default KSMemberPreview

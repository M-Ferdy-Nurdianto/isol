import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FaArrowRight, FaLock } from 'react-icons/fa'
import { getAssetPath } from '../../lib/pathUtils'

const MemberCard = ({ member, index }) => {
  const isSecret = member.is_secret
  const name = isSecret ? 'Secret Member' : (member.nama_panggung || member.name || 'Member')
  const tagline = isSecret ? 'Coming Soon' : (member.tagline || member.role || '')
  const imageUrl = member.image_url ? getAssetPath(member.image_url) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="w-full"
    >
      <Link
        to="/about"
        className="group block rounded-2xl overflow-hidden bg-surface border border-white/10 hover:border-white/30 transition-all duration-300 hover:-translate-y-1 text-left"
      >
        {/* Photo Container */}
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-black/60">
          {imageUrl && !isSecret ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = getAssetPath('/images/members/placeholder.svg')
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-black/50 text-center">
              {isSecret ? (
                <FaLock size={20} className="text-zinc-500 mb-2" />
              ) : (
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black text-white bg-white/10 mb-2">
                  {name.charAt(0)}
                </div>
              )}
              <span className="text-[10px] font-bold tracking-widest text-text-secondary uppercase">
                {isSecret ? 'COMING SOON' : 'KOHI SEKAI'}
              </span>
            </div>
          )}
        </div>

        {/* Minimal Info */}
        <div className="p-3.5 sm:p-4 bg-surface">
          <h3 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-primary transition-colors truncate">
            {name}
          </h3>
          {tagline && (
            <p className="text-xs text-text-secondary truncate mt-0.5">
              {tagline}
            </p>
          )}
        </div>
      </Link>
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
    <section className="py-10 sm:py-16 px-4 bg-background bg-pattern-dots relative">
      <div className="container mx-auto max-w-3xl">
        {/* Section header */}
        <div className="flex items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-text-primary uppercase">
              {config?.title || 'Members'}
            </h2>
            {config?.description && (
              <p className="text-xs text-text-secondary mt-1">
                {config.description}
              </p>
            )}
          </div>
          <Link
            to="/about"
            className="group flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
          >
            <span>Lihat Semua</span>
            <FaArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Mobile View: Manual Responsive (md:hidden) — UI/UX Pro Max Stack */}
        <div className="md:hidden space-y-2.5">
          {displayMembers.map((member, i) => {
            const isSecret = member.is_secret
            const name = isSecret ? 'Secret Member' : (member.nama_panggung || member.name || 'Member')
            const tagline = isSecret ? 'Coming Soon' : (member.tagline || member.role || '')
            const imageUrl = member.image_url ? getAssetPath(member.image_url) : null
            const role = member.member_id ? `Kohi ${member.member_id.charAt(0).toUpperCase() + member.member_id.slice(1)}` : 'Idol'

            return (
              <motion.div
                key={member.id || member.member_id || i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Link
                  to="/about"
                  className="flex items-center gap-3.5 p-3 rounded-2xl bg-surface border border-white/10 active:scale-[0.98] transition-transform text-left"
                >
                  {/* Photo */}
                  <div className="w-16 h-20 rounded-xl overflow-hidden bg-black/60 shrink-0">
                    {imageUrl && !isSecret ? (
                      <img
                        src={imageUrl}
                        alt={name}
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = getAssetPath('/images/members/placeholder.svg')
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-black/40 text-text-secondary">
                        {isSecret ? <FaLock size={16} /> : <span className="font-black text-sm">{name.charAt(0)}</span>}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-sm font-bold text-text-primary truncate">
                        {name}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                        {role}
                      </span>
                    </div>
                    {tagline && (
                      <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                        {tagline}
                      </p>
                    )}
                  </div>

                  {/* Arrow Indicator */}
                  <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-text-secondary shrink-0">
                    <FaArrowRight size={10} />
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Desktop View: Manual Responsive (hidden md:block) */}
        <div className="hidden md:block">
          <div className="grid grid-cols-3 gap-5">
            {displayMembers.map((member, i) => (
              <MemberCard key={member.id || member.member_id || i} member={member} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default KSMemberPreview

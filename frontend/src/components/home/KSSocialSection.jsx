import { motion } from 'framer-motion'
import { FaInstagram, FaTiktok, FaYoutube, FaSpotify, FaWhatsapp } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'

const getSocialMeta = (platformRaw = '') => {
  const p = platformRaw.trim().toLowerCase()
  if (p.includes('insta')) {
    return { name: 'Instagram', Icon: FaInstagram, desc: 'Foto & update harian' }
  }
  if (p.includes('tik')) {
    return { name: 'TikTok', Icon: FaTiktok, desc: 'Video & behind the scenes' }
  }
  if (p.includes('you') || p.includes('yt')) {
    return { name: 'YouTube', Icon: FaYoutube, desc: 'MV & konten eksklusif' }
  }
  if (p === 'x' || p.includes('twit')) {
    return { name: 'X', Icon: FaXTwitter, desc: 'Update cepat & interaksi' }
  }
  if (p.includes('spot')) {
    return { name: 'Spotify', Icon: FaSpotify, desc: 'Dengarkan lagu kami' }
  }
  if (p.includes('what') || p.includes('wa')) {
    return { name: 'WhatsApp', Icon: FaWhatsapp, desc: 'Hubungi kami' }
  }
  return { name: platformRaw, Icon: FaInstagram, desc: 'Media sosial resmi' }
}

const defaultSocials = [
  { platform: 'Instagram', url: 'https://instagram.com/kohisekai' },
  { platform: 'TikTok', url: 'https://tiktok.com/@kohisekai' },
  { platform: 'YouTube', url: 'https://youtube.com/@KohiSekai' },
  { platform: 'X', url: 'https://x.com/kohisekai' },
]

const KSSocialSection = ({ config = {} }) => {
  let rawSocials = defaultSocials
  if (config && Array.isArray(config)) {
    rawSocials = config
  } else if (typeof config === 'string') {
    try {
      rawSocials = JSON.parse(config)
    } catch(e) {}
  } else if (config && config.social_links) {
    try {
      rawSocials = typeof config.social_links === 'string' ? JSON.parse(config.social_links) : config.social_links
    } catch(e) {}
  }

  const socials = rawSocials.map(s => {
    const meta = getSocialMeta(s.platform)
    const href = (s.url && s.url.trim() !== '') ? s.url : 'https://www.instagram.com/kohisekai/'
    let handle = '@kohisekai'
    try {
      const parts = new URL(href).pathname.split('/').filter(Boolean)
      if (parts.length > 0) {
        const last = parts[parts.length - 1]
        handle = last.startsWith('@') ? last : `@${last}`
      }
    } catch(e) {
      handle = '@kohisekai'
    }
    
    return {
      name: meta.name,
      href,
      handle,
      Icon: meta.Icon,
      desc: meta.desc
    }
  })

  return (
    <section className="py-10 sm:py-24 px-4 bg-background bg-pattern-dots relative overflow-hidden">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6 sm:mb-12"
        >
          <h2 className="text-2xl sm:text-5xl md:text-6xl font-black tracking-tight text-text-primary leading-none uppercase">
            CONNECT WITH US
          </h2>
          <p className="text-text-secondary text-xs sm:text-sm mt-2 sm:mt-4 max-w-md mx-auto">
            Jangan ketinggalan update, behind-the-scenes, dan konten eksklusif dari Kohi Sekai.
          </p>
        </motion.div>

        {/* =========================================================================
            MOBILE LAYOUT (md:hidden) — 2x2 GRID (grid-cols-2)
            ========================================================================= */}
        <div className="md:hidden grid grid-cols-2 gap-3">
          {socials.map((s, i) => {
            const Icon = s.Icon
            return (
              <motion.a
                key={`mobile-${s.name}-${i}`}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="group relative flex flex-col items-start p-3.5 rounded-2xl bg-surface border border-border overflow-hidden active:scale-95 transition-all hover:border-primary/40"
              >
                {/* BG icon watermark */}
                <div className="absolute -bottom-2 -right-2 text-[44px] text-primary opacity-[0.04] pointer-events-none group-hover:opacity-[0.08] transition-opacity">
                  <Icon />
                </div>

                <div className="relative z-10 flex flex-col gap-2 w-full flex-1">
                  {/* Icon */}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/15 text-primary border border-primary/25 shadow-sm group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                    <Icon size={18} />
                  </div>

                  {/* Text */}
                  <div className="min-w-0 w-full">
                    <h3 className="text-xs font-black text-text-primary leading-tight truncate">{s.name}</h3>
                    <p className="text-[10px] font-bold text-primary truncate leading-tight mt-0.5">{s.handle}</p>
                  </div>

                  <p className="text-[9px] text-text-secondary leading-tight line-clamp-2">
                    {s.desc}
                  </p>
                </div>
              </motion.a>
            )
          })}
        </div>

        {/* =========================================================================
            DESKTOP LAYOUT (hidden md:grid) — SEBARIS 1x4 (grid-cols-4)
            ========================================================================= */}
        <div className="hidden md:grid md:grid-cols-4 gap-5">
          {socials.map((s, i) => {
            const Icon = s.Icon
            return (
              <motion.a
                key={`desktop-${s.name}-${i}`}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="group relative flex flex-col items-start p-6 rounded-3xl bg-surface border border-border hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden"
              >
                {/* BG icon watermark */}
                <div className="absolute -bottom-4 -right-4 text-[76px] text-primary opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-300 pointer-events-none">
                  <Icon />
                </div>

                <div className="relative z-10 flex flex-col gap-3 flex-1 w-full">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-primary/15 text-primary border border-primary/25 shadow-sm group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                    <Icon size={22} />
                  </div>

                  {/* Text */}
                  <div>
                    <h3 className="text-sm font-black text-text-primary">{s.name}</h3>
                    <p className="text-xs font-bold text-primary mt-0.5">{s.handle}</p>
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed">{s.desc}</p>
                </div>
              </motion.a>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default KSSocialSection

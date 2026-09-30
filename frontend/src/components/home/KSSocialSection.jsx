import { motion } from 'framer-motion'
import { FaInstagram, FaTiktok, FaYoutube, FaTwitter, FaSpotify, FaWhatsapp } from 'react-icons/fa'
import * as Icons from 'react-icons/fa'

const PLATFORM_DATA = {
  Instagram: { icon: 'FaInstagram', color: '#E1306C', desc: 'Foto & update harian' },
  TikTok: { icon: 'FaTiktok', color: '#010101', desc: 'Video & behind the scenes' },
  YouTube: { icon: 'FaYoutube', color: '#FF0000', desc: 'MV & konten eksklusif' },
  Twitter: { icon: 'FaTwitter', color: '#1DA1F2', desc: 'Update cepat & interaksi' },
  WhatsApp: { icon: 'FaWhatsapp', color: '#25D366', desc: 'Hubungi kami' },
  Spotify: { icon: 'FaSpotify', color: '#1DB954', desc: 'Dengarkan lagu kami' }
}

const defaultSocials = [
  { platform: 'Instagram', url: 'https://instagram.com/kohisekai' },
  { platform: 'TikTok', url: 'https://tiktok.com/@kohisekai' },
  { platform: 'YouTube', url: 'https://youtube.com/@KohiSekai' },
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
    const data = PLATFORM_DATA[s.platform] || PLATFORM_DATA.Instagram
    const href = (s.url && s.url.trim() !== '') ? s.url : 'https://www.instagram.com/kohisekai/'
    // extract handle from url: e.g. https://instagram.com/johndoe -> @johndoe
    let handle = '@'
    try {
      const parts = new URL(href).pathname.split('/')
      handle = '@' + (parts[parts.length - 1] || parts[parts.length - 2] || 'kohisekai')
    } catch(e) { handle = '@kohisekai' }
    
    return {
      name: s.platform,
      href: href,
      handle,
      icon: data.icon,
      color: data.color,
      desc: data.desc
    }
  })

  return (
    <section className="py-20 sm:py-32 px-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-gradient-to-b from-primary/5 to-transparent" />
      </div>

      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-text-primary leading-none uppercase">
            CONNECT WITH US
          </h2>
          <p className="text-text-secondary text-sm mt-4 max-w-md mx-auto">
            Jangan ketinggalan update, behind-the-scenes, dan konten eksklusif dari Kohi Sekai.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
          {socials.map((s, i) => {
            const Icon = Icons[s.icon] || Icons.FaLink
            return (
              <motion.a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="group relative flex flex-col items-start p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-surface border border-border hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden"
              >
                {/* BG icon watermark */}
                <div className="absolute -bottom-4 -right-4 text-[80px] opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-300" style={{ color: s.color || 'var(--primary)' }}>
                  <Icon />
                </div>

                <div className="relative z-10 flex flex-col gap-3 flex-1">
                  {/* Icon */}
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-md"
                    style={{ backgroundColor: s.color || 'var(--primary)' }}
                  >
                    <Icon size={20} />
                  </div>

                  {/* Text */}
                  <div>
                    <h3 className="text-sm font-black text-text-primary mt-0.5">{s.name}</h3>
                    <p className="text-[10px] font-bold text-primary mt-0.5">{s.handle || s.username}</p>
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed">{s.desc || s.description}</p>
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

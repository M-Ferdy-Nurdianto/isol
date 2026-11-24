import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaInstagram, FaYoutube, FaTiktok, FaSpotify, FaWhatsapp } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import api from '../lib/api'

const KSFooter = ({ config: propConfig }) => {
  const [config, setConfig] = useState(propConfig || {})
  const [socialLinks, setSocialLinks] = useState([])

  useEffect(() => {
    let isMounted = true
    api.get('/config').then(res => {
      if (!isMounted) return
      const data = res.data?.data || {}
      
      let footerSettings = {}
      try { footerSettings = JSON.parse(data.footer_settings) || {} } catch(e) {}
      setConfig(prev => ({ ...prev, ...footerSettings }))

      let parsedSocials = []
      try { parsedSocials = JSON.parse(data.social_links) || [] } catch(e) {}
      setSocialLinks(parsedSocials)
    }).catch(console.error)
    return () => { isMounted = false }
  }, [])

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About Us', href: '/about' },
    { name: 'Shop', href: '/shop' },
    { name: 'Music', href: '/music' },
  ]

  const getPlatformIcon = (platform) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return FaInstagram
      case 'twitter': 
      case 'twitter / x':
      case 'x': return FaXTwitter
      case 'youtube': return FaYoutube
      case 'tiktok': return FaTiktok
      case 'spotify': return FaSpotify
      case 'whatsapp': return FaWhatsapp
      default: return FaInstagram
    }
  }

  // Fallback to IG link if current link is empty
  const igLinkObj = socialLinks.find(s => s.platform.toLowerCase() === 'instagram')
  const defaultHref = igLinkObj?.url || 'https://instagram.com/kohisekai'

  // Default social skeleton if api takes time
  const displaySocials = socialLinks.length > 0 ? socialLinks : [
    { platform: 'Instagram', url: '' },
    { platform: 'Twitter', url: '' },
    { platform: 'YouTube', url: '' },
    { platform: 'TikTok', url: '' },
    { platform: 'Spotify', url: '' },
    { platform: 'WhatsApp', url: '' }
  ]

  return (
    <footer className="bg-[#F5EDE2] dark:bg-[#28211B] border-t border-[#E8DDD0] dark:border-[#3E3228] pt-8 sm:pt-14 pb-24 sm:pb-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-black tracking-tighter text-text-primary">
                KOHI<span className="text-primary">SEKAI</span>
              </h3>
              <p className="text-primary/80 text-xs font-bold tracking-widest mt-1">
                {config?.brand_subtitle_jp || 'コーヒーの世界へようこそ'}
              </p>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
              {config?.brand_description || 'Grup idol dengan jiwa kopi — hangat, kuat, dan penuh karakter.\nSelamat datang di dunia Kohi Sekai.'}
            </p>
          </div>

          {/* Nav */}
          <div className="space-y-4">
            <h4 className="text-xs font-black tracking-[0.3em] text-text-secondary uppercase">Navigasi</h4>
            <ul className="space-y-3">
              {navLinks.map(l => (
                <li key={l.href}>
                  <Link to={l.href} className="text-text-secondary hover:text-primary text-sm font-semibold transition-colors duration-200">
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div className="space-y-4">
            <h4 className="text-xs font-black tracking-[0.3em] text-text-secondary uppercase">Ikuti Kami</h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 w-max">
              {displaySocials.map(({ platform, url }) => {
                const Icon = getPlatformIcon(platform)
                let label = platform
                if (label.toLowerCase().includes('twitter')) label = 'X'
                
                // If url is empty, default to defaultHref (IG link)
                const href = url ? url : defaultHref

                return (
                  <a
                    key={platform}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className="text-text-secondary hover:text-primary hover:scale-110 transition-all duration-200 flex items-center justify-center"
                  >
                    <Icon size={24} />
                  </a>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-10 pt-4 sm:pt-6 border-t border-[#E8DDD0] dark:border-[#3E3228] text-xs text-text-secondary/60 font-medium">
          {/* Mobile Layout (sm:hidden) — Rapi 2 baris terpusat tanpa wrap berantakan */}
          <div className="sm:hidden flex flex-col items-center text-center gap-1.5">
            <p className="text-[11px] text-text-secondary/80">
              {config?.copyright_text || '© 2026 KOHI SEKAI. ALL RIGHTS RESERVED.'}
            </p>
            <div className="flex items-center justify-center gap-2 text-[10px] text-text-secondary/40">
              <a
                href={config?.creator_url || 'https://instagram.com/ikifer'}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-text-secondary/80 transition-colors"
              >
                {(!config?.creator_text || config.creator_text === 'Created by @ikifer') ? '@ikifer' : config.creator_text}
              </a>
              <span>·</span>
              <Link
                to="/admin/login"
                className="hover:text-primary transition-colors"
              >
                Login Staff
              </Link>
              <span>·</span>
              <span className="text-primary/70 font-bold">
                {config?.tagline_jp || 'コーヒーの世界'}
              </span>
            </div>
          </div>

          {/* Desktop Layout (hidden sm:flex) — 1 baris presisi */}
          <div className="hidden sm:flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <p>{config?.copyright_text || '© 2026 KOHI SEKAI. ALL RIGHTS RESERVED.'}</p>
              <span className="opacity-40">·</span>
              <a
                href={config?.creator_url || 'https://instagram.com/ikifer'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-text-secondary/40 hover:text-text-secondary/80 transition-colors"
              >
                {(!config?.creator_text || config.creator_text === 'Created by @ikifer') ? '@ikifer' : config.creator_text}
              </a>
              <span className="opacity-40">·</span>
              <Link
                to="/admin/login"
                className="text-text-secondary/70 hover:text-primary transition-colors hover:underline"
              >
                Login Staff
              </Link>
            </div>
            <p className="text-primary/60 font-black tracking-widest text-xs">
              {config?.tagline_jp || 'コーヒーの世界'}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default KSFooter

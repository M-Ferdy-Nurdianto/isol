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
    <footer className="bg-surface border-t border-border pt-16 pb-10 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-black tracking-tighter text-text-primary">
                KOHI<span className="text-primary">SEKAI</span>
              </h3>
              <p className="text-primary/80 text-xs font-bold tracking-widest mt-1">コーヒーの世界へようこそ</p>
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
            <div className="grid grid-cols-3 gap-x-8 gap-y-6 w-max">
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

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-secondary/60 font-medium">
          <p>{config?.copyright_text || '© 2026 KOHI SEKAI. ALL RIGHTS RESERVED.'}</p>
          <p className="text-primary/60 font-black tracking-widest">コーヒーの世界</p>
        </div>
      </div>
    </footer>
  )
}

export default KSFooter

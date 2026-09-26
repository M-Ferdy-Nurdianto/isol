import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import api from '../lib/api'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { getAssetPath } from '../lib/pathUtils'

// Refactored Components
import HeroSection from '../components/home/HeroSection'
import AboutSection from '../components/home/AboutSection'
import ScheduleSection from '../components/home/ScheduleSection'
import ShopPreviewSection from '../components/home/ShopPreviewSection'
import MediaSection from '../components/home/MediaSection'
import FAQSection from '../components/home/FAQSection'
import SpotifySection from '../components/home/SpotifySection'

const HomePage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [faqs, setFaqs] = useState([])
  const [openFaq, setOpenFaq] = useState(null)
  const [activeMemberId, setActiveMemberId] = useState(null)
  const [events, setEvents] = useState([])
  const [merchPreview, setMerchPreview] = useState([])

  const defaultMembers = [
    { id: 'cissi', name: 'CISSI', color: 'bg-[#5A8F5A]', photo: getAssetPath('/images/hero/cissi.webp?v=33'), posX: 26, posY: 25, scale: 2.1, translateX: -27, translateY: 5 },
    { id: 'channie', name: 'CHANNIE', color: 'bg-[#6A9F6A]', photo: getAssetPath('/images/hero/channie.webp?v=33'), posX: 39, posY: 30, scale: 2.1, translateX: -8, translateY: 8 },
    { id: 'aca', name: 'ACA', color: 'bg-[#4A90B5]', photo: getAssetPath('/images/hero/aca.webp?v=33'), posX: 0, posY: 23, scale: 2.1, translateX: 18, translateY: 0 },
    { id: 'sinta', name: 'SINTA', color: 'bg-[#4C804C]', photo: getAssetPath('/images/hero/sinta.webp?v=33'), posX: 48, posY: 31, scale: 2, translateX: 18, translateY: 6 },
    { id: 'cally', name: 'CALLY', color: 'bg-[#9BBF9B]', photo: getAssetPath('/images/hero/cally.webp?v=33'), posX: 27, posY: 28, scale: 1.8, translateX: 18, translateY: 0 },
    { id: 'rara', name: 'RARA', color: 'bg-[#386638]', photo: getAssetPath('/images/hero/rara.webp?v=33'), posX: 34, posY: 28, scale: 1.8, translateX: -14, translateY: 0 },
  ]

  const [members, setMembers] = useState(defaultMembers)
  const [heroTitle, setHeroTitle] = useState('')
  const [heroSubtitle, setHeroSubtitle] = useState('')
  const [heroTagline, setHeroTagline] = useState('')
  const [heroTitleColor, setHeroTitleColor] = useState('#FFFFFF')
  const [heroSubtitleColor, setHeroSubtitleColor] = useState('#FBBF24')
  const [heroTaglineColor, setHeroTaglineColor] = useState('#FFFFFF')

  useEffect(() => {
    AOS.init({ duration: 1000, once: true })
    const fetchData = async () => {
        try {
            const [eventsRes, faqsRes, configRes, membersRes] = await Promise.allSettled([ 
              api.get('/events'), 
              api.get('/faqs'),
              api.get('/config'),
              api.get('/members')
            ])

            if (eventsRes.status === 'fulfilled' && eventsRes.value.data.success) {
                const monthMap = { 'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5, 'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11 };
                const now = new Date();
                now.setHours(0, 0, 0, 0);

                const upcoming = eventsRes.value.data.data
                    .filter(e => {
                        if (e.is_past) return false;
                        const eventDate = new Date(e.tahun, monthMap[e.bulan] || 0, e.tanggal);
                        return eventDate >= now;
                    })
                    .sort((a, b) => {
                        const dateA = new Date(a.tahun, monthMap[a.bulan] || 0, a.tanggal);
                        const dateB = new Date(b.tahun, monthMap[b.bulan] || 0, b.tanggal);
                        return dateA - dateB;
                    })
                    .slice(0, 3)
                setEvents(upcoming)
            }
            if (faqsRes.status === 'fulfilled' && faqsRes.value.data.success) {
              setFaqs(faqsRes.value.data.data)
            }

            // Dapatkan daftar member aktif dari database (bukan group dan hadir !== false)
            let activeMemberSlugs = null
            if (membersRes.status === 'fulfilled' && membersRes.value.data.success) {
              const dbMembers = membersRes.value.data.data || []
              activeMemberSlugs = new Set()
              dbMembers.forEach(m => {
                if (m.hadir !== false && m.member_id !== 'group') {
                  if (m.member_id) activeMemberSlugs.add(String(m.member_id).toLowerCase().trim())
                  if (m.id) activeMemberSlugs.add(String(m.id).toLowerCase().trim())
                  if (m.nama_panggung) activeMemberSlugs.add(String(m.nama_panggung).toLowerCase().trim())
                  // Toleransi aca / acaa
                  if (m.member_id === 'aca' || m.member_id === 'acaa') {
                    activeMemberSlugs.add('aca')
                    activeMemberSlugs.add('acaa')
                  }
                }
              })
            }

            if (configRes.status === 'fulfilled' && configRes.value.data.success) {
              const configData = configRes.value.data.data || {}
              if (configData.hero_settings) {
                let settings = configData.hero_settings
                if (typeof settings === 'string') {
                  try { settings = JSON.parse(settings) } catch (_) {}
                }
                if (settings.title) setHeroTitle(settings.title)
                if (settings.subtitle) setHeroSubtitle(settings.subtitle)
                if (settings.tagline) setHeroTagline(settings.tagline)
                if (settings.titleColor) setHeroTitleColor(settings.titleColor)
                if (settings.subtitleColor) setHeroSubtitleColor(settings.subtitleColor)
                if (settings.taglineColor) setHeroTaglineColor(settings.taglineColor)
                if (Array.isArray(settings.members) && settings.members.length > 0) {
                  const filteredMembers = activeMemberSlugs
                    ? settings.members.filter(m => {
                        const mId = String(m.id || '').toLowerCase().trim()
                        const mName = String(m.name || '').toLowerCase().trim()
                        return activeMemberSlugs.has(mId) || activeMemberSlugs.has(mName)
                      })
                    : settings.members
                  setMembers(filteredMembers)
                }
              }
            }

            try {
                const merchRes = await api.get('/merchandise?available=true')
                if (merchRes.data.success) setMerchPreview(merchRes.data.data.slice(0, 4))
            } catch (_) {}
        } catch (error) {
            console.error('Failed to fetch home data:', error)
        } finally {
            setLoading(false)
        }
    }
    fetchData()
  }, [])
  
  if (loading) return null // Or a loader

  return (
    <div className="min-h-screen bg-white text-dark overflow-x-hidden relative">
      <div className="noise-bg opacity-10"></div>
      <Header />
      
      <HeroSection 
        members={members} 
        heroTitle={heroTitle}
        heroSubtitle={heroSubtitle}
        heroTagline={heroTagline}
        heroTitleColor={heroTitleColor}
        heroSubtitleColor={heroSubtitleColor}
        heroTaglineColor={heroTaglineColor}
        activeMemberId={activeMemberId} 
        setActiveMemberId={setActiveMemberId} 
        navigate={navigate} 
      />
      
      <SpotifySection />
      
      <AboutSection navigate={navigate} getAssetPath={getAssetPath} />
      
      <ScheduleSection events={events} navigate={navigate} />
      
      <ShopPreviewSection merchPreview={merchPreview} navigate={navigate} getAssetPath={getAssetPath} />
      
      <MediaSection navigate={navigate} getAssetPath={getAssetPath} />
      
      <FAQSection faqs={faqs} openFaq={openFaq} setOpenFaq={setOpenFaq} />

      <Footer />
    </div>
  )
}

export default HomePage

import { useState, useEffect } from 'react'
import KSHeader from '../components/KSHeader'
import KSFooter from '../components/KSFooter'
import KSHero from '../components/home/KSHero'
import KSMemberPreview from '../components/home/KSMemberPreview'
import KSNewsSection from '../components/home/KSNewsSection'
import KSUpcomingEvent from '../components/home/KSUpcomingEvent'
import KSSocialSection from '../components/home/KSSocialSection'
import KSFAQSection from '../components/home/KSFAQSection'
import GroupPhotoSection from '../components/home/GroupPhotoSection'
import KSLeaderboard from '../components/home/KSLeaderboard'
import api from '../lib/api'

const KSHomePage = () => {
  const [data, setData] = useState({
    events: [],
    members: [],
    faqs: [],
    news: [],
    config: {},
    loading: true,
  })

  useEffect(() => {
    const monthMap = { Januari: 0, Februari: 1, Maret: 2, April: 3, Mei: 4, Juni: 5, Juli: 6, Agustus: 7, September: 8, Oktober: 9, November: 10, Desember: 11 }

    const fetchAll = async () => {
      try {
        const [eventsRes, faqsRes, configRes, membersRes, newsRes] = await Promise.allSettled([
          api.get('/events'),
          api.get('/faqs'),
          api.get('/config'),
          api.get('/members'),
          api.get('/news?includeDrafts=false')
        ])

        let events = []
        if (eventsRes.status === 'fulfilled' && eventsRes.value.data.success) {
          const now = new Date()
          now.setHours(0, 0, 0, 0)
          events = eventsRes.value.data.data
            .filter(e => {
              if (e.is_past) return false
              const d = new Date(e.tahun, monthMap[e.bulan] || 0, e.tanggal)
              return d >= now
            })
            .sort((a, b) => new Date(a.tahun, monthMap[a.bulan] || 0, a.tanggal) - new Date(b.tahun, monthMap[b.bulan] || 0, b.tanggal))
            .slice(0, 4)
        }

        let faqs = []
        if (faqsRes.status === 'fulfilled' && faqsRes.value.data.success) {
          faqs = faqsRes.value.data.data
        }

        let members = []
        if (membersRes.status === 'fulfilled' && membersRes.value.data.success) {
          members = (membersRes.value.data.data || []).filter(m => m.member_id !== 'group')
        }
        
        let news = []
        if (newsRes.status === 'fulfilled' && newsRes.value.data.success) {
          news = newsRes.value.data.data
        }

        let configObj = {}
        if (configRes.status === 'fulfilled' && configRes.value.data.success) {
          const rawCfg = configRes.value.data.data || {}
          Object.keys(rawCfg).forEach(key => {
            try {
              configObj[key] = JSON.parse(rawCfg[key])
            } catch (e) {
              configObj[key] = rawCfg[key]
            }
          })
        }

        setData({ events, members, faqs, news, config: configObj, loading: false })
      } catch (err) {
        console.error('KSHomePage fetchAll error:', err)
        setData(prev => ({ ...prev, loading: false }))
      }
    }

    fetchAll()
  }, [])

  if (data.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs font-black tracking-widest text-text-secondary uppercase">Loading...</p>
        </div>
      </div>
    )
  }

  const { config, events, members, faqs, news } = data

  return (
    <div className="min-h-screen bg-background text-text-primary overflow-x-hidden">
      <KSHeader />

      <main>
        <KSHero
          config={config.hero_settings}
          events={events}
        />

        <GroupPhotoSection config={config.group_photo} />

        <KSMemberPreview 
          members={members} 
          config={config.members_section} 
        />

        <KSNewsSection 
          config={config} 
          news={news}
        />

        <KSLeaderboard 
          members={members}
        />

        <KSUpcomingEvent 
          events={events} 
          config={config.events_section} 
        />

        <KSSocialSection 
          config={config} 
        />

        <KSFAQSection 
          config={config}
          faqs={(() => {
            if (!config.faq_items) return faqs;
            try {
              return typeof config.faq_items === 'string' ? JSON.parse(config.faq_items) : config.faq_items;
            } catch (e) {
              return faqs;
            }
          })()} 
        />
      </main>

      <KSFooter config={config.footer_settings} />
    </div>
  )
}

export default KSHomePage

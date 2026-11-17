import { useState, useEffect } from 'react'
import KSHeader from '../../components/KSHeader'
import KSFooter from '../../components/KSFooter'
import KSHero from '../../components/home/KSHero'
import KSMemberPreview from '../../components/home/KSMemberPreview'
import KSNewsSection from '../../components/home/KSNewsSection'
import KSUpcomingEvent from '../../components/home/KSUpcomingEvent'
import KSSocialSection from '../../components/home/KSSocialSection'
import KSFAQSection from '../../components/home/KSFAQSection'
import GroupPhotoSection from '../../components/home/GroupPhotoSection'
import KSLeaderboard from '../../components/home/KSLeaderboard'
import api from '../../lib/api'

// In-memory cache for instantaneous, zero-animation page switching
let cachedHomeData = null

const KSHomePage = () => {
  const [data, setData] = useState(() => cachedHomeData || {
    events: [],
    members: [],
    faqs: [],
    news: [],
    config: {},
    loading: !cachedHomeData,
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

        const freshData = { events, members, faqs, news, config: configObj, loading: false }
        cachedHomeData = freshData
        setData(freshData)
      } catch (err) {
        console.error('KSHomePage fetchAll error:', err)
        setData(prev => ({ ...prev, loading: false }))
      }
    }

    fetchAll()
  }, [])

  if (data.loading && !cachedHomeData) {
    return (
      <div className="min-h-screen bg-background text-text-primary overflow-x-hidden">
        <KSHeader />
        <main className="pt-24 sm:pt-36 pb-24 px-4 flex flex-col items-center justify-center min-h-[75svh]">
          <div className="w-full max-w-sm flex flex-col items-center gap-4 animate-pulse">
            <div className="h-4 w-28 bg-surface rounded-full" />
            <div className="h-10 w-64 bg-surface rounded-2xl" />
            <div className="h-4 w-52 bg-surface rounded-full" />
            <div className="h-12 w-44 bg-surface rounded-full mt-4" />
          </div>
        </main>
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
            if (Array.isArray(faqs) && faqs.length > 0) return faqs;
            if (!config?.faq_items) return [];
            try {
              return typeof config.faq_items === 'string' ? JSON.parse(config.faq_items) : config.faq_items;
            } catch (e) {
              return [];
            }
          })()} 
        />
      </main>

      <KSFooter config={config.footer_settings} />
    </div>
  )
}

export default KSHomePage

import { useState, useEffect } from 'react'
import api from '../../lib/api'

// Shared in-memory cache for instantaneous, zero-animation page switching
let cachedHomeData = null

export function useHomeData() {
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
        if (eventsRes.status === 'fulfilled' && eventsRes.value.data?.success) {
          const now = new Date()
          now.setHours(0, 0, 0, 0)
          events = (eventsRes.value.data.data || [])
            .filter(e => {
              if (e.is_past) return false
              const d = new Date(e.tahun, monthMap[e.bulan] || 0, e.tanggal)
              return d >= now
            })
            .sort((a, b) => new Date(a.tahun, monthMap[a.bulan] || 0, a.tanggal) - new Date(b.tahun, monthMap[b.bulan] || 0, b.tanggal))
            .slice(0, 4)
        }

        let faqs = []
        if (faqsRes.status === 'fulfilled' && faqsRes.value.data?.success) {
          faqs = faqsRes.value.data.data || []
        }

        let members = []
        if (membersRes.status === 'fulfilled' && membersRes.value.data?.success) {
          members = (membersRes.value.data.data || []).filter(m => m.member_id !== 'group')
        }
        
        let news = []
        if (newsRes.status === 'fulfilled' && newsRes.value.data?.success) {
          news = newsRes.value.data.data || []
        }

        let configObj = {}
        if (configRes.status === 'fulfilled' && configRes.value.data?.success) {
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
        console.error('useHomeData fetchAll error:', err)
        setData(prev => ({ ...prev, loading: false }))
      }
    }

    fetchAll()
  }, [])

  return data
}

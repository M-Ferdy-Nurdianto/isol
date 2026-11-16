import { useState, useEffect } from 'react'
import api from '../../lib/api'

/**
 * useHomeData (Shared Data Fetching for Home Page)
 * Reused identically by Desktop and Mobile layouts to prevent logic duplication.
 */
export const useHomeData = () => {
  const [data, setData] = useState({
    events: [],
    members: [],
    faqs: [],
    news: [],
    config: {},
    loading: true,
    error: null
  })

  useEffect(() => {
    let isMounted = true
    const monthMap = {
      Januari: 0, Februari: 1, Maret: 2, April: 3, Mei: 4, Juni: 5,
      Juli: 6, Agustus: 7, September: 8, Oktober: 9, November: 10, Desember: 11
    }

    const fetchAll = async () => {
      try {
        const [eventsRes, faqsRes, configRes, membersRes, newsRes] = await Promise.allSettled([
          api.get('/events'),
          api.get('/faqs'),
          api.get('/config'),
          api.get('/members'),
          api.get('/news?includeDrafts=false')
        ])

        if (!isMounted) return

        let events = []
        if (eventsRes.status === 'fulfilled' && eventsRes.value.data.success) {
          const now = new Date()
          now.setHours(0, 0, 0, 0)
          events = (eventsRes.value.data.data || [])
            .filter(e => {
              if (e.is_past) return false
              const d = new Date(e.tahun, monthMap[e.bulan] || 0, e.tanggal)
              return d >= now
            })
            .sort((a, b) => new Date(a.tahun, monthMap[a.bulan] || 0, a.tanggal) - new Date(b.tahun, monthMap[b.bulan] || 0, b.tanggal))
            .slice(0, 6)
        }

        let faqs = []
        if (faqsRes.status === 'fulfilled' && faqsRes.value.data.success) {
          faqs = faqsRes.value.data.data || []
        }

        let members = []
        if (membersRes.status === 'fulfilled' && membersRes.value.data.success) {
          members = (membersRes.value.data.data || []).filter(m => m.member_id !== 'group')
        }

        let news = []
        if (newsRes.status === 'fulfilled' && newsRes.value.data.success) {
          news = newsRes.value.data.data || []
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

        setData({
          events,
          members,
          faqs,
          news,
          config: configObj,
          loading: false,
          error: null
        })
      } catch (err) {
        if (!isMounted) return
        console.error('[useHomeData] fetch error:', err)
        setData(prev => ({ ...prev, loading: false, error: err.message }))
      }
    }

    fetchAll()

    return () => {
      isMounted = false
    }
  }, [])

  return data
}

export default useHomeData

import { useState, useEffect } from 'react'
import api from '../../lib/api'

/**
 * useShopData (Shared Data Fetching for Shop Page)
 * Reused identically by Desktop and Mobile to avoid logic duplication.
 */
export const useShopData = () => {
  const [events, setEvents] = useState([])
  const [members, setMembers] = useState([])
  const [groupMember, setGroupMember] = useState(null)
  const [config, setConfig] = useState(null)
  const [merchandise, setMerchandise] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        const [eventsRes, membersRes, configRes, merchRes] = await Promise.allSettled([
          api.get('/events'),
          api.get('/members'),
          api.get('/config'),
          api.get('/merchandise')
        ])

        if (!isMounted) return

        let fetchedEvents = []
        if (eventsRes.status === 'fulfilled' && eventsRes.value.data?.success) {
          fetchedEvents = eventsRes.value.data.data || []
        }

        let fetchedMembers = []
        let groupObj = null
        if (membersRes.status === 'fulfilled' && membersRes.value.data?.success) {
          const rawMembers = membersRes.value.data.data || []
          groupObj = rawMembers.find(m => m.member_id === 'group') || null
          fetchedMembers = rawMembers.filter(m => m.member_id !== 'group')
        }

        let cfg = null
        if (configRes.status === 'fulfilled' && configRes.value.data?.success) {
          cfg = configRes.value.data.data
        }

        let merchList = []
        if (merchRes.status === 'fulfilled' && merchRes.value.data?.success) {
          merchList = merchRes.value.data.data || []
        }

        setEvents(fetchedEvents)
        setMembers(fetchedMembers)
        setGroupMember(groupObj)
        setConfig(cfg)
        setMerchandise(merchList)
        setLoading(false)
      } catch (err) {
        if (!isMounted) return
        console.error('[useShopData] fetch error:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [])

  return {
    events,
    members,
    groupMember,
    config,
    merchandise,
    loading,
    error
  }
}

export default useShopData

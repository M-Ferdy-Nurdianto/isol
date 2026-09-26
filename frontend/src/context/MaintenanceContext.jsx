import { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/api'
import { supabase } from '../lib/supabase'

const MaintenanceContext = createContext({
  isMaintenance: false,
  maintenanceMessage: '',
  maintenanceEstimatedEnd: '',
  loading: true,
  refreshConfig: () => {}
})

export const MaintenanceProvider = ({ children }) => {
  const [isMaintenance, setIsMaintenance] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState('')
  const [maintenanceEstimatedEnd, setMaintenanceEstimatedEnd] = useState('')
  const [loading, setLoading] = useState(true)

  const applyConfigData = (data) => {
    if (!data) return
    const isMt = data.maintenance_mode === 'true' || data.maintenance_mode === true
    setIsMaintenance(isMt)
    if (data.maintenance_message !== undefined) {
      setMaintenanceMessage(data.maintenance_message || '')
    }
    if (data.maintenance_estimated_end !== undefined) {
      setMaintenanceEstimatedEnd(data.maintenance_estimated_end || '')
    }
  }

  const fetchConfig = async () => {
    try {
      const res = await api.get('/config')
      if (res.data?.success && res.data?.data) {
        applyConfigData(res.data.data)
      }
    } catch (err) {
      console.error('[MaintenanceContext] Error fetching config:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()

    // Realtime subscription to 'config' table if Supabase is active
    let channel = null
    if (supabase) {
      try {
        channel = supabase
          .channel('public:config:maintenance')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'config' },
            (payload) => {
              const item = payload.new
              if (item && item.key) {
                if (item.key === 'maintenance_mode') {
                  setIsMaintenance(item.value === 'true' || item.value === true)
                } else if (item.key === 'maintenance_message') {
                  setMaintenanceMessage(item.value || '')
                } else if (item.key === 'maintenance_estimated_end') {
                  setMaintenanceEstimatedEnd(item.value || '')
                }
              } else {
                fetchConfig()
              }
            }
          )
          .subscribe()
      } catch (err) {
        console.error('[MaintenanceContext] Realtime subscription error:', err)
      }
    }

    return () => {
      if (supabase && channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [])

  return (
    <MaintenanceContext.Provider
      value={{
        isMaintenance,
        maintenanceMessage,
        maintenanceEstimatedEnd,
        loading,
        refreshConfig: fetchConfig
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  )
}

export const useMaintenance = () => useContext(MaintenanceContext)
export default MaintenanceContext

import express from 'express'
import { supabase } from '../config/supabase.js'
import { authMiddleware } from '../middleware/auth.js'
import { cachePublic } from '../middleware/cache.js'

const router = express.Router()

// GET: Fetch all config
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('config')
      .select('*')

    if (error) throw error

    // Convert array to object
    const config = {}
    data.forEach(item => {
      config[item.key] = item.value
    })

    res.json({ success: true, data: config })
  } catch (error) {
    console.error('Error fetching config:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET: Fetch app stats for About page
router.get('/stats', async (req, res) => {
  try {
    const [
      { count: membersCount }, 
      { count: eventsCount }, 
      { count: musicCount }
    ] = await Promise.all([
      supabase.from('members').select('*', { count: 'exact', head: true }).neq('member_id', 'group').neq('member_id', 'kohisekai').eq('is_secret', false),
      supabase.from('events').select('*', { count: 'exact', head: true }), // Assuming we just count all events or eq('status', 'published')
      supabase.from('music_items').select('*', { count: 'exact', head: true }).eq('platform', 'spotify')
    ])

    res.json({
      success: true,
      data: {
        members: membersCount || 0,
        events: eventsCount || 0,
        music: musicCount || 0
      }
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ error: error.message })
  }
})

// PATCH: Update config (admin only)
router.patch('/', authMiddleware, async (req, res) => {
  try {
    const updates = req.body

    const promises = Object.entries(updates).map(([key, value]) => {
      return supabase
        .from('config')
        .upsert({ key, value }, { onConflict: 'key' })
    })

    await Promise.all(promises)

    res.json({ success: true, message: 'Config updated' })
  } catch (error) {
    console.error('Error updating config:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router

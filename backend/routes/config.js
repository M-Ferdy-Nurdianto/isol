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

    // Sync to faqs table if faq_items was updated
    if (updates.faq_items) {
      try {
        const parsed = typeof updates.faq_items === 'string' ? JSON.parse(updates.faq_items) : updates.faq_items
        if (Array.isArray(parsed)) {
          await supabase.from('faqs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
          if (parsed.length > 0) {
            const rows = parsed.map((item, idx) => ({
              tanya: item.q || item.pertanyaan || item.tanya || '',
              jawab: item.a || item.jawaban || item.jawab || '',
              urutan: idx + 1
            }))
            await supabase.from('faqs').insert(rows)
          }
        }
      } catch (syncErr) {
        console.warn('Sync faqs table warning:', syncErr.message)
      }
    }

    res.json({ success: true, message: 'Config updated' })
  } catch (error) {
    console.error('Error updating config:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST: Wipe / Reset Project Dummy Data (Admin only - Protected with Confirmation Phrase)
router.post('/reset-dummy-data', authMiddleware, async (req, res) => {
  try {
    // Require admin role
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Akses ditolak. Peran administrator diperlukan.' })
    }

    const { confirmation } = req.body
    if (confirmation !== 'HAPUS SEMUA DATA DUMMY') {
      return res.status(400).json({
        error: 'Teks konfirmasi salah. Anda wajib mengetik persis: HAPUS SEMUA DATA DUMMY'
      })
    }

    console.log(`[Wipe DB] Initiating dummy data wipe requested by admin: ${req.user.username || req.user.id}`)

    // 1. Get counts before deletion for audit reporting
    const [
      { count: initialOrdersCount },
      { count: initialMerchOrdersCount },
      { count: initialFansCount }
    ] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('merch_orders').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'fan')
    ])

    // 2. Fetch fan users to clean from Supabase Auth admin
    const { data: fans } = await supabase
      .from('users')
      .select('id, email')
      .eq('role', 'fan')

    if (fans && fans.length > 0) {
      for (const fan of fans) {
        try {
          await supabase.auth.admin.deleteUser(fan.id)
        } catch (authErr) {
          // Continue if user does not exist in auth
        }
      }
    }

    // 3. Delete from tables in relational order
    // Order items
    await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    // Orders
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    // Merch order items
    await supabase.from('merch_order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    // Merch orders
    await supabase.from('merch_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    // Password resets & audit logs
    await supabase.from('user_password_resets').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('password_reset_audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    // Fan users
    await supabase.from('users').delete().eq('role', 'fan')

    // 4. Purge uploaded files in storage buckets
    const buckets = ['receipts', 'payment-proofs', 'fans']
    let purgedFilesCount = 0
    for (const bName of buckets) {
      try {
        const { data: files } = await supabase.storage.from(bName).list('', { limit: 200 })
        if (files && files.length > 0) {
          const names = files.map(f => f.name).filter(n => n && n !== '.emptyFolderPlaceholder')
          if (names.length > 0) {
            await supabase.storage.from(bName).remove(names)
            purgedFilesCount += names.length
          }
        }
      } catch (stErr) {
        console.warn(`[Wipe DB] Storage bucket ${bName} purge warning:`, stErr.message)
      }
    }

    console.log('[Wipe DB] Wipe completed successfully!')

    res.json({
      success: true,
      message: `Wipe database berhasil! Seluruh data dummy telah dibersihkan (${initialOrdersCount || 0} order cheki, ${initialMerchOrdersCount || 0} order merchandise, ${initialFansCount || 0} akun fan, ${purgedFilesCount} file storage).`,
      deleted: {
        orders: initialOrdersCount || 0,
        merchOrders: initialMerchOrdersCount || 0,
        fans: initialFansCount || 0,
        storageFiles: purgedFilesCount
      }
    })
  } catch (error) {
    console.error('[Wipe DB] Error during wipe:', error)
    res.status(500).json({ error: error.message || 'Gagal mereset database' })
  }
})

export default router

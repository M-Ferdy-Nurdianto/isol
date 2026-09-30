import express from 'express'
import { supabase } from '../config/supabase.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// GET: Fetch cheki prices (optional filters: event_id, member_id)
router.get('/', async (req, res) => {
  try {
    const { event_id, member_id } = req.query

    let query = supabase
      .from('cheki_prices')
      .select(`
        *,
        members (
          id,
          member_id,
          nama_panggung,
          image_url,
          shop_image_url,
          hadir,
          color
        ),
        events (
          id,
          nama,
          tanggal,
          bulan,
          tahun,
          lokasi,
          theme_color
        )
      `)
      .order('price', { ascending: true })

    if (event_id) {
      query = query.eq('event_id', event_id)
    }

    if (member_id) {
      if (member_id === 'group' || member_id === 'null') {
        query = query.is('member_id', null)
      } else {
        query = query.eq('member_id', member_id)
      }
    }

    const { data, error } = await query

    if (error) throw error

    res.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Error fetching cheki prices:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET: Fetch single cheki price by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('cheki_prices')
      .select(`
        *,
        members (
          id,
          member_id,
          nama_panggung,
          image_url,
          shop_image_url
        ),
        events (
          id,
          nama,
          tanggal,
          bulan,
          tahun
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching cheki price:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST: Create a new cheki price option (admin)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { event_id, member_id, jenis_sesi, price, slot_available, is_available } = req.body

    if (!event_id) {
      return res.status(400).json({ error: 'event_id wajib diisi' })
    }

    // Convert member_id string 'group' or empty to null
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const resolvedMemberId = (member_id && UUID_REGEX.test(member_id)) ? member_id : null

    const payload = {
      event_id,
      member_id: resolvedMemberId,
      jenis_sesi: jenis_sesi || '2-Shot Cheki',
      price: Number.parseInt(price, 10) || 25000,
      slot_available: slot_available !== undefined ? Number.parseInt(slot_available, 10) : 30,
      is_available: is_available !== undefined ? Boolean(is_available) : true
    }

    const { data, error } = await supabase
      .from('cheki_prices')
      .insert(payload)
      .select(`
        *,
        members (
          id,
          nama_panggung
        )
      `)
      .single()

    if (error) throw error

    res.status(201).json({ success: true, data, message: 'Harga cheki berhasil dibuat' })
  } catch (error) {
    console.error('Error creating cheki price:', error)
    res.status(500).json({ error: error.message })
  }
})

// PUT/PATCH: Update existing cheki price (admin)
router.all('/:id', authMiddleware, async (req, res) => {
  if (req.method !== 'PUT' && req.method !== 'PATCH' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.params

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('cheki_prices')
        .delete()
        .eq('id', id)

      if (error) throw error

      return res.json({ success: true, message: 'Harga cheki berhasil dihapus' })
    } catch (error) {
      console.error('Error deleting cheki price:', error)
      return res.status(500).json({ error: error.message })
    }
  }

  // Update
  try {
    const { jenis_sesi, price, slot_available, is_available, member_id } = req.body

    const updates = {
      updated_at: new Date().toISOString()
    }

    if (jenis_sesi !== undefined) updates.jenis_sesi = jenis_sesi
    if (price !== undefined) updates.price = Number.parseInt(price, 10)
    if (slot_available !== undefined) updates.slot_available = Number.parseInt(slot_available, 10)
    if (is_available !== undefined) updates.is_available = Boolean(is_available)
    if (member_id !== undefined) {
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      updates.member_id = (member_id && UUID_REGEX.test(member_id)) ? member_id : null
    }

    const { data, error } = await supabase
      .from('cheki_prices')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        members (
          id,
          nama_panggung
        )
      `)
      .single()

    if (error) throw error

    res.json({ success: true, data, message: 'Harga cheki berhasil diperbarui' })
  } catch (error) {
    console.error('Error updating cheki price:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST: Bulk Initialize standard pricing for an event
router.post('/bulk-init/:eventId', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params
    const { defaultChekiPrice = 25000, groupChekiPrice = 35000, defaultSlots = 30 } = req.body

    // 1. Get active members
    const { data: members, error: memErr } = await supabase
      .from('members')
      .select('id, nama_panggung')
      .eq('hadir', true)

    if (memErr) throw memErr

    const pricesToInsert = [
      // Group Cheki
      {
        event_id: eventId,
        member_id: null,
        jenis_sesi: 'Group Cheki (Full Member)',
        price: Number.parseInt(groupChekiPrice, 10),
        slot_available: Number.parseInt(defaultSlots, 10) + 10,
        is_available: true
      },
      // Individual Member 2-Shot Cheki
      ...(members || []).map(m => ({
        event_id: eventId,
        member_id: m.id,
        jenis_sesi: `2-Shot Cheki (${m.nama_panggung})`,
        price: Number.parseInt(defaultChekiPrice, 10),
        slot_available: Number.parseInt(defaultSlots, 10),
        is_available: true
      }))
    ]

    const { data, error } = await supabase
      .from('cheki_prices')
      .upsert(pricesToInsert, { onConflict: 'event_id,member_id,jenis_sesi' })
      .select()

    if (error) throw error

    res.json({
      success: true,
      message: `Berhasil inisialisasi ${data?.length || 0} harga cheki untuk event`,
      data
    })
  } catch (error) {
    console.error('Error bulk initializing cheki prices:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router

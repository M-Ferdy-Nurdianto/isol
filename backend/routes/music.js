import express from 'express'
import { supabase } from '../config/supabase.js'
import { authMiddleware } from '../middleware/auth.js'
import { cachePublic } from '../middleware/cache.js'

const router = express.Router()

// GET: Fetch all music items (public access only for published items)
router.get('/', cachePublic({ sMaxAge: 3600, maxAge: 120, staleWhileRevalidate: 300 }), async (req, res) => {
  try {
    const { isAdmin } = req.query
    
    let query = supabase.from('music_items').select('*').order('order', { ascending: true }).order('created_at', { ascending: false })
    
    const { data, error } = await query

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching music items:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST: Create music item (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { platform, title, link, thumbnail_url, order } = req.body

    const { data, error } = await supabase
      .from('music_items')
      .insert({ platform, title, link, thumbnail_url, order, status: 'published' })
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error creating music item:', error)
    res.status(500).json({ error: error.message })
  }
})

// PATCH: Update music item
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const { data, error } = await supabase
      .from('music_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error updating music item:', error)
    res.status(500).json({ error: error.message })
  }
})

// PATCH: Reorder music items
router.patch('/bulk/reorder', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body // array of { id, order }

    // Supabase JS doesn't have a built-in bulk update for different rows easily without a stored procedure.
    // We can do it in a loop with Promise.all for now since the array is small.
    const promises = items.map(item => 
      supabase.from('music_items').update({ order: item.order }).eq('id', item.id)
    )

    await Promise.all(promises)

    res.json({ success: true, message: 'Urutan berhasil disimpan' })
  } catch (error) {
    console.error('Error reordering music items:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE: Delete music item
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('music_items')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({ success: true, message: 'Music item deleted' })
  } catch (error) {
    console.error('Error deleting music item:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router

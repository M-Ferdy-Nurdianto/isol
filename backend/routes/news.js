import express from 'express'
import { supabase } from '../config/supabase.js'
import { authMiddleware } from '../middleware/auth.js'
import { cachePublic } from '../middleware/cache.js'

const router = express.Router()

// GET: Fetch all published news (or all for admin)
router.get('/', cachePublic({ sMaxAge: 3600, maxAge: 120, staleWhileRevalidate: 300 }), async (req, res) => {
  try {
    const { includeDrafts } = req.query
    
    let query = supabase
      .from('news')
      .select('*')
      .order('date', { ascending: false })
      .order('order_index', { ascending: true })

    if (includeDrafts !== 'true') {
      query = query.eq('is_published', true)
    }

    const { data, error } = await query

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching news:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET: Fetch single news by slug
router.get('/:slug', cachePublic({ sMaxAge: 3600, maxAge: 120, staleWhileRevalidate: 300 }), async (req, res) => {
  try {
    const { slug } = req.params

    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching news detail:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST: Create news (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, slug, summary, content, image_url, location, date, is_published, order_index } = req.body

    const { data, error } = await supabase
      .from('news')
      .insert({ title, slug, summary, content, image_url, location, date, is_published, order_index })
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error creating news:', error)
    res.status(500).json({ error: error.message })
  }
})

// PATCH: Update news
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const { data, error } = await supabase
      .from('news')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error updating news:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE: Delete news
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('news')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({ success: true, message: 'News deleted' })
  } catch (error) {
    console.error('Error deleting news:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router

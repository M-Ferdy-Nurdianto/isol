import express from 'express'
import { supabase } from '../config/supabase.js'
import { authMiddleware } from '../middleware/auth.js'
import { cachePublic } from '../middleware/cache.js'

const router = express.Router()

// GET: Fetch all FAQs
router.get('/', cachePublic({ sMaxAge: 3600, maxAge: 120, staleWhileRevalidate: 300 }), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .order('urutan', { ascending: true })

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching FAQs:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST: Create FAQ (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { tanya, jawab, urutan } = req.body

    const { data, error } = await supabase
      .from('faqs')
      .insert({ tanya, jawab, urutan })
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error creating FAQ:', error)
    res.status(500).json({ error: error.message })
  }
})

// PATCH: Update FAQ
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const { data, error } = await supabase
      .from('faqs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error updating FAQ:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE: Delete FAQ
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('faqs')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({ success: true, message: 'FAQ deleted' })
  } catch (error) {
    console.error('Error deleting FAQ:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router

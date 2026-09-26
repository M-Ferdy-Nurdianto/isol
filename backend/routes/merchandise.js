import express from 'express'
import { supabase } from '../config/supabase.js'
import { authMiddleware } from '../middleware/auth.js'
import { cachePublic } from '../middleware/cache.js'

const router = express.Router()

// ───────────────────────────────────────────
// MERCHANDISE ITEMS (produk)
// ───────────────────────────────────────────

// GET all merchandise (public)
router.get('/', cachePublic({ sMaxAge: 300, maxAge: 60, staleWhileRevalidate: 120 }), async (req, res) => {
  try {
    const { available } = req.query
    let query = supabase
      .from('merchandise')
      .select('*')
      .order('urutan', { ascending: true })
      .order('created_at', { ascending: false })

    if (available === 'true') {
      query = query.eq('available', true)
    }

    const { data, error } = await query
    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching merchandise:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET single merchandise (public)
router.get('/:id', cachePublic({ sMaxAge: 300, maxAge: 60, staleWhileRevalidate: 120 }), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('merchandise')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST create merchandise (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { nama, deskripsi, harga, stok, gambar_url, available, urutan, sizes, size_chart_urls } = req.body

    if (!nama || !harga) {
      return res.status(400).json({ error: 'Nama dan harga wajib diisi' })
    }

    const { data, error } = await supabase
      .from('merchandise')
      .insert({
        nama,
        deskripsi: deskripsi || null,
        harga: parseInt(harga),
        stok: parseInt(stok) || 0,
        gambar_url: gambar_url || null,
        available: available !== undefined ? available : true,
        urutan: parseInt(urutan) || 0,
        sizes: sizes || null,
        size_chart_urls: size_chart_urls || null
      })
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    console.error('Error creating merchandise:', error)
    res.status(500).json({ error: error.message })
  }
})

// PUT update merchandise (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { nama, deskripsi, harga, stok, gambar_url, available, urutan, sizes, size_chart_urls } = req.body

    const updateData = {}
    if (nama !== undefined) updateData.nama = nama
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi
    if (harga !== undefined) updateData.harga = parseInt(harga)
    if (stok !== undefined) updateData.stok = parseInt(stok)
    if (gambar_url !== undefined) updateData.gambar_url = gambar_url
    if (available !== undefined) updateData.available = available
    if (urutan !== undefined) updateData.urutan = parseInt(urutan)
    if (sizes !== undefined) updateData.sizes = sizes
    if (size_chart_urls !== undefined) updateData.size_chart_urls = size_chart_urls

    const { data, error } = await supabase
      .from('merchandise')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    console.error('Error updating merchandise:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE merchandise (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase
      .from('merchandise')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    res.json({ success: true, message: 'Merchandise berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting merchandise:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router

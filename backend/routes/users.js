import express from 'express'
import { supabase } from '../config/supabase.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

/**
 * Sanitize search input to prevent query tampering, filter injection in .or(), or wildcard bloat.
 * Escapes/strips %, _, ,, (, ), \, and /
 */
export const sanitizeSearchInput = (input) => {
  if (typeof input !== 'string') return ''
  return input.replace(/[\\%_,()\/]/g, '').trim()
}

/**
 * Format fan_id into standardized 4-digit code (e.g. 2 -> "0002")
 */
const formatFanCode = (fanId) => {
  if (fanId === null || fanId === undefined || isNaN(fanId)) return '-'
  return String(fanId).padStart(4, '0')
}

// GET /api/users/search?q=...
// Fast account search for Cashier / Admin OTS order input
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const rawQuery = req.query.q || ''
    const sanitized = sanitizeSearchInput(rawQuery)

    // Minimum 2 characters required
    if (sanitized.length < 2) {
      return res.json({
        success: true,
        data: []
      })
    }

    const cleanLower = sanitized.toLowerCase()
    const isNumeric = /^\d+$/.test(sanitized)
    const cleanNum = isNumeric ? parseInt(sanitized, 10) : null

    // 1. Try Supabase RPC search_fan_accounts first (optimised with pg_trgm & GIN index)
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('search_fan_accounts', {
        search_query: sanitized,
        max_limit: 10
      })

      if (!rpcError && Array.isArray(rpcData)) {
        const formatted = rpcData.map(u => ({
          id: u.id,
          fan_id: u.fan_id,
          fan_code: formatFanCode(u.fan_id),
          nama: u.nama,
          email: u.email,
          whatsapp: u.whatsapp,
          instagram: u.instagram,
          image_url: u.image_url
        }))

        res.set('Cache-Control', 'private, max-age=30')
        return res.json({
          success: true,
          data: formatted,
          source: 'rpc'
        })
      }
    } catch (rpcCatchErr) {
      // Fallback to direct query if RPC does not exist yet
      console.warn('[Users Search] RPC search_fan_accounts not available, falling back to direct query:', rpcCatchErr.message)
    }

    // 2. Fallback Direct Query (select only required columns, limit 10)
    let query = supabase
      .from('users')
      .select('id, fan_id, nama, email, whatsapp, instagram, image_url')
      .limit(10)

    if (isNumeric) {
      // If numeric, search fan_id exact or nama partial
      query = query.or(`fan_id.eq.${cleanNum},nama.ilike.%${sanitized}%`)
    } else if (sanitized.includes('@')) {
      // If email pattern, search exact email (case insensitive) or nama partial
      query = query.or(`email.ilike.${sanitized},nama.ilike.%${sanitized}%`)
    } else {
      // General text: search nama partial
      query = query.or(`nama.ilike.%${sanitized}%`)
    }

    const { data: users, error } = await query

    if (error) {
      console.error('[Users Search] Query error:', error)
      return res.status(500).json({ error: 'Gagal mencari akun fan' })
    }

    // Sort by priority match
    const prioritized = (users || []).map(u => {
      const fanCode = formatFanCode(u.fan_id)
      const uNamaLower = (u.nama || '').toLowerCase()
      const uEmailLower = (u.email || '').toLowerCase()

      let priority = 7
      if (isNumeric && u.fan_id === cleanNum) {
        priority = 1 // Exact Fan ID
      } else if (fanCode === sanitized || String(u.fan_id) === sanitized) {
        priority = 1 // Exact Fan Code
      } else if (isNumeric && String(u.fan_id).startsWith(sanitized)) {
        priority = 2 // Prefix Fan ID
      } else if (fanCode.startsWith(sanitized)) {
        priority = 2 // Prefix Fan Code
      } else if (uEmailLower === cleanLower) {
        priority = 3 // Exact Email
      } else if (uNamaLower === cleanLower) {
        priority = 4 // Exact Name
      } else if (uNamaLower.startsWith(cleanLower)) {
        priority = 5 // Prefix Name
      } else if (uNamaLower.includes(cleanLower)) {
        priority = 6 // Partial Name
      }

      return {
        id: u.id,
        fan_id: u.fan_id,
        fan_code: fanCode,
        nama: u.nama,
        email: u.email,
        whatsapp: u.whatsapp,
        instagram: u.instagram,
        image_url: u.image_url,
        _priority: priority
      }
    })

    prioritized.sort((a, b) => {
      if (a._priority !== b._priority) return a._priority - b._priority
      return a.nama.localeCompare(b.nama)
    })

    // Clean internal priority helper before returning
    const finalResults = prioritized.slice(0, 10).map(({ _priority, ...rest }) => rest)

    res.set('Cache-Control', 'private, max-age=30')
    return res.json({
      success: true,
      data: finalResults,
      source: 'direct'
    })
  } catch (err) {
    console.error('[Users Search] Server error:', err)
    return res.status(500).json({ error: 'Terjadi kesalahan server saat mencari akun' })
  }
})

// GET /api/users - List users for Admin with search & pagination
router.get('/', authMiddleware, async (req, res) => {
  try {
    const search = sanitizeSearchInput(req.query.search || '')
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 100)
    const page = Math.max(parseInt(req.query.page || '1', 10), 1)
    const offset = (page - 1) * limit

    let query = supabase
      .from('users')
      .select('id, fan_id, nama, email, whatsapp, instagram, image_url, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      const isNum = /^\d+$/.test(search)
      if (isNum) {
        query = query.or(`fan_id.eq.${parseInt(search, 10)},nama.ilike.%${search}%`)
      } else {
        query = query.or(`nama.ilike.%${search}%,email.ilike.%${search}%`)
      }
    }

    const { data: users, count, error } = await query

    if (error) {
      console.error('[Users List] Query error:', error)
      return res.status(500).json({ error: 'Gagal memuat daftar akun user' })
    }

    const formatted = (users || []).map(u => ({
      ...u,
      fan_code: formatFanCode(u.fan_id)
    }))

    return res.json({
      success: true,
      data: formatted,
      total: count || 0,
      page,
      limit
    })
  } catch (err) {
    console.error('[Users List] Server error:', err)
    return res.status(500).json({ error: 'Terjadi kesalahan server saat memuat akun' })
  }
})

// GET /api/users/:id - Get single user profile detail
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ error: 'ID user tidak valid' })
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, fan_id, nama, email, whatsapp, instagram, image_url, created_at, role')
      .eq('id', id)
      .single()

    if (error || !user) {
      return res.status(404).json({ error: 'Akun user tidak ditemukan' })
    }

    return res.json({
      success: true,
      data: {
        ...user,
        fan_code: formatFanCode(user.fan_id)
      }
    })
  } catch (err) {
    console.error('[User Detail] Server error:', err)
    return res.status(500).json({ error: 'Terjadi kesalahan server saat memuat akun' })
  }
})

export default router


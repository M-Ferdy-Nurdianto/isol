import express from 'express'
import jwt from 'jsonwebtoken'
import { supabase } from '../config/supabase.js'
import { authMiddleware } from '../middleware/auth.js'
import ExcelJS from 'exceljs'
import { deletePaymentProofFiles } from '../utils/storageCleaner.js'
import { verifyTurnstileToken } from '../utils/turnstile.js'

const router = express.Router()

// GET: Fetch all orders with filters
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, dateFrom, dateTo, search, is_ots, event_id } = req.query

    console.log('[Orders] Filter params:', { status, is_ots, event_id, search, dateFrom, dateTo })

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          item_name,
          price,
          quantity,
          member_id,
          cheki_type
        )
      `)
      .order('created_at', { ascending: false })

    // Filter by status
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Filter by OTS
    if (is_ots !== undefined && is_ots !== 'all') {
      query = query.eq('is_ots', is_ots === 'true')
    }

    // Filter by event_id
    if (event_id && event_id !== 'all') {
      console.log('[Orders] Filtering by event_id:', event_id)
      query = query.eq('event_id', event_id)
    }

    // Filter by date range
    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    // Search by name or order number
    if (search) {
      query = query.or(`nama_lengkap.ilike.%${search}%,email.ilike.%${search}%,order_number.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    console.log('[Orders] Fetched:', data?.length || 0, 'orders')

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching orders:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET: Fetch single order by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          item_name,
          price,
          quantity,
          member_id,
          cheki_type
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching order:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST: Create new PO order (from customer - Pre-Order checkout)
// Updated 2026-10-02: Support cheki_type (regular/wide/grup), validate each toggle
//   + recalculate price from config (never trust client price)
router.post('/', async (req, res) => {
  try {
    // Check maintenance mode (Admin with valid token can bypass for testing)
    let isAdmin = false
    const token = req.headers.authorization?.split(' ')[1]
    if (token) {
      try {
        jwt.verify(token, process.env.JWT_SECRET)
        isAdmin = true
      } catch {
        isAdmin = false
      }
    }

    if (!isAdmin) {
      const { data: mtConfig } = await supabase
        .from('config')
        .select('value')
        .eq('key', 'maintenance_mode')
        .maybeSingle()

      if (mtConfig && (mtConfig.value === 'true' || mtConfig.value === true)) {
        return res.status(503).json({ error: 'Sistem sedang dalam pemeliharaan. Transaksi saat ini belum dapat diproses.' })
      }
    }

    const { event_id, nama_lengkap, kontak, items, payment_proof_url, catatan, user_id } = req.body
    const turnstileToken = req.body['cf-turnstile-response'] || req.body.turnstile_token

    // Cloudflare Turnstile Server-side verification (skip for logged-in admin testing if needed)
    if (!isAdmin) {
      const clientIp = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip
      const turnstileResult = await verifyTurnstileToken(turnstileToken, clientIp)
      if (!turnstileResult.success) {
        return res.status(400).json({ error: turnstileResult.error || 'Verifikasi keamanan gagal' })
      }
    }

    // Validate event_id
    if (!event_id) {
      return res.status(400).json({ error: 'Event ID is required' })
    }

    if (!nama_lengkap || String(nama_lengkap).trim() === '') {
      return res.status(400).json({ error: 'Nama lengkap wajib diisi.' })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Minimal pilih 1 tiket.' })
    }

    // ── 1. Baca config toggles & harga PO ───────────────────────────────
    const getConfig = async (key, fallback = null) => {
      const { data } = await supabase.from('config').select('value').eq('key', key).maybeSingle()
      return data ? data.value : fallback
    }
    const regularChekiEnabled = (await getConfig('regular_cheki_enabled', 'true')) !== 'false'
    const wideChekiEnabled    = (await getConfig('wide_cheki_enabled', 'true'))    !== 'false'
    const chekiGrupEnabled    = (await getConfig('cheki_grup_enabled', 'false')) === 'true' // default OFF
    const hargaPoRegular      = Number(await getConfig('harga_cheki_per_member', '40000')) || 40000
    const hargaPoWide         = Number(await getConfig('harga_cheki_grup', '70000'))        || 70000
    const hargaPoChekiGrup    = Number(await getConfig('harga_cheki_grup_po', '150000'))   || 150000

    // ── 2. Validasi items per cheki_type + recalc harga (JANGAN PERCAYA CLIENT) ─
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    let total_harga = 0
    const cleanedItems = []

    for (const itm of items) {
      // Tentukan cheki_type (backward compat: item dengan member_id='group' berarti CHEKI GRUP (jika tanpa field cheki_type)
      const legacyIsGroup = itm.member_id === 'group' || itm.member_id === 'grup'
      let type = itm.cheki_type || (legacyIsGroup ? 'grup' : 'regular')
      // Jika label item.name mengandung 'wide' tapi bukan grup, anggap wide (bukan grup)
      if (!itm.cheki_type && !legacyIsGroup && typeof itm.name && /\bwide\b/i.test(itm.name)) {
        type = 'wide'
      }
      const qty = Math.max(1, parseInt(itm.quantity, 10) || 1)
      let pricePerUnit = 0
      let itemName = ''
      let memberIdDb = null

      if (type === 'grup' || legacyIsGroup) {
        // ── Cheki Grup (semua member) ──
        if (!chekiGrupEnabled) {
          return res.status(400).json({ error: 'Cheki Grup (Semua Member) saat ini tidak tersedia.' })
        }
        pricePerUnit = hargaPoChekiGrup
        itemName = itm.name || 'Cheki Grup (Semua Member)'
        memberIdDb = null
      } else if (type === 'wide') {
        // ── Wide Cheki (Polaroid 16:9 PER MEMBER ──
        if (!wideChekiEnabled) {
          return res.status(400).json({ error: 'Wide Cheki (Polaroid 16:9) saat ini tidak tersedia.' })
        }
        if (!UUID_REGEX.test(itm.member_id)) {
          return res.status(400).json({ error: 'Member tidak valid untuk Wide Cheki.' })
        }
        pricePerUnit = hargaPoWide
        itemName = itm.name || `Wide Cheki (16:9) ${itm.member_id}`
        memberIdDb = itm.member_id
      } else {
        // ── Default: Regular Cheki PER MEMBER ──
        if (!regularChekiEnabled) {
          return res.status(400).json({ error: 'Regular Cheki saat ini tidak tersedia.' })
        }
        if (!UUID_REGEX.test(itm.member_id)) {
          return res.status(400).json({ error: 'Member tidak valid untuk Regular Cheki.' })
        }
        pricePerUnit = hargaPoRegular
        itemName = itm.name || `Regular Cheki ${itm.member_id}`
        memberIdDb = itm.member_id
      }

      total_harga += pricePerUnit * qty
      cleanedItems.push({
        member_id: memberIdDb,
        cheki_type: type === 'grup' || type === 'wide' || type === 'regular' ? type : 'regular',
        item_name: itemName,
        price: pricePerUnit,
        quantity: qty
      })
    }

    const orderNumber = `RB${Date.now()}`

    // Generate auto email from timestamp
    const autoEmail = `order-${Date.now()}@refreshbreeze.com`

    // Determine if kontak is phone or instagram
    const isPhone = kontak && /^[0-9+\-\s()]+$/.test(kontak)
    const whatsapp = isPhone ? kontak : '-'
    const instagram = !isPhone && kontak ? kontak : '-'

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        event_id,
        user_id: user_id || null,
        nama_lengkap,
        whatsapp,
        email: autoEmail,
        instagram,
        total_harga,
        payment_proof_url,
        status: 'pending',
        created_by: 'customer',
        catatan: catatan || null
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Insert order items WITH cheki_type
    const orderItemsDb = cleanedItems.map(itm => ({ ...itm, order_id: order.id }))
    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsDb)

    if (itemsError) throw itemsError

    res.json({ success: true, order })
  } catch (error) {
    console.error('Error creating PO order:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST: Create OTS (On The Spot) order by admin
// Updated 2026-10-02: Support cheki_type (regular/wide/grup), validate each toggle
//   + recalculate price from config (never trust client price)
router.post('/ots', authMiddleware, async (req, res) => {
  try {
    const { event_id, nama_lengkap, whatsapp, email, instagram, items, payment_method, user_id } = req.body

    // ── 1. Baca config toggles & harga ────────────────────────────────
    const getConfig = async (key, fallback = null) => {
      const { data } = await supabase.from('config').select('value').eq('key', key).maybeSingle()
      return data ? data.value : fallback
    }
    const regularChekiEnabled = (await getConfig('regular_cheki_enabled', 'true')) !== 'false'
    const wideChekiEnabled    = (await getConfig('wide_cheki_enabled', 'true'))    !== 'false'
    const chekiGrupEnabled    = (await getConfig('cheki_grup_enabled', 'false')) === 'true' // default OFF
    const hargaOtsRegular     = Number(await getConfig('harga_ots_per_member', '40000')) || 40000
    const hargaOtsWide        = Number(await getConfig('harga_ots_grup', '80000'))        || 80000
    const hargaOtsChekiGrup   = Number(await getConfig('harga_cheki_grup_ots', '170000')) || 170000

    // ── 2. Validasi event ─────────────────────────────────────────────
    if (!event_id) {
      return res.status(400).json({ error: 'Event ID is required' })
    }

    if (!nama_lengkap || String(nama_lengkap).trim() === '') {
      return res.status(400).json({ error: 'Nama pembeli wajib diisi.' })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Minimal pilih 1 tiket cheki.' })
    }

    // ── 3. Validasi items per cheki_type + recalc harga (JANGAN PERCAYA CLIENT) ─
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    let total_harga = 0
    const cleanedItems = []

    for (const itm of items) {
      const type = itm.cheki_type || (itm.member_id === 'grup' || itm.member_id === 'group' ? 'grup' : 'regular')
      const qty = Math.max(1, parseInt(itm.quantity, 10) || 1)
      let pricePerUnit = 0
      let itemName = ''
      let memberIdDb = null

      if (type === 'grup' || itm.member_id === 'grup' || itm.member_id === 'group') {
        if (!chekiGrupEnabled) {
          return res.status(400).json({ error: 'Cheki Grup (Semua Member) saat ini tidak tersedia.' })
        }
        pricePerUnit = hargaOtsChekiGrup
        itemName = itm.name || 'Cheki Grup (Semua Member)'
        memberIdDb = null
      } else if (type === 'wide') {
        if (!wideChekiEnabled) {
          return res.status(400).json({ error: 'Wide Cheki (Polaroid 16:9) saat ini tidak tersedia.' })
        }
        if (!UUID_REGEX.test(itm.member_id)) {
          return res.status(400).json({ error: 'Member tidak valid untuk Wide Cheki.' })
        }
        pricePerUnit = hargaOtsWide
        itemName = itm.name || `Wide Cheki (16:9) ${itm.member_id}`
        memberIdDb = itm.member_id
      } else {
        // Default: Regular Cheki (per member)
        if (!regularChekiEnabled) {
          return res.status(400).json({ error: 'Regular Cheki saat ini tidak tersedia.' })
        }
        if (!UUID_REGEX.test(itm.member_id)) {
          return res.status(400).json({ error: 'Member tidak valid untuk Regular Cheki.' })
        }
        pricePerUnit = hargaOtsRegular
        itemName = itm.name || `Regular Cheki ${itm.member_id}`
        memberIdDb = itm.member_id
      }

      total_harga += pricePerUnit * qty
      cleanedItems.push({
        member_id: memberIdDb,
        cheki_type: type === 'grup' || type === 'wide' || type === 'regular' ? type : 'regular',
        item_name: itemName,
        price: pricePerUnit,
        quantity: qty
      })
    }

    // ── 4. Insert ORDER (checked=lunas, created_by=admin, is_ots=true) ─
    const orderNumber = `RB-OTS${Date.now()}`
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        event_id,
        user_id: user_id || null,
        nama_lengkap,
        whatsapp: whatsapp || '-',
        email: email || `ots-${Date.now()}@refreshbreeze.com`,
        instagram: instagram || '-',
        total_harga,
        status: 'checked',
        is_ots: true,
        created_by: 'admin',
        payment_proof_url: payment_method || 'Cash'
      })
      .select()
      .single()

    if (orderError) throw orderError

    // ── 5. Insert ORDER_ITEMS (dengan cheki_type terisi) ─────────────
    const orderItemsDb = cleanedItems.map(itm => ({ ...itm, order_id: order.id }))
    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsDb)
    if (itemsError) throw itemsError

    res.json({ success: true, order })
  } catch (error) {
    console.error('Error creating OTS ADMIN order:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST: Create OTS (On The Spot) order by LOGGED IN FAN USER
router.post('/ots-user', async (req, res) => {
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'kohi_sekai_fan_secret_2026'
    const { event_id, items, payment_method, user_id: bodyUserId } = req.body

    // ── 1. Verifikasi fan token (MANDATORY) ─────────────────────────────
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ error: 'Login terlebih dahulu untuk order OTS' })
    }
    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch {
      return res.status(401).json({ error: 'Sesi login tidak valid. Silakan login ulang.' })
    }
    const fanUserId = decoded.id
    if (!fanUserId) {
      return res.status(401).json({ error: 'Token tidak memuat data user' })
    }
    // Cegah user memalsukan user_id milik orang lain (injection block)
    if (bodyUserId && String(bodyUserId) !== String(fanUserId)) {
      return res.status(403).json({ error: 'Anda hanya boleh membuat order atas nama akun sendiri.' })
    }

    // ── 2. Ambil data fan user dari DB (nama dari DB, bukan body client) ─
    const { data: fanUser, error: fanUserError } = await supabase
      .from('users')
      .select('id, nama, email, whatsapp, instagram')
      .eq('id', fanUserId)
      .maybeSingle()
    if (fanUserError || !fanUser) {
      return res.status(404).json({ error: 'Akun fan tidak ditemukan di database.' })
    }

    // ── 3. Baca CONFIG toggles dan harga ────────────────────────────────
    const getConfig = async (key, fallback = null) => {
      const { data } = await supabase.from('config').select('value').eq('key', key).maybeSingle()
      return data ? data.value : fallback
    }

    const regularChekiEnabled = (await getConfig('regular_cheki_enabled', 'true')) !== 'false'
    const wideChekiEnabled    = (await getConfig('wide_cheki_enabled', 'true')) !== 'false'
    const chekiGrupEnabled    = (await getConfig('cheki_grup_enabled', 'false')) === 'true' // default OFF
    const hargaOtsRegular     = Number(await getConfig('harga_ots_per_member', '40000')) || 40000
    const hargaOtsWide        = Number(await getConfig('harga_ots_grup', '80000')) || 80000
    const hargaOtsChekiGrup   = Number(await getConfig('harga_cheki_grup_ots', '150000')) || 150000

    // ── 4. Validasi event harus AKTIF ───────────────────────────────────
    if (!event_id) return res.status(400).json({ error: 'Event ID wajib dipilih' })
    const { data: eventData, error: evErr } = await supabase
      .from('events')
      .select('*')
      .eq('id', event_id)
      .maybeSingle()
    if (evErr || !eventData) return res.status(400).json({ error: 'Event tidak valid / tidak ditemukan' })
    if (eventData.is_past || eventData.is_special) {
      return res.status(400).json({ error: 'Event ini tidak menerima order OTS.' })
    }
    // Cek tanggal event >= hari ini
    const months = { 'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5, 'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11 }
    const evDate = new Date(eventData.tahun, months[eventData.bulan] || 0, eventData.tanggal)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    if (evDate < today) {
      return res.status(400).json({ error: 'Event ini sudah lewat, tidak bisa order OTS.' })
    }

    // ── 5. Validasi items + recalculate harga dari config (JANGAN PERCAYA CLIENT) ─
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Minimal pilih 1 tiket cheki.' })
    }
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    let total_harga = 0
    const cleanedItems = []

    for (const itm of items) {
      const type = itm.cheki_type || 'regular'
      const qty = Math.max(1, parseInt(itm.quantity, 10) || 1)
      let pricePerUnit = 0
      let itemName = ''
      let memberIdDb = null

      if (type === 'grup') {
        // ── Validasi Cheki Grup ──
        if (!chekiGrupEnabled) {
          return res.status(400).json({ error: 'Cheki Grup (Semua Member) saat ini tidak tersedia.' })
        }
        pricePerUnit = hargaOtsChekiGrup
        itemName = itm.name || 'Cheki Grup (Semua Member)'
        memberIdDb = null
      } else if (type === 'wide') {
        // ── Validasi Wide Cheki (per member) ──
        if (!wideChekiEnabled) {
          return res.status(400).json({ error: 'Wide Cheki saat ini tidak tersedia.' })
        }
        if (!UUID_REGEX.test(itm.member_id)) {
          return res.status(400).json({ error: 'Member tidak valid untuk Wide Cheki.' })
        }
        pricePerUnit = hargaOtsWide
        itemName = itm.name || `Wide Cheki ${itm.member_id}`
        memberIdDb = itm.member_id
      } else {
        // ── Default: Regular Cheki (per member) ──
        if (!regularChekiEnabled) {
          return res.status(400).json({ error: 'Regular Cheki saat ini tidak tersedia.' })
        }
        if (!UUID_REGEX.test(itm.member_id)) {
          return res.status(400).json({ error: 'Member tidak valid untuk Regular Cheki.' })
        }
        pricePerUnit = hargaOtsRegular
        itemName = itm.name || `Regular Cheki ${itm.member_id}`
        memberIdDb = itm.member_id
      }

      total_harga += pricePerUnit * qty
      cleanedItems.push({
        member_id: memberIdDb,
        cheki_type: type,
        item_name: itemName,
        price: pricePerUnit,
        quantity: qty
      })
    }

    // ── 6. Insert ORDER (pending, created_by='customer', is_ots=true) ──
    const orderNumber = `RB-OTSU${Date.now()}`
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        event_id,
        user_id: fanUserId, // DIPAKSA dari token, bukan body client
        nama_lengkap: fanUser.nama, // Nama dari DB fan user
        whatsapp: fanUser.whatsapp || '-',
        email: fanUser.email || `ots-user-${Date.now()}@kohisekai.com`,
        instagram: fanUser.instagram || '-',
        total_harga,
        status: 'pending', // Status awal PENDING sampai admin konfirmasi di venue
        is_ots: true,
        created_by: 'customer', // SUMBER: user (OTS - User)
        payment_proof_url: payment_method || 'Cash'
      })
      .select()
      .single()
    if (orderError) throw orderError

    // ── 7. Insert ORDER_ITEMS (dengan cheki_type terisi) ────────────────
    const orderItemsDb = cleanedItems.map(itm => ({ ...itm, order_id: order.id }))
    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsDb)
    if (itemsError) throw itemsError

    res.json({ success: true, order, message: 'Order OTS diajukan. Silakan hubungi / tunggu admin di venue untuk konfirmasi & pembayaran.' })
  } catch (error) {
    console.error('Error creating OTS USER order:', error)
    res.status(500).json({ error: error.message || 'Terjadi kesalahan server saat menyimpan order OTS.' })
  }
})

// Also UPDATE existing OTS ADMIN endpoint to include cheki_type & Cheki Grup validation
// (in-place edit / override handled above by admin flow, keep endpoint compatible with old items)
// PATCH: Update order status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    let nextStatus = status === 'checked' ? 'paid' : status
  if (!['pending', 'paid', 'completed'].includes(nextStatus)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status: nextStatus || status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error updating order status:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET: Export orders to Excel
router.get('/export/excel', authMiddleware, async (req, res) => {
  try {
    const { dateFrom, dateTo, status, is_ots, search, event_id } = req.query

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          item_name,
          price,
          quantity,
          cheki_type,
          member_id
        )
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status && status !== 'all') query = query.eq('status', status)
    if (is_ots !== undefined && is_ots !== 'all') query = query.eq('is_ots', is_ots === 'true')
    if (event_id && event_id !== 'all') query = query.eq('event_id', event_id)
    if (dateFrom) query = query.gte('created_at', dateFrom)
    if (dateTo) query = query.lte('created_at', dateTo)
    if (search) query = query.or(`nama_lengkap.ilike.%${search}%,email.ilike.%${search}%,order_number.ilike.%${search}%`)

    const { data: orders, error } = await query

    if (error) throw error

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('REFRESH_BREEZE_REPORT')

    worksheet.columns = [
      { key: 'col1', width: 18 },
      { key: 'col2', width: 18 },
      { key: 'col3', width: 18 },
      { key: 'col4', width: 10 },
      { key: 'col5', width: 40 },
      { key: 'col6', width: 8 },
      { key: 'col7', width: 16 },
      { key: 'col8', width: 12 },
      { key: 'col9', width: 20 },
      { key: 'col10', width: 25 },
    ]

    const applyBorders = (row) => {
      row.eachCell((cell) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      })
    }

    const mergeRow = (rowNumber, startCol, endCol, value, style) => {
      worksheet.mergeCells(`${startCol}${rowNumber}:${endCol}${rowNumber}`)
      const cell = worksheet.getCell(`${startCol}${rowNumber}`)
      cell.value = value
      if (style?.font) cell.font = style.font
      if (style?.fill) cell.fill = style.fill
      if (style?.alignment) cell.alignment = style.alignment
    }

    const formatCurrency = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`
    const formatStatus = (status) => {
      if (status === 'pending') return 'PENDING'
      if (status === 'paid' || status === 'checked') return 'PAID'
      if (status === 'completed') return 'COMPLETED'
      return String(status || '-').toUpperCase()
    }

    const eventId = event_id && event_id !== 'all' ? event_id : null
    let eventInfo = null
    if (eventId) {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('nama, tanggal, bulan, tahun, lokasi, is_past')
        .eq('id', eventId)
        .single()
      if (!eventError) eventInfo = eventData
    }
    const monthIndexMap = {
      januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5, juli: 6,
      agustus: 7, september: 8, oktober: 9, november: 10, desember: 11
    }
    const getEventStatusLabel = () => {
      if (!eventInfo) return ''
      if (eventInfo.is_past) return 'DONE'
      const monthKey = String(eventInfo.bulan || '').toLowerCase()
      const monthIndex = monthIndexMap[monthKey]
      const day = Number(eventInfo.tanggal)
      const year = Number(eventInfo.tahun)
      if (!Number.isNaN(day) && !Number.isNaN(year) && monthIndex !== undefined) {
        const eventDate = new Date(year, monthIndex, day)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (eventDate < today) return 'DONE'
      }
      return 'ACTIVE'
    }
    const eventLabel = eventInfo ? `${eventInfo.nama} - ${eventInfo.bulan} ${eventInfo.tahun}` : 'SEMUA EVENT'
    const eventMeta = eventInfo ? `Tgl: ${eventInfo.tanggal || '-'} ${eventInfo.bulan || ''} ${eventInfo.tahun || ''} | Lokasi: ${eventInfo.lokasi || '-'} | Status: ${getEventStatusLabel()}` : ''

    const paidOrders = orders.filter(o => o.status === 'paid' || o.status === 'checked' || o.status === 'completed')
    const totalRevenue = paidOrders.reduce((sum, order) => sum + (order.total_harga || 0), 0)
    const totalPolaroid = paidOrders.filter(o => o.status === 'completed').reduce((sum, order) => sum + (order.order_items?.reduce((pSum, item) => {
      const name = String(item.item_name || '').toLowerCase()
      const isCheki = name.includes('cheki') || name.includes('polaroid')
      return pSum + (isCheki ? (item.quantity || 0) : 0)
    }, 0) || 0), 0)

    const otsOrders = orders.filter(o => o.is_ots)
    const poOrders = orders.filter(o => !o.is_ots)

    const memberStats = {}
    paidOrders.forEach(order => {
      order.order_items?.forEach(item => {
        let name = String(item.item_name || '')
          .replace('Cheki ', '')
          .replace(' (Pre-Order)', '')
          .replace(/[^a-zA-Z0-9\s()]/gu, '')
          .trim()
        if (name.toLowerCase().includes('all member') || name.toLowerCase().includes('group')) {
          name = 'All Member (Group)'
        }
        if (!memberStats[name]) memberStats[name] = { qty: 0, otsQty: 0, poQty: 0, revenue: 0 }
        const qty = item.quantity || 0
        memberStats[name].qty += qty
        
        if (order.is_ots) {
          memberStats[name].otsQty += qty
        } else {
          memberStats[name].poQty += qty
        }
        
        memberStats[name].revenue += (qty * (item.price || 0))
      })
    })

    const titleRow = worksheet.addRow(['REFRESH BREEZE - LAPORAN PENJUALAN'])
    mergeRow(titleRow.number, 'A', 'J', 'REFRESH BREEZE - LAPORAN PENJUALAN', {
      font: { bold: true, size: 14, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF079108' } },
      alignment: { vertical: 'middle', horizontal: 'left' }
    })

    const subtitleRow = worksheet.addRow([`OFFICIAL SALES SUMMARY / ${new Date().toLocaleDateString('id-ID')}`])
    mergeRow(subtitleRow.number, 'A', 'J', subtitleRow.getCell(1).value, {
      font: { bold: true, size: 10, color: { argb: 'FF166534' } },
      alignment: { vertical: 'middle', horizontal: 'left' }
    })

    worksheet.addRow([])

    const eventRow = worksheet.addRow(['EVENT', eventLabel])
    worksheet.mergeCells(`B${eventRow.number}:I${eventRow.number}`)
    eventRow.getCell(1).font = { bold: true }
    eventRow.getCell(2).font = { bold: true }
    if (eventMeta) {
      const metaRow = worksheet.addRow(['DETAILS', eventMeta])
      worksheet.mergeCells(`B${metaRow.number}:J${metaRow.number}`)
      metaRow.getCell(1).font = { bold: true, color: { argb: 'FF64748B' } }
      metaRow.getCell(2).font = { color: { argb: 'FF64748B' } }
    }

    worksheet.addRow([])

    const summaryLabelRow = worksheet.addRow([])
    const summaryValueRow = worksheet.addRow([])
    const summaryBlocks = [
      { start: 'A', end: 'B', label: 'KEUNTUNGAN', value: formatCurrency(totalRevenue), color: 'FF166534' },
      { start: 'C', end: 'D', label: 'TOTAL POLAROID', value: `${totalPolaroid} units`, color: 'FF16A34A' },
      { start: 'E', end: 'F', label: 'OTS ORDERS', value: `${otsOrders.length} orders`, color: 'FF059669' },
      { start: 'G', end: 'H', label: 'PO ORDERS', value: `${poOrders.length} orders`, color: 'FF22C55E' },
    ]

    summaryBlocks.forEach(block => {
      worksheet.mergeCells(`${block.start}${summaryLabelRow.number}:${block.end}${summaryLabelRow.number}`)
      worksheet.mergeCells(`${block.start}${summaryValueRow.number}:${block.end}${summaryValueRow.number}`)
      const labelCell = worksheet.getCell(`${block.start}${summaryLabelRow.number}`)
      const valueCell = worksheet.getCell(`${block.start}${summaryValueRow.number}`)
      labelCell.value = block.label
      valueCell.value = block.value
      labelCell.font = { bold: true, color: { argb: 'FF166534' } }
      labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }
      labelCell.alignment = { vertical: 'middle', horizontal: 'center' }
      valueCell.font = { bold: true, color: { argb: block.color } }
      valueCell.alignment = { vertical: 'middle', horizontal: 'center' }
    })

    applyBorders(summaryLabelRow)
    applyBorders(summaryValueRow)

    worksheet.addRow([])

    const memberTitleRow = worksheet.addRow(['MEMBER PERFORMANCE (A-Z)'])
    mergeRow(memberTitleRow.number, 'A', 'J', 'MEMBER PERFORMANCE (A-Z)', {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF079108' } },
      alignment: { vertical: 'middle', horizontal: 'left' }
    })

    const memberHeaderRow = worksheet.addRow(['Member / Lineup', 'Total Qty', 'OTS Qty', 'PO Qty', 'Revenue', '', '', '', '', ''])
    memberHeaderRow.font = { bold: true }
    for (let i = 1; i <= 5; i++) {
      const cell = memberHeaderRow.getCell(i)
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }
      cell.alignment = { vertical: 'middle', horizontal: i === 5 ? 'right' : 'center' }
    }
    applyBorders(memberHeaderRow)

    const sortedMembers = Object.keys(memberStats).sort((a, b) => a.localeCompare(b))
    if (sortedMembers.length === 0) {
      const emptyRow = worksheet.addRow(['-', '-', '-', '-', '-', '', '', '', '', ''])
      applyBorders(emptyRow)
    } else {
      sortedMembers.forEach(name => {
        const stats = memberStats[name]
        const row = worksheet.addRow([name, stats.qty, stats.otsQty, stats.poQty, stats.revenue, '', '', '', '', ''])
        row.getCell(5).numFmt = '"Rp" #,##0'
        
        row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' }
        row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' }
        row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' }
        row.getCell(5).alignment = { vertical: 'middle', horizontal: 'right' }
        applyBorders(row)
      })
    }

    worksheet.addRow([])

    const detailsTitleRow = worksheet.addRow(['TRANSACTION DETAILS'])
    mergeRow(detailsTitleRow.number, 'A', 'J', 'TRANSACTION DETAILS', {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } },
      alignment: { vertical: 'middle', horizontal: 'left' }
    })

    const addOrderSection = (title, fillColor, ordersList) => {
      const sectionRow = worksheet.addRow([title])
      mergeRow(sectionRow.number, 'A', 'J', title, {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } },
        alignment: { vertical: 'middle', horizontal: 'left' }
      })

      const headerRow = worksheet.addRow(['Kode', 'Customer', 'Contact', 'Type', 'Items', 'Qty', 'Amount', 'Status', 'Date', 'Catatan'])
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } }
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      })
      applyBorders(headerRow)

      if (ordersList.length === 0) {
        const emptyRow = worksheet.addRow(['-', '-', '-', '-', '-', '-', '-', '-', '-'])
        applyBorders(emptyRow)
        return
      }

      ordersList.forEach(order => {
        const itemsText = order.order_items
          ?.map(item => `${item.item_name} x${item.quantity}`)
          .join(', ') || '-'
        const qty = order.order_items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0
        const contact = order.is_ots ? '-' : ([order.whatsapp, order.instagram].filter(Boolean).join(' / ') || '-')
        const row = worksheet.addRow([
          order.order_number || '-',
          order.nama_lengkap || '-',
          contact,
          order.is_ots ? 'OTS' : 'PO',
          itemsText,
          qty,
          order.total_harga || 0,
          formatStatus(order.status),
          new Date(order.created_at).toLocaleString('id-ID'),
          order.catatan || '-'
        ])
        row.getCell(7).numFmt = '"Rp" #,##0'
        row.eachCell((cell, colNumber) => {
          cell.alignment = { vertical: 'middle', horizontal: colNumber === 7 ? 'right' : 'left', wrapText: true }
        })
        applyBorders(row)
      })
    }

    addOrderSection('OTS ORDERS', 'FF059669', otsOrders)
    worksheet.addRow([])
    addOrderSection('PO ORDERS', 'FF16A34A', poOrders)

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename=RefreshBreeze_Report_${Date.now()}.xlsx`)

    await workbook.xlsx.write(res)
    res.end()

  } catch (error) {
    console.error('Error exporting to Excel:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE: Delete order
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({ success: true, message: 'Order deleted' })
  } catch (error) {
    console.error('Error deleting order:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE: Bulk delete orders with filters (Clean DB + Purge Storage Files)
router.post('/bulk-delete', authMiddleware, async (req, res) => {
  try {
    const { deleteType, eventId, weeks, months } = req.body

    console.log('[Orders] Bulk delete request:', { deleteType, eventId, weeks, months })

    let query = supabase.from('orders').select('id, payment_proof_url')

    // Apply filters based on delete type
    if (deleteType === 'event' && eventId) {
      query = query.eq('event_id', eventId)
    } else if (deleteType === 'weeks' && weeks) {
      const weeksAgo = new Date()
      weeksAgo.setDate(weeksAgo.getDate() - (weeks * 7))
      query = query.gte('created_at', weeksAgo.toISOString())
    } else if (deleteType === 'months' && months) {
      const monthsAgo = new Date()
      monthsAgo.setMonth(monthsAgo.getMonth() - months)
      query = query.gte('created_at', monthsAgo.toISOString())
    } else if (deleteType !== 'all') {
      return res.status(400).json({ error: 'Invalid delete type' })
    }

    // Get orders to delete
    const { data: ordersToDelete, error: selectError } = await query

    if (selectError) throw selectError

    if (!ordersToDelete || ordersToDelete.length === 0) {
      return res.json({ success: true, message: 'Tidak ada data order yang perlu dihapus', count: 0 })
    }

    const orderIds = ordersToDelete.map(o => o.id)
    const paymentUrls = ordersToDelete
      .map(o => o.payment_proof_url)
      .filter(url => url && (url.startsWith('http://') || url.startsWith('https://')))

    // 1. Purge physical files from Supabase Storage
    if (paymentUrls.length > 0) {
      await deletePaymentProofFiles(paymentUrls, 'payment-proofs')
    }

    // 2. Delete order_items first (foreign key constraint)
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .in('order_id', orderIds)

    if (itemsError) throw itemsError

    // 3. Delete orders
    const { error: ordersError } = await supabase
      .from('orders')
      .delete()
      .in('id', orderIds)

    if (ordersError) throw ordersError

    console.log(`[Orders] Cleaned ${ordersToDelete.length} orders and purged payment storage files`)

    res.json({
      success: true,
      message: `Berhasil menghapus ${ordersToDelete.length} data order & membersihkan file penyimpanan bukti bayar`,
      count: ordersToDelete.length
    })
  } catch (error) {
    console.error('Error bulk deleting orders:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST: Purge old payment proof images (> 1 month / 30 days) from Supabase Storage
router.post('/purge-old-payments', authMiddleware, async (req, res) => {
  try {
    const oneMonthAgo = new Date()
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30)

    // Find orders created more than 30 days ago that still have payment_proof_url
    const { data: oldOrders, error: fetchErr } = await supabase
      .from('orders')
      .select('id, payment_proof_url')
      .lte('created_at', oneMonthAgo.toISOString())
      .not('payment_proof_url', 'is', null)

    if (fetchErr) throw fetchErr

    if (!oldOrders || oldOrders.length === 0) {
      return res.json({ success: true, message: 'Tidak ada file bukti pembayaran lama (> 1 bulan) yang perlu dibersihkan', count: 0 })
    }

    const paymentUrls = oldOrders
      .map(o => o.payment_proof_url)
      .filter(url => url && (url.startsWith('http://') || url.startsWith('https://')))

    // 1. Remove from storage
    const { deletedCount } = await deletePaymentProofFiles(paymentUrls, 'payment-proofs')

    // 2. Set payment_proof_url = null in DB to free reference
    const orderIds = oldOrders.map(o => o.id)
    const { error: updateErr } = await supabase
      .from('orders')
      .update({ payment_proof_url: null })
      .in('id', orderIds)

    if (updateErr) throw updateErr

    console.log(`[StorageCleaner] Purged ${deletedCount} old payment files from orders > 30 days`)

    res.json({
      success: true,
      message: `Berhasil membersihkan ${deletedCount} file bukti pembayaran dari pesanan yang lewat 1 bulan`,
      count: deletedCount
    })
  } catch (error) {
    console.error('Error purging old payments:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router

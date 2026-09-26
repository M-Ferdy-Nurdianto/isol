import express from 'express'
import jwt from 'jsonwebtoken'
import { supabase } from '../config/supabase.js'
import { authMiddleware } from '../middleware/auth.js'
import ExcelJS from 'exceljs'

const router = express.Router()

// ───────────────────────────────────────────
// MERCH ORDERS
// ───────────────────────────────────────────

// GET all merch orders (admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, search, dateFrom, dateTo } = req.query

    let query = supabase
      .from('merch_orders')
      .select(`
        *,
        merch_order_items (
          id,
          item_name,
          harga,
          quantity,
          merchandise_id,
          size
        )
      `)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`nama_lengkap.ilike.%${search}%,whatsapp.ilike.%${search}%,order_number.ilike.%${search}%`)
    }

    if (dateFrom) query = query.gte('created_at', dateFrom)
    if (dateTo) query = query.lte('created_at', dateTo)

    const { data, error } = await query
    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching merch orders:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET single merch order (admin only)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('merch_orders')
      .select(`
        *,
        merch_order_items (
          id,
          item_name,
          harga,
          quantity,
          merchandise_id,
          size
        )
      `)
      .eq('id', req.params.id)
      .single()

    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching merch order:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST create merch order (customer checkout)
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
        return res.status(503).json({ error: 'Sistem sedang dalam pemeliharaan. Transaksi merchandise saat ini belum dapat diproses.' })
      }
    }

    const { nama_lengkap, whatsapp, instagram, catatan, items, payment_proof_url } = req.body

    if (!whatsapp) {
      return res.status(400).json({ error: 'No. WhatsApp wajib diisi' })
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Tidak ada item di keranjang' })
    }

    const orderNumber = `MERCH${Date.now()}`
    const total_harga = items.reduce((sum, item) => sum + (item.harga * item.quantity), 0)

    const { data: order, error: orderError } = await supabase
      .from('merch_orders')
      .insert({
        order_number: orderNumber,
        nama_lengkap: nama_lengkap || null,
        whatsapp,
        instagram: instagram || null,
        catatan: catatan || null,
        total_harga,
        payment_proof_url: payment_proof_url || null,
        status: 'pending'
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Insert order items
    const orderItems = items.map(item => ({
      merch_order_id: order.id,
      merchandise_id: item.merchandise_id || null,
      item_name: item.nama,
      harga: item.harga,
      quantity: item.quantity,
      size: item.size || null
    }))

    const { error: itemsError } = await supabase
      .from('merch_order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    // Update stock if available
    for (const item of items) {
      if (item.merchandise_id) {
        const { data: merch } = await supabase
          .from('merchandise')
          .select('stok')
          .eq('id', item.merchandise_id)
          .single()

        if (merch && merch.stok > 0) {
          const newStok = Math.max(0, merch.stok - item.quantity)
          await supabase
            .from('merchandise')
            .update({ stok: newStok })
            .eq('id', item.merchandise_id)
        }
      }
    }

    res.json({ success: true, order })
  } catch (error) {
    console.error('Error creating merch order:', error)
    res.status(500).json({ error: error.message })
  }
})

// PATCH update merch order status (admin only)
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body

    const validStatuses = ['pending', 'checked', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid' })
    }

    const { data, error } = await supabase
      .from('merch_orders')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE merch order (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase
      .from('merch_orders')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    res.json({ success: true, message: 'Merch order berhasil dihapus' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET export merch orders to Excel
router.get('/export/excel', authMiddleware, async (req, res) => {
  try {
    const { status, search, dateFrom, dateTo } = req.query

    let query = supabase
      .from('merch_orders')
      .select(`
        *,
        merch_order_items (
          item_name,
          harga,
          quantity,
          size
        )
      `)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') query = query.eq('status', status)
    if (search) query = query.or(`nama_lengkap.ilike.%${search}%,whatsapp.ilike.%${search}%,order_number.ilike.%${search}%`)
    if (dateFrom) query = query.gte('created_at', dateFrom)
    if (dateTo) query = query.lte('created_at', dateTo)

    const { data: orders, error } = await query
    if (error) throw error

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Merch Orders')

    worksheet.columns = [
      { header: 'Order Number', key: 'order_number', width: 22 },
      { header: 'Nama Pembeli', key: 'nama_lengkap', width: 25 },
      { header: 'WhatsApp', key: 'whatsapp', width: 16 },
      { header: 'Instagram', key: 'instagram', width: 20 },
      { header: 'Items', key: 'items', width: 45 },
      { header: 'Size', key: 'size', width: 10 },
      { header: 'Total Harga', key: 'total_harga', width: 18 },
      { header: 'Catatan', key: 'catatan', width: 30 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Tanggal Order', key: 'created_at', width: 20 }
    ]

    // Style Header
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF079108' } }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

    const itemSummary = {} // { product_name: { total: 0, sizes: { 'M': 1, ... } } }
    const sizeSummary = {} // { 'M': 5, 'L': 3 }
    let grandTotalRevenue = 0
    let totalItemsSold = 0

    orders.forEach(order => {
      grandTotalRevenue += order.total_harga

      const itemsText = order.merch_order_items
        .map(item => `${item.item_name}${item.size ? ' (' + item.size + ')' : ''} (${item.quantity}x)`)
        .join(', ')

      const sizesText = order.merch_order_items
        .map(item => item.size || '-')
        .join(', ')

      order.merch_order_items.forEach(item => {
        const name = item.item_name
        const size = item.size || 'No Size'
        const qty = item.quantity
        const price = item.harga
        
        // Track per product
        if (!itemSummary[name]) {
          itemSummary[name] = { total: 0, revenue: 0, sizes: {} }
        }
        itemSummary[name].total += qty
        itemSummary[name].revenue += (qty * price)
        if (!itemSummary[name].sizes[size]) itemSummary[name].sizes[size] = 0
        itemSummary[name].sizes[size] += qty

        // Track global size totals
        if (size !== 'No Size') {
          if (!sizeSummary[size]) sizeSummary[size] = 0
          sizeSummary[size] += qty
        }

        totalItemsSold += qty
      })

      const row = worksheet.addRow({
        order_number: order.order_number,
        nama_lengkap: order.nama_lengkap || '-',
        whatsapp: order.whatsapp,
        instagram: order.instagram || '-',
        items: itemsText,
        size: sizesText,
        total_harga: order.total_harga,
        catatan: order.catatan || '-',
        status: order.status,
        created_at: new Date(order.created_at).toLocaleString('id-ID')
      })

      row.eachCell(cell => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
      })
    })

    // Add spacing
    worksheet.addRow([])
    worksheet.addRow([])

    // 1. GLOBAL SIZE RECAP (The "size M: L: XL:" part)
    if (Object.keys(sizeSummary).length > 0) {
      const sizeHeader = worksheet.addRow(['REKAP TOTAL PER UKURAN (SIZE)'])
      sizeHeader.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
      sizeHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }
      worksheet.mergeCells(`A${sizeHeader.number}:J${sizeHeader.number}`)
      sizeHeader.alignment = { horizontal: 'center' }

      Object.entries(sizeSummary).sort().forEach(([size, qty]) => {
        const row = worksheet.addRow([`Ukuran ${size}`, '', '', '', '', '', '', '', qty, 'pcs'])
        worksheet.mergeCells(`A${row.number}:H${row.number}`)
        row.getCell(9).alignment = { horizontal: 'center' }
        row.eachCell(cell => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
        })
      })
      worksheet.addRow([])
      worksheet.addRow([])
    }

    // 2. PRODUCT SUMMARY
    const summaryHeader = worksheet.addRow(['RINGKASAN PENJUALAN PER PRODUK'])
    summaryHeader.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
    summaryHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF333333' } }
    worksheet.mergeCells(`A${summaryHeader.number}:J${summaryHeader.number}`)
    summaryHeader.alignment = { horizontal: 'center' }

    // Summary Headers
    const subHeader = worksheet.addRow(['Nama Produk', '', '', '', '', '', '', '', 'Jumlah Terjual', 'Total Pendapatan'])
    subHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    subHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF555555' } }
    worksheet.mergeCells(`A${subHeader.number}:H${subHeader.number}`)
    subHeader.alignment = { horizontal: 'center' }
    
    // Summary Rows
    Object.keys(itemSummary).forEach(name => {
      const product = itemSummary[name]
      
      // Main Product Row
      const productRow = worksheet.addRow([
        name, '', '', '', '', '', '', '', 
        product.total, 
        product.revenue
      ])
      worksheet.mergeCells(`A${productRow.number}:H${productRow.number}`)
      productRow.getCell(10).numFmt = '"Rp "#,##0'
      productRow.eachCell(cell => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
        cell.font = { bold: true }
      })

      // Size Breakdown Rows (The "size M: L: XL:" sub-items)
      Object.entries(product.sizes).sort().forEach(([size, qty]) => {
        const sizeRow = worksheet.addRow([
          `   • Ukuran ${size}`, '', '', '', '', '', '', '', 
          qty, 
          '' // Price not needed for sub-item usually
        ])
        worksheet.mergeCells(`A${sizeRow.number}:H${sizeRow.number}`)
        sizeRow.getCell(9).alignment = { horizontal: 'center' }
        sizeRow.eachCell(cell => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
          cell.font = { italic: true }
          cell.font.color = { argb: 'FF666666' }
        })
      })
    })

    // Grand Total Row
    worksheet.addRow([])
    const footerRow = worksheet.addRow(['TOTAL KESELURUHAN', '', '', '', '', '', '', '', totalItemsSold, grandTotalRevenue])
    footerRow.font = { bold: true }
    footerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } } // Yellow highlight
    worksheet.mergeCells(`A${footerRow.number}:H${footerRow.number}`)
    footerRow.getCell(10).numFmt = '"Rp "#,##0'
    footerRow.eachCell(cell => {
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    })

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename=KohiSekai_Merch_Orders_${Date.now()}.xlsx`)

    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    console.error('Error exporting merch orders:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router

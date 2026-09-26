import express from 'express'
import jwt from 'jsonwebtoken'
import { supabase } from '../config/supabase.js'
import { authMiddleware } from '../middleware/auth.js'
import ExcelJS from 'exceljs'
import { deletePaymentProofFiles } from '../utils/storageCleaner.js'

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
          member_id
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
          member_id
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

// POST: Create new order (from customer)
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

    const { event_id, nama_lengkap, kontak, items, payment_proof_url, catatan } = req.body

    // Validate event_id
    if (!event_id) {
      return res.status(400).json({ error: 'Event ID is required' })
    }

    // Generate order number
    const orderNumber = `KS${Date.now()}`

    // Generate auto email from timestamp
    const autoEmail = `order-${Date.now()}@kohisekai.com`

    // Determine if kontak is phone or instagram
    const isPhone = /^[0-9+\-\s()]+$/.test(kontak)
    const whatsapp = isPhone ? kontak : '-'
    const instagram = !isPhone ? kontak : '-'

    // Calculate total
    const total_harga = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        event_id,
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

    // Insert order items
    const orderItems = items.map(item => {
      // Handle group member (member_id is string "group" not UUID)
      const memberId = (item.member_id === 'group' || typeof item.member_id === 'string' && !item.member_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i))
        ? null
        : item.member_id

      return {
        order_id: order.id,
        member_id: memberId,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity
      }
    })

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    res.json({ success: true, order })
  } catch (error) {
    console.error('Error creating order:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST: Create OTS (On The Spot) order by admin
router.post('/ots', authMiddleware, async (req, res) => {
  try {
    const { event_id, nama_lengkap, whatsapp, email, instagram, items, payment_method } = req.body

    if (!event_id) {
      return res.status(400).json({ error: 'Event ID is required' })
    }

    const orderNumber = `KS-OTS${Date.now()}`
    const total_harga = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        event_id,
        nama_lengkap,
        whatsapp: whatsapp || '-',
        email: email || `ots-${Date.now()}@kohisekai.com`,
        instagram: instagram || '-',
        total_harga,
        status: 'checked',
        is_ots: true,
        created_by: 'admin',
        payment_proof_url: payment_method || 'Cash' // Store Cash/QR here
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Handle group member ID (convert to NULL if not valid UUID)
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const orderItems = items.map(item => {
      const memberId = (item.member_id === 'group' || !UUID_REGEX.test(item.member_id))
        ? null
        : item.member_id

      return {
        order_id: order.id,
        member_id: memberId,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity
      }
    })

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    res.json({ success: true, order })
  } catch (error) {
    console.error('Error creating OTS order:', error)
    res.status(500).json({ error: error.message })
  }
})

// PATCH: Update order status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!['pending', 'checked', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status })
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
          quantity
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
      if (status === 'pending') return 'BELUM BAYAR'
      if (status === 'checked') return 'DI BAYAR'
      if (status === 'completed') return 'DI AMBIL'
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

    const paidOrders = orders.filter(o => o.status === 'checked' || o.status === 'completed')
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

    const titleRow = worksheet.addRow(['KOHI SEKAI - LAPORAN PENJUALAN'])
    mergeRow(titleRow.number, 'A', 'J', 'KOHI SEKAI - LAPORAN PENJUALAN', {
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
    res.setHeader('Content-Disposition', `attachment; filename=KohiSekai_Report_${Date.now()}.xlsx`)

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

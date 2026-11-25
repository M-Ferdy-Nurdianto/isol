import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Swal from 'sweetalert2'
import { getValidAdminToken } from './authSession'

export const stripEmoji = (text) => String(text || '').replace(/[^a-zA-Z0-9\s()]/gu, '').trim()

const buildScopedExportParams = ({ scope, value, params }) => {
  const exportParams = { ...(params || {}) }
  if (scope === 'event' && value) {
    exportParams.event_id = value
    delete exportParams.dateFrom
    delete exportParams.dateTo
  } else if (scope === 'month' && value) {
    const [y, m] = String(value).split('-').map(Number)
    const firstDay = new Date(y, (m || 1) - 1, 1, 0, 0, 0, 0)
    const lastDay = new Date(y, m || 1, 0, 23, 59, 59, 999)
    exportParams.dateFrom = firstDay.toISOString()
    exportParams.dateTo = lastDay.toISOString()
    delete exportParams.event_id
  }
  return exportParams
}

export const generateExcel = async ({ scope, value, params, events, api }) => {
  try {
    const exportParams = buildScopedExportParams({ scope, value, params })

    const queryString = new URLSearchParams(exportParams).toString()
    const token = getValidAdminToken()
    const apiUrl = import.meta.env.MODE === 'production' ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')

    Swal.fire({ title: 'Downloading Excel...', allowOutsideClick: false, didOpen: () => Swal.showLoading() })

    const response = await fetch(`${apiUrl}/orders/export/excel?${queryString}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!response.ok) throw new Error('Export gagal')

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const safeSuffix = (() => {
      if (scope === 'event' && value) {
        const ev = events.find(e => e.id === value)
        return ev ? `${ev.nama}_${ev.tanggal}_${ev.bulan}_${ev.tahun}` : `Event_${value}`
      }
      if (scope === 'month') return `Bulan_${value}`
      return 'Filtered'
    })().replace(/[^a-zA-Z0-9_\-]/g, '_')

    a.download = `KohiSekai_Report_${safeSuffix}_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    Swal.fire({ icon: 'success', title: 'Excel berhasil didownload!', timer: 2000, showConfirmButton: false })
  } catch (error) {
    console.error('Error exporting:', error)
    Swal.fire({ icon: 'error', title: 'Export Gagal', text: error.message })
  }
}

export const generateMerchExcel = async ({ statusFilter, searchQuery }) => {
  try {
    const params = {}
    if (statusFilter !== 'all') params.status = statusFilter
    if (searchQuery) params.search = searchQuery

    const queryString = new URLSearchParams(params).toString()
    const token = getValidAdminToken()
    const apiUrl = import.meta.env.MODE === 'production' ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')

    Swal.fire({ title: 'Downloading Merch Excel...', allowOutsideClick: false, didOpen: () => Swal.showLoading() })

    const response = await fetch(`${apiUrl}/merch-orders/export/excel?${queryString}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!response.ok) throw new Error('Export gagal')

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `KohiSekai_Merch_Orders_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    Swal.fire({ icon: 'success', title: 'Excel Merch berhasil didownload!', timer: 2000, showConfirmButton: false })
  } catch (error) {
    console.error('Error exporting merch:', error)
    Swal.fire({ icon: 'error', title: 'Export Gagal', text: error.message })
  }
}

export const generateMerchPDF = async ({ api, statusFilter, searchQuery }) => {
  try {
    Swal.fire({ title: 'Generating Merch PDF...', allowOutsideClick: false, didOpen: () => Swal.showLoading() })

    const params = {}
    if (statusFilter !== 'all') params.status = statusFilter
    if (searchQuery) params.search = searchQuery

    const res = await api.get('/merch-orders', { params })
    const orders = res.data.data

    if (!orders || orders.length === 0) throw new Error('Tidak ada data untuk diexport.')

    const doc = new jsPDF()
    doc.setFillColor(232, 148, 74)
    doc.rect(0, 0, 210, 24, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('KOHI SEKAI - LAPORAN MERCHANDISE', 105, 16, { align: 'center' })

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.text(`Tanggal Export: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 35)

    const tableBody = orders.map((order, index) => [
      index + 1,
      order.order_number,
      order.nama_lengkap || '-',
      `WA: ${order.whatsapp}${order.instagram ? '\nIG: ' + order.instagram : ''}`,
      order.merch_order_items?.map(i => `${i.item_name} ${i.size ? `(${i.size}) ` : ''}x${i.quantity}`).join('\n') || '-',
      `Rp ${order.total_harga.toLocaleString('id-ID')}`,
      order.status
    ])

    const itemSummary = {}
    const globalSizeSummary = {}
    let totalQty = 0
    let totalRevenue = 0

    orders.forEach(order => {
      totalRevenue += order.total_harga
      order.merch_order_items?.forEach(item => {
        const name = item.item_name
        const size = item.size || 'No Size'
        const qty = item.quantity

        if (!itemSummary[name]) itemSummary[name] = { qty: 0, revenue: 0, sizes: {} }
        itemSummary[name].qty += qty
        itemSummary[name].revenue += (qty * item.harga)
        if (!itemSummary[name].sizes[size]) itemSummary[name].sizes[size] = 0
        itemSummary[name].sizes[size] += qty

        if (size !== 'No Size') {
          if (!globalSizeSummary[size]) globalSizeSummary[size] = 0
          globalSizeSummary[size] += qty
        }
        totalQty += qty
      })
    })

    autoTable(doc, {
      startY: 45,
      head: [['#', 'Order #', 'Nama', 'Kontak', 'Items', 'Total', 'Status']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [232, 148, 74], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      columnStyles: { 0: { cellWidth: 10 }, 4: { cellWidth: 50 }, 5: { halign: 'right' } }
    })

    let currentY = doc.lastAutoTable.finalY + 15
    if (Object.keys(globalSizeSummary).length > 0) {
      doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.text('REKAP TOTAL PER UKURAN (SIZE)', 14, currentY)
      const sizeBody = Object.entries(globalSizeSummary).sort().map(([size, qty]) => [`Ukuran ${size}`, `${qty} pcs`])
      autoTable(doc, { startY: currentY + 5, head: [['Ukuran', 'Total Terjual']], body: sizeBody, theme: 'grid', headStyles: { fillColor: [30, 41, 59], textColor: 255 }, styles: { fontSize: 9 }, tableWidth: 80, margin: { left: 14 } })
      currentY = doc.lastAutoTable.finalY + 15
    }

    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.text('RINGKASAN PENJUALAN PER PRODUK', 14, currentY)
    const summaryRows = []
    Object.keys(itemSummary).forEach(name => {
      const product = itemSummary[name]
      summaryRows.push([ { content: name, styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } }, { content: product.qty, styles: { fontStyle: 'bold', fillColor: [248, 250, 252], halign: 'center' } }, { content: `Rp ${product.revenue.toLocaleString('id-ID')}`, styles: { fontStyle: 'bold', fillColor: [248, 250, 252], halign: 'right' } } ])
      Object.entries(product.sizes).sort().forEach(([size, qty]) => { summaryRows.push([ { content: `   â€¢ Ukuran ${size}`, styles: { fontStyle: 'italic', textColor: [100, 116, 139] } }, { content: qty, styles: { halign: 'center', textColor: [100, 116, 139] } }, '' ]) })
    })
    summaryRows.push([ { content: 'TOTAL KESELURUHAN', styles: { fontStyle: 'bold', fillColor: [255, 255, 0] } }, { content: totalQty, styles: { fontStyle: 'bold', fillColor: [255, 255, 0], halign: 'center' } }, { content: `Rp ${totalRevenue.toLocaleString('id-ID')}`, styles: { fontStyle: 'bold', fillColor: [255, 255, 0], halign: 'right' } } ])
    autoTable(doc, { startY: currentY + 5, head: [['Nama Produk', 'Terjual', 'Total Rupiah']], body: summaryRows, theme: 'grid', headStyles: { fillColor: [50, 50, 50], textColor: 255 }, styles: { fontSize: 9 }, columnStyles: { 1: { cellWidth: 30 }, 2: { cellWidth: 40 } } })

    doc.save(`KohiSekai_Merch_Orders_${new Date().toISOString().slice(0, 10)}.pdf`)
    Swal.fire({ icon: 'success', title: 'PDF Merch Berhasil!', timer: 1500, showConfirmButton: false })
  } catch (error) { Swal.fire({ icon: 'error', title: 'Gagal PDF Merch', text: error.message }) }
}

export const generatePDF = async ({ api, scope, value, params, events }) => {
  try {
    Swal.fire({ title: 'Generating PDF...', allowOutsideClick: false, didOpen: () => Swal.showLoading() })
    const exportParams = buildScopedExportParams({ scope, value, params })

    const res = await api.get('/orders', { params: exportParams })
    const orders = res.data.data
    if (!orders || orders.length === 0) throw new Error('Tidak ada data untuk diexport.')

    const eventId = scope === 'event' ? value : (scope === 'month' ? null : exportParams.event_id)
    const eventInfo = eventId ? events.find(e => e.id === eventId) : null
    const monthLabel = scope === 'month' && value
      ? (() => {
          const [y, m] = String(value).split('-').map(Number)
          return `Bulan ${new Date(y, (m || 1) - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`
        })()
      : null
    const eventLabel = monthLabel || (eventInfo ? `${eventInfo.nama} - ${eventInfo.bulan} ${eventInfo.tahun}` : 'Semua Event')
    const monthIndexMap = {
      januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5, juli: 6,
      agustus: 7, september: 8, oktober: 9, november: 10, desember: 11,
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7,
      sep: 8, oct: 9, nov: 10, dec: 11
    }
    const getEventStatusLabel = () => {
      if (!eventInfo) return ''
      if (eventInfo.is_past) return 'SELESAI'
      const monthKey = String(eventInfo.bulan || '').toLowerCase()
      const monthIndex = monthIndexMap[monthKey]
      const day = Number(eventInfo.tanggal)
      const year = Number(eventInfo.tahun)
      if (!Number.isNaN(day) && !Number.isNaN(year) && monthIndex !== undefined) {
        const eventDate = new Date(year, monthIndex, day)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (eventDate < today) return 'SELESAI'
      }
      return 'AKTIF'
    }
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

    const normalizeMemberName = (rawName) => {
      const cleaned = stripEmoji(String(rawName || ''))
      const lower = cleaned.toLowerCase()
      if (lower.includes('all member') || lower.includes('grup') || lower.includes('group')) {
        return 'Cheki Grup'
      }
      const normalized = cleaned
        .replace(/\((?:16:9|169|regular|wide(?:\s*169)?|pre-order|ots)\)/gi, ' ')
        .replace(/\b(?:regular|wide|2shot|ots|cheki|polaroid|16:9|169)\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      return normalized || cleaned || '-'
    }

    const memberStats = {}
    paidOrders.forEach(order => {
      order.order_items?.forEach(item => {
        const raw = String(item.item_name || '')
        const name = normalizeMemberName(raw)
        const isWide = item.cheki_type === 'wide' || /\bwide\b|16:?9/i.test(raw)
        if (!memberStats[name]) {
          memberStats[name] = { qty: 0, regPoQty: 0, regOtsQty: 0, widePoQty: 0, wideOtsQty: 0, revenue: 0 }
        }
        const qty = item.quantity || 0
        const price = Number(item.price ?? item.harga ?? 0)

        memberStats[name].qty += qty
        if (isWide) {
          if (order.is_ots) memberStats[name].wideOtsQty += qty
          else memberStats[name].widePoQty += qty
        } else {
          if (order.is_ots) memberStats[name].regOtsQty += qty
          else memberStats[name].regPoQty += qty
        }
        memberStats[name].revenue += (qty * price)
      })
    })

    const formatCurrency = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`
    const formatDate = (value) => new Date(value).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    const statusLabel = (status) => {
      if (status === 'pending') return 'BELUM BAYAR'
      if (status === 'checked') return 'DI BAYAR'
      if (status === 'completed') return 'DI AMBIL'
      return String(status || '-').toUpperCase()
    }
    const loadLogoDataUrl = async () => {
      const logoPaths = [
        '/images/logos/logo.svg',
        '/apple-touch-icon.png',
        '/android-chrome-192x192.png'
      ]
      for (const path of logoPaths) {
        try {
          const res = await fetch(path)
          if (!res.ok) continue
          const blob = await res.blob()
          const image = await new Promise((resolve, reject) => {
            const img = new Image()
            img.onload = () => resolve(img)
            img.onerror = () => reject(new Error('Failed to load logo'))
            img.src = URL.createObjectURL(blob)
          })
          const canvas = document.createElement('canvas')
          canvas.width = image.width
          canvas.height = image.height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(image, 0, 0)
          URL.revokeObjectURL(image.src)
          return canvas.toDataURL('image/png')
        } catch (error) {
          // Try next logo path
        }
      }
      return null
    }
    const buildOrderRows = (list) => list.map(order => {
      const items = order.order_items?.map(item => `${stripEmoji(item.item_name)} x${item.quantity}`).join(', ') || '-'
      const qty = order.order_items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0
      const contact = order.is_ots ? '-' : ([order.whatsapp, order.instagram].filter(Boolean).join(' / ') || '-')
      return [
        order.order_number || '-',
        stripEmoji(order.nama_lengkap || '-'),
        contact,
        order.is_ots ? 'OTS' : 'PO',
        items,
        qty,
        formatCurrency(order.total_harga),
        statusLabel(order.status),
        formatDate(order.created_at)
      ]
    })

    const logoDataUrl = await loadLogoDataUrl()
    const doc = new jsPDF('p', 'mm', 'a4')
    doc.setFillColor(232, 148, 74)
    doc.rect(0, 0, 210, 24, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', 14, 5, 12, 12)
    }
    doc.text('KOHI SEKAI - LAPORAN PENJUALAN', 105, 15, { align: 'center' })

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    const infoStartY = 32
    doc.text(`Tanggal Export: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, infoStartY)
    doc.text(`Event: ${eventLabel}`, 14, infoStartY + 5)
    if (eventMeta) {
      doc.setFontSize(8)
      doc.setTextColor(100, 116, 139)
      doc.text(eventMeta, 14, infoStartY + 9)
    }

    autoTable(doc, {
      startY: eventMeta ? infoStartY + 14 : infoStartY + 10,
      head: [['KEUNTUNGAN', 'TOTAL POLAROID', 'OTS ORDERS', 'PO ORDERS']],
      body: [[formatCurrency(totalRevenue), `${totalPolaroid} units`, `${otsOrders.length} orders`, `${poOrders.length} orders`]],
      theme: 'grid',
      styles: { fontSize: 9, halign: 'center' },
      headStyles: { fillColor: [254, 243, 199], textColor: [180, 83, 9], fontStyle: 'bold' },
      bodyStyles: { fillColor: [255, 255, 255], textColor: [180, 83, 9], fontStyle: 'bold' },
      columnStyles: {
        0: { textColor: [217, 119, 6] },
        1: { textColor: [232, 148, 74] },
        2: { textColor: [245, 158, 11] },
        3: { textColor: [217, 119, 6] }
      }
    })

    let currentY = doc.lastAutoTable.finalY + 8
    doc.setFillColor(36, 30, 25)
    doc.rect(14, currentY, 182, 7, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.text('MEMBER PERFORMANCE (A-Z)', 16, currentY + 5)
    currentY += 10

    const sortedMembers = Object.entries(memberStats).sort((a, b) => a[0].localeCompare(b[0]))
    const memberBody = sortedMembers.map(([name, stats]) => [
      stripEmoji(name),
      stats.regPoQty,
      stats.regOtsQty,
      stats.widePoQty,
      stats.wideOtsQty,
      stats.qty,
      formatCurrency(stats.revenue)
    ])

    if (sortedMembers.length > 0) {
      const totals = sortedMembers.reduce((acc, [, s]) => ({
        regPoQty: acc.regPoQty + s.regPoQty,
        regOtsQty: acc.regOtsQty + s.regOtsQty,
        widePoQty: acc.widePoQty + s.widePoQty,
        wideOtsQty: acc.wideOtsQty + s.wideOtsQty,
        qty: acc.qty + s.qty,
        revenue: acc.revenue + s.revenue
      }), { regPoQty: 0, regOtsQty: 0, widePoQty: 0, wideOtsQty: 0, qty: 0, revenue: 0 })

      memberBody.push([
        { content: 'TOTAL', styles: { fontStyle: 'bold', fillColor: [254, 243, 199], textColor: [36, 30, 25] } },
        { content: totals.regPoQty, styles: { fontStyle: 'bold', fillColor: [254, 243, 199], textColor: [36, 30, 25], halign: 'center' } },
        { content: totals.regOtsQty, styles: { fontStyle: 'bold', fillColor: [254, 243, 199], textColor: [36, 30, 25], halign: 'center' } },
        { content: totals.widePoQty, styles: { fontStyle: 'bold', fillColor: [254, 243, 199], textColor: [36, 30, 25], halign: 'center' } },
        { content: totals.wideOtsQty, styles: { fontStyle: 'bold', fillColor: [254, 243, 199], textColor: [36, 30, 25], halign: 'center' } },
        { content: totals.qty, styles: { fontStyle: 'bold', fillColor: [254, 243, 199], textColor: [36, 30, 25], halign: 'center' } },
        { content: formatCurrency(totals.revenue), styles: { fontStyle: 'bold', fillColor: [254, 243, 199], textColor: [180, 83, 9], halign: 'right' } }
      ])
    }

    autoTable(doc, {
      startY: currentY,
      head: [['Member', 'Reg (PO)', 'Reg (OTS)', 'Wide (PO)', 'Wide (OTS)', 'Total Qty', 'Revenue']],
      body: memberBody.length ? memberBody : [['-', '-', '-', '-', '-', '-', '-']],
      theme: 'grid',
      headStyles: { fillColor: [232, 148, 74], textColor: 255, fontSize: 8 },
      styles: { fontSize: 8.5 },
      columnStyles: {
        1: { halign: 'center', cellWidth: 18 },
        2: { halign: 'center', cellWidth: 19 },
        3: { halign: 'center', cellWidth: 19 },
        4: { halign: 'center', cellWidth: 20 },
        5: { halign: 'center', cellWidth: 19, fontStyle: 'bold' },
        6: { halign: 'right' }
      }
    })

    currentY = doc.lastAutoTable.finalY + 8
    doc.setFillColor(36, 30, 25)
    doc.rect(14, currentY, 182, 7, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.text('TRANSACTION DETAILS', 16, currentY + 5)
    currentY += 10

    doc.setFillColor(232, 148, 74)
    doc.rect(14, currentY, 182, 6, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.text('OTS ORDERS', 16, currentY + 4)
    currentY += 8

    autoTable(doc, {
      startY: currentY,
      head: [['Kode', 'Customer', 'Contact', 'Type', 'Items', 'Qty', 'Amount', 'Status', 'Date']],
      body: buildOrderRows(otsOrders).length ? buildOrderRows(otsOrders) : [['-', '-', '-', '-', '-', '-', '-', '-', '-']],
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1, overflow: 'linebreak' },
      headStyles: { fillColor: [232, 148, 74], textColor: 255 },
      columnStyles: { 4: { cellWidth: 40 }, 6: { halign: 'right' } }
    })

    currentY = doc.lastAutoTable.finalY + 6
    doc.setFillColor(92, 68, 51)
    doc.rect(14, currentY, 182, 6, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.text('PO ORDERS', 16, currentY + 4)
    currentY += 8

    autoTable(doc, {
      startY: currentY,
      head: [['Kode', 'Customer', 'Contact', 'Type', 'Items', 'Qty', 'Amount', 'Status', 'Date']],
      body: buildOrderRows(poOrders).length ? buildOrderRows(poOrders) : [['-', '-', '-', '-', '-', '-', '-', '-', '-']],
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1, overflow: 'linebreak' },
      headStyles: { fillColor: [92, 68, 51], textColor: 255 },
      columnStyles: { 4: { cellWidth: 40 }, 6: { halign: 'right' } }
    })

    const safeLabel = eventLabel.replace(/[^a-zA-Z0-9_\-]/g, '_')
    doc.save(`KohiSekai_Orders_${safeLabel}_${new Date().toISOString().slice(0, 10)}.pdf`)
    Swal.fire({ icon: 'success', title: 'PDF Berhasil!', timer: 1500, showConfirmButton: false })
  } catch (error) { Swal.fire({ icon: 'error', title: 'Gagal PDF', text: error.message }) }
}

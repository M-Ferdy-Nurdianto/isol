// Guest Sandbox & Data Masking Utilities for Kohi Sekai Admin

export const isGuestMode = () => {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('is_guest_mode') === 'true'
}

export const setGuestSession = (isGuest = true) => {
  if (typeof window === 'undefined') return
  if (isGuest) {
    localStorage.setItem('is_guest_mode', 'true')
    localStorage.setItem('admin_token', 'demo_guest_token_rb_2026')
    localStorage.setItem('admin_user', JSON.stringify({
      id: 'guest-demo-user',
      username: 'GS123',
      full_name: 'Guest Tester (Demo)',
      role: 'guest'
    }))
  } else {
    localStorage.removeItem('is_guest_mode')
  }
}

export const clearGuestSession = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem('is_guest_mode')
}

// Masking helpers for privacy protection in guest mode
export const maskName = (name) => {
  if (!name) return 'Customer (Demo)'
  const parts = String(name).trim().split(/\s+/)
  return parts.map(part => {
    if (part.length <= 1) return '*'
    if (part.length === 2) return part[0] + '*'
    return part[0] + '*'.repeat(Math.max(part.length - 2, 2)) + part[part.length - 1]
  }).join(' ')
}

export const maskPhone = (phone) => {
  if (!phone || phone === '-') return '-'
  const clean = String(phone).replace(/\s+/g, '')
  if (clean.length <= 6) return '0812****'
  return clean.slice(0, 4) + '****' + clean.slice(-4)
}

export const maskInstagram = (ig) => {
  if (!ig || ig === '-') return '-'
  let handle = String(ig).trim()
  const hasAt = handle.startsWith('@')
  if (hasAt) handle = handle.slice(1)
  if (handle.length <= 3) return '@***'
  return `@${handle[0]}***${handle.slice(-2)}`
}

// Placeholder for masked payment proof
export const MASKED_PAYMENT_PROOF_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23111726'/%3E%3Crect x='10' y='10' width='380' height='280' rx='12' fill='none' stroke='%23374151' stroke-width='2' stroke-dasharray='6 6'/%3E%3Ctext x='50%25' y='45%25' dominant-baseline='middle' text-anchor='middle' fill='%23f59e0b' font-family='sans-serif' font-weight='bold' font-size='16'%3E[ BUKTI BAYAR DISENSOR ]%3C/text%3E%3Ctext x='50%25' y='58%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='sans-serif' font-size='12'%3EMode Tamu / Guest Sandbox View%3C/text%3E%3C/svg%3E"

// Apply masking to orders for guest view
export const maskOrderForGuest = (order) => {
  if (!order) return order
  return {
    ...order,
    nama_lengkap: maskName(order.nama_lengkap),
    whatsapp: maskPhone(order.whatsapp),
    instagram: maskInstagram(order.instagram),
    // For OTS orders, payment_proof_url stores payment method ('Cash' / 'QR') so keep it as is!
    // For online PO orders with photo upload, replace with masked placeholder.
    payment_proof_url: order.is_ots 
      ? (order.payment_proof_url || 'Cash')
      : (order.payment_proof_url ? MASKED_PAYMENT_PROOF_URL : null),
    // Keep items, prices, quantities, event info, and notes intact so testing is 100% functional
    is_masked_for_guest: true
  }
}

// Apply masking to merchandise orders for guest view
export const maskMerchOrderForGuest = (order) => {
  if (!order) return order
  return {
    ...order,
    nama_lengkap: maskName(order.nama_lengkap || order.customer_name),
    customer_name: maskName(order.customer_name || order.nama_lengkap),
    whatsapp: maskPhone(order.whatsapp),
    instagram: maskInstagram(order.instagram),
    alamat_pengiriman: order.alamat_pengiriman ? 'Alamat Disensor (Mode Tamu)' : '-',
    payment_proof_url: order.payment_proof_url ? MASKED_PAYMENT_PROOF_URL : null,
    is_masked_for_guest: true
  }
}

// Simulates success responses for mutations without touching the database
export const generateGuestMockResponse = (config) => {
  const method = (config.method || 'get').toLowerCase()
  const url = config.url || ''
  let parsedData = config.data

  if (typeof parsedData === 'string') {
    try {
      parsedData = JSON.parse(parsedData)
    } catch (_) {}
  }

  // File Upload mock response
  if (url.includes('/upload')) {
    return {
      status: 200,
      data: {
        success: true,
        message: 'Upload berhasil (Simulasi Demo)',
        data: {
          url: '/images/members/placeholder.svg',
          file_name: 'demo_upload.webp'
        }
      }
    }
  }

  // Orders OTS creation mock response
  if (url.includes('/orders/ots') || (url.includes('/orders') && method === 'post')) {
    const mockOrder = {
      id: 'demo-ots-' + Date.now(),
      order_number: 'OTS-DEMO-' + Math.floor(1000 + Math.random() * 9000),
      nama_lengkap: parsedData?.nama_lengkap || 'Guest Tester',
      whatsapp: '-',
      instagram: '-',
      is_ots: true,
      status: 'completed',
      total_harga: parsedData?.items?.reduce((sum, item) => sum + ((item.price || 25000) * (item.quantity || 1)), 0) || 25000,
      order_items: (parsedData?.items || []).map(item => ({
        item_name: item.member_name || item.name || 'Cheki Member (Demo)',
        quantity: item.quantity || 1,
        price: item.price || 25000
      })),
      created_at: new Date().toISOString()
    }

    return {
      status: 200,
      data: {
        success: true,
        message: 'Order OTS berhasil dibuat (Simulasi Demo)',
        data: mockOrder
      }
    }
  }

  // Events mutation mock response
  if (url.includes('/events')) {
    return {
      status: 200,
      data: {
        success: true,
        message: method === 'delete' ? 'Event berhasil dihapus (Simulasi Demo)' : 'Event berhasil disimpan (Simulasi Demo)',
        data: {
          id: parsedData?.id || 'demo-event-' + Date.now(),
          ...parsedData
        }
      }
    }
  }

  // Members mutation mock response
  if (url.includes('/members')) {
    return {
      status: 200,
      data: {
        success: true,
        message: method === 'delete' ? 'Member berhasil dihapus (Simulasi Demo)' : 'Member berhasil disimpan (Simulasi Demo)',
        data: {
          id: parsedData?.id || 'demo-member-' + Date.now(),
          ...parsedData
        }
      }
    }
  }

  // Merch / Merch-Orders mutation mock response
  if (url.includes('/merchandise') || url.includes('/merch-orders')) {
    return {
      status: 200,
      data: {
        success: true,
        message: method === 'delete' ? 'Merch berhasil dihapus (Simulasi Demo)' : 'Merchandise berhasil disimpan (Simulasi Demo)',
        data: {
          id: parsedData?.id || 'demo-merch-' + Date.now(),
          ...parsedData
        }
      }
    }
  }

  // Config / Settings mutation mock response
  if (url.includes('/config')) {
    return {
      status: 200,
      data: {
        success: true,
        message: 'Pengaturan berhasil diperbarui (Simulasi Demo)',
        data: parsedData
      }
    }
  }

  // Default fallback for any other POST/PUT/PATCH/DELETE
  return {
    status: 200,
    data: {
      success: true,
      message: 'Operasi berhasil (Simulasi Demo)',
      data: parsedData
    }
  }
}

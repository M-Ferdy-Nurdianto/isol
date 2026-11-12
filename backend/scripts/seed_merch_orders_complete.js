import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const defaultLocalUrl = 'http://127.0.0.1:54321'
const defaultLocalServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const envUrl = process.env.SUPABASE_URL
const envKey = process.env.SUPABASE_SERVICE_KEY

const supabaseUrl = (envUrl && !envUrl.includes('placeholder')) ? envUrl : defaultLocalUrl
const supabaseServiceKey = (envKey && !envKey.includes('your_supabase') && !envKey.includes('placeholder')) ? envKey : defaultLocalServiceKey

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedCompleteMerchOrders() {
  console.log('=== SEEDING COMPREHENSIVE MERCHANDISE ORDERS ===')

  // 1. Fetch Fans
  const { data: fans, error: fanErr } = await supabase.from('users').select('*').eq('role', 'fan')
  if (fanErr || !fans?.length) {
    console.error('Failed to get fans:', fanErr)
    return
  }

  // 2. Fetch Merchandise
  const { data: merchList, error: merchErr } = await supabase.from('merchandise').select('*').order('urutan')
  if (merchErr || !merchList?.length) {
    console.error('Failed to get merchandise:', merchErr)
    return
  }

  // Map products by short key
  const jersey = merchList.find(m => m.nama.includes('Jersey')) || merchList[0]
  const tshirt = merchList.find(m => m.nama.includes('T-Shirt')) || merchList[1]
  const lanyard = merchList.find(m => m.nama.includes('Lanyard')) || merchList[2]
  const ganci = merchList.find(m => m.nama.includes('Gantungan')) || merchList[3]
  const totebag = merchList.find(m => m.nama.includes('Totebag')) || merchList[4]
  const lightstick = merchList.find(m => m.nama.includes('Lightstick')) || merchList[5]
  const photocard = merchList.find(m => m.nama.includes('Photocard')) || merchList[6]
  const standee = merchList.find(m => m.nama.includes('Standee')) || merchList[7]

  // Map fans by name
  const getFan = (name) => fans.find(f => f.nama.toLowerCase().includes(name.toLowerCase())) || fans[0]

  // 3. Clear existing merch_orders to have a clean, non-dummy dataset
  const { error: delErr } = await supabase.from('merch_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (delErr) {
    console.warn('Warning clearing old merch orders:', delErr.message)
  }

  // 4. Define 18 Realistic Orders with Diverse Statuses
  const ordersSeed = [
    // ── STATUS: PENDING (4 orders) ──
    {
      fan: getFan('nei'),
      status: 'pending',
      delivery_method: 'shipping',
      shipping_address: 'Jl. Tebet Barat Dalam Raya No. 18, RT 04/RW 03, Tebet',
      shipping_city: 'Jakarta Selatan',
      shipping_postal_code: '12810',
      shipping_courier: null,
      tracking_number: null,
      catatan: 'Tolong kirim sebelum weekend ya min, mau dipakai pas live.',
      payment_proof_url: '/images/members/placeholder.svg',
      created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      items: [
        { prod: jersey, size: 'L', qty: 1 },
        { prod: lanyard, size: 'All Size', qty: 1 }
      ]
    },
    {
      fan: getFan('Budi Santoso'),
      status: 'pending',
      delivery_method: 'shipping',
      shipping_address: 'Jl. Gandaria I No. 25, Kramat Pela, Kebayoran Baru',
      shipping_city: 'Jakarta Selatan',
      shipping_postal_code: '12130',
      shipping_courier: null,
      tracking_number: null,
      catatan: 'Packaging aman jangan sampai terlipat atau basah.',
      payment_proof_url: '/images/members/placeholder.svg',
      created_at: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
      items: [
        { prod: tshirt, size: 'XL', qty: 1 },
        { prod: standee, size: 'Standard', qty: 1 }
      ]
    },
    {
      fan: getFan('Rizky Firmansyah'),
      status: 'pending',
      delivery_method: 'pickup_event',
      shipping_address: null,
      shipping_city: null,
      shipping_postal_code: null,
      shipping_courier: null,
      tracking_number: null,
      catatan: 'Nanti saya ambil di booth merch Kohi Sunday Festival.',
      payment_proof_url: '/images/members/placeholder.svg',
      created_at: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
      items: [
        { prod: lightstick, size: 'Standard', qty: 1 },
        { prod: photocard, size: '5 Cards', qty: 1 }
      ]
    },
    {
      fan: getFan('Fajar Ramadhan'),
      status: 'pending',
      delivery_method: 'shipping',
      shipping_address: 'Jl. Ir. H. Juanda (Dago) No. 142, Coblong',
      shipping_city: 'Kota Bandung',
      shipping_postal_code: '40135',
      shipping_courier: null,
      tracking_number: null,
      catatan: null,
      payment_proof_url: '/images/members/placeholder.svg',
      created_at: new Date(Date.now() - 210 * 60 * 1000).toISOString(),
      items: [
        { prod: totebag, size: 'Standard', qty: 1 },
        { prod: ganci, size: 'Akrilik', qty: 2 }
      ]
    },

    // ── STATUS: PAID / CHECKED (4 orders) ──
    {
      fan: getFan('Aditya Pratama'),
      status: 'paid',
      delivery_method: 'pickup_event',
      shipping_address: null,
      shipping_city: null,
      shipping_postal_code: null,
      shipping_courier: null,
      tracking_number: null,
      catatan: 'Ambil saat sesi 2-shot siang.',
      payment_proof_url: '/images/members/placeholder.svg',
      created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      items: [
        { prod: jersey, size: 'M', qty: 1 }
      ]
    },
    {
      fan: getFan('Dimas Nugraha'),
      status: 'paid',
      delivery_method: 'shipping',
      shipping_address: 'Jl. Pemuda No. 88, Rawamangun, Pulo Gadung',
      shipping_city: 'Jakarta Timur',
      shipping_postal_code: '13220',
      shipping_courier: null,
      tracking_number: null,
      catatan: 'Sudah transfer via BCA, bukti terlampir.',
      payment_proof_url: '/images/members/placeholder.svg',
      created_at: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
      items: [
        { prod: lightstick, size: 'Standard', qty: 1 },
        { prod: lanyard, size: 'All Size', qty: 1 }
      ]
    },
    {
      fan: getFan('Bayu Setiawan'),
      status: 'paid',
      delivery_method: 'shipping',
      shipping_address: 'Perumahan Grand Galaxy City Blok RG No. 12',
      shipping_city: 'Kota Bekasi',
      shipping_postal_code: '17147',
      shipping_courier: null,
      tracking_number: null,
      catatan: null,
      payment_proof_url: '/images/members/placeholder.svg',
      created_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
      items: [
        { prod: tshirt, size: 'L', qty: 1 },
        { prod: ganci, size: 'Akrilik', qty: 1 }
      ]
    },
    {
      fan: getFan('Kevin Sanjaya'),
      status: 'paid',
      delivery_method: 'shipping',
      shipping_address: 'Jl. LLRE Martadinata (Riau) No. 67, Cihapit',
      shipping_city: 'Kota Bandung',
      shipping_postal_code: '40114',
      shipping_courier: null,
      tracking_number: null,
      catatan: 'Tolong jangan sampai photocard-nya lecek ya.',
      payment_proof_url: '/images/members/placeholder.svg',
      created_at: new Date(Date.now() - 19 * 3600 * 1000).toISOString(),
      items: [
        { prod: photocard, size: '5 Cards', qty: 2 },
        { prod: standee, size: 'Standard', qty: 1 }
      ]
    },

    // ── STATUS: PACKING (3 orders) ──
    {
      fan: getFan('Farhan Alamsyah'),
      status: 'packing',
      delivery_method: 'shipping',
      shipping_address: 'Jl. Kaliurang KM 5.5 Gg. Pandega Marta No. 19',
      shipping_city: 'Kab. Sleman, D.I. Yogyakarta',
      shipping_postal_code: '55281',
      shipping_courier: 'JNE Reguler',
      tracking_number: null,
      catatan: 'Sedang disiapkan staf gudang Kohi Sekai.',
      payment_proof_url: '/images/members/placeholder.svg',
      created_at: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
      items: [
        { prod: jersey, size: 'XL', qty: 1 },
        { prod: lightstick, size: 'Standard', qty: 1 }
      ]
    },
    {
      fan: getFan('Gilang Permana'),
      status: 'packing',
      delivery_method: 'pickup_event',
      shipping_address: null,
      shipping_city: null,
      shipping_postal_code: null,
      shipping_courier: null,
      tracking_number: null,
      catatan: 'Barang sudah disiapkan di paperbag untuk booth venue.',
      payment_proof_url: '/images/members/placeholder.svg',
      created_at: new Date(Date.now() - 32 * 3600 * 1000).toISOString(),
      items: [
        { prod: totebag, size: 'Standard', qty: 1 },
        { prod: lanyard, size: 'All Size', qty: 1 }
      ]
    },
    {
      fan: getFan('Dwi Putra'),
      status: 'packing',
      delivery_method: 'shipping',
      shipping_address: 'Jl. Mayjen Sungkono No. 102, Gunungsari',
      shipping_city: 'Kota Surabaya',
      shipping_postal_code: '60224',
      shipping_courier: 'J&T Express',
      tracking_number: null,
      catatan: null,
      payment_proof_url: '/images/members/placeholder.svg',
      created_at: new Date(Date.now() - 38 * 3600 * 1000).toISOString(),
      items: [
        { prod: tshirt, size: 'M', qty: 1 },
        { prod: photocard, size: '5 Cards', qty: 1 }
      ]
    },

    // ── STATUS: SHIPPED (4 orders with real courier & tracking) ──
    {
      fan: getFan('Ilham Wahyudi'),
      status: 'shipped',
      delivery_method: 'shipping',
      shipping_address: 'Jl. Diponegoro No. 42, Lempongsari, Gajahmungkur',
      shipping_city: 'Kota Semarang',
      shipping_postal_code: '50231',
      shipping_courier: 'JNE Reguler',
      tracking_number: 'JNE9023481239ID',
      catatan: 'Paket telah di-drop ke kurir JNE.',
      payment_proof_url: '/images/members/placeholder.svg',
      created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      shipped_at: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
      items: [
        { prod: jersey, size: 'L', qty: 1 }
      ]
    },
    {
      fan: getFan('Reza Maulana'),
      status: 'shipped',
      delivery_method: 'shipping',
      shipping_address: 'Jl. Veteran No. 18, Penanggungan, Klojen',
      shipping_city: 'Kota Malang',
      shipping_postal_code: '65145',
      shipping_courier: 'J&T Express',
      tracking_number: 'JT88392019482',
      catatan: null,
      payment_proof_url: '/images/members/placeholder.svg',
      created_at: new Date(Date.now() - 56 * 3600 * 1000).toISOString(),
      shipped_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      items: [
        { prod: lightstick, size: 'Standard', qty: 1 },
        { prod: totebag, size: 'Standard', qty: 1 }
      ]
    },
    {
      fan: getFan('Andre Kurniawan'),
      status: 'shipped',
      delivery_method: 'shipping',
      shipping_address: 'Jl. Gajah Mada No. 90, Benua Melayu Darat',
      shipping_city: 'Kota Pontianak',
      shipping_postal_code: '78121',
      shipping_courier: 'SiCepat REG',
      tracking_number: '004291847120',
      catatan: 'Estimasi tiba 2-3 hari kerja.',
      payment_proof_url: '/images/members/placeholder.svg',
      created_at: new Date(Date.now() - 65 * 3600 * 1000).toISOString(),
      shipped_at: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
      items: [
        { prod: tshirt, size: 'S', qty: 1 },
        { prod: ganci, size: 'Akrilik', qty: 2 }
      ]
    },
    {
      fan: getFan('Yoga Prasetya'),
      status: 'shipped',
      delivery_method: 'shipping',
      shipping_address: 'Jl. Jendral Sudirman No. 210, Tengkerang Selatan',
      shipping_city: 'Kota Pekanbaru',
      shipping_postal_code: '28282',
      shipping_courier: 'JNE YES',
      tracking_number: 'JNE9182374610ID',
      catatan: 'Paket YES Prioritas.',
      payment_proof_url: '/images/members/placeholder.svg',
      created_at: new Date(Date.now() - 74 * 3600 * 1000).toISOString(),
      shipped_at: new Date(Date.now() - 32 * 3600 * 1000).toISOString(),
      items: [
        { prod: standee, size: 'Standard', qty: 2 },
        { prod: photocard, size: '5 Cards', qty: 1 }
      ]
    },

    // ── STATUS: COMPLETED (3 orders) ──
    {
      fan: getFan('Kiki'),
      status: 'completed',
      delivery_method: 'pickup_event',
      shipping_address: null,
      shipping_city: null,
      shipping_postal_code: null,
      shipping_courier: null,
      tracking_number: null,
      catatan: 'Sudah diambil dan dicek langsung di booth event.',
      payment_proof_url: '/images/members/placeholder.svg',
      confirmed_by: 'customer',
      confirmed_at: new Date(Date.now() - 85 * 3600 * 1000).toISOString(),
      created_at: new Date(Date.now() - 100 * 3600 * 1000).toISOString(),
      items: [
        { prod: jersey, size: 'M', qty: 1 },
        { prod: lanyard, size: 'All Size', qty: 1 },
        { prod: ganci, size: 'Akrilik', qty: 1 }
      ]
    },
    {
      fan: getFan('Siti Rahma'),
      status: 'completed',
      delivery_method: 'shipping',
      shipping_address: 'Jl. Margonda Raya No. 412, Pondok Cina, Beji',
      shipping_city: 'Kota Depok',
      shipping_postal_code: '16424',
      shipping_courier: 'SiCepat REG',
      tracking_number: '003948192031',
      catatan: 'Barang sudah diterima dengan aman.',
      payment_proof_url: '/images/members/placeholder.svg',
      confirmed_by: 'customer',
      confirmed_at: new Date(Date.now() - 60 * 3600 * 1000).toISOString(),
      created_at: new Date(Date.now() - 120 * 3600 * 1000).toISOString(),
      shipped_at: new Date(Date.now() - 90 * 3600 * 1000).toISOString(),
      items: [
        { prod: totebag, size: 'Standard', qty: 1 },
        { prod: lightstick, size: 'Standard', qty: 1 }
      ]
    },
    {
      fan: getFan('Budi Santoso'),
      status: 'completed',
      delivery_method: 'pickup_event',
      shipping_address: null,
      shipping_city: null,
      shipping_postal_code: null,
      shipping_courier: null,
      tracking_number: null,
      catatan: 'Dikonfirmasi selesai oleh admin di venue.',
      payment_proof_url: '/images/members/placeholder.svg',
      confirmed_by: 'admin',
      confirmed_at: new Date(Date.now() - 40 * 3600 * 1000).toISOString(),
      created_at: new Date(Date.now() - 140 * 3600 * 1000).toISOString(),
      items: [
        { prod: tshirt, size: 'L', qty: 1 }
      ]
    }
  ]

  let orderIndex = 1
  for (const ord of ordersSeed) {
    const { fan, items, ...orderFields } = ord
    const dateNum = new Date(orderFields.created_at).toISOString().slice(0, 10).replace(/-/g, '')
    const orderNumber = `KS-MCH${dateNum}${String(orderIndex).padStart(3, '0')}`
    orderIndex++

    const total_harga = items.reduce((sum, itm) => sum + (itm.prod.harga * itm.qty), 0)

    const orderPayload = {
      order_number: orderNumber,
      user_id: fan.id,
      nama_lengkap: fan.nama,
      whatsapp: fan.whatsapp || '081289123000',
      email: fan.email,
      instagram: fan.instagram || null,
      total_harga,
      ...orderFields
    }

    const { data: insertedOrder, error: insErr } = await supabase
      .from('merch_orders')
      .insert(orderPayload)
      .select()
      .single()

    if (insErr) {
      console.error(`Error inserting order ${orderNumber}:`, insErr.message)
      continue
    }

    const itemsPayload = items.map(itm => ({
      merch_order_id: insertedOrder.id,
      merchandise_id: itm.prod.id,
      item_name: itm.prod.nama,
      harga: itm.prod.harga,
      quantity: itm.qty,
      size: itm.size
    }))

    const { error: itemErr } = await supabase.from('merch_order_items').insert(itemsPayload)
    if (itemErr) {
      console.error(`Error inserting items for ${orderNumber}:`, itemErr.message)
    } else {
      console.log(`✓ [${insertedOrder.status.toUpperCase()}] ${orderNumber} - ${fan.nama} (Rp ${total_harga.toLocaleString('id-ID')})`)
    }
  }

  console.log('=== SEEDING COMPREHENSIVE MERCH ORDERS FINISHED ===')
}

seedCompleteMerchOrders()

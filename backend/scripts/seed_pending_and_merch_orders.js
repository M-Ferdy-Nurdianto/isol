import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const defaultLocalUrl = 'http://127.0.0.1:54321'
const defaultLocalServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const envUrl = process.env.SUPABASE_URL
const envKey = process.env.SUPABASE_SERVICE_KEY

const supabaseUrl = (envUrl && !envUrl.includes('placeholder')) ? envUrl : defaultLocalUrl
const supabaseServiceKey = (envKey && !envKey.includes('your_supabase') && !envKey.includes('placeholder')) ? envKey : defaultLocalServiceKey

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedPendingAndMerchOrders() {
  console.log('=== SEEDING PENDING CHEKI ORDERS & MERCH ORDERS ===')

  // 1. Get Events
  const { data: events, error: evErr } = await supabase.from('events').select('*')
  if (evErr || !events?.length) {
    console.error('Events error:', evErr)
    return
  }
  const festivalEvent = events.find(e => e.nama.includes('Sunday Festival')) || events[0]
  const acousticEvent = events.find(e => e.nama.includes('Acoustic')) || events[1] || events[0]

  // 2. Get Members
  const { data: members, error: memErr } = await supabase.from('members').select('*').neq('member_id', 'group')
  if (memErr || !members?.length) {
    console.error('Members error:', memErr)
    return
  }

  // 3. Get Fans
  const { data: fans, error: fanErr } = await supabase.from('users').select('*').eq('role', 'fan')
  const fanNei = fans?.find(f => f.nama === 'nei') || fans?.[0]
  const fanBudi = fans?.find(f => f.nama.includes('Budi')) || fans?.[1] || fans?.[0]
  const fanAditya = fans?.find(f => f.nama.includes('Aditya')) || fans?.[2] || fans?.[0]

  // 4. Insert 3 Pending Cheki Orders
  const pendingOrdersData = [
    {
      order_number: `KS${Date.now()}101`,
      event_id: festivalEvent.id,
      user_id: fanBudi?.id || null,
      nama_lengkap: fanBudi?.nama || 'Budi Santoso',
      whatsapp: fanBudi?.whatsapp || '081289123001',
      email: fanBudi?.email || 'budi.santoso@gmail.com',
      instagram: fanBudi?.instagram || '@budisantoso_',
      total_harga: 80000,
      status: 'pending',
      is_ots: false,
      created_by: 'customer',
      catatan: 'Tolong foto pose senyum manis yaa min~',
      payment_proof_url: 'https://placehold.co/600x800/241E19/E8944A?text=Bukti+Transfer+Budi',
      items: [
        {
          member_id: members[0].id,
          cheki_type: 'regular',
          item_name: `2-Shot Cheki ${members[0].nama_panggung} (Regular)`,
          price: 40000,
          quantity: 2
        }
      ]
    },
    {
      order_number: `KS${Date.now()}102`,
      event_id: festivalEvent.id,
      user_id: fanNei?.id || null,
      nama_lengkap: fanNei?.nama || 'nei',
      whatsapp: fanNei?.whatsapp || '081289123003',
      email: fanNei?.email || 'miyojem461@digeros.com',
      instagram: fanNei?.instagram || '@nei_sekai',
      total_harga: 110000,
      status: 'pending',
      is_ots: false,
      created_by: 'customer',
      catatan: 'Pre-order sesi 2',
      payment_proof_url: 'https://placehold.co/600x800/241E19/E8944A?text=Bukti+Transfer+nei',
      items: [
        {
          member_id: members[1 % members.length].id,
          cheki_type: 'regular',
          item_name: `2-Shot Cheki ${members[1 % members.length].nama_panggung} (Regular)`,
          price: 40000,
          quantity: 1
        },
        {
          member_id: members[2 % members.length].id,
          cheki_type: 'wide',
          item_name: `2-Shot Cheki ${members[2 % members.length].nama_panggung} (Wide 16:9)`,
          price: 70000,
          quantity: 1
        }
      ]
    },
    {
      order_number: `KS-OTS${Date.now()}103`,
      event_id: festivalEvent.id,
      user_id: fanAditya?.id || null,
      nama_lengkap: fanAditya?.nama || 'Aditya Pratama',
      whatsapp: fanAditya?.whatsapp || '081289123002',
      email: fanAditya?.email || 'aditya.pratama@gmail.com',
      instagram: fanAditya?.instagram || '@adityaptm',
      total_harga: 40000,
      status: 'pending',
      is_ots: true,
      created_by: 'customer',
      catatan: 'Order OTS di venue',
      payment_proof_url: 'QRIS',
      items: [
        {
          member_id: members[0].id,
          cheki_type: 'regular',
          item_name: `OTS Cheki ${members[0].nama_panggung}`,
          price: 40000,
          quantity: 1
        }
      ]
    }
  ]

  for (const po of pendingOrdersData) {
    const { items, ...orderData } = po
    const { data: insertedOrder, error: insErr } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single()

    if (insErr) {
      console.error('Error inserting pending order:', insErr.message)
      continue
    }

    const orderItems = items.map(itm => ({
      ...itm,
      order_id: insertedOrder.id
    }))

    const { error: itmErr } = await supabase.from('order_items').insert(orderItems)
    if (itmErr) {
      console.error('Error inserting order items:', itmErr.message)
    } else {
      console.log(`✓ Inserted pending order: ${insertedOrder.order_number} (${insertedOrder.nama_lengkap})`)
    }
  }

  // 5. Get Merchandise
  const { data: merchList, error: merchErr } = await supabase.from('merchandise').select('*')
  if (merchErr || !merchList?.length) {
    console.warn('No merchandise found:', merchErr)
    return
  }

  // 6. Insert Merch Orders
  const sampleMerchOrders = [
    {
      order_number: `MERCH${Date.now()}201`,
      user_id: fanNei?.id || null,
      nama_lengkap: fanNei?.nama || 'nei',
      whatsapp: '081289123003',
      email: fanNei?.email || 'miyojem461@digeros.com',
      instagram: '@nei_sekai',
      total_harga: 255000,
      status: 'pending',
      delivery_method: 'shipping',
      shipping_address: 'Jl. Melati No. 12, RT 03/05, Kebayoran Baru',
      shipping_city: 'Jakarta Selatan',
      shipping_postal_code: '12140',
      payment_proof_url: 'https://placehold.co/600x800/241E19/E8944A?text=Bukti+Merch+Nei',
      catatan: 'Packing rapi ya min biar gak lecek jerseynya.',
      items: [
        {
          merchandise_id: merchList[0].id,
          item_name: merchList[0].nama,
          harga: merchList[0].harga,
          quantity: 1,
          size: 'L'
        },
        {
          merchandise_id: merchList[2 % merchList.length].id,
          item_name: merchList[2 % merchList.length].nama,
          harga: merchList[2 % merchList.length].harga,
          quantity: 1,
          size: 'All Size'
        }
      ]
    },
    {
      order_number: `MERCH${Date.now()}202`,
      user_id: fanBudi?.id || null,
      nama_lengkap: fanBudi?.nama || 'Budi Santoso',
      whatsapp: '081289123001',
      email: fanBudi?.email || 'budi.santoso@gmail.com',
      instagram: '@budisantoso_',
      total_harga: 175000,
      status: 'packing',
      delivery_method: 'pickup_event',
      shipping_address: null,
      shipping_city: null,
      shipping_postal_code: null,
      payment_proof_url: 'https://placehold.co/600x800/241E19/E8944A?text=Bukti+Merch+Budi',
      catatan: 'Ambil di booth merch event Minggu',
      items: [
        {
          merchandise_id: merchList[1 % merchList.length].id,
          item_name: merchList[1 % merchList.length].nama,
          harga: merchList[1 % merchList.length].harga,
          quantity: 1,
          size: 'XL'
        }
      ]
    },
    {
      order_number: `MERCH${Date.now()}203`,
      user_id: fanAditya?.id || null,
      nama_lengkap: fanAditya?.nama || 'Aditya Pratama',
      whatsapp: '081289123002',
      email: fanAditya?.email || 'aditya.pratama@gmail.com',
      instagram: '@adityaptm',
      total_harga: 85000,
      status: 'shipped',
      delivery_method: 'shipping',
      shipping_address: 'Apartemen Sudirman Tower A Lt. 15',
      shipping_city: 'Jakarta Pusat',
      shipping_postal_code: '10220',
      shipping_courier: 'JNE Reguler',
      tracking_number: 'JNE9876543210ID',
      payment_proof_url: 'https://placehold.co/600x800/241E19/E8944A?text=Bukti+Merch+Aditya',
      catatan: null,
      items: [
        {
          merchandise_id: merchList[4 % merchList.length].id,
          item_name: merchList[4 % merchList.length].nama,
          harga: merchList[4 % merchList.length].harga,
          quantity: 1,
          size: 'Standard'
        }
      ]
    }
  ]

  for (const mo of sampleMerchOrders) {
    const { items, ...orderData } = mo
    const { data: insertedMerchOrder, error: insErr } = await supabase
      .from('merch_orders')
      .insert(orderData)
      .select()
      .single()

    if (insErr) {
      console.error('Error inserting merch order:', insErr.message)
      continue
    }

    const orderItems = items.map(itm => ({
      ...itm,
      merch_order_id: insertedMerchOrder.id
    }))

    const { error: itmErr } = await supabase.from('merch_order_items').insert(orderItems)
    if (itmErr) {
      console.error('Error inserting merch order items:', itmErr.message)
    } else {
      console.log(`✓ Inserted merch order: ${insertedMerchOrder.order_number} (${insertedMerchOrder.status})`)
    }
  }

  console.log('=== DONE SEEDING PENDING & MERCH ORDERS ===')
}

seedPendingAndMerchOrders()

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const defaultLocalUrl = 'http://127.0.0.1:54321'
const defaultLocalServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const envUrl = process.env.SUPABASE_URL
const envKey = process.env.SUPABASE_SERVICE_KEY

const supabaseUrl = (envUrl && !envUrl.includes('placeholder')) ? envUrl : defaultLocalUrl
const supabaseServiceKey = (envKey && !envKey.includes('your_supabase') && !envKey.includes('placeholder')) ? envKey : defaultLocalServiceKey

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const FANS_DATA = [
  { nama: 'Budi Santoso', email: 'budi.santoso@gmail.com', whatsapp: '081289123001', instagram: '@budisantoso_', targetTotal: 24, favMember: 'latte' },
  { nama: 'Aditya Pratama', email: 'aditya.pratama@gmail.com', whatsapp: '081289123002', instagram: '@adityaptm', targetTotal: 19, favMember: 'macchiato' },
  { nama: 'nei', email: 'miyojem461@digeros.com', whatsapp: '081289123003', instagram: '@nei_sekai', targetTotal: 16, favMember: 'affogato' },
  { nama: 'Dimas Nugraha', email: 'dimas.nugraha@gmail.com', whatsapp: '081289123004', instagram: '@dimas_nugraha', targetTotal: 14, favMember: 'latte' },
  { nama: 'Rizky Firmansyah', email: 'rizky.firman@gmail.com', whatsapp: '081289123005', instagram: '@rizkyf_', targetTotal: 11, favMember: 'macchiato' },
  { nama: 'Fajar Ramadhan', email: 'fajar.rmd@gmail.com', whatsapp: '081289123006', instagram: '@fajar_rmdhn', targetTotal: 9, favMember: 'affogato' },
  { nama: 'Bayu Setiawan', email: 'bayu.setiawan@gmail.com', whatsapp: '081289123007', instagram: '@bayusetia', targetTotal: 8, favMember: 'latte' },
  { nama: 'Kevin Sanjaya', email: 'kevin.sanjaya@gmail.com', whatsapp: '081289123008', instagram: '@kevin_sanjaya', targetTotal: 7, favMember: 'macchiato' },
  { nama: 'Farhan Alamsyah', email: 'farhan.alam@gmail.com', whatsapp: '081289123009', instagram: '@farhan_alam', targetTotal: 6, favMember: 'affogato' },
  { nama: 'Gilang Permana', email: 'gilang.permana@gmail.com', whatsapp: '081289123010', instagram: '@gilang_p', targetTotal: 5, favMember: 'latte' },
  { nama: 'Dwi Putra', email: 'dwi.putra@gmail.com', whatsapp: '081289123011', instagram: '@dwiputra_id', targetTotal: 4, favMember: 'macchiato' },
  { nama: 'Ilham Wahyudi', email: 'ilham.wahyudi@gmail.com', whatsapp: '081289123012', instagram: '@ilhamwahyudi', targetTotal: 3, favMember: 'affogato' },
  { nama: 'Reza Maulana', email: 'reza.maulana@gmail.com', whatsapp: '081289123013', instagram: '@rezamaulana_', targetTotal: 3, favMember: 'latte' },
  { nama: 'Andre Kurniawan', email: 'andre.kurnia@gmail.com', whatsapp: '081289123014', instagram: '@andre_krn', targetTotal: 2, favMember: 'macchiato' },
  { nama: 'Yoga Prasetya', email: 'yoga.prasetya@gmail.com', whatsapp: '081289123015', instagram: '@yogaprasetya', targetTotal: 2, favMember: 'affogato' },
]

async function seedLeaderboard() {
  console.log('=== SEEDING 15 FAN ACCOUNTS & LEADERBOARD ORDERS ===')

  // 1. Fetch Events
  const { data: events, error: evErr } = await supabase.from('events').select('*')
  if (evErr || !events?.length) {
    console.error('Failed to get events:', evErr)
    return
  }
  const mainEvent = events[0]
  console.log(`Target Event: ${mainEvent.nama} (${mainEvent.id})`)

  // 2. Fetch Members (exclude group)
  const { data: members, error: memErr } = await supabase
    .from('members')
    .select('*')
    .neq('member_id', 'group')
  if (memErr || !members?.length) {
    console.error('Failed to get members:', memErr)
    return
  }
  console.log(`Found ${members.length} members:`, members.map(m => m.nama_panggung))

  const memberBySlug = {}
  members.forEach(m => {
    memberBySlug[m.member_id] = m
  })

  // 3. Ensure all fan accounts exist in `users` table & `supabase.auth`
  const { data: existingUsers } = await supabase.from('users').select('*')
  const userMap = new Map()
  existingUsers?.forEach(u => userMap.set(u.email.toLowerCase(), u))

  let nextFanId = 4
  existingUsers?.forEach(u => {
    if (u.fan_id && u.fan_id >= nextFanId) nextFanId = u.fan_id + 1
  })

  const syncedUsers = []

  for (const fan of FANS_DATA) {
    let userRecord = userMap.get(fan.email.toLowerCase())
    if (!userRecord) {
      console.log(`Creating user record: ${fan.nama} (${fan.email})`)
      // Try to create auth account first
      let authId = null
      try {
        const { data: authRes } = await supabase.auth.admin.createUser({
          email: fan.email,
          password: 'KohiSekai2026!',
          email_confirm: true,
          user_metadata: { nama: fan.nama, whatsapp: fan.whatsapp }
        })
        authId = authRes?.user?.id
      } catch (authErr) {
        console.warn('Auth create note:', authErr.message)
      }

      const insertPayload = {
        id: authId || crypto.randomUUID(),
        fan_id: nextFanId++,
        nama: fan.nama,
        email: fan.email,
        whatsapp: fan.whatsapp,
        instagram: fan.instagram,
        role: 'fan'
      }

      const { data: newUser, error: insErr } = await supabase
        .from('users')
        .insert(insertPayload)
        .select()
        .single()

      if (insErr) {
        console.error(`Error inserting user ${fan.nama}:`, insErr.message)
        continue
      }
      userRecord = newUser
    } else {
      console.log(`Existing user found: ${userRecord.nama} (${userRecord.email})`)
    }

    syncedUsers.push({ ...fan, userRecord })
  }

  console.log(`Total synchronized fan accounts: ${syncedUsers.length}`)

  // 4. Create orders and order_items for each fan
  const orderStatuses = ['approved', 'completed', 'paid', 'checked']
  let totalOrdersCreated = 0
  let totalChekiCreated = 0

  for (const fan of syncedUsers) {
    const { userRecord, targetTotal, favMember } = fan
    const primaryMember = memberBySlug[favMember] || members[0]
    const otherMembers = members.filter(m => m.id !== primaryMember.id)

    let remainingCheki = targetTotal

    // Distribute remainingCheki into multiple orders (2-5 orders per fan)
    while (remainingCheki > 0) {
      const orderQty = Math.min(remainingCheki, Math.floor(Math.random() * 3) + 1) // 1 to 3 cheki per order
      remainingCheki -= orderQty

      // 80% chance primary member, 20% other member
      const chosenMember = (Math.random() < 0.8 || otherMembers.length === 0)
        ? primaryMember
        : otherMembers[Math.floor(Math.random() * otherMembers.length)]

      const isWide = Math.random() < 0.25
      const price = isWide ? 70000 : 40000
      const jenisSesi = isWide ? 'Wide 2-Shot Cheki 16:9' : 'Regular 2-Shot Cheki'
      const totalHarga = price * orderQty
      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)]
      const isOts = Math.random() < 0.35

      // Timestamps: random within the last 1 to 5 days
      const daysAgo = Math.random() * 4.5 + 0.2 // 0.2 to 4.7 days ago
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()

      const orderNumber = `KS${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 900 + 100)}`

      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: userRecord.id,
          event_id: mainEvent.id,
          member_id: chosenMember.id,
          jenis_sesi: jenisSesi,
          quantity: orderQty,
          price: price,
          nama_lengkap: userRecord.nama,
          whatsapp: userRecord.whatsapp || '08123456789',
          email: userRecord.email,
          instagram: userRecord.instagram,
          total_harga: totalHarga,
          status: status,
          is_ots: isOts,
          created_by: 'customer',
          catatan: 'Cheki order',
          created_at: createdAt,
          updated_at: createdAt
        })
        .select()
        .single()

      if (orderErr) {
        console.error(`Order insert error for ${userRecord.nama}:`, orderErr.message)
        continue
      }

      const { error: itemErr } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          member_id: chosenMember.id,
          item_name: `${jenisSesi} - ${chosenMember.nama_panggung}`,
          price: price,
          quantity: orderQty,
          created_at: createdAt
        })

      if (itemErr) {
        console.error(`Item insert error for order ${order.id}:`, itemErr.message)
      } else {
        totalOrdersCreated++
        totalChekiCreated += orderQty
      }
    }
  }

  console.log(`\n=== SEED COMPLETED ===`)
  console.log(`Created ${totalOrdersCreated} orders with total ${totalChekiCreated} cheki items!`)
}

seedLeaderboard()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error in seed:', err)
    process.exit(1)
  })


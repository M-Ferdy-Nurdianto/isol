import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const defaultLocalUrl = 'http://127.0.0.1:54321'
const defaultLocalServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const envUrl = process.env.SUPABASE_URL
const envKey = process.env.SUPABASE_SERVICE_KEY

const supabaseUrl = (envUrl && !envUrl.includes('placeholder')) ? envUrl : defaultLocalUrl
const supabaseServiceKey = (envKey && !envKey.includes('your_supabase') && !envKey.includes('placeholder')) ? envKey : defaultLocalServiceKey

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seed() {
  console.log('--- SEEDING & UPDATING DUMMY ORDERS FOR LEADERBOARD ---')

  // 1. Fetch events
  const { data: events, error: eventsErr } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })

  if (eventsErr) {
    console.error('Error fetching events:', eventsErr)
    return
  }

  const targetEvent = events.find(e => !e.is_group_enabled) || events[0]
  if (!targetEvent) {
    console.error('No events found!')
    return
  }

  // 2. Update all existing pending orders for dummy users to 'approved'
  const { error: updateErr } = await supabase
    .from('orders')
    .update({ status: 'approved' })
    .eq('status', 'pending')

  if (updateErr) {
    console.warn('Update pending status warn:', updateErr.message)
  }

  // 3. Fetch members
  const { data: members } = await supabase
    .from('members')
    .select('*')
    .neq('member_id', 'group')
    .neq('member_id', 'kohisekai')
    .eq('is_secret', false)

  // 4. Fetch users
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .like('email', 'kiki.fan%@kohisekai.com')

  if (!users || users.length === 0) {
    console.error('No dummy users found!')
    return
  }

  // Insert 10 additional high point orders with 'approved' and 'completed' status
  const statuses = ['approved', 'completed', 'approved']
  const chekiOptions = [
    { name: '2-Shot Cheki (Polaroid)', price: 35000 },
    { name: '2-Shot Cheki + Special Digital', price: 50000 },
    { name: 'VIP 2-Shot Cheki Bundle', price: 100000 }
  ]

  let added = 0
  for (let i = 0; i < 15; i++) {
    const randomUser = users[i % users.length]
    const randomMember = members[i % members.length]
    const randomOption = chekiOptions[i % chekiOptions.length]
    const qty = Math.floor(Math.random() * 4) + 1 // 1 - 4
    const totalHarga = randomOption.price * qty
    const randomStatus = statuses[i % statuses.length]
    const orderNumber = `KS${Date.now()}${Math.floor(Math.random() * 1000)}`

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        event_id: targetEvent.id,
        user_id: randomUser.id,
        member_id: randomMember.id,
        jenis_sesi: randomOption.name,
        quantity: qty,
        price: randomOption.price,
        nama_lengkap: randomUser.nama,
        whatsapp: randomUser.whatsapp,
        email: randomUser.email,
        instagram: randomUser.instagram,
        total_harga: totalHarga,
        status: randomStatus,
        is_ots: i % 3 === 0,
        created_by: 'customer',
        catatan: 'Cheki request!'
      })
      .select()
      .single()

    if (orderErr) {
      console.error('Insert order error:', orderErr.message)
      continue
    }

    await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        member_id: randomMember.id,
        item_name: `${randomOption.name} - ${randomMember.nama_panggung}`,
        price: randomOption.price,
        quantity: qty
      })

    added++
  }

  console.log(`Successfully updated and added ${added} approved/completed orders!`)
}

seed().then(() => process.exit(0)).catch(err => {
  console.error('Seed script error:', err)
  process.exit(1)
})

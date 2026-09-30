import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '../.env' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
)

async function run() {
  console.log('Updating config table for FAQ items...')

  const faqs = [
    {
      q: "Bagaimana cara membuat akun Kohi Sekai ID?",
      a: "Klik tombol \"Daftar Akun Baru\" di halaman Login, isi nama, email, WhatsApp, buat password, lalu verifikasi keamanan. Akun langsung aktif tanpa konfirmasi manual."
    },
    {
      q: "Bagaimana cara membeli tiket 2-Shot Cheki?",
      a: "Buka halaman Shop, pilih tanggal event di kalender, lalu klik member & jenis cheki yang diinginkan. Kamu akan langsung diarahkan ke halaman Checkout tanpa perlu masukin keranjang."
    },
    {
      q: "Bagaimana cara mengetahui jadwal event Kohi Sekai terbaru?",
      a: "Cek halaman Shop untuk kalender event resmi, atau pantau Instagram & TikTok kami untuk update tercepat."
    }
  ]

  const { error } = await supabase.from('config').upsert({
    key: 'faq_items',
    value: JSON.stringify(faqs)
  })

  if (error) {
    console.error('Error updating faq_items:', error)
  } else {
    console.log('FAQ items successfully seeded to config table!')
  }
}

run()

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '../.env' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
)

async function run() {
  console.log('Checking or creating news table...')
  
  // Note: Since Supabase client doesn't support raw SQL create table without RPC, 
  // if execute_sql is not available we might get an error.
  const { error: rpcError } = await supabase.rpc('execute_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.news (
        id uuid default gen_random_uuid() primary key,
        title text not null,
        slug text,
        summary text,
        content text,
        image_url text,
        location text,
        event_date timestamp with time zone,
        status text default 'draft',
        created_at timestamp with time zone default now()
      );
    `
  })

  if (rpcError) {
    console.warn('RPC execute_sql failed. You might need to run the SQL in Supabase SQL Editor manually:', rpcError)
  }

  // Clear existing news to re-seed
  await supabase.from('news').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const seedData = [
    {
      title: 'Debut Kohi Sekai Secara Resmi!',
      slug: 'debut-kohi-sekai',
      summary: 'Grup Kawaii Metal idola baru, Kohi Sekai, resmi debut hari ini dengan single pertama mereka.',
      content: 'Kohi Sekai secara resmi mengumumkan debut mereka hari ini. Beranggotakan 3 member dengan keunikan rasa kopi yang berbeda, kami siap menyuguhkan penampilan Kawaii Metal terbaik untuk kalian semua. Jangan lewatkan live performance perdana kami!',
      image_url: 'https://images.unsplash.com/photo-1516280440502-6c17e65f32eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
      location: 'Jakarta',
      event_date: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
      status: 'published'
    },
    {
      title: 'Jadwal First Live Kohi Sekai',
      slug: 'first-live-schedule',
      summary: 'Catat tanggalnya! Live perdana Kohi Sekai akan diadakan bulan depan di Jakarta.',
      content: 'Kami sangat antusias mengumumkan bahwa First Live Kohi Sekai akan segera digelar. Siapkan lightstick kalian dan mari bersenang-senang bersama. Tiket akan mulai dijual minggu depan.',
      image_url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
      location: 'Livehouse Jakarta',
      event_date: new Date(Date.now() + 86400000 * 30).toISOString(),
      status: 'published'
    },
    {
      title: 'Perkenalan Member: Kiki',
      slug: 'perkenalan-member-kiki',
      summary: 'Kenali lebih dekat Kiki, salah satu pilar energi dari Kohi Sekai.',
      content: 'Kiki membawa nuansa hangat dan energik ke dalam grup. Dengan vokalnya yang khas dan tarian yang memukau, Kiki siap memberikan penampilan tak terlupakan di setiap panggung Kohi Sekai.',
      image_url: 'https://images.unsplash.com/photo-1493225457224-eda0e6dcb6e1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
      location: null,
      event_date: new Date().toISOString(),
      status: 'published'
    },
    {
      title: 'Open Pre-Order Merchandise',
      slug: 'open-po-merch',
      summary: 'Pre-order untuk Official T-Shirt & Lightstick mulai dibuka.',
      content: 'Dukung Kohi Sekai dengan merchandise resmi kami! T-Shirt berdesain Kawaii Metal eksklusif dan lightstick resmi bisa dipesan mulai hari ini. Persediaan terbatas, jangan sampai kehabisan!',
      image_url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
      location: 'Online Shop',
      event_date: new Date(Date.now() + 86400000 * 2).toISOString(),
      status: 'published'
    }
  ]

  const { error: seedError } = await supabase.from('news').insert(seedData)
  
  if (seedError) {
    console.error('Error seeding news:', seedError)
  } else {
    console.log('Seeding news success!')
  }
}

run()

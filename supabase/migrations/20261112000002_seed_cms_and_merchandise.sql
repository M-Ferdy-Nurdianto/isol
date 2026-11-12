-- ==============================================================================
-- Migration: Seed Official Merchandise, News, and Complete Home CMS Config
-- ==============================================================================

-- 1. Seed Official Merchandise into public.merchandise (if not present)
INSERT INTO public.merchandise (id, nama, deskripsi, harga, stok, gambar_url, available, urutan, sizes, kategori)
VALUES
  (
    'a1000000-0000-0000-0000-000000000001',
    'Official Jersey Kohi Sekai 2026 - Metal Edition',
    'Jersey dry-fit eksklusif edisi 2026 dengan nomor punggung dan corak Kawaii Metal khas Kohi Sekai. Bahan adem, ringan, dan nyaman dipakai saat live show.',
    210000,
    30,
    '/images/members/placeholder.svg',
    true,
    1,
    '["S","M","L","XL","XXL","3XL"]'::jsonb,
    'baju'
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    'Kohi Sekai Official T-Shirt - Kawaii Metal Vol. 1',
    'Kaos katun combed 24s premium bertema Kawaii Metal dengan sablon plastisol halus tahan lama. Nyaman dipakai nonton live maupun daily outfit.',
    175000,
    25,
    '/images/members/placeholder.svg',
    true,
    2,
    '["S","M","L","XL","XXL"]'::jsonb,
    'baju'
  ),
  (
    'a1000000-0000-0000-0000-000000000003',
    'Official Member Lanyard & PVC Card Case',
    'Tali lanyard tebal 2cm dengan stopper kokoh, pengait metal, dan holder kartu transparan berlogo Kohi Sekai. Cocok untuk tiket dan ID card konser.',
    45000,
    50,
    '/images/members/placeholder.svg',
    true,
    3,
    '[]'::jsonb,
    'aksesoris'
  ),
  (
    'a1000000-0000-0000-0000-000000000004',
    'Gantungan Kunci Akrilik 2-Sisi (Ganci Idol)',
    'Gantungan kunci akrilik tebal 4mm dua sisi dengan klip gantungan bintang metal. Desain chibi imut dan logo resmi Kohi Sekai.',
    30000,
    75,
    '/images/members/placeholder.svg',
    true,
    4,
    '[]'::jsonb,
    'aksesoris'
  ),
  (
    'a1000000-0000-0000-0000-000000000005',
    'Official Canvas Totebag - Kawaii Metal Edition',
    'Totebag bahan canvas premium tebal dilengkapi resleting utama dan saku dalam. Muat lightstick, binder photocard, dan merchandise favoritmu.',
    85000,
    40,
    '/images/members/placeholder.svg',
    true,
    5,
    '[]'::jsonb,
    'aksesoris'
  ),
  (
    'a1000000-0000-0000-0000-000000000006',
    'Official Lightstick - Neon Glow Stick 15 Colors',
    'Lightstick resmi Kohi Sekai dengan 15 pilihan warna cerah dan tali lanyard eksklusif. Siap temani momen seru chant idol di setiap event!',
    150000,
    40,
    '/images/members/placeholder.svg',
    true,
    6,
    '[]'::jsonb,
    'aksesoris'
  ),
  (
    'a1000000-0000-0000-0000-000000000007',
    'Exclusive Photocard Pack Vol. 1 (5 Cards)',
    'Set photocard holographic eksklusif isi 5 kartu menampilkan seluruh member idol Kohi Sekai lengkap dengan printed signature khusus.',
    50000,
    60,
    '/images/members/placeholder.svg',
    true,
    7,
    '[]'::jsonb,
    'aksesoris'
  ),
  (
    'a1000000-0000-0000-0000-000000000008',
    'Kohi Sekai Idol Acrylic Standee',
    'Standee akrilik premium tebal 3mm tinggi 12cm dengan cetakan UV jernih dan base stand berlogo Kohi Sekai.',
    65000,
    35,
    '/images/members/placeholder.svg',
    true,
    8,
    '[]'::jsonb,
    'aksesoris'
  )
ON CONFLICT (id) DO NOTHING;

-- 2. Seed Official News into public.news
INSERT INTO public.news (id, title, slug, summary, content, image_url, location, date, is_published, order_index)
VALUES
  (
    'b1000000-0000-0000-0000-000000000001',
    'Kohi Sekai Resmi Merilis Official Merchandise Vol. 1',
    'kohi-sekai-official-merch-vol-1',
    'Koleksi Jersey Metal Edition, T-Shirt, Lightstick 15 warna, hingga Photocard Pack kini bisa dipesan online dengan pilihan ambil di event atau kirim ke rumah!',
    'Kabar gembira untuk seluruh pendukung Kohi Sekai! Mulai hari ini, Official Merchandise Vol. 1 sudah tersedia di halaman Shop. Kamu bisa memilih pengiriman via ekspedisi lengkap dengan nomor resi, atau ambil langsung di booth saat event berlangsung.',
    '/images/members/placeholder.svg',
    'Jakarta',
    '2026-11-10',
    true,
    1
  ),
  (
    'b1000000-0000-0000-0000-000000000002',
    'Jadwal Kohi Sunday Festival & Sesi 2-Shot Cheki November 2026',
    'jadwal-kohi-sunday-festival-november-2026',
    'Pre-order tiket 2-Shot Cheki dan Wide Cheki untuk penampilan spesial Kohi Sekai bulan November kini telah dibuka.',
    'Jangan lewatkan keseruan panggung Kohi Sekai di bulan November! Segera amankan slot 2-Shot Cheki dan Wide Cheki dengan member favoritmu melalui halaman Kalender Tiket sebelum kuota penuh.',
    '/images/members/placeholder.svg',
    'Jakarta & Bandung',
    '2026-11-05',
    true,
    2
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    'Single Perdana "First Brew" Kini Tersedia di Platform Musik',
    'single-perdana-first-brew-rilis',
    'Dengarkan energi Kawaii Metal dari single debut Kohi Sekai di Spotify, Apple Music, dan YouTube Music.',
    'Single perdana Kohi Sekai bertajuk First Brew memadukan melodi ceria khas idol Jepang dengan riff gitar yang bertenaga. Dengarkan langsung lewat halaman Music kami!',
    '/images/members/placeholder.svg',
    'Digital Release',
    '2026-10-20',
    true,
    3
  )
ON CONFLICT (slug) DO NOTHING;

-- 3. Complete Home CMS Config Keys (about_us, news_items, social_links, faq_cp)
INSERT INTO public.config (key, value)
VALUES
  (
    'about_us',
    jsonb_build_object(
      'title', 'Tentang Kohi Sekai',
      'subtitle', 'Kawaii Metal Idol Group dari Indonesia',
      'description', 'Kohi Sekai (コーヒーの世界) adalah grup idol bergaya Jepang yang memadukan kehangatan interaksi bersama penggemar dengan energi panggung Kawaii Metal yang penuh semangat.',
      'images', COALESCE(
        (SELECT (value::jsonb)->'images' FROM public.config WHERE key = 'about_us'),
        '["/images/members/placeholder.svg"]'::jsonb
      )
    )::text
  ),
  (
    'news_items',
    '[
      {
        "id": "news-merch-vol-1",
        "title": "Official Merchandise Vol. 1 Kini Tersedia!",
        "summary": "Pesan Jersey Metal Edition, T-Shirt, Lightstick, dan aksesoris resmi dengan opsi Ambil di Event atau Dikirim ke alamatmu.",
        "image_url": "/images/members/placeholder.svg",
        "ig_link": "https://instagram.com/kohisekai"
      },
      {
        "id": "news-nov-schedule",
        "title": "Jadwal Live & Sesi 2-Shot Cheki November 2026",
        "summary": "Pre-order tiket 2-Shot Cheki dan Wide Cheki untuk event Kohi Sekai bulan November telah dibuka di halaman Shop.",
        "image_url": "/images/members/placeholder.svg",
        "ig_link": "https://instagram.com/kohisekai"
      },
      {
        "id": "news-first-brew",
        "title": "Single Debut First Brew Resmi Dirilis",
        "summary": "Nikmati perpaduan melodi manis dan distorsi Kawaii Metal khas Kohi Sekai di seluruh platform streaming musik.",
        "image_url": "/images/members/placeholder.svg",
        "ig_link": "https://instagram.com/kohisekai"
      }
    ]'
  ),
  (
    'social_links',
    '[
      {"platform": "instagram", "url": "https://instagram.com/kohisekai", "label": "@kohisekai"},
      {"platform": "tiktok", "url": "https://tiktok.com/@kohisekai", "label": "@kohisekai"},
      {"platform": "youtube", "url": "https://youtube.com/@kohisekai", "label": "Kohi Sekai Official"},
      {"platform": "x", "url": "https://x.com/kohisekai", "label": "@kohisekai"}
    ]'
  ),
  (
    'faq_cp',
    '{"name": "Admin Kohi Sekai", "phone": "6281234567890"}'
  )
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = CURRENT_TIMESTAMP;


import { supabase } from '../config/supabase.js'

async function injectNews() {
  console.log('Injecting 3 articles into database & config...')

  const articles = [
    {
      id: 'news-close-friend-2023',
      title: 'Kohi Sekai Rilis Single Baru Berjudul "Close Friend"',
      slug: 'kohi-sekai-rilis-single-baru-berjudul-close-friend',
      summary: 'Kohi Sekai mengusung tema persahabatan dan cinta sepihak yang mendalam lewat single terbaru "Close Friend".',
      content: `Idol group asal Yogyakarta, Kohi Sekai, resmi meluncurkan single terbaru mereka yang sangat diantisipasi berjudul "Close Friend". Lagu ini menggambarkan secara emosional dan mendalam kisah persahabatan, kekaguman diam-diam (secret admiration), serta rasa cinta sepihak (unrequited love) yang begitu relatable dengan problematika kehidupan remaja masa kini.

Lewat alunan nada yang catchy namun menyentuh hati, Kohi Sekai mengajak para pendengar untuk merasakan lika-liku hubungan yang tertahan di batas persahabatan. Lirik lagu ini membawa pesan manis sekaligus getir tentang bagaimana seseorang memilih untuk tetap bertahan di samping orang yang dicintainya, meski hanya sebatas teman dekat.

Salah satu kutipan lirik yang menjadi sorotan utama dan paling ikonik di lagu ini berbunyi:
"Oh, walau kita tak bisa bersamaaa pun, at least we are CLOSE FRIENDS".

Single "Close Friend" kini sudah dapat dinikmati di berbagai platform musik digital, dan video musik (MV) resminya menyajikan visual estetis bernuansa hangat yang semakin memperkuat atmosfer lagu.`,
      source_url: 'https://japanesemusicid.com/kohi-sekai-rilis-single-baru-berjudul-close-friend/',
      thumbnail_url: 'https://japanesemusicid.com/wp-content/uploads/2023/03/Kohi-Sekai-Close-Friend-scaled.jpg',
      image_url: 'https://japanesemusicid.com/wp-content/uploads/2023/03/Kohi-Sekai-Close-Friend-scaled.jpg',
      ig_link: 'https://japanesemusicid.com/kohi-sekai-rilis-single-baru-berjudul-close-friend/',
      location: 'Yogyakarta',
      date: '2023-03-15',
      published_at: new Date('2023-03-15T10:00:00Z').toISOString(),
      is_published: true,
      status: 'published',
      order_index: 1
    },
    {
      id: 'news-voks-radio-2024',
      title: 'Kohi Sekai: Mengintip Perjalanan dan Semangat Idol Lokal dari Yogyakarta',
      slug: 'kohi-sekai-mengintip-perjalanan-dan-semangat-idol-lokal-dari-yogyakarta',
      summary: 'Mengenal lebih dekat filosofi Kohi Sekai (Dunia Kopi) dan perjuangan gigih mereka di kancah idol lokal Yogyakarta.',
      content: `Di tengah pesatnya perkembangan budaya idol di Indonesia, nama Kohi Sekai tampil unik dan berkarakter kuat dari kota pelajar Yogyakarta. Kohi Sekai, yang secara harfiah berarti "Dunia Kopi" dalam bahasa Jepang, mengusung filosofi unik di mana setiap member merepresentasikan karakter dan aroma jenis minuman kopi yang berbeda.

Keunikan ini menciptakan identitas yang hangat namun berenergi tinggi. Dari panggung-panggung komunitas kecil, festival lokal, hingga acara berskala nasional, Kohi Sekai terus membuktikan dedikasi dan konsistensi mereka. Setiap penampilan dipenuhi semangat membara untuk menyebarkan keceriaan kepada siapapun yang menonton.

Dibalik kesuksesan tersebut, ada peran krusial dari para penggemar setia yang dijuluki "Barista". Ikatan emosional dan dukungan tanpa henti dari Barista menjadi bahan bakar utama Kohi Sekai untuk terus berkarya, berkembang, dan merangkul mimpi yang lebih besar di industri musik Indonesia.`,
      source_url: 'https://voksradiojogja.com/kohi-sekai-mengintip-perjalanan-dan-semangat-idol-lokal-dari-yogyakarta/',
      thumbnail_url: 'https://voksradiojogja.com/wp-content/uploads/2026/03/DSC00051-scaled.jpg',
      image_url: 'https://voksradiojogja.com/wp-content/uploads/2026/03/DSC00051-scaled.jpg',
      ig_link: 'https://voksradiojogja.com/kohi-sekai-mengintip-perjalanan-dan-semangat-idol-lokal-dari-yogyakarta/',
      location: 'Yogyakarta',
      date: '2024-03-10',
      published_at: new Date('2024-03-10T12:00:00Z').toISOString(),
      is_published: true,
      status: 'published',
      order_index: 2
    },
    {
      id: 'news-moving-on-2024',
      title: "Kolaborasi J-Band Crossxover dan Idol Kohi Sekai, Hasilkan Single 'Moving On'",
      slug: 'colab-j-band-crossxover-dan-idol-kohi-moving-on',
      summary: 'Perpaduan enerjik musik pop-punk/rock Crossxover dan keceriaan idol Kohi Sekai melahirkan karya kolaborasi "Moving On".',
      content: `Sebuah terobosan musik lintas genre yang segar lahir dari kolaborasi antara J-Band Crossxover dan grup idol Kohi Sekai lewat single terbaru berjudul "Moving On". Proyek ini menggabungkan alunan instrumen rock/pop-punk yang bertenaga dengan vokal idol yang khas dan penuh semangat.

Leader dari Kohi Sekai, Dea, mengungkapkan antusiasme besarnya terhadap proyek eksperimental ini. Dea menyampaikan bahwa menggabungkan dunia idol yang ceria dengan distorsi musik pop-punk/rock memberikan warna baru yang belum pernah mereka eksplorasi sebelumnya, menghasilkan sebuah lagu yang sangat optimis dan memberikan dorongan semangat untuk terus melangkah maju.

"Moving On" menjadi bukti bahwa batasan antar genre musik dapat ditembus dengan keharmonisan karya. Lagu ini menyampaikan pesan positif untuk bangkit dari masa lalu dan menyongsong masa depan dengan penuh keyakinan.`,
      source_url: 'https://www.bedaunik.com/2024/04/colab-j-band-crossxover-dan-idol-kohi.html',
      thumbnail_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1600&q=80',
      image_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1600&q=80',
      ig_link: 'https://www.bedaunik.com/2024/04/colab-j-band-crossxover-dan-idol-kohi.html',
      location: 'Yogyakarta',
      date: '2024-04-20',
      published_at: new Date('2024-04-20T14:00:00Z').toISOString(),
      is_published: true,
      status: 'published',
      order_index: 3
    }
  ]

  // 1. Try to create public.news table if possible using raw RPC or postgres REST if available
  try {
    const { error: rpcErr } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.news (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          summary TEXT,
          content TEXT,
          image_url TEXT,
          thumbnail_url TEXT,
          source_url TEXT,
          location TEXT,
          date DATE,
          published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          is_published BOOLEAN DEFAULT true,
          status TEXT DEFAULT 'published',
          order_index INT DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    })
    if (rpcErr) {
      console.log('RPC table creation notice:', rpcErr.message)
    }
  } catch (e) {
    console.log('RPC execution catch:', e.message)
  }

  // 2. Insert/Update into `news` table in case it exists or is created
  for (const article of articles) {
    try {
      const { data: existing } = await supabase
        .from('news')
        .select('id')
        .eq('slug', article.slug)
        .maybeSingle()

      if (existing) {
        console.log(`[news DB] Updating: ${article.slug}`)
        await supabase.from('news').update(article).eq('id', existing.id)
      } else {
        console.log(`[news DB] Inserting: ${article.slug}`)
        await supabase.from('news').insert([article])
      }
    } catch (e) {
      console.log(`[news DB] Notice: ${e.message}`)
    }
  }

  // 3. Always update `config.news_items` so that it immediately renders in Home CMS & Website
  const configNewsItems = articles.map(a => ({
    id: a.id,
    title: a.title,
    summary: a.summary,
    content: a.content,
    image_url: a.image_url,
    thumbnail_url: a.thumbnail_url,
    source_url: a.source_url,
    ig_link: a.ig_link,
    date: a.date
  }))

  const { error: configErr } = await supabase
    .from('config')
    .upsert({ key: 'news_items', value: JSON.stringify(configNewsItems) }, { onConflict: 'key' })

  if (configErr) {
    console.error('Error updating config.news_items:', configErr.message)
  } else {
    console.log('Successfully injected all 3 news items into config.news_items!')
  }

  console.log('--- DB Injection Completed Successfully ---')
}

injectNews().catch(err => {
  console.error('Fatal execution error:', err)
  process.exit(1)
})

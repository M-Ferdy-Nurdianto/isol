import React, { useState, useEffect, useRef } from 'react'
import {
  FaBookOpen,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaShoppingCart,
  FaCalendar,
  FaUsers,
  FaBox,
  FaHome,
  FaMusic,
  FaUserFriends,
  FaChartBar,
  FaEdit,
  FaArrowRight,
  FaArrowLeft,
  FaLightbulb,
  FaExclamationTriangle
} from 'react-icons/fa'

const MUST_DO = [
  'Cek bukti pembayaran (Transfer/QRIS) terlebih dahulu sebelum mengubah status pesanan PO atau Merch menjadi Checked agar hitungan di Recap dan Export akurat.',
  'Pilih event yang sesuai pada filter di tab Orders sebelum mencatat Order OTS agar transaksi masuk ke jadwal acara yang benar.',
  'Pastikan rasio foto sesuai sebelum mengunggah (3:4 untuk foto profil member, 4:5 untuk foto kartu Shop) agar gambar tidak terpotong.'
]

const DO_NOT = [
  'Jangan menghapus Event atau Member yang sudah memiliki riwayat transaksi. Tandai event selesai atau nonaktifkan status member agar data Recap tetap aman.',
  'Jangan lupa mematikan Mode Maintenance di tab Settings setelah perbaikan selesai, karena pengunjung tidak dapat mengakses website selama mode ini aktif.',
  'Jangan bagikan akses login admin ke pihak yang tidak berkepentingan dan selalu klik Logout setelah selesai menggunakan perangkat bersama.'
]

const GUIDE_SECTIONS = [
  {
    id: 'orders',
    tabId: 'orders',
    title: '1. Orders',
    icon: FaShoppingCart,
    summary: 'Mengelola pesanan Cheki (PO, OTS, Wide, Grup, Special) dan Merchandise.',
    listHeading: 'Langkah Operasional',
    isOrdered: true,
    items: [
      'Gunakan filter tab di bagian atas: All, PO, OTS, Special, atau Merch untuk menyaring jenis pesanan.',
      'Pada pesanan PO atau Merch, klik detail/lihat bukti untuk memeriksa foto bukti transfer atau QRIS dari pembeli.',
      'Perbarui status pesanan secara bertahap: Unchecked (baru masuk) -> Checked (pembayaran valid) -> Completed (pesanan selesai/diambil).',
      'Untuk mencatat Order OTS di lokasi acara, pilih event pada filter terlebih dahulu, lalu isi form Order OTS (nama/akun pembeli, metode bayar Cash/TF/QRIS, dan pilihan member/Wide/Grup).',
      'Gunakan tombol Export Data untuk mengunduh laporan transaksi dalam format PDF atau Excel.'
    ],
    tips: 'Pesanan berstatus Checked dan Completed otomatis terhitung di halaman Recap serta masuk ke laporan Export PDF/Excel.',
    caution: 'Menghapus pesanan bersifat permanen dan langsung mengurangi total pemasukan di Recap. Gunakan hanya untuk data ganda atau uji coba.'
  },
  {
    id: 'events',
    tabId: 'events',
    title: '2. Events',
    icon: FaCalendar,
    summary: 'Mengatur jadwal acara yang tampil di halaman depan dan pilihan event di Shop.',
    listHeading: 'Langkah Pengaturan',
    isOrdered: true,
    items: [
      'Klik tombol tambah event, lalu lengkapi nama event, tanggal, lokasi, jam acara, dan jam sesi cheki.',
      'Pada bagian Lineup, centang member yang hadir. Member yang tidak dicentang tidak dapat dipesan pada event tersebut.',
      'Jika acara bersifat khusus, aktifkan opsi Special Event dan atur tema serta harga atau ketersediaan OTS khususnya.',
      'Setelah acara berakhir, ubah status event menjadi selesai agar tidak lagi muncul sebagai pilihan aktif di Shop.'
    ],
    tips: 'Jadwal yang berstatus aktif otomatis tampil di bagian Upcoming Event pada beranda dan dropdown pilih event di Shop.',
    caution: 'Hindari menghapus event yang sudah memiliki pesanan. Cukup tandai selesai agar riwayat transaksi dan laporan Recap tidak hilang.'
  },
  {
    id: 'members',
    tabId: 'members',
    title: '3. Members',
    icon: FaUsers,
    summary: 'Mengatur profil member Kohi Sekai, urutan tampil, dan foto Shop/Profil.',
    listHeading: 'Bagian yang Bisa Diatur',
    isOrdered: false,
    items: [
      'Data Profil: tambah atau ubah nama panggung, tanggal lahir, hobi, jikoshoukai, tautan media sosial, dan angka urutan tampil.',
      'Foto Profil (rasio 3:4): digunakan untuk tampilan profil member di beranda dan halaman About Us.',
      'Foto Shop (rasio 4:5): digunakan khusus untuk kartu pemesanan tiket 2-shot di halaman Shop.',
      'Status Aktif: atur apakah member sedang aktif tampil di website dan dapat dipesan.'
    ],
    tips: 'Angka urutan menentukan posisi tampil member dari kiri ke kanan di halaman About Us dan Shop.',
    caution: 'Menonaktifkan status member jauh lebih aman daripada menghapus data member, karena riwayat pesanan lama tetap terjaga.'
  },
  {
    id: 'merch',
    tabId: 'merch',
    title: '4. Merchandise',
    icon: FaBox,
    summary: 'Mengelola katalog produk merchandise, stok, varian ukuran, dan size chart.',
    listHeading: 'Langkah Pengelolaan',
    isOrdered: true,
    items: [
      'Klik tambah produk untuk memasukkan nama merch, kategori, harga, jumlah stok, deskripsi, dan pilihan ukuran/varian.',
      'Unggah foto utama produk serta foto size chart jika produk memiliki panduan ukuran (seperti kaos atau jaket).',
      'Perbarui stok secara berkala atau nonaktifkan ketersediaan produk jika masa penjualan sudah ditutup.'
    ],
    tips: 'Jika stok diisi 0 atau status produk dinonaktifkan, tampilan produk di Shop otomatis berubah menjadi SOLD OUT.',
    caution: 'Pastikan deskripsi dan foto size chart jelas sebelum membuka PO agar meminimalkan kesalahan pilih ukuran oleh pembeli.'
  },
  {
    id: 'home-cms',
    tabId: 'home-cms',
    title: '5. Home & Konten',
    icon: FaHome,
    summary: 'Mengatur tampilan beranda (Hero, About Us, News, FAQ, Social, dan Footer).',
    listHeading: 'Sub-Tab yang Tersedia',
    isOrdered: false,
    items: [
      'Hero: atur judul utama, subjudul, tagline, teks tombol CTA, dan teks sudut layar di halaman depan.',
      'About: ubah cerita Kohi Sekai, tahun berdiri, foto grup, serta galeri carousel halaman About Us.',
      'News: tambah, edit, atau hapus berita dan pengumuman terbaru yang tampil di beranda.',
      'FAQ & Social: kelola daftar tanya-jawab, kontak person (CP), serta tautan media sosial resmi.',
      'Footer: perbarui deskripsi brand, tagline, dan teks copyright di bagian bawah website.'
    ],
    tips: 'Gunakan fitur crop saat mengunggah foto grup atau galeri About Us agar komposisi gambar pas di layar desktop maupun mobile.',
    caution: 'Setiap perubahan pada sub-tab Home CMS baru akan tampil di website publik setelah tombol Simpan ditekan.'
  },
  {
    id: 'music',
    tabId: 'music',
    title: '6. Music',
    icon: FaMusic,
    summary: 'Mengatur daftar rilis lagu/video musik YouTube dan Spotify beserta urutannya.',
    listHeading: 'Langkah Pengelolaan',
    isOrdered: true,
    items: [
      'Klik tambah musik, pilih platform (YouTube atau Spotify), lalu masukkan judul dan tautan publiknya.',
      'Unggah thumbnail khusus jika diperlukan dan pilih warna tema opsional untuk kartu rilis.',
      'Gunakan ikon drag di pojok kiri atas kartu untuk menggeser dan mengatur urutan tampil musik.'
    ],
    tips: 'Urutan kartu di tab Music langsung menentukan urutan tampilan lagu di halaman Music dan bagian Featured Music.',
    caution: 'Pastikan tautan YouTube atau Spotify berstatus publik (bukan private) agar pemutar musik dapat dimuat oleh pengunjung.'
  },
  {
    id: 'users',
    tabId: 'users',
    title: '7. Fan Users',
    icon: FaUserFriends,
    summary: 'Mengelola akun member fan, riwayat pesanan fan, reset password, dan registrasi OTS.',
    listHeading: 'Fitur yang Tersedia',
    isOrdered: false,
    items: [
      'Pencarian Akun: cari akun fan berdasarkan nama, username, atau email untuk melihat detail dan riwayat transaksinya.',
      'Keamanan & Reset Password: bantu fan yang lupa kata sandi melalui kirim reset email atau pembuatan kode OTP admin.',
      'Register OTS: buatkan akun fan baru secara cepat di lokasi event jika pembeli belum memiliki akun.'
    ],
    tips: 'Gunakan fitur pencarian sebelum membuatkan akun OTS baru agar tidak terjadi duplikasi akun milik fan yang sama.',
    caution: 'Fitur hapus data uji coba (Wipe Dummy Data) hanya boleh digunakan untuk membersihkan data testing, bukan data transaksi asli.'
  },
  {
    id: 'recap',
    tabId: 'recap',
    title: '8. Recap',
    icon: FaChartBar,
    summary: 'Melihat ringkasan pemasukan, grafik PO vs OTS, dan performa penjualan per member.',
    listHeading: 'Data yang Ditampilkan',
    isOrdered: false,
    items: [
      'Ringkasan Cheki & Merch: pantau total pendapatan serta jumlah item terjual secara keseluruhan.',
      'Filter Event: saring laporan berdasarkan event tertentu untuk melihat pemasukan khusus acara tersebut.',
      'Perbandingan PO vs OTS: lihat distribusi tiket terjual untuk masing-masing member.'
    ],
    tips: 'Angka di halaman Recap dihitung otomatis secara real-time dari data transaksi di tab Orders.',
    caution: 'Pastikan seluruh pesanan di tab Orders sudah diverifikasi (Checked/Completed) sebelum mengambil kesimpulan laporan akhir.'
  },
  {
    id: 'settings',
    tabId: 'settings',
    title: '9. Settings',
    icon: FaEdit,
    summary: 'Mengatur harga default cheki, metode pembayaran, mode maintenance, dan pembersihan data.',
    listHeading: 'Pengaturan yang Tersedia',
    isOrdered: false,
    items: [
      'Harga & Jenis Cheki: atur tarif default PO/OTS Member, PO/OTS Grup, Cheki Grup, serta saklar aktif untuk Regular Cheki, Wide Cheki, dan Cheki Grup.',
      'Pembayaran Checkout: aktifkan/nonaktifkan Transfer Bank (bank, nomor rekening, atas nama) dan QRIS (gambar QRIS & nama merchant).',
      'Mode Maintenance: aktifkan saat website sedang diperbaiki dengan pesan khusus dan estimasi selesai (admin tetap bisa mengakses website).',
      'Pembersihan Data: hapus transaksi per event (Bulk Delete) atau bersihkan foto bukti pembayaran lama.'
    ],
    tips: 'Harga default di sini otomatis berlaku untuk seluruh event reguler, kecuali event spesial yang menggunakan harga khusus sendiri.',
    caution: 'Setelah mengunggah gambar QRIS baru, uji coba tampilan halaman Checkout untuk memastikan kode QR terbaca dengan jelas.'
  }
]

const GuideTab = ({ setActiveTab }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSection, setSelectedSection] = useState(null)
  const detailRef = useRef(null)

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setSelectedSection(null)
    }
    if (selectedSection) {
      window.addEventListener('keydown', handleEsc)
      setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 40)
    }
    return () => window.removeEventListener('keydown', handleEsc)
  }, [selectedSection])

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const filteredSections = GUIDE_SECTIONS.filter((sec) => {
    if (!normalizedQuery) return true
    const haystack = [
      sec.title,
      sec.summary,
      sec.listHeading,
      ...sec.items,
      sec.tips,
      sec.caution
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(normalizedQuery)
  })

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 pb-8 animate-fade-in">
      {/* Header - Desktop */}
      <div className="hidden md:flex items-center justify-between gap-6 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/15 border border-[var(--primary)]/35 flex items-center justify-center text-[var(--primary)] shrink-0">
            <FaBookOpen className="text-xl" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight uppercase">
              Panduan <span className="text-[var(--primary)]">Admin</span>
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
              Panduan ringkas operasional dashboard dan pengelolaan konten website Kohi Sekai.
            </p>
          </div>
        </div>

        <div className="relative w-80 shrink-0">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-sm pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              if (selectedSection) setSelectedSection(null)
            }}
            placeholder="Cari panduan, mis: OTS, QRIS, stok..."
            className="w-full pl-10 pr-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 focus:outline-none focus:border-[var(--primary)] transition-colors"
          />
        </div>
      </div>

      {/* Header - Mobile */}
      <div className="md:hidden bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 space-y-3.5 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/15 border border-[var(--primary)]/35 flex items-center justify-center text-[var(--primary)] shrink-0">
            <FaBookOpen className="text-base" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[var(--text-primary)] tracking-tight uppercase">
              Panduan <span className="text-[var(--primary)]">Admin</span>
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
              Panduan ringkas pengelolaan dashboard Kohi Sekai.
            </p>
          </div>
        </div>

        <div className="relative w-full">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-xs pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              if (selectedSection) setSelectedSection(null)
            }}
            placeholder="Cari panduan, mis: OTS, QRIS, stok..."
            className="w-full pl-9 pr-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 focus:outline-none focus:border-[var(--primary)] transition-colors"
          />
        </div>
      </div>

      {/* Wajib Dilakukan & Jangan Dilakukan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-[var(--surface)] border border-emerald-500/30 rounded-2xl p-4 sm:p-5 space-y-2.5 sm:space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm sm:text-base">
            <FaCheckCircle />
            <span>Wajib Dilakukan</span>
          </div>
          <ul className="space-y-2.5 text-sm sm:text-[15px] text-[var(--text-primary)] leading-relaxed">
            {MUST_DO.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[var(--surface)] border border-red-500/30 rounded-2xl p-4 sm:p-5 space-y-2.5 sm:space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-red-400 font-bold text-sm sm:text-base">
            <FaTimesCircle />
            <span>Jangan Dilakukan</span>
          </div>
          <ul className="space-y-2.5 text-sm sm:text-[15px] text-[var(--text-primary)] leading-relaxed">
            {DO_NOT.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="text-red-400 font-bold mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Area Konten: Daftar Menu atau Detail Panduan */}
      {selectedSection ? (
        <div
          ref={detailRef}
          className="bg-[var(--surface)] border border-[var(--primary)]/50 rounded-2xl p-4 sm:p-6 space-y-5 sm:space-y-6 shadow-xl scroll-mt-4"
        >
          {/* Tombol Kembali + Header Detail */}
          <div className="space-y-4 pb-4 border-b border-[var(--border)]">
            <button
              type="button"
              onClick={() => setSelectedSection(null)}
              className="w-full sm:w-auto inline-flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 sm:py-2 rounded-xl bg-[var(--background)] hover:bg-[var(--border)] border border-[var(--border)] text-sm font-bold text-[var(--text-primary)] transition-colors"
            >
              <FaArrowLeft className="text-xs" />
              <span>Kembali ke Daftar Panduan</span>
            </button>

            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[var(--primary)]/15 border border-[var(--primary)]/35 flex items-center justify-center text-[var(--primary)] shrink-0">
                <selectedSection.icon className="text-lg" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-[var(--text-primary)]">
                  {selectedSection.title}
                </h3>
                <p className="text-sm sm:text-[15px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                  {selectedSection.summary}
                </p>
              </div>
            </div>
          </div>

          {/* Daftar Langkah / Fitur */}
          <div className="space-y-3">
            <h4 className="text-base font-bold text-[var(--text-primary)]">
              {selectedSection.listHeading}
            </h4>
            {selectedSection.isOrdered ? (
              <ol className="space-y-3">
                {selectedSection.items.map((step, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm sm:text-[15px] text-[var(--text-primary)] leading-relaxed"
                  >
                    <span className="w-7 h-7 rounded-full bg-[var(--primary)]/15 border border-[var(--primary)]/35 text-[var(--primary)] font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <ul className="space-y-2.5">
                {selectedSection.items.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm sm:text-[15px] text-[var(--text-primary)] leading-relaxed"
                  >
                    <span className="text-[var(--primary)] font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Tips & Hati-hati */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm sm:text-[15px]">
                <FaLightbulb />
                <span>Tips</span>
              </div>
              <p className="text-sm sm:text-[15px] text-[var(--text-primary)] leading-relaxed">
                {selectedSection.tips}
              </p>
            </div>

            <div className="bg-red-500/5 border border-red-500/25 rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm sm:text-[15px]">
                <FaExclamationTriangle />
                <span>Hati-hati</span>
              </div>
              <p className="text-sm sm:text-[15px] text-[var(--text-primary)] leading-relaxed">
                {selectedSection.caution}
              </p>
            </div>
          </div>

          {/* Tombol Buka Menu */}
          {setActiveTab && (
            <div className="flex justify-end pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setActiveTab(selectedSection.tabId)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/85 text-white text-sm font-bold transition-colors shadow-lg"
              >
                <span>Buka Menu {selectedSection.title.replace(/^\d+\.\s*/, '')}</span>
                <FaArrowRight className="text-xs" />
              </button>
            </div>
          )}
        </div>
      ) : filteredSections.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 text-center text-[var(--text-secondary)] text-sm sm:text-[15px] space-y-2">
          <FaExclamationTriangle className="text-amber-400 text-xl mx-auto" />
          <p>Tidak ada panduan yang cocok dengan &ldquo;{searchQuery}&rdquo;.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredSections.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setSelectedSection(section)}
                className="w-full text-left bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 shadow-md transition-colors group"
              >
                <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/15 border border-[var(--primary)]/35 flex items-center justify-center text-[var(--primary)] shrink-0 mt-0.5 sm:mt-0">
                    <Icon className="text-sm" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 min-w-0">
                    <span className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors shrink-0">
                      {section.title}
                    </span>
                    <span className="hidden sm:inline text-[var(--text-secondary)]/50">—</span>
                    <span className="text-sm sm:text-[15px] text-[var(--text-secondary)] leading-snug">
                      {section.summary}
                    </span>
                  </div>
                </div>

                <div className="w-full sm:w-auto pt-2 border-t border-[var(--border)] sm:pt-0 sm:border-t-0 flex justify-end shrink-0">
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--primary)] group-hover:translate-x-0.5 transition-transform">
                    <span>Lihat panduan</span>
                    <FaArrowRight className="text-xs" />
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Catatan Bawah */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 space-y-2 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
        <p>
          Perubahan pada Events, Members, Merchandise, Home &amp; Konten, Music, dan Settings langsung berpengaruh ke website publik. Selalu periksa kembali data sebelum menyimpan.
        </p>
        <p>
          <strong className="text-[var(--text-primary)]">Tips Keamanan &amp; Arsip:</strong> Unduh laporan transaksi (PDF/Excel) di tab Orders secara berkala sebelum melakukan pembersihan data atau penghapusan bukti bayar lama di tab Settings.
        </p>
      </div>
    </div>
  )
}

export default GuideTab

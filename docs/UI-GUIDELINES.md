# Kohi Sekai — UI & Visual Guidelines

Dokumen ini mendefinisikan aturan visual dan estetika antarmuka pengguna (UI) Kohi Sekai. Semua komponen dan halaman wajib mematuhi panduan ini.

---

## 1. Aturan Anti Warna-Warni (Minimalis & Elegan)
- **Kurangi Warna Eksternal**: Jangan membuat UI tampak seperti pelangi (*rainbow-colored*). Seluruh kartu, container, panel, form, dan badge default menggunakan palet dasar Deep Coffee (`bg-surface`, `bg-background`, `border-border`).
- **Warna Fungsional Terbatas**: Warna lain HANYA boleh muncul jika memiliki arti status fungsional penting:
  - **Merah (`#D65656`)**: Menghapus item, order dibatalkan, pembayaran gagal, tanda wajib (`*`).
  - **Hijau (`#6FAE73`)**: Order lunas (*Paid*), selesai, konfirmasi berhasil.
  - **Kuning / Amber (`#E5A93C`)**: Menunggu pembayaran, pending verifikasi.
  - **Ungu (`#A855F7`)**: **Eksklusif Special** untuk *Special Stage*, *Special Event*, dan *Special Cheki*. Dilarang menggunakan warna lain (seperti pink) untuk spesial, dan dilarang menggunakan warna ungu untuk hal reguler.
- **Badge & Label Non-Status Wajib Netral**:
  - Badge sumber pesanan (*OTS Venue*, *Pre-Order PO*, *Admin Input*, *Order Sendiri*) wajib menggunakan background dan border netral:
    `bg-background text-text-secondary border border-border`.
  - Badge kategori produk (*Merchandise*, *Apparel*, *Aksesoris*) wajib netral atau menggunakan sentuhan lembut warna brand `var(--primary)`.

---

## 2. Solid Colors & Anti-Glassmorphism
- **Tanpa Gradient**: Seluruh tombol, badge, kartu, dan teks dilarang menggunakan `bg-gradient-*` atau `linear-gradient(...)`.
- **Tanpa Blur (Anti-Glassmorphism)**: Seluruh komponen dilarang menggunakan `backdrop-blur-*` atau transparansi kaca berkabut. Gunakan solid color yang tegas (`bg-black/90` untuk modal overlay).
- **Tanpa Garis Aksen Berwarna di Card**: Dilarang menggunakan strip/garis warna-warni di sisi atas/samping kartu (misal garis hijau, ungu, biru di atas kartu). Penekanan kartu dilakukan lewat background `bg-surface` dan divider netral `bg-border`.

---

## 3. Tata Letak & Responsif Manual
- **Manual Responsive**: Wajib menulis styling mobile (`md:hidden`) dan desktop (`hidden md:block` / `hidden md:flex`) secara eksplisit terpisah untuk komponen utama (seperti modal detail merchandise, drawer keranjang, form checkout, dan tabel admin) agar presisi tampilan terjamin pada smartphone maupun layar besar.
- **No Emojis Policy**: Jangan gunakan emoji pada judul tombol, nama tab, modal, kartu, atau teks UI. Gunakan icon SVG profesional dari `react-icons` atau `lucide-react`.

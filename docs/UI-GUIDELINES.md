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

---

## 4. Aturan Wajib Modal Global Admin (Desktop Fullscreen vs Mobile Bottom-Sheet)
Setiap modal form atau editor interaktif di Admin Dashboard Kohi Sekai **WAJIB** dipisahkan kodenya secara eksplisit menjadi 2 varian tata letak:

### A. Modal Desktop (`hidden md:flex`) - FULLSCREEN OVERLAY (Tanpa Pindah Halaman)
1. **Bukan Pop-up Melayang**: DILARANG membuat modal pop-up box sempit yang melayang di tengah layar desktop dengan backdrop gelap di tepiannya.
2. **Fullscreen Workspace**: Modal wajib berupa Fullscreen Overlay in-place (`fixed inset-0 z-50 bg-[var(--background)] flex flex-col overflow-hidden animate-fade-in`) yang memenuhi seluruh viewport monitor tanpa navigasi pindah route/URL.
3. **Fixed Header Bar**: Bar atas penuh (`bg-[var(--surface)] border-b border-[var(--border)] px-8 py-4 flex items-center justify-between shrink-0`) dengan icon/back arrow, judul jelas, subjudul/badge, dan tombol tutup (`FaTimes`).
4. **Scrollable Content Body**: Area kerja leluasa di tengah (`flex-1 overflow-y-auto p-8 custom-scrollbar`) dengan container proporsional (`max-w-6xl mx-auto w-full`) menggunakan tata letak 2 kolom atau multi-kolom yang rapi.
5. **Fixed Sticky Footer**: Bar bawah penuh (`bg-[var(--surface)] border-t border-[var(--border)] px-8 py-4 flex items-center justify-between shrink-0`) di mana tombol aksi `Batal` dan `Simpan / Konfirmasi` selalu terlihat di dasar monitor tanpa perlu scroll.
6. **PENGECUALIAN RESMI**: Transaksi tiket Order Cheki (`kecuali order cheki`) tetap menggunakan layout form inline OTS atau popup detail yang sudah ada.

### B. Modal Mobile (`md:hidden`) - BOTTOM-SHEET MODAL
1. **Bentuk**: **Bottom-Sheet Modal** yang slide-up dari dasar layar smartphone (`fixed inset-x-0 bottom-0 max-h-[92vh] rounded-t-3xl bg-[var(--surface)] border-t border-[var(--border)] shadow-2xl flex flex-col z-50 animate-slide-up`).
2. **Handle Bar**: Sertakan visual handle bar di paling atas sheet (`w-12 h-1.5 bg-[var(--border)] rounded-full mx-auto my-2.5`).
3. **Thumb-Zone Optimization**: Tata letak form mengalir vertikal (1 kolom) yang nyaman dioperasikan satu jempol.
4. **Sticky Action Bar di Bawah**:
   - Tombol aksi `Batal` dan `Simpan` **WAJIB menempel di paling bawah viewport smartphone** (`sticky bottom-0 bg-[var(--surface)] border-t border-[var(--border)] p-4`).
   - Pengguna tidak boleh dipaksa scroll ke dasar form hanya untuk menemukan tombol submit.

### C. Larangan Desain Modal
- **DILARANG** membuat modal pop-up mengambang sempit di desktop untuk form admin (seperti Tambah Event, Input Order Merch, Status Pengiriman Merch).
- **DILARANG** membuat modal "serba satu layout" yang hanya mengecilkan padding tanpa membedakan struktur desktop vs mobile.
- **DILARANG** membiarkan tombol submit modal tenggelam di bawah layar tanpa sticky footer.

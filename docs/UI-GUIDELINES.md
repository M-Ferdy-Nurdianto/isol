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

## 4. Aturan Wajib Pemisahan Modal (Desktop Dialog vs Mobile Bottom-Sheet)
Setiap modal form atau popup interaktif di Kohi Sekai **WAJIB** dipisahkan kodenya secara eksplisit menjadi 2 varian tata letak:

### A. Modal Desktop (`hidden md:flex`)
1. **Bentuk**: Floating Dialog di tengah layar dengan background solid `bg-[var(--surface)]`, border tegas `border-[var(--border)]`, dan shadow pekat.
2. **Ukuran Lebar**: Gunakan `max-w-2xl`, `max-w-3xl`, atau `max-w-4xl` dengan tata letak **2 Kolom (Grid)** untuk memanfaatkan lebar layar desktop (misal: kolom kiri untuk data order & status, kolom kanan untuk alamat pengiriman & rincian item).
3. **Fixed Header & Sticky Footer**:
   - Header modal tetap di atas dengan judul, info identitas, dan tombol tutup (`FaTimes`).
   - Tombol aksi (`Batal` dan `Simpan / Konfirmasi`) **WAJIB** berada di sticky/fixed footer bawah modal (`border-t border-[var(--border)] bg-[var(--surface)]`) sehingga **selalu terlihat tanpa perlu scroll ke bawah**.
4. **Body Scrollable**: Hanya area konten tengah yang boleh di-scroll (`overflow-y-auto custom-scrollbar`).

### B. Modal Mobile (`md:hidden`)
1. **Bentuk**: **Bottom-Sheet Modal** yang slide-up dari dasar layar (`fixed inset-x-0 bottom-0 max-h-[92vh] rounded-t-3xl bg-[var(--surface)] border-t border-[var(--border)] shadow-2xl flex flex-col z-50`).
2. **Handle Bar**: Sertakan visual handle bar di paling atas sheet (`w-12 h-1.5 bg-[var(--border)] rounded-full mx-auto my-2.5`).
3. **Thumb-Zone Optimization**: Tata letak form mengalir vertikal (1 kolom) yang nyaman dioperasikan satu jempol.
4. **Sticky Action Bar di Bawah**:
   - Tombol aksi `Batal` dan `Simpan` **WAJIB menempel di paling bawah viewport smartphone** (`sticky bottom-0 bg-[var(--surface)] border-t border-[var(--border)] p-4`).
   - Pengguna tidak boleh dipaksa scroll ke dasar form hanya untuk menemukan tombol submit.

### C. Larangan Desain Modal
- **DILARANG** membuat modal "serba satu layout" yang hanya mengecilkan padding tanpa membedakan struktur desktop vs mobile.
- **DILARANG** membiarkan tombol submit modal tenggelam di bawah layar tanpa sticky footer.

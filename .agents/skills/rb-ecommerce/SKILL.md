---
name: rb-ecommerce
description: Use when working on shopping cart, checkout flow, receipts, or products logic for RB Remake.
---

# Shop & Cart Logic

## State Management
Data keranjang belanja (cart) dikelola menggunakan React State dan dipertahankan di **LocalStorage**.

### Cart Structure
Setiap item dalam cart memiliki format:
```javascript
{
  id: "uuid",
  type: "merchandise" | "cheki",
  name: "Nama Produk",
  price: 50000,
  quantity: 1,
  details: {
    memberId: "uuid", // Khusus Cheki
    poseRequest: "...",
    note: "..."
  }
}
```

## Inventory Logic
- Sebelum menambah ke cart, sistem harus mengecek `stock` dari tabel `merchandise`.
- Jika `stock <= 0`, tombol "Add to Cart" harus disabled.
- Khusus Cheki, stok biasanya tidak terbatas kecuali ada batasan slot per member per event.

## Persistence
- Setiap kali cart berubah, simpan ke `localStorage.setItem('rb_cart', JSON.stringify(cart))`.
- Saat aplikasi dimuat, ambil data dari storage di `useEffect`.

## Rules
1. **Realtime Update**: Jika admin mengubah stok di dashboard, shop page harus mengupdate tampilan stok tanpa refresh (menggunakan Realtime Subscription).
2. **Validation**: Jangan biarkan user checkout dengan keranjang kosong.
3. **Calculations**: Semua perhitungan total harga harus dilakukan di client untuk UI, namun divalidasi ulang oleh server saat transaksi final.


# Checkout Pipeline Flow

Proses Checkout dibagi menjadi 4 tahap utama untuk memastikan validitas data dan pengalaman user yang lancar.

## Tahap 1: Pengisian Data Customer
- User mengisi Nama dan Instagram Handle.
- Validasi: Field tidak boleh kosong. Nama minimal 3 karakter.

## Tahap 2: Review Pesanan
- Menampilkan ringkasan item (Cheki & Merchandise).
- Menghitung Total Harga + Kode Unik (jika ada).
- Menampilkan detail rekening pembayaran.

## Tahap 3: Upload Bukti Pembayaran
- User mengunggah foto bukti transfer.
- **Sistem Otomatis**: Gambar dikompres ke format WebP di sisi client sebelum dikirim ke server untuk menghemat bandwidth.
- Status Order diset ke `Pending`.

## Tahap 4: Konfirmasi & Selesai
- Data disimpan ke tabel `orders` dan `order_items`.
- User diarahkan ke halaman "Success".
- Link Struk Digital (Receipt) ditampilkan untuk didownload atau dishare.

## Rules
1. **Concurrency**: Gunakan `loading state` pada tombol "Submit" untuk mencegah double-submission (klik berkali-kali).
2. **Transaction Integrity**: Jika penyimpanan data gagal di tengah jalan, sistem harus memberikan feedback yang jelas dan tidak memotong saldo user (jika ada sistem saldo).
3. **Privacy**: Masking data sensitif di layar konfirmasi jika perlu.
4. **Mobile Experience**: Pastikan form input tidak tertutup keyboard virtual di mobile.


# Digital Receipt Engine

Struk digital adalah fitur kebanggaan Kohi Sekai yang harus terlihat estetik.

## Technical Components
- **Template**: Menggunakan HTML/CSS yang dikonversi menjadi gambar (Canvas) atau PDF.
- **Dynamic Data**: Mengambil data dari tabel `orders` dan `order_items`.
- **Branding**: Warna struk mengikuti `theme_color` dari tabel `events`.

## Sharing Features
1. **Download**: Menyimpan struk sebagai file `.png` ke galeri user.
2. **Share to IG Story**: Format struk harus dioptimasi untuk aspek rasio `9:16` (Story) dengan background yang menarik.
3. **Masking Contact**: Opsi untuk menyembunyikan nomor telepon atau detail pribadi pada gambar struk agar aman saat diposting di sosial media.

## Rules
1. **Typography**: Gunakan font monospaced (e.g., `Courier New` atau `Roboto Mono`) untuk bagian detail harga agar sejajar dan rapi.
2. **Logo**: Pastikan logo Kohi Sekai selalu ada di bagian header struk.
3. **High Resolution**: Gambar struk yang digenerate harus cukup tajam (minimal 2x scaling dari ukuran layar) agar tidak pecah saat dishare.
4. **Fallback**: Jika gambar gagal digenerate, sediakan tampilan HTML yang rapi sebagai cadangan.


---
name: rb-optimization
description: Use when working on SEO, meta tags, image compression, caching, or performance optimization.
---

# Image Compression Workflow

Setiap gambar yang diunggah oleh user (Bukti Bayar) atau Admin (Produk/Member) wajib melewati pipeline kompresi.

## Client-Side Pipeline
Sebelum melakukan `supabase.storage.upload()`, jalankan proses berikut:
1. **Format Conversion**: Ubah gambar (JPEG/PNG) menjadi **WebP**.
2. **Resolution Limit**: Batasi lebar maksimal gambar (e.g., 1080px). Pertahankan aspek rasio.
3. **Quality Tuning**: Atur kualitas WebP ke rentang `0.7 - 0.8` (seimbang antara ketajaman dan ukuran file).

## Storage Structure
Organisasikan file di Supabase Storage sebagai berikut:
- `/receipts/[order_id].webp`
- `/products/[product_id].webp`
- `/members/[member_id].webp`

## Implementation Example
Gunakan library seperti `browser-image-compression` atau fungsi Canvas manual.

```javascript
const compressedFile = await imageCompression(file, {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1080,
  useWebWorker: true,
  fileType: 'image/webp'
});
```

## Rules
1. **Naming**: Jangan gunakan nama file asli user. Selalu rename menjadi UUID atau ID entitas terkait.
2. **Cleanup**: Sediakan fungsi untuk menghapus gambar lama jika ada update (untuk menghindari sampah di storage).
3. **Lazy Loading**: Gunakan atribut `loading="lazy"` pada tag `<img>` di frontend.


# SEO & Metadata Strategy

Kohi Sekai harus mudah ditemukan dan terlihat profesional saat dibagikan di sosial media.

## Meta Tags (Index.html & Layout)
- **Title**: Minimal "Kohi Sekai Official - [Nama Halaman]".
- **Description**: Deskripsi singkat yang menarik tentang event atau produk.
- **Keywords**: Kohi Sekai, Idol, Cheki, Merchandise, [Nama Event].

## OpenGraph (Social Media Share)
Wajib ada agar link yang dishare di Instagram, Twitter, atau WhatsApp muncul dengan preview yang cantik.
- `og:title`: Judul yang menarik (e.g., "Pre-Order Cheki Member [Name] Sekarang!").
- `og:description`: Ringkasan info event.
- `og:image`: Gambar poster event atau logo Kohi Sekai (format 1200x630px).
- `og:type`: "website" atau "article".

## Semantic HTML
Gunakan tag yang tepat untuk SEO:
- `<h1>` hanya satu per halaman.
- `<h2>` - `<h5>` untuk hierarki judul.
- `<header>`, `<main>`, `<footer>`, `<section>` untuk struktur layout.
- `alt` text pada semua gambar (penting untuk aksesibilitas dan SEO).

## Rules
1. **Dynamic Metadata**: Untuk halaman produk atau member, meta tags harus berubah secara dinamis sesuai data yang sedang ditampilkan.
2. **JSON-LD**: Tambahkan Structured Data untuk info Event atau Product agar Google bisa menampilkan "Rich Snippets".
3. **Performance**: Pastikan LCP (Largest Contentful Paint) cepat agar skor SEO dari Google tinggi.


# Performance & Caching Strategy

Kecepatan aplikasi sangat mempengaruhi kepuasan user, terutama di perangkat mobile dengan koneksi tidak stabil.

## Asset Optimization
1. **Images**: Selalu gunakan WebP. Gunakan `srcset` untuk gambar yang berbeda ukuran.
2. **Lazy Loading**: Tunda pemuatan gambar yang tidak terlihat di viewport pertama kali (`loading="lazy"`).
3. **Icons**: Gunakan `lucide-react` secara modular agar tree-shaking berjalan maksimal (jangan impor seluruh library).

## Code Level Optimization
1. **Memoization**: Gunakan `useMemo` dan `useCallback` untuk perhitungan berat atau fungsi yang sering dipassing ke child components guna menghindari re-render yang tidak perlu.
2. **Bundle Splitting**: Gunakan `React.lazy` untuk mengimpor halaman yang besar (e.g., Dashboard Admin) sehingga tidak membebani load awal public shop.
3. **Dependency Cleanup**: Cek `package.json` secara berkala. Hapus library yang tidak digunakan.

## Caching Strategy
1. **LocalStorage**: Cache data statis yang jarang berubah (e.g., Daftar Member) untuk mempercepat load berikutnya.
2. **Supabase Cache**: Gunakan header cache yang tepat jika ada API custom.
3. **Vercel Edge Caching**: Optimasi deployment di Vercel agar asset statis dilayani dari CDN terdekat user.

## Rules
1. **Keep it Light**: Ukuran bundle JavaScript diusahakan tetap kecil.
2. **First Paint**: Prioritaskan memunculkan konten utama (First Contentful Paint) dalam waktu kurang dari 2 detik.
3. **Network Resilience**: Pastikan aplikasi tidak crash saat offline. Gunakan Service Worker jika diperlukan untuk fungsi PWA.


---
name: rb-ui-ux
description: Use when working on advanced CSS, glassmorphism, animations, responsive design, admin layouts, or toast notifications.
---

# Glassmorphism Technical Spec

Efek Glassmorphism adalah kunci dari estetika "Premium Metal" di Kohi Sekai.

## Core CSS Recipe
Setiap panel atau kartu utama harus menggunakan kombinasi berikut:

```css
.glass-panel {
  background: var(--bg-surface);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid var(--glass-border);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  border-radius: 12px;
}
```

## Advanced Effects
1. **Inner Glow**:
   Gunakan `inset shadow` untuk memberikan kesan kedalaman pada border.
   `box-shadow: inset 0 0 0 1px hsla(0, 0%, 100%, 0.05);`

2. **Gradient Border**:
   Untuk tombol premium, gunakan border yang memudar.
   `border-image: linear-gradient(to right, var(--color-primary), transparent) 1;`

3. **Noise Texture**:
   Opsional: Tambahkan overlay texture noise (opacity 2-3%) di atas background gelap untuk kesan industrial/metal yang lebih kuat.

## Rules
- **Layering**: Jangan menumpuk lebih dari 2 lapisan blur karena akan menurunkan performa (FPS drop) di perangkat mobile lama.
- **Contrast**: Pastikan text di atas panel glass memiliki kontras yang cukup (selalu gunakan text putih/light untuk background gelap).
- **Consistency**: Jangan gunakan border radius yang berbeda-beda dalam satu halaman.


# Theme Philosophy: Strict Light vs Dark Mode Spec

Aplikasi Kohi Sekai mendukung dua tema dengan aturan tegas:
1. **Light Mode (White Mode)**:
   - **Background Utama**: Putih / abu-abu sangat muda bersih (`#f8faf9` / `#ffffff`).
   - **Kartu & Surface**: Harus **PUTIH SOLID** (`bg-white` / `#ffffff`) dengan border tipis terang (`border-gray-100` / `border-gray-200`).
   - **Teks**: Wajib **HITAM / SLATE GELAP** (`#0f172a`, `#1a1a1a`, `#334155`).
   - **DILARANG**: Memasang background gelap/kusam atau text putih transparan saat Light Mode aktif.
2. **Dark Mode (Metal Black Mode)**:
   - **Background Utama**: Deep Metal Dark (`#090d16` / `#060911`).
   - **Kartu & Surface**: Glassmorphism gelap (`#111726` / `hsla(240, 10%, 12%, 0.7)`) dengan border tipis transparan (`border-white/10`).
   - **Teks**: Wajib **PUTIH CERAH** (`#ffffff`, `#f4f4f5`, `#cbd5e1`).
   - **Accent Highlight**: Neon emerald glow (`#079108`, `hsl(180, 100%, 45%)`).


# Animation & Transition Guidelines

Kohi Sekai menggunakan `framer-motion` untuk menghidupkan antarmuka.

## Page Transitions
Setiap pergantian halaman harus terasa halus.

```javascript
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

// Usage
<motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
  {content}
</motion.div>
```

## Micro-Interactions
1. **Buttons**:
   - Hover: `scale: 1.05`, `brightness: 1.1`.
   - Tap: `scale: 0.95`.
2. **Lists (Stagger)**:
   - Item dalam list harus muncul satu per satu dengan delay singkat (`staggerChildren`).
3. **Modals**:
   - Muncul dari tengah dengan efek `spring` (damping: 20, stiffness: 300).

## Rules
- **Duration**: Gunakan durasi singkat (`0.2s` - `0.4s`). Animasi yang terlalu lambat akan membuat aplikasi terasa berat.
- **Easing**: Selalu gunakan `easeOut` atau `easeInOut`. Hindari linear animation kecuali untuk loader.
- **Accessibility**: Jika user mengaktifkan "Reduce Motion" di OS, pastikan aplikasi tetap berfungsi tanpa animasi yang mengganggu.


# Responsive Breakpoints

Aplikasi ini wajib mendukung berbagai ukuran layar dengan pendekatan **Mobile-First**.

## Breakpoints (Standard)
- **Mobile**: `< 640px` (Default)
- **Tablet**: `640px - 1024px`
- **Desktop**: `> 1024px`
- **Ultra-Wide**: `> 1536px`

## Implementation Rules
1. **CSS Media Queries**:
   ```css
   /* Mobile Default */
   .container { padding: 1rem; }

   /* Desktop */
   @media (min-width: 1024px) {
     .container { padding: 2rem; }
   }
   ```

2. **Mobile-Specific Tweaks**:
   - **Touch Targets**: Semua tombol minimal berukuran `44x44px`.
   - **Sidebar**: Di mobile, sidebar harus berubah menjadi drawer atau bottom navigation.
   - **Font Size**: Hindari penggunaan font di bawah `12px` agar tetap terbaca.

3. **Scaling Strategy**:
   - Gunakan unit `rem` atau `em` daripada `px` untuk font dan spacing agar mengikuti pengaturan zoom browser.
   - Gunakan `flexbox` dan `grid` untuk layout yang fleksibel.

4. **Digital Receipt Scaling**:
   - Khusus komponen Receipt, gunakan `transform: scale()` atau `container queries` untuk memastikan struk selalu muat di layar mobile tanpa terpotong.


# Admin Dashboard Layout

Dashboard admin adalah pusat kendali operasional yang harus efisien dan informatif.

## Layout Components
1. **Locked Sidebar**: Sidebar navigasi harus tetap di posisinya (fixed) dan tidak ikut ter-scroll dengan konten utama.
2. **Top Stats Bar**: Ringkasan cepat (Total Order Pending, Total Pendapatan Hari Ini, Stock Low).
3. **Main Content Area**: Menggunakan sistem Tab untuk berpindah antar modul (Orders, Products, Members, Events).
4. **Action Modals**: Form tambah/edit data selalu dalam bentuk modal glassmorphism.

## Interactive Tables
- **Sorting & Filtering**: Semua kolom tabel harus bisa diurutkan. Filter status (e.g., "Hanya Tampilkan Pending") sangat penting.
- **Quick Action**: Tombol "Verify Payment" atau "Reject" harus mudah dijangkau.
- **Custom Select**: Gunakan `CustomSelect` dropdown dengan smart positioning (agar tidak terpotong di baris paling bawah tabel).

## Rules
1. **Consistency**: Dashboard harus menggunakan branding "Kawaii Metal" yang sama dengan public site.
2. **Responsiveness**: Meskipun admin biasanya di desktop, dashboard harus tetap fungsional di tablet/smartphone untuk pengecekan darurat.
3. **Security**: Pastikan semua aksi CRUD di dashboard memvalidasi token admin.


# Error Handling & Toast Notifications

Memberikan feedback yang jelas adalah kunci user experience yang baik, terutama saat terjadi kegagalan sistem.

## Global Toast System
Gunakan utilitas di `src/lib/toast.jsx`. Hindari penggunaan `alert()` bawaan browser.

- **Success**: Untuk aksi yang berhasil (e.g., "Order berhasil dibuat!"). Warna: Hijau/Teal.
- **Error**: Untuk kegagalan (e.g., "Gagal mengunggah gambar"). Warna: Merah/Pink.
- **Loading**: Untuk proses asinkron panjang (e.g., "Sedang memproses pembayaran...").

## HTTP & DB Error Handling
Setiap panggilan API Supabase harus dibungkus dalam blok try-catch atau pengecekan objek `error`.

```javascript
const { error } = await supabase.from('orders').insert(data);
if (error) {
  showToast.error(`Kesalahan: ${error.message}`);
  // Log error secara internal jika perlu
  return;
}
```

## Error Boundaries
- Gunakan React Error Boundary untuk menangkap crash di level komponen agar tidak merusak seluruh aplikasi.
- Tampilkan halaman "Oops!" yang estetik dengan tombol "Muat Ulang Halaman".

## Rules
1. **User Friendly**: Jangan tampilkan kode error teknis yang membingungkan user (e.g., "PostgreSQL Error 42P01"). Terjemahkan menjadi bahasa yang dimengerti (e.g., "Terjadi masalah pada server kami").
2. **Persistence**: Toast sukses boleh menghilang otomatis dalam 3 detik. Toast error sebaiknya bertahan lebih lama atau memiliki tombol "Close" manual.
3. **Accessibility**: Pastikan notifikasi terbaca oleh screen reader.
4. **Validation**: Berikan pesan error spesifik pada tiap field form daripada satu pesan umum di atas halaman.


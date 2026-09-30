# Project Manifesto & AI Vibe Coding Guidelines: Refresh Breeze

## Core Vision
Refresh Breeze adalah platform manajemen dan shopping yang didesain khusus untuk komunitas idol dan fan, dengan fokus pada pengalaman yang premium, cepat, dan berkarakter. Project ini bukan sekadar CMS, melainkan perpanjangan dari identitas brand "Refresh Breeze".

## Brand Identity: "Kawaii Metal"
Desain Refresh Breeze mengusung tema **Kawaii Metal**. Ini berarti perpaduan antara elemen yang memikat/cantik (*kawaii*) dengan estetika yang tajam, industrial, dan premium (*metal*).
- **Kawaii**: Penggunaan warna pastel dan neon yang cerah (pink, teal, gold, purple), tata letak ramah, dan interaksi yang halus.
- **Metal**: Penggunaan Glassmorphism, border tajam, background gelap yang dalam, dan efek pencahayaan neon halus.

## Core Values
1. **Premium Aesthetics**: Setiap halaman harus membuat user merasa menggunakan aplikasi kelas atas. Tidak boleh terlihat seperti template generik.
2. **Speed & Reliability**: Interaksi harus instan. Penggunaan Supabase Realtime dan optimasi gambar Sharp (WebP) sangat kritikal.
3. **Mobile First**: Karena basis user mayoritas menggunakan smartphone, tampilan mobile adalah prioritas utama tanpa mengorbankan kualitas desktop.
4. **Emotional Connection**: Fitur seperti Digital Receipt dan IG Story Sharing bertujuan untuk meningkatkan koneksi emosional antara fan dan brand.

## Key Features
- **Smart Shopping**: Sistem checkout yang efisien untuk Cheki dan Merchandise.
- **Digital Collectibles**: Digital Receipt yang bisa dipersonalisasi dan dikoleksi.
- **Admin Command Center**: Dashboard manajemen event, member (Full CMS), dan order yang realtime.
- **Dual-Photo System**: Pengelolaan foto profil idol dan foto pajangan kartu 2-Shot Cheki di shop secara independen.

---

# Brand Identity Guide

## Color Palette (HSL Focused)
Gunakan format HSL untuk fleksibilitas opacity dan glassmorphism.

| Role | HSL / Value | Usage |
| :--- | :--- | :--- |
| **Primary** | `hsl(330, 100%, 70%)` | Accent color, buttons, highlights (Pink Kawaii). |
| **Secondary** | `hsl(180, 100%, 45%)` | Secondary accents, success states (Teal Breeze). |
| **Background** | `hsl(240, 10%, 4%)` | Deep dark background (Metal). |
| **Surface** | `hsla(240, 10%, 10%, 0.7)` | Glassmorphism base layer. |
| **Border** | `hsla(0, 0%, 100%, 0.1)` | Subtle borders for glass effect. |

## Typography
- **Primary Font**: `Outfit` atau `Inter` (Sans-serif) untuk kejelasan dan kesan modern.
- **Accent Font**: `Space Grotesk` (untuk headline yang berkarakter "Metal").
- **Rules**:
  - Headline selalu `font-weight: 700` atau lebih.
  - Body text minimal `14px` di mobile.

## Solid Color & Anti-Blur Specification (WAJIB DIPATUHI)
- **DILARANG MENGGUNAKAN GRADIENT**: Seluruh elemen (tombol, kartu, aksen, background, dan teks) **DILARANG** menggunakan `bg-gradient-*` atau `linear-gradient(...)`. Wajib menggunakan **SOLID COLOR** yang tegas dan presisi (misal: `bg-primary`, `bg-surface`, `bg-background`).
- **DILARANG MENGGUNAKAN BACKGROUND BLUR**: Seluruh komponen (modal overlay, navbar, dropdown, toast, alert/webalert) **DILARANG** menggunakan `backdrop-blur-*` atau `backdrop-filter: blur(...)`. Gunakan solid background yang bersih (misal: overlay modal menggunakan `bg-black/90` atau `bg-black/85` solid).
- **RESPONSIF MANUAL (BUKAN OTOMATIS)**: Projek ini **TIDAK** menggunakan responsif otomatis serabutan. Wajib menulis kode manual khusus terpisah untuk Mobile (`md:hidden`) dan Desktop (`hidden md:block` / `hidden md:flex` atau conditional logic terpisah) agar layout mobile dan desktop memiliki presisi tata letak yang sempurna.

## Visual Elements
- **Icons**: Gunakan `react-icons/fa` atau `lucide-react` dengan stroke bersih.
- **Colors**: Solid colors only. Tidak boleh ada gradien warna.
- **Animations**: Gunakan `framer-motion` untuk transisi halaman dan interaksi tombol.
- **No Emojis Policy**: Jangan gunakan emoji pada judul tombol, nama tab, modal, kartu, atau teks UI. Gunakan icon SVG profesional.

---

# AI Vibe Coding Protocol (SOP)

Sebagai AI Coding Assistant, ikuti protokol ini untuk menjaga integritas project RB Remake:

## 1. Pre-Coding Check
Sebelum mengubah kode:
- Periksa `CLAUDE.md`, `ARCHITECTURE.md`, dan dokumentasi terkait.
- Mengecek file `.env` dan `package.json` untuk memahami dependensi.
- Memastikan tidak ada breaking changes pada sistem database Supabase.

## 2. Coding Standards
- **Atomic Edits**: Ubah bagian yang diperlukan saja. Jangan menulis ulang seluruh file jika hanya satu fungsi yang berubah.
- **Consistency**: Gunakan gaya penulisan yang sudah ada.
- **No Placeholders**: Jangan gunakan URL gambar dummy tak berizin. Gunakan asset lokal yang valid atau fallback ke `/images/members/placeholder.svg`.
- **No Modals for Core CMS**: Gunakan layout Full Page Editor di dalam tab Admin untuk entitas utama (Members, Events, Merch).
- **Dual Photo Support**: Selalu dukung `image_url` (profil) dan `shop_image_url` (shop tiket 2-shot) pada entitas member.

## 3. UI/UX Integrity
- Setiap komponen baru wajib memiliki desain Glassmorphism dan Responsive.
- Pastikan interaksi terasa hidup dengan micro-animations.
- Gunakan utility toast yang sudah ada (`src/lib/toast.jsx`) untuk notifikasi status.

## 4. Reporting
Setelah melakukan perubahan, berikan ringkasan:
- Apa yang diubah?
- Mengapa diubah (Rationale)?
- Apa efeknya terhadap komponen lain?

## 5. Restrictions (Larangan)
- **DILARANG** menggunakan emoji pada tombol atau judul UI.
- **DILARANG** mengubah konfigurasi CSS global (`index.css`) tanpa instruksi eksplisit.
- **DILARANG** menghapus kolom database produksi yang aktif tanpa strategi migrasi.

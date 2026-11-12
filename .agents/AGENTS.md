# Project Manifesto & AI Vibe Coding Guidelines: Kohi Sekai

## Core Vision
Kohi Sekai adalah platform manajemen dan shopping yang didesain khusus untuk komunitas idol dan fan, dengan fokus pada pengalaman yang premium, cepat, elegan, dan berkarakter. Project ini bukan sekadar CMS, melainkan perpanjangan dari identitas brand "Kohi Sekai" (Dunia Kopi).

## Brand Identity: "Deep Coffee Metal"
Desain Kohi Sekai mengusung tema **Deep Coffee Metal**. Perpaduan antara kehangatan nuansa kopi (*warm espresso, crema amber, latte cream*) dengan ketegasan estetika industrial (*metal, dark borders, solid surfaces*).
- **Deep Coffee**: Latar belakang espresso gelap, permukaan coklat dalam, aksen amber hangat, dan tipografi krem yang nyaman dibaca.
- **Metal Industrial**: Border tegas, kartu presisi, kontras solid tajam, dan micro-interactions yang mulus tanpa efek kabur.

## Core Values
1. **Monochromatic & Focused**: Desain bersih, berwibawa, dan elegan. Tidak warna-warni seperti pelangi.
2. **Speed & Reliability**: Interaksi instan. Integrasi Supabase Realtime dan optimasi gambar Sharp (WebP) yang sangat cepat.
3. **Mobile First**: Prioritas tata letak mobile dengan pemisahan manual desktop yang presisi (`md:hidden` vs `hidden md:flex`).
4. **Emotional Connection**: Digital Collectible Receipt yang bisa dipersonalisasi dan dikoleksi oleh para fans.

---

# Aturan Ketat Warna (Anti Warna-Warni)

## Prinsip Penggunaan Warna (WAJIB DIPATUHI)
Web Kohi Sekai **BUKAN** web warna-warni. Penggunaan warna di luar palet dasar kopi **DIKURANGI SECARA KETAT** dan **HANYA DIIZINKAN UNTUK STATUS FUNGSIONAL**:

| Status / Peruntukan | Warna Resmi | Contoh Penggunaan |
| :--- | :--- | :--- |
| **Merah (Danger)** | `#D65656` / `red-400` | Tombol Hapus, Status Gagal, Status Dibatalkan, Tanda Wajib (`*`). |
| **Hijau (Success)** | `#6FAE73` / `emerald-400` | Status Sukses, Paid, Lunas, Selesai, Terverifikasi, Barang Sampai. |
| **Kuning / Amber (Warning)** | `#E5A93C` / `amber-300` | Status Pending, Menunggu Verifikasi, Menunggu Pembayaran. |
| **Ungu (Special Only)** | `#A855F7` / `purple-400` | **HANYA** untuk fitur bertema SPESIAL (Special Stage, Special Cheki, Event Spesial). Dilarang untuk hal reguler, dan dilarang menggunakan warna lain (seperti pink) untuk Special. |
| **Brand Primary (Accent)** | `#E8944A` / `var(--primary)` | Satu-satunya warna aksen brand: Tombol CTA aktif, link highlight, tab terpilih, total harga. |
| **Netral / Neutral Tags** | `bg-surface` / `bg-background` | **SEMUA** badge non-status (OTS Venue, PO Online, Admin Input, Order Sendiri, Apparel, Aksesoris, dll). |

### Larangan Keras Warna (STRICT RESTRICTION):
- **DILARANG** menggunakan warna pelangi (biru/sky, cyan, teal, pink/magenta) untuk badge, kategori, tab, border, kartu, atau teks biasa.
- **DILARANG** menggunakan warna selain Ungu (`#A855F7` / `purple-400` / `purple-500`) untuk Special Event, Special Stage, atau Cheki Spesial.
- **DILARANG** menggunakan warna Ungu untuk elemen reguler non-spesial (gunakan token netral atau primary).
- **DILARANG** memberi warna berbeda-beda pada setiap tab (misal tab OTS kuning, PO biru, Merch hijau). Semua tab aktif WAJIB menggunakan satu warna brand yang sama (`bg-[var(--primary)] text-white`).
- **DILARANG** memberi border/garis warna-warni pada sisi card (misal garis atas hijau, ungu, atau biru). Gunakan pembatas netral (`bg-border`).

---

# Brand Identity Guide

## Color Palette (Design Tokens)

| Role | Token | Hex / Value | Usage |
| :--- | :--- | :--- | :--- |
| **Background** | `--background` | `#1A1512` | Deep Espresso Dark Background. |
| **Surface** | `--surface` | `#241E19` | Dark Coffee Card & Container Surface. |
| **Border** | `--border` | `#3A2E24` | Subtle Coffee Border & Divider. |
| **Primary** | `--primary` | `#E8944A` | Warm Amber Coffee (Brand Action & Highlight). |
| **Text Primary** | `--text-primary` | `#F5E6D3` | Warm Cream Light Text. |
| **Text Secondary** | `--text-secondary`| `#B0A599` | Muted Coffee Secondary Text. |
| **Success** | `--success` | `#6FAE73` | Status Berhasil / Lunas / Selesai. |
| **Warning** | `--warning` | `#E5A93C` | Status Pending / Menunggu Verifikasi. |
| **Danger** | `--danger` | `#D65656` | Status Gagal / Dibatalkan / Tombol Hapus. |

## Solid Color & Anti-Blur Specification (WAJIB DIPATUHI)
- **DILARANG MENGGUNAKAN GRADIENT**: Seluruh elemen (tombol, kartu, aksen, background, dan teks) **DILARANG** menggunakan `bg-gradient-*` atau `linear-gradient(...)`. Wajib menggunakan **SOLID COLOR** yang tegas dan presisi (misal: `bg-primary`, `bg-surface`, `bg-background`).
- **DILARANG MENGGUNAKAN BACKGROUND BLUR / GLASSMORPHISM**: Seluruh komponen (modal overlay, navbar, dropdown, toast, alert/webalert) **DILARANG** menggunakan `backdrop-blur-*` atau `backdrop-filter: blur(...)`. Gunakan solid background yang bersih (misal: overlay modal menggunakan `bg-black/90` solid).
- **RESPONSIF MANUAL (BUKAN OTOMATIS)**: Projek ini **TIDAK** menggunakan responsif otomatis serabutan. Wajib menulis kode manual khusus terpisah untuk Mobile (`md:hidden`) dan Desktop (`hidden md:block` / `hidden md:flex` atau conditional logic terpisah) agar layout mobile dan desktop memiliki presisi tata letak yang sempurna.

## Visual Elements
- **Icons**: Gunakan `react-icons/fa` atau `lucide-react` dengan stroke bersih.
- **Colors**: Solid coffee colors only. Warna fungsional hanya merah, hijau, kuning.
- **Animations**: Gunakan `framer-motion` untuk transisi halaman dan interaksi modal.
- **No Emojis Policy**: Dilarang menggunakan emoji pada judul tombol, nama tab, modal, kartu, atau teks UI. Gunakan icon SVG profesional.

---

# AI Vibe Coding Protocol (SOP)

Sebagai AI Coding Assistant, ikuti protokol ini untuk menjaga integritas project Kohi Sekai:

## 1. Pre-Coding Check
Sebelum mengubah kode:
- Periksa `CLAUDE.md`, `docs/COLOR-PALETTE.md`, `docs/UI-GUIDELINES.md`, dan dokumentasi terkait.
- Memastikan tidak ada hardcode warna pelangi atau inline style di luar token resmi.

## 2. Coding Standards
- **Atomic Edits**: Ubah bagian yang diperlukan saja. Jangan menulis ulang seluruh file jika hanya satu fungsi yang berubah.
- **Consistency**: Gunakan gaya penulisan yang sudah ada dan ikuti palet warna token.
- **No Placeholders**: Jangan gunakan URL gambar dummy tak berizin. Gunakan asset lokal yang valid atau fallback ke `/images/members/placeholder.svg`.
- **No Modals for Core CMS**: Gunakan layout Full Page Editor di dalam tab Admin untuk entitas utama (Members, Events, Merch).
- **Dual Photo Support**: Selalu dukung `image_url` (profil) dan `shop_image_url` (shop tiket 2-shot) pada entitas member.

## 3. UI/UX Integrity
- Setiap komponen baru wajib memiliki desain solid color yang tajam dan responsif manual (`md:hidden` vs desktop).
- Pastikan interaksi terasa hidup dengan micro-animations tanpa mengorbankan performa.
- Gunakan utility toast resmi (`src/lib/toast.jsx` atau `src/components/ui/KohiToast.jsx`) untuk notifikasi status.

## 4. Restrictions (Larangan)
- **DILARANG** menggunakan warna-warni pelangi (purple, sky, cyan, teal, pink) untuk label dan badge biasa.
- **DILARANG** menggunakan gradient warna.
- **DILARANG** menggunakan backdrop-blur / glassmorphism.
- **DILARANG** menggunakan emoji pada tombol atau judul UI.
- **DILARANG** menghapus kolom database produksi yang aktif tanpa strategi migrasi.

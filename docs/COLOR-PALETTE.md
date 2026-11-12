# Kohi Sekai — Color Palette & Anti-Rainbow Specification

Dokumen ini adalah **Source of Truth** untuk seluruh styling warna antarmuka pengguna (UI) Kohi Sekai. Semua komponen dan styling wajib menggunakan design token resmi di bawah ini (CSS variables), **DILARANG** hardcode hex atau menambahkan warna pelangi tanpa alasan status fungsional.

---

## 1. Design Tokens Utama (Deep Coffee Metal)

| Token | Hex | Kegunaan |
|---|---|---|
| `--background` | `#1A1512` | Background utama — Espresso tua gelap |
| `--surface` | `#241E19` | Background card / container — Coklat gelap solid |
| `--border` | `#3A2E24` | Garis pembatas / divider netral |
| `--primary` | `#E8944A` | Warna utama brand (tombol aksi aktif, highlight, aksen hangat) |
| `--text-primary` | `#F5E6D3` | Teks utama — Krem terang |
| `--text-secondary` | `#B0A599` | Teks sekunder / caption — Coklat muda muted |

---

## 2. Warna Semantik Status (Hanya Jika Sangat Penting)

Penggunaan warna lain di luar palet kopi di atas **DIKURANGI SECARA KETAT** dan **HANYA DIGUNAKAN UNTUK STATUS FUNGSIONAL**:

| Status | Token / Class | Hex | Kegunaan & Contoh |
|---|---|---|---|
| **Sukses / Lunas** | `--success` / `emerald-400` | `#6FAE73` | Status Paid, Lunas, Selesai, Terverifikasi, Barang Sampai. |
| **Pending / Proses** | `--warning` / `amber-300` | `#E5A93C` | Status Pending, Menunggu Verifikasi, Menunggu Pembayaran. |
| **Danger / Hapus** | `--danger` / `red-400` | `#D65656` | Tombol Hapus, Status Dibatalkan, Status Gagal, Tanda Wajib (`*`). |
| **Special Only** | `--accent` / `purple-400` / `purple-500` | `#A855F7` | **KHUSUS & EKSKLUSIF** untuk Special Stage, Special Event, Cheki Spesial. Dilarang untuk hal reguler, dan dilarang memakai pink untuk spesial. |

> [!IMPORTANT]
> **ATURAN ANTI WARNA-WARNI & IDENTITAS SPESIAL**:
> Selain 3 status fungsional di atas (Merah, Hijau, Kuning), 1 warna eksklusif Special (Ungu `#A855F7`), dan 1 aksen brand (Amber `--primary`), **DILARANG** menggunakan warna pelangi seperti:
> - **Ungu / Purple**: DILARANG untuk elemen reguler non-spesial (seperti OTS Venue reguler, QRIS, secret member). Ungu HANYA dan EKSKLUSIF untuk Special.
> - **Pink / Magenta**: DILARANG KERAS di seluruh web (jangan gunakan untuk Special, gunakan Ungu).
> - **Biru / Sky / Cyan**: Dilarang untuk badge PO, Order Sendiri, Kurir, Bukti Bayar, atau teks kontak.
> - **Teal / Mint**: Dilarang untuk tab Merchandise atau badge pakaian.
> 
> Semua badge dan label non-status (seperti *OTS Venue*, *Pre-Order*, *Admin Input*, *Order Sendiri*, *Merchandise*, *Apparel*, *Aksesoris*) **WAJIB** menggunakan warna netral:
> `bg-[var(--surface)]` / `bg-[var(--background)]`, border `var(--border)`, dan teks netral `var(--text-secondary)`.

---

## 3. Aturan Solid Color & Anti-Blur

1. **Dilarang Gradient**:
   - Seluruh elemen (tombol, card, container, teks, dan border) **DILARANG** menggunakan `bg-gradient-*` atau `linear-gradient(...)`.
   - Wajib menggunakan warna solid flat yang tegas.
2. **Dilarang Background Blur (Glassmorphism)**:
   - Dilarang menggunakan `backdrop-blur-*` atau `backdrop-filter: blur(...)`.
   - Gunakan solid background yang bersih (misal overlay modal menggunakan `bg-black/90` solid).
3. **Dilarang Garis Aksen Berwarna di Card**:
   - Dilarang memberi garis/border warna-warni pada tepi atas/sisi card (misal `h-[2px] bg-emerald-500` atau `bg-purple-500`).
   - Gunakan garis netral `bg-border` atau biarkan card memiliki border solid menyeluruh yang seragam.
4. **Tab Konsisten (Satu Warna Brand)**:
   - Tombol tab aktif (misal All, OTS, PO, Merch) semuanya menggunakan warna brand yang sama (`bg-[var(--primary)] text-white`), tidak boleh setiap tab memiliki warna berbeda.

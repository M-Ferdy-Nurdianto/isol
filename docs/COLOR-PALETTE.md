# Kohi Sekai — Color Palette

Design tokens warna resmi untuk seluruh UI Kohi Sekai. Semua styling wajib pakai token ini (CSS variables), JANGAN hardcode hex color langsung di komponen.

## Light Mode
| Token | Hex | Kegunaan |
|---|---|---|
| --primary | #F0A868 | Warna utama brand (button, aksen, highlight) |
| --secondary | #F5E6D3 | Warna sekunder (background section, card muted) |
| --accent | #FF6B9D | Aksen tambahan (badge, notifikasi, hover state) |
| --background | #FFF9F2 | Background utama halaman |
| --surface | #FDF8F2 | Background card/komponen |
| --text-primary | #2B2420 | Teks utama |
| --text-secondary | #6B5D4F | Teks sekunder/caption |
| --border | #E8D9C5 | Garis pembatas/divider |
| --success | #7BC47F | Status berhasil |
| --danger | #E85D5D | Status error/gagal |

## Dark Mode (Admin Panel menggunakan skema ini)
| Token | Hex | Kegunaan |
|---|---|---|
| --primary | #E8944A | Warna utama brand — coklat/amber hangat |
| --secondary | #3A2E24 | Warna sekunder — espresso gelap |
| --accent | #FF85AC | Aksen tambahan — pink lembut |
| --background | #1A1512 | Background utama — espresso tua |
| --surface | #241E19 | Background card/komponen — coklat gelap |
| --text-primary | #F5E6D3 | Teks utama — krem terang |
| --text-secondary | #B0A599 | Teks sekunder/caption — coklat muda |
| --border | #3A2E24 | Garis pembatas/divider |
| --success | #6FAE73 | Status berhasil |
| --danger | #D65656 | Status error/gagal |

## Aturan Wajib
- Semua warna diakses lewat CSS variable/token di atas, tidak boleh hardcode hex baru di komponen.
- Tidak menggunakan efek glassmorphism (blur/transparansi kaca) — semua elemen pakai warna solid.
- Kalau butuh warna baru (belum ada di tabel ini), tambahkan dulu ke file ini sebelum dipakai di kode, lalu update tabel + implementasi CSS variable-nya.
- **DILARANG** hardcode warna lama seperti `#079108` (hijau lama), `#111726`, `#182032` di komponen baru maupun komponen yang direfactor. Ganti ke `var(--primary)` / token resmi.

## Aturan Aksen Visual
- DILARANG menggunakan garis/border gradient warna di sisi manapun (kiri, kanan, atas, bawah) pada card, section, atau komponen apapun di seluruh proyek.
- Semua border/divider wajib solid 1 warna dari design token (--border, --primary, dll), tidak boleh gradient dua warna dalam satu garis.
- Penekanan visual pada card penting dilakukan lewat kombinasi background --surface, ukuran, atau spacing — bukan garis aksen warna-warni.
- Icon dalam satu grup/section yang sejenis (misal 3 info card jadwal event) wajib pakai 1 warna icon yang sama, tidak boleh berbeda-beda warna tanpa makna status yang jelas.

## Catatan Admin Panel
Admin panel (`/admin`) menggunakan skema **Dark Mode (Deep Coffee)** secara tetap via class `.admin-layout` di CSS.
Semua komponen di dalam admin — termasuk tabel user, form OTS, modal detail — wajib menggunakan CSS variable di atas, bukan hardcode hex.

| Komponen | Warna yang benar | Warna LAMA (dilarang) |
|---|---|---|
| Tombol primary / CTA | `var(--primary)` | `#079108` |
| Background card/panel | `var(--surface)` | `#111726` |
| Background input | `var(--background)` | `#182032` |
| Teks utama | `var(--text-primary)` | `text-white` hardcode |
| Teks sekunder | `var(--text-secondary)` | `text-zinc-400` |
| Border/divider | `var(--border)` | `border-white/10` |
| Highlight/badge | `var(--primary)/15` (opacity) | `#079108/20` |

## Form OTS (Registrasi Akun Fan On-The-Spot)
- Form ditampilkan **inline di halaman** (bukan popup modal) — bisa di-toggle dengan tombol "Register OTS".
- Password tidak perlu diisi manual — digenerate otomatis dan dikirim via OTP ke email fan.
- Warna form mengikuti design token dark mode di atas (`var(--primary)` = coklat/amber, bukan hijau).

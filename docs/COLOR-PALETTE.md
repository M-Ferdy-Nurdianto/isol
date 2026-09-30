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

## Dark Mode
| Token | Hex | Kegunaan |
|---|---|---|
| --primary | #E8944A | Warna utama brand |
| --secondary | #3A2E24 | Warna sekunder |
| --accent | #FF85AC | Aksen tambahan |
| --background | #1A1512 | Background utama halaman |
| --surface | #241E19 | Background card/komponen |
| --text-primary | #F5E6D3 | Teks utama |
| --text-secondary | #B0A599 | Teks sekunder/caption |
| --border | #3A2E24 | Garis pembatas/divider |
| --success | #6FAE73 | Status berhasil |
| --danger | #D65656 | Status error/gagal |

## Aturan Wajib
- Semua warna diakses lewat CSS variable/token di atas, tidak boleh hardcode hex baru di komponen.
- Tidak menggunakan efek glassmorphism (blur/transparansi kaca) — semua elemen pakai warna solid.
- Kalau butuh warna baru (belum ada di tabel ini), tambahkan dulu ke file ini sebelum dipakai di kode, lalu update tabel + implementasi CSS variable-nya.

## Aturan Aksen Visual
- DILARANG menggunakan garis/border gradient warna di sisi manapun (kiri, kanan, atas, bawah) pada card, section, atau komponen apapun di seluruh proyek.
- Semua border/divider wajib solid 1 warna dari design token (--border, --primary, dll), tidak boleh gradient dua warna dalam satu garis.
- Penekanan visual pada card penting dilakukan lewat kombinasi background --surface, ukuran, atau spacing — bukan garis aksen warna-warni.
- Icon dalam satu grup/section yang sejenis (misal 3 info card jadwal event) wajib pakai 1 warna icon yang sama, tidak boleh berbeda-beda warna tanpa makna status yang jelas.


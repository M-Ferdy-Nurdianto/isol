# Kohi Sekai — UI & Visual Guidelines

Dokumen ini mendefinisikan aturan visual dan estetika antarmuka pengguna (UI) Kohi Sekai. Semua komponen dan halaman wajib mematuhi panduan ini.

## Aturan Aksen Visual
- **DILARANG** menggunakan garis/border gradient warna di sisi manapun (kiri, kanan, atas, bawah) pada card, section, atau komponen apapun di seluruh proyek.
- Semua border/divider wajib **solid 1 warna** dari design token (`--border`, `--primary`, dll), tidak boleh gradient dua warna dalam satu garis.
- Penekanan visual pada card penting dilakukan lewat kombinasi background `--surface`, ukuran, atau spacing — bukan garis aksen warna-warni.
- Icon dalam satu grup/section yang sejenis (misal 3 info card jadwal event) wajib pakai **1 warna icon yang sama**, tidak boleh berbeda-beda warna tanpa makna status yang jelas.

## Solid Colors & Anti-Glassmorphism
- Seluruh kartu, container, dan modal menggunakan warna solid flat (`bg-surface`, `bg-background`).
- Efek *glassmorphism* (`backdrop-blur-md`, transparansi kaca) dilarang digunakan untuk menjaga kontras dan performa visual yang tajam.

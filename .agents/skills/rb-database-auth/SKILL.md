---
name: rb-database-auth
description: Use when writing database schemas, Supabase auth, RLS policies, data fetching, or realtime features for RB Remake.
---

# Database Schema: Core Tables

## 1. `members`
Menyimpan data member idol/staff.
- `id`: UUID (Primary Key)
- `name`: Text
- `role`: Text (Member, Staff)
- `image_url`: Text
- `is_active`: Boolean

## 2. `events`
Data event yang sedang berlangsung atau mendatang.
- `id`: UUID
- `title`: Text
- `date`: Timestamp
- `location`: Text
- `theme_color`: Text (Hex/HSL untuk UI dinamis)
- `status`: Text (Active, Completed, Cancelled)

## 3. `merchandise`
Katalog produk non-cheki.
- `id`: UUID
- `name`: Text
- `price`: BigInt (Simpan dalam satuan terkecil, e.g., Rupiah)
- `stock`: Integer
- `image_url`: Text
- `category`: Text

## 4. `orders`
Data transaksi user.
- `id`: UUID
- `customer_name`: Text
- `customer_ig`: Text
- `total_price`: BigInt
- `payment_proof_url`: Text
- `status`: Text (Pending, Verified, Rejected)
- `created_at`: Timestamp


# Database Schema: Metadata & Utilities

## 1. `settings`
Konfigurasi global aplikasi.
- `key`: Text (Unique)
- `value`: JSONB (Menyimpan konfigurasi fleksibel)
- `description`: Text

## 2. `order_items`
Detail produk dalam satu order.
- `id`: UUID
- `order_id`: UUID (FK to `orders`)
- `item_type`: Text (Cheki, Merchandise)
- `item_id`: UUID
- `quantity`: Integer
- `price_at_purchase`: BigInt

## 3. `cheki_details`
Data spesifik untuk pesanan Cheki.
- `id`: UUID
- `order_item_id`: UUID
- `member_id`: UUID
- `pose_request`: Text
- `note`: Text

## 4. `system_logs`
Tracking aktivitas admin untuk audit.
- `id`: BigInt
- `admin_id`: UUID
- `action`: Text
- `details`: JSONB
- `created_at`: Timestamp


# Supabase RLS Policies

Keamanan data di Kohi Sekai diatur melalui **Row Level Security (RLS)** di PostgreSQL.

## Aturan Umum
- **Public**: Hanya memiliki akses `SELECT` pada tabel yang bersifat publik (Members, Events, Merchandise).
- **Authenticated (Admin)**: Memiliki akses penuh (`ALL`) untuk manajemen data.
- **Anon**: Tidak boleh melakukan `DELETE` atau `UPDATE` pada tabel apapun tanpa token khusus.

## Detail Kebijakan Per Tabel

### `members`, `events`, `merchandise`
- `SELECT`: `true` (Semua orang bisa lihat).
- `INSERT/UPDATE/DELETE`: `auth.role() == 'authenticated'`.

### `orders`
- `INSERT`: `true` (User bisa kirim pesanan tanpa login).
- `SELECT`: `auth.role() == 'authenticated'` (Hanya admin yang bisa lihat semua order).
- *Catatan*: User bisa melihat order sendiri jika diimplementasikan sistem `order_token`.

### `settings`
- `SELECT`: `true`.
- `UPDATE`: `auth.role() == 'authenticated'`.

## Penting
Setiap kali menambahkan tabel baru, AI **wajib** menyarankan pembuatan kebijakan RLS untuk menghindari kebocoran data.


# Data Fetching Patterns

## Standard Fetching (Supabase Client)
Gunakan pola asinkron yang konsisten dengan penanganan error yang jelas.

```javascript
const fetchData = async () => {
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    showToast.error('Gagal mengambil data');
    console.error(error);
    return;
  }
  return data;
};
```

## Realtime Subscriptions
Untuk Dashboard Admin, gunakan channel Realtime untuk mendengarkan perubahan data.

```javascript
const subscription = supabase
  .channel('orders_channel')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
    console.log('Order baru masuk:', payload.new);
    showToast.success('Pesanan baru diterima!');
    // Update state atau refresh data
  })
  .subscribe();
```

## Rules
1. **Loading States**: Selalu sediakan skeleton atau spinner saat data sedang diambil.
2. **Error Handling**: Gunakan `src/lib/toast.jsx` untuk memberikan feedback visual ke user.
3. **Filtering**: Lakukan filtering di sisi server (Supabase) daripada di sisi client untuk efisiensi memory.
4. **Security**: Jangan pernah melakukan select `*` pada tabel yang mengandung data sensitif jika dikirim ke client publik.


# Realtime Monitoring System

Kohi Sekai mengandalkan Supabase Realtime untuk meminimalkan jeda operasional.

## Use Cases
1. **Order Notifications**: Dashboard Admin akan "berbunyi" atau memunculkan toast setiap ada pesanan baru yang masuk ke tabel `orders`.
2. **Inventory Sync**: Jika stok produk habis dibeli seorang user, tampilan stok di user lain harus otomatis berubah tanpa refresh.
3. **Event Updates**: Jika status event berubah menjadi "Completed", pendaftaran/pembelian terkait event tersebut harus otomatis tertutup di semua client.

## Technical Setup
```javascript
const channel = supabase
  .channel('public:orders')
  .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'orders' }, 
      payload => handleOrderChange(payload))
  .subscribe();
```

## Rules
1. **Performance**: Jangan melakukan `subscribe` pada terlalu banyak tabel sekaligus dalam satu halaman.
2. **Fallback**: Realtime hanyalah "pelengkap". Pastikan sistem tetap bisa berfungsi dengan fetching data manual jika koneksi WebSocket terputus.
3. **Visual Feedback**: Berikan indikasi visual (e.g., baris tabel yang berkedip pelan) saat ada data yang terupdate secara realtime agar admin sadar ada perubahan.


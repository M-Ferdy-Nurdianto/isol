-- ==============================================================================
-- MIGRASI: (A) OTS untuk User Login, (B) Luruskan Wide Cheki = 16:9 per Member,
--          (C) Cheki Grup (Semua Member) = Tipe Terpisah, Default OFF
-- Tanggal: 2026-10-02
-- ==============================================================================

-- 1. ════════════════════════════════════════════════════════════════════════
-- TAMBAH KOLOM `cheki_type` ke tabel `order_items`
--    Digunakan untuk membedakan tipe cheki per item:
--      'regular' = Regular Cheki per member
--      'wide'    = Wide Cheki (Polaroid 16:9) per member
--      'grup'    = Cheki Grup (foto bersama semua member)
--      NULL      = Data lama (backward compatible)
-- ════════════════════════════════════════════════════════════════════════
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS cheki_type VARCHAR(20);
COMMENT ON COLUMN order_items.cheki_type IS 'regular/wide/grup. Wide = Polaroid 16:9 per member. Grup = foto semua member. NULL = data lama.';
CREATE INDEX IF NOT EXISTS idx_order_items_cheki_type ON order_items(cheki_type);

-- Backfill untuk order_items LAMA yang namanya mengandung kata kunci → set cheki_type
-- (heuristik, tidak merusak data; aman rerun berulang)
UPDATE order_items SET cheki_type = 'grup'
WHERE cheki_type IS NULL
  AND (
    item_name ILIKE '%all member%' OR
    item_name ILIKE '%semua member%' OR
    item_name ILIKE '%grup%' OR
    item_name ILIKE '%group%' OR
    member_id IS NULL
  );

UPDATE order_items SET cheki_type = 'wide'
WHERE cheki_type IS NULL
  AND item_name ILIKE '%wide%'
  AND NOT (
    item_name ILIKE '%all member%' OR
    item_name ILIKE '%semua member%' OR
    item_name ILIKE '%grup%' OR
    item_name ILIKE '%group%'
  );

UPDATE order_items SET cheki_type = 'regular'
WHERE cheki_type IS NULL
  AND member_id IS NOT NULL
  AND item_name NOT ILIKE '%wide%';

-- 2. ════════════════════════════════════════════════════════════════════════
-- INSERT / UPDATE CONFIG KEYS BARU DAN DEFAULT HARGA
-- ════════════════════════════════════════════════════════════════════════

-- 2a. Pastikan toggle Regular & Wide Cheki ada (sudah ada di migrasi lama, jaga-jaga)
INSERT INTO config (key, value) VALUES
  ('regular_cheki_enabled', 'true'),
  ('wide_cheki_enabled',    'true')
ON CONFLICT (key) DO NOTHING;

-- 2b. ═══════ CHEKI GRUP (FOTO BERSAMA SEMUA MEMBER) — TIpe BARU, DEFAULT OFF ═══════
INSERT INTO config (key, value) VALUES
  ('cheki_grup_enabled',    'false'),
  ('harga_cheki_grup_po',   '150000'),
  ('harga_cheki_grup_ots',  '170000')
ON CONFLICT (key) DO NOTHING;

-- 2c. ═══════ UPDATE DEFAULT HARGA SESUAI PRICE LIST POSTER ═══════
--     Regular PO  : 40.000
--     Wide PO     : 70.000
--     Regular OTS : 40.000
--     Wide OTS    : 80.000
-- Hanya update jika masih nilai DEFAULT LAMA (bukan hasil edit admin manual).
-- Nilai "default lama" yang diketahui dari production-full-schema.sql:
--   harga_cheki_per_member = 30000
--   harga_cheki_grup       = 40000
--   harga_ots_per_member   = 35000
--   harga_ots_grup         = 45000
UPDATE config SET value = '40000' WHERE key = 'harga_cheki_per_member' AND value IN ('30000','0','');
UPDATE config SET value = '70000' WHERE key = 'harga_cheki_grup'       AND value IN ('40000','0','');
UPDATE config SET value = '40000' WHERE key = 'harga_ots_per_member'   AND value IN ('35000','25000','0','');
UPDATE config SET value = '80000' WHERE key = 'harga_ots_grup'         AND value IN ('45000','30000','0','');

-- 3. ════════════════════════════════════════════════════════════════════════
-- MEMPERBAIKI status AWAL order OTS dari user (BUKAN admin):
--    Sebelumnya default OTS = 'checked' (karena admin yang input dianggap lunas).
--    Untuk user, OTS harus 'pending' sampai admin konfirmasi.
--    Kita gunakan kolom `created_by` dan `is_ots` yang sudah ada:
--      is_ots=true + created_by='customer'  → USER OTS  (pending dulu)
--      is_ots=true + created_by='admin'     → ADMIN OTS (checked/lunas)
--    Tidak perlu kolom baru; penambahan logika ada di endpoint baru dan tampilan.
-- ════════════════════════════════════════════════════════════════════════
-- (Tidak ada perubahan skema; ini catatan dokumentasi migrasi.)

-- 4. ════════════════════════════════════════════════════════════════════════
-- INDEXES TAMBAHAN JIKA BELUM ADA
-- ════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by);
CREATE INDEX IF NOT EXISTS idx_orders_is_ots_created_by ON orders(is_ots, created_by);

-- ==============================================================================
-- END OF MIGRATION
-- ==============================================================================

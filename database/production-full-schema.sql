-- ==============================================================================
-- KOHI SEKAI - COMPREHENSIVE PRODUCTION DATABASE SCHEMA & MIGRATION SCRIPT
-- ==============================================================================
-- Siap diisi data Kohi Sekai dari nol.
-- Struktur tabel konsisten: members, events, orders, merchandise, faqs, config, admin_users.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TRIGGER HELPER FUNCTION (Auto Updated At)
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. TABLE: admin_users (Autentikasi Staf / Admin)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 3b. TABLE: fan_users (Profil Fans / Pembeli untuk Shop & Checkout)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS fan_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    whatsapp VARCHAR(50) NOT NULL,
    instagram VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_fan_users_email ON fan_users(email);
CREATE INDEX IF NOT EXISTS idx_fan_users_whatsapp ON fan_users(whatsapp);

-- Akun Default Utama Admin Kohi Sekai:
-- Username: admin / kohisekai123 (Hash bcrypt: $2b$10$w6D9tq1z923K7E2g7wJ7..p1W6s4N.u9eL)
INSERT INTO admin_users (username, password_hash, full_name)
VALUES (
    'admin', 
    '$2b$10$y5K7J1yY7o51LzZg6wT9veVqB6vj7bA6lJ7s3k6O1mXy1w8m2rXCe', 
    'Admin Kohi Sekai'
)
ON CONFLICT (username) DO NOTHING;

-- Akun cadangan staff
INSERT INTO admin_users (username, password_hash, full_name)
VALUES (
    'staff123', 
    '$2b$10$TjlmVrhJxPqN4MDp1PFuF.Igml6oft49WsvHBtRoMxJajTNGV1Xmy', 
    'Staff Kohi Sekai'
)
ON CONFLICT (username) DO NOTHING;

-- ==============================================================================
-- 4. TABLE: members (Member Profil & Dual Photo System)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id VARCHAR(50) UNIQUE NOT NULL,
    nama_panggung VARCHAR(100) NOT NULL,
    tagline VARCHAR(255),
    hadir BOOLEAN DEFAULT true,
    image_url TEXT,
    shop_image_url TEXT,
    color VARCHAR(20) DEFAULT '#EC4899',
    gradient VARCHAR(100),
    order_index INT DEFAULT 99,
    jikoshoukai TEXT,
    tanggal_lahir VARCHAR(50),
    hobi TEXT,
    instagram VARCHAR(100),
    is_secret BOOLEAN DEFAULT false,
    silhouette_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE members ADD COLUMN IF NOT EXISTS hadir BOOLEAN DEFAULT true;
ALTER TABLE members ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS shop_image_url TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT '#EC4899';
ALTER TABLE members ADD COLUMN IF NOT EXISTS gradient VARCHAR(100);
ALTER TABLE members ADD COLUMN IF NOT EXISTS order_index INT DEFAULT 99;
ALTER TABLE members ADD COLUMN IF NOT EXISTS jikoshoukai TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS tanggal_lahir VARCHAR(50);
ALTER TABLE members ADD COLUMN IF NOT EXISTS hobi TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS instagram VARCHAR(100);
ALTER TABLE members ADD COLUMN IF NOT EXISTS is_secret BOOLEAN DEFAULT false;
ALTER TABLE members ADD COLUMN IF NOT EXISTS silhouette_image_url TEXT;

DROP TRIGGER IF EXISTS update_members_updated_at ON members;
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Entitas grup dasar untuk Kohi Sekai
INSERT INTO members (member_id, nama_panggung, tagline, hadir, color, order_index, jikoshoukai, instagram)
VALUES (
    'group',
    'Kohi Sekai',
    'Indonesian Japanese-Style Idol Group',
    true,
    '#EC4899',
    999,
    'Kohi Sekai adalah grup idola yang membawa aroma kehangatan dan energi ceria untuk semua penggemar.',
    '@kohisekai'
)
ON CONFLICT (member_id) DO NOTHING;

-- ==============================================================================
-- 5. TABLE: member_gallery (Galeri Foto Profil Member)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS member_gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 6. TABLE: events (Jadwal Event & Special Event)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(255) NOT NULL,
    tanggal INT NOT NULL,
    bulan VARCHAR(50) NOT NULL,
    tahun INT NOT NULL,
    lokasi TEXT NOT NULL,
    event_time VARCHAR(50),
    cheki_time VARCHAR(50),
    is_past BOOLEAN DEFAULT false,
    is_special BOOLEAN DEFAULT false,
    type VARCHAR(50) DEFAULT 'regular',
    theme_name VARCHAR(100),
    theme_color VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE events ADD COLUMN IF NOT EXISTS event_time VARCHAR(50);
ALTER TABLE events ADD COLUMN IF NOT EXISTS cheki_time VARCHAR(50);
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_past BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_special BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'regular';
ALTER TABLE events ADD COLUMN IF NOT EXISTS theme_name VARCHAR(100);
ALTER TABLE events ADD COLUMN IF NOT EXISTS theme_color VARCHAR(20);

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 7. TABLE: event_lineup (Relasi Member yang Tampil di Event)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS event_lineup (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, member_id)
);

-- ==============================================================================
-- 8. TABLE: event_gallery (Galeri Dokumentasi Event)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS event_gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    tipe VARCHAR(50),
    path TEXT NOT NULL,
    kredit VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 9. TABLE: orders (Transaksi Pemesanan Tiket Cheki Online & OTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    nama_lengkap VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    instagram VARCHAR(100),
    total_harga INT NOT NULL,
    payment_proof_url TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    is_ots BOOLEAN DEFAULT false,
    created_by VARCHAR(50) DEFAULT 'customer',
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_ots BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_by VARCHAR(50) DEFAULT 'customer';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS catatan TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 10. TABLE: order_items (Detail Item Tiket per Transaksi)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    price INT NOT NULL,
    quantity INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 11. TABLE: merchandise (Katalog Merchandise Resmi)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS merchandise (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    harga INT NOT NULL,
    stok INT DEFAULT 0,
    gambar_url TEXT,
    available BOOLEAN DEFAULT true,
    urutan INT DEFAULT 0,
    sizes JSONB,
    size_chart_urls JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE merchandise ADD COLUMN IF NOT EXISTS sizes JSONB;
ALTER TABLE merchandise ADD COLUMN IF NOT EXISTS size_chart_urls JSONB;
ALTER TABLE merchandise ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT true;
ALTER TABLE merchandise ADD COLUMN IF NOT EXISTS urutan INT DEFAULT 0;

DROP TRIGGER IF EXISTS update_merchandise_updated_at ON merchandise;
CREATE TRIGGER update_merchandise_updated_at BEFORE UPDATE ON merchandise
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 12. TABLE: merch_orders (Pesanan Merchandise)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS merch_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    nama_lengkap VARCHAR(255),
    whatsapp VARCHAR(100) NOT NULL,
    instagram VARCHAR(100),
    catatan TEXT,
    total_harga INT NOT NULL DEFAULT 0,
    payment_proof_url TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_merch_orders_updated_at ON merch_orders;
CREATE TRIGGER update_merch_orders_updated_at BEFORE UPDATE ON merch_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 13. TABLE: merch_order_items (Detail Item Merchandise per Pesanan)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS merch_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merch_order_id UUID REFERENCES merch_orders(id) ON DELETE CASCADE,
    merchandise_id UUID REFERENCES merchandise(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    harga INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    size VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 14. TABLE: config (Pengaturan Web, Harga PO & OTS, Rekening, Maintenance, Hero)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_config_updated_at ON config;
CREATE TRIGGER update_config_updated_at BEFORE UPDATE ON config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Nilai Konfigurasi Awal Kohi Sekai
INSERT INTO config (key, value)
VALUES 
    ('harga_cheki_per_member', '30000'),
    ('harga_cheki_grup', '40000'),
    ('harga_ots_per_member', '35000'),
    ('harga_ots_grup', '45000'),
    ('payment_bank', 'BCA'),
    ('payment_rekening', '1234567890'),
    ('payment_atas_nama', 'Kohi Sekai Official'),
    ('maintenance_mode', 'false'),
    ('maintenance_message', ''),
    ('maintenance_estimated_end', '')
ON CONFLICT (key) DO NOTHING;

-- ==============================================================================
-- 15. TABLE: faqs (Pertanyaan Umum & Jawaban)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tanya TEXT NOT NULL,
    jawab TEXT NOT NULL,
    urutan INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_faqs_updated_at ON faqs;
CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON faqs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 16. INDEXES UNTUK KINERJA TINGGI (PERFORMANCE & SCALABILITY)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_members_member_id ON members(member_id);
CREATE INDEX IF NOT EXISTS idx_members_hadir ON members(hadir);
CREATE INDEX IF NOT EXISTS idx_member_gallery_member_id ON member_gallery(member_id);

CREATE INDEX IF NOT EXISTS idx_events_is_past ON events(is_past);
CREATE INDEX IF NOT EXISTS idx_events_is_special ON events(is_special);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(tahun DESC, tanggal DESC);

CREATE INDEX IF NOT EXISTS idx_event_lineup_event ON event_lineup(event_id);
CREATE INDEX IF NOT EXISTS idx_event_lineup_member ON event_lineup(member_id);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_event_id ON orders(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_is_ots ON orders(is_ots);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_member_id ON order_items(member_id);

CREATE INDEX IF NOT EXISTS idx_merch_available ON merchandise(available);
CREATE INDEX IF NOT EXISTS idx_merch_orders_status ON merch_orders(status);
CREATE INDEX IF NOT EXISTS idx_merch_orders_created ON merch_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_merch_order_items_order ON merch_order_items(merch_order_id);

-- ==============================================================================
-- 17. SUPABASE STORAGE BUCKETS SETUP
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('members', 'members', true),
    ('products', 'products', true),
    ('receipts', 'receipts', true),
    ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- ==============================================================================
-- 18. ROW LEVEL SECURITY (RLS) & ACCESS POLICIES
-- ==============================================================================
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_lineup ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchandise ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE merch_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE merch_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Members & Gallery
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'members' AND policyname = 'Allow public read members') THEN
        CREATE POLICY "Allow public read members" ON members FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_gallery' AND policyname = 'Allow public read member_gallery') THEN
        CREATE POLICY "Allow public read member_gallery" ON member_gallery FOR SELECT USING (true);
    END IF;

    -- Events, Lineup & Gallery
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Allow public read events') THEN
        CREATE POLICY "Allow public read events" ON events FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_lineup' AND policyname = 'Allow public read event_lineup') THEN
        CREATE POLICY "Allow public read event_lineup" ON event_lineup FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_gallery' AND policyname = 'Allow public read event_gallery') THEN
        CREATE POLICY "Allow public read event_gallery" ON event_gallery FOR SELECT USING (true);
    END IF;

    -- Merchandise
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'merchandise' AND policyname = 'Allow public read merchandise') THEN
        CREATE POLICY "Allow public read merchandise" ON merchandise FOR SELECT USING (true);
    END IF;

    -- Config & FAQs
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'config' AND policyname = 'Allow public read config') THEN
        CREATE POLICY "Allow public read config" ON config FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'faqs' AND policyname = 'Allow public read faqs') THEN
        CREATE POLICY "Allow public read faqs" ON faqs FOR SELECT USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow public read members bucket') THEN
        CREATE POLICY "Allow public read members bucket" ON storage.objects FOR SELECT USING (bucket_id = 'members');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow public read products bucket') THEN
        CREATE POLICY "Allow public read products bucket" ON storage.objects FOR SELECT USING (bucket_id = 'products');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow public read receipts bucket') THEN
        CREATE POLICY "Allow public read receipts bucket" ON storage.objects FOR SELECT USING (bucket_id = 'receipts');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow public read payment proofs bucket') THEN
        CREATE POLICY "Allow public read payment proofs bucket" ON storage.objects FOR SELECT USING (bucket_id = 'payment-proofs');
    END IF;
END $$;

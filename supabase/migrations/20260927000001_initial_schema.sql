-- ==============================================================================
-- KOHI SEKAI - INITIAL SCHEMA & BASE MIGRATION
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

-- Akun Default Utama Admin Kohi Sekai:
-- Username: admin | Password: admin123
INSERT INTO admin_users (username, password_hash, full_name)
VALUES (
    'admin', 
    '$2b$10$7oWPhQHnXuLlnpxD4FRgUO3Vu2pEuDGx394h1hhP9eKcmspoYtIGG', 
    'Admin Kohi Sekai'
)
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Akun cadangan staff:
-- Username: staff123 | Password: staff123
INSERT INTO admin_users (username, password_hash, full_name)
VALUES (
    'staff123', 
    '$2b$10$TjlmVrhJxPqN4MDp1PFuF.Igml6oft49WsvHBtRoMxJajTNGV1Xmy', 
    'Staff Kohi Sekai'
)
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- ==============================================================================
-- 4. TABLE: users & VIEW: fan_users (Profil Fans / Pembeli untuk Shop & Checkout)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fan_id SERIAL,
    nama VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    whatsapp VARCHAR(50),
    instagram VARCHAR(100),
    image_url TEXT,
    role VARCHAR(50) DEFAULT 'fan', -- 'fan', 'vip_fan', 'staff'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_whatsapp ON public.users(whatsapp);

DROP TABLE IF EXISTS fan_users CASCADE;
CREATE OR REPLACE VIEW fan_users AS SELECT * FROM public.users;

-- ==============================================================================
-- 5. TABLE: members (Member Profil & Dual Photo System)
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

DROP TRIGGER IF EXISTS update_members_updated_at ON members;
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Entitas grup dasar untuk Kohi Sekai
INSERT INTO members (id, member_id, nama_panggung, tagline, hadir, color, order_index, jikoshoukai, instagram, image_url, shop_image_url)
VALUES (
    'c0000000-0000-0000-0000-000000000000',
    'group',
    'Kohi Sekai',
    'Indonesian Japanese-Style Idol Group',
    true,
    '#EC4899',
    999,
    'Kohi Sekai adalah grup idola yang membawa aroma kehangatan dan energi ceria untuk semua penggemar.',
    '@kohisekai',
    '/images/members/group.webp',
    '/images/members/group.webp'
)
ON CONFLICT (member_id) DO UPDATE SET
    image_url = EXCLUDED.image_url,
    shop_image_url = EXCLUDED.shop_image_url;

-- Seed Idol Members
INSERT INTO public.members (id, member_id, nama_panggung, tagline, hadir, image_url, shop_image_url, color, gradient, order_index, is_secret)
VALUES 
    ('c0000000-0000-0000-0000-000000000001', 'latte', 'Kohi Latte', 'Manis seperti latte, hangat dan menyenangkan.', true, '/images/members/latte.webp', '/images/members/latte.webp', '#F0A868', 'from-amber-400 to-orange-500', 1, false),
    ('c0000000-0000-0000-0000-000000000002', 'macchiato', 'Kohi Macchiato', 'Tegas dan bersemangat, macchiato sejati.', true, '/images/members/macchiato.webp', '/images/members/macchiato.webp', '#FF6B9D', 'from-pink-400 to-rose-500', 2, false),
    ('c0000000-0000-0000-0000-000000000003', 'affogato', 'Kohi Affogato', 'Misterius dan intens seperti affogato.', true, '/images/members/affogato.webp', '/images/members/affogato.webp', '#C9A97E', 'from-yellow-600 to-stone-800', 3, false)
ON CONFLICT (id) DO UPDATE SET
    nama_panggung = EXCLUDED.nama_panggung,
    tagline = EXCLUDED.tagline,
    color = EXCLUDED.color,
    order_index = EXCLUDED.order_index,
    image_url = EXCLUDED.image_url,
    shop_image_url = EXCLUDED.shop_image_url;

-- ==============================================================================
-- 6. TABLE: member_gallery (Galeri Foto Profil Member)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS member_gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 7. TABLE: events (Jadwal Event & Special Event)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(255) NOT NULL,
    tanggal INT NOT NULL,
    bulan VARCHAR(50) NOT NULL,
    tahun INT NOT NULL,
    event_date DATE,
    lokasi TEXT NOT NULL,
    deskripsi TEXT,
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

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 8. TABLE: event_lineup (Relasi Member yang Tampil di Event)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS event_lineup (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, member_id)
);

-- ==============================================================================
-- 9. TABLE: event_gallery (Galeri Dokumentasi Event)
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
-- 10. TABEL: cheki_prices (Harga Cheki & Kuota per Member per Event)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.cheki_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE, -- NULL = Group Cheki
    jenis_sesi VARCHAR(100) NOT NULL DEFAULT '2-Shot Cheki',
    price INT NOT NULL DEFAULT 25000,
    slot_available INT DEFAULT 30,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, member_id, jenis_sesi)
);

CREATE INDEX IF NOT EXISTS idx_cheki_prices_event ON public.cheki_prices(event_id);
CREATE INDEX IF NOT EXISTS idx_cheki_prices_member ON public.cheki_prices(member_id);

-- ==============================================================================
-- 11. TABLE: orders (Transaksi Pemesanan Tiket Cheki Online & OTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    cheki_price_id UUID REFERENCES public.cheki_prices(id) ON DELETE SET NULL,
    jenis_sesi VARCHAR(100) DEFAULT '2-Shot Cheki',
    quantity INT DEFAULT 1,
    price INT DEFAULT 25000,
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

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 12. TABLE: order_items (Detail Item Tiket per Transaksi)
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
-- 13. TABLE: merchandise (Katalog Merchandise Resmi)
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

DROP TRIGGER IF EXISTS update_merchandise_updated_at ON merchandise;
CREATE TRIGGER update_merchandise_updated_at BEFORE UPDATE ON merchandise
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 14. TABLE: merch_orders (Pesanan Merchandise)
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
-- 15. TABLE: merch_order_items (Detail Item Merchandise per Pesanan)
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
-- 16. TABLE: config (Pengaturan Web, Harga PO & OTS, Rekening, Maintenance, Hero)
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
-- 17. TABLE: faqs (Pertanyaan Umum & Jawaban)
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
-- 18. SEED DATA TESTING (Users, Events, Cheki Prices)
-- ==============================================================================
INSERT INTO public.users (id, nama, email, whatsapp, instagram, role)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'Kiki', 'kiki.fan@gmail.com', '081234567890', '@kiki_sekai', 'fan'),
    ('a0000000-0000-0000-0000-000000000002', 'Siti Rahma', 'siti.rahma@gmail.com', '081987654321', '@siti_kohi', 'fan')
ON CONFLICT (email) DO UPDATE SET
    nama = EXCLUDED.nama,
    whatsapp = EXCLUDED.whatsapp,
    instagram = EXCLUDED.instagram;

INSERT INTO public.events (id, nama, tanggal, bulan, tahun, event_date, lokasi, deskripsi, event_time, cheki_time, is_past, is_special, theme_name, theme_color)
VALUES 
    ('e0000000-0000-0000-0000-000000000001', 'Kohi Stage Vol. 1: First Brew', 15, 'Oktober', 2026, '2026-10-15', 'Grand Ballroom Kuningan, Jakarta Selatan', 'Debut panggung perdana Kohi Sekai membawakan single orisinal dan sesi Cheki eksklusif bersama fans.', '14:00 - 19:00 WIB', '16:30 - 18:30 WIB', false, true, 'First Brew Debut', '#F0A868'),
    ('e0000000-0000-0000-0000-000000000002', 'Kohi Acoustic Afternoon', 5, 'November', 2026, '2026-11-05', 'Kohi Cafe & Studio Bandung', 'Sesi santai akustik intim dengan aroma kopi hangat dan interaksi dekat bersama semua member Kohi Sekai.', '15:00 - 18:00 WIB', '16:00 - 17:30 WIB', false, false, 'Acoustic Warmth', '#FF6B9D'),
    ('e0000000-0000-0000-0000-000000000003', 'Kohi Sunday Festival 2026', 22, 'November', 2026, '2026-11-22', 'Senayan Park, Jakarta Pusat', 'Panggung festival idol akbar dengan tata panggung megah, merchandise eksklusif, dan sesi 2-Shot Cheki seharian penuh.', '13:00 - 21:00 WIB', '15:30 - 19:00 WIB', false, true, 'Sunday Kawaii Metal', '#C9A97E')
ON CONFLICT (id) DO UPDATE SET
    nama = EXCLUDED.nama,
    tanggal = EXCLUDED.tanggal,
    bulan = EXCLUDED.bulan,
    tahun = EXCLUDED.tahun,
    lokasi = EXCLUDED.lokasi,
    deskripsi = EXCLUDED.deskripsi,
    event_time = EXCLUDED.event_time,
    cheki_time = EXCLUDED.cheki_time;

INSERT INTO public.cheki_prices (event_id, member_id, jenis_sesi, price, slot_available, is_available)
VALUES 
    ('e0000000-0000-0000-0000-000000000001', NULL, 'Group Cheki (Full Member)', 35000, 40, true),
    ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '2-Shot Cheki (Kohi Latte)', 25000, 25, true),
    ('e0000000-0000-0000-0000-000000000002', NULL, 'Group Cheki (Full Member)', 30000, 30, true)
ON CONFLICT (event_id, member_id, jenis_sesi) DO UPDATE SET
    price = EXCLUDED.price,
    slot_available = EXCLUDED.slot_available,
    is_available = EXCLUDED.is_available;

-- ==============================================================================
-- 19. INDEXES UNTUK KINERJA TINGGI
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
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_is_ots ON orders(is_ots);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_member_id ON order_items(member_id);

CREATE INDEX IF NOT EXISTS idx_merch_available ON merchandise(available);
CREATE INDEX IF NOT EXISTS idx_merch_orders_status ON merch_orders(status);
CREATE INDEX IF NOT EXISTS idx_merch_orders_created ON merch_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_merch_order_items_order ON merch_order_items(merch_order_id);

-- ==============================================================================
-- 20. SUPABASE STORAGE BUCKETS SETUP
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('members', 'members', true),
    ('products', 'products', true),
    ('receipts', 'receipts', true),
    ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- ==============================================================================
-- 21. ROW LEVEL SECURITY (RLS) & ACCESS POLICIES
-- ==============================================================================
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_lineup ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE cheki_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchandise ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE merch_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE merch_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Public users
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Public can view and insert users') THEN
        CREATE POLICY "Public can view and insert users" ON public.users FOR ALL USING (true) WITH CHECK (true);
    END IF;

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

    -- Cheki prices
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cheki_prices' AND policyname = 'Public can view cheki prices') THEN
        CREATE POLICY "Public can view cheki prices" ON public.cheki_prices FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cheki_prices' AND policyname = 'Admins can manage cheki prices') THEN
        CREATE POLICY "Admins can manage cheki prices" ON public.cheki_prices FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- Orders
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Public can view orders') THEN
        CREATE POLICY "Public can view orders" ON public.orders FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Public can update orders') THEN
        CREATE POLICY "Public can update orders" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);
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


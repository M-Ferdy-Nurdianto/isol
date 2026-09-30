-- ==============================================================================
-- KOHI SEKAI - COMPREHENSIVE V2 DATABASE MIGRATION & SCHEMA
-- ==============================================================================
-- Mendukung:
-- 1. Tabel users (Akun Penggemar / Customer untuk Login, Register & Checkout)
-- 2. Tabel events (Jadwal Event untuk Kalender Shop)
-- 3. Tabel members (Idol Member Kohi Sekai: Latte, Macchiato, Affogato)
-- 4. Tabel cheki_prices (Harga Cheki per Member per Event & Jenis Sesi)
-- 5. Tabel orders (Transaksi Direct Checkout terhubung ke User, Event & Member)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. TABEL: users (Akun Penggemar / Fans Kohi Sekai)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    whatsapp VARCHAR(50) NOT NULL,
    instagram VARCHAR(100),
    role VARCHAR(50) DEFAULT 'fan', -- 'fan', 'vip_fan', 'staff'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_whatsapp ON public.users(whatsapp);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Public can view and insert users') THEN
        CREATE POLICY "Public can view and insert users" ON public.users FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Kompatibilitas alias fan_users ke users
CREATE OR REPLACE VIEW fan_users AS SELECT * FROM public.users;

-- ==============================================================================
-- 2. TABEL: events (Jadwal Event Panggung & Calendar Shop)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.events (
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

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_date DATE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS deskripsi TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_time VARCHAR(50);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS cheki_time VARCHAR(50);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_past BOOLEAN DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_special BOOLEAN DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS theme_color VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(tahun, tanggal);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Service and public can modify events') THEN
        CREATE POLICY "Service and public can modify events" ON public.events FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ==============================================================================
-- 3. SEED MEMBERS (Kohi Sekai Idol Members)
-- ==============================================================================
INSERT INTO public.members (id, member_id, nama_panggung, tagline, hadir, image_url, shop_image_url, color, gradient, order_index, is_secret)
VALUES 
    ('c0000000-0000-0000-0000-000000000001', 'latte', 'Kohi Latte', 'Manis seperti latte, hangat dan menyenangkan.', true, '/images/members/placeholder.svg', '/images/members/placeholder.svg', '#F0A868', 'from-amber-400 to-orange-500', 1, false),
    ('c0000000-0000-0000-0000-000000000002', 'macchiato', 'Kohi Macchiato', 'Tegas dan bersemangat, macchiato sejati.', true, '/images/members/placeholder.svg', '/images/members/placeholder.svg', '#FF6B9D', 'from-pink-400 to-rose-500', 2, false),
    ('c0000000-0000-0000-0000-000000000003', 'affogato', 'Kohi Affogato', 'Misterius dan intens seperti affogato.', true, '/images/members/placeholder.svg', '/images/members/placeholder.svg', '#C9A97E', 'from-yellow-600 to-stone-800', 3, false)
ON CONFLICT (id) DO UPDATE SET
    nama_panggung = EXCLUDED.nama_panggung,
    tagline = EXCLUDED.tagline,
    color = EXCLUDED.color,
    order_index = EXCLUDED.order_index;

-- ==============================================================================
-- 4. TABEL: cheki_prices (Harga Cheki & Kuota per Member per Event)
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

ALTER TABLE public.cheki_prices ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cheki_prices' AND policyname = 'Public can view cheki prices') THEN
        CREATE POLICY "Public can view cheki prices" ON public.cheki_prices FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cheki_prices' AND policyname = 'Admins can manage cheki prices') THEN
        CREATE POLICY "Admins can manage cheki prices" ON public.cheki_prices FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ==============================================================================
-- 5. TABEL: orders (Transaksi Direct Checkout)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    cheki_price_id UUID REFERENCES public.cheki_prices(id) ON DELETE SET NULL,
    jenis_sesi VARCHAR(100) DEFAULT '2-Shot Cheki',
    quantity INT DEFAULT 1,
    price INT DEFAULT 25000,
    total_harga INT NOT NULL,
    nama_lengkap VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    instagram VARCHAR(100),
    payment_proof_url TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'verified', 'rejected', 'cancelled'
    is_ots BOOLEAN DEFAULT false,
    created_by VARCHAR(50) DEFAULT 'customer',
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES public.members(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cheki_price_id UUID REFERENCES public.cheki_prices(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS jenis_sesi VARCHAR(100) DEFAULT '2-Shot Cheki';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 1;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS price INT DEFAULT 25000;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS catatan TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_event_id ON public.orders(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Public can view orders') THEN
        CREATE POLICY "Public can view orders" ON public.orders FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Public can update orders') THEN
        CREATE POLICY "Public can update orders" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ==============================================================================
-- 6. SEED DATA TESTING & VERIFIKASI
-- ==============================================================================

-- 6a. Seed Users Dummy
INSERT INTO public.users (id, nama, email, whatsapp, instagram, role)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'Kiki', 'kiki.fan@gmail.com', '081234567890', '@kiki_sekai', 'fan'),
    ('a0000000-0000-0000-0000-000000000002', 'Siti Rahma', 'siti.rahma@gmail.com', '081987654321', '@siti_kohi', 'fan')
ON CONFLICT (email) DO UPDATE SET
    nama = EXCLUDED.nama,
    whatsapp = EXCLUDED.whatsapp,
    instagram = EXCLUDED.instagram;

-- 6b. Seed Events Dummy
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

-- 6c. Seed Cheki Prices Dummy
INSERT INTO public.cheki_prices (event_id, member_id, jenis_sesi, price, slot_available, is_available)
VALUES 
    ('e0000000-0000-0000-0000-000000000001', NULL, 'Group Cheki (Full Member)', 35000, 40, true),
    ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '2-Shot Cheki (Kohi Latte)', 25000, 25, true),
    ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', '2-Shot Cheki (Kohi Macchiato)', 25000, 25, true),
    ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', '2-Shot Cheki (Kohi Affogato)', 25000, 20, true),
    ('e0000000-0000-0000-0000-000000000002', NULL, 'Group Cheki (Full Member)', 30000, 30, true),
    ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', '2-Shot Cheki (Kohi Latte)', 25000, 20, true)
ON CONFLICT (event_id, member_id, jenis_sesi) DO UPDATE SET
    price = EXCLUDED.price,
    slot_available = EXCLUDED.slot_available,
    is_available = EXCLUDED.is_available;

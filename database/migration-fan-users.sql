-- ==============================================================================
-- KOHI SEKAI - MIGRATION: FAN USERS TABLE
-- ==============================================================================
-- Tabel untuk menyimpan data profil penggemar (fan/customer) untuk auto-fill checkout,
-- login tanpa password/OTP, dan tracking histori pembelian.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS fan_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    whatsapp VARCHAR(50) NOT NULL,
    instagram VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk pencarian cepat via email & whatsapp
CREATE INDEX IF NOT EXISTS idx_fan_users_email ON fan_users(email);
CREATE INDEX IF NOT EXISTS idx_fan_users_whatsapp ON fan_users(whatsapp);

-- Tambahkan foreign key user_id ke tabel orders (opsional/nullable untuk backwards-compatibility)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES fan_users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

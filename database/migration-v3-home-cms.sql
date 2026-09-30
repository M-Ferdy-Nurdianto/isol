-- ==============================================================================
-- KOHI SEKAI - V3 MIGRATION: HOME CMS & NEWS
-- ==============================================================================

-- 1. Create News Table
CREATE TABLE IF NOT EXISTS public.news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    summary TEXT,
    content TEXT,
    image_url TEXT,
    location VARCHAR(255),
    date DATE,
    is_published BOOLEAN DEFAULT true,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_news_slug ON public.news(slug);
CREATE INDEX IF NOT EXISTS idx_news_published ON public.news(is_published);
CREATE INDEX IF NOT EXISTS idx_news_date ON public.news(date DESC);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_news_updated_at ON public.news;
CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON public.news
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'news' AND policyname = 'Allow public read published news') THEN
        CREATE POLICY "Allow public read published news" ON public.news FOR SELECT USING (is_published = true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'news' AND policyname = 'Admins can manage news') THEN
        CREATE POLICY "Admins can manage news" ON public.news FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 2. Insert Default Config for Home Page
INSERT INTO public.config (key, value) VALUES
    ('hero_settings', '{"title": "Kohi Sekai", "subtitle": "コーヒーの世界", "tagline": "Indonesian Japanese-Style Idol Group", "cta_1_text": "Lihat Jadwal", "cta_1_link": "/shop", "cta_2_text": "Kenali Kami", "cta_2_link": "/about"}'),
    ('members_section', '{"title": "Members", "description": "Temui para anggota Kohi Sekai yang siap menyajikan senyum manis untukmu."}'),
    ('news_section', '{"title": "News", "description": "Berita dan pengumuman terbaru dari Kohi Sekai."}'),
    ('events_section', '{"empty_text": "Belum ada event terdekat. Pantau terus sosial media kami!"}'),
    ('social_section', '{"title": "Connect With Us", "description": "Ikuti perjalanan kami dan jangan lewatkan momen seru bersama Kohi Sekai di sosial media.", "links": [{"name": "Instagram", "username": "@kohisekai", "description": "Foto keseharian dan update instan", "link": "https://instagram.com/kohisekai", "icon": "instagram"}, {"name": "TikTok", "username": "@kohisekai", "description": "Video pendek seru dari member", "link": "https://tiktok.com/@kohisekai", "icon": "tiktok"}, {"name": "YouTube", "username": "Kohi Sekai", "description": "Vlog, behind the scenes, & MV", "link": "https://youtube.com/@kohisekai", "icon": "youtube"}]}'),
    ('faq_section', '{"title": "FAQ", "description": "Pertanyaan yang sering diajukan", "cta_text": "Masih punya pertanyaan?", "cta_link": "https://wa.me/6281234567890"}'),
    ('footer_settings', '{"brand_description": "Indonesian Japanese-Style Idol Group membawa aroma kehangatan dan energi ceria untuk semua penggemar.", "copyright_text": "© 2026 Kohi Sekai. All rights reserved."}'),
    ('group_photo', '{"url": "/images/members/placeholder.svg"}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

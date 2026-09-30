-- Table: music_items
CREATE TABLE IF NOT EXISTS public.music_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform TEXT NOT NULL CHECK (platform IN ('youtube', 'spotify')),
    title TEXT NOT NULL,
    description TEXT,
    link TEXT NOT NULL,
    thumbnail_url TEXT,
    "order" INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.music_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for published music items" 
    ON public.music_items FOR SELECT 
    USING (status = 'published');

CREATE POLICY "Allow admin full access" 
    ON public.music_items FOR ALL 
    TO authenticated 
    USING (true);

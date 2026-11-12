-- Add theme_color column to music_items table for custom player/card coloring
ALTER TABLE public.music_items 
ADD COLUMN IF NOT EXISTS theme_color TEXT;

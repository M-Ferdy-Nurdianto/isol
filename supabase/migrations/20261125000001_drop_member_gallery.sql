-- Drop unused member_gallery table (3 Slot Galeri Foto feature removed)
DROP POLICY IF EXISTS "Allow public read member_gallery" ON public.member_gallery;
DROP INDEX IF EXISTS public.idx_member_gallery_member_id;
DROP TABLE IF EXISTS public.member_gallery CASCADE;

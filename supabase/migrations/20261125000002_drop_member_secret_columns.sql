-- Drop unused Mode Secret / Siluet Teaser columns from members
ALTER TABLE public.members
  DROP COLUMN IF EXISTS is_secret,
  DROP COLUMN IF EXISTS silhouette_image_url;

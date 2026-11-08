-- ==============================================================================
-- Migration: Fan Account Fast Search (Trigram + B-tree Indexes & Priority Search RPC)
-- Target Table: public.users
-- ==============================================================================

-- 1. Enable pg_trgm extension for fast partial/similarity string search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Create GIN Trigram index on nama (case-insensitive partial matching)
CREATE INDEX IF NOT EXISTS idx_users_nama_trgm 
ON public.users USING gin (LOWER(nama) gin_trgm_ops);

-- 3. Create B-Tree text_pattern_ops index on fan_id cast to text (for fast prefix match e.g. '0002', '2')
CREATE INDEX IF NOT EXISTS idx_users_fan_id_text 
ON public.users ((LPAD(fan_id::text, 4, '0')) text_pattern_ops);

CREATE INDEX IF NOT EXISTS idx_users_fan_id_raw_text 
ON public.users ((fan_id::text) text_pattern_ops);

-- 4. Create B-Tree index on email (for exact match search)
CREATE INDEX IF NOT EXISTS idx_users_email_lower 
ON public.users (LOWER(email));

-- 5. Create Search RPC Function with Priority Match:
-- Priority 1: Exact Fan ID (e.g. '2' or '0002')
-- Priority 2: Prefix Fan ID (e.g. '000' -> matches 0001, 0002)
-- Priority 3: Exact Email match
-- Priority 4: Exact Name match
-- Priority 5: Prefix Name match (starts with query)
-- Priority 6: Partial Name match (trigram / contains query)
CREATE OR REPLACE FUNCTION public.search_fan_accounts(
  search_query TEXT,
  max_limit INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  fan_id INT,
  nama TEXT,
  email TEXT,
  whatsapp TEXT,
  instagram TEXT,
  image_url TEXT,
  match_priority INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_q TEXT := TRIM(search_query);
  is_numeric BOOLEAN := clean_q ~ '^[0-9]+$';
  clean_num INT := CASE WHEN is_numeric THEN clean_q::INT ELSE NULL END;
BEGIN
  IF clean_q = '' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.fan_id,
    u.nama::TEXT,
    u.email::TEXT,
    u.whatsapp::TEXT,
    u.instagram::TEXT,
    u.image_url::TEXT,
    CASE 
      -- Priority 1: Exact Fan ID (numeric or padded 4-digit)
      WHEN is_numeric AND u.fan_id = clean_num THEN 1
      WHEN LPAD(COALESCE(u.fan_id, 0)::text, 4, '0') = clean_q THEN 1
      -- Priority 2: Prefix Fan ID
      WHEN is_numeric AND u.fan_id::text LIKE clean_q || '%' THEN 2
      WHEN LPAD(COALESCE(u.fan_id, 0)::text, 4, '0') LIKE clean_q || '%' THEN 2
      -- Priority 3: Exact Email
      WHEN LOWER(u.email) = LOWER(clean_q) THEN 3
      -- Priority 4: Exact Name
      WHEN LOWER(u.nama) = LOWER(clean_q) THEN 4
      -- Priority 5: Prefix Name
      WHEN LOWER(u.nama) LIKE LOWER(clean_q) || '%' THEN 5
      -- Priority 6: Partial Name
      WHEN LOWER(u.nama) ILIKE '%' || LOWER(clean_q) || '%' THEN 6
      ELSE 7
    END AS match_priority
  FROM public.users u
  WHERE 
    (is_numeric AND (u.fan_id = clean_num OR u.fan_id::text LIKE clean_q || '%' OR LPAD(COALESCE(u.fan_id, 0)::text, 4, '0') LIKE clean_q || '%'))
    OR (LOWER(u.email) = LOWER(clean_q))
    OR (u.nama ILIKE '%' || clean_q || '%')
  ORDER BY 
    match_priority ASC,
    similarity(u.nama, clean_q) DESC,
    u.nama ASC
  LIMIT LEAST(max_limit, 20);
END;
$$;

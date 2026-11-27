-- Allow Special Events to optionally enable OTS and specify custom PO & OTS cheki prices
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS ots_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS harga_cheki_po INTEGER,
  ADD COLUMN IF NOT EXISTS harga_cheki_ots INTEGER;

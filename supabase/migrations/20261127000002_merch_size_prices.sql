-- Allow per-size extra price adjustments on merchandise (e.g. {"XL": 3000, "XXL": 5000})
ALTER TABLE public.merchandise
  ADD COLUMN IF NOT EXISTS size_prices JSONB NOT NULL DEFAULT '{}'::jsonb;

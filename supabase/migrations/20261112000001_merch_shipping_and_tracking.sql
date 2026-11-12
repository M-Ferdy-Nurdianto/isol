-- ==============================================================================
-- Migration: Merchandise Delivery Method, Shipping Address, Tracking & Confirm
-- Target Table: public.merch_orders
-- ==============================================================================

ALTER TABLE public.merch_orders
  ADD COLUMN IF NOT EXISTS delivery_method VARCHAR(30) NOT NULL DEFAULT 'pickup_event',
  ADD COLUMN IF NOT EXISTS shipping_address TEXT,
  ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(120),
  ADD COLUMN IF NOT EXISTS shipping_postal_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS shipping_courier VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(120),
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmed_by VARCHAR(30),
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'merch_orders_delivery_method_check'
  ) THEN
    ALTER TABLE public.merch_orders
      ADD CONSTRAINT merch_orders_delivery_method_check
      CHECK (delivery_method IN ('pickup_event', 'shipping'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'merch_orders_confirmed_by_check'
  ) THEN
    ALTER TABLE public.merch_orders
      ADD CONSTRAINT merch_orders_confirmed_by_check
      CHECK (confirmed_by IS NULL OR confirmed_by IN ('customer', 'admin'));
  END IF;
END $$;

-- Partial indexes for fast admin notification queries (unprocessed user orders)
CREATE INDEX IF NOT EXISTS idx_merch_orders_pending_created
  ON public.merch_orders (created_at DESC)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_orders_pending_customer_created
  ON public.orders (created_at DESC)
  WHERE status = 'pending' AND (created_by IS NULL OR created_by != 'admin');


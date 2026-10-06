-- Migration: Wide Cheki toggle + Payment method toggles + correct default pricing
-- Date: 2026-10-01

-- Insert new config keys (only if not already present)
INSERT INTO config (key, value) VALUES
  ('wide_cheki_enabled',        'true'),
  ('payment_enable_tf',         'true'),
  ('payment_enable_qris',       'false'),
  ('payment_qris_image_url',    ''),
  ('payment_qris_merchant_name','')
ON CONFLICT (key) DO NOTHING;

-- Update default pricing to match price list poster
-- Regular Cheki PO  (Priority Line): Rp 40.000
-- Wide Cheki PO     (VIP Line):      Rp 70.000
-- Regular Cheki OTS (Regular Line):  Rp 40.000
-- Wide Cheki OTS    (VIP Line):      Rp 80.000
-- Only overwrite if still at old default values (25000 / 30000 / 0 / empty)
UPDATE config SET value = '40000' WHERE key = 'harga_cheki_per_member' AND value IN ('25000','0','');
UPDATE config SET value = '70000' WHERE key = 'harga_cheki_grup'       AND value IN ('30000','0','');
UPDATE config SET value = '40000' WHERE key = 'harga_ots_per_member'   AND value IN ('25000','0','');
UPDATE config SET value = '80000' WHERE key = 'harga_ots_grup'         AND value IN ('30000','0','');

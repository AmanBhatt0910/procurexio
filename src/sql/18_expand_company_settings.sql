-- ================================================================
-- MODULE 18: Expand Company Settings
-- Adds tax_id, registered_address, and phone_number to
-- the existing company_settings table (safe ALTER, idempotent).
-- ================================================================

-- Add tax_id if not already present
ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS tax_id              VARCHAR(64)   DEFAULT NULL
    COMMENT 'Tax / GST / VAT identification number';

-- Add registered_address if not already present
ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS registered_address  VARCHAR(500)  DEFAULT NULL
    COMMENT 'Official registered business address';

-- Add phone_number if not already present
ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS phone_number        VARCHAR(32)   DEFAULT NULL
    COMMENT 'Company contact phone number';

-- Extend website/social fields (future-proofing)
ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS website_url         VARCHAR(512)  DEFAULT NULL
    COMMENT 'Company website URL';

-- Ensure updated_at exists (it already does in schema 1, but safe to confirm)
-- No-op if column already present; MySQL silently skips duplicate ADD COLUMN IF NOT EXISTS.

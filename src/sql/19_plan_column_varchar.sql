-- ================================================================
-- MIGRATION 19: Convert companies.plan from ENUM to VARCHAR
--
-- The companies.plan column previously used ENUM('free','pro','enterprise').
-- This migration converts it to VARCHAR(50) so that any plan name stored
-- in the plans table is valid without requiring a schema change.
-- ================================================================

ALTER TABLE companies
  MODIFY COLUMN plan VARCHAR(50) NOT NULL DEFAULT 'free';

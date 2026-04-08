-- ============================================================
-- Migration 11: Add tax_rate column to bid_items
-- Run this on any existing database that already has bid_items
-- ============================================================

ALTER TABLE bid_items
  ADD COLUMN tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00
  AFTER notes;
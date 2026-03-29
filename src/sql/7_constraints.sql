-- ============================================================
-- FINAL CONSTRAINTS (run last)
-- ============================================================

ALTER TABLE users
ADD CONSTRAINT fk_users_vendor
FOREIGN KEY (vendor_id)
REFERENCES vendors(id)
ON DELETE SET NULL;
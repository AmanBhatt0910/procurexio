-- ============================================================
-- FINAL CONSTRAINTS (run last) — FIXED
-- ============================================================

-- users → vendors
-- Already exists → DO NOT run again
-- ALTER TABLE users
-- ADD CONSTRAINT fk_users_vendor
-- FOREIGN KEY (vendor_id)
-- REFERENCES vendors(id)
-- ON DELETE SET NULL;


-- invitations → vendors
ALTER TABLE invitations
ADD CONSTRAINT fk_invitations_vendor
FOREIGN KEY (vendor_id)
REFERENCES vendors(id)
ON DELETE CASCADE;
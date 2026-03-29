-- ============================================================
-- FINAL CONSTRAINTS (run last)
-- ============================================================

-- users → vendors
ALTER TABLE users
ADD CONSTRAINT fk_users_vendor
FOREIGN KEY (vendor_id)
REFERENCES vendors(id)
ON DELETE SET NULL;

-- invitations → vendors
ALTER TABLE invitations
ADD CONSTRAINT fk_invitations_vendor
FOREIGN KEY (vendor_id)
REFERENCES vendors(id)
ON DELETE CASCADE;
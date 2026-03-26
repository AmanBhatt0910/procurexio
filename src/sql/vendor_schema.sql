-- ================================================================
-- MODULE 3: Vendor Management — MySQL Schema
-- Run this against your procurement_db database
-- ================================================================

-- ── Vendor Categories (company-defined tags) ─────────────────────
CREATE TABLE IF NOT EXISTS vendor_categories (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  company_id BIGINT       NOT NULL,
  name       VARCHAR(100) NOT NULL,
  color      VARCHAR(20)  NOT NULL DEFAULT '#6b6660',   -- hex or named
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_vendor_categories_company (company_id),
  CONSTRAINT fk_vendor_categories_company
    FOREIGN KEY (company_id) REFERENCES companies(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Vendors (core directory per tenant) ──────────────────────────
CREATE TABLE IF NOT EXISTS vendors (
  id         BIGINT        NOT NULL AUTO_INCREMENT,
  company_id BIGINT        NOT NULL,
  name       VARCHAR(255)  NOT NULL,
  email      VARCHAR(255)  DEFAULT NULL,
  phone      VARCHAR(50)   DEFAULT NULL,
  website    VARCHAR(512)  DEFAULT NULL,
  address    TEXT          DEFAULT NULL,
  status     ENUM('active','inactive','pending') NOT NULL DEFAULT 'pending',
  notes      TEXT          DEFAULT NULL,
  created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_vendors_company_id (company_id),
  INDEX idx_vendors_status     (status),
  CONSTRAINT fk_vendors_company
    FOREIGN KEY (company_id) REFERENCES companies(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Vendor Contacts (multiple contacts per vendor) ────────────────
CREATE TABLE IF NOT EXISTS vendor_contacts (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  vendor_id  BIGINT       NOT NULL,
  company_id BIGINT       NOT NULL,      -- denormalised for fast tenant queries
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) DEFAULT NULL,
  phone      VARCHAR(50)  DEFAULT NULL,
  is_primary TINYINT(1)   NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_vendor_contacts_vendor  (vendor_id),
  INDEX idx_vendor_contacts_company (company_id),
  CONSTRAINT fk_vendor_contacts_vendor
    FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_vendor_contacts_company
    FOREIGN KEY (company_id) REFERENCES companies(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Vendor ↔ Category (many-to-many) ─────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_category_map (
  vendor_id   BIGINT NOT NULL,
  category_id BIGINT NOT NULL,

  PRIMARY KEY (vendor_id, category_id),
  CONSTRAINT fk_vcm_vendor
    FOREIGN KEY (vendor_id)   REFERENCES vendors(id)           ON DELETE CASCADE,
  CONSTRAINT fk_vcm_category
    FOREIGN KEY (category_id) REFERENCES vendor_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
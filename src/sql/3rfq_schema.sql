-- ================================================================
-- MODULE 4: RFQ (Request for Quotation) — MySQL Schema
-- Run this against your procurement_db database
-- ================================================================

-- ── RFQs (core request entity per tenant) ────────────────────────
CREATE TABLE IF NOT EXISTS rfqs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  title            VARCHAR(255)   NOT NULL,
  description      TEXT           DEFAULT NULL,
  reference_number VARCHAR(32)    NOT NULL,
  status           ENUM('draft','published','closed','cancelled')
                                  NOT NULL DEFAULT 'draft',
  deadline         DATETIME       DEFAULT NULL,
  budget           DECIMAL(15,2)  DEFAULT NULL,
  currency         VARCHAR(8)     NOT NULL DEFAULT 'USD',
  payment_terms    TEXT           DEFAULT NULL,
  freight_charges  DECIMAL(10,2)  DEFAULT NULL,
  remarks          TEXT           DEFAULT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY  uq_rfq_ref_per_company (company_id, reference_number),
  INDEX       idx_rfqs_company_id    (company_id),
  INDEX       idx_rfqs_status        (status),
  INDEX       idx_rfqs_created_by    (created_by),
  CONSTRAINT  fk_rfqs_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT  fk_rfqs_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)     ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── RFQ Line Items ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rfq_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  rfq_id BIGINT UNSIGNED NOT NULL,
  company_id BIGINT UNSIGNED NOT NULL,
  description  VARCHAR(512)   NOT NULL,
  quantity     DECIMAL(10,2)  NOT NULL DEFAULT 1,
  unit         VARCHAR(64)    DEFAULT NULL,
  target_price DECIMAL(15,2)  DEFAULT NULL,
  sort_order   INT            NOT NULL DEFAULT 0,
  created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_rfq_items_rfq     (rfq_id),
  INDEX idx_rfq_items_company (company_id),
  CONSTRAINT fk_rfq_items_rfq
    FOREIGN KEY (rfq_id)     REFERENCES rfqs(id)      ON DELETE CASCADE,
  CONSTRAINT fk_rfq_items_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── RFQ Vendor Invitations ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rfq_vendors (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  rfq_id     BIGINT UNSIGNED NOT NULL,
  vendor_id  BIGINT UNSIGNED NOT NULL,
  company_id BIGINT UNSIGNED NOT NULL,
  status     ENUM('invited','viewed','submitted','declined','awarded')
                         NOT NULL DEFAULT 'invited',
  invited_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
                         ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY  uq_rfq_vendor      (rfq_id, vendor_id),
  INDEX       idx_rfq_vendors_rfq    (rfq_id),
  INDEX       idx_rfq_vendors_vendor (vendor_id),
  INDEX       idx_rfq_vendors_company(company_id),
  CONSTRAINT  fk_rfq_vendors_rfq
    FOREIGN KEY (rfq_id)     REFERENCES rfqs(id)      ON DELETE CASCADE,
  CONSTRAINT  fk_rfq_vendors_vendor
    FOREIGN KEY (vendor_id)  REFERENCES vendors(id)   ON DELETE CASCADE,
  CONSTRAINT  fk_rfq_vendors_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
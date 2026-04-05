-- ============================================================
-- Module 8: Bid Attachments
-- Run after the existing schemas have been applied.
-- ============================================================

CREATE TABLE IF NOT EXISTS bid_attachments (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bid_id       BIGINT UNSIGNED NOT NULL,
  rfq_id       BIGINT UNSIGNED NOT NULL,
  vendor_id    BIGINT UNSIGNED NOT NULL,
  company_id   BIGINT UNSIGNED NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  stored_name  VARCHAR(255) NOT NULL,
  file_path    VARCHAR(1024) NOT NULL,
  mime_type    VARCHAR(127)  NOT NULL DEFAULT 'application/octet-stream',
  file_size    INT UNSIGNED  NOT NULL DEFAULT 0,
  uploaded_by  BIGINT UNSIGNED NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_ba_bid     (bid_id),
  INDEX idx_ba_rfq     (rfq_id),
  INDEX idx_ba_vendor  (vendor_id),
  INDEX idx_ba_company (company_id),

  CONSTRAINT fk_ba_bid    FOREIGN KEY (bid_id)    REFERENCES bids(id)      ON DELETE CASCADE,
  CONSTRAINT fk_ba_rfq    FOREIGN KEY (rfq_id)    REFERENCES rfqs(id)      ON DELETE CASCADE,
  CONSTRAINT fk_ba_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id)   ON DELETE CASCADE,
  CONSTRAINT fk_ba_co     FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

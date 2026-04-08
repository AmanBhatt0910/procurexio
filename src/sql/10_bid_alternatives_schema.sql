-- ============================================================
-- Module 10: Bid Alternative Items Schema
-- Allows vendors to suggest alternative items when bidding
-- ============================================================

CREATE TABLE IF NOT EXISTS bid_alternative_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bid_id BIGINT UNSIGNED NOT NULL,
  rfq_item_id BIGINT UNSIGNED NOT NULL,
  company_id BIGINT UNSIGNED NOT NULL,
  alt_name VARCHAR(255) NOT NULL,
  alt_description TEXT,
  alt_specifications TEXT,
  alt_unit_price DECIMAL(15,2) DEFAULT NULL,
  alt_quantity DECIMAL(10,2) DEFAULT 1.00,
  reason_for_alternative TEXT,
  notes VARCHAR(512),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_alt_bid (bid_id),
  INDEX idx_alt_rfq_item (rfq_item_id),
  INDEX idx_alt_company (company_id),

  CONSTRAINT fk_alt_bid FOREIGN KEY (bid_id) REFERENCES bids(id) ON DELETE CASCADE,
  CONSTRAINT fk_alt_rfq_item FOREIGN KEY (rfq_item_id) REFERENCES rfq_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_alt_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

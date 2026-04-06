-- ============================================================
-- Module 5: Bidding Schema (UPDATED)
-- ============================================================
CREATE TABLE IF NOT EXISTS bids (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  rfq_id BIGINT UNSIGNED NOT NULL,
  vendor_id BIGINT UNSIGNED NOT NULL,
  company_id BIGINT UNSIGNED NOT NULL,
  status ENUM('draft','submitted','withdrawn','awarded','rejected') NOT NULL DEFAULT 'draft',
  notes TEXT,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(8) NOT NULL DEFAULT 'USD',
  gst DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  payment_terms TEXT DEFAULT NULL,
  freight_charges DECIMAL(10,2) DEFAULT NULL,
  last_remarks TEXT DEFAULT NULL,
  submitted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_bid_rfq_vendor (rfq_id, vendor_id),

  INDEX idx_bids_rfq (rfq_id),
  INDEX idx_bids_vendor (vendor_id),
  INDEX idx_bids_company (company_id),

  CONSTRAINT fk_bids_rfq FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE CASCADE,
  CONSTRAINT fk_bids_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  CONSTRAINT fk_bids_co FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- bid_items (one row per rfq_item per bid)
CREATE TABLE IF NOT EXISTS bid_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bid_id BIGINT UNSIGNED NOT NULL,
  rfq_item_id BIGINT UNSIGNED NOT NULL,
  company_id BIGINT UNSIGNED NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  total_price DECIMAL(15,2) GENERATED ALWAYS AS (unit_price * quantity) STORED,
  notes VARCHAR(512),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_bid_item (bid_id, rfq_item_id),

  INDEX idx_bid_items_bid (bid_id),
  INDEX idx_bid_items_rfq_item (rfq_item_id),

  CONSTRAINT fk_biditems_bid FOREIGN KEY (bid_id) REFERENCES bids(id) ON DELETE CASCADE,
  CONSTRAINT fk_biditems_rfqitem FOREIGN KEY (rfq_item_id) REFERENCES rfq_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
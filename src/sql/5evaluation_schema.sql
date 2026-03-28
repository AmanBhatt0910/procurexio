-- ============================================================
-- Module 6: Evaluation & Award — SQL Schema (Add‑on)
-- Run this after the existing schemas have been applied.
-- ============================================================

-- 1. contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id                 BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  contract_reference VARCHAR(32)    NOT NULL,
  rfq_id             BIGINT UNSIGNED NOT NULL UNIQUE,
  bid_id             BIGINT UNSIGNED NOT NULL UNIQUE,
  vendor_id          BIGINT UNSIGNED NOT NULL,
  company_id         BIGINT UNSIGNED NOT NULL,
  awarded_by         BIGINT UNSIGNED NOT NULL,
  awarded_at         TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_amount       DECIMAL(15,2)  NOT NULL,
  currency           VARCHAR(8)     NOT NULL DEFAULT 'USD',
  notes              TEXT,
  status             ENUM('active','cancelled') NOT NULL DEFAULT 'active',
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_contracts_rfq    FOREIGN KEY (rfq_id)     REFERENCES rfqs(id)      ON DELETE RESTRICT,
  CONSTRAINT fk_contracts_bid    FOREIGN KEY (bid_id)     REFERENCES bids(id)      ON DELETE RESTRICT,
  CONSTRAINT fk_contracts_vendor FOREIGN KEY (vendor_id)  REFERENCES vendors(id)   ON DELETE RESTRICT,
  CONSTRAINT fk_contracts_co     FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_contracts_by     FOREIGN KEY (awarded_by) REFERENCES users(id)     ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. bid_evaluations table
CREATE TABLE IF NOT EXISTS bid_evaluations (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bid_id        BIGINT UNSIGNED NOT NULL,
  rfq_id        BIGINT UNSIGNED NOT NULL,
  company_id    BIGINT UNSIGNED NOT NULL,
  evaluated_by  BIGINT UNSIGNED NOT NULL,
  score         TINYINT UNSIGNED DEFAULT NULL,
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_eval (bid_id, evaluated_by),
  CONSTRAINT fk_eval_bid  FOREIGN KEY (bid_id)       REFERENCES bids(id)      ON DELETE CASCADE,
  CONSTRAINT fk_eval_rfq  FOREIGN KEY (rfq_id)       REFERENCES rfqs(id)      ON DELETE CASCADE,
  CONSTRAINT fk_eval_co   FOREIGN KEY (company_id)   REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_eval_by   FOREIGN KEY (evaluated_by) REFERENCES users(id)     ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
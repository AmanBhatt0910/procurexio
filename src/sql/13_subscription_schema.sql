-- ================================================================
-- MODULE 13: Subscription System — MySQL Schema (UPDATED)
-- ================================================================

-- ── Plans ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plans (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name         VARCHAR(64)     NOT NULL,
  price        DECIMAL(10,2)   NOT NULL DEFAULT 0,

  -- Limits (-1 = unlimited)
  rfq_limit    INT             NOT NULL DEFAULT 5,
  vendor_limit INT             NOT NULL DEFAULT 10,
  user_limit   INT             NOT NULL DEFAULT 1,
  email_limit  INT             NOT NULL DEFAULT 50,

  -- Feature flags
  features     JSON            NOT NULL DEFAULT (JSON_OBJECT()),

  created_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_plans_name (name),

  -- Safety constraints (MySQL 8+)
  CONSTRAINT chk_price_non_negative CHECK (price >= 0),
  CONSTRAINT chk_limits_valid CHECK (
    rfq_limit >= -1 AND
    vendor_limit >= -1 AND
    user_limit >= -1 AND
    email_limit >= -1
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Subscriptions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  plan_id    BIGINT UNSIGNED NOT NULL,

  status     ENUM('active','cancelled','expired')
             NOT NULL DEFAULT 'active',

  -- Future-ready (no billing yet, but useful)
  starts_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ends_at    TIMESTAMP NULL DEFAULT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                       ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  -- One subscription per company
  UNIQUE KEY uq_subscriptions_company (company_id),

  KEY idx_subscriptions_plan (plan_id),
  KEY idx_subscriptions_status (status),

  CONSTRAINT fk_subscriptions_company
    FOREIGN KEY (company_id)
    REFERENCES companies(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_subscriptions_plan
    FOREIGN KEY (plan_id)
    REFERENCES plans(id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ================================================================
-- SEED: Plans (SAFE UPSERT)
-- ================================================================

INSERT INTO plans (name, price, rfq_limit, vendor_limit, user_limit, email_limit, features)
VALUES
(
  'free',
  0.00,
  5,
  10,
  1,
  50,
  JSON_OBJECT(
    'basic_bid_comparison',  true,
    'advanced_scoring',      false,
    'contract_management',   false
  )
),
(
  'pro',
  3999.00,
  -1,
  -1,
  -1,
  -1,
  JSON_OBJECT(
    'basic_bid_comparison',  true,
    'advanced_scoring',      true,
    'contract_management',   true
  )
)
ON DUPLICATE KEY UPDATE
  price        = VALUES(price),
  rfq_limit    = VALUES(rfq_limit),
  vendor_limit = VALUES(vendor_limit),
  user_limit   = VALUES(user_limit),
  email_limit  = VALUES(email_limit),
  features     = VALUES(features);
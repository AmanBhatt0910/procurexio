-- Module 7: Notifications
-- Run this after 5evaluation_schema.sql

CREATE TABLE IF NOT EXISTS notifications (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id    BIGINT UNSIGNED NOT NULL,
  user_id       BIGINT UNSIGNED NOT NULL,          -- recipient
  type          VARCHAR(64)     NOT NULL,           -- event key e.g. 'bid_submitted'
  title         VARCHAR(255)    NOT NULL,
  body          TEXT,
  link          VARCHAR(512)    DEFAULT NULL,       -- relative URL to navigate to
  is_read       TINYINT(1)      NOT NULL DEFAULT 0,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_notif_user    (user_id, is_read, created_at),
  INDEX idx_notif_company (company_id),
  CONSTRAINT fk_notif_user    FOREIGN KEY (user_id)    REFERENCES users(id)     ON DELETE CASCADE,
  CONSTRAINT fk_notif_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- NOTE: No pruning/TTL logic in this module.
-- Future migration can add: DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL 6 MONTH);
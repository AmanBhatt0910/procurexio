-- ================================================================
-- MODULE 17: Integrations Schema
-- Stores per-company third-party API keys and webhooks
-- ================================================================

CREATE TABLE IF NOT EXISTS integrations (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id   BIGINT UNSIGNED NOT NULL,

  -- Integration identity
  name         VARCHAR(128) NOT NULL,
  type         ENUM('api_key','webhook','oauth') NOT NULL DEFAULT 'api_key',

  -- Credentials (store api_key or webhook_url)
  api_key      VARCHAR(512) DEFAULT NULL,   -- encrypted at application layer
  webhook_url  VARCHAR(2048) DEFAULT NULL,
  webhook_secret VARCHAR(256) DEFAULT NULL,

  -- Webhook event subscriptions (JSON array of event names)
  webhook_events  JSON DEFAULT NULL,

  -- Status
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  last_used_at DATETIME     DEFAULT NULL,

  -- Audit
  created_by   BIGINT UNSIGNED DEFAULT NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  INDEX idx_integrations_company   (company_id),
  INDEX idx_integrations_type      (type),
  INDEX idx_integrations_active    (is_active),

  CONSTRAINT fk_int_company
    FOREIGN KEY (company_id) REFERENCES companies(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_int_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

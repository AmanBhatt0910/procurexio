-- ============================================================
-- MODULE 7: Security & Audit
-- ============================================================

-- ------------------------------------------------------------
-- Password Reset Tokens
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  token       VARCHAR(256) NOT NULL UNIQUE,
  expires_at  DATETIME     NOT NULL,
  used_at     DATETIME     NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_prt_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_prt_user_id    (user_id),
  INDEX idx_prt_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ------------------------------------------------------------
-- User Sessions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_sessions (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id         BIGINT UNSIGNED NOT NULL,
  session_token   VARCHAR(256) NOT NULL UNIQUE,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at      DATETIME     NOT NULL,
  invalidated_at  DATETIME     NULL,
  ip_address      VARCHAR(45)  NULL,
  user_agent      TEXT         NULL,

  CONSTRAINT fk_us_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_us_user_id       (user_id),
  INDEX idx_us_expires_at    (expires_at),
  INDEX idx_us_invalidated_at(invalidated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ------------------------------------------------------------
-- Audit Logs (IMPORTANT for SaaS compliance)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NULL,
  user_email    VARCHAR(255)  NULL,
  action_type   VARCHAR(100)  NOT NULL,
  resource_type VARCHAR(100)  NULL,
  resource_id   BIGINT UNSIGNED NULL,
  resource_name VARCHAR(255)  NULL,
  changes       JSON          NULL,
  status        VARCHAR(50)   NULL,
  status_reason TEXT          NULL,
  ip_address    VARCHAR(45)   NULL,
  user_agent    TEXT          NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_al_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,

  INDEX idx_al_user_id    (user_id),
  INDEX idx_al_created_at (created_at),
  INDEX idx_al_action_type(action_type),
  INDEX idx_al_resource   (resource_type, resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
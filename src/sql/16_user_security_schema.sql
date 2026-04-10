-- ================================================================
-- MODULE 16: User Security Schema
-- Stores per-user security settings: 2FA status, backup codes
-- (User sessions already exist in 7_security_schema.sql)
-- ================================================================

CREATE TABLE IF NOT EXISTS user_security (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id          BIGINT UNSIGNED NOT NULL,

  -- Two-Factor Authentication
  twofa_enabled    TINYINT(1)   NOT NULL DEFAULT 0,
  twofa_secret     VARCHAR(64)  DEFAULT NULL,   -- TOTP secret (encrypted in application layer)
  twofa_enabled_at DATETIME     DEFAULT NULL,

  -- Backup codes (stored as JSON array of hashed codes)
  backup_codes     JSON         DEFAULT NULL,

  -- Password change tracking
  password_changed_at  DATETIME  DEFAULT NULL,

  -- Personal contact (phone — editable by user, not part of auth)
  phone_number     VARCHAR(32)  DEFAULT NULL,

  -- Timestamps
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY  uq_user_security_user (user_id),
  CONSTRAINT  fk_us_user_security
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

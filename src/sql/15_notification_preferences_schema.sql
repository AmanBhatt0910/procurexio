-- ================================================================
-- MODULE 15: Notification Preferences Schema
-- Stores per-user notification channel & category preferences
-- ================================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED NOT NULL,

  -- Email notifications
  email_rfq_updates        TINYINT(1) NOT NULL DEFAULT 1,
  email_bid_updates        TINYINT(1) NOT NULL DEFAULT 1,
  email_contract_updates   TINYINT(1) NOT NULL DEFAULT 1,
  email_system_alerts      TINYINT(1) NOT NULL DEFAULT 1,
  email_weekly_digest      TINYINT(1) NOT NULL DEFAULT 0,

  -- In-app (system) notifications
  notify_rfq_updates       TINYINT(1) NOT NULL DEFAULT 1,
  notify_bid_updates       TINYINT(1) NOT NULL DEFAULT 1,
  notify_contract_updates  TINYINT(1) NOT NULL DEFAULT 1,
  notify_system_alerts     TINYINT(1) NOT NULL DEFAULT 1,

  -- SMS (future use, stored as a flag)
  sms_enabled              TINYINT(1) NOT NULL DEFAULT 0,
  sms_critical_only        TINYINT(1) NOT NULL DEFAULT 1,

  -- Timestamps
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY  uq_notification_prefs_user (user_id),
  CONSTRAINT  fk_np_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

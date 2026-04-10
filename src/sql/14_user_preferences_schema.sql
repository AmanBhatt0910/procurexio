-- ================================================================
-- MODULE 14: User Preferences Schema
-- Stores per-user UI/UX preferences (language, theme, defaults)
-- ================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED NOT NULL,

  -- Localisation
  language     VARCHAR(10)  NOT NULL DEFAULT 'en',
  timezone     VARCHAR(64)  NOT NULL DEFAULT 'UTC',

  -- Appearance
  theme        ENUM('light','dark','system') NOT NULL DEFAULT 'system',

  -- Dashboard defaults
  default_dashboard_view  VARCHAR(64)  NOT NULL DEFAULT 'overview',
  items_per_page          SMALLINT UNSIGNED NOT NULL DEFAULT 20,

  -- Timestamps
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY  uq_user_preferences_user (user_id),
  CONSTRAINT  fk_up_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

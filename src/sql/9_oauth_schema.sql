-- ============================================================
-- MODULE 9: Google OAuth / OAuth Provider Support
-- Run once against your procurement_db database.
-- Safe to run on an existing database — no existing data is modified.
-- ============================================================

-- ── Add Google OAuth columns to users table ──────────────────
-- google_id      : Google's stable user ID (the "sub" claim from ID token)
-- auth_method    : tracks how this account authenticates
-- oauth_linked_at: timestamp when Google was first linked
ALTER TABLE users
  ADD COLUMN google_id       VARCHAR(255) NULL DEFAULT NULL,
  ADD COLUMN auth_method     ENUM('password', 'google', 'both') NOT NULL DEFAULT 'password',
  ADD COLUMN oauth_linked_at DATETIME NULL DEFAULT NULL;

-- Allow password to be NULL for Google-only accounts (no password set)
ALTER TABLE users
  MODIFY COLUMN password VARCHAR(255) NULL;

-- Unique index on google_id — MySQL allows multiple NULLs in a UNIQUE index
-- so existing rows (all NULL) are not affected
ALTER TABLE users
  ADD UNIQUE INDEX idx_users_google_id (google_id);


-- ── Add auth_method to user_sessions ─────────────────────────
-- Tracks whether each session was created via 'password' or 'google' login.
-- Defaults to 'password' so existing rows are unchanged.
ALTER TABLE user_sessions
  ADD COLUMN auth_method VARCHAR(50) NULL DEFAULT 'password';


-- ── oauth_accounts table ─────────────────────────────────────
-- Stores one row per (user, provider) combination.
-- This allows future providers (GitHub, Microsoft, etc.) to be added easily.
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        BIGINT UNSIGNED NOT NULL,
  provider       VARCHAR(50)  NOT NULL,          -- e.g. 'google'
  provider_id    VARCHAR(255) NOT NULL,           -- Google's 'sub' (user ID)
  provider_email VARCHAR(255) NULL,               -- email from the provider
  linked_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  UNIQUE KEY uq_oauth_provider_id   (provider, provider_id),
  UNIQUE KEY uq_oauth_user_provider (user_id, provider),

  INDEX idx_oauth_user_id (user_id),

  CONSTRAINT fk_oauth_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

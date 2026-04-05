-- =============================================================================
-- Migration: Security Audit Enhancements
-- File:      migrations/001_security_audit.sql
-- Created:   2024-01-01
--
-- Run this file once against your MySQL database to apply all schema changes.
-- The statements are idempotent where possible (IF NOT EXISTS / IF EXISTS).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Add security columns to users table
-- -----------------------------------------------------------------------------

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_active              BOOLEAN     NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS failed_login_attempts  INT         NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until           DATETIME    NULL;

-- Index to speed up unlock queries (find all accounts locked before NOW())
CREATE INDEX IF NOT EXISTS idx_users_locked_until
  ON users (locked_until);

-- Index for fast is_active lookups during login
CREATE INDEX IF NOT EXISTS idx_users_is_active
  ON users (is_active);

-- -----------------------------------------------------------------------------
-- 2. Create password_reset_tokens table
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id     INT          NOT NULL,
  token       VARCHAR(256) NOT NULL UNIQUE,
  expires_at  DATETIME     NOT NULL,
  used_at     DATETIME     NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_prt_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_prt_user_id    (user_id),
  INDEX idx_prt_expires_at (expires_at)
);

-- -----------------------------------------------------------------------------
-- 3. Create user_sessions table
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_sessions (
  id              INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id         INT          NOT NULL,
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
);

-- -----------------------------------------------------------------------------
-- 4. Create audit_logs table (append-only / immutable by convention)
-- -----------------------------------------------------------------------------
-- No UPDATE or DELETE privileges should be granted on this table in production.
-- Use a dedicated audit DB user with INSERT-only access.

CREATE TABLE IF NOT EXISTS audit_logs (
  id            INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id       INT           NULL,
  user_email    VARCHAR(255)  NULL,
  action_type   VARCHAR(100)  NOT NULL,
  resource_type VARCHAR(100)  NULL,
  resource_id   INT           NULL,
  resource_name VARCHAR(255)  NULL,
  changes       JSON          NULL,
  status        VARCHAR(50)   NULL,
  status_reason TEXT          NULL,
  ip_address    VARCHAR(45)   NULL,
  user_agent    TEXT          NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- ON DELETE SET NULL so audit history is preserved even when user is deleted
  CONSTRAINT fk_al_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,

  INDEX idx_al_user_id    (user_id),
  INDEX idx_al_created_at (created_at),
  INDEX idx_al_action_type(action_type),
  INDEX idx_al_resource   (resource_type, resource_id)
);

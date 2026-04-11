-- ================================================================
-- MODULE 1: Authentication & Authorization — MySQL Schema
-- Run this against your procurement_db database
-- ================================================================

-- ── Companies (tenants) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255),
  plan       VARCHAR(50) NOT NULL DEFAULT 'free',
  status     ENUM('active','inactive','pending') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_companies_email (email),
  INDEX idx_companies_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Users ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED,
  vendor_id  BIGINT UNSIGNED DEFAULT NULL,

  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  password   VARCHAR(255) NOT NULL,

  role ENUM(
    'super_admin',
    'company_admin',
    'manager',
    'employee',
    'vendor_user'
  ) NOT NULL DEFAULT 'employee',

  is_active              TINYINT(1) NOT NULL DEFAULT 1,
  failed_login_attempts  INT        NOT NULL DEFAULT 0,
  locked_until           DATETIME   NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),

  INDEX idx_users_company_id (company_id),
  INDEX idx_users_vendor_id  (vendor_id),
  INDEX idx_users_is_active (is_active),
  INDEX idx_users_locked_until (locked_until),

  CONSTRAINT fk_users_company
    FOREIGN KEY (company_id)
    REFERENCES companies(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ================================================================
-- SEED: Super admin account
-- Do NOT seed credentials here. Run `npm run seed:superadmin` instead,
-- which reads SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD from .env.
-- ================================================================


-- ================================================================
-- MODULE 2: Tenant (Company) Management — MySQL Schema
-- Run this against your procurement_db database
-- ================================================================

-- ── Company Settings ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_settings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NOT NULL,
  timezone    VARCHAR(64)   NOT NULL DEFAULT 'UTC',
  currency    VARCHAR(8)    NOT NULL DEFAULT 'USD',
  logo_url    VARCHAR(512)  DEFAULT NULL,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY  uq_company_settings (company_id),
  CONSTRAINT  fk_settings_company
    FOREIGN KEY (company_id) REFERENCES companies(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Invitations ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invitations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  company_id BIGINT UNSIGNED NOT NULL,
  email      VARCHAR(255) NOT NULL,

  role ENUM(
    'company_admin',
    'manager',
    'employee',
    'vendor_user'
  ) NOT NULL DEFAULT 'employee',

  vendor_id BIGINT UNSIGNED DEFAULT NULL,

  token       VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP DEFAULT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  UNIQUE KEY uq_invitations_token (token),

  INDEX idx_invitations_email   (email),
  INDEX idx_invitations_company (company_id),
  INDEX idx_invitations_vendor_id (vendor_id),

  CONSTRAINT fk_invitations_company
    FOREIGN KEY (company_id)
    REFERENCES companies(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
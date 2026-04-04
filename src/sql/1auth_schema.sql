-- ================================================================
-- MODULE 1: Authentication & Authorization — MySQL Schema
-- Run this against your procurement_db database
-- ================================================================

-- ── Companies (tenants) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255),
  plan       ENUM('free','pro','enterprise') NOT NULL DEFAULT 'free',
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

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  UNIQUE KEY uq_users_email (email),

  INDEX idx_users_company_id (company_id),
  INDEX idx_users_vendor_id  (vendor_id),

  CONSTRAINT fk_users_company
    FOREIGN KEY (company_id)
    REFERENCES companies(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ================================================================
-- SEED: Super admin account
-- Change email/password before running in production.
-- Password below = "Admin@1234" (bcrypt hash, 12 rounds)
-- ================================================================
INSERT IGNORE INTO users (id, company_id, name, email, password, role)
VALUES (
  1,
  NULL,
  'Super Admin',
  'admin@procurexio.com',
  '$2b$12$K7rdBF2oMQUCJFHFkYiH7OAfXZe5G9RkPkFNq4OHkGHqJhVRU3.Hy',
  'super_admin'
);


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
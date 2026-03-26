-- ================================================================
-- MODULE 1: Authentication & Authorization — MySQL Schema
-- Run this against your procurement_db database
-- ================================================================

-- ── Companies (tenants) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255),
  plan       ENUM('free','pro','enterprise') NOT NULL DEFAULT 'free',
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_companies_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Users ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  company_id BIGINT,                              -- NULL for super_admin
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  password   VARCHAR(255) NOT NULL,               -- bcrypt hash
  role       ENUM(
               'super_admin',
               'company_admin',
               'manager',
               'employee',
               'vendor_user'
             ) NOT NULL DEFAULT 'employee',
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE  KEY uq_users_email        (email),
  INDEX       idx_users_company_id  (company_id),
  CONSTRAINT  fk_users_company
    FOREIGN KEY (company_id) REFERENCES companies(id)
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
  'admin@procureiq.com',
  '$2b$12$K7rdBF2oMQUCJFHFkYiH7OAfXZe5G9RkPkFNq4OHkGHqJhVRU3.Hy',
  'super_admin'
);
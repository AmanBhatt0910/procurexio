// src/lib/settingsService.js
//
// Centralised helper functions for all settings-related database operations.
// Used by the /api/settings/* route handlers to avoid duplicating query logic.

import pool from '@/lib/db';

// ── Personal Information ─────────────────────────────────────────────────────

/**
 * Fetch a user's personal profile fields.
 * name and email are read-only (managed by auth); phone is editable.
 */
export async function getPersonalInfo(userId) {
  const [rows] = await pool.execute(
    `SELECT id, name, email, role, created_at,
            COALESCE(us.phone_number, '') AS phone_number
     FROM   users u
     LEFT JOIN user_security us ON us.user_id = u.id
     WHERE  u.id = ?
     LIMIT  1`,
    [userId]
  );
  return rows[0] ?? null;
}

/**
 * Update editable personal fields (phone only; name/email are auth-managed).
 */
export async function updatePersonalInfo(userId, { phone_number }) {
  // Upsert into user_security for the phone field
  await pool.execute(
    `INSERT INTO user_security (user_id, phone_number)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE phone_number = VALUES(phone_number)`,
    [userId, phone_number ?? null]
  );
}

// ── User Preferences ─────────────────────────────────────────────────────────

/**
 * Fetch a user's UI preferences; returns defaults if no row exists.
 */
export async function getPreferences(userId) {
  const [rows] = await pool.execute(
    `SELECT language, timezone, theme, default_dashboard_view, items_per_page
     FROM   user_preferences
     WHERE  user_id = ?
     LIMIT  1`,
    [userId]
  );
  return rows[0] ?? {
    language: 'en',
    timezone: 'UTC',
    theme: 'system',
    default_dashboard_view: 'overview',
    items_per_page: 20,
  };
}

/**
 * Upsert a user's UI preferences.
 */
export async function updatePreferences(userId, prefs) {
  const {
    language = 'en',
    timezone = 'UTC',
    theme = 'system',
    default_dashboard_view = 'overview',
    items_per_page = 20,
  } = prefs;

  await pool.execute(
    `INSERT INTO user_preferences
       (user_id, language, timezone, theme, default_dashboard_view, items_per_page)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       language               = VALUES(language),
       timezone               = VALUES(timezone),
       theme                  = VALUES(theme),
       default_dashboard_view = VALUES(default_dashboard_view),
       items_per_page         = VALUES(items_per_page)`,
    [userId, language, timezone, theme, default_dashboard_view, items_per_page]
  );
}

// ── Notification Preferences ─────────────────────────────────────────────────

/**
 * Fetch notification preferences for a user; returns defaults if none stored.
 */
export async function getNotificationPrefs(userId) {
  const [rows] = await pool.execute(
    `SELECT email_rfq_updates, email_bid_updates, email_contract_updates,
            email_system_alerts, email_weekly_digest,
            notify_rfq_updates, notify_bid_updates, notify_contract_updates,
            notify_system_alerts,
            sms_enabled, sms_critical_only
     FROM   notification_preferences
     WHERE  user_id = ?
     LIMIT  1`,
    [userId]
  );
  return rows[0] ?? {
    email_rfq_updates: true,
    email_bid_updates: true,
    email_contract_updates: true,
    email_system_alerts: true,
    email_weekly_digest: false,
    notify_rfq_updates: true,
    notify_bid_updates: true,
    notify_contract_updates: true,
    notify_system_alerts: true,
    sms_enabled: false,
    sms_critical_only: true,
  };
}

/**
 * Upsert notification preferences for a user.
 */
export async function updateNotificationPrefs(userId, prefs) {
  const {
    email_rfq_updates = 1,
    email_bid_updates = 1,
    email_contract_updates = 1,
    email_system_alerts = 1,
    email_weekly_digest = 0,
    notify_rfq_updates = 1,
    notify_bid_updates = 1,
    notify_contract_updates = 1,
    notify_system_alerts = 1,
    sms_enabled = 0,
    sms_critical_only = 1,
  } = prefs;

  await pool.execute(
    `INSERT INTO notification_preferences
       (user_id,
        email_rfq_updates, email_bid_updates, email_contract_updates,
        email_system_alerts, email_weekly_digest,
        notify_rfq_updates, notify_bid_updates, notify_contract_updates,
        notify_system_alerts,
        sms_enabled, sms_critical_only)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       email_rfq_updates       = VALUES(email_rfq_updates),
       email_bid_updates       = VALUES(email_bid_updates),
       email_contract_updates  = VALUES(email_contract_updates),
       email_system_alerts     = VALUES(email_system_alerts),
       email_weekly_digest     = VALUES(email_weekly_digest),
       notify_rfq_updates      = VALUES(notify_rfq_updates),
       notify_bid_updates      = VALUES(notify_bid_updates),
       notify_contract_updates = VALUES(notify_contract_updates),
       notify_system_alerts    = VALUES(notify_system_alerts),
       sms_enabled             = VALUES(sms_enabled),
       sms_critical_only       = VALUES(sms_critical_only)`,
    [
      userId,
      email_rfq_updates ? 1 : 0,
      email_bid_updates ? 1 : 0,
      email_contract_updates ? 1 : 0,
      email_system_alerts ? 1 : 0,
      email_weekly_digest ? 1 : 0,
      notify_rfq_updates ? 1 : 0,
      notify_bid_updates ? 1 : 0,
      notify_contract_updates ? 1 : 0,
      notify_system_alerts ? 1 : 0,
      sms_enabled ? 1 : 0,
      sms_critical_only ? 1 : 0,
    ]
  );
}

// ── Security ─────────────────────────────────────────────────────────────────

/**
 * Fetch security status for a user (2FA status, last password change).
 */
export async function getSecurityStatus(userId) {
  const [rows] = await pool.execute(
    `SELECT twofa_enabled, twofa_enabled_at, password_changed_at
     FROM   user_security
     WHERE  user_id = ?
     LIMIT  1`,
    [userId]
  );
  return rows[0] ?? { twofa_enabled: false, twofa_enabled_at: null, password_changed_at: null };
}

/**
 * Fetch active sessions for a user.
 */
export async function getActiveSessions(userId) {
  const [rows] = await pool.execute(
    `SELECT id, ip_address, user_agent, created_at, expires_at
     FROM   user_sessions
     WHERE  user_id = ?
       AND  invalidated_at IS NULL
       AND  expires_at > NOW()
     ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

/**
 * Invalidate a specific session (or all sessions) for a user.
 * Pass sessionId = null to invalidate ALL sessions.
 */
export async function invalidateSession(userId, sessionId = null) {
  if (sessionId) {
    await pool.execute(
      `UPDATE user_sessions
       SET    invalidated_at = NOW()
       WHERE  id = ? AND user_id = ?`,
      [sessionId, userId]
    );
  } else {
    await pool.execute(
      `UPDATE user_sessions
       SET    invalidated_at = NOW()
       WHERE  user_id = ? AND invalidated_at IS NULL`,
      [userId]
    );
  }
}

/**
 * Mark 2FA as enabled for a user (store secret).
 */
export async function enable2FA(userId, secret) {
  await pool.execute(
    `INSERT INTO user_security (user_id, twofa_enabled, twofa_secret, twofa_enabled_at)
     VALUES (?, 1, ?, NOW())
     ON DUPLICATE KEY UPDATE
       twofa_enabled    = 1,
       twofa_secret     = VALUES(twofa_secret),
       twofa_enabled_at = NOW()`,
    [userId, secret]
  );
}

/**
 * Disable 2FA for a user.
 */
export async function disable2FA(userId) {
  await pool.execute(
    `INSERT INTO user_security (user_id, twofa_enabled, twofa_secret, twofa_enabled_at)
     VALUES (?, 0, NULL, NULL)
     ON DUPLICATE KEY UPDATE
       twofa_enabled    = 0,
       twofa_secret     = NULL,
       twofa_enabled_at = NULL`,
    [userId]
  );
}

/**
 * Record a password change timestamp.
 */
export async function recordPasswordChange(userId) {
  await pool.execute(
    `INSERT INTO user_security (user_id, password_changed_at)
     VALUES (?, NOW())
     ON DUPLICATE KEY UPDATE password_changed_at = NOW()`,
    [userId]
  );
}

// ── Company / Compliance ─────────────────────────────────────────────────────

/**
 * Fetch full company compliance settings (name, tax_id, address, etc.)
 */
export async function getCompanySettings(companyId) {
  const [rows] = await pool.execute(
    `SELECT c.id, c.name, c.email, c.plan,
            cs.timezone, cs.currency, cs.logo_url,
            cs.tax_id, cs.registered_address, cs.phone_number, cs.website_url
     FROM   companies c
     LEFT JOIN company_settings cs ON cs.company_id = c.id
     WHERE  c.id = ?
     LIMIT  1`,
    [companyId]
  );
  return rows[0] ?? null;
}

/**
 * Upsert company compliance settings.
 */
export async function updateCompanySettings(companyId, data) {
  const {
    timezone,
    currency,
    logo_url,
    tax_id,
    registered_address,
    phone_number,
    website_url,
  } = data;

  await pool.execute(
    `INSERT INTO company_settings
       (company_id, timezone, currency, logo_url, tax_id, registered_address, phone_number, website_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       timezone            = VALUES(timezone),
       currency            = VALUES(currency),
       logo_url            = VALUES(logo_url),
       tax_id              = VALUES(tax_id),
       registered_address  = VALUES(registered_address),
       phone_number        = VALUES(phone_number),
       website_url         = VALUES(website_url)`,
    [
      companyId,
      timezone ?? 'UTC',
      currency ?? 'USD',
      logo_url ?? null,
      tax_id ?? null,
      registered_address ?? null,
      phone_number ?? null,
      website_url ?? null,
    ]
  );
}

// ── Integrations ─────────────────────────────────────────────────────────────

/**
 * List all integrations for a company (API keys redacted for security).
 */
export async function getIntegrations(companyId) {
  const [rows] = await pool.execute(
    `SELECT id, name, type, is_active, last_used_at, created_at,
            webhook_url, webhook_events,
            -- Only expose a masked key, never the full secret
            CASE WHEN api_key IS NOT NULL
                 THEN CONCAT(LEFT(api_key, 8), '…')
                 ELSE NULL
            END AS api_key_preview
     FROM   integrations
     WHERE  company_id = ?
     ORDER BY created_at DESC`,
    [companyId]
  );
  return rows;
}

/**
 * Create a new integration entry.
 */
export async function createIntegration(companyId, userId, data) {
  const { name, type, api_key, webhook_url, webhook_secret, webhook_events } = data;
  const [result] = await pool.execute(
    `INSERT INTO integrations
       (company_id, name, type, api_key, webhook_url, webhook_secret, webhook_events, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      companyId,
      name,
      type ?? 'api_key',
      api_key ?? null,
      webhook_url ?? null,
      webhook_secret ?? null,
      webhook_events ? JSON.stringify(webhook_events) : null,
      userId,
    ]
  );
  return result.insertId;
}

/**
 * Delete (soft-deactivate) an integration.
 */
export async function deleteIntegration(companyId, integrationId) {
  await pool.execute(
    `UPDATE integrations
     SET    is_active = 0
     WHERE  id = ? AND company_id = ?`,
    [integrationId, companyId]
  );
}

// ── Billing ──────────────────────────────────────────────────────────────────

/**
 * Fetch subscription and plan details for a company.
 */
export async function getBillingInfo(companyId) {
  const [rows] = await pool.execute(
    `SELECT s.id AS subscription_id, s.status, s.starts_at, s.ends_at,
            p.id AS plan_id, p.name AS plan_name, p.price,
            p.rfq_limit, p.vendor_limit, p.user_limit, p.email_limit,
            p.features
     FROM   subscriptions s
     JOIN   plans p ON p.id = s.plan_id
     WHERE  s.company_id = ?
     ORDER BY s.created_at DESC
     LIMIT  1`,
    [companyId]
  );
  return rows[0] ?? null;
}

// ── User Access ───────────────────────────────────────────────────────────────

/**
 * List all users in a company with their roles.
 */
export async function getCompanyUsers(companyId) {
  const [rows] = await pool.execute(
    `SELECT id, name, email, role, is_active, created_at
     FROM   users
     WHERE  company_id = ?
     ORDER BY name ASC`,
    [companyId]
  );
  return rows;
}

/**
 * Fetch a single user within a company (id, name, email, role).
 * Returns null if user is not found in the company.
 */
export async function getUserInCompany(targetUserId, companyId) {
  const [rows] = await pool.execute(
    `SELECT id, name, email, role FROM users WHERE id = ? AND company_id = ? LIMIT 1`,
    [targetUserId, companyId]
  );
  return rows[0] ?? null;
}

/**
 * Change the role of a user within a company.
 * Restricted: only company_admin can change roles, and only for users in their company.
 */
export async function updateUserRole(targetUserId, companyId, newRole) {
  const [result] = await pool.execute(
    `UPDATE users
     SET    role = ?
     WHERE  id = ? AND company_id = ?`,
    [newRole, targetUserId, companyId]
  );
  return result.affectedRows > 0;
}

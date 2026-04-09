// src/lib/subscription.js
//
// Subscription system for Procurexio.
//
// Provides plan lookup, limit enforcement, and plan assignment.
// All functions default to the FREE plan when no subscription exists,
// ensuring full backward compatibility with existing companies.
//
// Future-ready: add Stripe/Razorpay webhook handlers alongside assignPlanToCompany.

import pool from '@/lib/db';

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Return the FREE plan record (fallback when no subscription exists).
 * @returns {Promise<object>}
 */
async function getFreePlan() {
  const [[plan]] = await pool.execute(
    `SELECT * FROM plans WHERE name = 'free' LIMIT 1`
  );
  // Hard-coded safety net if seed hasn't been run yet
  return plan || {
    id: null,
    name: 'free',
    price: 0,
    rfq_limit: 5,
    vendor_limit: 10,
    user_limit: 1,
    email_limit: 50,
    features: {
      basic_bid_comparison: true,
      advanced_scoring: false,
      contract_management: false,
    },
  };
}

/**
 * Parse the features field — may be a JSON string or already an object.
 * @param {string|object|null} raw
 * @returns {object}
 */
function parseFeatures(raw) {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch { return {}; }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Get the active subscription record for a company.
 * Returns null when no subscription row exists (treat as FREE).
 *
 * @param {number|string} companyId
 * @returns {Promise<object|null>}
 */
export async function getCompanySubscription(companyId) {
  try {
    const [[row]] = await pool.execute(
      `SELECT s.*, p.name AS plan_name, p.price, p.rfq_limit, p.vendor_limit,
              p.user_limit, p.email_limit, p.features
         FROM subscriptions s
         JOIN plans p ON p.id = s.plan_id
        WHERE s.company_id = ? AND s.status = 'active'
        LIMIT 1`,
      [companyId]
    );
    if (!row) return null;
    return { ...row, features: parseFeatures(row.features) };
  } catch (err) {
    console.error('[subscription] getCompanySubscription error:', err.message);
    return null;
  }
}

/**
 * Get the effective plan for a company.
 * Falls back to the FREE plan when no active subscription exists.
 *
 * @param {number|string} companyId
 * @returns {Promise<object>}
 */
export async function getCompanyPlan(companyId) {
  try {
    const subscription = await getCompanySubscription(companyId);
    if (subscription) {
      return {
        id:           subscription.plan_id,
        name:         subscription.plan_name,
        price:        subscription.price,
        rfq_limit:    subscription.rfq_limit,
        vendor_limit: subscription.vendor_limit,
        user_limit:   subscription.user_limit,
        email_limit:  subscription.email_limit,
        features:     subscription.features,
      };
    }
    const freePlan = await getFreePlan();
    return { ...freePlan, features: parseFeatures(freePlan.features) };
  } catch (err) {
    console.error('[subscription] getCompanyPlan error:', err.message);
    return await getFreePlan();
  }
}

/**
 * Assign (or update) a named plan for a company.
 * Upserts the subscription row so re-assigning the same plan is safe.
 *
 * @param {number|string} companyId
 * @param {'free'|'pro'} planName
 * @returns {Promise<{ subscription: object, plan: object }>}
 */
export async function assignPlanToCompany(companyId, planName) {
  const [[plan]] = await pool.execute(
    `SELECT * FROM plans WHERE name = ? LIMIT 1`,
    [planName]
  );
  if (!plan) throw new Error(`Plan '${planName}' not found`);

  await pool.execute(
    `INSERT INTO subscriptions (company_id, plan_id, status)
     VALUES (?, ?, 'active')
     ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id), status = 'active', updated_at = NOW()`,
    [companyId, plan.id]
  );

  // Keep the companies.plan column in sync for backward-compat queries
  await pool.execute(
    `UPDATE companies SET plan = ? WHERE id = ?`,
    [planName, companyId]
  );

  const subscription = await getCompanySubscription(companyId);
  return { subscription, plan: { ...plan, features: parseFeatures(plan.features) } };
}

/**
 * Check whether a company has reached a plan limit for a given metric.
 *
 * Metrics and their DB queries:
 *   rfq     → COUNT(*) FROM rfqs WHERE company_id = ?
 *   vendor  → COUNT(*) FROM vendors WHERE company_id = ?
 *   user    → COUNT(*) FROM users WHERE company_id = ? (excludes vendor_user)
 *   email   → COUNT(*) FROM notifications WHERE company_id = ?
 *
 * Returns { allowed: boolean, current: number, limit: number, plan: object }.
 * NEVER throws — returns { allowed: true } on any unexpected error so the
 * caller is never blocked by a subscription system failure.
 *
 * @param {number|string} companyId
 * @param {'rfq'|'vendor'|'user'|'email'} metric
 * @returns {Promise<{ allowed: boolean, current: number, limit: number, plan: object }>}
 */
export async function checkLimit(companyId, metric) {
  try {
    const plan = await getCompanyPlan(companyId);

    const limitKey = {
      rfq:    'rfq_limit',
      vendor: 'vendor_limit',
      user:   'user_limit',
      email:  'email_limit',
    }[metric];

    if (!limitKey) return { allowed: true, current: 0, limit: -1, plan };

    const limit = plan[limitKey];

    // -1 means unlimited
    if (limit === -1) return { allowed: true, current: 0, limit: -1, plan };

    // Count current usage from DB
    let current = 0;
    if (metric === 'rfq') {
      const [rows] = await pool.execute(
        `SELECT COUNT(*) AS cnt FROM rfqs WHERE company_id = ?`,
        [companyId]
      );
      current = rows[0]?.cnt ?? 0;
    } else if (metric === 'vendor') {
      const [rows] = await pool.execute(
        `SELECT COUNT(*) AS cnt FROM vendors WHERE company_id = ? AND status != 'inactive'`,
        [companyId]
      );
      current = rows[0]?.cnt ?? 0;
    } else if (metric === 'user') {
      const [rows] = await pool.execute(
        `SELECT COUNT(*) AS cnt FROM users WHERE company_id = ? AND role != 'vendor_user'`,
        [companyId]
      );
      current = rows[0]?.cnt ?? 0;
    } else if (metric === 'email') {
      const [rows] = await pool.execute(
        `SELECT COUNT(*) AS cnt FROM notifications WHERE company_id = ?`,
        [companyId]
      );
      current = rows[0]?.cnt ?? 0;
    }

    return { allowed: current < limit, current, limit, plan };
  } catch (err) {
    console.error('[subscription] checkLimit error:', err.message);
    // Non-fatal — never block the caller due to a subscription system error
    return { allowed: true, current: 0, limit: -1, plan: null };
  }
}

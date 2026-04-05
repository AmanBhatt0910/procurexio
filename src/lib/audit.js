// src/lib/audit.js
//
// Centralized audit logging for Procurexio.
//
// Every significant user action is written to the `audit_logs` database table
// for security, compliance, and operational visibility.
//
// Usage:
//   import { logAction } from '@/lib/audit';
//   await logAction(request, {
//     userId:       user.id,
//     userEmail:    user.email,
//     actionType:   'login_success',
//     resourceType: 'user',
//     resourceId:   user.id,
//     status:       'success',
//   });

import pool from '@/lib/db';
import { log } from '@/lib/logger';

/**
 * Extract the client IP from a Next.js Request object.
 * @param {Request} request
 * @returns {string}
 */
function getIP(request) {
  if (!request) return 'unknown';
  return (
    request.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers?.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Write an audit log entry to the database.
 * Failures are caught and logged to stderr — never allowed to crash the request.
 *
 * @param {Request|null} request - The incoming HTTP request (for IP / User-Agent)
 * @param {object}       details
 * @param {number|null}  [details.userId]        - Authenticated user ID
 * @param {string|null}  [details.userEmail]      - Authenticated user email (stored for immutability)
 * @param {string}       details.actionType       - e.g. 'login_success', 'rfq_created'
 * @param {string|null}  [details.resourceType]   - e.g. 'user', 'rfq', 'bid', 'company'
 * @param {number|null}  [details.resourceId]     - PK of the affected resource
 * @param {string|null}  [details.resourceName]   - Human-readable name of the resource
 * @param {object|null}  [details.changes]        - JSON delta (before/after) if applicable
 * @param {string|null}  [details.status]         - 'success' | 'failure' | 'error'
 * @param {string|null}  [details.statusReason]   - Human-readable failure/error reason
 */
export async function logAction(request, details = {}) {
  const {
    userId       = null,
    userEmail    = null,
    actionType,
    resourceType = null,
    resourceId   = null,
    resourceName = null,
    changes      = null,
    status       = null,
    statusReason = null,
  } = details;

  if (!actionType) {
    log.warn('audit.logAction called without actionType', details);
    return;
  }

  const ip        = getIP(request);
  const userAgent = request?.headers?.get('user-agent') || null;

  try {
    await pool.execute(
      `INSERT INTO audit_logs
         (user_id, user_email, action_type, resource_type, resource_id, resource_name,
          changes, status, status_reason, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId      || null,
        userEmail   || null,
        actionType,
        resourceType || null,
        resourceId  || null,
        resourceName || null,
        changes     ? JSON.stringify(changes) : null,
        status      || null,
        statusReason || null,
        ip,
        userAgent,
      ]
    );
  } catch (err) {
    // Non-fatal — audit log failure must never break the request
    log.error('audit.logAction db error', { actionType, error: err.message });
  }
}

// ── Convenience action-type constants ────────────────────────────────────────

export const ACTION = {
  // Auth
  LOGIN_SUCCESS:            'login_success',
  LOGIN_FAILURE:            'login_failure',
  LOGOUT:                   'logout',
  REGISTER_SUCCESS:         'register_success',
  REGISTER_FAILURE:         'register_failure',
  PASSWORD_RESET_REQUEST:   'password_reset_request',
  PASSWORD_RESET_SENT:      'password_reset_sent',
  PASSWORD_RESET_COMPLETE:  'password_reset_complete',
  ACCOUNT_LOCKED:           'account_locked',

  // Users
  USER_CREATED:             'user_created',
  USER_UPDATED:             'user_updated',
  USER_DEACTIVATED:         'user_deactivated',
  USER_ROLE_CHANGED:        'user_role_changed',

  // Company
  COMPANY_CREATED:          'company_created',
  COMPANY_UPDATED:          'company_updated',
  COMPANY_STATUS_CHANGED:   'company_status_changed',

  // Vendors
  VENDOR_CREATED:           'vendor_created',
  VENDOR_UPDATED:           'vendor_updated',
  VENDOR_DEACTIVATED:       'vendor_deactivated',

  // RFQs
  RFQ_CREATED:              'rfq_created',
  RFQ_UPDATED:              'rfq_updated',
  RFQ_STATUS_CHANGED:       'rfq_status_changed',

  // Bids
  BID_CREATED:              'bid_created',
  BID_SUBMITTED:            'bid_submitted',
  BID_WITHDRAWN:            'bid_withdrawn',

  // Awards / Contracts
  AWARD_CREATED:            'award_created',
  AWARD_CANCELLED:          'award_cancelled',

  // Evaluations
  EVALUATION_SUBMITTED:     'evaluation_submitted',

  // Invitations
  INVITATION_CREATED:       'invitation_created',
  INVITATION_ACCEPTED:      'invitation_accepted',
};

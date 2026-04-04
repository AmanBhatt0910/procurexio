/**
 * src/lib/logger.js
 *
 * Centralized security & audit logger for Procurexio.
 *
 * Writes structured JSON log lines to:
 *   - stdout (always, for cloud log aggregators / systemd journal)
 *   - LOG_FILE_PATH env var if set (e.g. "/var/log/procurexio/app.log")
 *
 * Log levels:  info | warn | error | security
 *
 * Usage:
 *   import { log } from '@/lib/logger';
 *   log.security('login_success', { userId: 1, email: 'a@b.com', ip: '1.2.3.4' });
 *   log.warn('rate_limited', { ip: '1.2.3.4', path: '/api/auth/login' });
 */

// ── Config ──────────────────────────────────────────────────────────────────
const APP_NAME   = process.env.NEXT_PUBLIC_APP_NAME || 'procurexio';
const IS_PROD    = process.env.NODE_ENV === 'production';
const MIN_LEVEL  = process.env.LOG_LEVEL || (IS_PROD ? 'info' : 'debug');

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3, security: 1 };

// ── Core writer ─────────────────────────────────────────────────────────────

function write(level, event, data = {}) {
  if ((LEVELS[level] ?? 1) < (LEVELS[MIN_LEVEL] ?? 1)) return;

  const entry = {
    timestamp: new Date().toISOString(),
    app:       APP_NAME,
    level,
    event,
    ...data,
  };

  const line = JSON.stringify(entry);

  // Always write to stdout / stderr
  if (level === 'error' || level === 'warn') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }

  // Optionally append to a log file when LOG_FILE_PATH is configured.
  // Dynamic require ensures the 'fs' module is only resolved at runtime
  // and does not cause Turbopack to trace the entire project directory.
  const logFile = process.env.LOG_FILE_PATH;
  if (logFile) {
    try {
      const fs = require('fs');
      fs.appendFileSync(logFile, line + '\n', 'utf8');
    } catch {
      // Non-fatal — don't crash the request if the log file isn't writable
    }
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

export const log = {
  debug:    (event, data)    => write('debug',    event, data),
  info:     (event, data)    => write('info',     event, data),
  warn:     (event, data)    => write('warn',     event, data),
  error:    (event, data)    => write('error',    event, data),
  /** Dedicated security-event level — always written, never suppressed. */
  security: (event, data)    => write('security', event, data),
};

// ── Convenience helpers ──────────────────────────────────────────────────────

/**
 * Extract the client IP from a Next.js Request object.
 * Handles reverse-proxy X-Forwarded-For headers.
 */
export function getRequestIP(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Log an authentication event (login attempt, password reset, etc.).
 *
 * @param {'login_success'|'login_failure'|'logout'|'password_reset_request'|'password_reset_sent'|'register_success'|'register_failure'} event
 * @param {{ email?: string, userId?: number|string, ip: string, role?: string, reason?: string }} details
 */
export function logAuthEvent(event, details) {
  log.security(event, details);
}

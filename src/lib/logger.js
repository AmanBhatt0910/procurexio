/**
 * src/lib/logger.js
 *
 * Centralized security & audit logger for Procurexio.
 *
 * Writes structured JSON log lines to:
 *   - stdout/stderr (always, for cloud log aggregators / systemd journal)
 *   - Category log files:
 *       logs/activity/YYYY-MM-DD.log  — all actions
 *       logs/errors/YYYY-MM-DD.log    — errors only
 *       logs/security/YYYY-MM-DD.log  — auth, permissions, sensitive actions
 *     (when running server-side and file system is accessible)
 *
 * Log levels:  debug | info | warn | error | security
 *
 * Usage:
 *   import { log, trackAction } from '@/lib/logger';
 *   log.security('login_success', { userId: 1, email: 'a@b.com', ip: '1.2.3.4' });
 *   log.warn('rate_limited', { ip: '1.2.3.4', path: '/api/auth/login' });
 *   await trackAction(request, { actionType: 'BID_SUBMITTED', ... });
 */

import loggingConfig from '@/config/logging';

// ── Config ──────────────────────────────────────────────────────────────────
const APP_NAME  = process.env.NEXT_PUBLIC_APP_NAME || 'procurexio';
const IS_PROD   = process.env.NODE_ENV === 'production';
const MIN_LEVEL = process.env.LOG_LEVEL || loggingConfig.logLevel || (IS_PROD ? 'info' : 'debug');

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3, security: 1 };

// Action types classified as security events
const SECURITY_ACTION_TYPES = new Set([
  'login_success', 'login_failure', 'logout',
  'register_success', 'register_failure',
  'account_locked',
  'password_reset_request', 'password_reset_sent', 'password_reset_complete',
  'user_role_changed', 'user_deactivated',
  'company_status_changed',
  'invitation_created', 'invitation_accepted',
]);

// ── Sensitive-field redaction ────────────────────────────────────────────────

const REDACT_KEYS = new Set(loggingConfig.redactFields || []);

function redact(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 5) return obj;
  if (Array.isArray(obj)) return obj.map(v => redact(v, depth + 1));
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = REDACT_KEYS.has(k.toLowerCase()) ? '[REDACTED]' : redact(v, depth + 1);
  }
  return out;
}

// ── File helpers (server-side only) ─────────────────────────────────────────

function todayDateString() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Resolve the absolute log-file path for a given category and date.
 * Uses dynamic require so the 'path' module is not bundled by Turbopack.
 */
function resolveLogPath(category, dateStr) {
  try {
    const path = require('path');
    const logDir = loggingConfig.logDirectory || './logs';
    // Resolve relative to CWD (project root on the server)
    const base = path.isAbsolute(logDir)
      ? logDir
      : path.join(process.cwd(), logDir);
    return path.join(base, category, `${dateStr}.log`);
  } catch {
    return null;
  }
}

/**
 * Ensure a directory exists, creating it (including parents) if needed.
 * Never throws.
 */
function ensureDir(dirPath) {
  try {
    const fs = require('fs');
    fs.mkdirSync(dirPath, { recursive: true });
  } catch {
    // non-fatal
  }
}

/**
 * Append a line to a category log file.
 * Creates the directory and file if they do not exist.
 * Never throws.
 *
 * @param {'activity'|'errors'|'security'} category
 * @param {string} line  - JSON-serialised log entry
 */
function appendToFile(category, line) {
  if (!loggingConfig.enableFiles) return;
  try {
    const path = require('path');
    const fs   = require('fs');
    const filePath = resolveLogPath(category, todayDateString());
    if (!filePath) return;
    ensureDir(path.dirname(filePath));
    fs.appendFileSync(filePath, line + '\n', 'utf8');
  } catch {
    // Non-fatal — file write failure must never break the request
  }
}

// ── Log rotation helpers ─────────────────────────────────────────────────────

/**
 * Rotate log files:
 *  - Gzip-compress files older than `retentionDays.active` days into logs/archive/
 *  - Delete archive files older than `retentionDays.total` days
 *
 * This is a best-effort operation and never throws.
 * Call it from a scheduled job (e.g. a cron route or startup hook).
 */
export function rotateLogFiles() {
  try {
    const fs      = require('fs');
    const path    = require('path');
    const zlib    = require('zlib');
    const { retentionDays, logDirectory, categories } = loggingConfig;
    const base = path.isAbsolute(logDirectory)
      ? logDirectory
      : path.join(process.cwd(), logDirectory);

    const archiveDir = path.join(base, 'archive');
    ensureDir(archiveDir);

    const now          = Date.now();
    const activeMs     = (retentionDays.active || 30)  * 86400 * 1000;
    const totalMs      = (retentionDays.total  || 90)  * 86400 * 1000;

    // Archive old active logs
    for (const cat of categories) {
      const catDir = path.join(base, cat);
      if (!fs.existsSync(catDir)) continue;
      for (const file of fs.readdirSync(catDir)) {
        if (!file.endsWith('.log')) continue;
        const filePath = path.join(catDir, file);
        const stat = fs.statSync(filePath);
        const age  = now - stat.mtimeMs;
        if (age > activeMs) {
          // Compress into archive/
          const destName = `${cat}_${file}.gz`;
          const destPath = path.join(archiveDir, destName);
          try {
            const input  = fs.readFileSync(filePath);
            const compressed = zlib.gzipSync(input);
            fs.writeFileSync(destPath, compressed);
            fs.unlinkSync(filePath);
          } catch {
            // non-fatal — leave the original file intact on error
          }
        }
      }
    }

    // Delete stale archives
    if (fs.existsSync(archiveDir)) {
      for (const file of fs.readdirSync(archiveDir)) {
        const filePath = path.join(archiveDir, file);
        try {
          const stat = fs.statSync(filePath);
          if (now - stat.mtimeMs > totalMs) {
            fs.unlinkSync(filePath);
          }
        } catch {
          // non-fatal
        }
      }
    }
  } catch {
    // Rotation errors must never surface to the caller
  }
}

// ── Core writer ──────────────────────────────────────────────────────────────

function write(level, event, data = {}) {
  if ((LEVELS[level] ?? 1) < (LEVELS[MIN_LEVEL] ?? 1)) return;

  const entry = {
    timestamp: new Date().toISOString(),
    app:       APP_NAME,
    level,
    event,
    ...redact(data),
  };

  const line = JSON.stringify(entry);

  // Always write to stdout / stderr
  if (level === 'error' || level === 'warn') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }

  // Legacy single-file support (LOG_FILE_PATH env var)
  const logFile = process.env.LOG_FILE_PATH;
  if (logFile) {
    try {
      const fs = require('fs');
      fs.appendFileSync(logFile, line + '\n', 'utf8');
    } catch {
      // non-fatal
    }
  }

  // Category files
  appendToFile('activity', line);
  if (level === 'error')               appendToFile('errors',   line);
  if (level === 'security')            appendToFile('security', line);
}

// ── Public API ───────────────────────────────────────────────────────────────

export const log = {
  debug:    (event, data)  => write('debug',    event, data),
  info:     (event, data)  => write('info',     event, data),
  warn:     (event, data)  => write('warn',     event, data),
  error:    (event, data)  => write('error',    event, data),
  /** Dedicated security-event level — always written, never suppressed. */
  security: (event, data)  => write('security', event, data),
};

// ── Convenience helpers ───────────────────────────────────────────────────────

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

/**
 * Write a structured action entry to the appropriate category log file(s).
 *
 * This is the low-level file writer used by `logAction` in audit.js.
 * It does NOT write to the database — that is handled by audit.js.
 *
 * @param {object} data  - Structured action metadata (already sanitised / redacted)
 */
export function logToFile(data) {
  if (!loggingConfig.enableFiles) return;
  try {
    const line = JSON.stringify({ ...redact(data), app: APP_NAME });
    appendToFile('activity', line);
    if (data.status === 'error' || data.level === 'error') {
      appendToFile('errors', line);
    }
    if (SECURITY_ACTION_TYPES.has(data.actionType?.toLowerCase?.())) {
      appendToFile('security', line);
    }
  } catch {
    // non-fatal
  }
}

/**
 * src/lib/cronService.js
 *
 * Node.js cron scheduler for Procurexio.
 * Replaces the Vercel-only cron configuration (vercel.json) with a portable,
 * Node.js-based scheduler using the `node-cron` package.
 *
 * Scheduled jobs:
 *   - Close expired RFQs  — 0 0 * * *   (daily at midnight UTC)
 *   - Send deadline reminders — every 6 hours UTC
 *
 * Both jobs authenticate via Bearer token (CRON_SECRET env var) to match the
 * existing endpoint security model in /api/rfqs/close-expired and
 * /api/rfqs/reminders.
 *
 * Usage (called automatically from src/instrumentation.js on server start):
 *   import { startCronJobs } from '@/lib/cronService';
 *   startCronJobs();
 */

import cron from 'node-cron';
import http from 'http';
import https from 'https';
import { log } from '@/lib/logger';

// ── Config ───────────────────────────────────────────────────────────────────

const BASE_URL    = process.env.APP_BASE_URL || 'http://localhost:3001';
const CRON_SECRET = process.env.CRON_SECRET  || '';

// Request timeout in milliseconds
const REQUEST_TIMEOUT_MS = 60_000;

// ── Cron schedules ────────────────────────────────────────────────────────────

/** Daily at midnight UTC */
const SCHEDULE_CLOSE_EXPIRED = '0 0 * * *';
/** Every 6 hours UTC */
const SCHEDULE_REMINDERS     = '0 */6 * * *';

// ── HTTP helper ───────────────────────────────────────────────────────────────

/**
 * Make an authenticated GET request to a cron endpoint.
 * Returns a resolved promise with { status, data } on success,
 * or a rejected promise with an Error on failure.
 *
 * @param {string} endpoint  Absolute path, e.g. '/api/rfqs/close-expired'
 * @returns {Promise<{ status: number, data: unknown }>}
 */
function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    let url;
    try {
      url = new URL(endpoint, BASE_URL);
    } catch {
      return reject(new Error(`Invalid URL: ${BASE_URL}${endpoint}`));
    }

    const isHttps  = url.protocol === 'https:';
    const client   = isHttps ? https : http;
    const options  = {
      hostname: url.hostname,
      port:     url.port || (isHttps ? 443 : 80),
      path:     url.pathname + url.search,
      method:   'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type':  'application/json',
      },
    };

    const req = client.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        let data;
        try { data = JSON.parse(raw); } catch { data = raw; }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${typeof data === 'string' ? data : JSON.stringify(data)}`));
        }
      });
    });

    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      const timeoutError = new Error(`Request to ${endpoint} timed out after ${REQUEST_TIMEOUT_MS / 1000}s`);
      req.destroy();
      reject(timeoutError);
    });

    req.on('error', reject);
    req.end();
  });
}

// ── Guard against double-initialisation ──────────────────────────────────────

let cronJobsStarted = false;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Register and start all cron jobs.
 * Safe to call multiple times — will only initialise jobs once per process.
 */
export function startCronJobs() {
  if (cronJobsStarted) {
    log.warn('cron_already_started', { message: 'Cron jobs already initialised — skipping duplicate call.' });
    return;
  }
  cronJobsStarted = true;

  if (!CRON_SECRET) {
    log.warn('cron_no_secret', {
      message: 'CRON_SECRET is not set. Cron jobs will fail authentication. Set CRON_SECRET in your environment.',
    });
  }

  log.info('cron_starting', {
    message: 'Initialising scheduled cron jobs…',
    baseUrl: BASE_URL,
  });

  // ── Job 1: Close expired RFQs — daily at midnight UTC ────────────────────
  cron.schedule(SCHEDULE_CLOSE_EXPIRED, async () => {
    const ts = new Date().toISOString();
    log.info('cron_run', { job: 'close-expired', ts });
    try {
      const result = await makeRequest('/api/rfqs/close-expired');
      log.info('cron_success', { job: 'close-expired', ts, data: result.data });
    } catch (err) {
      log.error('cron_error', { job: 'close-expired', ts, error: err.message });
    }
  }, { timezone: 'UTC' });

  // ── Job 2: Send deadline reminders — every 6 hours UTC ───────────────────
  cron.schedule(SCHEDULE_REMINDERS, async () => {
    const ts = new Date().toISOString();
    log.info('cron_run', { job: 'reminders', ts });
    try {
      const result = await makeRequest('/api/rfqs/reminders');
      log.info('cron_success', { job: 'reminders', ts, data: result.data });
    } catch (err) {
      log.error('cron_error', { job: 'reminders', ts, error: err.message });
    }
  }, { timezone: 'UTC' });

  log.info('cron_started', {
    message: 'Cron jobs registered successfully.',
    jobs: [
      { name: 'close-expired', schedule: SCHEDULE_CLOSE_EXPIRED, description: 'Close expired RFQs (daily at midnight UTC)' },
      { name: 'reminders',     schedule: SCHEDULE_REMINDERS,     description: 'Send deadline reminders (every 6 hours UTC)' },
    ],
  });
}

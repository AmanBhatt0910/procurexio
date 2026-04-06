/**
 * src/config/logging.js
 *
 * Central configuration for the Procurexio activity logging system.
 * Controls both database and file-based logging behaviour.
 */

const config = {
  /** Write audit records to the `audit_logs` MySQL table */
  enableDatabase: true,

  /** Write structured JSON log lines to files under logDirectory */
  enableFiles: true,

  /** Root directory for log files (relative to project root) */
  logDirectory: './logs',

  /** Log categories — each gets its own sub-directory */
  categories: ['activity', 'errors', 'security'],

  /** Retention policy (days) */
  retentionDays: {
    /** Keep plain daily log files for this many days before archiving */
    active: 30,
    /** Keep gzip-compressed archives for this additional number of days */
    archive: 60,
    /** Hard delete everything older than this many days */
    total: 90,
  },

  /** Rotate (and optionally compress) log files larger than this (MB) */
  maxFileSizeMB: 100,

  /** Fields whose values are replaced with '[REDACTED]' before logging */
  redactFields: ['password', 'token', 'apiKey', 'api_key', 'ssn', 'secret', 'authorization'],

  /**
   * Minimum severity written to files.
   * Overridden by LOG_LEVEL env var at runtime.
   */
  logLevel: process.env.LOG_LEVEL || 'info',
};

export default config;

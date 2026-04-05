// src/lib/security.js
//
// Security utilities: cryptographic token generation and validation helpers.
// Used by password-reset, invite, and session management flows.

import { randomBytes } from 'crypto';

/**
 * Generate a cryptographically secure random token.
 * @param {number} byteLength - Number of random bytes (default: 32 → 64-char hex string)
 * @returns {string} Hex-encoded token string
 */
export function generateSecureToken(byteLength = 32) {
  return randomBytes(byteLength).toString('hex');
}

/**
 * Generate a password-reset token (64-char hex, 32 bytes of entropy).
 * @returns {string}
 */
export function generatePasswordResetToken() {
  return generateSecureToken(32);
}

/**
 * Generate a session token (64-char hex, 32 bytes of entropy).
 * @returns {string}
 */
export function generateSessionToken() {
  return generateSecureToken(32);
}

/**
 * Return a Date object offset from now by the given number of hours.
 * @param {number} hours
 * @returns {Date}
 */
export function expiresInHours(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

/**
 * Return a Date object offset from now by the given number of minutes.
 * @param {number} minutes
 * @returns {Date}
 */
export function expiresInMinutes(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Format a Date as a MySQL DATETIME string (YYYY-MM-DD HH:MM:SS).
 * @param {Date} date
 * @returns {string}
 */
export function toMySQLDatetime(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Both arguments must be strings.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

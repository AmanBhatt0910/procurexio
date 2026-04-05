// src/lib/validation.js
//
// Centralized input validation utilities for Procurexio.
// Use these helpers in API route handlers before touching the database.

// ── Regex constants ──────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE   = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

// ── Field length limits ──────────────────────────────────────────────────────

export const MAX_LENGTHS = {
  name:        255,
  email:       255,
  title:       500,
  description: 5000,
  address:     500,
  notes:       2000,
  currency:    10,
  url:         2048,
  password:    1024, // bcrypt hard limit is 72 bytes; reject absurdly long inputs
};

// ── Currency allowlist ───────────────────────────────────────────────────────

export const ALLOWED_CURRENCIES = new Set([
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD', 'CHF', 'JPY', 'CNY', 'HKD',
  'SGD', 'INR', 'BRL', 'MXN', 'ZAR', 'AED', 'SAR', 'SEK', 'NOK', 'DKK',
  'PLN', 'CZK', 'HUF', 'TRY', 'RUB', 'KRW', 'IDR', 'MYR', 'THB', 'PHP',
  'PKR', 'BDT', 'EGP', 'NGN', 'KES', 'GHS', 'MAD', 'DZD', 'TND', 'QAR',
  'KWD', 'BHD', 'OMR', 'JOD', 'LBP', 'ILS', 'UAH', 'VND', 'TWD', 'CLP',
  'COP', 'PEN', 'ARS', 'UYU', 'PYG', 'BOB', 'VEF', 'CRC', 'GTQ', 'HNL',
]);

// ── Validation helpers ───────────────────────────────────────────────────────

/**
 * Validate an email address.
 * @param {*} value
 * @returns {string|null} Error message or null if valid
 */
export function validateEmail(value) {
  if (!value || typeof value !== 'string') return 'Email is required.';
  const trimmed = value.trim();
  if (trimmed.length > MAX_LENGTHS.email)   return `Email must be at most ${MAX_LENGTHS.email} characters.`;
  if (!EMAIL_RE.test(trimmed))              return 'A valid email address is required.';
  return null;
}

/**
 * Validate a password (min length only — strength rules are enforced client-side).
 * @param {*} value
 * @param {number} [minLength=8]
 * @returns {string|null}
 */
export function validatePassword(value, minLength = 8) {
  if (!value || typeof value !== 'string')  return 'Password is required.';
  if (value.length < minLength)             return `Password must be at least ${minLength} characters.`;
  if (value.length > MAX_LENGTHS.password)  return 'Password is too long.';
  return null;
}

/**
 * Validate a free-text name field.
 * @param {*}      value
 * @param {string} fieldName - e.g. "Company name"
 * @param {number} [max]
 * @returns {string|null}
 */
export function validateName(value, fieldName = 'Name', max = MAX_LENGTHS.name) {
  if (!value || typeof value !== 'string' || !value.trim()) {
    return `${fieldName} is required.`;
  }
  if (value.trim().length > max) return `${fieldName} must be at most ${max} characters.`;
  return null;
}

/**
 * Validate a free-text description field (optional).
 * @param {*}      value
 * @param {string} fieldName
 * @param {number} [max]
 * @returns {string|null}
 */
export function validateDescription(value, fieldName = 'Description', max = MAX_LENGTHS.description) {
  if (value === null || value === undefined || value === '') return null; // optional
  if (typeof value !== 'string') return `${fieldName} must be a string.`;
  if (value.length > max)        return `${fieldName} must be at most ${max} characters.`;
  return null;
}

/**
 * Validate a URL string.
 * @param {*}      value
 * @param {string} fieldName
 * @param {boolean} [required=false]
 * @returns {string|null}
 */
export function validateUrl(value, fieldName = 'URL', required = false) {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return required ? `${fieldName} is required.` : null;
  }
  if (typeof value !== 'string')          return `${fieldName} must be a string.`;
  if (value.length > MAX_LENGTHS.url)     return `${fieldName} is too long.`;
  if (!URL_RE.test(value.trim()))         return `${fieldName} must be a valid http/https URL.`;
  return null;
}

/**
 * Validate a currency code against the allowlist.
 * @param {*} value
 * @param {boolean} [required=false]
 * @returns {string|null}
 */
export function validateCurrency(value, required = false) {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return required ? 'Currency is required.' : null;
  }
  if (typeof value !== 'string')             return 'Currency must be a string.';
  const upper = value.trim().toUpperCase();
  if (!ALLOWED_CURRENCIES.has(upper))        return `"${upper}" is not a supported currency code.`;
  return null;
}

/**
 * Collect multiple validation results into a single errors map.
 * Returns null if there are no errors.
 *
 * @param {{ [field: string]: string|null }} checks
 * @returns {{ [field: string]: string }|null}
 */
export function collectErrors(checks) {
  const errors = {};
  for (const [field, msg] of Object.entries(checks)) {
    if (msg) errors[field] = msg;
  }
  return Object.keys(errors).length ? errors : null;
}

// src/config/currencies.js
//
// Single source of truth for currency configuration.
//
// SUPPORTED_CURRENCIES — the short list shown in UI dropdowns.
// ALLOWED_CURRENCIES   — the full validation set (used by the API).
// DEFAULT_CURRENCY     — platform-wide fallback, overridable via env.

/** Platform-wide default currency code. */
export const DEFAULT_CURRENCY = process.env.DEFAULT_CURRENCY || 'USD';

/**
 * Currencies shown in UI dropdowns (company settings, RFQ creation, bid form).
 * Each entry has a `code` and a human-readable `label`.
 */
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'INR', label: 'INR — Indian Rupee' },
  { code: 'JPY', label: 'JPY — Japanese Yen' },
  { code: 'CAD', label: 'CAD — Canadian Dollar' },
  { code: 'AUD', label: 'AUD — Australian Dollar' },
  { code: 'SGD', label: 'SGD — Singapore Dollar' },
  { code: 'AED', label: 'AED — UAE Dirham' },
];

/** Just the currency codes from SUPPORTED_CURRENCIES (for simple <select> lists). */
export const SUPPORTED_CURRENCY_CODES = SUPPORTED_CURRENCIES.map(c => c.code);

/**
 * Full validation allowlist used by server-side API routes.
 * Kept as a Set for O(1) lookups.
 */
export const ALLOWED_CURRENCIES = new Set([
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD', 'CHF', 'JPY', 'CNY', 'HKD',
  'SGD', 'INR', 'BRL', 'MXN', 'ZAR', 'AED', 'SAR', 'SEK', 'NOK', 'DKK',
  'PLN', 'CZK', 'HUF', 'TRY', 'RUB', 'KRW', 'IDR', 'MYR', 'THB', 'PHP',
  'PKR', 'BDT', 'EGP', 'NGN', 'KES', 'GHS', 'MAD', 'DZD', 'TND', 'QAR',
  'KWD', 'BHD', 'OMR', 'JOD', 'LBP', 'ILS', 'UAH', 'VND', 'TWD', 'CLP',
  'COP', 'PEN', 'ARS', 'UYU', 'PYG', 'BOB', 'VEF', 'CRC', 'GTQ', 'HNL',
]);

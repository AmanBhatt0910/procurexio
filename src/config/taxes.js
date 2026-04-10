// src/config/taxes.js
//
// Region-keyed tax rate sets.
// Components load the appropriate rates based on company locale/region.
// Falls back to DEFAULT_TAX_RATES when no region match is found.

/**
 * Tax rate sets keyed by ISO 3166-1 alpha-2 country code.
 * Extend this map as new regions are supported.
 */
export const TAX_RATES_BY_REGION = {
  /** India — GST slabs */
  IN: [0, 5, 12, 18, 28],

  /** European Union — common VAT reference rates */
  EU: [0, 5, 10, 20, 25],

  /** United States — no federal sales tax; use 0 as base */
  US: [0],

  /** Australia — GST */
  AU: [0, 10],

  /** United Kingdom — VAT */
  GB: [0, 5, 20],

  /** Canada — GST/HST/PST approximation */
  CA: [0, 5, 13, 15],

  /** Singapore — GST */
  SG: [0, 9],

  /** UAE — VAT */
  AE: [0, 5],
};

/**
 * Default rates used when no region-specific set is found.
 * Keeps the component working even for unsupported regions.
 */
export const DEFAULT_TAX_RATES = [0, 5, 10, 15, 20];

/**
 * Get the applicable tax rates for a given region code.
 * @param {string|null|undefined} regionCode  ISO 3166-1 alpha-2 (e.g. 'IN', 'US')
 * @returns {number[]}
 */
export function getTaxRates(regionCode) {
  if (!regionCode) return DEFAULT_TAX_RATES;
  return TAX_RATES_BY_REGION[regionCode.toUpperCase()] ?? DEFAULT_TAX_RATES;
}

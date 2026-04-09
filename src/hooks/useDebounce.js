'use client';

/**
 * src/hooks/useDebounce.js
 *
 * Returns a debounced version of the supplied value.
 * The debounced value only updates after the component hasn't changed it
 * for `delay` milliseconds — useful for search inputs and live filters.
 *
 * @template T
 * @param {T}      value  - Value to debounce
 * @param {number} delay  - Debounce delay in milliseconds (default: 300)
 * @returns {T}           - Debounced value
 */

import { useState, useEffect } from 'react';

/**
 * @template T
 * @param {T} value
 * @param {number} [delay=300]
 * @returns {T}
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

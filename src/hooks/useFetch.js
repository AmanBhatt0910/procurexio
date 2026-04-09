'use client';

/**
 * src/hooks/useFetch.js
 *
 * Generic data-fetching hook. Wraps the native `fetch` API with loading,
 * error, and data state so consumers don't repeat the same boilerplate.
 *
 * @template T
 * @param {string|null} url          - URL to fetch. Pass `null` to skip.
 * @param {RequestInit} [options]    - Fetch options (method, headers, body, etc.)
 * @returns {{ data: T|null, loading: boolean, error: string|null, refetch: () => void }}
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * @template T
 * @param {string|null} url
 * @param {RequestInit} [options]
 * @returns {{ data: T|null, loading: boolean, error: string|null, refetch: () => void }}
 */
export function useFetch(url, options) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError]     = useState(null);
  const optionsRef            = useRef(options);
  const mountedRef            = useRef(true);

  // Keep options ref fresh without causing re-fetches on every render
  optionsRef.current = options;

  const execute = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(url, { credentials: 'include', ...optionsRef.current });
      const json = await res.json();
      if (!mountedRef.current) return;
      if (!res.ok) {
        setError(json.error || `Request failed (${res.status})`);
        setData(null);
      } else {
        setData(json.data ?? json);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err.message || 'Network error');
      setData(null);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    mountedRef.current = true;
    execute();
    return () => { mountedRef.current = false; };
  }, [execute]);

  return { data, loading, error, refetch: execute };
}

// src/hooks/useAuth.js

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * useAuth — client-side authentication hook.
 *
 * Fetches the current session from /api/auth/me.
 * Provides login, logout helpers.
 *
 * Usage:
 *   const { user, loading, login, logout } = useAuth();
 */
export function useAuth() {
  const router = useRouter();
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Fetch current session on mount
  useEffect(() => {
    fetchSession();
  }, []);

  async function fetchSession() {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Login helper.
   * @param {string} email
   * @param {string} password
   * @returns {{ success: boolean, error?: string }}
   */
  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return { success: false, error: data.error };
      }
      setUser(data.user);
      return { success: true, user: data.user };
    } catch {
      const msg = 'Network error. Please try again.';
      setError(msg);
      return { success: false, error: msg };
    }
  }, []);

  /**
   * Logout helper — calls API then redirects to login.
   */
  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  }, [router]);

  return { user, loading, error, login, logout, refetch: fetchSession };
}
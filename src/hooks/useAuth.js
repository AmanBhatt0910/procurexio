'use client';
// src/hooks/useAuth.js

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Module-level cache: survives component unmount/remount within the same browser
// session. Cleared on 401 so stale data is never shown after logout.
let _cachedUser  = null;
let _cacheReady  = false;

export function useAuth() {
  const router = useRouter();
  // Initialise from cache so RoleGuard can render immediately on re-navigation
  const [user, setUser]       = useState(_cachedUser);
  const [loading, setLoading] = useState(!_cacheReady);
  const [error, setError]     = useState(null);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });

      if (res.ok) {
        const data = await res.json();
        const userData = data.data ?? data.user ?? null;
        _cachedUser = userData;
        _cacheReady = true;
        setUser(userData);
      } else {
        // Session ended — clear cache so stale data isn't shown on next mount
        _cachedUser = null;
        _cacheReady = true;
        setUser(null);
      }
    } catch {
      _cachedUser = null;
      _cacheReady = true;
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return { success: false, error: data.error };
      }

      const loggedInUser = data.user ?? data.data ?? null;
      _cachedUser = loggedInUser;
      _cacheReady = true;
      setUser(loggedInUser);
      return { success: true, user: loggedInUser };
    } catch {
      const msg = 'Network error. Please try again.';
      setError(msg);
      return { success: false, error: msg };
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    _cachedUser = null;
    _cacheReady = true;
    setUser(null);
    router.push('/login');
  }, [router]);

  return { user, loading, error, login, logout, refetch: fetchSession };
}
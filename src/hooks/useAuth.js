'use client';
// src/hooks/useAuth.js

import { useState, useEffect, useCallback } from 'react';
import { AUTH_ENDPOINTS } from '@/config/api';

// Module-level cache: survives component unmount/remount within the same browser
// session. Cleared on 401 so stale data is never shown after logout.
let _cachedUser  = null;
let _cacheReady  = false;

export function useAuth() {
  // Initialise from cache so RoleGuard can render immediately on re-navigation
  const [user, setUser]       = useState(_cachedUser);
  const [loading, setLoading] = useState(!_cacheReady);
  const [error, setError]     = useState(null);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(AUTH_ENDPOINTS.ME, { credentials: 'include', cache: 'no-store' });

      if (res.ok) {
        const data = await res.json();
        const userData = data.data ?? null;
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
      const res = await fetch(AUTH_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return { success: false, error: data.error };
      }

      const loggedInUser = data.data ?? null;
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
    await fetch(AUTH_ENDPOINTS.LOGOUT, { method: 'POST', credentials: 'include' });
    _cachedUser = null;
    _cacheReady = true;
    setUser(null);
    // Use a hard navigation so the entire module-level auth cache is discarded
    // along with any React state left over from the previous session.
    window.location.href = '/login';
  }, []);

  return { user, loading, error, login, logout, refetch: fetchSession };
}
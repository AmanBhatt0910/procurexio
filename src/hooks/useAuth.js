'use client';
// src/hooks/useAuth.js

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const router = useRouter();
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    fetchSession();
  }, []);

  async function fetchSession() {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        // /api/auth/me returns { message, data: {...user} }  (not { user: {...} })
        setUser(data.data ?? data.user ?? null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

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
      // login endpoint likely returns { user: {...} } — handle both shapes
      setUser(data.user ?? data.data ?? null);
      return { success: true, user: data.user ?? data.data };
    } catch {
      const msg = 'Network error. Please try again.';
      setError(msg);
      return { success: false, error: msg };
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  }, [router]);

  return { user, loading, error, login, logout, refetch: fetchSession };
}
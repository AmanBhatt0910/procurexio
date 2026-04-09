'use client';

/**
 * src/hooks/useNotifications.js
 *
 * Custom hook that polls /api/notifications/unread-count every 30s.
 * Extracted from NotificationContext for use as a standalone hook.
 * Consumers that only need the count can use this hook directly;
 * components inside the provider tree use `useNotificationContext`.
 *
 * @returns {{ unreadCount: number, refresh: () => void }}
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { NOTIFICATION_POLL_INTERVAL_MS } from '@/config/constants';

/**
 * @returns {{ unreadCount: number, refresh: () => Promise<void> }}
 */
export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/unread-count');
      if (!res.ok) return;
      const data = await res.json();
      if (mounted.current) {
        setUnreadCount(data.count ?? 0);
      }
    } catch {
      // Network error — silently ignore, keep stale count
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const initialRefreshTimer = setTimeout(refresh, 0);
    const interval = setInterval(refresh, NOTIFICATION_POLL_INTERVAL_MS);
    return () => {
      clearTimeout(initialRefreshTimer);
      clearInterval(interval);
      mounted.current = false;
    };
  }, [refresh]);

  return { unreadCount, refresh };
}

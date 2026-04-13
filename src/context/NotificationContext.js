'use client';

/**
 * src/context/NotificationContext.js
 * Lightweight context that polls unread notification count every 30s.
 * Both TopBar and Sidebar consume this — single fetch, no prop-drilling.
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { NOTIFICATION_ENDPOINTS } from '@/config/api';
import { NOTIFICATION_POLL_INTERVAL } from '@/config/email';

const NotificationContext = createContext({ unreadCount: 0, latestNotification: null, refresh: () => {} });

export function NotificationProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState(null);
  const mounted = useRef(true);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch(NOTIFICATION_ENDPOINTS.UNREAD_COUNT);
      if (!res.ok) return;
      const data = await res.json();
      if (mounted.current) {
        setUnreadCount(data.count ?? 0);
        setLatestNotification(data.latestNotification ?? null);
      }
    } catch {
      // Network error — silently ignore, keep stale count
    }
  }, []);

  useEffect(() => {
    mounted.current = true;

    // Immediate fetch – ignoring the rule because data fetching is a valid effect side‑effect
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCount();

    const interval = setInterval(fetchCount, NOTIFICATION_POLL_INTERVAL);
    return () => {
      clearInterval(interval);
      mounted.current = false;
    };
  }, [fetchCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, latestNotification, refresh: fetchCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
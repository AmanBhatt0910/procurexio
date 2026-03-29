'use client';

/**
 * src/context/NotificationContext.js
 * Lightweight context that polls /api/notifications/unread-count every 30s.
 * Both TopBar and Sidebar consume this — single fetch, no prop-drilling.
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

const NotificationContext = createContext({ unreadCount: 0, refresh: () => {} });

export function NotificationProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const mounted = useRef(true);

  const fetchCount = useCallback(async () => {
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

    // Immediate fetch – ignoring the rule because data fetching is a valid effect side‑effect
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCount();

    const interval = setInterval(fetchCount, 30_000);
    return () => {
      clearInterval(interval);
      mounted.current = false;
    };
  }, [fetchCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refresh: fetchCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
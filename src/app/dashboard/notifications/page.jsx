'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import NotificationItem from '@/components/notifications/NotificationItem';
import { useNotifications } from '@/context/NotificationContext';

export default function NotificationsPage() {
  const router = useRouter();
  const { refresh: refreshCount } = useNotifications();

  const [notifications, setNotifications] = useState([]);
  const [meta, setMeta]                   = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading]             = useState(true);
  const [page, setPage]                   = useState(1);
  const [markingAll, setMarkingAll]       = useState(false);

  const fetchNotifications = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/notifications?page=${p}&limit=20`);
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.data);
        setMeta(data.meta);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(page);
  }, [fetchNotifications, page]);

  async function handleRead(notification) {
    if (!notification.isRead) {
      await fetch(`/api/notifications/${notification.id}/read`, { method: 'PATCH' });
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );
      refreshCount();
    }
    if (notification.link) {
      router.push(notification.link);
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'PATCH' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        refreshCount();
      }
    } finally {
      setMarkingAll(false);
    }
  }

  const hasUnread = notifications.some(n => !n.isRead);

  return (
    <DashboardLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        .notif-page { max-width: 720px; }

        .notif-list {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: var(--shadow);
        }

        .notif-list-empty {
          padding: 64px 24px;
          text-align: center;
        }
        .notif-empty-emoji {
          font-size: 2.5rem;
          display: block;
          margin-bottom: 12px;
        }
        .notif-empty-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--ink);
          margin: 0 0 6px;
        }
        .notif-empty-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: .88rem;
          color: var(--ink-soft);
          margin: 0;
        }

        .notif-skeleton {
          padding: 14px 18px;
          border-bottom: 1px solid var(--border);
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .skel {
          background: linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 4px;
        }
        @keyframes shimmer { to { background-position: -200% 0; } }

        .notif-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 20px;
          font-family: 'DM Sans', sans-serif;
          font-size: .85rem;
          color: var(--ink-soft);
        }
        .page-btn {
          padding: 6px 14px;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--white);
          font-family: 'DM Sans', sans-serif;
          font-size: .83rem;
          font-weight: 500;
          color: var(--ink);
          cursor: pointer;
          transition: background .15s, border-color .15s;
        }
        .page-btn:hover:not(:disabled) { background: var(--surface); border-color: var(--ink-faint); }
        .page-btn:disabled { opacity: .4; cursor: not-allowed; }

        .mark-all-btn {
          padding: 7px 16px;
          border: 1px solid var(--border);
          border-radius: 7px;
          background: var(--white);
          font-family: 'DM Sans', sans-serif;
          font-size: .83rem;
          font-weight: 500;
          color: var(--ink-soft);
          cursor: pointer;
          transition: all .15s;
        }
        .mark-all-btn:hover:not(:disabled) {
          background: var(--surface);
          color: var(--ink);
          border-color: var(--ink-faint);
        }
        .mark-all-btn:disabled { opacity: .5; cursor: not-allowed; }
      `}</style>

      <div className="notif-page">
        <PageHeader
          title="Notifications"
          subtitle={meta.total > 0 ? `${meta.total} total notification${meta.total !== 1 ? 's' : ''}` : 'Your activity feed'}
          action={
            hasUnread && (
              <button
                className="mark-all-btn"
                onClick={handleMarkAllRead}
                disabled={markingAll}
              >
                {markingAll ? 'Marking…' : 'Mark all as read'}
              </button>
            )
          }
        />

        <div className="notif-list">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div className="notif-skeleton" key={i}>
                <div className="skel" style={{ width: 28, height: 28, borderRadius: 6 }} />
                <div style={{ flex: 1 }}>
                  <div className="skel" style={{ height: 13, width: '60%', marginBottom: 7 }} />
                  <div className="skel" style={{ height: 11, width: '80%' }} />
                </div>
              </div>
            ))
          ) : notifications.length === 0 ? (
            <div className="notif-list-empty">
              <span className="notif-empty-emoji">🎉</span>
              <p className="notif-empty-title">You&#39;re all caught up</p>
              <p className="notif-empty-sub">No notifications yet. We&#39;ll let you know when something happens.</p>
            </div>
          ) : (
            notifications.map(n => (
              <NotificationItem
                key={n.id}
                notification={n}
                onRead={handleRead}
              />
            ))
          )}
        </div>

        {!loading && meta.totalPages > 1 && (
          <div className="notif-pagination">
            <button
              className="page-btn"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              ← Previous
            </button>
            <span>Page {page} of {meta.totalPages}</span>
            <button
              className="page-btn"
              disabled={page >= meta.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
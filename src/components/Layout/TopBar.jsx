'use client';
// src/components/Layout/TopBar.jsx

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/context/NotificationContext';
import { Menu, Bell, ChevronDown, LogOut } from 'lucide-react';

export default function TopBar({ user, title, onMenuToggle }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellHover, setBellHover] = useState(false);
  const { unreadCount, latestNotification } = useNotifications();

  const badgeLabel = unreadCount > 99 ? '99+' : unreadCount > 0 ? String(unreadCount) : null;

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <>
      <style>{`
        .topbar {
          height: 64px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          padding: 0 28px;
          background: var(--white);
          position: sticky;
          top: 0;
          z-index: 10;
          gap: 16px;
        }
        @media (max-width: 768px) {
          .topbar { padding: 0 16px; gap: 10px; }
        }
        .topbar-menu-btn {
          display: none;
          background: none;
          border: 1px solid var(--border);
          border-radius: 8px;
          width: 36px;
          height: 36px;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--ink);
          transition: background .15s, border-color .15s;
          flex-shrink: 0;
        }
        .topbar-menu-btn:hover {
          background: var(--surface);
          border-color: #d1ccc7;
        }
        @media (max-width: 768px) {
          .topbar-menu-btn { display: flex; }
        }
        .topbar-title {
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: 1rem;
          color: var(--ink);
          letter-spacing: -.02em;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        @media (max-width: 480px) {
          .topbar-title { font-size: .9rem; }
        }
        .topbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
        }
        @media (max-width: 480px) {
          .topbar-right { gap: 6px; }
        }

        /* ── Bell button ── */
        .topbar-bell-wrap {
          position: relative;
          flex-shrink: 0;
        }
        .topbar-bell-btn {
          position: relative;
          background: none;
          border: 1px solid var(--border);
          border-radius: 8px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--ink-soft);
          transition: background .15s, border-color .15s, color .15s;
        }
        .topbar-bell-btn:hover {
          background: var(--surface);
          border-color: #d1ccc7;
          color: var(--ink);
        }
        .topbar-bell-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          min-width: 16px;
          height: 16px;
          padding: 0 4px;
          border-radius: 999px;
          background: var(--accent);
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: .58rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          pointer-events: none;
          border: 2px solid var(--white);
        }

        /* ── Bell notification preview tooltip ── */
        .topbar-bell-tooltip {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 260px;
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          padding: 12px 14px;
          animation: fadeDown .12s ease;
          z-index: 30;
        }
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .topbar-bell-tooltip-title {
          font-family: 'DM Sans', sans-serif;
          font-size: .78rem;
          font-weight: 600;
          color: var(--ink);
          margin: 0 0 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .topbar-bell-tooltip-body {
          font-family: 'DM Sans', sans-serif;
          font-size: .75rem;
          color: var(--ink-soft);
          margin: 0 0 8px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .topbar-bell-tooltip-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .topbar-bell-tooltip-time {
          font-size: .7rem;
          color: var(--ink-faint);
          font-family: 'DM Sans', sans-serif;
        }
        .topbar-bell-tooltip-link {
          font-size: .72rem;
          font-weight: 600;
          color: var(--accent);
          font-family: 'DM Sans', sans-serif;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          text-decoration: none;
        }
        .topbar-bell-tooltip-link:hover { text-decoration: underline; }
        .topbar-bell-tooltip-empty {
          font-family: 'DM Sans', sans-serif;
          font-size: .78rem;
          color: var(--ink-faint);
          text-align: center;
          padding: 4px 0;
        }

        /* ── User button ── */
        .topbar-user-btn {
          display: flex;
          align-items: center;
          gap: 9px;
          background: none;
          border: 1px solid var(--border);
          border-radius: 40px;
          padding: 5px 12px 5px 5px;
          cursor: pointer;
          transition: border-color .15s, background .15s;
        }
        .topbar-user-btn:hover {
          background: var(--surface);
          border-color: #d1ccc7;
        }
        @media (max-width: 480px) {
          .topbar-user-btn { padding: 5px 8px 5px 5px; gap: 0; }
        }
        .topbar-avatar {
          width: 28px;
          height: 28px;
          background: var(--accent);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: .65rem;
          color: #fff;
          letter-spacing: .02em;
          flex-shrink: 0;
        }
        .topbar-user-name {
          font-family: 'DM Sans', sans-serif;
          font-size: .82rem;
          font-weight: 500;
          color: var(--ink);
        }
        .topbar-user-role {
          font-size: .7rem;
          color: var(--ink-faint);
          font-family: 'DM Sans', sans-serif;
        }
        .topbar-user-info {
          display: block;
        }
        @media (max-width: 480px) {
          .topbar-user-info { display: none; }
        }
        .topbar-chevron {
          color: var(--ink-faint);
          transition: transform .15s;
        }
        .topbar-chevron--open { transform: rotate(180deg); }
        @media (max-width: 480px) {
          .topbar-chevron { display: none; }
        }
        .topbar-menu {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          min-width: 180px;
          padding: 6px;
          animation: fadeDown .12s ease;
          z-index: 20;
        }
        .topbar-menu-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 6px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: .84rem;
          color: var(--ink);
          transition: background .12s;
          text-decoration: none;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          min-height: 44px;
        }
        .topbar-menu-item:hover { background: var(--surface); }
        .topbar-menu-item--danger { color: #c0392b; }
        .topbar-menu-item--danger:hover { background: #fdf2f1; }
        .topbar-menu-divider {
          height: 1px;
          background: var(--border);
          margin: 4px 0;
        }
      `}</style>

      <header className="topbar">
        {/* Mobile hamburger */}
        <button
          className="topbar-menu-btn"
          onClick={onMenuToggle}
          aria-label="Open menu"
        >
          <Menu size={16} />
        </button>

        <span className="topbar-title">{title}</span>

        <div className="topbar-right">
          {/* Bell / notifications */}
          <div
            className="topbar-bell-wrap"
            onMouseEnter={() => setBellHover(true)}
            onMouseLeave={() => setBellHover(false)}
          >
            <button
              className="topbar-bell-btn"
              onClick={() => router.push('/dashboard/notifications')}
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              title="Notifications"
            >
              <Bell size={16} />
              {badgeLabel && (
                <span className="topbar-bell-badge" aria-hidden="true">{badgeLabel}</span>
              )}
            </button>

            {bellHover && (
              <div className="topbar-bell-tooltip" role="status" aria-live="polite">
                {latestNotification ? (
                  <>
                    <p className="topbar-bell-tooltip-title">{latestNotification.title}</p>
                    {latestNotification.body && (
                      <p className="topbar-bell-tooltip-body">{latestNotification.body}</p>
                    )}
                    <div className="topbar-bell-tooltip-footer">
                      <span className="topbar-bell-tooltip-time">
                        {latestNotification.created_at
                          ? new Date(latestNotification.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </span>
                      <button
                        className="topbar-bell-tooltip-link"
                        onClick={() => router.push('/dashboard/notifications')}
                      >
                        View all →
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="topbar-bell-tooltip-empty">No unread notifications</p>
                )}
              </div>
            )}
          </div>

          {/* User menu */}
          <button className="topbar-user-btn" onClick={() => setMenuOpen(o => !o)}>
            <div className="topbar-avatar">{initials}</div>
            <div className="topbar-user-info">
              <div className="topbar-user-name">{user?.name ?? 'User'}</div>
              <div className="topbar-user-role">{user?.role?.replace('_', ' ')}</div>
            </div>
            <ChevronDown
              size={12}
              className={`topbar-chevron${menuOpen ? ' topbar-chevron--open' : ''}`}
            />
          </button>

          {menuOpen && (
            <div className="topbar-menu">
              <div className="topbar-menu-item" style={{ cursor: 'default', pointerEvents: 'none' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{user?.name}</div>
                  <div style={{ fontSize: '.74rem', color: 'var(--ink-soft)', marginTop: 1 }}>{user?.email}</div>
                </div>
              </div>
              <div className="topbar-menu-divider" />
              <button className="topbar-menu-item topbar-menu-item--danger" onClick={handleLogout}>
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
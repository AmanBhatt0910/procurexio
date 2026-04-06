'use client';
// src/components/Layout/TopBar.jsx

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/context/NotificationContext';

export default function TopBar({ user, title, onMenuToggle }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { unreadCount } = useNotifications();

  const badgeLabel = unreadCount > 99 ? '99+' : unreadCount > 0 ? String(unreadCount) : null;

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
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
          flex-shrink: 0;
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
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <span className="topbar-title">{title}</span>

        <div className="topbar-right">
          {/* Bell / notifications */}
          <button
            className="topbar-bell-btn"
            onClick={() => router.push('/dashboard/notifications')}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            title="Notifications"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {badgeLabel && (
              <span className="topbar-bell-badge" aria-hidden="true">{badgeLabel}</span>
            )}
          </button>

          {/* User menu */}
          <button className="topbar-user-btn" onClick={() => setMenuOpen(o => !o)}>
            <div className="topbar-avatar">{initials}</div>
            <div className="topbar-user-info">
              <div className="topbar-user-name">{user?.name ?? 'User'}</div>
              <div className="topbar-user-role">{user?.role?.replace('_', ' ')}</div>
            </div>
            <svg className={`topbar-chevron${menuOpen ? ' topbar-chevron--open' : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
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
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5 2H2.5A1.5 1.5 0 0 0 1 3.5v7A1.5 1.5 0 0 0 2.5 12H5M9.5 10l3-3-3-3M13 7H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
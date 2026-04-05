'use client';
// src/components/Layout/DashboardLayout.jsx

import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { NotificationProvider } from '@/context/NotificationContext';

// Module-level cache: persists across component mounts within the same browser session.
// This prevents the skeleton from re-appearing on every sidebar navigation.
// The cache is cleared if the session ends (401 from /api/auth/me).
let sessionUserCache    = null;
let sessionCompanyCache = null;

export default function DashboardLayout({ children, pageTitle }) {
  // Initialise state from cache so the sidebar renders immediately on re-navigation
  const [user,       setUser]       = useState(sessionUserCache);
  const [company,    setCompany]    = useState(sessionCompanyCache);
  const [userLoaded, setUserLoaded] = useState(sessionUserCache !== null);

  useEffect(() => {
    async function load() {
      try {
        const uRes = await fetch('/api/auth/me', { cache: 'no-store' });
        if (uRes.ok) {
          const u = await uRes.json();
          const userData = u.user ?? u.data ?? null;
          sessionUserCache = userData;
          setUser(userData);

          // Only fetch company for roles that belong to a company tenant
          const role = userData?.role;
          if (!['super_admin', 'vendor_user'].includes(role)) {
            const cRes = await fetch('/api/company');
            if (cRes.ok) {
              const c = await cRes.json();
              sessionCompanyCache = c.data;
              setCompany(c.data);
            }
          }
        } else {
          // Session ended — clear cache so stale data isn't shown on next mount
          sessionUserCache    = null;
          sessionCompanyCache = null;
        }
      } catch (_) {}
      // Mark user as loaded regardless of success so the sidebar can render
      setUserLoaded(true);
    }
    load();
  }, []);

  return (
    <NotificationProvider>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --ink:       #0f0e0d;
          --ink-soft:  #6b6660;
          --ink-faint: #b8b3ae;
          --surface:   #faf9f7;
          --white:     #ffffff;
          --accent:    #c8501a;
          --accent-h:  #a83e12;
          --border:    #e4e0db;
          --radius:    10px;
          --shadow:    0 1px 3px rgba(15,14,13,.06), 0 8px 32px rgba(15,14,13,.08);
        }

        body {
          font-family: 'DM Sans', sans-serif;
          background: var(--surface);
          color: var(--ink);
        }

        .dashboard-shell {
          display: flex;
          min-height: 100vh;
        }
        .dashboard-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .dashboard-content {
          flex: 1;
          padding: 32px 28px;
          animation: fadeUp .3s ease both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Sidebar skeleton shown before user role resolves */
        .sidebar-skeleton {
          width: 224px;
          min-height: 100vh;
          background: var(--ink);
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
        }
        .sidebar-skeleton-logo {
          height: 64px;
          border-bottom: 1px solid rgba(255,255,255,.07);
          display: flex;
          align-items: center;
          padding: 0 20px;
          gap: 10px;
        }
        .sidebar-skeleton-mark {
          width: 30px;
          height: 30px;
          background: var(--accent);
          border-radius: 8px;
          flex-shrink: 0;
        }
        .sidebar-skeleton-text {
          width: 80px;
          height: 14px;
          background: rgba(255,255,255,.08);
          border-radius: 4px;
        }
        .sidebar-skeleton-nav {
          flex: 1;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .sidebar-skeleton-item {
          height: 32px;
          background: rgba(255,255,255,.05);
          border-radius: 6px;
        }
      `}</style>

      <div className="dashboard-shell">
        {userLoaded ? (
          <Sidebar company={company} user={user} />
        ) : (
          <div className="sidebar-skeleton">
            <div className="sidebar-skeleton-logo">
              <div className="sidebar-skeleton-mark" />
              <div className="sidebar-skeleton-text" />
            </div>
            <div className="sidebar-skeleton-nav">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="sidebar-skeleton-item" />
              ))}
            </div>
          </div>
        )}
        <div className="dashboard-main">
          <TopBar user={user} title={pageTitle} />
          <main className="dashboard-content">
            {children}
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
}
'use client';
// src/components/layout/DashboardLayout.jsx

import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function DashboardLayout({ children, pageTitle }) {
  const [user, setUser]       = useState(null);
  const [company, setCompany] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [uRes, cRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/company'),
        ]);
        if (uRes.ok) {
          const u = await uRes.json();
          setUser(u.data);
        }
        if (cRes.ok) {
          const c = await cRes.json();
          setCompany(c.data);
        }
      } catch (_) {}
    }
    load();
  }, []);

  return (
    <>
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
      `}</style>

      <div className="dashboard-shell">
        <Sidebar company={company} />
        <div className="dashboard-main">
          <TopBar user={user} title={pageTitle} />
          <main className="dashboard-content">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
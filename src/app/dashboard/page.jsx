'use client';
// src/app/dashboard/page.jsx

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Badge from '@/components/ui/Badge';

const STAT_PLACEHOLDERS = [
  { label: 'Total Vendors',   value: '—', icon: '🏢', note: 'Module 3' },
  { label: 'Active RFQs',     value: '—', icon: '📋', note: 'Module 4' },
  { label: 'Open Bids',       value: '—', icon: '⭐', note: 'Module 5' },
  { label: 'Awarded Contracts', value: '—', icon: '✅', note: 'Module 6' },
];

export default function DashboardPage() {
  const [company, setCompany] = useState(null);
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [cRes, uRes] = await Promise.all([
          fetch('/api/company'),
          fetch('/api/company/users'),
        ]);
        if (cRes.ok)  setCompany((await cRes.json()).data);
        if (uRes.ok)  setUsers((await uRes.json()).data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <DashboardLayout pageTitle="Dashboard">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }
        .stat-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 20px 22px;
          position: relative;
          overflow: hidden;
        }
        .stat-card-label {
          font-size: .72rem;
          font-weight: 600;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--ink-faint);
          margin-bottom: 10px;
        }
        .stat-card-value {
          font-family: 'Syne', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          color: var(--ink);
          letter-spacing: -.04em;
          line-height: 1;
        }
        .stat-card-note {
          font-size: .74rem;
          color: var(--ink-faint);
          margin-top: 6px;
        }
        .stat-card-icon {
          position: absolute;
          right: 18px;
          top: 18px;
          font-size: 1.4rem;
          opacity: .25;
        }
        .section-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          color: var(--ink);
          letter-spacing: -.02em;
          margin-bottom: 4px;
        }
        .section-sub {
          font-size: .83rem;
          color: var(--ink-soft);
          margin-bottom: 16px;
        }
        .company-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 22px 24px;
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 28px;
        }
        .company-logo-placeholder {
          width: 48px;
          height: 48px;
          background: var(--ink);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.1rem;
          color: #fff;
          flex-shrink: 0;
        }
        .company-info-name {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1.05rem;
          color: var(--ink);
          letter-spacing: -.02em;
        }
        .company-info-meta {
          font-size: .82rem;
          color: var(--ink-soft);
          margin-top: 3px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        @media (max-width: 768px) { .two-col { grid-template-columns: 1fr; } }
        .user-row {
          display: flex;
          align-items: center;
          padding: 11px 0;
          border-bottom: 1px solid var(--border);
          gap: 10px;
        }
        .user-row:last-child { border-bottom: none; }
        .user-avatar {
          width: 32px;
          height: 32px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: .68rem;
          color: var(--ink-soft);
          flex-shrink: 0;
        }
        .user-name {
          font-size: .855rem;
          font-weight: 500;
          color: var(--ink);
          flex: 1;
        }
        .user-email {
          font-size: .78rem;
          color: var(--ink-faint);
        }
        .panel {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 20px 22px;
        }
        .welcome-banner {
          background: var(--ink);
          border-radius: var(--radius);
          padding: 24px 28px;
          margin-bottom: 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .welcome-text {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1.15rem;
          color: #fff;
          letter-spacing: -.02em;
        }
        .welcome-sub {
          font-size: .855rem;
          color: rgba(255,255,255,.5);
          margin-top: 4px;
          font-family: 'DM Sans', sans-serif;
        }
        .welcome-btn {
          background: var(--accent);
          color: #fff;
          border: none;
          padding: 10px 18px;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          font-size: .855rem;
          cursor: pointer;
          white-space: nowrap;
          text-decoration: none;
          display: inline-block;
          transition: background .15s;
        }
        .welcome-btn:hover { background: var(--accent-h); }
      `}</style>

      {/* Welcome banner */}
      {!loading && company && (
        <div className="welcome-banner">
          <div>
            <div className="welcome-text">Welcome back to {company.name}</div>
            <div className="welcome-sub">Here's a summary of your procurement workspace.</div>
          </div>
          <a href="/dashboard/company" className="welcome-btn">Manage Company →</a>
        </div>
      )}

      {/* Company quick-info */}
      {company && (
        <div className="company-card">
          <div className="company-logo-placeholder">
            {company.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="company-info-name">{company.name}</div>
            <div className="company-info-meta">
              <span>{company.email}</span>
              <Badge variant={company.plan}>{company.plan}</Badge>
            </div>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="overview-grid">
        <div className="stat-card">
          <div className="stat-card-label">Team Members</div>
          <div className="stat-card-value">{loading ? '—' : users.length}</div>
          <div className="stat-card-note">Active users</div>
          <div className="stat-card-icon">👥</div>
        </div>
        {STAT_PLACEHOLDERS.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-label">{s.label}</div>
            <div className="stat-card-value" style={{ color: 'var(--ink-faint)' }}>{s.value}</div>
            <div className="stat-card-note">Coming in {s.note}</div>
            <div className="stat-card-icon">{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Recent users panel */}
      <div className="two-col">
        <div>
          <div className="section-title">Team</div>
          <div className="section-sub">Recent members in your company</div>
          <div className="panel">
            {loading ? (
              <div style={{ color: 'var(--ink-faint)', fontSize: '.855rem' }}>Loading…</div>
            ) : users.length === 0 ? (
              <div style={{ color: 'var(--ink-faint)', fontSize: '.855rem' }}>No users yet. Invite your team!</div>
            ) : (
              users.slice(0, 6).map((u) => (
                <div key={u.id} className="user-row">
                  <div className="user-avatar">
                    {u.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="user-name">{u.name}</div>
                    <div className="user-email">{u.email}</div>
                  </div>
                  <Badge variant={u.role}>{u.role}</Badge>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="section-title">Modules</div>
          <div className="section-sub">Procurement workflow status</div>
          <div className="panel">
            {[
              { name: 'Auth & Authorization', status: 'complete' },
              { name: 'Tenant Management',    status: 'complete' },
              { name: 'Vendor Management',    status: 'pending' },
              { name: 'RFQ Management',       status: 'pending' },
              { name: 'Bidding',              status: 'pending' },
              { name: 'Evaluation & Award',   status: 'pending' },
            ].map((mod) => (
              <div key={mod.name} className="user-row" style={{ justifyContent: 'space-between' }}>
                <span style={{ fontSize: '.855rem', color: mod.status === 'complete' ? 'var(--ink)' : 'var(--ink-faint)' }}>
                  {mod.name}
                </span>
                <Badge variant={mod.status}>{mod.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
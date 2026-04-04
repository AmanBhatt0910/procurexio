'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import RoleGuard from '@/components/auth/RoleGuard';
import { useRouter } from 'next/navigation';
import Badge from '@/components/ui/Badge';

function RedirectToDashboard() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard'); }, [router]);
  return null;
}

export default function SuperAdminPage() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(json => {
        if (json.data) setStats(json.data);
        else setError(json.error || 'Failed to load');
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <RoleGuard roles={['super_admin']} fallback={<RedirectToDashboard />}>
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Syne:wght@600;700;800&display=swap');
          :root {
            --ink:#0f0e0d;--ink-soft:#6b6660;--ink-faint:#b8b3ae;
            --surface:#faf9f7;--white:#ffffff;--accent:#c8501a;--accent-h:#a83e12;
            --border:#e4e0db;--radius:10px;
            --shadow:0 1px 3px rgba(15,14,13,.06),0 8px 32px rgba(15,14,13,.08);
          }
          body { font-family: 'DM Sans', sans-serif; }
          .admin-hero {
            background: var(--ink);
            border-radius: var(--radius);
            padding: 28px 32px;
            margin-bottom: 28px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
          }
          .admin-hero-title {
            font-family: 'Syne', sans-serif;
            font-weight: 800;
            font-size: 1.3rem;
            color: #fff;
            letter-spacing: -.03em;
            margin-bottom: 4px;
          }
          .admin-hero-sub {
            font-size: .855rem;
            color: rgba(255,255,255,.45);
          }
          .admin-hero-badge {
            background: var(--accent);
            color: #fff;
            font-family: 'Syne', sans-serif;
            font-weight: 700;
            font-size: .75rem;
            padding: 4px 12px;
            border-radius: 20px;
            letter-spacing: .04em;
            text-transform: uppercase;
            flex-shrink: 0;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
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
            box-shadow: var(--shadow);
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
            opacity: .18;
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
          .panel {
            background: var(--white);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 20px 22px;
            box-shadow: var(--shadow);
          }
          .company-row {
            display: flex;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid var(--border);
            gap: 12px;
          }
          .company-row:last-child { border-bottom: none; }
          .company-avatar {
            width: 36px;
            height: 36px;
            background: var(--ink);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Syne', sans-serif;
            font-weight: 800;
            font-size: .8rem;
            color: #fff;
            flex-shrink: 0;
          }
          .company-name {
            font-size: .88rem;
            font-weight: 500;
            color: var(--ink);
            flex: 1;
            min-width: 0;
          }
          .company-email {
            font-size: .78rem;
            color: var(--ink-faint);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .company-date {
            font-size: .75rem;
            color: var(--ink-faint);
            white-space: nowrap;
          }
          .error-box {
            background: #fdf0eb;
            border: 1px solid #f5c9b6;
            border-radius: var(--radius);
            padding: 14px 18px;
            color: var(--accent);
            font-size: .88rem;
            margin-bottom: 20px;
          }
          .skeleton {
            background: linear-gradient(90deg, #f0ede9 25%, #faf9f7 50%, #f0ede9 75%);
            background-size: 200% 100%;
            animation: shimmer 1.2s infinite;
            border-radius: 6px;
          }
          @keyframes shimmer { to { background-position: -200% 0; } }
          .info-note {
            background: #f0f5ff;
            border: 1px solid #c3d5f8;
            border-radius: var(--radius);
            padding: 12px 18px;
            color: #2d5bb8;
            font-size: .85rem;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
        `}</style>
        <DashboardLayout pageTitle="Platform Admin">
          {/* Hero banner */}
          <div className="admin-hero">
            <div>
              <div className="admin-hero-title">Platform Administration</div>
              <div className="admin-hero-sub">
                Super Admin — platform-wide visibility across all companies, users, and activity.
              </div>
            </div>
            <div className="admin-hero-badge">Super Admin</div>
          </div>

          <div className="info-note">
            🛡️ You have platform-level access. This view shows data across <strong>all companies</strong> on this instance.
          </div>

          {error && <div className="error-box">{error}</div>}

          {/* Quick access navigation cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 32 }}>
            {[
              { href: '/dashboard/admin/companies', icon: '🏢', label: 'Companies', sub: 'Manage all tenants' },
              { href: '/dashboard/admin/users',     icon: '👥', label: 'Users',     sub: 'Global user management' },
              { href: '/dashboard/vendors',         icon: '🤝', label: 'Vendors',   sub: 'Platform-wide overview' },
              { href: '/dashboard/rfqs',            icon: '📋', label: 'RFQs',      sub: 'Analytics & read-only' },
              { href: '/dashboard/admin/settings',  icon: '⚙️', label: 'Settings',  sub: 'Platform configuration' },
              { href: '/dashboard/admin/activity-logs', icon: '📜', label: 'Activity Logs', sub: 'Audit trail' },
            ].map(card => (
              <a
                key={card.href}
                href={card.href}
                style={{
                  background: 'var(--white)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '16px 18px',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  boxShadow: 'var(--shadow)',
                  transition: 'border-color .15s, box-shadow .15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(200,80,26,.10)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'var(--shadow)';
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>{card.icon}</span>
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '.9rem', color: 'var(--ink)' }}>{card.label}</span>
                <span style={{ fontSize: '.77rem', color: 'var(--ink-faint)' }}>{card.sub}</span>
              </a>
            ))}
          </div>

          {/* Stats grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-label">Companies</div>
              <div className="stat-card-value">
                {loading ? <span className="skeleton" style={{ display: 'inline-block', width: 60, height: 36 }} /> : (stats?.totalCompanies ?? '—')}
              </div>
              <div className="stat-card-note">Registered tenants</div>
              <div className="stat-card-icon">🏢</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">Total Users</div>
              <div className="stat-card-value">
                {loading ? <span className="skeleton" style={{ display: 'inline-block', width: 60, height: 36 }} /> : (stats?.totalUsers ?? '—')}
              </div>
              <div className="stat-card-note">Across all companies</div>
              <div className="stat-card-icon">👥</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">Vendors</div>
              <div className="stat-card-value">
                {loading ? <span className="skeleton" style={{ display: 'inline-block', width: 60, height: 36 }} /> : (stats?.totalVendors ?? '—')}
              </div>
              <div className="stat-card-note">Platform-wide</div>
              <div className="stat-card-icon">🤝</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">Total RFQs</div>
              <div className="stat-card-value">
                {loading ? <span className="skeleton" style={{ display: 'inline-block', width: 60, height: 36 }} /> : (stats?.totalRfqs ?? '—')}
              </div>
              <div className="stat-card-note">
                {loading ? '' : `${stats?.activeRfqs ?? 0} open`}
              </div>
              <div className="stat-card-icon">📋</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">Total Bids</div>
              <div className="stat-card-value">
                {loading ? <span className="skeleton" style={{ display: 'inline-block', width: 60, height: 36 }} /> : (stats?.totalBids ?? '—')}
              </div>
              <div className="stat-card-note">
                {loading ? '' : `${stats?.submittedBids ?? 0} submitted`}
              </div>
              <div className="stat-card-icon">⭐</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-label">Contracts</div>
              <div className="stat-card-value">
                {loading ? <span className="skeleton" style={{ display: 'inline-block', width: 60, height: 36 }} /> : (stats?.awardedContracts ?? '—')}
              </div>
              <div className="stat-card-note">Awarded & active</div>
              <div className="stat-card-icon">✅</div>
            </div>
          </div>

          {/* Recent companies */}
          <div>
            <div className="section-title">Recent Companies</div>
            <div className="section-sub">Latest tenants registered on the platform</div>
            <div className="panel">
              {loading ? (
                <>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                      <span className="skeleton" style={{ display: 'block', height: 14, width: '60%', marginBottom: 6 }} />
                      <span className="skeleton" style={{ display: 'block', height: 12, width: '40%' }} />
                    </div>
                  ))}
                </>
              ) : !stats?.recentCompanies?.length ? (
                <div style={{ color: 'var(--ink-faint)', fontSize: '.855rem' }}>No companies found.</div>
              ) : (
                stats.recentCompanies.map(c => (
                  <div key={c.id} className="company-row">
                    <div className="company-avatar">
                      {c.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="company-name">{c.name}</div>
                      <div className="company-email">{c.email}</div>
                    </div>
                    <Badge variant={c.plan}>{c.plan}</Badge>
                    <div className="company-date">
                      {c.created_at
                        ? new Date(c.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DashboardLayout>
      </>
    </RoleGuard>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import RoleGuard from '@/components/auth/RoleGuard';
import { useRouter } from 'next/navigation';
import Badge from '@/components/ui/Badge';

function RedirectToDashboard() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard'); }, [router]);
  return null;
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [meta, setMeta]           = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]           = useState(1);
  const [updating, setUpdating]   = useState(null);

  const fetchCompanies = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 20 });
      if (search)       params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res  = await fetch(`/api/admin/companies?${params}`);
      const data = await res.json();
      if (res.ok) {
        setCompanies(data.data);
        setMeta(data.meta);
      }
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchCompanies(page); }, [fetchCompanies, page]);

  async function handleStatusChange(companyId, newStatus) {
    setUpdating(companyId);
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: companyId, status: newStatus }),
      });
      if (res.ok) {
        setCompanies(prev =>
          prev.map(c => c.id === companyId ? { ...c, status: newStatus } : c)
        );
      }
    } finally {
      setUpdating(null);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    fetchCompanies(1);
  }

  return (
    <RoleGuard roles={['super_admin']} fallback={<RedirectToDashboard />}>
      <>
        <style>{`
          .page-header { margin-bottom: 24px; }
          .page-title {
            font-family: 'Syne', sans-serif;
            font-weight: 700;
            font-size: 1.4rem;
            color: var(--ink);
            letter-spacing: -.03em;
            margin-bottom: 4px;
          }
          .page-sub { font-size: .855rem; color: var(--ink-soft); }

          .filter-bar {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            flex-wrap: wrap;
          }
          .filter-input {
            flex: 1;
            min-width: 200px;
            padding: 8px 12px;
            border: 1px solid var(--border);
            border-radius: 8px;
            font-family: 'DM Sans', sans-serif;
            font-size: .855rem;
            background: var(--white);
            color: var(--ink);
            outline: none;
            transition: border-color .15s;
          }
          .filter-input:focus { border-color: var(--accent); }
          .filter-select {
            padding: 8px 12px;
            border: 1px solid var(--border);
            border-radius: 8px;
            font-family: 'DM Sans', sans-serif;
            font-size: .855rem;
            background: var(--white);
            color: var(--ink);
            outline: none;
            cursor: pointer;
          }
          .filter-btn {
            padding: 8px 16px;
            background: var(--accent);
            color: #fff;
            border: none;
            border-radius: 8px;
            font-family: 'DM Sans', sans-serif;
            font-size: .855rem;
            font-weight: 500;
            cursor: pointer;
            transition: background .15s;
          }
          .filter-btn:hover { background: var(--accent-h); }

          .table-wrap {
            background: var(--white);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            overflow: hidden;
            box-shadow: var(--shadow);
          }
          table { width: 100%; border-collapse: collapse; }
          th {
            font-family: 'DM Sans', sans-serif;
            font-size: .72rem;
            font-weight: 600;
            letter-spacing: .08em;
            text-transform: uppercase;
            color: var(--ink-faint);
            padding: 12px 16px;
            text-align: left;
            border-bottom: 1px solid var(--border);
            background: var(--surface);
            white-space: nowrap;
          }
          td {
            padding: 13px 16px;
            font-size: .855rem;
            color: var(--ink);
            border-bottom: 1px solid var(--border);
            vertical-align: middle;
          }
          tr:last-child td { border-bottom: none; }
          tr:hover td { background: #fdfcfb; }

          .company-cell { display: flex; align-items: center; gap: 10px; }
          .company-avatar {
            width: 32px; height: 32px;
            background: var(--ink);
            border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
            font-family: 'Syne', sans-serif;
            font-weight: 800; font-size: .75rem; color: #fff;
            flex-shrink: 0;
          }
          .company-name { font-weight: 500; }
          .company-email { font-size: .78rem; color: var(--ink-faint); margin-top: 1px; }

          .action-btn {
            padding: 5px 10px;
            border-radius: 6px;
            border: 1px solid var(--border);
            background: var(--white);
            font-family: 'DM Sans', sans-serif;
            font-size: .78rem;
            font-weight: 500;
            cursor: pointer;
            transition: all .15s;
            color: var(--ink);
          }
          .action-btn:hover { background: var(--surface); border-color: var(--ink-faint); }
          .action-btn--activate {
            color: #166534;
            border-color: #bbf7d0;
            background: #f0fdf4;
          }
          .action-btn--activate:hover { background: #dcfce7; }
          .action-btn--deactivate {
            color: #9a3412;
            border-color: #fed7aa;
            background: #fff7ed;
          }
          .action-btn--deactivate:hover { background: #ffedd5; }

          .pagination {
            display: flex; align-items: center; justify-content: center;
            gap: 12px; padding: 20px;
            font-size: .85rem; color: var(--ink-soft);
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
            transition: background .15s;
          }
          .page-btn:hover:not(:disabled) { background: var(--surface); }
          .page-btn:disabled { opacity: .4; cursor: not-allowed; }

          .stat-row {
            display: flex; gap: 6px; flex-wrap: wrap; align-items: center;
          }
          .stat-chip {
            font-size: .72rem;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 2px 8px;
            color: var(--ink-soft);
            white-space: nowrap;
          }
          .empty-state {
            padding: 48px 24px; text-align: center;
            color: var(--ink-faint); font-size: .88rem;
          }
          .skel { background: linear-gradient(90deg,#f0ede9 25%,#faf9f7 50%,#f0ede9 75%); background-size:200% 100%; animation:shimmer 1.2s infinite; border-radius:4px; }
          @keyframes shimmer { to { background-position: -200% 0; } }
        `}</style>

        <DashboardLayout pageTitle="Companies Management">
          <div className="page-header">
            <div className="page-title">Companies Management</div>
            <div className="page-sub">View and manage all companies registered on the platform</div>
          </div>

          <form className="filter-bar" onSubmit={handleSearch}>
            <input
              className="filter-input"
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="filter-select"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
            <button type="submit" className="filter-btn">Search</button>
          </form>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Stats</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j}>
                          <div className="skel" style={{ height: 14, width: j === 0 ? '80%' : '60%' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : companies.length === 0 ? (
                  <tr><td colSpan={6} className="empty-state">No companies found.</td></tr>
                ) : (
                  companies.map(c => (
                    <tr key={c.id}>
                      <td>
                        <div className="company-cell">
                          <div className="company-avatar">{c.name?.charAt(0).toUpperCase()}</div>
                          <div>
                            <div className="company-name">{c.name}</div>
                            <div className="company-email">{c.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><Badge variant={c.plan}>{c.plan ?? '—'}</Badge></td>
                      <td><Badge variant={c.status}>{c.status ?? 'active'}</Badge></td>
                      <td>
                        <div className="stat-row">
                          <span className="stat-chip">👥 {c.user_count ?? 0} users</span>
                          <span className="stat-chip">📋 {c.rfq_count ?? 0} RFQs</span>
                          <span className="stat-chip">⭐ {c.bid_count ?? 0} bids</span>
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--ink-faint)', fontSize: '.78rem' }}>
                        {c.created_at
                          ? new Date(c.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {c.status !== 'active' && (
                            <button
                              className="action-btn action-btn--activate"
                              disabled={updating === c.id}
                              onClick={() => handleStatusChange(c.id, 'active')}
                            >
                              {updating === c.id ? '…' : 'Activate'}
                            </button>
                          )}
                          {c.status !== 'inactive' && (
                            <button
                              className="action-btn action-btn--deactivate"
                              disabled={updating === c.id}
                              onClick={() => handleStatusChange(c.id, 'inactive')}
                            >
                              {updating === c.id ? '…' : 'Deactivate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && meta.totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span>Page {page} of {meta.totalPages} ({meta.total} total)</span>
              <button className="page-btn" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </DashboardLayout>
      </>
    </RoleGuard>
  );
}

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

const ROLE_LABELS = {
  super_admin:   'Super Admin',
  company_admin: 'Company Admin',
  manager:       'Manager',
  employee:      'Employee',
  vendor_user:   'Vendor User',
};

export default function AdminUsersPage() {
  const [users, setUsers]       = useState([]);
  const [meta, setMeta]         = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [roleFilter, setRoleFilter]   = useState('');
  const [page, setPage]         = useState(1);

  const fetchUsers = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 20 });
      if (search)     params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const res  = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (res.ok) {
        setUsers(data.data);
        setMeta(data.meta);
      }
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => { fetchUsers(page); }, [fetchUsers, page]);

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    fetchUsers(1);
  }

  return (
    <RoleGuard roles={['super_admin']} fallback={<RedirectToDashboard />}>
      <>
        <style>{`
          .page-header { margin-bottom: 24px; }
          .page-title {
            font-family: 'Syne', sans-serif;
            font-weight: 700; font-size: 1.4rem;
            color: var(--ink); letter-spacing: -.03em; margin-bottom: 4px;
          }
          .page-sub { font-size: .855rem; color: var(--ink-soft); }

          .filter-bar {
            display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;
          }
          .filter-input {
            flex: 1; min-width: 200px;
            padding: 8px 12px; border: 1px solid var(--border); border-radius: 8px;
            font-family: 'DM Sans', sans-serif; font-size: .855rem;
            background: var(--white); color: var(--ink); outline: none;
            transition: border-color .15s;
          }
          .filter-input:focus { border-color: var(--accent); }
          .filter-select {
            padding: 8px 12px; border: 1px solid var(--border); border-radius: 8px;
            font-family: 'DM Sans', sans-serif; font-size: .855rem;
            background: var(--white); color: var(--ink); outline: none; cursor: pointer;
          }
          .filter-btn {
            padding: 8px 16px; background: var(--accent); color: #fff; border: none;
            border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: .855rem;
            font-weight: 500; cursor: pointer; transition: background .15s;
          }
          .filter-btn:hover { background: var(--accent-h); }

          .table-wrap {
            background: var(--white); border: 1px solid var(--border);
            border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow);
          }
          table { width: 100%; border-collapse: collapse; }
          th {
            font-family: 'DM Sans', sans-serif; font-size: .72rem; font-weight: 600;
            letter-spacing: .08em; text-transform: uppercase; color: var(--ink-faint);
            padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--border);
            background: var(--surface); white-space: nowrap;
          }
          td {
            padding: 13px 16px; font-size: .855rem; color: var(--ink);
            border-bottom: 1px solid var(--border); vertical-align: middle;
          }
          tr:last-child td { border-bottom: none; }
          tr:hover td { background: #fdfcfb; }

          .user-cell { display: flex; align-items: center; gap: 10px; }
          .user-avatar {
            width: 32px; height: 32px;
            background: var(--surface); border: 1px solid var(--border);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-family: 'Syne', sans-serif; font-weight: 700;
            font-size: .68rem; color: var(--ink-soft); flex-shrink: 0;
          }
          .user-name { font-weight: 500; }
          .user-email { font-size: .78rem; color: var(--ink-faint); margin-top: 1px; }

          .company-chip {
            font-size: .78rem; color: var(--ink-soft);
            background: var(--surface); border: 1px solid var(--border);
            border-radius: 6px; padding: 3px 8px; display: inline-block;
          }

          .pagination {
            display: flex; align-items: center; justify-content: center;
            gap: 12px; padding: 20px;
            font-size: .85rem; color: var(--ink-soft);
          }
          .page-btn {
            padding: 6px 14px; border: 1px solid var(--border); border-radius: 6px;
            background: var(--white); font-family: 'DM Sans', sans-serif; font-size: .83rem;
            font-weight: 500; color: var(--ink); cursor: pointer; transition: background .15s;
          }
          .page-btn:hover:not(:disabled) { background: var(--surface); }
          .page-btn:disabled { opacity: .4; cursor: not-allowed; }

          .company-group-header td {
            background: var(--surface); padding: 7px 16px;
            font-family: 'Syne', sans-serif; font-size: .72rem; font-weight: 700;
            letter-spacing: .06em; text-transform: uppercase; color: var(--ink-soft);
            border-top: 2px solid var(--border); border-bottom: 1px solid var(--border);
          }
          .company-group-header:first-child td { border-top: none; }

          .empty-state {
            padding: 48px 24px; text-align: center;
            color: var(--ink-faint); font-size: .88rem;
          }
          .skel { background: linear-gradient(90deg,#f0ede9 25%,#faf9f7 50%,#f0ede9 75%); background-size:200% 100%; animation:shimmer 1.2s infinite; border-radius:4px; }
          @keyframes shimmer { to { background-position: -200% 0; } }
        `}</style>

        <DashboardLayout pageTitle="Users Management">
          <div className="page-header">
            <div className="page-title">Users (Global)</div>
            <div className="page-sub">All users across every company on the platform</div>
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
              value={roleFilter}
              onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Roles</option>
              <option value="company_admin">Company Admin</option>
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
              <option value="vendor_user">Vendor User</option>
            </select>
            <button type="submit" className="filter-btn">Search</button>
          </form>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Company</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 4 }).map((_, j) => (
                        <td key={j}><div className="skel" style={{ height: 14, width: '70%' }} /></td>
                      ))}
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr><td colSpan={4} className="empty-state">No users found.</td></tr>
                ) : (
                  users.flatMap((u, idx) => {
                    const isNewCompany = idx === 0 || !users[idx - 1] || users[idx - 1].company_id !== u.company_id;
                    const rows = [];
                    if (isNewCompany) {
                      rows.push(
                        <tr key={`ch-${u.company_id ?? idx}`} className="company-group-header">
                          <td colSpan={4}>{u.company_name || 'No Company'}</td>
                        </tr>
                      );
                    }
                    rows.push(
                      <tr key={u.id}>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar">
                              {u.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                            </div>
                            <div>
                              <div className="user-name">{u.name}</div>
                              <div className="user-email">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><Badge variant={u.role}>{ROLE_LABELS[u.role] ?? u.role}</Badge></td>
                        <td>
                          {u.company_name
                            ? <span className="company-chip">{u.company_name}</span>
                            : <span style={{ color: 'var(--ink-faint)' }}>—</span>}
                        </td>
                        <td style={{ whiteSpace: 'nowrap', color: 'var(--ink-faint)', fontSize: '.78rem' }}>
                          {u.created_at
                            ? new Date(u.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'}
                        </td>
                      </tr>
                    );
                    return rows;
                  })
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

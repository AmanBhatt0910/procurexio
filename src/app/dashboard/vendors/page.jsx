'use client';
// src/app/dashboard/vendors/page.jsx

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import VendorStatusBadge from '@/components/vendors/VendorStatusBadge';
import VendorCategoryTag from '@/components/vendors/VendorCategoryTag';
import { useAuth } from '@/hooks/useAuth';

const STATUSES = ['active', 'inactive', 'pending'];
const LIMIT = 10;

export default function VendorsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const canWrite =
    !authLoading &&
    !!user &&
    ['company_admin', 'manager', 'super_admin'].includes(user.role);

  const [vendors,    setVendors]    = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [toast,      setToast]      = useState(null);

  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [category, setCategory] = useState('');
  const [page,     setPage]     = useState(1);

  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivating,     setDeactivating]     = useState(false);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadVendors = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: LIMIT });
    if (search)   params.set('search', search);
    if (status)   params.set('status', status);
    if (category) params.set('category', category);

    const res = await fetch(`/api/vendors?${params}`);
    if (res.ok) {
      const json = await res.json();
      setVendors(json.data);
      setPagination(json.pagination);
    }
    setLoading(false);
  }, [page, search, status, category]);

  useEffect(() => { loadVendors(); }, [loadVendors]);

  useEffect(() => {
    fetch('/api/vendors/categories')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setCategories(d.data); });
  }, []);

  async function handleDeactivate() {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      const res = await fetch(`/api/vendors/${deactivateTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showToast(`${deactivateTarget.name} deactivated`);
        setDeactivateTarget(null);
        loadVendors();
      } else {
        showToast(data.error, 'error');
      }
    } finally {
      setDeactivating(false);
    }
  }

  const columns = useMemo(() => [
    {
      key: 'name',
      label: 'Vendor',
      // val = row['name'] (string|null), row = full vendor object
      // We need row.id and row.email too, so use (_val, row)
      render: (_val, row) => {
        const name = row.name || '';
        const initials = name.slice(0, 2).toUpperCase() || '??';
        return (
          <div
            onClick={() => router.push(`/dashboard/vendors/${row.id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--surface)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '.62rem',
              color: 'var(--ink-soft)', flexShrink: 0,
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontWeight: 500, fontSize: '.875rem', color: 'var(--ink)' }}>{name || '—'}</div>
              {row.email && (
                <div style={{ fontSize: '.75rem', color: 'var(--ink-faint)' }}>{row.email}</div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      width: 110,
      // val = row['status'] (string) — use it directly
      render: (val) => <VendorStatusBadge status={val} />,
    },
    {
      key: 'categories',
      label: 'Categories',
      // val = row['categories'] (array|null) — use it directly
      render: (val) => {
        const cats = val || [];
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {cats.map(cat => (
              <VendorCategoryTag key={cat.id} name={cat.name} color={cat.color} />
            ))}
            {cats.length === 0 && (
              <span style={{ fontSize: '.78rem', color: 'var(--ink-faint)' }}>—</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'primary_contact',
      label: 'Primary Contact',
      width: 160,
      // val = row['primary_contact'] (string|null) — use it directly, never read .primary_contact on it
      render: (val) => (
        <span style={{ fontSize: '.82rem', color: 'var(--ink-soft)' }}>
          {val || <span style={{ color: 'var(--ink-faint)' }}>—</span>}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 150,
      // Need row.id and row.status — use (_val, row)
      render: (_val, row) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/vendors/${row.id}`); }}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 6, padding: '5px 10px', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', fontSize: '.78rem',
              color: 'var(--ink-soft)', transition: 'background .12s, color .12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--ink)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--ink-soft)'; }}
          >
            View
          </button>
          {canWrite && row.status !== 'inactive' && (
            <button
              onClick={(e) => { e.stopPropagation(); setDeactivateTarget(row); }}
              style={{
                background: 'none', border: '1px solid var(--border)',
                borderRadius: 6, padding: '5px 10px', cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif', fontSize: '.78rem',
                color: 'var(--ink-soft)', transition: 'background .12s, color .12s, border-color .12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#fca5a5'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#fef2f2'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--ink-soft)'; e.currentTarget.style.background = 'none'; }}
            >
              Deactivate
            </button>
          )}
        </div>
      ),
    },
  ], [canWrite, router, setDeactivateTarget]);

  const addBtn = !authLoading ? (
    canWrite ? (
      <button
        onClick={() => router.push('/dashboard/vendors/new')}
        style={{
          background: 'var(--accent)', color: '#fff', border: 'none',
          padding: '10px 18px', borderRadius: 8,
          fontFamily: 'DM Sans, sans-serif', fontWeight: 500, fontSize: '.855rem',
          cursor: 'pointer', transition: 'background .15s',
          display: 'flex', alignItems: 'center', gap: 7,
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-h)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M6.5 2v9M2 6.5h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Add Vendor
      </button>
    ) : null
  ) : null;

  return (
    <DashboardLayout pageTitle="Vendors">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@400;500&display=swap');
        .filters { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
        .filter-input {
          height: 36px; padding: 0 12px; border: 1px solid var(--border);
          border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: .84rem;
          color: var(--ink); background: var(--white); outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .filter-input:focus { border-color: var(--ink); box-shadow: 0 0 0 3px rgba(15,14,13,.06); }
        .filter-input--search { width: 220px; }
        .pagination { display: flex; align-items: center; gap: 8px; margin-top: 20px; justify-content: flex-end; }
        .page-btn {
          height: 32px; min-width: 32px; padding: 0 10px; border: 1px solid var(--border);
          border-radius: 7px; background: var(--white); font-family: 'DM Sans', sans-serif;
          font-size: .82rem; color: var(--ink-soft); cursor: pointer; transition: background .12s, color .12s;
        }
        .page-btn:hover:not(:disabled) { background: var(--surface); color: var(--ink); }
        .page-btn:disabled { opacity: .4; cursor: not-allowed; }
        .page-btn--active { background: var(--ink); color: #fff; border-color: var(--ink); }
        .page-btn--active:hover { background: var(--ink); color: #fff; }
        .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
        .btn-secondary { background: none; border: 1px solid var(--border); padding: 9px 16px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: .855rem; color: var(--ink-soft); cursor: pointer; }
        .btn-secondary:hover { background: var(--surface); }
        .btn-danger { background: #dc2626; color: #fff; border: none; padding: 9px 18px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: .855rem; cursor: pointer; }
        .btn-danger:hover:not(:disabled) { background: #b91c1c; }
        .btn-danger:disabled { opacity: .6; cursor: not-allowed; }
        .toast { position: fixed; bottom: 24px; right: 24px; padding: 12px 18px; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: .855rem; font-weight: 500; z-index: 999; box-shadow: var(--shadow); animation: toastIn .2s ease; }
        .toast--success { background: #166534; color: #fff; }
        .toast--error   { background: #991b1b; color: #fff; }
        @keyframes toastIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <PageHeader
        title="Vendors"
        subtitle={`${pagination.total} vendor${pagination.total !== 1 ? 's' : ''} in your directory`}
        action={addBtn}
      />

      <div className="filters">
        <input
          className="filter-input filter-input--search"
          type="search"
          placeholder="Search vendors…"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
        />
        <select
          className="filter-input"
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          {STATUSES.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select
          className="filter-input"
          value={category}
          onChange={e => { setCategory(e.target.value); setPage(1); }}
        >
          <option value="">All categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={vendors}
        loading={loading}
        emptyMessage="No vendors found. Add your first vendor to get started."
      />

      {pagination.pages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            ← Prev
          </button>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              className={`page-btn${p === page ? ' page-btn--active' : ''}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button className="page-btn" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>
            Next →
          </button>
        </div>
      )}

      <Modal
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        title="Deactivate Vendor"
      >
        {deactivateTarget && (
          <div>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '.9rem', color: 'var(--ink-soft)', marginBottom: 6, lineHeight: 1.6 }}>
              Are you sure you want to deactivate{' '}
              <strong style={{ color: 'var(--ink)' }}>{deactivateTarget.name}</strong>?
              They will be hidden from active vendor lists but their data will be preserved.
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeactivateTarget(null)}>Cancel</button>
              <button className="btn-danger" onClick={handleDeactivate} disabled={deactivating}>
                {deactivating ? 'Deactivating…' : 'Deactivate'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {toast && <div className={`toast toast--${toast.type}`}>{toast.msg}</div>}
    </DashboardLayout>
  );
}
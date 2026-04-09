'use client';
// src/app/dashboard/rfqs/page.jsx

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import RFQStatusBadge from '@/components/rfq/RFQStatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { isDeadlinePassed } from '@/lib/deadline';

const STATUS_FILTERS = ['all', 'draft', 'published', 'closed', 'cancelled'];

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(value, currency = 'USD') {
  if (value == null || value === '') return '—';
  const num = parseFloat(value);
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0,
  }).format(num);
}

const pageBtn = {
  padding: '6px 14px',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  background: 'var(--white)',
  fontSize: '.82rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
  color: 'var(--ink)',
};

export default function RFQsPage() {
  const { user, loading: authLoading } = useAuth();
  const router   = useRouter();
  const canWrite = !authLoading && !!user && ['company_admin', 'manager', 'super_admin'].includes(user.role);

  const [rfqs,       setRfqs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [status,     setStatus]     = useState('all');
  const [page,       setPage]       = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const handleStatusChange = (s) => { setStatus(s); setPage(1); };
  const handleSearchChange = (e)  => { setSearch(e.target.value); setPage(1); };

  const fetchRfqs = useCallback(async (targetPage) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: targetPage, pageSize: 20 });
      if (status !== 'all') params.set('status', status);
      if (search)           params.set('search', search);
      const res  = await fetch(`/api/rfqs?${params}`);
      const json = await res.json();
      if (res.ok) {
        setRfqs(json.data.rfqs);
        setPagination(json.data.pagination);
      }
    } catch {}
    finally { setLoading(false); }
  }, [status, search]);

  useEffect(() => { fetchRfqs(page); }, [status, search, page, fetchRfqs]);

  const columns = useMemo(() => [
    {
      key: 'reference_number',
      label: 'Reference',
      // val = row['reference_number'] (string|null) — use directly
      render: (val) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '.82rem', color: 'var(--ink-soft)' }}>
          {val || '—'}
        </span>
      ),
    },
    {
      key: 'title',
      label: 'Title',
      // val = row['title'] (string|null) — use directly
      render: (val) => <span style={{ fontWeight: 500 }}>{val || '—'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      // val = row['status'] (string|null) — use directly
      render: (val) => val ? <RFQStatusBadge status={val} /> : null,
    },
    {
      key: 'deadline',
      label: 'Deadline',
      // val = row['deadline'] (string|null), need row.status too → use (val, row)
      render: (val, row) => {
        if (!val) return <span style={{ color: 'var(--ink-faint)' }}>—</span>;
        const safeStatus = row.status || '';
        const isOverdue = isDeadlinePassed(val) && !['closed', 'cancelled'].includes(safeStatus);
        return (
          <span style={{ color: isOverdue ? 'var(--accent)' : 'var(--ink)', fontWeight: isOverdue ? 600 : 400 }}>
            {formatDate(val)}{isOverdue && ' ⚠'}
          </span>
        );
      },
    },
    {
      key: 'budget',
      label: 'Budget',
      // val = row['budget'] (number|null), need row.currency too → use (val, row)
      render: (val, row) => formatCurrency(val, row.currency),
    },
    {
      key: 'item_count',
      label: 'Items',
      // val = row['item_count'] (number|null) — use directly
      render: (val) => (
        <span style={{ fontSize: '.82rem', color: 'var(--ink-soft)' }}>{val ?? '—'}</span>
      ),
    },
    {
      key: 'vendor_count',
      label: 'Vendors',
      // val = row['vendor_count'] (number|null) — use directly
      render: (val) => (
        <span style={{ fontSize: '.82rem', color: 'var(--ink-soft)' }}>{val ?? '—'}</span>
      ),
    },
    {
      key: 'created_by_name',
      label: 'Created By',
      // val = row['created_by_name'] (string|null) — use directly
      render: (val) => (
        <span style={{ fontSize: '.82rem', color: 'var(--ink-soft)' }}>{val || '—'}</span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      // val = row['created_at'] (string|null) — use directly
      render: (val) => (
        <span style={{ fontSize: '.82rem', color: 'var(--ink-faint)' }}>{formatDate(val)}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 80,
      // val = row['actions'] (undefined — no such field), need row.id → use (_val, row)
      render: (_val, row) => (
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/rfqs/${row.id}`); }}
          style={{
            background: 'none', border: '1px solid var(--border)',
            borderRadius: 6, padding: '5px 10px', cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif', fontSize: '.78rem', color: 'var(--ink-soft)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--ink)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--ink-soft)'; }}
        >
          View
        </button>
      ),
    },
  ], [router]);

  const addBtn = !authLoading && canWrite ? (
    <button
      onClick={() => router.push('/dashboard/rfqs/new')}
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
      New RFQ
    </button>
  ) : null;

  return (
    <DashboardLayout pageTitle="RFQs">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@300;400;500&display=swap');
        .rfq-page { animation: fadeUp .35s ease both; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }
        .filter-btn { padding: 5px 14px; border-radius: 20px; border: 1px solid var(--border);
          background: transparent; font-family: 'DM Sans', sans-serif; font-size: .78rem;
          font-weight: 500; cursor: pointer; color: var(--ink-soft); transition: all .15s; }
        .filter-btn.active { background: var(--ink); color: var(--white); border-color: var(--ink); }
        .filter-btn:hover:not(.active) { background: var(--surface); }
        .rfq-row:hover { background: var(--surface); cursor: pointer; }
      `}</style>

      <div className="rfq-page">
        <PageHeader
          title="Requests for Quotation"
          subtitle="Manage procurement requests and vendor invitations"
          action={addBtn}
        />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              className={`filter-btn ${status === s ? 'active' : ''}`}
              onClick={() => handleStatusChange(s)}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <div style={{ marginLeft: 'auto' }}>
            <input
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by title or ref…"
              style={{
                padding: '7px 12px', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', fontSize: '.83rem', fontFamily: 'inherit',
                color: 'var(--ink)', background: 'var(--white)', outline: 'none', width: 220,
              }}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={rfqs}
          loading={loading}
          emptyMessage="No RFQs found. Create your first one."
          onRowClick={(row) => router.push(`/dashboard/rfqs/${row.id}`)}
          rowClassName="rfq-row"
        />

        {pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24, alignItems: 'center' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={pageBtn}>
              ← Prev
            </button>
            <span style={{ fontSize: '.84rem', color: 'var(--ink-soft)' }}>
              Page {page} of {pagination.pages} ({pagination.total} total)
            </span>
            <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages} style={pageBtn}>
              Next →
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

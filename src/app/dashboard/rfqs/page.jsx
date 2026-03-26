// src/app/dashboard/rfqs/page.jsx
'use client';
import '@fontsource/syne/700.css';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import RFQStatusBadge from '@/components/rfq/RFQStatusBadge';
import { useAuth } from '@/hooks/useAuth';

const STATUS_FILTERS = ['all', 'draft', 'published', 'closed', 'cancelled'];

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(value, currency = 'USD') {
  if (!value && value !== 0) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

export default function RFQsPage() {
  const { user }  = useAuth();
  const router    = useRouter();
  const canWrite  = user && ['company_admin', 'manager'].includes(user.role);

  const [rfqs, setRfqs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [status, setStatus]       = useState('all');
  const [page, setPage]           = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // Track previous filter values to detect changes inside one unified effect,
  // avoiding the setState-in-effect anti-pattern.
    const handleStatusChange = (s) => {
    setStatus(s);
    setPage(1); // reset here instead
    };

    const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // reset here instead
    };

  const fetchRfqs = useCallback(async (targetPage) => {
    try {
        const params = new URLSearchParams({ page: targetPage, pageSize: 20 });
        if (status !== 'all') params.set('status', status);
        if (search) params.set('search', search);

        const res  = await fetch(`/api/rfqs?${params}`);
        const json = await res.json();

        if (res.ok) {
        setRfqs(json.data.rfqs);
        setPagination(json.data.pagination);
        }
    } catch {} 
    finally {
        setLoading(false);
    }
    }, [status, search]);

    useEffect(() => {
        let isMounted = true;

        setLoading(true);

        fetchRfqs(page).finally(() => {
            if (isMounted) setLoading(false);
        });

        return () => {
            isMounted = false;
        };
        }, [status, search, page, fetchRfqs]);

  const columns = [
    {
      key: 'reference_number',
      label: 'Reference',
      render: (v) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '.82rem', color: 'var(--ink-soft)' }}>
          {v}
        </span>
      ),
    },
    { key: 'title', label: 'Title', render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (v) => <RFQStatusBadge status={v} />,
    },
    {
      key: 'deadline',
      label: 'Deadline',
      render: (v, row) => {
        if (!v) return <span style={{ color: 'var(--ink-faint)' }}>—</span>;
        const isOverdue = new Date(v) < new Date() && !['closed', 'cancelled'].includes(row.status);
        return (
          <span style={{ color: isOverdue ? 'var(--accent)' : 'var(--ink)', fontWeight: isOverdue ? 600 : 400 }}>
            {formatDate(v)}
            {isOverdue && ' ⚠'}
          </span>
        );
      },
    },
    {
      key: 'budget',
      label: 'Budget',
      render: (v, row) => formatCurrency(v, row.currency),
    },
    {
      key: 'item_count',
      label: 'Items',
      render: (v) => (
        <span style={{ fontSize: '.82rem', color: 'var(--ink-soft)' }}>{v}</span>
      ),
    },
    {
      key: 'vendor_count',
      label: 'Vendors',
      render: (v) => (
        <span style={{ fontSize: '.82rem', color: 'var(--ink-soft)' }}>{v}</span>
      ),
    },
    {
      key: 'created_by_name',
      label: 'Created By',
      render: (v) => (
        <span style={{ fontSize: '.82rem', color: 'var(--ink-soft)' }}>{v}</span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (v) => (
        <span style={{ fontSize: '.82rem', color: 'var(--ink-faint)' }}>{formatDate(v)}</span>
      ),
    },
  ];

  return (
    <DashboardLayout>
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
          action={canWrite ? {
            label: '+ New RFQ',
            onClick: () => router.push('/dashboard/rfqs/new'),
          } : undefined}
        />

        {/* Filters */}
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
                padding: '7px 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontSize: '.83rem',
                fontFamily: 'inherit',
                color: 'var(--ink)',
                background: 'var(--white)',
                outline: 'none',
                width: 220,
              }}
            />
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          rows={rfqs}
          loading={loading}
          emptyMessage="No RFQs found. Create your first one."
          onRowClick={(row) => router.push(`/dashboard/rfqs/${row.id}`)}
          rowClassName="rfq-row"
        />

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24, alignItems: 'center' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={pageBtn}
            >
              ← Prev
            </button>
            <span style={{ fontSize: '.84rem', color: 'var(--ink-soft)' }}>
              Page {page} of {pagination.pages} ({pagination.total} total)
            </span>
            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={page >= pagination.pages}
              style={pageBtn}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
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
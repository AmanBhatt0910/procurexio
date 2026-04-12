'use client';
// src/app/dashboard/rfqs/page.jsx

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import RFQStatusBadge from '@/components/rfq/RFQStatusBadge';
import RFQGridCard from '@/components/rfq/RFQGridCard';
import ViewToggle from '@/components/ui/ViewToggle';
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

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true" style={{ color: 'var(--ink-faint)', flexShrink: 0 }}>
      <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

export default function RFQsPage() {
  const { user, loading: authLoading } = useAuth();
  const router   = useRouter();
  const canWrite = !authLoading && !!user && ['company_admin', 'manager', 'super_admin'].includes(user.role);

  const [rfqs,       setRfqs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [status,     setStatus]     = useState('all');
  const [page,       setPage]       = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, totalPages: 1 });
  const [view,       setView]       = useState('list');

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
      render: (val) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '.78rem', color: 'var(--ink-soft)', letterSpacing: '.02em' }}>
          {val || '—'}
        </span>
      ),
    },
    {
      key: 'title',
      label: 'Title',
      render: (val) => <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{val || '—'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => val ? <RFQStatusBadge status={val} /> : null,
    },
    {
      key: 'deadline',
      label: 'Deadline',
      render: (val, row) => {
        if (!val) return <span style={{ color: 'var(--ink-faint)' }}>—</span>;
        const safeStatus = row.status || '';
        const isOverdue = isDeadlinePassed(val) && !['closed', 'cancelled'].includes(safeStatus);
        return (
          <span style={{
            color: isOverdue ? 'var(--accent)' : 'var(--ink-soft)',
            fontWeight: isOverdue ? 600 : 400,
            fontSize: '.845rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}>
            {formatDate(val)}
            {isOverdue && (
              <span style={{ fontSize: '.72rem', background: '#fdecea', color: 'var(--accent)',
                borderRadius: 4, padding: '1px 5px', fontWeight: 600 }}>
                Overdue
              </span>
            )}
          </span>
        );
      },
    },
    {
      key: 'budget',
      label: 'Budget',
      render: (val, row) => (
        <span style={{ fontWeight: 500, fontSize: '.845rem' }}>
          {formatCurrency(val, row.currency)}
        </span>
      ),
    },
    {
      key: 'item_count',
      label: 'Items',
      render: (val) => (
        <span style={{ fontSize: '.82rem', color: 'var(--ink-soft)', fontWeight: 500 }}>{val ?? '—'}</span>
      ),
    },
    {
      key: 'vendor_count',
      label: 'Vendors',
      render: (val) => (
        <span style={{ fontSize: '.82rem', color: 'var(--ink-soft)', fontWeight: 500 }}>{val ?? '—'}</span>
      ),
    },
    {
      key: 'created_by_name',
      label: 'Created By',
      render: (val) => (
        <span style={{ fontSize: '.82rem', color: 'var(--ink-soft)' }}>{val || '—'}</span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (val) => (
        <span style={{ fontSize: '.82rem', color: 'var(--ink-faint)' }}>{formatDate(val)}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 72,
      render: (_val, row) => (
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/rfqs/${row.id}`); }}
          style={{
            background: 'none', border: '1px solid var(--border)',
            borderRadius: 7, padding: '5px 11px', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif", fontSize: '.775rem',
            color: 'var(--ink-soft)', transition: 'all .12s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--ink)';
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.borderColor = 'var(--ink)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = 'var(--ink-soft)';
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          View
        </button>
      ),
    },
  ], [canWrite, router]);

  const totalPages = pagination.totalPages || pagination.pages || 1;

  const addBtn = !authLoading && canWrite ? (
    <button
      onClick={() => router.push('/dashboard/rfqs/new')}
      style={{
        background: 'var(--accent)', color: '#fff', border: 'none',
        padding: '10px 18px', borderRadius: 9,
        fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '.845rem',
        cursor: 'pointer', transition: 'background .15s, transform .12s',
        display: 'inline-flex', alignItems: 'center', gap: 7,
        letterSpacing: '-.01em',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--accent-h)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'var(--accent)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <PlusIcon />
      New RFQ
    </button>
  ) : null;

  return (
    <DashboardLayout pageTitle="RFQs">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');

        .rfq-page { animation: rfqFadeUp .3s ease both; }
        @keyframes rfqFadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }

        .rfq-filter-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .rfq-filter-pills {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
          align-items: center;
          padding: 4px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
        }
        .rfq-filter-pill {
          padding: 5px 13px;
          border-radius: 7px;
          border: none;
          background: transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: .785rem;
          font-weight: 500;
          cursor: pointer;
          color: var(--ink-soft);
          transition: all .14s;
          line-height: 1.4;
        }
        .rfq-filter-pill.active {
          background: var(--white);
          color: var(--ink);
          box-shadow: 0 1px 3px rgba(15,14,13,.1), 0 0 0 1px var(--border);
        }
        .rfq-filter-pill:hover:not(.active) {
          color: var(--ink);
          background: rgba(15,14,13,.04);
        }
        .rfq-search-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .rfq-search-icon {
          position: absolute;
          left: 10px;
          pointer-events: none;
        }
        .rfq-search-input {
          padding: 8px 12px 8px 32px;
          border: 1px solid var(--border);
          border-radius: 9px;
          font-size: .835rem;
          font-family: 'DM Sans', sans-serif;
          color: var(--ink);
          background: var(--white);
          outline: none;
          width: 220px;
          transition: border-color .15s, box-shadow .15s;
        }
        .rfq-search-input::placeholder { color: var(--ink-faint); }
        .rfq-search-input:focus {
          border-color: var(--ink-soft);
          box-shadow: 0 0 0 3px rgba(15,14,13,.06);
        }
        .rfq-pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 6px;
          margin-top: 24px;
        }
        .rfq-page-btn {
          padding: 6px 14px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--white);
          font-size: .82rem;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          color: var(--ink);
          transition: all .12s;
        }
        .rfq-page-btn:hover:not(:disabled) {
          background: var(--ink);
          color: #fff;
          border-color: var(--ink);
        }
        .rfq-page-btn:disabled { opacity: .35; cursor: not-allowed; }
        .rfq-empty-state {
          text-align: center;
          padding: 64px 24px;
          color: var(--ink-faint);
          font-family: 'DM Sans', sans-serif;
        }
        .rfq-empty-title {
          font-family: 'Syne', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: var(--ink-soft);
          margin-bottom: 6px;
          letter-spacing: -.02em;
        }
        .rfq-grid-skeleton {
          height: 190px;
          border-radius: 12px;
          background: var(--surface);
          border: 1px solid var(--border);
          animation: rfqPulse 1.4s ease-in-out infinite;
        }
        @keyframes rfqPulse { 0%,100%{opacity:1} 50%{opacity:.5} }

        @media (max-width: 640px) {
          .rfq-filter-pills { gap: 3px; }
          .rfq-filter-pill { padding: 4px 10px; font-size: .76rem; }
          .rfq-search-input { width: 180px; }
        }
      `}</style>

      <div className="rfq-page">
        <PageHeader
          title="Requests for Quotation"
          subtitle="Manage procurement requests and vendor invitations"
          action={addBtn}
        />

        {/* Filter + search bar */}
        <div className="rfq-filter-bar">
          <div className="rfq-filter-pills">
            {STATUS_FILTERS.map(s => (
              <button
                key={s}
                className={`rfq-filter-pill${status === s ? ' active' : ''}`}
                onClick={() => handleStatusChange(s)}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="rfq-search-wrap">
              <span className="rfq-search-icon"><SearchIcon /></span>
              <input
                className="rfq-search-input"
                value={search}
                onChange={handleSearchChange}
                placeholder="Search RFQs…"
              />
            </div>
            {!authLoading && user && (
              <ViewToggle view={view} onViewChange={setView} userRole={user.role} />
            )}
          </div>
        </div>

        {/* Content */}
        {view === 'grid' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(288px, 1fr))',
            gap: 14,
          }}>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rfq-grid-skeleton" style={{ animationDelay: `${i * 80}ms` }} />
                ))
              : rfqs.length === 0
                ? (
                  <div style={{ gridColumn: '1/-1' }} className="rfq-empty-state">
                    <div style={{ fontSize: '2rem', marginBottom: 12, opacity: .3 }}>
                      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ display: 'block', margin: '0 auto' }}>
                        <rect x="6" y="8" width="28" height="26" rx="4" stroke="currentColor" strokeWidth="1.8"/>
                        <path d="M14 16h12M14 20h8M14 24h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                        <path d="M26 4v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                        <path d="M14 4v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="rfq-empty-title">No RFQs found</div>
                    <div style={{ fontSize: '.845rem' }}>
                      {search ? 'Try a different search term' : 'Create your first request for quotation'}
                    </div>
                  </div>
                )
                : rfqs.map(rfq => (
                    <RFQGridCard
                      key={rfq.id}
                      rfq={rfq}
                      onClick={() => router.push(`/dashboard/rfqs/${rfq.id}`)}
                    />
                  ))
            }
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={rfqs}
            loading={loading}
            emptyMessage={search ? 'No RFQs matched your search.' : 'No RFQs found. Create your first one.'}
            onRowClick={(row) => router.push(`/dashboard/rfqs/${row.id}`)}
            rowClassName="rfq-row"
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="rfq-pagination">
            <button
              className="rfq-page-btn"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ← Prev
            </button>
            <span style={{ fontSize: '.83rem', color: 'var(--ink-soft)', padding: '0 4px', minWidth: 160, textAlign: 'center' }}>
              Page {page} of {totalPages}
              <span style={{ color: 'var(--ink-faint)', marginLeft: 6 }}>({pagination.total} total)</span>
            </span>
            <button
              className="rfq-page-btn"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
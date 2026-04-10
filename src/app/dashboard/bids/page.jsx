'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import BidStatusBadge from '@/components/bids/BidStatusBadge';
import BidGridCard from '@/components/bids/BidGridCard';
import RFQStatusBadge from '@/components/rfq/RFQStatusBadge';
import ViewToggle from '@/components/ui/ViewToggle';
import RoleGuard from '@/components/auth/RoleGuard';
import { useAuth } from '@/hooks/useAuth';
import { getDeadlineTimeLeftMs, isDeadlinePassed } from '@/lib/deadline';

function RedirectToDashboard() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard'); }, [router]);
  return null;
}

// ── Countdown Timer Component ──────────────────────────────────────────────
const MS_PER_DAY    = 86400000;
const MS_PER_HOUR   = 3600000;
const MS_PER_MINUTE = 60000;
const MS_PER_SECOND = 1000;
const padTimeValue = n => String(n).padStart(2, '0');

function CountdownTimer({ deadline }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!deadline) return;
    const calc = () => {
      const diff = getDeadlineTimeLeftMs(deadline);
      if (diff == null) { setTimeLeft({ expired: true }); return; }
      if (diff <= 0) { setTimeLeft({ expired: true }); return; }
      setTimeLeft({
        expired: false,
        diff,
        days:    Math.floor(diff / MS_PER_DAY),
        hours:   Math.floor((diff % MS_PER_DAY)    / MS_PER_HOUR),
        minutes: Math.floor((diff % MS_PER_HOUR)   / MS_PER_MINUTE),
        seconds: Math.floor((diff % MS_PER_MINUTE) / MS_PER_SECOND),
      });
    };
    calc();
    const id = setInterval(calc, MS_PER_SECOND);
    return () => clearInterval(id);
  }, [deadline]);

  if (!timeLeft) return <span style={{ color: 'var(--ink-faint)', fontSize: '.82rem' }}>—</span>;

  if (timeLeft.expired) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: '#fdf0eb', border: '1px solid #f5c9b6',
        borderRadius: 6, padding: '3px 8px',
        color: '#c8501a', fontWeight: 600, fontSize: '.78rem',
      }}>
        🔒 Closed
      </span>
    );
  }

  const isUrgent  = timeLeft.diff < MS_PER_DAY;
  const isWarning = timeLeft.diff < 3 * MS_PER_DAY;
  const bg  = isUrgent  ? '#fdf0eb' : isWarning ? '#fff8e8' : '#e8f5ee';
  const brd = isUrgent  ? '#f5c9b6' : isWarning ? '#f5dfa0' : '#6ee7b7';
  const clr = isUrgent  ? '#c8501a' : isWarning ? '#8a6500' : '#1a7a4a';
  const icon = isUrgent ? '⚡' : isWarning ? '⏰' : '🟢';

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: bg, border: `1px solid ${brd}`,
      borderRadius: 6, padding: '3px 8px', color: clr,
      fontSize: '.78rem', fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      {icon}{' '}
      {timeLeft.days > 0 && `${timeLeft.days}d `}
      {padTimeValue(timeLeft.hours)}h {padTimeValue(timeLeft.minutes)}m {padTimeValue(timeLeft.seconds)}s
    </span>
  );
}

const PAGE_LIMIT = 20;
const getValidTimestamp = (v) => {
  if (!v) return 0;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? 0 : t;
};

export default function VendorBidsPage() {
  const { user, loading: authLoading } = useAuth();
  const [rfqs, setRfqs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [companyCurrency, setCompanyCurrency] = useState('USD');
  const [page, setPage]           = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [view, setView]           = useState('list');
  const router = useRouter();

  const fetchRfqs = useCallback(async (p = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/bids/rfqs?page=${p}&limit=${PAGE_LIMIT}`);
      const rfqJson = await res.json();
      if (rfqJson.data?.rfqs) {
        setRfqs(rfqJson.data.rfqs);
        setPagination(rfqJson.data.pagination || { total: 0, pages: 1 });
      } else {
        setError(rfqJson.error || 'Failed to load');
      }
      if (rfqJson.data?.companyCurrency) setCompanyCurrency(rfqJson.data.companyCurrency);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRfqs(page); }, [fetchRfqs, page]);

  const sortedRfqs = useMemo(() => {
    const list = [...rfqs];
    list.sort((a, b) => {
      const aStatus = a?.rfq_status === 'published' ? 0 : a?.rfq_status === 'closed' ? 1 : 2;
      const bStatus = b?.rfq_status === 'published' ? 0 : b?.rfq_status === 'closed' ? 1 : 2;
      if (aStatus !== bStatus) return aStatus - bStatus;

      if (a?.rfq_status === 'published' && b?.rfq_status === 'published') {
        return getValidTimestamp(a.deadline) - getValidTimestamp(b.deadline);
      }

      if (a?.rfq_status === 'closed' && b?.rfq_status === 'closed') {
        return getValidTimestamp(b.updated_at || b.created_at) - getValidTimestamp(a.updated_at || a.created_at);
      }

      return getValidTimestamp(b.created_at) - getValidTimestamp(a.created_at);
    });
    return list;
  }, [rfqs]);

  const publishedRfqs = useMemo(
    () => sortedRfqs.filter((r) => r?.rfq_status === 'published'),
    [sortedRfqs]
  );
  const closedRfqs = useMemo(
    () => sortedRfqs.filter((r) => r?.rfq_status === 'closed'),
    [sortedRfqs]
  );

  const isPastDeadline = (deadline) => isDeadlinePassed(deadline);

  // ✅ All render functions use (val, row) signature — row is always the full
  //    object. Never access properties on val when you need the full row.
  const columns = [
    {
      key: 'reference_number',
      label: 'Reference',
      render: (val) => (
        <span style={{ fontFamily: 'monospace', fontSize: '.82rem', color: 'var(--ink-soft)', fontWeight: 600 }}>
          {val ?? '—'}
        </span>
      ),
    },
    {
      key: 'title',
      label: 'RFQ Title',
      // ✅ null-safe: show em-dash if title is missing
      render: (val) => <span style={{ fontWeight: 500 }}>{val ?? '—'}</span>,
    },
    {
      key: 'rfq_status',
      label: 'RFQ Status',
      render: (val) => val ? <RFQStatusBadge status={val} /> : <span style={{ color: 'var(--ink-faint)' }}>—</span>,
    },
    {
      key: 'deadline',
      label: 'Deadline',
      render: (val) => {
        if (!val) return <span style={{ color: 'var(--ink-faint)' }}>—</span>;
        const past = isPastDeadline(val);
        return (
          <span style={{ color: past ? 'var(--accent)' : 'var(--ink)', fontSize: '.86rem' }}>
            {past && '⚠ '}
            {new Date(val).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        );
      },
    },
    {
      key: 'time_remaining',
      label: 'Time Remaining',
      render: (val, row) => {
        const isClosedStatus = row?.rfq_status === 'closed' || row?.rfq_status === 'cancelled';
        if (isClosedStatus) return <span style={{ color: 'var(--ink-faint)', fontSize: '.82rem' }}>—</span>;
        return <CountdownTimer deadline={val} />;
      },
    },
    {
      key: 'bid_status',
      label: 'My Bid',
      render: (val) => val
        ? <BidStatusBadge status={val} />
        : <span style={{ color: 'var(--ink-faint)', fontSize: '.82rem' }}>Not started</span>,
    },
    {
      key: 'total_amount',
      label: 'Bid Total',
      // ✅ use (val, row) so we can read row.currency safely
      render: (val, row) => {
        if (val == null) return <span style={{ color: 'var(--ink-faint)' }}>—</span>;
        const currency = row?.currency || companyCurrency || 'USD';
        return (
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
            {currency} {parseFloat(val).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        );
      },
    },
    {
      key: 'id',
      label: '',
      // ✅ use (val, row) to read bid_status from the full row, not from `val`
      //    (val here would be row.id — a number, not an object)
      render: (val, row) => (
        <button
          onClick={() => router.push(`/dashboard/bids/${val}`)}
          style={{
            padding: '6px 16px', background: 'var(--ink)', color: '#fff',
            border: 'none', borderRadius: 6, fontSize: '.8rem',
            fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {row?.bid_status === 'submitted' ? 'View'
            : row?.bid_status === 'draft'     ? 'Continue'
            : 'Open'}
        </button>
      ),
    },
  ];

  return (
    <RoleGuard roles={['vendor_user']} fallback={<RedirectToDashboard />}>
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
          .error-box {
            background: #fdf0eb; border: 1px solid #f5c9b6; border-radius: var(--radius);
            padding: 14px 18px; color: var(--accent); font-size: .88rem; margin-bottom: 20px;
          }
          .info-banner {
            background: #f0f5ff; border: 1px solid #c3d5f8; border-radius: var(--radius);
            padding: 12px 18px; color: #2d5bb8; font-size: .85rem; margin-bottom: 20px;
          }
          .pagination {
            display: flex; align-items: center; gap: 8px;
            margin-top: 20px; justify-content: center;
          }
          @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.5 } }
          .section-wrap { margin-bottom: 20px; }
          .section-title {
            display: flex; align-items: center; gap: 8px;
            margin-bottom: 10px; color: var(--ink-soft);
            font-size: .78rem; letter-spacing: .07em;
            text-transform: uppercase; font-weight: 600;
          }
          .section-count {
            background: var(--surface); border: 1px solid var(--border);
            border-radius: 999px; padding: 1px 8px;
            font-size: .72rem; color: var(--ink-faint);
          }
          .page-btn {
            height: 32px; min-width: 32px; padding: 0 10px;
            border: 1px solid var(--border); border-radius: 7px;
            background: var(--white); font-family: 'DM Sans', sans-serif;
            font-size: .82rem; color: var(--ink-soft); cursor: pointer;
            transition: background .12s, color .12s;
          }
          .page-btn:hover:not(:disabled) { background: var(--surface); color: var(--ink); }
          .page-btn:disabled { opacity: .4; cursor: not-allowed; }
        `}</style>
        <DashboardLayout>
          <PageHeader
            title="My Bid Invitations"
            subtitle={`${pagination.total} RFQ${pagination.total !== 1 ? 's' : ''} you have been invited to respond to`}
            action={
              !authLoading && user && (
                <ViewToggle view={view} onViewChange={setView} userRole={user.role} />
              )
            }
          />
          {error && <div className="error-box">{error}</div>}
          {!loading && rfqs.length === 0 && !error && (
            <div className="info-banner">
              You haven&apos;t been invited to any open RFQs yet. Check back later.
            </div>
          )}

          {view === 'grid' ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} style={{
                      height: 180, borderRadius: 'var(--radius)',
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      animation: 'pulse 1.5s infinite',
                    }} />
                  ))
                : sortedRfqs.map(rfq => (
                    <BidGridCard
                      key={rfq.id}
                      rfq={rfq}
                      companyCurrency={companyCurrency}
                      onClick={() => router.push(`/dashboard/bids/${rfq.id}`)}
                    />
                  ))
              }
            </div>
          ) : (
            <>
              <div className="section-wrap">
                <div className="section-title">
                  Published RFQs
                  <span className="section-count">{publishedRfqs.length}</span>
                </div>
                <DataTable
                  columns={columns}
                  rows={publishedRfqs}
                  loading={loading}
                  emptyMessage="No published RFQ invitations found"
                />
              </div>

              <div className="section-wrap">
                <div className="section-title">
                  Closed RFQs
                  <span className="section-count">{closedRfqs.length}</span>
                </div>
                <DataTable
                  columns={columns}
                  rows={closedRfqs}
                  loading={loading}
                  emptyMessage="No closed RFQs yet"
                />
              </div>
            </>
          )}

          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                ← Prev
              </button>
              <span style={{ fontSize: '.84rem', color: 'var(--ink-soft)' }}>
                Page {page} of {pagination.pages}
              </span>
              <button
                className="page-btn"
                disabled={page >= pagination.pages}
                onClick={() => setPage(p => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </DashboardLayout>
      </>
    </RoleGuard>
  );
}

// src/app/dashboard/bids/page.jsx:

'use client';

// /dashboard/bids — Vendor's invited RFQ list

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import RFQStatusBadge from '@/components/rfq/RFQStatusBadge';
import BidStatusBadge from '@/components/bids/BidStatusBadge';

function DeadlinePill({ deadline }) {
  if (!deadline) return <span style={{ color: 'var(--ink-faint)' }}>—</span>;
  const d = new Date(deadline);
  const now = new Date();
  const diffMs = d - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const past = diffMs < 0;
  const urgent = !past && diffDays <= 3;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: '.8rem', fontWeight: 500,
      color: past ? '#c62828' : urgent ? '#e65100' : 'var(--ink-soft)',
    }}>
      {past && '⚠ '}
      {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      {!past && urgent && <span style={{ fontSize: '.72rem', color: '#e65100' }}>({diffDays}d left)</span>}
      {past && <span style={{ fontSize: '.72rem' }}>Expired</span>}
    </span>
  );
}

const COLUMNS = [
  { key: 'reference_number', label: 'Reference' },
  { key: 'title',            label: 'RFQ Title' },
  { key: 'rfq_status',       label: 'RFQ Status' },
  { key: 'deadline',         label: 'Deadline' },
  { key: 'bid_status',       label: 'Your Bid' },
  { key: 'total_amount',     label: 'Bid Amount' },
  { key: 'action',           label: '' },
];

export default function VendorBidsPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const LIMIT = 20;

  useEffect(() => {
    const abortController = new AbortController();

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    fetch(`/api/bids/rfqs?page=${page}&limit=${LIMIT}`, {
      signal: abortController.signal,
    })
      .then(r => r.json())
      .then(d => {
        if (abortController.signal.aborted) return;
        if (d.error) throw new Error(d.error);
        setRows(d.data.rows);
        setTotal(d.data.total);
      })
      .catch(e => {
        if (abortController.signal.aborted) return;
        setError(e.message);
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      });

    return () => abortController.abort();
  }, [page]);

  const tableRows = rows.map(row => ({
    ...row,
    reference_number: (
      <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: '.85rem' }}>
        {row.reference_number}
      </span>
    ),
    rfq_status: <RFQStatusBadge status={row.rfq_status} />,
    deadline:   <DeadlinePill deadline={row.deadline} />,
    bid_status: row.bid_status
      ? <BidStatusBadge status={row.bid_status} />
      : <span style={{ color: 'var(--ink-faint)', fontSize: '.8rem', fontStyle: 'italic' }}>Not started</span>,
    total_amount: row.total_amount
      ? <span style={{ fontWeight: 600 }}>{parseFloat(row.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {row.currency}</span>
      : '—',
    action: (
      <button
        onClick={() => router.push(`/dashboard/bids/${row.id}`)}
        style={{
          padding: '5px 14px', borderRadius: 'var(--radius)',
          border: '1px solid var(--border)', background: 'var(--white)',
          color: 'var(--ink)', fontFamily: "'DM Sans', sans-serif",
          fontSize: '.8rem', fontWeight: 500, cursor: 'pointer',
          transition: 'all .15s',
        }}
        onMouseEnter={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent)'; }}
        onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--ink)'; }}
      >
        {row.bid_status === 'submitted' ? 'View / Edit' : row.bid_status === 'withdrawn' ? 'Resubmit' : 'Start Bid'}
      </button>
    ),
  }));

  return (
    <DashboardLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Syne:wght@600;700&display=swap');
        .bids-page { padding: 32px; max-width: 1200px; }
        .bids-meta { font-family: 'DM Sans', sans-serif; font-size: .85rem; color: var(--ink-soft); margin-bottom: 24px; }
        .pagination { display: flex; align-items: center; gap: 12px; margin-top: 24px; justify-content: flex-end; }
        .page-btn {
          padding: 6px 14px; border-radius: var(--radius); border: 1px solid var(--border);
          background: var(--white); color: var(--ink); font-family: 'DM Sans', sans-serif;
          font-size: .82rem; cursor: pointer; transition: all .15s;
        }
        .page-btn:disabled { opacity: .4; cursor: not-allowed; }
        .page-btn:not(:disabled):hover { border-color: var(--accent); color: var(--accent); }
        .error-msg { color: #c62828; font-family: 'DM Sans', sans-serif; padding: 20px; }
      `}</style>

      <div className="bids-page">
        <PageHeader
          title="My Bids"
          subtitle="RFQs you have been invited to respond to"
        />

        {error && <div className="error-msg">{error}</div>}

        <div className="bids-meta">
          {!loading && `Showing ${rows.length} of ${total} RFQ invitation${total !== 1 ? 's' : ''}`}
        </div>

        <DataTable
          columns={COLUMNS}
          rows={tableRows}
          loading={loading}
          emptyMessage="No RFQ invitations found."
        />

        {total > LIMIT && (
          <div className="pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '.82rem', color: 'var(--ink-soft)' }}>
              Page {page} of {Math.ceil(total / LIMIT)}
            </span>
            <button className="page-btn" disabled={page >= Math.ceil(total / LIMIT)} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
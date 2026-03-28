// src/app/dashboard/rfqs/[id]/bids/page.jsx

'use client';

// /dashboard/rfqs/[id]/bids — Internal bid comparison view
// Accessible by company_admin, manager, employee (read-only for employee)

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import RFQStatusBadge from '@/components/rfq/RFQStatusBadge';
import BidStatusBadge from '@/components/bids/BidStatusBadge';
import BidComparisonTable from '@/components/bids/BidComparisonTable';
import useAuth from '@/hooks/useAuth';

function StatCard({ label, value, accent }) {
  return (
    <div style={{
      background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
      padding: '18px 22px', flex: '1 1 160px',
    }}>
      <div style={{ fontSize: '.72rem', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.4rem', fontWeight: 700, color: accent ? 'var(--accent)' : 'var(--ink)' }}>
        {value}
      </div>
    </div>
  );
}

export default function RFQBidsPage() {
  const { id: rfqId } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const LIMIT = 50;

   useEffect(() => {
    const abortController = new AbortController();

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    fetch(`/api/rfqs/${rfqId}/bids?page=${page}&limit=${LIMIT}`, {
      signal: abortController.signal,
    })
      .then(r => r.json())
      .then(d => {
        if (abortController.signal.aborted) return;
        if (d.error) throw new Error(d.error);
        setData(d.data);
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
  }, [rfqId, page]);

  const rfq  = data?.rfq;
  const bids = data?.bids || [];
  const items = data?.items || [];

  const submittedBids = bids.filter(b => b.status === 'submitted');
  const lowestTotal = submittedBids.length
    ? Math.min(...submittedBids.map(b => parseFloat(b.totalAmount) || 0))
    : null;

  return (
    <DashboardLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Syne:wght@600;700;800&display=swap');
        :root {
          --ink: #0f0e0d; --ink-soft: #6b6660; --ink-faint: #b8b3ae;
          --surface: #faf9f7; --white: #ffffff; --accent: #c8501a; --accent-h: #a83e12;
          --border: #e4e0db; --radius: 10px; --shadow: 0 1px 3px rgba(15,14,13,.06), 0 8px 32px rgba(15,14,13,.08);
        }
        .rbp-page { padding: 32px; max-width: 1400px; }
        .rbp-stats { display: flex; gap: 16px; flex-wrap: wrap; margin: 24px 0; }
        .rbp-card {
          background: var(--white); border: 1px solid var(--border);
          border-radius: var(--radius); box-shadow: var(--shadow);
          padding: 24px; margin-bottom: 24px;
        }
        .rbp-card-title {
          font-family: 'Syne', sans-serif; font-size: .9rem; font-weight: 700;
          color: var(--ink); margin: 0 0 16px 0; padding-bottom: 12px;
          border-bottom: 1px solid var(--border);
        }
        .rbp-all-bids { margin-top: 24px; }
        .rbp-bid-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px; border: 1px solid var(--border); border-radius: 8px;
          margin-bottom: 10px; background: var(--white); transition: box-shadow .15s;
          cursor: pointer;
        }
        .rbp-bid-row:hover { box-shadow: var(--shadow); }
        .rbp-vendor-name {
          font-family: 'Syne', sans-serif; font-weight: 600; font-size: .92rem; color: var(--ink);
        }
        .rbp-bid-meta { font-size: .8rem; color: var(--ink-soft); margin-top: 2px; }
        .rbp-bid-right { display: flex; align-items: center; gap: 16px; }
        .rbp-bid-amount { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1rem; color: var(--ink); }
        .rbp-bid-amount.lowest { color: var(--accent); }
        .btn-ghost {
          padding: 6px 14px; border-radius: var(--radius); border: 1px solid var(--border);
          background: transparent; color: var(--ink); font-family: 'DM Sans', sans-serif;
          font-size: .8rem; cursor: pointer; transition: all .15s;
        }
        .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
        .rbp-spinner { text-align: center; padding: 80px; color: var(--ink-faint); font-family: 'DM Sans', sans-serif; }
        .rbp-error { color: #c62828; font-family: 'DM Sans', sans-serif; }
        .pagination { display: flex; align-items: center; gap: 12px; margin-top: 16px; justify-content: flex-end; }
        .page-btn {
          padding: 6px 14px; border-radius: var(--radius); border: 1px solid var(--border);
          background: var(--white); color: var(--ink); font-family: 'DM Sans', sans-serif;
          font-size: .82rem; cursor: pointer;
        }
        .page-btn:disabled { opacity: .4; cursor: not-allowed; }
        .tab-bar { display: flex; gap: 4px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 0; }
        .tab-btn {
          padding: 10px 20px; font-family: 'DM Sans', sans-serif; font-size: .875rem; font-weight: 500;
          color: var(--ink-soft); background: none; border: none; cursor: pointer;
          border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all .15s;
        }
        .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); font-weight: 600; }
        .tab-btn:hover:not(.active) { color: var(--ink); }
      `}</style>

      <div className="rbp-page">
        {loading ? (
          <div className="rbp-spinner">Loading bids…</div>
        ) : error ? (
          <div className="rbp-error">{error}</div>
        ) : (
          <>
            <PageHeader
              title={`Bids — ${rfq?.title}`}
              subtitle={`${rfq?.reference_number} · Bid Comparison`}
              action={
                <button
                  className="btn-ghost"
                  onClick={() => router.push(`/dashboard/rfqs/${rfqId}`)}
                >
                  ← Back to RFQ
                </button>
              }
            />

            {/* Stats */}
            <div className="rbp-stats">
              <StatCard label="Total Bids" value={data?.total ?? 0} />
              <StatCard label="Submitted" value={submittedBids.length} />
              <StatCard label="Lowest Total" value={lowestTotal != null ? lowestTotal.toLocaleString('en-US', { minimumFractionDigits: 2, style: 'currency', currency: rfq?.currency || 'USD' }) : '—'} accent />
              <StatCard label="RFQ Status" value={<RFQStatusBadge status={rfq?.status} />} />
            </div>

            {/* Comparison Table */}
            <div className="rbp-card">
              <div className="rbp-card-title">Side-by-Side Comparison</div>
              <BidComparisonTable items={items} bids={bids} />
            </div>

            {/* All Bids List */}
            <div className="rbp-card">
              <div className="rbp-card-title">All Bids ({data?.total ?? 0})</div>
              {bids.length === 0 ? (
                <p style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--ink-faint)', fontStyle: 'italic', fontSize: '.9rem' }}>
                  No bids received yet.
                </p>
              ) : (
                bids.map(bid => {
                  const isLowest = lowestTotal != null && bid.status === 'submitted' && parseFloat(bid.totalAmount) === lowestTotal;
                  return (
                    <div
                      key={bid.bidId}
                      className="rbp-bid-row"
                      onClick={() => router.push(`/dashboard/rfqs/${rfqId}/bids/${bid.bidId}`)}
                    >
                      <div>
                        <div className="rbp-vendor-name">{bid.vendorName}</div>
                        <div className="rbp-bid-meta">
                          {bid.submittedAt
                            ? `Submitted ${new Date(bid.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                            : 'Not yet submitted'}
                        </div>
                      </div>
                      <div className="rbp-bid-right">
                        <BidStatusBadge status={bid.status} />
                        <div className={`rbp-bid-amount${isLowest ? ' lowest' : ''}`}>
                          {parseFloat(bid.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} {bid.currency}
                          {isLowest && <span style={{ fontSize: '.7rem', marginLeft: 4 }}>★ Lowest</span>}
                        </div>
                        <button
                          className="btn-ghost"
                          onClick={e => { e.stopPropagation(); router.push(`/dashboard/rfqs/${rfqId}/bids/${bid.bidId}`); }}
                        >
                          View Detail
                        </button>
                      </div>
                    </div>
                  );
                })
              )}

              {(data?.total ?? 0) > LIMIT && (
                <div className="pagination">
                  <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '.82rem', color: 'var(--ink-soft)' }}>
                    Page {page} / {Math.ceil((data?.total ?? 0) / LIMIT)}
                  </span>
                  <button className="page-btn" disabled={page >= Math.ceil((data?.total ?? 0) / LIMIT)} onClick={() => setPage(p => p + 1)}>Next →</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
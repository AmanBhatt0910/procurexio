'use client';
// src/components/bids/BidGridCard.jsx

import BidStatusBadge from '@/components/bids/BidStatusBadge';
import RFQStatusBadge from '@/components/rfq/RFQStatusBadge';
import { isDeadlinePassed } from '@/lib/utils/deadline';

export default function BidGridCard({ rfq, companyCurrency = 'USD', onClick }) {
  const isPast = rfq.deadline ? isDeadlinePassed(rfq.deadline) : false;
  const isClosedStatus =
    rfq.rfq_status === 'closed' || rfq.rfq_status === 'cancelled';
  const currency = rfq.currency || companyCurrency;

  const actionLabel =
    rfq.bid_status === 'submitted' ? 'View'
    : rfq.bid_status === 'draft'   ? 'Continue'
    : 'Open';

  return (
    <>
      <style>{`
        .bid-grid-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 180px;
          cursor: pointer;
          transition: box-shadow .15s, border-color .15s, transform .15s;
        }
        .bid-grid-card:hover {
          box-shadow: 0 4px 16px rgba(15,14,13,.08);
          border-color: var(--ink-soft);
          transform: translateY(-1px);
        }
        .bid-card-ref { font-family: monospace; font-size: .76rem; color: var(--ink-faint); font-weight: 600; }
        .bid-card-title { font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: .92rem; color: var(--ink); margin-top: 4px; line-height: 1.35; }
        .bid-card-meta { display: flex; flex-wrap: wrap; gap: 10px; }
        .bid-card-meta-item { display: flex; align-items: center; gap: 5px; font-size: .78rem; color: var(--ink-soft); font-family: 'DM Sans', sans-serif; }
        .bid-card-meta-label { color: var(--ink-faint); font-size: .72rem; }
        .bid-overdue { color: var(--accent) !important; font-weight: 600; }
        .bid-card-footer { margin-top: auto; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .bid-open-btn {
          padding: 6px 14px; background: var(--ink); color: #fff;
          border: none; border-radius: 6px; font-size: .8rem;
          font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: background .12s;
        }
        .bid-open-btn:hover { background: var(--accent); }
      `}</style>
      <div
        className="bid-grid-card"
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onClick?.()}
        aria-label={`RFQ invitation: ${rfq.title || rfq.reference_number || 'Untitled'}`}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <div className="bid-card-ref">{rfq.reference_number || '—'}</div>
            <div className="bid-card-title">{rfq.title || '—'}</div>
          </div>
          {rfq.rfq_status && <RFQStatusBadge status={rfq.rfq_status} />}
        </div>

        {/* Meta */}
        <div className="bid-card-meta">
          <div className="bid-card-meta-item">
            <span className="bid-card-meta-label">Deadline:</span>
            <span className={isPast ? 'bid-overdue' : ''}>
              {rfq.deadline
                ? new Date(rfq.deadline).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
                : '—'}
              {isPast && !isClosedStatus && ' ⚠'}
            </span>
          </div>
          {rfq.total_amount != null && (
            <div className="bid-card-meta-item">
              <span className="bid-card-meta-label">Bid total:</span>
              <span>
                {currency} {parseFloat(rfq.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bid-card-footer">
          <div>
            {rfq.bid_status
              ? <BidStatusBadge status={rfq.bid_status} />
              : <span style={{ fontSize: '.78rem', color: 'var(--ink-faint)' }}>Not started</span>}
          </div>
          <button
            className="bid-open-btn"
            onClick={e => { e.stopPropagation(); onClick?.(); }}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </>
  );
}

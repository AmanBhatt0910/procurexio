'use client';
// src/components/rfq/RFQGridCard.jsx

import RFQStatusBadge from '@/components/rfq/RFQStatusBadge';
import { isDeadlinePassed } from '@/lib/deadline';

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

export default function RFQGridCard({ rfq, onClick }) {
  const isOverdue =
    rfq.deadline &&
    isDeadlinePassed(rfq.deadline) &&
    !['closed', 'cancelled'].includes(rfq.status || '');

  return (
    <>
      <style>{`
        .rfq-grid-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 18px 20px;
          cursor: pointer;
          transition: box-shadow .15s, border-color .15s, transform .15s;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 180px;
        }
        .rfq-grid-card:hover {
          box-shadow: 0 4px 16px rgba(15,14,13,.08);
          border-color: var(--ink-soft);
          transform: translateY(-1px);
        }
        .rfq-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
        .rfq-card-ref { font-family: monospace; font-size: .76rem; color: var(--ink-faint); font-weight: 600; }
        .rfq-card-title { font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: .92rem; color: var(--ink); margin-top: 4px; line-height: 1.35; }
        .rfq-card-meta { display: flex; flex-wrap: wrap; gap: 10px; }
        .rfq-card-meta-item { display: flex; align-items: center; gap: 5px; font-size: .78rem; color: var(--ink-soft); font-family: 'DM Sans', sans-serif; }
        .rfq-card-meta-label { color: var(--ink-faint); font-size: .72rem; }
        .rfq-card-footer { display: flex; align-items: center; justify-content: space-between; margin-top: auto; gap: 8px; }
        .rfq-card-creator { font-size: .76rem; color: var(--ink-faint); font-family: 'DM Sans', sans-serif; }
        .rfq-overdue { color: var(--accent) !important; font-weight: 600; }
      `}</style>
      <div
        className="rfq-grid-card"
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onClick?.()}
        aria-label={`RFQ: ${rfq.title || rfq.reference_number || 'Untitled'}`}
      >
        {/* Header row */}
        <div className="rfq-card-header">
          <div>
            <div className="rfq-card-ref">{rfq.reference_number || '—'}</div>
            <div className="rfq-card-title">{rfq.title || '—'}</div>
          </div>
          {rfq.status && <RFQStatusBadge status={rfq.status} />}
        </div>

        {/* Meta info */}
        <div className="rfq-card-meta">
          <div className="rfq-card-meta-item">
            <span className="rfq-card-meta-label">Deadline:</span>
            <span className={isOverdue ? 'rfq-overdue' : ''}>
              {formatDate(rfq.deadline)}{isOverdue && ' ⚠'}
            </span>
          </div>
          {rfq.budget != null && (
            <div className="rfq-card-meta-item">
              <span className="rfq-card-meta-label">Budget:</span>
              <span>{formatCurrency(rfq.budget, rfq.currency)}</span>
            </div>
          )}
        </div>

        {/* Footer row */}
        <div className="rfq-card-footer">
          <div style={{ display: 'flex', gap: 12 }}>
            {rfq.item_count != null && (
              <span className="rfq-card-meta-item">
                <span style={{ fontSize: '1rem' }}>📦</span>
                {rfq.item_count} item{rfq.item_count !== 1 ? 's' : ''}
              </span>
            )}
            {rfq.vendor_count != null && (
              <span className="rfq-card-meta-item">
                <span style={{ fontSize: '1rem' }}>🏢</span>
                {rfq.vendor_count} vendor{rfq.vendor_count !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {rfq.created_by_name && (
            <span className="rfq-card-creator">{rfq.created_by_name}</span>
          )}
        </div>
      </div>
    </>
  );
}

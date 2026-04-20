'use client';
// src/components/rfq/RFQGridCard.jsx

import RFQStatusBadge from '@/components/rfq/RFQStatusBadge';
import { isDeadlinePassed } from '@/lib/utils/deadline';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(value, currency = 'USD') {
  if (value == null || value === '') return null;
  const num = parseFloat(value);
  if (isNaN(num)) return null;
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0,
  }).format(num);
}

function CalendarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <rect x="1.5" y="2.5" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M4.5 1v3M8.5 1v3M1.5 5.5h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M6.5 1.5L11.5 4v5L6.5 11.5 1.5 9V4L6.5 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M6.5 1.5v10M1.5 4l5 3 5-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="9" height="8.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M5 11.5V8.5h3v3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M4.5 5.5h1M7.5 5.5h1M4.5 7.5h1M7.5 7.5h1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M4.5 3V1.5h4V3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  );
}

export default function RFQGridCard({ rfq, onClick }) {
  const isOverdue =
    rfq.deadline &&
    isDeadlinePassed(rfq.deadline) &&
    !['closed', 'cancelled'].includes(rfq.status || '');

  const budget = formatCurrency(rfq.budget, rfq.currency);

  return (
    <>
      <style>{`
        .rfq-grid-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 0;
          cursor: pointer;
          transition: box-shadow .18s ease, border-color .18s ease, transform .18s ease;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-height: 190px;
        }
        .rfq-grid-card:hover {
          box-shadow: 0 6px 24px rgba(15,14,13,.09);
          border-color: rgba(15,14,13,.18);
          transform: translateY(-2px);
        }
        .rfq-grid-card:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        .rfq-card-body {
          padding: 18px 20px 14px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .rfq-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }
        .rfq-card-ref {
          font-family: 'DM Mono', 'Courier New', monospace;
          font-size: .7rem;
          color: var(--ink-faint);
          font-weight: 500;
          letter-spacing: .03em;
          margin-bottom: 5px;
        }
        .rfq-card-title {
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          font-size: .93rem;
          color: var(--ink);
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .rfq-card-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: auto;
        }
        .rfq-card-meta-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: .775rem;
          color: var(--ink-soft);
          font-family: 'DM Sans', sans-serif;
        }
        .rfq-card-meta-chip.overdue {
          color: var(--accent);
          font-weight: 600;
        }
        .rfq-card-footer {
          padding: 11px 20px;
          border-top: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          background: var(--surface);
        }
        .rfq-card-stats {
          display: flex;
          gap: 14px;
        }
        .rfq-card-stat {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: .75rem;
          color: var(--ink-soft);
          font-family: 'DM Sans', sans-serif;
        }
        .rfq-card-creator {
          font-size: .74rem;
          color: var(--ink-faint);
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 110px;
        }
        .rfq-card-budget {
          font-family: 'DM Sans', sans-serif;
          font-size: .795rem;
          font-weight: 600;
          color: var(--ink);
          letter-spacing: -.01em;
        }
      `}</style>
      <div
        className="rfq-grid-card"
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onClick?.()}
        aria-label={`RFQ: ${rfq.title || rfq.reference_number || 'Untitled'}`}
      >
        <div className="rfq-card-body">
          <div className="rfq-card-top">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="rfq-card-ref">{rfq.reference_number || '—'}</div>
              <div className="rfq-card-title">{rfq.title || '—'}</div>
            </div>
            {rfq.status && (
              <div style={{ flexShrink: 0, marginTop: 2 }}>
                <RFQStatusBadge status={rfq.status} />
              </div>
            )}
          </div>

          <div className="rfq-card-meta">
            {rfq.deadline && (
              <span className={`rfq-card-meta-chip${isOverdue ? ' overdue' : ''}`}>
                <CalendarIcon />
                {formatDate(rfq.deadline)}{isOverdue && ' ⚠'}
              </span>
            )}
            {budget && (
              <span className="rfq-card-budget">{budget}</span>
            )}
          </div>
        </div>

        <div className="rfq-card-footer">
          <div className="rfq-card-stats">
            {rfq.item_count != null && (
              <span className="rfq-card-stat">
                <BoxIcon />
                {rfq.item_count} item{rfq.item_count !== 1 ? 's' : ''}
              </span>
            )}
            {rfq.vendor_count != null && (
              <span className="rfq-card-stat">
                <BuildingIcon />
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
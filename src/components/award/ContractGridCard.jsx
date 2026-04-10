'use client';
// src/components/award/ContractGridCard.jsx

import AwardStatusBadge from '@/components/award/AwardStatusBadge';

function fmt(amount, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
}

function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ContractGridCard({ contract, onClick }) {
  return (
    <>
      <style>{`
        .contract-grid-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 160px;
          cursor: pointer;
          transition: box-shadow .15s, border-color .15s, transform .15s;
        }
        .contract-grid-card:hover {
          box-shadow: 0 4px 16px rgba(15,14,13,.08);
          border-color: var(--ink-soft);
          transform: translateY(-1px);
        }
        .contract-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
        .contract-card-ref { font-family: monospace; font-size: .76rem; color: var(--ink-faint); font-weight: 600; }
        .contract-card-rfq { font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: .92rem; color: var(--ink); margin-top: 4px; line-height: 1.3; }
        .contract-card-rfq-title { font-size: .8rem; color: var(--ink-soft); margin-top: 2px; }
        .contract-card-meta { display: flex; flex-wrap: wrap; gap: 10px; }
        .contract-card-meta-item { display: flex; align-items: center; gap: 5px; font-size: .78rem; color: var(--ink-soft); font-family: 'DM Sans', sans-serif; }
        .contract-card-meta-label { color: var(--ink-faint); font-size: .72rem; }
        .contract-card-amount { font-weight: 700; color: var(--accent) !important; }
        .contract-card-footer { margin-top: auto; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .contract-card-vendor { font-size: .82rem; font-weight: 500; color: var(--ink); font-family: 'DM Sans', sans-serif; }
      `}</style>
      <div
        className="contract-grid-card"
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onClick?.()}
        aria-label={`Contract: ${contract.contractRef || contract.rfqRef || 'Untitled'}`}
      >
        {/* Header */}
        <div className="contract-card-header">
          <div>
            <div className="contract-card-ref">{contract.contractRef || '—'}</div>
            <div className="contract-card-rfq">{contract.rfqRef || '—'}</div>
            {contract.rfqTitle && (
              <div className="contract-card-rfq-title">{contract.rfqTitle}</div>
            )}
          </div>
          <AwardStatusBadge status={contract.status} />
        </div>

        {/* Meta */}
        <div className="contract-card-meta">
          <div className="contract-card-meta-item">
            <span className="contract-card-meta-label">Amount:</span>
            <span className="contract-card-amount">{fmt(contract.totalAmount, contract.currency)}</span>
          </div>
          <div className="contract-card-meta-item">
            <span className="contract-card-meta-label">Awarded:</span>
            <span>{fmtDate(contract.awardedAt)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="contract-card-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '1rem' }}>🏢</span>
            <span className="contract-card-vendor">{contract.vendorName || '—'}</span>
          </div>
        </div>
      </div>
    </>
  );
}

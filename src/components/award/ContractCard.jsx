// src/components/award/ContractCard.jsx
'use client';
import AwardStatusBadge from './AwardStatusBadge';

function fmt(amount, currency) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount);
}

function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function ContractCard({ contract, onCancel, readOnly = false }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@400;500&display=swap');
        .contract-card {
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--white);
          box-shadow: var(--shadow);
          overflow: hidden;
        }
        .contract-card-header {
          padding: 20px 24px 16px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }
        .contract-ref {
          font-family: 'DM Sans', monospace;
          font-size: .78rem;
          font-weight: 500;
          color: var(--ink-faint);
          letter-spacing: .06em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .contract-vendor {
          font-family: 'Syne', sans-serif;
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--ink);
          letter-spacing: -.02em;
        }
        .contract-amount {
          font-family: 'Syne', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--accent);
          letter-spacing: -.02em;
          white-space: nowrap;
        }
        .contract-body {
          padding: 16px 24px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .contract-field label {
          display: block;
          font-size: .72rem;
          font-weight: 600;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--ink-faint);
          margin-bottom: 3px;
          font-family: 'DM Sans', sans-serif;
        }
        .contract-field p {
          margin: 0;
          font-size: .9rem;
          color: var(--ink);
          font-family: 'DM Sans', sans-serif;
          font-weight: 400;
        }
        .contract-notes {
          grid-column: 1 / -1;
        }
        .contract-footer {
          padding: 14px 24px;
          border-top: 1px solid var(--border);
          background: var(--surface);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .cancel-btn {
          padding: 8px 18px;
          border: 1px solid #fca5a5;
          background: white;
          color: #dc2626;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: .82rem;
          font-weight: 500;
          cursor: pointer;
          transition: background .15s, transform .1s;
        }
        .cancel-btn:hover { background: #fee2e2; transform: translateY(-1px); }
      `}</style>

      <div className="contract-card">
        <div className="contract-card-header">
          <div>
            <div className="contract-ref">{contract.contract_reference || contract.contractRef}</div>
            <div className="contract-vendor">{contract.vendor_name || contract.vendorName}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="contract-amount">
              {fmt(contract.total_amount || contract.totalAmount, contract.currency)}
            </div>
            <div style={{ marginTop: 6 }}>
              <AwardStatusBadge status={contract.status} />
            </div>
          </div>
        </div>

        <div className="contract-body">
          <div className="contract-field">
            <label>Awarded By</label>
            <p>{contract.awarded_by_name || contract.awardedByName || '—'}</p>
          </div>
          <div className="contract-field">
            <label>Awarded On</label>
            <p>{fmtDate(contract.awarded_at || contract.awardedAt)}</p>
          </div>
          {contract.vendor_email && (
            <div className="contract-field">
              <label>Vendor Email</label>
              <p>{contract.vendor_email}</p>
            </div>
          )}
          {contract.notes && (
            <div className="contract-field contract-notes">
              <label>Notes</label>
              <p style={{ whiteSpace: 'pre-wrap' }}>{contract.notes}</p>
            </div>
          )}
        </div>

        {!readOnly && onCancel && contract.status === 'active' && (
          <div className="contract-footer">
            <span style={{ fontSize: '.82rem', color: 'var(--ink-soft)', fontFamily: "'DM Sans', sans-serif" }}>
              Cancelling will reopen this RFQ for re-awarding.
            </span>
            <button className="cancel-btn" onClick={onCancel}>Cancel Award</button>
          </div>
        )}
      </div>
    </>
  );
}
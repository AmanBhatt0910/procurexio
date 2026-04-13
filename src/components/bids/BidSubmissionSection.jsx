'use client';

// ── BidSubmissionSection — action buttons and minimum-reduction update guidance
export default function BidSubmissionSection({
  bid,
  canEdit,
  canUpdate,
  canWithdraw,
  updateMode,
  saving,
  bidItems,
  currency,
  onSave,
  onCancelUpdateMode,
  onEnterUpdateMode,
  onOpenConfirmModal,
}) {
  // Real-time calculation for 100-unit minimum check (tax excluded — reference only)
  const currentTotal = bidItems.reduce((sum, item) => {
    const up  = parseFloat(item.unit_price) || 0;
    const qty = parseFloat(item.quantity)   || 0;
    return sum + up * qty;
  }, 0);

  const submittedTotal = parseFloat(bid?.total_amount) || 0;
  // Guard: only compute reduction logic when submittedTotal is positive (submitted bids)
  const maxAllowed     = submittedTotal > 0 ? submittedTotal - 100 : 0;
  const meetsMinimum   = submittedTotal > 0 && currentTotal <= maxAllowed && currentTotal > 0;
  // How much more the user needs to reduce (always non-negative)
  const shortfall      = Math.max(0, currentTotal - maxAllowed);

  const hasPrices = bidItems.length > 0 && bidItems.some(i => (parseFloat(i.unit_price) || 0) > 0);

  if (!canEdit && !canUpdate && !canWithdraw) return null;

  // Helper: format a number as "CURRENCY X,XXX.XX"
  const fmt = (n) =>
    `${currency} ${parseFloat(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <>
      <style>{`
        .bs-actions-bar {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 20px;
        }
        
        .bs-actions-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }
        
        .bs-actions-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        
        .bs-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 9px;
          font-family: 'DM Sans', sans-serif;
          font-size: .875rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all .14s ease;
          letter-spacing: -.01em;
          min-height: 40px;
          white-space: nowrap;
        }
        
        .bs-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .bs-btn--primary {
          background: var(--ink);
          color: #fff;
          border: 1.5px solid var(--ink);
        }
        
        .bs-btn--primary:hover:not(:disabled) {
          background: rgba(15,14,13,.85);
          border-color: rgba(15,14,13,.85);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(15,14,13,.15);
        }
        
        .bs-btn--outline {
          background: transparent;
          color: var(--ink-soft);
          border: 1.5px solid var(--border);
        }
        
        .bs-btn--outline:hover:not(:disabled) {
          background: var(--surface);
          color: var(--ink);
          border-color: var(--ink-soft);
        }
        
        .bs-btn--secondary {
          background: var(--surface);
          color: var(--ink);
          border: 1.5px solid var(--border);
        }
        
        .bs-btn--secondary:hover:not(:disabled) {
          background: var(--ink);
          color: #fff;
          border-color: var(--ink);
        }
        
        .bs-btn--success {
          background: #27500A;
          color: #fff;
          border: 1.5px solid #27500A;
        }
        
        .bs-btn--success:hover:not(:disabled) {
          background: #3B6D11;
          border-color: #3B6D11;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(39,80,10,.15);
        }
        
        .bs-btn--danger {
          background: #A32D2D;
          color: #fff;
          border: 1.5px solid #A32D2D;
        }
        
        .bs-btn--danger:hover:not(:disabled) {
          background: #791F1F;
          border-color: #791F1F;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(163,45,45,.15);
        }
        
        .bs-btn--warning {
          background: #FAC775;
          color: #633806;
          border: 1.5px solid #FAC775;
        }
        
        .bs-btn--warning:hover:not(:disabled) {
          background: #F5B75D;
          border-color: #F5B75D;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(250,199,117,.15);
        }
        
        .bs-update-info {
          background: #FAEEDA;
          border: 1px solid #FAC775;
          border-radius: 9px;
          padding: 12px 14px;
          font-size: .78rem;
          color: #8a6500;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          line-height: 1.5;
        }
        
        .bs-update-info strong {
          font-weight: 600;
        }
        
        .bs-check-icon {
          display: inline-block;
          flex-shrink: 0;
        }
        
        .bs-feedback-box {
          border-radius: 9px;
          padding: 12px 14px;
          font-size: .82rem;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          line-height: 1.5;
        }
        
        .bs-feedback-box--success {
          background: #e8f5ee;
          border: 1px solid #6ee7b7;
          color: #1a7a4a;
        }
        
        .bs-feedback-box--warning {
          background: #fff8e8;
          border: 1px solid #f5dfa0;
          color: #8a6500;
        }
        
        .bs-submitted-text {
          margin-left: auto;
          color: var(--ink-soft);
          font-size: .78rem;
          font-family: 'DM Sans', sans-serif;
        }
        
        @media (max-width: 640px) {
          .bs-btn {
            padding: 9px 16px;
            font-size: .8rem;
            min-height: 36px;
          }
          
          .bs-actions-row {
            width: 100%;
          }
          
          .bs-submitted-text {
            margin-left: 0;
            width: 100%;
            order: 3;
          }
        }
      `}</style>

      <div className="bs-actions-container">
        {/* ── Draft bid actions ── */}
        {canEdit && (
          <div className="bs-actions-row">
            <button className="bs-btn bs-btn--outline" disabled={saving} onClick={onSave}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 11h8M3.5 2H2v10c0 .55.45 1 1 1h8c.55 0 1-.45 1-1V2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 5h4M5 7h4M5 9h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              {saving ? 'Saving…' : 'Save Draft'}
            </button>
            <button
              className="bs-btn bs-btn--primary"
              disabled={saving || !hasPrices}
              onClick={() => onOpenConfirmModal('submit')}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Submit Bid
            </button>
          </div>
        )}

        {/* ── Submitted bid — enter update mode ── */}
        {canUpdate && !updateMode && (
          <div className="bs-actions-container">
            <div className="bs-actions-row">
              <button
                className="bs-btn bs-btn--warning"
                disabled={saving}
                onClick={onEnterUpdateMode}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9.5 2L12.5 5L5.5 12H2.5V9L9.5 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                  <path d="M7.5 3.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Update Bid
              </button>
            </div>
            <div className="bs-update-info">
              <span className="bs-check-icon">ℹ️</span>
              <span>
                Your new bid must be at least <strong>100 {currency} lower</strong> than the current
                total of <strong>{fmt(submittedTotal)}</strong>.
              </span>
            </div>
          </div>
        )}

        {/* ── Update mode actions with real-time minimum-reduction feedback ── */}
        {canUpdate && updateMode && (
          <div className="bs-actions-container">
            {hasPrices && (
              <div className={`bs-feedback-box ${meetsMinimum ? 'bs-feedback-box--success' : 'bs-feedback-box--warning'}`}>
                <span className="bs-check-icon">{meetsMinimum ? '✅' : '⚠️'}</span>
                <span>
                  {meetsMinimum ? (
                    <>
                      Your revised total ({fmt(currentTotal)}) is{' '}
                      <strong>{fmt(submittedTotal - currentTotal)} lower</strong> — ready to submit.
                    </>
                  ) : (
                    <>
                      Current total ({fmt(currentTotal)}) — reduce by at least{' '}
                      <strong>{fmt(shortfall)} more</strong> to meet the minimum 100 {currency} reduction.
                      Required maximum: <strong>{fmt(maxAllowed)}</strong>.
                    </>
                  )}
                </span>
              </div>
            )}
            <div className="bs-actions-row">
              <button
                className="bs-btn bs-btn--success"
                disabled={saving || !hasPrices || !meetsMinimum}
                onClick={() => onOpenConfirmModal('update')}
                title={!meetsMinimum ? `Must be at least 100 ${currency} lower than ${fmt(submittedTotal)}` : ''}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {saving ? 'Saving…' : 'Save Update'}
              </button>
              <button
                className="bs-btn bs-btn--outline"
                disabled={saving}
                onClick={onCancelUpdateMode}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M10 4L4 10M4 4l6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Withdraw ── */}
        {canWithdraw && !updateMode && (
          <div className="bs-actions-row">
            <button
              className="bs-btn bs-btn--danger"
              disabled={saving}
              onClick={() => onOpenConfirmModal('withdraw')}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8M3 7l3-3M3 7l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Withdraw Bid
            </button>
            {bid.submitted_at && (
              <span className="bs-submitted-text">
                Submitted{' '}
                {new Date(bid.submitted_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );
}

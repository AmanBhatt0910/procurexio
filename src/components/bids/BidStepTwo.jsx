'use client';
// src/components/bids/BidStepTwo.jsx

import BidItemsForm from '@/components/bids/BidItemsForm';

const MIN_BID_REDUCTION = 100;

export default function BidStepTwo({
  rfqItems,
  bid,
  currency,
  setCurrency,
  companyCurrency,
  notes,
  setNotes,
  bidItems,
  setBidItems,
  canEdit,
  canUpdate,
  updateMode,
  saving,
  isLocked,
  onSave,
  onEnterUpdateMode,
  onCancelUpdateMode,
  onBack,
  onNext,
}) {
  const currencyOptions = Array.from(
    new Set([companyCurrency, 'USD', 'EUR', 'GBP', 'INR', 'AED', 'SGD', 'CAD', 'AUD'])
  );

  const isEditable = canEdit || updateMode;

  const liveTotal = bidItems.reduce((sum, item) => {
    return sum + (parseFloat(item.unit_price) || 0) * (parseFloat(item.quantity) || 0);
  }, 0);

  const prevTotal = parseFloat(bid?.total_amount || 0);
  const meetsReduction = updateMode ? liveTotal <= prevTotal - MIN_BID_REDUCTION : true;
  const reductionShortfall = updateMode ? Math.max(0, liveTotal - (prevTotal - MIN_BID_REDUCTION)) : 0;

  const fmt = (n) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: currency || 'USD', maximumFractionDigits: 2,
  }).format(n);

  return (
    <>
      <style>{`
        .s2-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 0;
          margin-bottom: 20px;
          overflow: hidden;
        }
        .s2-card-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          background: var(--surface);
        }
        .s2-header-left {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .s2-section-tag {
          font-size: .7rem;
          font-weight: 700;
          letter-spacing: .09em;
          text-transform: uppercase;
          color: var(--ink-faint);
          font-family: 'DM Sans', sans-serif;
        }
        .s2-section-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          color: var(--ink);
          letter-spacing: -.025em;
        }
        .s2-total-chip {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 1px;
        }
        .s2-total-label {
          font-size: .68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .08em;
          color: var(--ink-faint);
          font-family: 'DM Sans', sans-serif;
        }
        .s2-total-value {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.3rem;
          letter-spacing: -.04em;
          color: var(--ink);
          line-height: 1.15;
        }
        .s2-total-value--good { color: #3B6D11; }
        .s2-total-value--warn { color: var(--accent); }
        .s2-card-body { padding: 24px; }
        .s2-currency-row {
          display: flex;
          align-items: flex-end;
          gap: 16px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .s2-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .s2-label {
          font-size: .785rem;
          font-weight: 600;
          color: var(--ink);
          font-family: 'DM Sans', sans-serif;
        }
        .s2-input {
          padding: 9px 13px;
          border: 1.5px solid var(--border);
          border-radius: 9px;
          font-family: 'DM Sans', sans-serif;
          font-size: .875rem;
          color: var(--ink);
          background: var(--white);
          outline: none;
          transition: border-color .15s, box-shadow .15s;
          -webkit-appearance: none;
        }
        .s2-input:focus {
          border-color: var(--ink);
          box-shadow: 0 0 0 3px rgba(15,14,13,.07);
        }
        .s2-input:disabled { background: var(--surface); color: var(--ink-soft); cursor: not-allowed; }
        .s2-notes-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
          min-width: 240px;
        }
        textarea.s2-input {
          resize: vertical;
          min-height: 76px;
          line-height: 1.55;
          width: 100%;
          box-sizing: border-box;
        }
        .s2-update-notice {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: #FAEEDA;
          border: 1px solid #FAC775;
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 20px;
        }
        .s2-update-notice-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #FAC775;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .s2-update-notice-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: .9rem;
          color: #633806;
          letter-spacing: -.02em;
          margin-bottom: 3px;
        }
        .s2-update-notice-sub {
          font-size: .825rem;
          color: #854F0B;
          line-height: 1.5;
          font-family: 'DM Sans', sans-serif;
        }
        .s2-reduction-bar {
          margin-top: 8px;
          background: rgba(200,80,26,.1);
          border: 1px solid rgba(200,80,26,.2);
          border-radius: 7px;
          padding: 7px 12px;
          font-size: .82rem;
          color: var(--accent);
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
        }
        .s2-card-footer {
          padding: 16px 24px;
          border-top: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          background: var(--surface);
        }
        .s2-footer-left { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .s2-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 18px;
          border-radius: 9px;
          font-family: 'DM Sans', sans-serif;
          font-size: .845rem;
          font-weight: 600;
          cursor: pointer;
          transition: all .14s;
          letter-spacing: -.01em;
        }
        .s2-btn--ghost {
          background: transparent;
          color: var(--ink-soft);
          border: 1.5px solid var(--border);
        }
        .s2-btn--ghost:hover { background: var(--surface); color: var(--ink); border-color: var(--ink-soft); }
        .s2-btn--outline {
          background: transparent;
          color: var(--ink);
          border: 1.5px solid var(--border);
        }
        .s2-btn--outline:hover { background: var(--ink); color: #fff; border-color: var(--ink); }
        .s2-btn--save {
          background: var(--surface);
          color: var(--ink);
          border: 1.5px solid var(--border);
        }
        .s2-btn--save:hover { background: var(--ink); color: #fff; border-color: var(--ink); }
        .s2-btn--primary {
          background: var(--ink);
          color: #fff;
          border: 1.5px solid var(--ink);
        }
        .s2-btn--primary:hover:not(:disabled) { opacity: .82; }
        .s2-btn--primary:disabled { opacity: .45; cursor: not-allowed; }
        .s2-btn--warn {
          background: #FAEEDA;
          color: #633806;
          border: 1.5px solid #FAC775;
        }
        .s2-btn--warn:hover { background: #FAC775; }
        @media (max-width: 600px) {
          .s2-card-header, .s2-card-body, .s2-card-footer { padding: 16px; }
          .s2-currency-row { gap: 12px; }
        }
      `}</style>

      <div className="s2-card">
        {/* Header with live total */}
        <div className="s2-card-header">
          <div className="s2-header-left">
            <div className="s2-section-tag">Step 2 of 4</div>
            <div className="s2-section-title">Enter Your Prices</div>
          </div>

          {liveTotal > 0 && (
            <div className="s2-total-chip">
              <span className="s2-total-label">Your Total</span>
              <span className={`s2-total-value${updateMode ? (meetsReduction ? ' s2-total-value--good' : ' s2-total-value--warn') : ''}`}>
                {fmt(liveTotal)}
              </span>
            </div>
          )}
        </div>

        <div className="s2-card-body">
          {/* Update mode notice */}
          {updateMode && (
            <div className="s2-update-notice">
              <div className="s2-update-notice-icon">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M9.5 2.5L12.5 5.5L5.5 12.5H2.5V9.5L9.5 2.5z" stroke="#633806" strokeWidth="1.3" strokeLinejoin="round"/>
                  <path d="M7.5 4.5l3 3" stroke="#633806" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div className="s2-update-notice-title">Updating Submitted Bid</div>
                <div className="s2-update-notice-sub">
                  Your new total must be at least <strong>{MIN_BID_REDUCTION} {currency} lower</strong> than
                  your current bid of <strong>{fmt(prevTotal)}</strong>.
                  Maximum allowed: <strong>{fmt(prevTotal - MIN_BID_REDUCTION)}</strong>.
                </div>
                {reductionShortfall > 0 && liveTotal > 0 && (
                  <div className="s2-reduction-bar">
                    ↓ Reduce by {fmt(reductionShortfall)} more to qualify
                  </div>
                )}
                {liveTotal > 0 && meetsReduction && (
                  <div style={{
                    marginTop: 8, fontSize: '.82rem', color: '#3B6D11',
                    fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                  }}>
                    ✓ Reduction qualifies
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Currency + Notes row */}
          <div className="s2-currency-row">
            <div className="s2-field">
              <label className="s2-label">Currency</label>
              <select
                className="s2-input"
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                disabled={!isEditable}
                style={{ cursor: isEditable ? 'pointer' : 'not-allowed', width: 110 }}
              >
                {currencyOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="s2-notes-field">
              <label className="s2-label">Notes / Cover Message <span style={{ fontWeight: 400, color: 'var(--ink-faint)', fontSize: '.74rem' }}>— optional</span></label>
              <textarea
                className="s2-input"
                placeholder="Any overall notes or message for the buyer…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                disabled={!isEditable}
              />
            </div>
          </div>

          {/* Pricing table */}
          <BidItemsForm
            rfqItems={rfqItems}
            initialItems={bidItems.length > 0 ? bidItems : (bid.items || [])}
            onChange={setBidItems}
            readOnly={!isEditable}
          />
        </div>

        {/* Footer with nav */}
        <div className="s2-card-footer">
          <div className="s2-footer-left">
            <button className="s2-btn s2-btn--ghost" onClick={onBack}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M10 6.5H3M3 6.5l3-3M3 6.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>

            {canEdit && (
              <button className="s2-btn s2-btn--save" disabled={saving} onClick={onSave}>
                {saving ? 'Saving…' : 'Save Draft'}
              </button>
            )}

            {canUpdate && !updateMode && (
              <button className="s2-btn s2-btn--warn" disabled={saving} onClick={onEnterUpdateMode}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M8.5 2L11 4.5 4.5 11H2v-2.5L8.5 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                  <path d="M7 3.5l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Update Prices
              </button>
            )}

            {updateMode && (
              <button className="s2-btn s2-btn--ghost" disabled={saving} onClick={onCancelUpdateMode}>
                Cancel Update
              </button>
            )}
          </div>

          {!isLocked && (
            <button className="s2-btn s2-btn--primary" onClick={onNext}>
              Next: Attachments
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M3 6.5h7M7 4l3 2.5-3 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
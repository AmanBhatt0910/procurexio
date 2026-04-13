'use client';
// src/components/bids/BidStepOne.jsx

/**
 * BidStepOne — Step 1: Create / Review Bid Setup
 */
export default function BidStepOne({
  bid,
  isPastDeadline,
  currency,
  setCurrency,
  companyCurrency,
  paymentTerms,
  setPaymentTerms,
  freightCharge,
  setFreightCharge,
  saving,
  onCreateBid,
  onNext,
}) {
  const currencyOptions = Array.from(
    new Set([companyCurrency, 'USD', 'EUR', 'GBP', 'INR', 'AED', 'SGD', 'CAD', 'AUD'])
  );

  if (!bid) {
    return (
      <>
        <style>{`
          .s1-card {
            background: var(--white);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 28px;
            margin-bottom: 20px;
          }
          .s1-section-tag {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: .7rem;
            font-weight: 700;
            letter-spacing: .09em;
            text-transform: uppercase;
            color: var(--ink-faint);
            font-family: 'DM Sans', sans-serif;
            margin-bottom: 6px;
          }
          .s1-title {
            font-family: 'Syne', sans-serif;
            font-weight: 700;
            font-size: 1.15rem;
            color: var(--ink);
            letter-spacing: -.03em;
            margin-bottom: 6px;
          }
          .s1-desc {
            font-size: .875rem;
            color: var(--ink-soft);
            line-height: 1.6;
            margin-bottom: 28px;
            font-family: 'DM Sans', sans-serif;
          }
          .s1-fields {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 16px;
            margin-bottom: 28px;
          }
          .s1-field label {
            display: block;
            font-size: .785rem;
            font-weight: 600;
            color: var(--ink);
            margin-bottom: 7px;
            font-family: 'DM Sans', sans-serif;
          }
          .s1-field-hint {
            font-weight: 400;
            color: var(--ink-faint);
            font-size: .74rem;
            margin-left: 4px;
          }
          .s1-input {
            width: 100%;
            padding: 10px 13px;
            border: 1.5px solid var(--border);
            border-radius: 9px;
            font-family: 'DM Sans', sans-serif;
            font-size: .875rem;
            color: var(--ink);
            background: var(--white);
            outline: none;
            box-sizing: border-box;
            transition: border-color .15s, box-shadow .15s;
            -webkit-appearance: none;
          }
          .s1-input::placeholder { color: var(--ink-faint); }
          .s1-input:focus {
            border-color: var(--ink);
            box-shadow: 0 0 0 3px rgba(15,14,13,.07);
          }
          .s1-input:disabled {
            background: var(--surface);
            color: var(--ink-soft);
            cursor: not-allowed;
            border-style: dashed;
          }
          .s1-tip-box {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            background: #E6F1FB;
            border: 1px solid #B5D4F4;
            border-radius: 10px;
            padding: 12px 16px;
            margin-bottom: 24px;
          }
          .s1-tip-text {
            font-size: .835rem;
            color: #0C447C;
            line-height: 1.55;
            font-family: 'DM Sans', sans-serif;
          }
          .s1-btn-create {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 11px 24px;
            background: var(--accent);
            color: #fff;
            border: none;
            border-radius: 10px;
            font-family: 'DM Sans', sans-serif;
            font-size: .875rem;
            font-weight: 600;
            cursor: pointer;
            transition: background .15s, transform .12s;
            letter-spacing: -.01em;
          }
          .s1-btn-create:hover:not(:disabled) {
            background: var(--accent-h);
            transform: translateY(-1px);
          }
          .s1-btn-create:disabled { opacity: .5; cursor: not-allowed; transform: none; }
          @media (max-width: 620px) {
            .s1-fields { grid-template-columns: 1fr; }
          }
        `}</style>

        <div className="s1-card">
          <div className="s1-section-tag">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M6 3.5v3l1.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Step 1 of 4
          </div>
          <div className="s1-title">Start Your Bid</div>
          <div className="s1-desc">
            Set the currency and terms for your bid. These are locked after creation,
            so double-check before continuing.
          </div>

          <div className="s1-tip-box">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="8" cy="8" r="6.5" stroke="#185FA5" strokeWidth="1.3"/>
              <path d="M8 5v3.5M8 11v.5" stroke="#185FA5" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <span className="s1-tip-text">
              <strong>Tip:</strong> Your currency selection is permanent for this bid. Choose the currency
              you&apos;ll use for all item prices. Payment terms and freight charges are visible to the buyer.
            </span>
          </div>

          <div className="s1-fields">
            <div className="s1-field">
              <label>
                Currency
                <span className="s1-field-hint">— permanent</span>
              </label>
              <select
                className="s1-input"
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                disabled={isPastDeadline}
                style={{ cursor: 'pointer' }}
              >
                {currencyOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="s1-field">
              <label>
                Payment Terms
                <span className="s1-field-hint">— days</span>
              </label>
              <input
                className="s1-input"
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 30"
                value={paymentTerms}
                onChange={e => setPaymentTerms(e.target.value)}
                disabled={isPastDeadline}
              />
            </div>

            <div className="s1-field">
              <label>
                Freight / Unit
                <span className="s1-field-hint">— optional</span>
              </label>
              <input
                className="s1-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={freightCharge}
                onChange={e => setFreightCharge(e.target.value)}
                disabled={isPastDeadline}
              />
            </div>
          </div>

          <button
            className="s1-btn-create"
            disabled={isPastDeadline || saving}
            onClick={onCreateBid}
          >
            {saving ? (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin .65s linear infinite' }}>
                  <circle cx="7" cy="7" r="5.5" stroke="rgba(255,255,255,.3)" strokeWidth="1.5"/>
                  <path d="M7 1.5a5.5 5.5 0 0 1 5.5 5.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Creating…
              </>
            ) : (
              <>
                Create Bid &amp; Continue
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </>
    );
  }

  /* ── Bid already exists — read-only summary ── */
  return (
    <>
      <style>{`
        .s1-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 24px;
          margin-bottom: 20px;
        }
        .s1-readonly-grid {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }
        .s1-readonly-chip {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 10px 16px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 9px;
          min-width: 120px;
        }
        .s1-readonly-chip-label {
          font-size: .68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .08em;
          color: var(--ink-faint);
          font-family: 'DM Sans', sans-serif;
        }
        .s1-readonly-chip-val {
          font-size: .9rem;
          font-weight: 600;
          color: var(--ink);
          font-family: 'DM Sans', sans-serif;
        }
        .s1-done-tag {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: .72rem;
          font-weight: 600;
          color: #3B6D11;
          background: #EAF3DE;
          border-radius: 20px;
          padding: 2px 9px;
          font-family: 'DM Sans', sans-serif;
          margin-bottom: 16px;
        }
      `}</style>

      <div className="s1-card">
        <div className="s1-done-tag">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M2 5.5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Bid Created
        </div>

        <div className="s1-readonly-grid">
          <div className="s1-readonly-chip">
            <span className="s1-readonly-chip-label">Currency</span>
            <span className="s1-readonly-chip-val">{bid.currency || currency}</span>
          </div>
          {paymentTerms !== '' && (
            <div className="s1-readonly-chip">
              <span className="s1-readonly-chip-label">Payment Terms</span>
              <span className="s1-readonly-chip-val">{paymentTerms} days</span>
            </div>
          )}
          {freightCharge !== '' && (
            <div className="s1-readonly-chip">
              <span className="s1-readonly-chip-label">Freight / Unit</span>
              <span className="s1-readonly-chip-val">{freightCharge}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onNext}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '10px 20px', background: 'var(--ink)', color: '#fff',
              border: 'none', borderRadius: 10, fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600, fontSize: '.875rem', cursor: 'pointer',
              transition: 'opacity .15s', letterSpacing: '-.01em',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Continue to Pricing
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
'use client';

/**
 * BidStepOne — Step 1: Create / Review Bid Setup
 *
 * If no bid exists yet: shows currency, payment terms, freight charge inputs
 * and a "Create Bid" button.
 *
 * If a bid already exists: shows a read-only summary of the creation-time
 * fields and a Next button to proceed.
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

  return (
    <div className="bid-card">
      {!bid ? (
        /* ── Create bid form ── */
        <>
          <span className="section-label" style={{ display: 'block', marginBottom: 8 }}>
            Start Your Bid
          </span>
          <p style={{ color: 'var(--ink-soft)', fontSize: '.9rem', margin: '0 0 20px' }}>
            Fill in the details below to create your bid for this RFQ.
            These fields can only be set once.
          </p>

          <div className="form-row">
            <div className="form-group">
              <label>Currency</label>
              <select
                className="form-control"
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                disabled={isPastDeadline}
              >
                {currencyOptions.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Payment Terms (days)</label>
              <input
                className="form-control"
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 30 for Net 30"
                value={paymentTerms}
                onChange={e => setPaymentTerms(e.target.value)}
                disabled={isPastDeadline}
              />
            </div>

            <div className="form-group">
              <label>Freight Charge per Unit</label>
              <input
                className="form-control"
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
            className="btn btn-accent"
            disabled={isPastDeadline || saving}
            onClick={onCreateBid}
          >
            {saving ? 'Creating…' : 'Create Bid & Continue →'}
          </button>
        </>
      ) : (
        /* ── Bid already created — show read-only terms ── */
        <>
          <span className="section-label" style={{ display: 'block', marginBottom: 8 }}>
            Bid Setup
          </span>
          <p style={{ color: 'var(--ink-soft)', fontSize: '.9rem', margin: '0 0 20px' }}>
            Your bid has been created. The settings below were locked at creation time.
          </p>

          <div className="form-row" style={{ marginBottom: 0 }}>
            <div className="form-group">
              <label>Currency</label>
              <input className="form-control" value={bid.currency || currency} readOnly disabled />
            </div>

            {paymentTerms !== '' && (
              <div className="form-group">
                <label>Payment Terms (days)</label>
                <input className="form-control" value={paymentTerms} readOnly disabled />
              </div>
            )}

            {freightCharge !== '' && (
              <div className="form-group">
                <label>Freight Charge per Unit</label>
                <input className="form-control" value={freightCharge} readOnly disabled />
              </div>
            )}
          </div>

          <div style={{
            display: 'flex', justifyContent: 'flex-end',
            paddingTop: 20, borderTop: '1px solid var(--border)', marginTop: 20,
          }}>
            <button className="btn btn-primary" onClick={onNext}>
              Next: Enter Prices →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

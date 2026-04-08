'use client';

export default function BidStartSection({
  currency, setCurrency,
  paymentTerms, setPaymentTerms,
  freightCharge, setFreightCharge,
  companyCurrency,
  isPastDeadline,
  saving,
  onCreateBid,
}) {
  const currencies = Array.from(new Set([companyCurrency, 'USD', 'EUR', 'GBP', 'INR', 'AED', 'SGD', 'CAD', 'AUD']));

  return (
    <div className="bid-card">
      <span className="section-label" style={{ display: 'block', marginBottom: 8 }}>
        Step 1 — Start Your Bid
      </span>
      <p style={{ color: 'var(--ink-soft)', fontSize: '.9rem', margin: '0 0 20px' }}>
        Fill in the details below to create your bid for this RFQ. Currency and payment terms
        can only be set once — they cannot be changed after creation.
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
            {currencies.map(c => <option key={c} value={c}>{c}</option>)}
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
        {saving ? 'Creating…' : 'Create Bid'}
      </button>
    </div>
  );
}

'use client';

import BidItemsForm from '@/components/bids/BidItemsForm';

/**
 * BidStepTwo — Step 2: Enter Item Prices
 *
 * Shows the interactive pricing form (BidItemsForm), a currency selector,
 * optional notes, and a Save Draft button.  Includes Back / Next navigation.
 */
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
  const MIN_BID_REDUCTION = 100;
  const currencyOptions = Array.from(
    new Set([companyCurrency, 'USD', 'EUR', 'GBP', 'INR', 'AED', 'SGD', 'CAD', 'AUD'])
  );

  return (
    <div className="bid-card">
      <div className="bid-card-header">
        <span className="section-label">Enter Item Prices</span>
      </div>

      {/* Update mode notice */}
      {updateMode && (
        <div className="update-panel">
          <div className="update-panel-title">✏️ Updating Your Submitted Bid</div>
          <div className="update-panel-sub">
            {(() => {
              const total  = parseFloat(bid.total_amount || 0);
              const maxBid = total - MIN_BID_REDUCTION;
              const fmt    = n =>
                `${currency} ${parseFloat(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
              return (
                <>
                  Your new bid must be at least{' '}
                  <strong>{MIN_BID_REDUCTION} {currency} lower</strong> than your
                  current bid of {fmt(total)}. Maximum allowed: {fmt(maxBid)}.
                  Adjust your item prices below — live feedback shows whether your
                  total qualifies.
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Currency + Notes */}
      <div className="form-row">
        <div className="form-group">
          <label>Currency</label>
          <select
            className="form-control"
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            disabled={!canEdit && !updateMode}
          >
            {currencyOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="form-group" style={{ flex: 3 }}>
          <label>Notes / Cover Message (optional)</label>
          <textarea
            className="form-control"
            rows={4}
            placeholder="Any overall notes for the buyer…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            disabled={!canEdit && !updateMode}
            style={{ resize: 'vertical' }}
          />
        </div>
      </div>

      {/* Items pricing table */}
      <div style={{ marginBottom: 20 }}>
        <BidItemsForm
          rfqItems={rfqItems}
          initialItems={bidItems.length > 0 ? bidItems : (bid.items || [])}
          onChange={setBidItems}
          readOnly={!canEdit && !updateMode}
        />
      </div>

      {/* Save button (draft bids only) */}
      {canEdit && (
        <div style={{ marginBottom: 16 }}>
          <button className="btn btn-outline" disabled={saving} onClick={onSave}>
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
        </div>
      )}

      {/* Enter/cancel update mode (submitted bids) */}
      {canUpdate && !updateMode && (
        <div style={{ marginBottom: 16 }}>
          <button className="btn btn-outline" disabled={saving} onClick={onEnterUpdateMode}>
            ✏️ Update Bid Prices
          </button>
        </div>
      )}
      {canUpdate && updateMode && (
        <div style={{ marginBottom: 16 }}>
          <button className="btn btn-outline" disabled={saving} onClick={onCancelUpdateMode}>
            Cancel Update
          </button>
        </div>
      )}

      {/* Step navigation */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 20, borderTop: '1px solid var(--border)', marginTop: 8,
      }}>
        <button className="btn btn-outline" onClick={onBack}>
          ← Back
        </button>
        {!isLocked && (
          <button className="btn btn-primary" onClick={onNext}>
            Next: Attachments &amp; Alternatives →
          </button>
        )}
      </div>
    </div>
  );
}

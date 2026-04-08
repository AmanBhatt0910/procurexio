'use client';

// ── BidSubmissionSection — action buttons and ₹100 update guidance ─────────
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
  // Real-time calculation for ₹100 minimum check (tax excluded — reference only)
  const currentTotal = bidItems.reduce((sum, item) => {
    const up  = parseFloat(item.unit_price) || 0;
    const qty = parseFloat(item.quantity)   || 0;
    return sum + up * qty;
  }, 0);

  const submittedTotal = parseFloat(bid?.total_amount || 0);
  const maxAllowed     = submittedTotal - 100;
  const meetsMinimum   = currentTotal <= maxAllowed && currentTotal > 0;
  // How much more the user needs to reduce (always non-negative)
  const shortfall      = Math.max(0, currentTotal - maxAllowed);

  const hasPrices = bidItems.length > 0 && bidItems.some(i => (parseFloat(i.unit_price) || 0) > 0);

  if (!canEdit && !canUpdate && !canWithdraw) return null;

  return (
    <div className="actions-bar">
      {/* ── Draft bid actions ── */}
      {canEdit && (
        <>
          <button className="btn btn-outline" disabled={saving} onClick={onSave}>
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button
            className="btn btn-accent"
            disabled={saving || !hasPrices}
            onClick={() => onOpenConfirmModal('submit')}
          >
            Submit Bid
          </button>
        </>
      )}

      {/* ── Submitted bid — enter update mode ── */}
      {canUpdate && !updateMode && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button
            className="btn btn-outline"
            disabled={saving}
            onClick={onEnterUpdateMode}
          >
            ✏️ Update Bid
          </button>
          <div style={{
            fontSize: '.76rem', color: '#8a6500',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span>ℹ️</span>
            <span>
              Your new bid must be at least{' '}
              <strong>100 {currency} lower</strong> than the current total of{' '}
              {currency} {submittedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}.
            </span>
          </div>
        </div>
      )}

      {/* ── Update mode actions with real-time ₹100 feedback ── */}
      {canUpdate && updateMode && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
          {hasPrices && (
            <div style={{
              background: meetsMinimum ? '#e8f5ee' : '#fff8e8',
              border: `1px solid ${meetsMinimum ? '#6ee7b7' : '#f5dfa0'}`,
              borderRadius: 8, padding: '10px 14px',
              fontSize: '.82rem',
              color: meetsMinimum ? '#1a7a4a' : '#8a6500',
            }}>
              {meetsMinimum ? (
                <>
                  ✅ Your revised total ({currency} {currentTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}) is{' '}
                  {currency} {(submittedTotal - currentTotal).toFixed(2)} lower — ready to submit.
                </>
              ) : (
                <>
                  ⚠ Current total ({currency} {currentTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}) — reduce by{' '}
                  at least {currency} {shortfall.toFixed(2)} more to meet the minimum 100 {currency} reduction.
                  Required maximum: {currency} {maxAllowed.toFixed(2)}.
                </>
              )}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-accent"
              disabled={saving || !hasPrices || !meetsMinimum}
              onClick={() => onOpenConfirmModal('update')}
              title={!meetsMinimum ? `Must be at least 100 ${currency} lower than ${currency} ${submittedTotal.toFixed(2)}` : ''}
            >
              {saving ? 'Saving…' : 'Save Update'}
            </button>
            <button
              className="btn btn-outline"
              disabled={saving}
              onClick={onCancelUpdateMode}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Withdraw ── */}
      {canWithdraw && (
        <button
          className="btn btn-danger"
          disabled={saving}
          onClick={() => onOpenConfirmModal('withdraw')}
          style={{ marginLeft: canUpdate && !updateMode ? 'auto' : undefined }}
        >
          Withdraw Bid
        </button>
      )}

      {bid.submitted_at && !updateMode && (
        <span style={{ marginLeft: 'auto', color: 'var(--ink-soft)', fontSize: '.8rem' }}>
          Submitted{' '}
          {new Date(bid.submitted_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
        </span>
      )}
    </div>
  );
}

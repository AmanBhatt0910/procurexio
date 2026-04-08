'use client';

// ── OutcomeBanner ───────────────────────────────────────────────────────────
function OutcomeBanner({ outcome, rfqClosed }) {
  if (!outcome && !rfqClosed) return null;
  if (outcome && outcome.bidStatus === 'draft') return null;
  if (!rfqClosed && outcome && outcome.bidStatus === 'submitted') return null;

  function fmt(amount, currency) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  }

  const pendingDecision = rfqClosed && (!outcome || outcome.bidStatus === 'submitted');
  const awarded = outcome?.awarded;

  const bannerStyles = `
    .outcome-banner {
      border-radius: 10px;
      padding: 20px 24px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      font-family: 'DM Sans', sans-serif;
      animation: fadeUp .3s ease both;
    }
    @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    .outcome-banner.awarded { background: #d1fae5; border: 1px solid #6ee7b7; color: #065f46; }
    .outcome-banner.rejected { background: var(--surface, #faf9f7); border: 1px solid var(--border, #e4e0db); color: var(--ink-soft, #6b6660); }
    .outcome-banner.pending { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
    .outcome-icon { font-size: 2rem; line-height: 1; flex-shrink: 0; }
    .outcome-title { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700; letter-spacing: -.02em; margin-bottom: 2px; }
    .outcome-sub { font-size: .85rem; opacity: .8; }
    .outcome-amount { margin-left: auto; font-family: 'Syne', sans-serif; font-size: 1.4rem; font-weight: 700; letter-spacing: -.02em; flex-shrink: 0; }
  `;

  if (pendingDecision) {
    return (
      <>
        <style>{bannerStyles}</style>
        <div className="outcome-banner pending">
          <div className="outcome-icon">⏳</div>
          <div>
            <div className="outcome-title">RFQ Closed — Awaiting Award Decision</div>
            <div className="outcome-sub">
              {outcome?.bidStatus === 'submitted'
                ? 'Your bid has been received. The buyer is reviewing all bids and will announce the award shortly.'
                : 'This RFQ has been closed. The buyer is reviewing bids and will announce the award shortly.'}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{bannerStyles}</style>
      <div className={`outcome-banner ${awarded ? 'awarded' : 'rejected'}`}>
        <div className="outcome-icon">{awarded ? '🎉' : '📋'}</div>
        <div>
          <div className="outcome-title">
            {awarded ? 'You won this contract!' : 'Contract awarded to another vendor'}
          </div>
          <div className="outcome-sub">
            {awarded
              ? `Contract ref: ${outcome.contractReference || '—'}`
              : 'Thank you for participating. This RFQ has been closed.'}
          </div>
        </div>
        {awarded && outcome.totalAmount && (
          <div className="outcome-amount">
            {fmt(outcome.totalAmount, outcome.currency)}
          </div>
        )}
      </div>
    </>
  );
}

// ── BidValidationMessages — error / success / warning banners ──────────────
export default function BidValidationMessages({
  error,
  success,
  isClosed,
  isPastDeadline,
  outcome,
  rfqClosed,
}) {
  return (
    <>
      {error   && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}
      {isClosed && (
        <div className="warning-banner">
          🔒 This RFQ is closed. Bid submission and editing are no longer allowed.
        </div>
      )}
      {!isClosed && isPastDeadline && (
        <div className="warning-banner">
          ⚠ The deadline for this RFQ has passed. Bid editing is locked.
        </div>
      )}
      <OutcomeBanner outcome={outcome} rfqClosed={rfqClosed} />
    </>
  );
}

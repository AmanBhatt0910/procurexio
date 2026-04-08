'use client';

/**
 * MinBidGuidancePanel
 *
 * Shows two different panels depending on context:
 *  1. Pre-edit (updateMode = false): Amber info banner explaining the ₹100 rule before the user starts editing.
 *  2. Live calc (updateMode = true): Real-time display of current vs new bid total with validation status.
 */
export default function MinBidGuidancePanel({ currentTotal, newTotal, currency, updateMode }) {
  const cur = parseFloat(currentTotal) || 0;
  const fmt = amount =>
    amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const requiredMax = cur - 100;
  const difference  = newTotal - cur;   // negative = reduction
  const isValid     = newTotal > 0 && newTotal <= requiredMax;
  const hasInput    = newTotal > 0;

  if (!updateMode) {
    // Pre-edit guidance banner
    return (
      <div style={{
        background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10,
        padding: '16px 20px', marginBottom: 16,
        display: 'flex', alignItems: 'flex-start', gap: 12,
      }}>
        <span style={{ fontSize: '1.3rem', flexShrink: 0, marginTop: 1 }}>💡</span>
        <div>
          <div style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '.9rem',
            color: '#78350f', marginBottom: 4,
          }}>
            Updating your bid requires a minimum ₹100 reduction
          </div>
          <div style={{ fontSize: '.84rem', color: '#92400e', lineHeight: 1.5 }}>
            Your current submitted bid is <strong>{currency} {fmt(cur)}</strong>.
            To update, your new total must be at most{' '}
            <strong>{currency} {fmt(requiredMax)}</strong> (at least ₹100 lower).
            Click <em>Update Bid</em> to start editing your prices.
          </div>
        </div>
      </div>
    );
  }

  // Live calculation panel (updateMode = true)
  const statusColor = isValid ? '#1a7a4a' : '#c8501a';
  const statusBg    = isValid ? '#e8f5ee' : '#fdf0eb';
  const statusBrd   = isValid ? '#b8dfc8' : '#f5c9b6';

  return (
    <div style={{
      background: statusBg, border: `1px solid ${statusBrd}`, borderRadius: 10,
      padding: '14px 18px', marginBottom: 16,
    }}>
      <div style={{
        fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em',
        textTransform: 'uppercase', color: statusColor, marginBottom: 10,
      }}>
        Bid Update Calculation
      </div>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '.72rem', color: statusColor, opacity: .75, marginBottom: 2 }}>Current bid</div>
          <div style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: statusColor,
          }}>
            {currency} {fmt(cur)}
          </div>
        </div>
        <div style={{ fontSize: '1.2rem', color: statusColor, opacity: .5 }}>→</div>
        <div>
          <div style={{ fontSize: '.72rem', color: statusColor, opacity: .75, marginBottom: 2 }}>New bid</div>
          <div style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: statusColor,
          }}>
            {hasInput ? `${currency} ${fmt(newTotal)}` : '—'}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: '.72rem', color: statusColor, opacity: .75, marginBottom: 2 }}>Reduction</div>
          <div style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: statusColor,
          }}>
            {/* difference = newTotal - cur; negative means reduction (▼), positive means increase (▲) */}
            {hasInput ? `${difference < 0 ? '▼' : '▲'} ${Math.abs(difference).toFixed(2)}` : '—'}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 10, fontSize: '.82rem', color: statusColor }}>
        {!hasInput
          ? `Enter your new unit prices above. Your new total must be ≤ ${currency} ${fmt(requiredMax)}.`
          : isValid
          ? `✓ Valid — your bid is ${currency} ${Math.abs(difference).toFixed(2)} lower than required.`
          : `✗ Not enough reduction. You need to lower your bid by at least ₹100 (to ≤ ${currency} ${fmt(requiredMax)}).`}
      </div>
    </div>
  );
}

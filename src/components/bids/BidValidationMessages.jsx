'use client';
// src/components/bids/BidValidationMessages.jsx

function OutcomeBanner({ outcome, rfqClosed }) {
  if (!outcome && !rfqClosed) return null;
  if (outcome && outcome.bidStatus === 'draft') return null;
  if (!rfqClosed && outcome && outcome.bidStatus === 'submitted') return null;

  function fmt(amount, currency) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount);
  }

  const pendingDecision = rfqClosed && (!outcome || outcome.bidStatus === 'submitted');
  const awarded = outcome?.awarded;

  if (pendingDecision) {
    return (
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 14,
        background: '#FAEEDA', border: '1px solid #FAC775',
        borderRadius: 12, padding: '16px 20px', marginBottom: 16,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: '#FAC775', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="7" stroke="#633806" strokeWidth="1.5"/>
            <path d="M9 5.5v4M9 11.5v1" stroke="#633806" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <div style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '.95rem',
            color: '#633806', letterSpacing: '-.02em', marginBottom: 3,
          }}>
            RFQ Closed — Awaiting Award Decision
          </div>
          <div style={{ fontSize: '.845rem', color: '#854F0B', lineHeight: 1.55 }}>
            {outcome?.bidStatus === 'submitted'
              ? 'Your bid has been received. The buyer is reviewing all submissions and will announce the award shortly.'
              : 'This RFQ has been closed. The buyer is reviewing bids and will announce the award shortly.'}
          </div>
        </div>
      </div>
    );
  }

  if (awarded) {
    return (
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 14,
        background: '#EAF3DE', border: '1px solid #C0DD97',
        borderRadius: 12, padding: '16px 20px', marginBottom: 16,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: '#C0DD97', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 9l3.5 3.5 6.5-7" stroke="#27500A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '.95rem',
            color: '#27500A', letterSpacing: '-.02em', marginBottom: 3,
          }}>
            You won this contract!
          </div>
          <div style={{ fontSize: '.845rem', color: '#3B6D11', lineHeight: 1.55 }}>
            Contract ref: <strong>{outcome.contractReference || '—'}</strong>
            {outcome.totalAmount && (
              <span> · <strong>{fmt(outcome.totalAmount, outcome.currency)}</strong></span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 14,
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '16px 20px', marginBottom: 16,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: '#E4E0DB', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="3" y="4" width="12" height="11" rx="2" stroke="var(--ink-soft)" strokeWidth="1.4"/>
          <path d="M6 8h6M6 11h4" stroke="var(--ink-soft)" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </div>
      <div>
        <div style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '.95rem',
          color: 'var(--ink)', letterSpacing: '-.02em', marginBottom: 3,
        }}>
          Contract awarded to another vendor
        </div>
        <div style={{ fontSize: '.845rem', color: 'var(--ink-soft)', lineHeight: 1.55 }}>
          Thank you for participating. This RFQ has been closed.
        </div>
      </div>
    </div>
  );
}

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
      {error && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          background: '#FCEBEB', border: '1px solid #F7C1C1',
          borderRadius: 10, padding: '12px 16px', marginBottom: 14,
          color: '#A32D2D', fontSize: '.845rem',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M7.5 4.5V8M7.5 10v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          background: '#EAF3DE', border: '1px solid #C0DD97',
          borderRadius: 10, padding: '12px 16px', marginBottom: 14,
          color: '#27500A', fontSize: '.845rem',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M5 7.5l2 2 3.5-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {success}
        </div>
      )}

      {isClosed && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#F1EFE8', border: '1px solid #D3D1C7',
          borderRadius: 10, padding: '11px 16px', marginBottom: 14,
          color: '#5F5E5A', fontSize: '.845rem',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
            <rect x="3" y="7" width="9" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          This RFQ is closed. Bid submission and editing are no longer allowed.
        </div>
      )}

      {!isClosed && isPastDeadline && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#FAEEDA', border: '1px solid #FAC775',
          borderRadius: 10, padding: '11px 16px', marginBottom: 14,
          color: '#633806', fontSize: '.845rem',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
            <path d="M7.5 1.5L13.5 12H1.5L7.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            <path d="M7.5 6v3M7.5 10.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          The deadline for this RFQ has passed. Bid editing is locked.
        </div>
      )}

      <OutcomeBanner outcome={outcome} rfqClosed={rfqClosed} />
    </>
  );
}
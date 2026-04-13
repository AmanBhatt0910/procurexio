'use client';
// src/components/bids/BidStepFour.jsx

import BidStatusBadge from '@/components/bids/BidStatusBadge';
import BidSubmissionSection from '@/components/bids/BidSubmissionSection';

function RankCard({ rank, totalBids }) {
  if (!rank) return null;

  const isL1 = rank === 'L1';
  const isL2 = rank === 'L2';
  const isL3 = rank === 'L3';

  const config = isL1
    ? { bg: '#EAF3DE', border: '#C0DD97', numColor: '#27500A', labelColor: '#3B6D11', desc: 'You have the lowest bid — strongest position!', emoji: '🏆' }
    : isL2
    ? { bg: '#E6F1FB', border: '#B5D4F4', numColor: '#0C447C', labelColor: '#185FA5', desc: 'Second lowest bid — strong position!', emoji: '🥈' }
    : isL3
    ? { bg: '#F1EFE8', border: '#D3D1C7', numColor: '#2C2C2A', labelColor: '#5F5E5A', desc: 'Third lowest bid — in the top 3!', emoji: '🥉' }
    : { bg: 'var(--surface)', border: 'var(--border)', numColor: 'var(--ink)', labelColor: 'var(--ink-soft)', desc: `Your position among ${totalBids} bid${totalBids !== 1 ? 's' : ''}`, emoji: null };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      background: config.bg,
      border: `1.5px solid ${config.border}`,
      borderRadius: 12,
      padding: '18px 22px',
      marginBottom: 20,
      flexWrap: 'wrap',
    }}>
      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        <div style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800,
          fontSize: '2.4rem', letterSpacing: '-.05em', lineHeight: 1,
          color: config.numColor,
        }}>
          {rank}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '.68rem', fontWeight: 700, letterSpacing: '.09em',
          textTransform: 'uppercase', color: config.labelColor,
          fontFamily: "'DM Sans', sans-serif", marginBottom: 3,
        }}>
          Your Current Rank
        </div>
        <div style={{
          fontSize: '.92rem', color: config.numColor,
          fontFamily: "'DM Sans', sans-serif", fontWeight: 500, lineHeight: 1.45,
        }}>
          {config.desc}
        </div>
        {totalBids > 0 && (
          <div style={{
            fontSize: '.78rem', color: config.labelColor, opacity: .7,
            marginTop: 3, fontFamily: "'DM Sans', sans-serif",
          }}>
            {totalBids} total bid{totalBids !== 1 ? 's' : ''} submitted
          </div>
        )}
      </div>
      {config.emoji && (
        <div style={{ fontSize: '2rem', flexShrink: 0, lineHeight: 1 }}>{config.emoji}</div>
      )}
    </div>
  );
}

export default function BidStepFour({
  bid,
  currency,
  bidRank,
  canEdit,
  canUpdate,
  canWithdraw,
  updateMode,
  saving,
  bidItems,
  onSave,
  onEnterUpdateMode,
  onCancelUpdateMode,
  onOpenConfirmModal,
  onBack,
}) {
  const liveTotal = bidItems.reduce((sum, item) => {
    return sum + (parseFloat(item.unit_price) || 0) * (parseFloat(item.quantity) || 0);
  }, 0);
  const summaryTotal = liveTotal > 0 ? liveTotal : (parseFloat(bid.total_amount) || 0);

  const fmtTotal = summaryTotal > 0
    ? new Intl.NumberFormat('en-US', {
        style: 'currency', currency: bid.currency || currency,
        minimumFractionDigits: 2, maximumFractionDigits: 2,
      }).format(summaryTotal)
    : null;

  const statusMessages = {
    draft: {
      title: 'Ready to Submit?',
      desc: 'Review your bid details carefully before submitting. The buyer will be notified immediately.',
    },
    submitted: {
      title: 'Bid Submitted',
      desc: 'Your bid is visible to the buyer. You can still update or withdraw it before the deadline.',
    },
    awarded: {
      title: 'Congratulations!',
      desc: 'Your bid has been awarded. Expect to hear from the buyer about next steps.',
    },
    rejected: {
      title: 'Bid Not Selected',
      desc: 'Thank you for participating. Your bid was not selected for this contract.',
    },
  };

  const msg = statusMessages[bid.status] || statusMessages.draft;

  return (
    <>
      <style>{`
        .s4-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 20px;
        }
        .s4-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .s4-header-left { display: flex; flex-direction: column; gap: 2px; }
        .s4-tag {
          font-size: .7rem; font-weight: 700; letter-spacing: .09em;
          text-transform: uppercase; color: var(--ink-faint);
          font-family: 'DM Sans', sans-serif;
        }
        .s4-title {
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 1rem; color: var(--ink); letter-spacing: -.025em;
        }
        .s4-body { padding: 24px; }
        .s4-total-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: '18px 22px';
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .s4-total-left { display: flex; flex-direction: column; gap: 3px; }
        .s4-total-lbl {
          font-size: .68rem; font-weight: 700; letter-spacing: .09em;
          text-transform: uppercase; color: var(--ink-faint);
          font-family: 'DM Sans', sans-serif;
        }
        .s4-total-num {
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: 1.65rem; letter-spacing: -.04em; color: var(--ink);
          line-height: 1.1;
        }
        .s4-status-msg {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 10px; padding: 14px 18px; margin-bottom: 20px;
        }
        .s4-status-msg-title {
          font-family: 'Syne', sans-serif; font-weight: 700; font-size: .92rem;
          color: var(--ink); letter-spacing: -.02em; margin-bottom: 4px;
        }
        .s4-status-msg-desc {
          font-size: .845rem; color: var(--ink-soft); line-height: 1.55;
          font-family: 'DM Sans', sans-serif;
        }
        .s4-footer {
          padding: 16px 24px;
          border-top: 1px solid var(--border);
          display: flex; align-items: center;
          background: var(--surface);
        }
        .s4-btn-back {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 18px; background: transparent;
          color: var(--ink-soft); border: 1.5px solid var(--border);
          border-radius: 9px; font-family: 'DM Sans', sans-serif;
          font-size: .845rem; font-weight: 600; cursor: pointer;
          transition: all .13s;
        }
        .s4-btn-back:hover { background: var(--surface); color: var(--ink); }
        @media (max-width: 540px) {
          .s4-header, .s4-body, .s4-footer { padding: 16px; }
        }
      `}</style>

      <div className="s4-card">
        <div className="s4-header">
          <div className="s4-header-left">
            <div className="s4-tag">Step 4 of 4</div>
            <div className="s4-title">Review &amp; Submit</div>
          </div>
          <BidStatusBadge status={bid.status} />
        </div>

        <div className="s4-body">
          {/* Rank card for submitted bids */}
          {bid.status === 'submitted' && bidRank && (
            <RankCard rank={bidRank.rank} totalBids={bidRank.totalBids} />
          )}

          {/* Status context message */}
          <div className="s4-status-msg">
            <div className="s4-status-msg-title">{msg.title}</div>
            <div className="s4-status-msg-desc">{msg.desc}</div>
          </div>

          {/* Bid total */}
          {fmtTotal && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 16, background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '16px 20px', marginBottom: 20, flexWrap: 'wrap',
            }}>
              <div>
                <div className="s4-total-lbl">Your Bid Total</div>
                <div className="s4-total-num">{fmtTotal}</div>
              </div>
              {bid.currency && (
                <span style={{
                  fontSize: '.78rem', fontWeight: 600, color: 'var(--ink-faint)',
                  background: 'var(--white)', border: '1px solid var(--border)',
                  borderRadius: 6, padding: '3px 9px', fontFamily: "'DM Sans', sans-serif",
                }}>
                  {bid.currency}
                </span>
              )}
            </div>
          )}

          {/* Action buttons */}
          <BidSubmissionSection
            bid={bid}
            canEdit={canEdit}
            canUpdate={canUpdate}
            canWithdraw={canWithdraw}
            updateMode={updateMode}
            saving={saving}
            bidItems={bidItems}
            currency={currency}
            onSave={onSave}
            onEnterUpdateMode={onEnterUpdateMode}
            onCancelUpdateMode={onCancelUpdateMode}
            onOpenConfirmModal={onOpenConfirmModal}
          />
        </div>

        <div className="s4-footer">
          <button className="s4-btn-back" onClick={onBack}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M10 6.5H3M3 6.5l3-3M3 6.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
        </div>
      </div>
    </>
  );
}
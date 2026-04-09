'use client';

import BidStatusBadge from '@/components/bids/BidStatusBadge';
import BidSubmissionSection from '@/components/bids/BidSubmissionSection';

/**
 * RankCard — displays the vendor's current bid ranking.
 */
function RankCard({ rank, totalBids }) {
  if (!rank) return null;

  const isL1   = rank === 'L1';
  const isL2   = rank === 'L2';
  const isL3   = rank === 'L3';
  const tier   = isL1 ? 'l1' : isL2 ? 'l2' : isL3 ? 'l3' : 'other';
  const rankDesc = isL1
    ? 'You have the lowest bid — best position! 🎉'
    : isL2
    ? 'Second lowest bid — strong position!'
    : isL3
    ? 'Third lowest bid — in the top 3!'
    : `Your position among ${totalBids} submitted bid${totalBids !== 1 ? 's' : ''}`;

  return (
    <div className={`rank-card rank-card--${tier}`}>
      <div>
        <div className={`rank-label rank-label--${tier}`}>Your Current Rank</div>
        <div className={`rank-badge-large rank-badge-large--${tier}`}>{rank}</div>
      </div>
      <div>
        <div className="rank-desc">{rankDesc}</div>
        {totalBids > 0 && (
          <div className="rank-total">
            {totalBids} bid{totalBids !== 1 ? 's' : ''} submitted in total
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * BidStepFour — Step 4: Review & Submit
 *
 * Shows the vendor's current rank (if submitted) and the submission / update /
 * withdrawal action buttons.  Includes a Back button only.
 */
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
  return (
    <div className="bid-card">
      <div className="bid-card-header">
        <span className="section-label">Review &amp; Submit</span>
        <BidStatusBadge status={bid.status} />
      </div>

      {/* Ranking card (visible once bid is submitted) */}
      {bid.status === 'submitted' && bidRank && (
        <RankCard rank={bidRank.rank} totalBids={bidRank.totalBids} />
      )}

      <p style={{ color: 'var(--ink-soft)', fontSize: '.9rem', margin: '0 0 20px' }}>
        {bid.status === 'draft'
          ? 'Review your bid details, then submit to share your prices with the buyer.'
          : bid.status === 'submitted'
          ? 'Your bid has been submitted. You can update or withdraw it before the deadline.'
          : bid.status === 'awarded'
          ? '🎉 Congratulations! Your bid has been awarded.'
          : 'Your bid has been processed.'}
      </p>

      {/* Summary */}
      {bid.total_amount != null && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 20,
        }}>
          <div style={{
            fontSize: '.72rem', fontWeight: 600, letterSpacing: '.08em',
            textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 8,
          }}>
            Bid Total
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)' }}>
            {bid.currency || currency}{' '}
            {parseFloat(bid.total_amount).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
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

      {/* Back navigation */}
      <div style={{
        paddingTop: 20, borderTop: '1px solid var(--border)', marginTop: 20,
      }}>
        <button className="btn btn-outline" onClick={onBack}>
          ← Back
        </button>
      </div>
    </div>
  );
}

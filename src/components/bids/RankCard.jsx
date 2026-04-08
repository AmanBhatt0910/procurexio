'use client';

export default function RankCard({ rank, totalBids }) {
  if (!rank) return null;

  const isL1 = rank === 'L1';
  const isL2 = rank === 'L2';
  const isL3 = rank === 'L3';
  const tier = isL1 ? 'l1' : isL2 ? 'l2' : isL3 ? 'l3' : 'other';

  const rankDesc = isL1
    ? 'You have the lowest bid — best position! 🎉'
    : isL2
    ? 'Second lowest bid — strong position!'
    : isL3
    ? 'Third lowest bid — in the top 3!'
    : `Your position among ${totalBids} submitted bid${totalBids !== 1 ? 's' : ''}`;

  return (
    <>
      <style>{`
        .rank-card {
          border-radius: var(--radius, 10px); padding: 20px 24px;
          margin-bottom: 24px; box-shadow: var(--shadow, 0 1px 3px rgba(15,14,13,.06),0 8px 32px rgba(15,14,13,.08));
          display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
        }
        .rank-card--l1 { background: #e8f5ee; border: 1.5px solid #6ee7b7; }
        .rank-card--l2 { background: #e8edf9; border: 1.5px solid #93c5fd; }
        .rank-card--l3 { background: #f4f4f5; border: 1.5px solid #d4d4d8; }
        .rank-card--other { background: var(--white, #fff); border: 1px solid var(--border, #e4e0db); }
        .rank-badge-large {
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: 2rem; letter-spacing: -.04em; line-height: 1; flex-shrink: 0;
        }
        .rank-badge-large--l1 { color: #1a7a4a; }
        .rank-badge-large--l2 { color: #2563eb; }
        .rank-badge-large--l3 { color: #6b7280; }
        .rank-badge-large--other { color: var(--ink, #0f0e0d); }
        .rank-label {
          font-size: .72rem; font-weight: 600; letter-spacing: .08em;
          text-transform: uppercase; margin-bottom: 2px;
        }
        .rank-label--l1 { color: #1a7a4a; }
        .rank-label--l2 { color: #2563eb; }
        .rank-label--l3 { color: #6b7280; }
        .rank-label--other { color: var(--ink-soft, #6b6660); }
        .rank-desc { font-size: .88rem; color: var(--ink-soft, #6b6660); }
        .rank-total { font-size: .78rem; color: var(--ink-faint, #b8b3ae); margin-top: 2px; }
      `}</style>
      <div className={`rank-card rank-card--${tier}`}>
        <div>
          <div className={`rank-label rank-label--${tier}`}>Your Current Rank</div>
          <div className={`rank-badge-large rank-badge-large--${tier}`}>{rank}</div>
        </div>
        <div>
          <div className="rank-desc">{rankDesc}</div>
          {totalBids > 0 && (
            <div className="rank-total">{totalBids} bid{totalBids !== 1 ? 's' : ''} submitted in total</div>
          )}
        </div>
      </div>
    </>
  );
}

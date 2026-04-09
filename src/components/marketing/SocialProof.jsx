import React from 'react';

export default function SocialProof() {
  const companies = [
    'Greenfuel Energy Solutions Pvt. Ltd', 'Sugam', 'ES',
    'NI', 'PV', 'CP',
    'OL', 'SH',
  ];

  return (
    <>
      <style>{`
        .proof-strip {
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          background: var(--white);
          padding: 28px 32px;
          overflow: hidden;
        }
        .proof-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .proof-label {
          font-size: .78rem;
          font-weight: 600;
          color: var(--ink-faint);
          letter-spacing: .06em;
          text-transform: uppercase;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .proof-divider {
          width: 1px;
          height: 28px;
          background: var(--border);
          flex-shrink: 0;
        }
        .proof-scroll-track {
          overflow: hidden;
          flex: 1;
          mask-image: linear-gradient(90deg, transparent, black 8%, black 92%, transparent);
          -webkit-mask-image: linear-gradient(90deg, transparent, black 8%, black 92%, transparent);
        }
        .proof-scroll-inner {
          display: flex;
          gap: 48px;
          align-items: center;
          animation: proof-scroll 30s linear infinite;
          width: max-content;
        }
        .proof-scroll-inner:hover { animation-play-state: paused; }
        .proof-company {
          font-family: 'Syne', sans-serif;
          font-size: .88rem;
          font-weight: 700;
          color: var(--ink-faint);
          white-space: nowrap;
          letter-spacing: -.01em;
          transition: color .2s;
        }
        .proof-company:hover { color: var(--ink-soft); }
        .proof-dot {
          width: 4px; height: 4px;
          border-radius: 50%;
          background: var(--border);
          flex-shrink: 0;
        }

        @keyframes proof-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        @media (max-width: 768px) {
          .proof-strip { padding: 24px 20px; }
          .proof-inner { gap: 20px; }
        }
        @media (max-width: 600px) {
          .proof-inner { flex-direction: column; gap: 16px; align-items: flex-start; }
          .proof-divider { display: none; }
          .proof-strip { padding: 20px 16px; }
        }
      `}</style>

      <div className="proof-strip">
        <div className="proof-inner">
          <span className="proof-label">Trusted by</span>
          <div className="proof-divider" />
          <div className="proof-scroll-track">
            <div className="proof-scroll-inner">
              {[...companies, ...companies].map((c, i) => (
                <React.Fragment key={`item-${i}`}>
                  <span className="proof-company">{c}</span>
                  <div className="proof-dot" />
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
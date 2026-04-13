'use client';
// src/components/bids/BidWorkflowSteps.jsx

const STEPS = [
  {
    id: 1,
    label: 'RFQ Details',
    shortLabel: 'Details',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="2" y="1.5" width="10" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M4.5 5h5M4.5 7.5h5M4.5 10h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 2,
    label: 'Enter Pricing',
    shortLabel: 'Pricing',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M7 4v.8M7 9.2V10M5.5 8.2c0 .66.67 1 1.5 1s1.5-.34 1.5-1S8 7.5 7 7.5 5.5 7.16 5.5 6.5 6 5.8 7 5.8s1.5.34 1.5.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 3,
    label: 'Attachments',
    shortLabel: 'Extras',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M11.5 6.5L6.5 11.5a3.182 3.182 0 0 1-4.5-4.5l5-5a2.12 2.12 0 0 1 3 3L5 10a1.06 1.06 0 1 1-1.5-1.5L8 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 4,
    label: 'Submit',
    shortLabel: 'Submit',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

export default function BidWorkflowSteps({ currentStep = 1, isLocked = false }) {
  return (
    <>
      <style>{`
        .bwf-wrap {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 20px 28px;
          margin-bottom: 24px;
          overflow-x: auto;
        }
        .bwf-inner {
          display: flex;
          align-items: flex-start;
          min-width: 320px;
          position: relative;
        }
        .bwf-track {
          position: absolute;
          top: 17px;
          left: 17px;
          right: 17px;
          height: 2px;
          background: var(--border);
          z-index: 0;
          border-radius: 2px;
        }
        .bwf-track-fill {
          height: 100%;
          background: var(--accent);
          border-radius: 2px;
          transition: width .35s ease;
        }
        .bwf-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          position: relative;
          z-index: 1;
          cursor: default;
        }
        .bwf-dot {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--border);
          background: var(--white);
          transition: all .2s ease;
          position: relative;
          z-index: 2;
        }
        .bwf-dot--done {
          border-color: #639922;
          background: #EAF3DE;
          color: #3B6D11;
        }
        .bwf-dot--active {
          border-color: var(--accent);
          background: var(--accent);
          color: #fff;
          box-shadow: 0 0 0 4px rgba(200,80,26,.12);
        }
        .bwf-dot--idle {
          border-color: var(--border);
          background: var(--white);
          color: var(--ink-faint);
        }
        .bwf-dot--locked {
          opacity: .4;
        }
        .bwf-check {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3B6D11;
        }
        .bwf-label {
          margin-top: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: .73rem;
          font-weight: 600;
          text-align: center;
          letter-spacing: .01em;
          transition: color .2s;
          white-space: nowrap;
        }
        .bwf-label--done   { color: #3B6D11; }
        .bwf-label--active { color: var(--accent); }
        .bwf-label--idle   { color: var(--ink-faint); }
        @media (max-width: 480px) {
          .bwf-wrap { padding: 16px 20px; }
          .bwf-label { font-size: .66rem; }
        }
      `}</style>

      <nav className="bwf-wrap" aria-label="Bid progress">
        <div className="bwf-inner">
          {/* Background track */}
          <div className="bwf-track">
            <div
              className="bwf-track-fill"
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            />
          </div>

          {STEPS.map((step) => {
            const done    = step.id < currentStep;
            const active  = step.id === currentStep;
            const locked  = isLocked && step.id > currentStep;
            const dotCls  = `bwf-dot${done ? ' bwf-dot--done' : active ? ' bwf-dot--active' : ' bwf-dot--idle'}${locked ? ' bwf-dot--locked' : ''}`;
            const lblCls  = `bwf-label${done ? ' bwf-label--done' : active ? ' bwf-label--active' : ' bwf-label--idle'}`;

            return (
              <div key={step.id} className="bwf-step" aria-current={active ? 'step' : undefined}>
                <div className={dotCls}>
                  {done ? (
                    <span className="bwf-check">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M2.5 6.5l3 3 5-5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  ) : step.icon}
                </div>
                <span className={lblCls}>{step.shortLabel}</span>
              </div>
            );
          })}
        </div>
      </nav>
    </>
  );
}
'use client';

const STEPS = [
  { id: 1, label: 'RFQ Details',          shortLabel: 'Details',  icon: '📋' },
  { id: 2, label: 'Enter Pricing',         shortLabel: 'Pricing',  icon: '💰' },
  { id: 3, label: 'Review & Attachments',  shortLabel: 'Review',   icon: '📎' },
  { id: 4, label: 'Submit',                shortLabel: 'Submit',   icon: '✅' },
];

/**
 * BidWorkflowSteps — horizontal step indicator for the vendor bid workspace.
 *
 * Props:
 *   currentStep {number} — 1-based active step index (1..4)
 *   isLocked    {bool}   — RFQ closed / past deadline; greys out future steps
 */
export default function BidWorkflowSteps({ currentStep = 1, isLocked = false }) {
  return (
    <>
      <style>{`
        .workflow-steps {
          display: flex;
          align-items: center;
          background: var(--white, #fff);
          border: 1px solid var(--border, #e4e0db);
          border-radius: var(--radius, 10px);
          padding: 16px 24px;
          margin-bottom: 24px;
          box-shadow: var(--shadow, 0 1px 3px rgba(15,14,13,.06));
          gap: 0;
          overflow-x: auto;
        }
        .wf-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          min-width: 72px;
          position: relative;
        }
        .wf-step:not(:last-child)::after {
          content: '';
          position: absolute;
          top: 16px;
          left: calc(50% + 16px);
          right: calc(-50% + 16px);
          height: 2px;
          background: var(--border, #e4e0db);
          z-index: 0;
        }
        .wf-step.completed:not(:last-child)::after {
          background: #6ee7b7;
        }
        .wf-icon-wrap {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: .85rem;
          border: 2px solid var(--border, #e4e0db);
          background: var(--surface, #faf9f7);
          position: relative;
          z-index: 1;
          transition: border-color .15s, background .15s;
        }
        .wf-step.completed .wf-icon-wrap {
          border-color: #6ee7b7;
          background: #e8f5ee;
        }
        .wf-step.active .wf-icon-wrap {
          border-color: var(--accent, #c8501a);
          background: #fdf0eb;
        }
        .wf-step-label {
          margin-top: 6px;
          font-size: .72rem;
          font-weight: 600;
          text-align: center;
          color: var(--ink-faint, #b8b3ae);
          letter-spacing: .02em;
          white-space: nowrap;
        }
        .wf-step.completed .wf-step-label { color: #1a7a4a; }
        .wf-step.active .wf-step-label    { color: var(--accent, #c8501a); }
        @media (max-width: 480px) {
          .wf-step-label { font-size: .66rem; }
          .workflow-steps { padding: 12px 16px; }
        }
      `}</style>

      <nav className="workflow-steps" aria-label="Bid workflow steps">
        {STEPS.map(step => {
          const completed = step.id < currentStep;
          const active    = step.id === currentStep;
          const locked    = isLocked && step.id > currentStep;

          let cls = 'wf-step';
          if (completed) cls += ' completed';
          else if (active) cls += ' active';

          return (
            <div
              key={step.id}
              className={cls}
              aria-current={active ? 'step' : undefined}
              style={{ opacity: locked ? 0.4 : 1 }}
            >
              <div className="wf-icon-wrap">
                {completed ? '✓' : step.icon}
              </div>
              <span className="wf-step-label">
                <span className="step-short">{step.shortLabel}</span>
              </span>
            </div>
          );
        })}
      </nav>
    </>
  );
}

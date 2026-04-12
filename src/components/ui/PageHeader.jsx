// src/components/ui/PageHeader.jsx

export default function PageHeader({ title, subtitle, action }) {
  return (
    <>
      <style>{`
        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .page-header-left {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .page-header-eyebrow {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 2px;
        }
        .page-header-eyebrow-line {
          width: 18px;
          height: 2px;
          background: var(--accent);
          border-radius: 2px;
          display: inline-block;
        }
        .page-header-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1.55rem;
          color: var(--ink);
          letter-spacing: -.04em;
          line-height: 1.15;
          margin: 0;
        }
        .page-header-subtitle {
          font-family: 'DM Sans', sans-serif;
          font-size: .845rem;
          color: var(--ink-soft);
          margin: 0;
          line-height: 1.5;
        }
        @media (max-width: 540px) {
          .page-header { flex-direction: column; align-items: flex-start; gap: 14px; margin-bottom: 24px; }
          .page-header-title { font-size: 1.3rem; }
        }
      `}</style>

      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-eyebrow">
            <span className="page-header-eyebrow-line" />
          </div>
          <h1 className="page-header-title">{title}</h1>
          {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </div>
        {action && (
          typeof action === 'object' && action.label
            ? (
              <button
                className="page-header-action"
                onClick={action.onClick}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '10px 18px', background: 'var(--ink)', color: '#fff',
                  border: 'none', borderRadius: 9, fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600, fontSize: '.845rem', cursor: 'pointer', whiteSpace: 'nowrap',
                  letterSpacing: '-.01em', transition: 'opacity .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                {action.label}
              </button>
            )
            : <div style={{ flexShrink: 0 }}>{action}</div>
        )}
      </div>
    </>
  );
}
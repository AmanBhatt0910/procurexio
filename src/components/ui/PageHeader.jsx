// src/components/ui/PageHeader.jsx

export default function PageHeader({ title, subtitle, action }) {
  return (
    <>
      <style>{`
        .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 28px;
          gap: 16px;
        }
        .page-header-text {}
        .page-header-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1.35rem;
          color: var(--ink);
          letter-spacing: -.03em;
          line-height: 1.2;
        }
        .page-header-subtitle {
          font-family: 'DM Sans', sans-serif;
          font-size: .855rem;
          color: var(--ink-soft);
          margin-top: 4px;
        }
        .page-header-action {
          padding: 8px 18px;
          background: var(--ink);
          color: var(--white);
          border: none;
          border-radius: var(--radius);
          font-family: 'DM Sans', sans-serif;
          font-size: .84rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .page-header-action:hover { opacity: .85; }
      `}</style>

      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">{title}</h1>
          {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </div>
        {action && (
          typeof action === 'object' && action.label
            ? <button className="page-header-action" onClick={action.onClick}>{action.label}</button>
            : <div>{action}</div>
        )}
      </div>
    </>
  );
}
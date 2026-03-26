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
      `}</style>

      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-header-title">{title}</h1>
          {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </>
  );
}
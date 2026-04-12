// src/components/ui/DataTable.jsx

export default function DataTable({ columns, rows, loading, emptyMessage = 'No data found.', onRowClick, rowClassName }) {
  return (
    <>
      <style>{`
        .dt-wrapper {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
        }
        .dt-scroll {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .dt-table {
          width: 100%;
          border-collapse: collapse;
          font-family: 'DM Sans', sans-serif;
          font-size: .855rem;
        }
        .dt-thead tr {
          border-bottom: 1px solid var(--border);
        }
        .dt-th {
          padding: 12px 16px;
          text-align: left;
          font-size: .695rem;
          font-weight: 600;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--ink-faint);
          white-space: nowrap;
          background: var(--surface);
        }
        .dt-th:first-child { padding-left: 20px; }
        .dt-th:last-child  { padding-right: 20px; }
        .dt-td {
          padding: 13px 16px;
          color: var(--ink);
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }
        .dt-td:first-child { padding-left: 20px; }
        .dt-td:last-child  { padding-right: 20px; }
        .dt-tr:last-child .dt-td { border-bottom: none; }
        .dt-tr-clickable { cursor: pointer; transition: background .12s; }
        .dt-tr-clickable:hover .dt-td { background: var(--surface); }
        .dt-empty {
          padding: 64px 16px;
          text-align: center;
          color: var(--ink-faint);
          font-size: .875rem;
        }
        .dt-empty-icon {
          display: block;
          margin: 0 auto 12px;
          width: 36px;
          height: 36px;
          opacity: .3;
        }
        .dt-loading {
          padding: 64px 16px;
          text-align: center;
        }
        .dt-spinner {
          width: 22px;
          height: 22px;
          border: 2px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: dtSpin .65s linear infinite;
          display: inline-block;
        }
        @keyframes dtSpin { to { transform: rotate(360deg); } }
        .dt-skeleton-row .dt-td { padding-top: 14px; padding-bottom: 14px; }
        .dt-skeleton-cell {
          height: 14px;
          border-radius: 6px;
          background: var(--border);
          animation: dtPulse 1.4s ease-in-out infinite;
        }
        @keyframes dtPulse { 0%,100%{opacity:1} 50%{opacity:.45} }
        @media (max-width: 640px) {
          .dt-th { padding: 10px 12px; font-size: .66rem; }
          .dt-td { padding: 12px 12px; font-size: .82rem; }
          .dt-th:first-child, .dt-td:first-child { padding-left: 14px; }
          .dt-th:last-child,  .dt-td:last-child  { padding-right: 14px; }
        }
      `}</style>

      <div className="dt-wrapper">
        <div className="dt-scroll">
          <table className="dt-table">
            <thead className="dt-thead">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="dt-th" style={col.width ? { width: col.width } : {}}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="dt-skeleton-row">
                    {columns.map((col) => (
                      <td key={col.key} className="dt-td">
                        <div className="dt-skeleton-cell" style={{ width: `${55 + (i * 13 + col.key.length * 7) % 35}%`, opacity: 1 - i * 0.12 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="dt-empty">
                    <svg className="dt-empty-icon" viewBox="0 0 36 36" fill="none">
                      <rect x="6" y="6" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M12 14h12M12 18h8M12 22h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr
                    key={row.id ?? i}
                    className={`dt-tr${onRowClick ? ' dt-tr-clickable' : ''}${rowClassName ? ` ${rowClassName}` : ''}`}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="dt-td">
                        {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
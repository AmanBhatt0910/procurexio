// src/components/ui/DataTable.jsx

export default function DataTable({ columns, rows, loading, emptyMessage = 'No data found.' }) {
  return (
    <>
      <style>{`
        .dt-wrapper {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
        }
        .dt-scroll { overflow-x: auto; }
        .dt-table {
          width: 100%;
          border-collapse: collapse;
          font-family: 'DM Sans', sans-serif;
          font-size: .855rem;
        }
        .dt-thead tr {
          background: var(--surface);
          border-bottom: 1px solid var(--border);
        }
        .dt-th {
          padding: 11px 16px;
          text-align: left;
          font-size: .71rem;
          font-weight: 600;
          letter-spacing: .07em;
          text-transform: uppercase;
          color: var(--ink-faint);
          white-space: nowrap;
        }
        .dt-td {
          padding: 13px 16px;
          color: var(--ink);
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }
        .dt-tr:last-child .dt-td { border-bottom: none; }
        .dt-tr:hover .dt-td { background: var(--surface); }
        .dt-empty {
          padding: 48px 16px;
          text-align: center;
          color: var(--ink-faint);
          font-size: .875rem;
        }
        .dt-loading {
          padding: 48px 16px;
          text-align: center;
        }
        .dt-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin .7s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
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
                <tr>
                  <td colSpan={columns.length} className="dt-loading">
                    <div className="dt-spinner" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="dt-empty">{emptyMessage}</td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={row.id ?? i} className="dt-tr">
                    {columns.map((col) => (
                      <td key={col.key} className="dt-td">
                        {col.render ? col.render(row) : row[col.key] ?? '—'}
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
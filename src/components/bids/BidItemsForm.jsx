'use client';

// BidItemsForm — table of rfq_items with editable unit_price + notes per row
// Props:
//   rfqItems       : [{ id, description, quantity, unit, target_price }]
//   bidItems       : [{ rfq_item_id, unit_price, quantity, notes }]
//   onChange(items): called with updated items array on any cell change
//   readOnly       : bool — if true, no inputs rendered (employee view)

import { useEffect, useState } from 'react';

function fmt(val) {
  const n = parseFloat(val);
  return isNaN(n) ? '—' : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function BidItemsForm({ rfqItems = [], bidItems = [], onChange, readOnly = false }) {
  // Derive initial rows from props
  const initialRows = useMemo(() => {
    const map = {};
    for (const bi of bidItems) {
      map[bi.rfq_item_id] = bi;
    }
    return rfqItems.map(item => ({
      rfq_item_id: item.id,
      description: item.description,
      rfq_quantity: item.quantity,
      unit: item.unit,
      target_price: item.target_price,
      unit_price: map[item.id]?.unit_price ?? '',
      quantity: map[item.id]?.quantity ?? item.quantity,
      notes: map[item.id]?.notes ?? '',
    }));
  }, [rfqItems, bidItems]);

  const [rows, setRows] = useState(initialRows);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

    function updateRow(idx, field, value) {
        const next = rows.map((r, i) => i === idx ? { ...r, [field]: value } : r);
        setRows(next);
        onChange?.(next.map(r => ({
        rfq_item_id: r.rfq_item_id,
        unit_price: parseFloat(r.unit_price) || 0,
        quantity: parseFloat(r.quantity) || 0,
        notes: r.notes,
        })));
    }

  const total = rows.reduce((sum, r) => {
    const p = parseFloat(r.unit_price) || 0;
    const q = parseFloat(r.quantity) || 0;
    return sum + p * q;
  }, 0);

  return (
    <>
      <style>{`
        .bif-wrap { width: 100%; overflow-x: auto; }
        .bif-table { width: 100%; border-collapse: collapse; font-family: 'DM Sans', sans-serif; font-size: .875rem; }
        .bif-table th {
          font-size: .69rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
          color: var(--ink-faint); padding: 8px 12px; text-align: left;
          border-bottom: 1px solid var(--border); white-space: nowrap;
        }
        .bif-table td {
          padding: 10px 12px; border-bottom: 1px solid var(--border); vertical-align: middle;
          color: var(--ink);
        }
        .bif-table tr:last-child td { border-bottom: none; }
        .bif-table tr:hover td { background: #faf9f7; }
        .bif-input {
          width: 100%; padding: 6px 8px; border: 1px solid var(--border); border-radius: 6px;
          font-size: .875rem; font-family: 'DM Sans', sans-serif; color: var(--ink);
          background: var(--white); outline: none; transition: border-color .15s;
          min-width: 90px;
        }
        .bif-input:focus { border-color: var(--accent); }
        .bif-total-row td {
          border-top: 2px solid var(--border); font-weight: 600;
          background: #f7f6f4; border-bottom: none !important;
        }
        .bif-target { font-size: .78rem; color: var(--ink-faint); margin-top: 2px; }
        .bif-computed { font-weight: 500; }
      `}</style>

      <div className="bif-wrap">
        <table className="bif-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th>RFQ Qty</th>
              <th>Unit</th>
              {!readOnly && <th>Target Price</th>}
              <th>Your Unit Price</th>
              <th>Your Qty</th>
              <th>Line Total</th>
              {!readOnly && <th>Notes</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const lineTotal = (parseFloat(row.unit_price) || 0) * (parseFloat(row.quantity) || 0);
              return (
                <tr key={row.rfq_item_id}>
                  <td style={{ color: 'var(--ink-faint)', width: 32 }}>{idx + 1}</td>
                  <td style={{ maxWidth: 240 }}>{row.description}</td>
                  <td>{fmt(row.rfq_quantity)}</td>
                  <td>{row.unit || '—'}</td>
                  {!readOnly && (
                    <td>
                      <span>{row.target_price ? fmt(row.target_price) : '—'}</span>
                    </td>
                  )}
                  <td>
                    {readOnly ? (
                      <span className="bif-computed">{fmt(row.unit_price)}</span>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="bif-input"
                        value={row.unit_price}
                        placeholder="0.00"
                        onChange={e => updateRow(idx, 'unit_price', e.target.value)}
                      />
                    )}
                  </td>
                  <td>
                    {readOnly ? (
                      <span>{fmt(row.quantity)}</span>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="bif-input"
                        value={row.quantity}
                        onChange={e => updateRow(idx, 'quantity', e.target.value)}
                      />
                    )}
                  </td>
                  <td className="bif-computed">{fmt(lineTotal)}</td>
                  {!readOnly && (
                    <td>
                      <input
                        type="text"
                        className="bif-input"
                        style={{ minWidth: 140 }}
                        value={row.notes}
                        placeholder="Optional notes…"
                        onChange={e => updateRow(idx, 'notes', e.target.value)}
                      />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bif-total-row">
              <td colSpan={readOnly ? 6 : 7} style={{ textAlign: 'right', paddingRight: 16 }}>
                Total Bid Amount
              </td>
              <td className="bif-computed" style={{ fontSize: '1rem' }}>
                {fmt(total)}
              </td>
              {!readOnly && <td />}
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
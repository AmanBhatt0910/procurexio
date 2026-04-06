// src/components/bids/BidItemsForm

'use client';
import { useReducer, useEffect } from 'react';

const GST_OPTIONS = [0, 7, 18];

function rowsReducer(state, action) {
  switch (action.type) {
    case 'RESET':
      return action.payload;
    case 'UPDATE':
      return state.map((row, idx) =>
        idx === action.index ? { ...row, [action.field]: action.value } : row
      );
    default:
      return state;
  }
}

function computeRows(rfqItems, initialItems) {
  return rfqItems.map(item => {
    const existing = initialItems.find(i => i.rfq_item_id === item.id);
    return {
      rfq_item_id:  item.id,
      description:  item.description,
      quantity:     item.quantity,
      unit:         item.unit,
      target_price: item.target_price,
      unit_price:   existing ? existing.unit_price : '',
      bid_quantity: existing ? existing.quantity : item.quantity,
      notes:        existing ? existing.notes : '',
    };
  });
}

export default function BidItemsForm({ rfqItems = [], initialItems = [], gst = 0, onChange, readOnly = false }) {
  const [rows, dispatch] = useReducer(rowsReducer, null, () =>
    computeRows(rfqItems, initialItems)
  );

  useEffect(() => {
    dispatch({ type: 'RESET', payload: computeRows(rfqItems, initialItems) });
  }, [rfqItems, initialItems]);

  const update = (idx, field, value) => {
    dispatch({ type: 'UPDATE', index: idx, field, value });
    if (onChange) {
      const updatedRows = rows.map((r, i) =>
        i === idx ? { ...r, [field]: value } : r
      );
      onChange(
        updatedRows.map(r => ({
          rfq_item_id: r.rfq_item_id,
          unit_price:  parseFloat(r.unit_price) || 0,
          quantity:    parseFloat(r.bid_quantity) || 0,
          notes:       r.notes || '',
        }))
      );
    }
  };

  const subtotal = rows.reduce((sum, r) => {
    const up  = parseFloat(r.unit_price) || 0;
    const qty = parseFloat(r.bid_quantity) || 0;
    return sum + up * qty;
  }, 0);

  const gstAmount  = subtotal * (gst / 100);
  const totalBid   = subtotal + gstAmount;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Syne:wght@600;700&display=swap');
        .bid-items-table { width: 100%; border-collapse: collapse; font-family: 'DM Sans', sans-serif; }
        .bid-items-table th {
          font-size: .72rem; font-weight: 600; letter-spacing: .08em;
          text-transform: uppercase; color: var(--ink-faint, #b8b3ae);
          padding: 10px 12px; text-align: left;
          border-bottom: 1px solid var(--border, #e4e0db);
          background: #faf9f7;
        }
        .bid-items-table th.right { text-align: right; }
        .bid-items-table td {
          padding: 12px; border-bottom: 1px solid var(--border, #e4e0db);
          vertical-align: middle; color: var(--ink, #0f0e0d); font-size: .88rem;
        }
        .bid-items-table tr:last-child td { border-bottom: none; }
        .bid-items-table tr:hover td { background: #faf9f7; }
        .bid-input {
          width: 100%; padding: 7px 10px;
          border: 1px solid var(--border, #e4e0db); border-radius: 6px;
          font-size: .88rem; font-family: 'DM Sans', sans-serif;
          color: var(--ink, #0f0e0d); background: #fff;
          outline: none; transition: border-color .15s;
          box-sizing: border-box;
        }
        .bid-input:focus { border-color: var(--accent, #c8501a); }
        .bid-input:disabled { background: #f5f4f2; color: var(--ink-soft, #6b6660); cursor: not-allowed; }
        .target-chip {
          display: inline-block; padding: 2px 8px; border-radius: 4px;
          background: #fdf0eb; color: var(--accent, #c8501a);
          font-size: .75rem; font-weight: 500;
        }
        .total-row td {
          font-weight: 600; background: #faf9f7;
          border-top: 2px solid var(--border, #e4e0db) !important;
          border-bottom: none !important;
        }
        .subtotal-row td {
          background: #faf9f7;
          border-top: 1px solid var(--border, #e4e0db) !important;
          border-bottom: none !important;
        }
        .price-cell { text-align: right; font-variant-numeric: tabular-nums; }
        .diff-low { color: #1a7a4a; font-size: .75rem; }
        .diff-high { color: var(--accent, #c8501a); font-size: .75rem; }
        .gst-badge {
          display: inline-flex; align-items: center;
          padding: 2px 8px; border-radius: 4px;
          background: #eff6ff; color: #1d4ed8;
          font-size: .75rem; font-weight: 500; white-space: nowrap;
        }
      `}</style>

      <div style={{ overflowX: 'auto', border: '1px solid var(--border, #e4e0db)', borderRadius: 'var(--radius, 10px)', background: '#fff' }}>
        <table className="bid-items-table">
          <thead>
            <tr>
              <th style={{ width: '32px' }}>#</th>
              <th>Item Description</th>
              <th style={{ width: '90px' }}>Qty</th>
              <th style={{ width: '80px' }}>Unit</th>
              <th style={{ width: '130px' }}>Target Price</th>
              <th style={{ width: '140px' }}>Your Unit Price</th>
              <th style={{ width: '130px' }} className="right">Line Total</th>
              {!readOnly && <th style={{ width: '180px' }}>Notes</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const lineTotal = (parseFloat(row.unit_price) || 0) * (parseFloat(row.bid_quantity) || 0);
              const hasTarget = row.target_price != null && row.target_price > 0;
              const diff = hasTarget && row.unit_price !== ''
                ? parseFloat(row.unit_price) - parseFloat(row.target_price)
                : null;

              return (
                <tr key={row.rfq_item_id}>
                  <td style={{ color: 'var(--ink-faint, #b8b3ae)', fontSize: '.8rem' }}>{idx + 1}</td>
                  <td>
                    <span style={{ fontWeight: 500 }}>{row.description}</span>
                  </td>
                  <td>
                    {readOnly ? (
                      <span>{row.bid_quantity}</span>
                    ) : (
                      <input
                        className="bid-input"
                        type="number" min="0" step="0.01"
                        value={row.bid_quantity ?? ''}
                        onChange={e => update(idx, 'bid_quantity', e.target.value)}
                      />
                    )}
                  </td>
                  <td style={{ color: 'var(--ink-soft, #6b6660)', fontSize: '.83rem' }}>
                    {row.unit || '—'}
                  </td>
                  <td>
                    {hasTarget ? (
                      <span className="target-chip">
                        {parseFloat(row.target_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--ink-faint, #b8b3ae)', fontSize: '.83rem' }}>—</span>
                    )}
                  </td>
                  <td>
                    {readOnly ? (
                      <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                        {parseFloat(row.unit_price || 0).toFixed(2)}
                      </span>
                    ) : (
                      <div>
                        <input
                          className="bid-input"
                          type="number" min="0" step="0.01" placeholder="0.00"
                          value={row.unit_price ?? ''}
                          onChange={e => update(idx, 'unit_price', e.target.value)}
                        />
                        {diff !== null && (
                          <div className={diff < 0 ? 'diff-low' : 'diff-high'} style={{ marginTop: 2 }}>
                            {diff < 0 ? '▼' : '▲'} {Math.abs(diff).toFixed(2)} vs target
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="price-cell" style={{ fontWeight: 500 }}>
                    {lineTotal > 0
                      ? lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : '—'}
                  </td>
                  {!readOnly && (
                    <td>
                      <input
                        className="bid-input"
                        type="text" placeholder="Optional note…"
                        value={row.notes ?? ''}
                        onChange={e => update(idx, 'notes', e.target.value)}
                      />
                    </td>
                  )}
                </tr>
              );
            })}
            {/* Subtotal row */}
            <tr className="subtotal-row">
              <td colSpan={readOnly ? 5 : 5} />
              <td style={{ color: 'var(--ink-soft)', fontSize: '.8rem', textAlign: 'right' }}>SUBTOTAL</td>
              <td className="price-cell" style={{ fontSize: '.95rem', color: 'var(--ink-soft)' }}>
                {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              {!readOnly && <td />}
            </tr>
            {gst > 0 && (
              <tr className="subtotal-row">
                <td colSpan={readOnly ? 5 : 5} />
                <td style={{ textAlign: 'right' }}>
                  <span className="gst-badge">GST {gst}%</span>
                </td>
                <td className="price-cell" style={{ fontSize: '.95rem', color: '#1d4ed8' }}>
                  +{gstAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                {!readOnly && <td />}
              </tr>
            )}
            {/* Total row */}
            <tr className="total-row">
              <td colSpan={readOnly ? 5 : 5} />
              <td style={{ color: 'var(--ink-soft)', fontSize: '.8rem', textAlign: 'right' }}>TOTAL BID</td>
              <td className="price-cell" style={{ fontSize: '1rem', color: 'var(--ink)' }}>
                {totalBid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              {!readOnly && <td />}
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

'use client';

// BidComparisonTable
// Props:
//   items : [{ id, description, quantity, unit, target_price, sort_order }]
//   bids  : [{ bidId, vendorId, vendorName, status, totalAmount, currency, submittedAt, itemPrices }]
//           itemPrices keyed as "rfqItemId_<id>"

import BidStatusBadge from './BidStatusBadge';

function fmt(val, currency = 'USD') {
  const n = parseFloat(val);
  if (isNaN(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function findLowest(bids, itemId) {
  let lowest = Infinity;
  for (const b of bids) {
    if (b.status !== 'submitted') continue;
    const v = b.itemPrices?.[`rfqItemId_${itemId}`]?.unitPrice;
    if (v != null && parseFloat(v) < lowest) lowest = parseFloat(v);
  }
  return lowest === Infinity ? null : lowest;
}

export default function BidComparisonTable({ items = [], bids = [] }) {
  const submittedBids = bids.filter(b => b.status === 'submitted');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Syne:wght@400;600;700&display=swap');

        .bct-outer { width: 100%; overflow-x: auto; }
        .bct-table {
          width: 100%; border-collapse: collapse;
          font-family: 'DM Sans', sans-serif; font-size: .875rem;
        }
        .bct-table th {
          font-size: .69rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
          color: var(--ink-faint); padding: 10px 14px; text-align: left;
          border-bottom: 2px solid var(--border); white-space: nowrap; background: var(--surface);
        }
        .bct-table th.vendor-col {
          text-align: center; min-width: 140px;
        }
        .bct-table td {
          padding: 10px 14px; border-bottom: 1px solid var(--border); vertical-align: middle;
          color: var(--ink);
        }
        .bct-table tr:hover td { background: #faf9f7; }

        .bct-vendor-header {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
        }
        .bct-vendor-name {
          font-family: 'Syne', sans-serif; font-size: .82rem; font-weight: 600;
          color: var(--ink);
        }
        .bct-vendor-total {
          font-size: .78rem; color: var(--ink-soft); font-weight: 400;
        }
        .bct-price-cell {
          text-align: center; font-weight: 500; letter-spacing: -.01em;
        }
        .bct-price-cell.lowest {
          color: var(--accent);
          font-weight: 700;
          position: relative;
        }
        .bct-price-cell.lowest::after {
          content: '★';
          font-size: .6rem;
          margin-left: 3px;
          vertical-align: super;
          color: var(--accent);
        }
        .bct-price-cell.no-bid {
          color: var(--ink-faint); font-style: italic; font-size: .8rem;
        }
        .bct-item-desc { font-weight: 500; max-width: 220px; }
        .bct-item-meta { font-size: .76rem; color: var(--ink-faint); margin-top: 1px; }
        .bct-total-row td {
          border-top: 2px solid var(--border); font-weight: 700;
          background: #f7f6f4 !important; border-bottom: none !important;
        }
        .bct-total-row td.lowest { color: var(--accent); }
        .bct-empty {
          text-align: center; padding: 40px; color: var(--ink-faint);
          font-style: italic; font-size: .9rem;
        }
      `}</style>

      {submittedBids.length === 0 ? (
        <div className="bct-empty">No submitted bids yet for this RFQ.</div>
      ) : (
        <div className="bct-outer">
          <table className="bct-table">
            <thead>
              <tr>
                <th style={{ minWidth: 200 }}>Line Item</th>
                <th>Qty / Unit</th>
                <th>Target Price</th>
                {submittedBids.map(bid => (
                  <th key={bid.bidId} className="vendor-col">
                    <div className="bct-vendor-header">
                      <span className="bct-vendor-name">{bid.vendorName}</span>
                      <BidStatusBadge status={bid.status} />
                      <span className="bct-vendor-total">
                        Total: {fmt(bid.totalAmount)} {bid.currency}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const lowestPrice = findLowest(submittedBids, item.id);
                return (
                  <tr key={item.id}>
                    <td>
                      <div className="bct-item-desc">{item.description}</div>
                    </td>
                    <td>
                      <div className="bct-item-meta">{item.quantity} {item.unit || ''}</div>
                    </td>
                    <td>
                      {item.target_price ? fmt(item.target_price) : <span style={{ color: 'var(--ink-faint)' }}>—</span>}
                    </td>
                    {submittedBids.map(bid => {
                      const priceData = bid.itemPrices?.[`rfqItemId_${item.id}`];
                      const unitPrice = priceData?.unitPrice;
                      const isLowest = lowestPrice != null && parseFloat(unitPrice) === lowestPrice;
                      return (
                        <td key={bid.bidId} className={`bct-price-cell${isLowest ? ' lowest' : ''}`}>
                          {unitPrice != null ? (
                            <div>
                              <div>{fmt(unitPrice)}</div>
                              {priceData?.notes && (
                                <div style={{ fontSize: '.72rem', color: 'var(--ink-faint)', fontWeight: 400, marginTop: 2 }}>
                                  {priceData.notes}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="no-bid">Not quoted</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bct-total-row">
                <td colSpan={3}>Grand Total</td>
                {submittedBids.map(bid => {
                  const minTotal = Math.min(...submittedBids.map(b => parseFloat(b.totalAmount) || 0));
                  const isLowest = parseFloat(bid.totalAmount) === minTotal;
                  return (
                    <td key={bid.bidId} className={`bct-price-cell${isLowest ? ' lowest' : ''}`} style={{ fontSize: '1rem' }}>
                      {fmt(bid.totalAmount)} {bid.currency}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </>
  );
}
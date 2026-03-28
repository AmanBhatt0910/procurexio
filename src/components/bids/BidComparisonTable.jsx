// src/components/bids/BidComparisonTable

'use client';

export default function BidComparisonTable({ rfqItems = [], bids = [], currency = 'USD' }) {
  // Only show submitted bids in comparison
  const submittedBids = bids.filter(b => b.status === 'submitted');

  const fmtPrice = (val) =>
    val != null
      ? parseFloat(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '—';

  // Find lowest unit price per rfq_item across all submitted bids
  const lowestByItem = {};
  rfqItems.forEach(item => {
    const prices = submittedBids
      .map(b => b.itemPrices?.[item.id]?.unitPrice)
      .filter(p => p != null && p > 0);
    lowestByItem[item.id] = prices.length ? Math.min(...prices) : null;
  });

  // Find lowest total
  const totals = submittedBids.map(b => b.totalAmount).filter(t => t > 0);
  const lowestTotal = totals.length ? Math.min(...totals) : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Syne:wght@600;700&display=swap');
        :root {
          --ink: #0f0e0d; --ink-soft: #6b6660; --ink-faint: #b8b3ae;
          --surface: #faf9f7; --white: #ffffff; --accent: #c8501a;
          --border: #e4e0db; --radius: 10px;
        }
        .cmp-wrap { overflow-x: auto; }
        .cmp-table {
          width: 100%; border-collapse: collapse;
          font-family: 'DM Sans', sans-serif; font-size: .88rem;
          min-width: 600px;
        }
        .cmp-table th {
          padding: 12px 16px; text-align: center;
          font-size: .72rem; font-weight: 600; letter-spacing: .08em;
          text-transform: uppercase; color: var(--ink-faint);
          border-bottom: 1px solid var(--border);
          background: var(--surface);
          white-space: nowrap;
        }
        .cmp-table th.item-col { text-align: left; min-width: 220px; }
        .cmp-table td {
          padding: 13px 16px; border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }
        .cmp-table tbody tr:hover td { background: #fdf8f5; }
        .cmp-table tbody tr:last-child td { border-bottom: none; }
        .item-name { font-weight: 500; color: var(--ink); }
        .item-meta { font-size: .78rem; color: var(--ink-soft); margin-top: 2px; }
        .price-cell { text-align: center; font-variant-numeric: tabular-nums; }
        .price-best {
          color: #1a7a4a; font-weight: 700;
          background: #e8f5ee; border-radius: 6px;
          padding: 3px 10px; display: inline-block;
        }
        .price-normal { color: var(--ink); font-weight: 500; }
        .price-empty { color: var(--ink-faint); }
        .total-row td {
          font-weight: 600; background: var(--surface);
          border-top: 2px solid var(--border);
        }
        .total-best {
          color: var(--accent); font-weight: 700; font-size: 1rem;
        }
        .vendor-header {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
        }
        .vendor-name { color: var(--ink); font-size: .85rem; font-weight: 600; text-transform: none; letter-spacing: 0; }
        .submitted-badge {
          display: inline-block; padding: 2px 8px; border-radius: 10px;
          background: #e8f5ee; color: #1a7a4a;
          font-size: .68rem; font-weight: 600; letter-spacing: .04em;
        }
        .no-bids {
          text-align: center; padding: 48px 24px;
          color: var(--ink-soft); font-size: .9rem;
        }
        .diff-note { font-size: .72rem; color: var(--ink-faint); margin-top: 2px; display: block; }
      `}</style>

      {submittedBids.length === 0 ? (
        <div className="no-bids">
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>📭</div>
          <div style={{ fontWeight: 500, color: 'var(--ink)', marginBottom: 4 }}>No submitted bids yet</div>
          <div>Bids will appear here once vendors submit their responses.</div>
        </div>
      ) : (
        <div className="cmp-wrap">
          <table className="cmp-table">
            <thead>
              <tr>
                <th className="item-col">Line Item</th>
                {submittedBids.map(bid => (
                  <th key={bid.bidId}>
                    <div className="vendor-header">
                      <span className="vendor-name">{bid.vendorName}</span>
                      <span className="submitted-badge">Submitted</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rfqItems.map(item => (
                <tr key={item.id}>
                  <td>
                    <div className="item-name">{item.description}</div>
                    <div className="item-meta">
                      Qty: {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                      {item.target_price ? ` · Target: ${fmtPrice(item.target_price)}` : ''}
                    </div>
                  </td>
                  {submittedBids.map(bid => {
                    const priceData = bid.itemPrices?.[item.id];
                    const up = priceData?.unitPrice;
                    const isLowest = up != null && up > 0 && up === lowestByItem[item.id];
                    return (
                      <td key={bid.bidId} className="price-cell">
                        {up != null && up > 0 ? (
                          <span className={isLowest ? 'price-best' : 'price-normal'}>
                            {fmtPrice(up)}
                          </span>
                        ) : (
                          <span className="price-empty">—</span>
                        )}
                        {priceData?.totalPrice > 0 && (
                          <span className="diff-note">
                            Line: {fmtPrice(priceData.totalPrice)}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="total-row">
                <td>Total Bid Amount</td>
                {submittedBids.map(bid => (
                  <td key={bid.bidId} className="price-cell">
                    <span className={bid.totalAmount === lowestTotal ? 'total-best' : ''}>
                      {bid.currency || currency} {fmtPrice(bid.totalAmount)}
                    </span>
                    {bid.totalAmount === lowestTotal && (
                      <span className="diff-note" style={{ color: '#1a7a4a' }}>★ Lowest</span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
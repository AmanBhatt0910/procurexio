// src/app/api/rfqs/[id]/bids/export/route.js
// Export bids as structured CSV (Quotation format) or JSON for an RFQ
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

function escCsv(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function row(...cells) {
  return cells.map(escCsv).join(',');
}

export async function GET(request, { params }) {
  const role      = request.headers.get('x-user-role');
  const companyId = request.headers.get('x-company-id');

  if (!['company_admin', 'manager', 'employee'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: rfqId } = await params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'csv';

  try {
    // Fetch RFQ
    const [[rfq]] = await pool.query(
      `SELECT id, title, reference_number, status, deadline, currency,
              payment_terms, freight_charges, remarks
       FROM rfqs WHERE id = ? AND company_id = ?`,
      [rfqId, companyId]
    );
    if (!rfq) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });

    // Fetch submitted bids ordered by total_amount ascending (L1 = lowest)
    const [bids] = await pool.query(
      `SELECT b.id AS bid_id, v.name AS vendor_name, v.email AS vendor_email,
              b.status, b.total_amount, b.currency, b.gst,
              b.submitted_at, b.notes, b.updated_at,
              COALESCE(b.payment_terms, '') AS payment_terms,
              COALESCE(b.freight_charges, 0) AS freight_charges,
              COALESCE(b.last_remarks, '') AS last_remarks
       FROM bids b
       JOIN vendors v ON v.id = b.vendor_id
       WHERE b.rfq_id = ? AND b.company_id = ? AND b.status = 'submitted'
       ORDER BY b.total_amount ASC`,
      [rfqId, companyId]
    );

    // Fetch RFQ items
    const [rfqItems] = await pool.query(
      `SELECT id, description, quantity, unit, target_price
       FROM rfq_items WHERE rfq_id = ? AND company_id = ?
       ORDER BY id ASC`,
      [rfqId, companyId]
    );

    // Fetch bid items for all bids
    const bidIds = bids.map(b => b.bid_id);
    let bidItemsMap = {};  // { bid_id: { rfq_item_id: { unit_price, quantity } } }
    if (bidIds.length > 0) {
      const safeIds = bidIds.map(id => parseInt(id, 10)).filter(Number.isFinite);
      const [bidItemRows] = await pool.query(
        `SELECT bid_id, rfq_item_id, unit_price, quantity
         FROM bid_items
         WHERE bid_id IN (${safeIds.map(() => '?').join(',')})`,
        safeIds
      );
      for (const item of bidItemRows) {
        if (!bidItemsMap[item.bid_id]) bidItemsMap[item.bid_id] = {};
        bidItemsMap[item.bid_id][item.rfq_item_id] = {
          unit_price: parseFloat(item.unit_price) || 0,
          quantity:   parseFloat(item.quantity)   || 0,
        };
      }
    }

    if (format === 'json') {
      return NextResponse.json({
        rfq,
        exportedAt: new Date().toISOString(),
        bids: bids.map(b => ({
          ...b,
          total_amount: parseFloat(b.total_amount),
          gst: parseFloat(b.gst) || 0,
        })),
        items: rfqItems,
        bidItems: bidItemsMap,
      });
    }

    // ── Structured CSV ────────────────────────────────────────────────────────
    // Up to 3 top vendors (L1, L2, L3)
    const topBids = bids.slice(0, 3);

    const csvLines = [];

    // Row 1: Title
    csvLines.push(row(`Quotation for Item: ${rfq.title}`));

    // Row 2: Vendor header (Empty×3, then vendor names for L1/L2/L3, two cols each)
    const vendorHeaderCells = ['', '', ''];
    for (let i = 0; i < topBids.length; i++) {
      vendorHeaderCells.push(`Vendor L${i + 1}: ${topBids[i].vendor_name}`, '');
    }
    csvLines.push(vendorHeaderCells.map(escCsv).join(','));

    // Row 3: Column headers
    const colHeaders = ['Item Code', 'Qty', 'GST'];
    for (let i = 0; i < topBids.length; i++) {
      colHeaders.push(`L${i + 1} Amt (excl. GST)`, `L${i + 1} Total (incl. GST)`);
    }
    csvLines.push(colHeaders.map(escCsv).join(','));

    // Item rows
    for (let idx = 0; idx < rfqItems.length; idx++) {
      const item = rfqItems[idx];
      const itemCells = [
        `${idx + 1}. ${item.description}`,
        item.quantity,
        '',  // GST column intentionally empty per item; bid-level GST rate shown in summary row after totals
      ];
      for (const bid of topBids) {
        const bi    = bidItemsMap[bid.bid_id]?.[item.id];
        const up    = bi ? bi.unit_price : 0;
        const qty   = bi ? bi.quantity   : parseFloat(item.quantity) || 0;
        const lineAmt   = up * qty;
        const gstRate   = parseFloat(bid.gst) || 0;
        const lineTotal = lineAmt * (1 + gstRate / 100);
        itemCells.push(
          lineAmt   > 0 ? lineAmt.toFixed(2)   : '',
          lineTotal > 0 ? lineTotal.toFixed(2)  : ''
        );
      }
      csvLines.push(itemCells.map(escCsv).join(','));
    }

    // Totals row
    const totalCells = ['', '', 'TOTAL'];
    for (const bid of topBids) {
      const subtotal = rfqItems.reduce((sum, item) => {
        const bi  = bidItemsMap[bid.bid_id]?.[item.id];
        const up  = bi ? bi.unit_price : 0;
        const qty = bi ? bi.quantity   : parseFloat(item.quantity) || 0;
        return sum + up * qty;
      }, 0);
      const gstRate   = parseFloat(bid.gst) || 0;
      const grandTotal = subtotal * (1 + gstRate / 100);
      totalCells.push(subtotal.toFixed(2), grandTotal.toFixed(2));
    }
    csvLines.push(totalCells.map(escCsv).join(','));

    // GST rate row
    const gstRateCells = ['', '', 'GST Rate'];
    for (const bid of topBids) {
      const gstRate = parseFloat(bid.gst) || 0;
      gstRateCells.push(`${gstRate}%`, '');
    }
    csvLines.push(gstRateCells.map(escCsv).join(','));

    // Blank separator
    csvLines.push('');

    // Footer section
    const getFooterVal = (bid, field) => bid[field] || '';
    csvLines.push(row('Payment Terms', '', ...topBids.map(b => getFooterVal(b, 'payment_terms'))));
    csvLines.push(row('Freight Charges', '', ...topBids.map(b => b.freight_charges || '')));
    csvLines.push(row('Last Remarks', '', ...topBids.map(b => getFooterVal(b, 'last_remarks'))));

    const csv = csvLines.join('\r\n');
    const filename = `quotation-${rfq.reference_number}-${Date.now()}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control':       'no-cache',
      },
    });
  } catch (err) {
    console.error('GET /api/rfqs/[id]/bids/export error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

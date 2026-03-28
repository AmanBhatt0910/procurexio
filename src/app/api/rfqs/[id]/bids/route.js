// GET /api/rfqs/[id]/bids
// Returns structured comparison payload for all bids on an RFQ.
// Requires role: company_admin | manager | employee

import { pool } from '@/lib/db';

const ALLOWED_ROLES = ['company_admin', 'manager', 'employee', 'super_admin'];

export async function GET(request, { params }) {
  const role      = request.headers.get('x-user-role');
  const companyId = request.headers.get('x-company-id');
  const rfqId     = params.id;

  if (!ALLOWED_ROLES.includes(role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const offset = (page - 1) * limit;

  // Verify RFQ belongs to company
  const [[rfq]] = await pool.query(
    `SELECT id, reference_number, title, description, status, deadline, budget, currency, created_at
     FROM rfqs WHERE id = ? AND company_id = ?`,
    [rfqId, companyId]
  );
  if (!rfq) return Response.json({ error: 'RFQ not found' }, { status: 404 });

  // RFQ items
  const [items] = await pool.query(
    `SELECT id, description, quantity, unit, target_price, sort_order
     FROM rfq_items WHERE rfq_id = ? AND company_id = ?
     ORDER BY sort_order ASC`,
    [rfqId, companyId]
  );

  // Bids with vendor info (paginated)
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM bids WHERE rfq_id = ? AND company_id = ?`,
    [rfqId, companyId]
  );

  const [bidsRaw] = await pool.query(
    `SELECT b.id AS bidId, b.vendor_id AS vendorId, v.name AS vendorName,
            b.status, b.total_amount AS totalAmount, b.currency, b.notes,
            b.submitted_at AS submittedAt, b.created_at
     FROM bids b
     JOIN vendors v ON v.id = b.vendor_id
     WHERE b.rfq_id = ? AND b.company_id = ?
     ORDER BY b.total_amount ASC
     LIMIT ? OFFSET ?`,
    [rfqId, companyId, limit, offset]
  );

  // Fetch bid_items for all bids in one query
  const bidIds = bidsRaw.map(b => b.bidId);
  let bidItemsMap = {};

  if (bidIds.length) {
    const placeholders = bidIds.map(() => '?').join(',');
    const [bidItemsRaw] = await pool.query(
      `SELECT bid_id, rfq_item_id, unit_price, quantity, total_price, notes
       FROM bid_items WHERE bid_id IN (${placeholders}) AND company_id = ?`,
      [...bidIds, companyId]
    );

    for (const bi of bidItemsRaw) {
      if (!bidItemsMap[bi.bid_id]) bidItemsMap[bi.bid_id] = {};
      bidItemsMap[bi.bid_id][`rfqItemId_${bi.rfq_item_id}`] = {
        unitPrice:  bi.unit_price,
        quantity:   bi.quantity,
        totalPrice: bi.total_price,
        notes:      bi.notes,
      };
    }
  }

  const bids = bidsRaw.map(b => ({
    ...b,
    itemPrices: bidItemsMap[b.bidId] ?? {},
  }));

  return Response.json({
    message: 'OK',
    data: { rfq, items, bids, total, page, limit },
  });
}
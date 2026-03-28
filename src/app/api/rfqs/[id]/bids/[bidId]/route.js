// GET /api/rfqs/[id]/bids/[bidId]
// Full bid detail with all bid_items.
// Requires role: company_admin | manager | employee

import { pool } from '@/lib/db';

const ALLOWED_ROLES = ['company_admin', 'manager', 'employee', 'super_admin'];

export async function GET(request, { params }) {
  const role      = request.headers.get('x-user-role');
  const companyId = request.headers.get('x-company-id');
  const { id: rfqId, bidId } = params;

  if (!ALLOWED_ROLES.includes(role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Verify RFQ belongs to company
  const [[rfq]] = await pool.query(
    `SELECT id, reference_number, title, status, deadline, currency FROM rfqs WHERE id = ? AND company_id = ?`,
    [rfqId, companyId]
  );
  if (!rfq) return Response.json({ error: 'RFQ not found' }, { status: 404 });

  // Fetch bid
  const [[bid]] = await pool.query(
    `SELECT b.id, b.vendor_id AS vendorId, v.name AS vendorName,
            b.status, b.notes, b.total_amount AS totalAmount, b.currency,
            b.submitted_at AS submittedAt, b.created_at, b.updated_at
     FROM bids b
     JOIN vendors v ON v.id = b.vendor_id
     WHERE b.id = ? AND b.rfq_id = ? AND b.company_id = ?`,
    [bidId, rfqId, companyId]
  );
  if (!bid) return Response.json({ error: 'Bid not found' }, { status: 404 });

  // Fetch bid items with rfq_item info
  const [bidItems] = await pool.query(
    `SELECT bi.id, bi.rfq_item_id, ri.description, ri.unit,
            bi.unit_price, bi.quantity, bi.total_price, bi.notes
     FROM bid_items bi
     JOIN rfq_items ri ON ri.id = bi.rfq_item_id
     WHERE bi.bid_id = ? AND bi.company_id = ?
     ORDER BY ri.sort_order ASC`,
    [bidId, companyId]
  );

  return Response.json({
    message: 'OK',
    data: { rfq, bid, bidItems },
  });
}
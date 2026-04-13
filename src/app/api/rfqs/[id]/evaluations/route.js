// src/app/api/rfqs/[id]/evaluations/route.js
import db from '@/lib/db';
import { validateUserContext, validateNumericId } from '@/lib/authUtils';

export async function GET(request, { params }) {
  const { id: rawId } = await params;
  const { ok: idOk, value: id } = validateNumericId(rawId);
  if (!idOk) return Response.json({ error: 'Invalid RFQ ID' }, { status: 400 });

  const validated = await validateUserContext(request, {
    requireRole: ['super_admin', 'company_admin', 'manager', 'employee'],
    requireCompanyId: true,
  });

  if (!validated.ok) {
    return Response.json({ error: validated.error }, { status: validated.status });
  }

  const { companyId } = validated;

  // Verify RFQ belongs to company
  const [rfqs] = await db.query(
    `SELECT id FROM rfqs WHERE id = ? AND company_id = ?`,
    [id, companyId]
  );
  if (!rfqs.length) {
    return Response.json({ error: 'RFQ not found' }, { status: 404 });
  }

  const [rows] = await db.query(
    `SELECT
       be.bid_id,
       v.name AS vendor_name,
       b.total_amount,
       b.currency,
       b.status AS bid_status,
       be.id AS eval_id,
       be.evaluated_by,
       u.name AS evaluator_name,
       be.score,
       be.notes,
       be.updated_at
     FROM bids b
     JOIN vendors v ON v.id = b.vendor_id
     LEFT JOIN bid_evaluations be ON be.bid_id = b.id AND be.company_id = b.company_id
     LEFT JOIN users u ON u.id = be.evaluated_by
     WHERE b.rfq_id = ? AND b.company_id = ? AND b.status = 'submitted'
     ORDER BY b.id, be.updated_at`,
    [id, companyId]
  );

  // Group by bid_id
  const map = {};
  for (const row of rows) {
    if (!map[row.bid_id]) {
      map[row.bid_id] = {
        bidId: row.bid_id,
        vendorName: row.vendor_name,
        totalAmount: row.total_amount,
        currency: row.currency,
        bidStatus: row.bid_status,
        evaluations: [],
        avgScore: null,
      };
    }
    if (row.eval_id) {
      map[row.bid_id].evaluations.push({
        evaluatedBy: row.evaluated_by,
        evaluatorName: row.evaluator_name,
        score: row.score,
        notes: row.notes,
        updatedAt: row.updated_at,
      });
    }
  }

  const result = Object.values(map).map(bid => {
    const scores = bid.evaluations.filter(e => e.score !== null).map(e => e.score);
    bid.avgScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;
    return bid;
  });

  return Response.json({ data: result });
}

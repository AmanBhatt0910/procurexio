// src/app/api/rfqs/[id]/bids/[bidId]/evaluate/route.js
import db from '@/lib/db';
import { canManageRFQ } from '@/lib/auth/rbac';
import { logAction, ACTION } from '@/lib/logging/audit';

export async function POST(request, { params }) {
  const { id, bidId } = await params;
  const companyId = request.headers.get('x-company-id');
  const userId    = request.headers.get('x-user-id');
  const role      = request.headers.get('x-user-role');

  if (!canManageRFQ(role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { score, notes } = body;

  if (score !== null && score !== undefined) {
    const s = Number(score);
    if (!Number.isInteger(s) || s < 1 || s > 100) {
      return Response.json({ error: 'Score must be an integer between 1 and 100' }, { status: 400 });
    }
  }

  // Verify bid belongs to this RFQ and company
  const [bids] = await db.query(
    `SELECT b.id, b.rfq_id FROM bids b
     WHERE b.id = ? AND b.rfq_id = ? AND b.company_id = ?`,
    [bidId, id, companyId]
  );
  if (!bids.length) {
    return Response.json({ error: 'Bid not found' }, { status: 404 });
  }

  await db.query(
    `INSERT INTO bid_evaluations (bid_id, rfq_id, company_id, evaluated_by, score, notes)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE score = VALUES(score), notes = VALUES(notes), updated_at = NOW()`,
    [bidId, id, companyId, userId, score ?? null, notes ?? null]
  );

  const [rows] = await db.query(
    `SELECT be.*, u.name AS evaluator_name
     FROM bid_evaluations be
     JOIN users u ON u.id = be.evaluated_by
     WHERE be.bid_id = ? AND be.evaluated_by = ? AND be.company_id = ?`,
    [bidId, userId, companyId]
  );

  await logAction(request, {
    userId:       parseInt(userId, 10) || null,
    userEmail:    request.headers.get('x-user-email') || null,
    actionType:   ACTION.EVALUATION_SUBMITTED,
    resourceType: 'bid',
    resourceId:   parseInt(bidId, 10) || null,
    resourceName: `Bid #${bidId} on RFQ #${id}`,
    changes:      { score: score ?? null },
    status:       'success',
  });

  return Response.json({ message: 'Evaluation saved', data: rows[0] });
}
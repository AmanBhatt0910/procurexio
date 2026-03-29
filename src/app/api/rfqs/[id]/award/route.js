// src/app/api/rfqs/[id]/award/route.js
import db from '@/lib/db';
import { canManageRFQ } from '@/lib/rbac';

// Helper: generate contract reference
async function generateContractRef(conn, companyId) {
  const year = new Date().getFullYear();
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS cnt FROM contracts WHERE company_id = ? AND YEAR(awarded_at) = ?`,
    [companyId, year]
  );
  const seq = (rows[0].cnt + 1).toString().padStart(5, '0');
  return `CONTRACT-${year}-${seq}`;
}

// POST /api/rfqs/[id]/award
export async function POST(request, { params }) {
  const { id } = await params;
  const companyId = request.headers.get('x-company-id');
  const userId    = request.headers.get('x-user-id');
  const role      = request.headers.get('x-user-role');

  if (!canManageRFQ(role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { bidId, notes } = body;
  if (!bidId) return Response.json({ error: 'bidId is required' }, { status: 400 });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Validate RFQ
    const [[rfq]] = await conn.query(
      `SELECT id, status FROM rfqs WHERE id = ? AND company_id = ?`,
      [id, companyId]
    );
    if (!rfq) { await conn.rollback(); return Response.json({ error: 'RFQ not found' }, { status: 404 }); }
    if (!['published', 'closed'].includes(rfq.status)) {
      await conn.rollback();
      return Response.json({ error: 'RFQ must be published or closed to award' }, { status: 422 });
    }

    // Check not already awarded
    const [[existing]] = await conn.query(
      `SELECT id FROM contracts WHERE rfq_id = ? AND company_id = ?`,
      [id, companyId]
    );
    if (existing) {
      await conn.rollback();
      return Response.json({ error: 'This RFQ already has an active contract' }, { status: 409 });
    }

    // Validate bid
    const [[bid]] = await conn.query(
      `SELECT b.id, b.vendor_id, b.total_amount, b.currency
       FROM bids b WHERE b.id = ? AND b.rfq_id = ? AND b.company_id = ? AND b.status = 'submitted'`,
      [bidId, id, companyId]
    );
    if (!bid) { await conn.rollback(); return Response.json({ error: 'Bid not found or not submitted' }, { status: 404 }); }

    // Generate contract reference
    const contractRef = await generateContractRef(conn, companyId);

    // 1. Insert contract
    const [contractResult] = await conn.query(
      `INSERT INTO contracts (contract_reference, rfq_id, bid_id, vendor_id, company_id, awarded_by, total_amount, currency, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [contractRef, id, bidId, bid.vendor_id, companyId, userId, bid.total_amount, bid.currency, notes ?? null]
    );

    // 2. Close the RFQ
    await conn.query(`UPDATE rfqs SET status = 'closed' WHERE id = ? AND company_id = ?`, [id, companyId]);

    // 3. Mark winning bid as awarded
    await conn.query(
      `UPDATE bids SET status = 'awarded' WHERE id = ? AND company_id = ?`,
      [bidId, companyId]
    );

    // 4. Reject all other submitted bids for this RFQ
    await conn.query(
      `UPDATE bids SET status = 'rejected'
       WHERE rfq_id = ? AND company_id = ? AND status = 'submitted' AND id != ?`,
      [id, companyId, bidId]
    );

    // 5. Mark winning vendor in rfq_vendors as 'awarded'
    await conn.query(
      `UPDATE rfq_vendors SET status = 'awarded'
       WHERE rfq_id = ? AND vendor_id = ? AND company_id = ?`,
      [id, bid.vendor_id, companyId]
    );

    await conn.commit();

    // Fetch the full contract
    const [[contract]] = await conn.query(
      `SELECT c.*, v.name AS vendor_name, u.name AS awarded_by_name
       FROM contracts c
       JOIN vendors v ON v.id = c.vendor_id
       JOIN users u ON u.id = c.awarded_by
       WHERE c.id = ?`,
      [contractResult.insertId]
    );

    return Response.json({ message: 'Contract awarded', data: contract }, { status: 201 });
  } catch (err) {
    await conn.rollback();
    console.error('Award error:', err);
    return Response.json({ error: 'Failed to award contract' }, { status: 500 });
  } finally {
    conn.release();
  }
}

// GET /api/rfqs/[id]/award
export async function GET(request, { params }) {
  const { id } = await params;
  const companyId = request.headers.get('x-company-id');
  const role      = request.headers.get('x-user-role');

  if (!['super_admin','company_admin','manager','employee'].includes(role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [[contract]] = await db.query(
    `SELECT c.*, v.name AS vendor_name, v.email AS vendor_email,
            u.name AS awarded_by_name
     FROM contracts c
     JOIN vendors v ON v.id = c.vendor_id
     JOIN users u ON u.id = c.awarded_by
     WHERE c.rfq_id = ? AND c.company_id = ?`,
    [id, companyId]
  );

  if (!contract) return Response.json({ error: 'No contract found for this RFQ' }, { status: 404 });

  return Response.json({ data: contract });
}

// DELETE /api/rfqs/[id]/award  — company_admin only
export async function DELETE(request, { params }) {
  const { id } = await params;
  const companyId = request.headers.get('x-company-id');
  const role      = request.headers.get('x-user-role');

  if (!['super_admin','company_admin'].includes(role)) {
    return Response.json({ error: 'Forbidden — only company admins can cancel awards' }, { status: 403 });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[contract]] = await conn.query(
      `SELECT * FROM contracts WHERE rfq_id = ? AND company_id = ? AND status = 'active'`,
      [id, companyId]
    );
    if (!contract) {
      await conn.rollback();
      return Response.json({ error: 'No active contract to cancel' }, { status: 404 });
    }

    // Cancel contract (keep row for audit)
    await conn.query(`UPDATE contracts SET status = 'cancelled' WHERE id = ?`, [contract.id]);

    // Revert RFQ to published
    await conn.query(`UPDATE rfqs SET status = 'published' WHERE id = ? AND company_id = ?`, [id, companyId]);

    // Revert awarded bid to submitted
    await conn.query(`UPDATE bids SET status = 'submitted' WHERE id = ? AND company_id = ?`, [contract.bid_id, companyId]);

    // Revert rejected bids to submitted
    await conn.query(
      `UPDATE bids SET status = 'submitted'
       WHERE rfq_id = ? AND company_id = ? AND status = 'rejected'`,
      [id, companyId]
    );

    // Revert rfq_vendors awarded → submitted
    await conn.query(
      `UPDATE rfq_vendors SET status = 'submitted'
       WHERE rfq_id = ? AND vendor_id = ? AND company_id = ?`,
      [id, contract.vendor_id, companyId]
    );

    await conn.commit();
    return Response.json({ message: 'Award cancelled successfully' });
  } catch (err) {
    await conn.rollback();
    console.error('Cancel award error:', err);
    return Response.json({ error: 'Failed to cancel award' }, { status: 500 });
  } finally {
    conn.release();
  }
}
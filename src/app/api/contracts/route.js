// src/app/api/contracts/route.js
import db from '@/lib/db';

export async function GET(request) {
  const companyId = request.headers.get('x-company-id');
  const role      = request.headers.get('x-user-role');

  if (!['super_admin','company_admin','manager','employee'].includes(role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // super_admin without a company context cannot use this tenant-scoped endpoint
  if (!companyId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const page   = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const offset = (page - 1) * limit;

  const conditions = ['c.company_id = ?'];
  const values = [companyId];

  if (status && ['active','cancelled'].includes(status)) {
    conditions.push('c.status = ?');
    values.push(status);
  }

  const where = conditions.join(' AND ');

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM contracts c WHERE ${where}`,
    values
  );

  const [rows] = await db.query(
    `SELECT
       c.id AS contractId,
       c.contract_reference AS contractRef,
       r.reference_number AS rfqRef,
       r.title AS rfqTitle,
       v.name AS vendorName,
       c.total_amount AS totalAmount,
       c.currency,
       c.awarded_at AS awardedAt,
       c.status
     FROM contracts c
     JOIN rfqs r ON r.id = c.rfq_id
     JOIN vendors v ON v.id = c.vendor_id
     WHERE ${where}
     ORDER BY c.awarded_at DESC
     LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );

  return Response.json({
    data: rows,
    meta: { total, page, limit, pages: Math.ceil(total / limit), totalPages: Math.ceil(total / limit) },
  });
}
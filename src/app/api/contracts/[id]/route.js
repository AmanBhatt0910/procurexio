// src/app/api/contracts/[id]/route.js
import db from '@/lib/db';
import { validateUserContext } from '@/lib/auth/authUtils';
import { validateNumericId } from '@/lib/auth/authUtils';

export async function GET(request, { params }) {
  // CRITICAL: Validate against JWT, not headers
  const validated = await validateUserContext(request, {
    requireRole: ['super_admin','company_admin','manager','employee'],
    requireCompanyId: true,
  });

  if (!validated.ok) {
    return Response.json({ error: validated.error }, { status: validated.status });
  }

  const { companyId } = validated;
  const { id: rawId } = await params;

  // CRITICAL: Validate URL parameter is numeric
  const { ok: idOk, value: id } = validateNumericId(rawId);
  if (!idOk) {
    return Response.json({ error: 'Invalid contract ID' }, { status: 400 });
  }

  const [[contract]] = await db.query(
    `SELECT
       c.*,
       v.name AS vendor_name, v.email AS vendor_email, v.phone AS vendor_phone,
       u.name AS awarded_by_name,
       r.title AS rfq_title, r.reference_number AS rfq_ref,
       r.deadline AS rfq_deadline, r.description AS rfq_description
     FROM contracts c
     JOIN vendors v ON v.id = c.vendor_id
     JOIN users u ON u.id = c.awarded_by
     JOIN rfqs r ON r.id = c.rfq_id
     WHERE c.id = ? AND c.company_id = ?`,
    [id, companyId]
  );

  if (!contract) return Response.json({ error: 'Contract not found' }, { status: 404 });

  // Fetch winning bid items
  const [items] = await db.query(
    `SELECT
       bi.id, bi.unit_price, bi.quantity, bi.total_price, bi.notes,
       ri.description AS item_description, ri.unit
     FROM bid_items bi
     JOIN rfq_items ri ON ri.id = bi.rfq_item_id
     WHERE bi.bid_id = ? AND bi.company_id = ?
     ORDER BY ri.sort_order`,
    [contract.bid_id, companyId]
  );

  return Response.json({ data: { ...contract, items } });
}
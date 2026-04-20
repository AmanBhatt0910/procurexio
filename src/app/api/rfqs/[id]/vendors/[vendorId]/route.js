// src/app/api/rfqs/[id]/vendors/[vendorId]/route.js
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth/rbac';

// ── DELETE /api/rfqs/[id]/vendors/[vendorId] ───────────────────────────────
// Only allowed if the vendor hasn't submitted yet
export async function DELETE(request, { params }) {
  const companyId        = request.headers.get('x-company-id');
  const role             = request.headers.get('x-user-role');
  const { id, vendorId } = await params;

  if (!companyId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const allowed = requireRole(role, ['company_admin', 'manager']);
  if (!allowed) return Response.json({ error: 'Forbidden' }, { status: 403 });

  try {
    // query() returns a flat array of rows — no destructuring
    const inviteRows = await query(
      `SELECT rv.*, v.name AS vendor_name
         FROM rfq_vendors rv
         JOIN vendors v ON v.id = rv.vendor_id
        WHERE rv.rfq_id = ? AND rv.vendor_id = ? AND rv.company_id = ?`,
      [id, vendorId, companyId]
    );

    if (inviteRows.length === 0)
      return Response.json({ error: 'Vendor invite not found' }, { status: 404 });

    const invite = inviteRows[0];

    if (invite.status === 'submitted') {
      return Response.json(
        { error: `Cannot remove ${invite.vendor_name} — they have already submitted a bid` },
        { status: 422 }
      );
    }

    await query(
      `DELETE FROM rfq_vendors WHERE rfq_id = ? AND vendor_id = ? AND company_id = ?`,
      [id, vendorId, companyId]
    );

    return Response.json({ message: 'Vendor removed from RFQ' });
  } catch (err) {
    console.error('DELETE /api/rfqs/[id]/vendors/[vendorId] error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
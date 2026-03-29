// src/app/api/rfqs/[id]/items/[itemId]/route.js
import { query } from '@/lib/db';
import { requireRole } from '@/lib/rbac';

async function loadEditableRfq(rfqId, companyId) {
  const rows = await query(
    `SELECT * FROM rfqs WHERE id = ? AND company_id = ?`,
    [rfqId, companyId]
  );
  if (rows.length === 0) return { error: 'RFQ not found', status: 404 };
  const rfq = rows[0];
  if (rfq.status === 'closed' || rfq.status === 'cancelled') {
    return { error: `Cannot modify items on a ${rfq.status} RFQ`, status: 422 };
  }
  return { rfq };
}

// ── PUT /api/rfqs/[id]/items/[itemId] ──────────────────────────────────────
export async function PUT(request, { params }) {
  const companyId    = request.headers.get('x-company-id');
  const role         = request.headers.get('x-user-role');
  const { id, itemId } = await params;

  if (!companyId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const allowed = requireRole(role, ['company_admin', 'manager']);
  if (!allowed) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const check = await loadEditableRfq(id, companyId);
  if (check.error) return Response.json({ error: check.error }, { status: check.status });

  // Verify item belongs to this RFQ
  const itemRows = await query(
    `SELECT * FROM rfq_items WHERE id = ? AND rfq_id = ? AND company_id = ?`,
    [itemId, id, companyId]
  );
  if (itemRows.length === 0) {
    return Response.json({ error: 'Item not found' }, { status: 404 });
  }

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const updates = {};
  if (body.description !== undefined) updates.description  = body.description.trim();
  if (body.quantity    !== undefined) updates.quantity     = body.quantity;
  if (body.unit        !== undefined) updates.unit         = body.unit || null;
  if (body.target_price !== undefined) updates.target_price = body.target_price || null;
  if (body.sort_order  !== undefined) updates.sort_order   = body.sort_order;

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'No fields to update' }, { status: 422 });
  }

  try {
    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    await query(
      `UPDATE rfq_items SET ${setClauses} WHERE id = ? AND rfq_id = ?`,
      [...Object.values(updates), itemId, id]
    );

    const updatedRows = await query(`SELECT * FROM rfq_items WHERE id = ?`, [itemId]);
    return Response.json({ message: 'Item updated', data: { item: updatedRows[0] } });
  } catch (err) {
    console.error('PUT /api/rfqs/[id]/items/[itemId] error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── DELETE /api/rfqs/[id]/items/[itemId] ───────────────────────────────────
export async function DELETE(request, { params }) {
  const companyId    = request.headers.get('x-company-id');
  const role         = request.headers.get('x-user-role');
  const { id, itemId } = await params;

  if (!companyId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const allowed = requireRole(role, ['company_admin', 'manager']);
  if (!allowed) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const check = await loadEditableRfq(id, companyId);
  if (check.error) return Response.json({ error: check.error }, { status: check.status });

  try {
    const result = await query(
      `DELETE FROM rfq_items WHERE id = ? AND rfq_id = ? AND company_id = ?`,
      [itemId, id, companyId]
    );
    if (result.affectedRows === 0) {
      return Response.json({ error: 'Item not found' }, { status: 404 });
    }
    return Response.json({ message: 'Item removed' });
  } catch (err) {
    console.error('DELETE /api/rfqs/[id]/items/[itemId] error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
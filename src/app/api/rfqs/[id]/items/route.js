// src/app/api/rfqs/[id]/items/route.js
import { query } from '@/lib/db';
import { requireRole } from '@/lib/rbac';

// Helper — verify RFQ belongs to tenant and is editable
async function loadEditableRfq(rfqId, companyId) {
  const [rows] = await query(
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

// ── GET /api/rfqs/[id]/items ────────────────────────────────────────────────
export async function GET(request, { params }) {
  const companyId = request.headers.get('x-company-id');
  const role      = request.headers.get('x-user-role');
  const { id }    = await params;

  if (!companyId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const allowed = requireRole(role, ['company_admin', 'manager', 'employee']);
  if (!allowed) return Response.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const [rfqRows] = await query(
      `SELECT id FROM rfqs WHERE id = ? AND company_id = ?`,
      [id, companyId]
    );
    if (rfqRows.length === 0) {
      return Response.json({ error: 'RFQ not found' }, { status: 404 });
    }

    const [items] = await query(
      `SELECT * FROM rfq_items WHERE rfq_id = ? ORDER BY sort_order ASC, id ASC`,
      [id]
    );

    return Response.json({ message: 'OK', data: { items } });
  } catch (err) {
    console.error('GET /api/rfqs/[id]/items error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST /api/rfqs/[id]/items ───────────────────────────────────────────────
export async function POST(request, { params }) {
  const companyId = request.headers.get('x-company-id');
  const role      = request.headers.get('x-user-role');
  const { id }    = await params;

  if (!companyId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const allowed = requireRole(role, ['company_admin', 'manager']);
  if (!allowed) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const check = await loadEditableRfq(id, companyId);
  if (check.error) return Response.json({ error: check.error }, { status: check.status });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { description, quantity, unit, target_price } = body;
  if (!description || description.trim().length === 0) {
    return Response.json({ error: 'Item description is required' }, { status: 422 });
  }

  try {
    // Determine next sort order
    const [maxRows] = await query(
      `SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM rfq_items WHERE rfq_id = ?`,
      [id]
    );
    const sortOrder = maxRows[0].max_order + 1;

    const [result] = await query(
      `INSERT INTO rfq_items (rfq_id, company_id, description, quantity, unit, target_price, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, companyId, description.trim(), quantity || 1, unit || null, target_price || null, sortOrder]
    );

    const [newItem] = await query(`SELECT * FROM rfq_items WHERE id = ?`, [result.insertId]);

    return Response.json(
      { message: 'Item added', data: { item: newItem[0] } },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/rfqs/[id]/items error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
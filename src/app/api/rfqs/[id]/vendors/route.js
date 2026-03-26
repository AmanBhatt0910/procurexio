// src/app/api/rfqs/[id]/vendors/route.js
import { query } from '@/lib/db';
import { requireRole } from '@/lib/rbac';

// ── GET /api/rfqs/[id]/vendors ──────────────────────────────────────────────
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

    const [vendors] = await query(
      `SELECT rv.id, rv.vendor_id, rv.status AS invite_status,
              rv.invited_at, rv.updated_at,
              v.name AS vendor_name, v.email AS vendor_email,
              v.phone AS vendor_phone, v.status AS vendor_status
         FROM rfq_vendors rv
         JOIN vendors v ON v.id = rv.vendor_id
        WHERE rv.rfq_id = ? AND rv.company_id = ?
        ORDER BY rv.invited_at ASC`,
      [id, companyId]
    );

    return Response.json({ message: 'OK', data: { vendors } });
  } catch (err) {
    console.error('GET /api/rfqs/[id]/vendors error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST /api/rfqs/[id]/vendors ─────────────────────────────────────────────
// Body: { vendorIds: [id, id, ...] }
export async function POST(request, { params }) {
  const companyId = request.headers.get('x-company-id');
  const role      = request.headers.get('x-user-role');
  const { id }    = await params;

  if (!companyId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const allowed = requireRole(role, ['company_admin', 'manager']);
  if (!allowed) return Response.json({ error: 'Forbidden' }, { status: 403 });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { vendorIds } = body;
  if (!Array.isArray(vendorIds) || vendorIds.length === 0) {
    return Response.json({ error: 'vendorIds must be a non-empty array' }, { status: 422 });
  }

  try {
    // Validate RFQ exists and is in an invitable state
    const [rfqRows] = await query(
      `SELECT * FROM rfqs WHERE id = ? AND company_id = ?`,
      [id, companyId]
    );
    if (rfqRows.length === 0) {
      return Response.json({ error: 'RFQ not found' }, { status: 404 });
    }
    const rfq = rfqRows[0];
    if (rfq.status === 'closed' || rfq.status === 'cancelled') {
      return Response.json(
        { error: `Cannot invite vendors to a ${rfq.status} RFQ` },
        { status: 422 }
      );
    }

    // Validate all vendorIds belong to the company and are active
    const placeholders = vendorIds.map(() => '?').join(', ');
    const [vendorRows] = await query(
      `SELECT id, name, status FROM vendors
        WHERE id IN (${placeholders}) AND company_id = ?`,
      [...vendorIds, companyId]
    );

    // Build results map
    const found = new Map(vendorRows.map(v => [v.id, v]));
    const warnings = [];
    const toInvite = [];

    for (const vid of vendorIds) {
      const v = found.get(Number(vid));
      if (!v) {
        warnings.push({ vendorId: vid, warning: 'Vendor not found' });
        continue;
      }
      if (v.status !== 'active') {
        warnings.push({ vendorId: vid, vendorName: v.name, warning: `Vendor is ${v.status} — invite skipped` });
        continue;
      }
      toInvite.push(vid);
    }

    let invited = 0;
    let skippedAlreadyInvited = 0;

    for (const vid of toInvite) {
      // Use INSERT IGNORE to skip duplicates gracefully
      const [result] = await query(
        `INSERT IGNORE INTO rfq_vendors (rfq_id, vendor_id, company_id)
         VALUES (?, ?, ?)`,
        [id, vid, companyId]
      );
      if (result.affectedRows > 0) invited++;
      else skippedAlreadyInvited++;
    }

    return Response.json({
      message: `${invited} vendor(s) invited`,
      data: { invited, skippedAlreadyInvited, warnings },
    });
  } catch (err) {
    console.error('POST /api/rfqs/[id]/vendors error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
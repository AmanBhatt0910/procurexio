// src/app/api/rfqs/[id]/route.js
import { query } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import { createNotifications } from '@/lib/notifications';
import { autoCloseIfExpired } from '@/lib/rfqUtils';
import { logAction, ACTION } from '@/lib/audit';

// ── Allowed status transitions ──────────────────────────────────────────────
const TRANSITIONS = {
  draft:      ['published', 'cancelled'],
  published:  ['closed', 'cancelled'],
  closed:     [],
  cancelled:  [],
};

// ── GET /api/rfqs/[id] ─────────────────────────────────────────────────────
export async function GET(request, { params }) {
  const companyId = request.headers.get('x-company-id');
  const role      = request.headers.get('x-user-role');
  const { id }    = await params;

  if (!companyId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const allowed = requireRole(role, ['company_admin', 'manager', 'employee']);
  if (!allowed) return Response.json({ error: 'Forbidden' }, { status: 403 });

  try {
    // Auto-close if deadline has passed
    await autoCloseIfExpired(id, companyId);

    // Core RFQ — query() already returns the rows array directly
    const rfqRows = await query(
      `SELECT r.*, u.name AS created_by_name
         FROM rfqs r
         JOIN users u ON u.id = r.created_by
        WHERE r.id = ? AND r.company_id = ?`,
      [id, companyId]
    );
    if (rfqRows.length === 0) {
      return Response.json({ error: 'RFQ not found' }, { status: 404 });
    }

    // Line items
    const items = await query(
      `SELECT * FROM rfq_items WHERE rfq_id = ? ORDER BY sort_order ASC, id ASC`,
      [id]
    );

    // Invited vendors with vendor info
    const vendors = await query(
      `SELECT rv.id, rv.vendor_id, rv.status AS invite_status,
              rv.invited_at, rv.updated_at,
              v.name AS vendor_name, v.email AS vendor_email,
              v.status AS vendor_status
         FROM rfq_vendors rv
         JOIN vendors v ON v.id = rv.vendor_id
        WHERE rv.rfq_id = ? AND rv.company_id = ?
        ORDER BY rv.invited_at ASC`,
      [id, companyId]
    );

    return Response.json({
      message: 'OK',
      data: { rfq: rfqRows[0], items, vendors },
    });
  } catch (err) {
    console.error('GET /api/rfqs/[id] error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── PUT /api/rfqs/[id] ─────────────────────────────────────────────────────
export async function PUT(request, { params }) {
  const companyId = request.headers.get('x-company-id');
  const role      = request.headers.get('x-user-role');
  const { id }    = await params;

  if (!companyId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const allowed = requireRole(role, ['company_admin', 'manager']);
  if (!allowed) return Response.json({ error: 'Forbidden' }, { status: 403 });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  try {
    const rfqRows = await query(
      `SELECT * FROM rfqs WHERE id = ? AND company_id = ?`,
      [id, companyId]
    );
    if (rfqRows.length === 0) {
      return Response.json({ error: 'RFQ not found' }, { status: 404 });
    }
    const rfq = rfqRows[0];

    if (body.status && body.status !== rfq.status) {
      const allowed_transitions = TRANSITIONS[rfq.status] || [];
      if (!allowed_transitions.includes(body.status)) {
        return Response.json(
          { error: `Cannot transition from '${rfq.status}' to '${body.status}'` },
          { status: 422 }
        );
      }
    }

    if ((rfq.status === 'closed' || rfq.status === 'cancelled') && !body.status) {
      return Response.json(
        { error: `Cannot edit a ${rfq.status} RFQ` },
        { status: 422 }
      );
    }

    // Once published, only status transitions are allowed — field edits are locked
    const isFieldEdit = body.title !== undefined || body.description !== undefined ||
      body.deadline !== undefined || body.budget !== undefined || body.currency !== undefined;
    if (rfq.status === 'published' && isFieldEdit && !body.status) {
      return Response.json(
        { error: 'RFQ details cannot be edited after publishing. Only status transitions are allowed.' },
        { status: 422 }
      );
    }

    const updates = {};
    if (body.title       !== undefined) updates.title       = body.title.trim();
    if (body.description !== undefined) updates.description = body.description?.trim() || null;
    if (body.deadline    !== undefined) updates.deadline    = body.deadline  || null;
    if (body.budget      !== undefined) updates.budget      = body.budget    || null;
    if (body.currency    !== undefined) updates.currency    = body.currency;
    if (body.status      !== undefined) updates.status      = body.status;

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: 'No fields to update' }, { status: 422 });
    }

    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const setValues  = Object.values(updates);

    await query(
      `UPDATE rfqs SET ${setClauses} WHERE id = ? AND company_id = ?`,
      [...setValues, id, companyId]
    );

    const updated = await query(
      `SELECT r.*, u.name AS created_by_name
         FROM rfqs r JOIN users u ON u.id = r.created_by
        WHERE r.id = ?`,
      [id]
    );

    // When an RFQ is published, notify all invited vendor users
    if (updates.status === 'published') {      try {
        const vendorUsers = await query(
          `SELECT u.id AS userId, u.company_id AS companyId
             FROM rfq_vendors rv
             JOIN vendors v ON v.id = rv.vendor_id
             JOIN users   u ON u.vendor_id = v.id AND u.role = 'vendor_user'
            WHERE rv.rfq_id = ?`,
          [id]
        );
        if (vendorUsers.length) {
          await createNotifications(vendorUsers, {
            type:  'rfq_published',
            title: `New RFQ available: "${rfq.title}"`,
            body:  'You have been invited to submit a bid. Review the RFQ and place your bid before the deadline.',
            link:  `/dashboard/bids/${id}`,
          });
        }
      } catch (_) { /* notification errors must not fail the request */ }
    }

    // Log the update action
    const actionType = updates.status ? ACTION.RFQ_STATUS_CHANGED : ACTION.RFQ_UPDATED;
    await logAction(request, {
      userId:       parseInt(request.headers.get('x-user-id'), 10) || null,
      userEmail:    request.headers.get('x-user-email') || null,
      actionType,
      resourceType: 'rfq',
      resourceId:   parseInt(id, 10),
      resourceName: rfq.title,
      changes:      updates.status ? { from: rfq.status, to: updates.status } : null,
      status:       'success',
    });

    return Response.json({ message: 'RFQ updated', data: { rfq: updated[0] } });
  } catch (err) {
    console.error('PUT /api/rfqs/[id] error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── DELETE /api/rfqs/[id] ──────────────────────────────────────────────────
export async function DELETE(request, { params }) {
  const companyId = request.headers.get('x-company-id');
  const role      = request.headers.get('x-user-role');
  const { id }    = await params;

  if (!companyId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const allowed = requireRole(role, ['company_admin', 'manager']);
  if (!allowed) return Response.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const rfqRows = await query(
      `SELECT * FROM rfqs WHERE id = ? AND company_id = ?`,
      [id, companyId]
    );
    if (rfqRows.length === 0) {
      return Response.json({ error: 'RFQ not found' }, { status: 404 });
    }
    const rfq = rfqRows[0];

    if (rfq.status !== 'draft') {
      return Response.json(
        { error: `Only draft RFQs can be cancelled via DELETE. Current status: ${rfq.status}` },
        { status: 422 }
      );
    }

    await query(
      `UPDATE rfqs SET status = 'cancelled' WHERE id = ? AND company_id = ?`,
      [id, companyId]
    );

    return Response.json({ message: 'RFQ cancelled' });
  } catch (err) {
    console.error('DELETE /api/rfqs/[id] error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
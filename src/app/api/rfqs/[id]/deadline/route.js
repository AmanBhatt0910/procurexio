import { query } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import { sendRFQDeadlineExtendedEmails } from '@/lib/rfqUtils';
import { logAction, ACTION } from '@/lib/audit';

// PUT /api/rfqs/[id]/deadline — extend published RFQ deadline + notify vendors
export async function PUT(request, { params }) {
  const companyId = request.headers.get('x-company-id');
  const role = request.headers.get('x-user-role');
  const { id } = await params;

  if (!companyId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireRole(role, ['company_admin', 'manager'])) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsedDeadline = new Date(body?.deadline);
  const now = new Date();
  if (!body?.deadline || Number.isNaN(parsedDeadline.getTime())) {
    return Response.json({ error: 'A valid deadline is required' }, { status: 422 });
  }
  if (parsedDeadline <= now) {
    return Response.json({ error: 'New deadline must be in the future' }, { status: 422 });
  }

  try {
    const rows = await query(
      `SELECT id, title, status, deadline
         FROM rfqs
        WHERE id = ? AND company_id = ?`,
      [id, companyId]
    );
    if (!rows.length) return Response.json({ error: 'RFQ not found' }, { status: 404 });
    const rfq = rows[0];

    if (rfq.status !== 'published') {
      return Response.json(
        { error: `Deadline can only be extended while RFQ is published (current status: ${rfq.status})` },
        { status: 422 }
      );
    }

    if (rfq.deadline && parsedDeadline <= new Date(rfq.deadline)) {
      return Response.json({ error: 'New deadline must be later than the current deadline' }, { status: 422 });
    }

    await query(
      `UPDATE rfqs
          SET deadline = ?, updated_at = NOW()
        WHERE id = ? AND company_id = ?`,
      [parsedDeadline, id, companyId]
    );

    try {
      await sendRFQDeadlineExtendedEmails(id, rfq.deadline, parsedDeadline);
    } catch (emailErr) {
      console.error(`PUT /api/rfqs/${id}/deadline email error:`, emailErr);
      /* email errors must not fail request */
    }

    await logAction(request, {
      userId: parseInt(request.headers.get('x-user-id'), 10) || null,
      userEmail: request.headers.get('x-user-email') || null,
      actionType: ACTION.RFQ_UPDATED,
      resourceType: 'rfq',
      resourceId: parseInt(id, 10),
      resourceName: rfq.title,
      changes: {
        field: 'deadline',
        from: rfq.deadline,
        to: parsedDeadline.toISOString(),
      },
      status: 'success',
    });

    const updated = await query(`SELECT * FROM rfqs WHERE id = ? AND company_id = ?`, [id, companyId]);
    return Response.json({ message: 'RFQ deadline extended', data: { rfq: updated[0] } });
  } catch (err) {
    console.error('PUT /api/rfqs/[id]/deadline error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

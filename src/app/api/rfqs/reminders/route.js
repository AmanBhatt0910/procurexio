import { sendDueRFQDeadlineReminders } from '@/lib/rfqUtils';
import { requireRole } from '@/lib/rbac';

// POST /api/rfqs/reminders
// - Cron mode: Authorization: Bearer <RFQ_REMINDER_CRON_TOKEN>
// - User mode: company_admin / manager can trigger for their own company
export async function POST(request) {
  const authHeader = request.headers.get('authorization') || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const cronToken = process.env.RFQ_REMINDER_CRON_TOKEN || '';

  const companyId = request.headers.get('x-company-id');
  const role = request.headers.get('x-user-role');
  const cronAuthorized = Boolean(cronToken) && Boolean(bearer) && bearer === cronToken;
  const userAuthorized = Boolean(companyId) && requireRole(role, ['company_admin', 'manager']);

  if (!cronAuthorized && !userAuthorized) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body = {};
  try { body = await request.json(); } catch {}

  try {
    const summary = await sendDueRFQDeadlineReminders({
      companyId: userAuthorized ? companyId : (body.companyId || null),
      rfqId: body.rfqId || null,
    });
    return Response.json({ message: 'Reminder processing complete', data: summary });
  } catch (err) {
    console.error('POST /api/rfqs/reminders error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

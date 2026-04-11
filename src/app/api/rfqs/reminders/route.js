import { sendDueRFQDeadlineReminders } from '@/lib/rfqUtils';
import { requireRole } from '@/lib/rbac';

/**
 * GET /api/rfqs/reminders
 * Vercel Cron handler — called automatically every 6 hours.
 * Vercel sends Authorization: Bearer <CRON_SECRET> automatically.
 * Sends 12-hour and 6-hour deadline reminder emails to all invited vendors.
 */
export async function GET(request) {
  const authHeader = request.headers.get('authorization') || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const cronSecret = process.env.CRON_SECRET || '';

  if (!cronSecret || bearer !== cronSecret) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const summary = await sendDueRFQDeadlineReminders({});
    return Response.json({ message: 'Reminder processing complete', data: summary });
  } catch (err) {
    console.error('GET /api/rfqs/reminders error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
  const userAuthorized = Boolean(companyId) && requireRole(role, ['company_admin', 'manager']) === true;

  if (!cronAuthorized && !userAuthorized) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body = {};
  try { body = await request.json(); } catch {}

  try {
    const summary = await sendDueRFQDeadlineReminders({
      companyId: userAuthorized ? companyId : null,
      rfqId: body.rfqId || null,
    });
    return Response.json({ message: 'Reminder processing complete', data: summary });
  } catch (err) {
    console.error('POST /api/rfqs/reminders error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

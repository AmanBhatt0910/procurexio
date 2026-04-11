import { autoCloseAllExpired } from '@/lib/rfqUtils';
import { requireRole } from '@/lib/rbac';

/**
 * GET /api/rfqs/close-expired
 * Vercel Cron handler — called automatically at 00:00 UTC daily.
 * Vercel sends Authorization: Bearer <CRON_SECRET> automatically.
 *
 * Deadline semantics: a deadline of "12 Jan" means the RFQ stays open until
 * 11:59 PM on the 12th and closes at 12:00 AM (midnight) on the 13th.
 * This is enforced by getEffectiveDeadlineDate() in src/lib/deadline.js which
 * adds one day when the stored deadline time is midnight / date-only.
 */
export async function GET(request) {
  const authHeader = request.headers.get('authorization') || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const cronSecret = process.env.CRON_SECRET || '';

  if (!cronSecret || bearer !== cronSecret) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const summary = await autoCloseAllExpired({});
    return Response.json({ message: 'Expired RFQ processing complete', data: summary });
  } catch (err) {
    console.error('GET /api/rfqs/close-expired error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/rfqs/close-expired
// - Cron mode: Authorization: Bearer <RFQ_CLOSE_CRON_TOKEN>
// - User mode: company_admin / manager can trigger for their own company
export async function POST(request) {
  const authHeader = request.headers.get('authorization') || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const cronToken = process.env.RFQ_CLOSE_CRON_TOKEN || '';

  const companyId = request.headers.get('x-company-id');
  const role = request.headers.get('x-user-role');
  const cronAuthorized = Boolean(cronToken) && Boolean(bearer) && bearer === cronToken;
  const userAuthorized = Boolean(companyId) && requireRole(role, ['company_admin', 'manager']) === true;

  if (!cronAuthorized && !userAuthorized) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const summary = await autoCloseAllExpired({
      companyId: userAuthorized && !cronAuthorized ? companyId : null,
    });
    return Response.json({ message: 'Expired RFQ processing complete', data: summary });
  } catch (err) {
    console.error('POST /api/rfqs/close-expired error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

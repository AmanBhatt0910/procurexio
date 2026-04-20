import { sendDueRFQDeadlineReminders } from '@/lib/rfq/rfqUtils';
import { requireUserContext } from '@/lib/auth/authUtils';
import { safeCompare } from '@/lib/security/security';

/**
 * GET /api/rfqs/reminders
 * Vercel Cron handler — called automatically every 6 hours (HTTPS only).
 * Vercel sends Authorization: Bearer <CRON_SECRET> automatically.
 * Sends 12-hour and 6-hour deadline reminder emails to all invited vendors.
 */
export async function GET(request) {
  const authHeader = request.headers.get('authorization') || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const cronSecret = process.env.CRON_SECRET || '';

  // CRITICAL: Use constant-time comparison to prevent timing attacks
  if (!cronSecret || !safeCompare(bearer, cronSecret)) {
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
// - Cron mode: Authorization: Bearer <RFQ_REMINDER_CRON_TOKEN> (HTTPS only)
// - User mode: company_admin / manager can trigger for their own company (requires JWT)
export async function POST(request) {
  const authHeader = request.headers.get('authorization') || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const cronToken = process.env.RFQ_REMINDER_CRON_TOKEN || '';

  // CRITICAL: Use constant-time comparison
  const cronAuthorized = Boolean(cronToken) && Boolean(bearer) && safeCompare(bearer, cronToken);

  let userAuthorized = false;
  let companyId = null;

  // If not authorized via cron token, try user mode with JWT validation
  if (!cronAuthorized) {
    try {
      const validated = await requireUserContext(request, ['company_admin', 'manager'], true);
      userAuthorized = true;
      companyId = validated.companyId;
    } catch {
      userAuthorized = false;
    }
  }

  if (!cronAuthorized && !userAuthorized) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body = {};
  try { body = await request.json(); } catch {}

  try {
    const summary = await sendDueRFQDeadlineReminders({
      // Only apply company filter for user-mode requests
      companyId: userAuthorized && !cronAuthorized ? companyId : null,
      rfqId: body.rfqId || null,
    });
    return Response.json({ message: 'Reminder processing complete', data: summary });
  } catch (err) {
    console.error('POST /api/rfqs/reminders error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

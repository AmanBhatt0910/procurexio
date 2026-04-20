import { autoCloseAllExpired } from '@/lib/rfq/rfqUtils';
import { requireUserContext } from '@/lib/auth/authUtils';
import { safeCompare } from '@/lib/security/security';

/**
 * GET /api/rfqs/close-expired
 * Vercel Cron handler — called automatically at 00:00 UTC daily.
 * Vercel sends Authorization: Bearer <CRON_SECRET> automatically.
 * HTTPS ONLY in production.
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

  // CRITICAL: Use constant-time comparison to prevent timing attacks on cron tokens
  if (!cronSecret || !safeCompare(bearer, cronSecret)) {
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
// - Cron mode: Authorization: Bearer <RFQ_CLOSE_CRON_TOKEN> (HTTPS only)
// - User mode: company_admin / manager can trigger for their own company (requires JWT)
export async function POST(request) {
  const authHeader = request.headers.get('authorization') || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const cronToken = process.env.RFQ_CLOSE_CRON_TOKEN || '';

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

  try {
    const summary = await autoCloseAllExpired({
      // Only apply company filter for user-mode requests
      companyId: userAuthorized && !cronAuthorized ? companyId : null,
    });
    return Response.json({ message: 'Expired RFQ processing complete', data: summary });
  } catch (err) {
    console.error('POST /api/rfqs/close-expired error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

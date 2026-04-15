import { safeCompare } from '@/lib/security';

/**
 * GET /api/cron/status
 *
 * Health-check endpoint for the Node.js cron scheduler.
 * Returns the list of registered jobs and their schedules.
 *
 * Requires:  Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request) {
  const authHeader = request.headers.get('authorization') || '';
  const bearer     = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const cronSecret = process.env.CRON_SECRET || '';

  // CRITICAL: Use constant-time comparison to prevent timing attacks
  if (!cronSecret || !safeCompare(bearer, cronSecret)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  return Response.json({
    status:    'ok',
    message:   'Cron scheduler is active',
    timestamp: new Date().toISOString(),
    baseUrl:   process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001',
    jobs: [
      {
        name:        'close-expired',
        schedule:    '0 0 * * *',
        description: 'Close expired RFQs (daily at midnight UTC)',
        endpoint:    '/api/rfqs/close-expired',
      },
      {
        name:        'reminders',
        schedule:    '0 */6 * * *',
        description: 'Send deadline reminders (every 6 hours UTC)',
        endpoint:    '/api/rfqs/reminders',
      },
    ],
  });
}

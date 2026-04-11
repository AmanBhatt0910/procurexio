import { autoCloseAllExpired } from '@/lib/rfqUtils';
import { requireRole } from '@/lib/rbac';

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

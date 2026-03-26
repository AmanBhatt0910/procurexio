// src/app/api/company/settings/route.js
import pool from '@/lib/db';

// GET /api/company/settings
export async function GET(request) {
  const companyId = request.headers.get('x-company-id');

  if (!companyId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [rows] = await pool.query(
      `SELECT timezone, currency, logo_url, updated_at
       FROM   company_settings
       WHERE  company_id = ?`,
      [companyId]
    );

    // Return defaults if settings row doesn't exist yet
    const data = rows[0] ?? { timezone: 'UTC', currency: 'USD', logo_url: null };
    return Response.json({ message: 'OK', data });
  } catch (err) {
    console.error('[GET /api/company/settings]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/company/settings
export async function PUT(request) {
  const companyId = request.headers.get('x-company-id');
  const role      = request.headers.get('x-user-role');

  if (!companyId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!['super_admin', 'company_admin'].includes(role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { timezone, currency, logo_url } = body;

  if (!timezone || !currency) {
    return Response.json({ error: 'timezone and currency are required' }, { status: 400 });
  }

  try {
    await pool.query(
      `INSERT INTO company_settings (company_id, timezone, currency, logo_url)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         timezone  = VALUES(timezone),
         currency  = VALUES(currency),
         logo_url  = VALUES(logo_url)`,
      [companyId, timezone, currency, logo_url ?? null]
    );

    return Response.json({ message: 'Settings updated' });
  } catch (err) {
    console.error('[PUT /api/company/settings]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
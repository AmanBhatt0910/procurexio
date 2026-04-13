// src/app/api/company/route.js
import pool from '@/lib/db';
import { validateUserContext } from '@/lib/authUtils';

// GET /api/company — fetch own company profile
export async function GET(request) {
  // CRITICAL: Validate against JWT, not headers
  const validated = await validateUserContext(request, {
    requireCompanyId: true,
  });

  if (!validated.ok) {
    return Response.json({ error: validated.error }, { status: validated.status });
  }

  const { companyId, role } = validated;

  // vendor_user should not access company profile details
  if (role === 'vendor_user') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.name, c.email, c.plan, c.created_at,
              cs.timezone, cs.currency, cs.logo_url
       FROM   companies c
       LEFT JOIN company_settings cs ON cs.company_id = c.id
       WHERE  c.id = ?`,
      [companyId]
    );

    if (!rows.length) {
      return Response.json({ error: 'Company not found' }, { status: 404 });
    }

    return Response.json({ message: 'OK', data: rows[0] });
  } catch (err) {
    console.error('[GET /api/company]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/company — update company profile
export async function PUT(request) {
  // CRITICAL: Validate against JWT, not headers
  const validated = await validateUserContext(request, {
    requireRole: ['super_admin', 'company_admin'],
    requireCompanyId: true,
  });

  if (!validated.ok) {
    return Response.json({ error: validated.error }, { status: validated.status });
  }

  const { companyId } = validated;

  const body = await request.json();
  const { name, email } = body;

  if (!name || !email) {
    return Response.json({ error: 'name and email are required' }, { status: 400 });
  }

  try {
    await pool.query(
      'UPDATE companies SET name = ?, email = ? WHERE id = ?',
      [name.trim(), email.trim().toLowerCase(), companyId]
    );

    return Response.json({ message: 'Company profile updated' });
  } catch (err) {
    console.error('[PUT /api/company]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
// src/app/api/vendors/[id]/contacts/route.js
import { query, getConnection } from '@/lib/db';
import { hasPermission, PERMISSIONS } from '@/lib/auth/rbac';
import { validateUserContext } from '@/lib/auth/authUtils';
import { validateNumericId } from '@/lib/auth/authUtils';

// ─── GET /api/vendors/[id]/contacts ──────────────────
export async function GET(request, { params }) {
  // CRITICAL: Validate against JWT, not headers
  const validated = await validateUserContext(request, {
    requireCompanyId: true,
  });

  if (!validated.ok) {
    return Response.json({ error: validated.error }, { status: validated.status });
  }

  const { companyId, role } = validated;
  const { id: rawId } = await params;

  if (!hasPermission(role, PERMISSIONS.VIEW_VENDORS))
    return Response.json({ error: 'Forbidden' }, { status: 403 });

  // CRITICAL: Validate URL parameter is numeric
  const { ok: idOk, value: id } = validateNumericId(rawId);
  if (!idOk) {
    return Response.json({ error: 'Invalid vendor ID' }, { status: 400 });
  }

  try {
    // Confirm vendor belongs to this company
    const vendors = await query(
      'SELECT id FROM vendors WHERE id = ? AND company_id = ?',
      [id, companyId]
    );
    if (!vendors.length) return Response.json({ error: 'Vendor not found' }, { status: 404 });

    const contacts = await query(
      `SELECT id, name, email, phone, is_primary, created_at
       FROM vendor_contacts
       WHERE vendor_id = ? AND company_id = ?
       ORDER BY is_primary DESC, created_at ASC`,
      [id, companyId]
    );

    return Response.json({ message: 'OK', data: contacts });
  } catch (err) {
    console.error('[GET /api/vendors/[id]/contacts]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── POST /api/vendors/[id]/contacts ────────────────────────────
export async function POST(request, { params }) {
  const companyId = request.headers.get('x-company-id');
  const role      = request.headers.get('x-user-role');
  const { id }    = await params;

  if (!companyId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(role, PERMISSIONS.MANAGE_VENDORS))
    return Response.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { name, email, phone, is_primary = false } = body;

  if (!name?.trim()) return Response.json({ error: 'Contact name is required' }, { status: 400 });

  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    // Confirm vendor belongs to this company
    const [vendors] = await conn.execute(
      'SELECT id FROM vendors WHERE id = ? AND company_id = ?',
      [id, companyId]
    );
    if (!vendors.length) {
      await conn.rollback();
      return Response.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // If this contact is primary, demote any existing primary
    if (is_primary) {
      await conn.execute(
        'UPDATE vendor_contacts SET is_primary = 0 WHERE vendor_id = ? AND company_id = ?',
        [id, companyId]
      );
    }

    const [result] = await conn.execute(
      `INSERT INTO vendor_contacts (vendor_id, company_id, name, email, phone, is_primary)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        companyId,
        name.trim(),
        email?.trim().toLowerCase() || null,
        phone?.trim() || null,
        is_primary ? 1 : 0,
      ]
    );

    await conn.commit();

    return Response.json(
      { message: 'Contact added', data: { id: result.insertId } },
      { status: 201 }
    );
  } catch (err) {
    await conn.rollback();
    console.error('[POST /api/vendors/[id]/contacts]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    conn.release();
  }
}
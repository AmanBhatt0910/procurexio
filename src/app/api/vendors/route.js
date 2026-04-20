// src/app/api/vendors/route.js
import { query, queryRaw, getConnection } from '@/lib/db';
import { hasPermission, PERMISSIONS } from '@/lib/auth/rbac';
import { logAction, ACTION } from '@/lib/logging/audit';
import { validateUserContext } from '@/lib/auth/authUtils';

// ─── GET /api/vendors ────────────────────────────────────────────
export async function GET(request) {
  // CRITICAL: Validate against JWT, not headers
  const validated = await validateUserContext(request, {
    requireCompanyId: true,
  });

  if (!validated.ok) {
    return Response.json({ error: validated.error }, { status: validated.status });
  }

  const { companyId, role } = validated;

  // RBAC: Check permission
  if (!hasPermission(role, PERMISSIONS.VIEW_VENDORS)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status   = searchParams.get('status')   || '';
  const category = searchParams.get('category') || '';
  const search   = searchParams.get('search')   || '';
  const page     = Math.max(1, parseInt(searchParams.get('page')  || '1',  10));
  const limit    = Math.max(1, parseInt(searchParams.get('limit') || '10', 10));
  const offset   = (page - 1) * limit;

  try {
    const conditions = ['v.company_id = ?'];
    const params     = [companyId];

    if (status)   { conditions.push('v.status = ?'); params.push(status); }
    if (search)   { conditions.push('(v.name LIKE ? OR v.email LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    if (category) { conditions.push('EXISTS (SELECT 1 FROM vendor_category_map vcm WHERE vcm.vendor_id = v.id AND vcm.category_id = ?)'); params.push(category); }

    const where = conditions.join(' AND ');

    const countRows = await query(
      `SELECT COUNT(*) AS total FROM vendors v WHERE ${where}`,
      params
    );
    const total = countRows[0].total;

    // Use queryRaw (pool.query) — pool.execute throws ER_WRONG_ARGUMENTS for LIMIT/OFFSET params
    const vendors = await queryRaw(
      `SELECT
         v.id, v.name, v.email, v.phone, v.website, v.status, v.created_at,
         (SELECT vc.name FROM vendor_contacts vc
          WHERE vc.vendor_id = v.id AND vc.is_primary = 1 LIMIT 1) AS primary_contact,
         (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', cat.id, 'name', cat.name, 'color', cat.color))
          FROM vendor_category_map vcm
          JOIN vendor_categories cat ON cat.id = vcm.category_id
          WHERE vcm.vendor_id = v.id) AS categories
       FROM vendors v
       WHERE ${where}
       ORDER BY v.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const rows = vendors.map(v => ({
      ...v,
      categories: v.categories
        ? (typeof v.categories === 'string' ? JSON.parse(v.categories) : v.categories)
        : [],
    }));

    return Response.json({
      message: 'OK',
      data: rows,
      pagination: { total, page, limit, pages: Math.ceil(total / limit), totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[GET /api/vendors]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── POST /api/vendors ───────────────────────────────────────────
export async function POST(request) {
  // CRITICAL: Validate against JWT, not headers
  const validated = await validateUserContext(request, {
    requireCompanyId: true,
  });

  if (!validated.ok) {
    return Response.json({ error: validated.error }, { status: validated.status });
  }

  const { companyId, role } = validated;

  if (!hasPermission(role, PERMISSIONS.MANAGE_VENDORS))
    return Response.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { name, email, phone, gst, website, address, status = 'active', notes, category_ids = [] } = body;

  if (!name?.trim()) return Response.json({ error: 'Vendor name is required' }, { status: 400 });

  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.execute(
      `INSERT INTO vendors (company_id, name, email, phone, website, address, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [companyId, name.trim(), email?.trim().toLowerCase() || null, phone?.trim() || null,
       (gst?.trim() || website?.trim() || null), address?.trim() || null, status, notes?.trim() || null]
    );
    const vendorId = result.insertId;

    if (category_ids.length) {
      const cats = await query(
        `SELECT id FROM vendor_categories WHERE id IN (${category_ids.map(() => '?').join(',')}) AND company_id = ?`,
        [...category_ids, companyId]
      );
      for (const cat of cats) {
        await conn.execute(
          'INSERT IGNORE INTO vendor_category_map (vendor_id, category_id) VALUES (?, ?)',
          [vendorId, cat.id]
        );
      }
    }

    await conn.commit();
    await logAction(request, {
      userId:       parseInt(request.headers.get('x-user-id'), 10) || null,
      userEmail:    request.headers.get('x-user-email') || null,
      actionType:   ACTION.VENDOR_CREATED,
      resourceType: 'vendor',
      resourceId:   vendorId,
      resourceName: name.trim(),
      status:       'success',
    });
    return Response.json({ message: 'Vendor created', data: { id: vendorId } }, { status: 201 });
  } catch (err) {
    await conn.rollback();
    console.error('[POST /api/vendors]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    conn.release();
  }
}
// src/app/api/vendors/[id]/route.js
import { query, getConnection } from '@/lib/db';
import { hasPermission, PERMISSIONS } from '@/lib/rbac';

async function getVendor(vendorId, companyId) {
  const rows = await query(
    `SELECT v.id, v.name, v.email, v.phone, v.website, v.address, v.status, v.notes, v.created_at
     FROM vendors v
     WHERE v.id = ? AND v.company_id = ?`,
    [vendorId, companyId]
  );
  return rows[0] || null;
}

// ─── GET /api/vendors/[id] ───────────────────────────────────────
export async function GET(request, { params }) {
  const companyId = request.headers.get('x-company-id');
  const role      = request.headers.get('x-user-role');
  const { id }    = await params;

  if (!companyId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(role, PERMISSIONS.VIEW_VENDORS))
    return Response.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const vendor = await getVendor(id, companyId);
    if (!vendor) return Response.json({ error: 'Vendor not found' }, { status: 404 });

    // Contacts
    const contacts = await query(
      `SELECT id, name, email, phone, is_primary, created_at
       FROM vendor_contacts
       WHERE vendor_id = ? AND company_id = ?
       ORDER BY is_primary DESC, created_at ASC`,
      [id, companyId]
    );

    // Categories
    const categories = await query(
      `SELECT vc.id, vc.name, vc.color
       FROM vendor_category_map vcm
       JOIN vendor_categories vc ON vc.id = vcm.category_id
       WHERE vcm.vendor_id = ? AND vc.company_id = ?`,
      [id, companyId]
    );

    return Response.json({ message: 'OK', data: { ...vendor, contacts, categories } });
  } catch (err) {
    console.error('[GET /api/vendors/[id]]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── PUT /api/vendors/[id] ───────────────────────────────────────
export async function PUT(request, { params }) {
  const companyId = request.headers.get('x-company-id');
  const role      = request.headers.get('x-user-role');
  const { id }    = await params;

  if (!companyId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(role, PERMISSIONS.MANAGE_VENDORS))
    return Response.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { name, email, phone, website, address, status, notes, category_ids } = body;

  if (!name?.trim()) return Response.json({ error: 'Vendor name is required' }, { status: 400 });

  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.execute(
      `UPDATE vendors
       SET name = ?, email = ?, phone = ?, website = ?, address = ?, status = ?, notes = ?
       WHERE id = ? AND company_id = ?`,
      [
        name.trim(),
        email?.trim().toLowerCase() || null,
        phone?.trim() || null,
        website?.trim() || null,
        address?.trim() || null,
        status || 'pending',
        notes?.trim() || null,
        id,
        companyId,
      ]
    );

    if (result.affectedRows === 0)
      return Response.json({ error: 'Vendor not found' }, { status: 404 });

    // Sync categories if provided
    if (Array.isArray(category_ids)) {
      await conn.execute('DELETE FROM vendor_category_map WHERE vendor_id = ?', [id]);

      if (category_ids.length) {
        const cats = await query(
          `SELECT id FROM vendor_categories WHERE id IN (${category_ids.map(() => '?').join(',')}) AND company_id = ?`,
          [...category_ids, companyId]
        );
        for (const cat of cats) {
          await conn.execute(
            'INSERT IGNORE INTO vendor_category_map (vendor_id, category_id) VALUES (?, ?)',
            [id, cat.id]
          );
        }
      }
    }

    await conn.commit();
    return Response.json({ message: 'Vendor updated' });
  } catch (err) {
    await conn.rollback();
    console.error('[PUT /api/vendors/[id]]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    conn.release();
  }
}

// ─── DELETE /api/vendors/[id] ────────────────────────────────────
// Soft-delete: sets status = 'inactive'
export async function DELETE(request, { params }) {
  const companyId = request.headers.get('x-company-id');
  const role      = request.headers.get('x-user-role');
  const { id }    = await params;

  if (!companyId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(role, PERMISSIONS.MANAGE_VENDORS))
    return Response.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const [result] = await query(
      'UPDATE vendors SET status = ? WHERE id = ? AND company_id = ?',
      ['inactive', id, companyId]
    );

    if (result.affectedRows === 0)
      return Response.json({ error: 'Vendor not found' }, { status: 404 });

    return Response.json({ message: 'Vendor deactivated' });
  } catch (err) {
    console.error('[DELETE /api/vendors/[id]]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
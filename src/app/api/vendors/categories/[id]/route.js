// src/app/api/vendors/categories/[id]/route.js
import { query } from '@/lib/db';
import { hasPermission, PERMISSIONS } from '@/lib/auth/rbac';

// ─── DELETE /api/vendors/categories/[id] ────────────────────────
export async function DELETE(request, { params }) {
  const companyId = request.headers.get('x-company-id');
  const role      = request.headers.get('x-user-role');
  const { id }    = await params;

  if (!companyId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(role, PERMISSIONS.MANAGE_VENDORS))
    return Response.json({ error: 'Forbidden' }, { status: 403 });

  try {
    // company_id guard prevents cross-tenant deletes
    const result = await query(
      'DELETE FROM vendor_categories WHERE id = ? AND company_id = ?',
      [id, companyId]
    );

    if (result.affectedRows === 0)
      return Response.json({ error: 'Category not found' }, { status: 404 });

    // vendor_category_map rows are cascade-deleted by FK
    return Response.json({ message: 'Category deleted' });
  } catch (err) {
    console.error('[DELETE /api/vendors/categories/[id]]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
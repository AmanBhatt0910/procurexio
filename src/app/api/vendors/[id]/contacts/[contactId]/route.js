// src/app/api/vendors/[id]/contacts/[contactId]/route.js
import { query } from '@/lib/db';
import { hasPermission, PERMISSIONS } from '@/lib/rbac';

// ─── DELETE /api/vendors/[id]/contacts/[contactId] ───────────────
export async function DELETE(request, { params }) {
  const companyId        = request.headers.get('x-company-id');
  const role             = request.headers.get('x-user-role');
  const { id, contactId } = await params;

  if (!companyId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(role, PERMISSIONS.MANAGE_VENDORS))
    return Response.json({ error: 'Forbidden' }, { status: 403 });

  try {
    // company_id check on vendor_contacts prevents cross-tenant deletes
    const result = await query(
      'DELETE FROM vendor_contacts WHERE id = ? AND vendor_id = ? AND company_id = ?',
      [contactId, id, companyId]
    );

    if (result.affectedRows === 0)
      return Response.json({ error: 'Contact not found' }, { status: 404 });

    return Response.json({ message: 'Contact removed' });
  } catch (err) {
    console.error('[DELETE /api/vendors/[id]/contacts/[contactId]]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
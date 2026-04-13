// src/app/api/vendors/categories/route.js
import { query } from '@/lib/db';
import { hasPermission, PERMISSIONS } from '@/lib/rbac';
import { validateUserContext } from '@/lib/authUtils';

// Preset palette — auto-assigned round-robin on creation
const PALETTE = [
  '#3b6fd4', // blue
  '#2e8f6e', // teal
  '#b85c1a', // burnt orange
  '#7c3aed', // violet
  '#be185d', // pink
  '#0f766e', // cyan-dark
  '#ca8a04', // amber
  '#15803d', // green
];

// ─── GET /api/vendors/categories ────────────────────────────────
export async function GET(request) {
  // CRITICAL: Validate against JWT, not headers
  const validated = await validateUserContext(request, {
    requireCompanyId: true,
  });

  if (!validated.ok) {
    return Response.json({ error: validated.error }, { status: validated.status });
  }

  const { companyId, role } = validated;

  if (!hasPermission(role, PERMISSIONS.VIEW_VENDORS))
    return Response.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const categories = await query(
      `SELECT id, name, color, created_at
       FROM vendor_categories
       WHERE company_id = ?
       ORDER BY name ASC`,
      [companyId]
    );

    return Response.json({ message: 'OK', data: categories });
  } catch (err) {
    console.error('[GET /api/vendors/categories]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── POST /api/vendors/categories ───────────────────────────────
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
  const { name } = body;

  if (!name?.trim()) return Response.json({ error: 'Category name is required' }, { status: 400 });

  try {
    // Prevent duplicate names within the same company
    const existing = await query(
      'SELECT id FROM vendor_categories WHERE company_id = ? AND name = ?',
      [companyId, name.trim()]
    );
    if (existing.length)
      return Response.json({ error: 'Category already exists' }, { status: 409 });

    // Pick next color from palette based on existing count
    const countRows = await query(
      'SELECT COUNT(*) AS total FROM vendor_categories WHERE company_id = ?',
      [companyId]
    );
    const color = PALETTE[countRows[0].total % PALETTE.length];

    const result = await query(
      'INSERT INTO vendor_categories (company_id, name, color) VALUES (?, ?, ?)',
      [companyId, name.trim(), color]
    );

    return Response.json(
      { message: 'Category created', data: { id: result.insertId, name: name.trim(), color } },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/vendors/categories]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
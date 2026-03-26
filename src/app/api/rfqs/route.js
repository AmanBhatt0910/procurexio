// src/app/api/rfqs/route.js
import { query, getConnection } from '@/lib/db';
import { requirePermission, PERMISSIONS } from '@/lib/rbac';

// ── Helpers ────────────────────────────────────────────────────────────────

async function nextReferenceNumber(conn, companyId) {
  const year = new Date().getFullYear();
  const prefix = `RFQ-${year}-`;

  const [rows] = await conn.execute(
    `SELECT reference_number
       FROM rfqs
      WHERE company_id = ?
        AND reference_number LIKE ?
      ORDER BY id DESC
      LIMIT 1
      FOR UPDATE`,
    [companyId, `${prefix}%`]
  );

  let seq = 1;
  if (rows.length > 0) {
    const last = rows[0].reference_number;
    const lastSeq = parseInt(last.split('-')[2], 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  return `${prefix}${String(seq).padStart(5, '0')}`;
}

// ── GET /api/rfqs ──────────────────────────────────────────────────────────

export async function GET(request) {
  const companyId = request.headers.get('x-company-id');
  const role = request.headers.get('x-user-role');

  if (!companyId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ✅ RBAC FIX
  try {
    requirePermission({ role }, [PERMISSIONS.VIEW_RFQ]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);

  const status = searchParams.get('status') || null;
  const search = searchParams.get('search') || null;

  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') || 20)));
  const offset = (page - 1) * pageSize;

  const conditions = ['r.company_id = ?'];
  const params = [companyId];

  if (status) {
    conditions.push('r.status = ?');
    params.push(status);
  }

  if (search) {
    conditions.push('(r.title LIKE ? OR r.reference_number LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const where = conditions.join(' AND ');

  try {
    // ✅ FIX: query returns results directly (not [rows])
    const countRows = await query(
      `SELECT COUNT(*) AS total FROM rfqs r WHERE ${where}`,
      params
    );

    const total = countRows[0].total;

    const rows = await query(
      `SELECT r.id, r.title, r.reference_number, r.status, r.deadline,
              r.budget, r.currency, r.created_at, r.updated_at,
              u.name AS created_by_name,
              (SELECT COUNT(*) FROM rfq_items ri WHERE ri.rfq_id = r.id) AS item_count,
              (SELECT COUNT(*) FROM rfq_vendors rv WHERE rv.rfq_id = r.id) AS vendor_count
         FROM rfqs r
         JOIN users u ON u.id = r.created_by
        WHERE ${where}
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    return Response.json({
      message: 'OK',
      data: {
        rfqs: rows,
        pagination: {
          total,
          page,
          pageSize,
          pages: Math.ceil(total / pageSize),
        },
      },
    });

  } catch (err) {
    console.error('GET /api/rfqs error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST /api/rfqs ─────────────────────────────────────────────────────────

export async function POST(request) {
  const companyId = request.headers.get('x-company-id');
  const userId = request.headers.get('x-user-id');
  const role = request.headers.get('x-user-role');

  if (!companyId || !userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ✅ RBAC FIX
  try {
    requirePermission({ role }, [PERMISSIONS.CREATE_RFQ]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { title, description, deadline, budget, currency, items } = body;

  if (!title || title.trim().length === 0) {
    return Response.json({ error: 'Title is required' }, { status: 422 });
  }

  const conn = await getConnection();

  try {
    await conn.beginTransaction();

    const refNumber = await nextReferenceNumber(conn, companyId);

    const [result] = await conn.execute(
      `INSERT INTO rfqs
         (company_id, title, description, reference_number, status,
          deadline, budget, currency, created_by)
       VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?)`,
      [
        companyId,
        title.trim(),
        description?.trim() || null,
        refNumber,
        deadline || null,
        budget || null,
        currency || 'USD',
        userId,
      ]
    );

    const rfqId = result.insertId;

    if (Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.description?.trim()) continue;

        await conn.execute(
          `INSERT INTO rfq_items
             (rfq_id, company_id, description, quantity, unit, target_price, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            rfqId,
            companyId,
            item.description.trim(),
            item.quantity || 1,
            item.unit || null,
            item.target_price || null,
            i,
          ]
        );
      }
    }

    await conn.commit();

    const [rfqRows] = await conn.execute(
      `SELECT r.*, u.name AS created_by_name
         FROM rfqs r
         JOIN users u ON u.id = r.created_by
        WHERE r.id = ?`,
      [rfqId]
    );

    return Response.json(
      { message: 'RFQ created', data: { rfq: rfqRows[0] } },
      { status: 201 }
    );

  } catch (err) {
    await conn.rollback();
    console.error('POST /api/rfqs error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    conn.release();
  }
}
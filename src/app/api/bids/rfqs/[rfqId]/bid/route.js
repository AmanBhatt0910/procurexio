// POST /api/bids/rfqs/[rfqId]/bid  — create a new draft bid
// PUT  /api/bids/rfqs/[rfqId]/bid  — update bid header + upsert bid_items
// Requires role: vendor_user

import pool from '@/lib/db';

async function resolveVendorId(userId, companyId) {
  const [rows] = await pool.query(
    `SELECT vendor_id FROM vendor_users WHERE user_id = ? AND company_id = ? LIMIT 1`,
    [userId, companyId]
  );
  return rows[0]?.vendor_id ?? null;
}

async function getInvitation(rfqId, vendorId, companyId) {
  const [[row]] = await pool.query(
    `SELECT rv.status, r.deadline, r.status AS rfq_status, r.company_id
     FROM rfq_vendors rv
     JOIN rfqs r ON r.id = rv.rfq_id
     WHERE rv.rfq_id = ? AND rv.vendor_id = ? AND rv.company_id = ?`,
    [rfqId, vendorId, companyId]
  );
  return row ?? null;
}

export async function POST(request, { params }) {
  const role      = request.headers.get('x-user-role');
  const userId    = request.headers.get('x-user-id');
  const companyId = request.headers.get('x-company-id');
  const { rfqId } = params;

  if (role !== 'vendor_user') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const vendorId = await resolveVendorId(userId, companyId);
  if (!vendorId) return Response.json({ error: 'Vendor association not found' }, { status: 404 });

  const invite = await getInvitation(rfqId, vendorId, companyId);
  if (!invite) return Response.json({ error: 'Not invited to this RFQ' }, { status: 403 });
  if (['closed','cancelled'].includes(invite.rfq_status)) {
    return Response.json({ error: 'RFQ is no longer accepting bids' }, { status: 422 });
  }

  const body = await request.json();
  const { notes = null, currency = 'USD' } = body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO bids (rfq_id, vendor_id, company_id, status, notes, currency, total_amount)
       VALUES (?, ?, ?, 'draft', ?, ?, 0.00)`,
      [rfqId, vendorId, companyId, notes, currency]
    );
    const bidId = result.insertId;

    await conn.commit();
    return Response.json({ message: 'Bid created', data: { bidId } }, { status: 201 });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return Response.json({ error: 'Bid already exists for this RFQ' }, { status: 409 });
    }
    console.error(err);
    return Response.json({ error: 'Failed to create bid' }, { status: 500 });
  } finally {
    conn.release();
  }
}

export async function PUT(request, { params }) {
  const role      = request.headers.get('x-user-role');
  const userId    = request.headers.get('x-user-id');
  const companyId = request.headers.get('x-company-id');
  const { rfqId } = params;

  if (role !== 'vendor_user') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const vendorId = await resolveVendorId(userId, companyId);
  if (!vendorId) return Response.json({ error: 'Vendor association not found' }, { status: 404 });

  const invite = await getInvitation(rfqId, vendorId, companyId);
  if (!invite) return Response.json({ error: 'Not invited to this RFQ' }, { status: 403 });
  if (['closed','cancelled'].includes(invite.rfq_status)) {
    return Response.json({ error: 'RFQ is no longer accepting bids' }, { status: 422 });
  }

  // Fetch bid
  const [[bid]] = await pool.query(
    `SELECT id, status FROM bids WHERE rfq_id = ? AND vendor_id = ? AND company_id = ?`,
    [rfqId, vendorId, companyId]
  );
  if (!bid) return Response.json({ error: 'Bid not found' }, { status: 404 });
  if (bid.status === 'withdrawn') {
    return Response.json({ error: 'Cannot edit a withdrawn bid. Resubmit instead.' }, { status: 422 });
  }

  const body = await request.json();
  const { notes, currency, items = [] } = body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Update bid header
    await conn.query(
      `UPDATE bids SET notes = ?, currency = ?, updated_at = NOW()
       WHERE id = ? AND company_id = ?`,
      [notes ?? null, currency ?? 'USD', bid.id, companyId]
    );

    // Upsert bid_items
    for (const item of items) {
      const { rfq_item_id, unit_price, quantity, notes: itemNotes } = item;
      await conn.query(
        `INSERT INTO bid_items (bid_id, rfq_item_id, company_id, unit_price, quantity, notes)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           unit_price = VALUES(unit_price),
           quantity   = VALUES(quantity),
           notes      = VALUES(notes),
           updated_at = NOW()`,
        [bid.id, rfq_item_id, companyId, unit_price ?? 0, quantity ?? 1, itemNotes ?? null]
      );
    }

    // Recompute total_amount
    const [[totRow]] = await conn.query(
      `SELECT COALESCE(SUM(unit_price * quantity), 0) AS total
       FROM bid_items WHERE bid_id = ? AND company_id = ?`,
      [bid.id, companyId]
    );
    await conn.query(
      `UPDATE bids SET total_amount = ?, updated_at = NOW() WHERE id = ?`,
      [totRow.total, bid.id]
    );

    await conn.commit();
    return Response.json({ message: 'Bid updated', data: { total_amount: totRow.total } });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    return Response.json({ error: 'Failed to update bid' }, { status: 500 });
  } finally {
    conn.release();
  }
}
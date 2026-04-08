import { NextResponse } from 'next/server';
import pool from '@/lib/db';

async function resolveVendor(userId) {
  const [rows] = await pool.query(
    `SELECT u.id, u.company_id, u.vendor_id FROM users u WHERE u.id = ? LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

// GET /api/bids/rfqs/[rfqId]/bid/alternatives — list alternative items for vendor's bid
export async function GET(request, { params }) {
  const role   = request.headers.get('x-user-role');
  const userId = request.headers.get('x-user-id');

  if (role !== 'vendor_user') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { rfqId } = await params;

  try {
    const userInfo = await resolveVendor(userId);
    if (!userInfo?.vendor_id) {
      return NextResponse.json({ error: 'No vendor linked' }, { status: 404 });
    }

    const { vendor_id: vendorId, company_id: companyId } = userInfo;

    // Get the bid
    const [[bid]] = await pool.query(
      `SELECT id FROM bids WHERE rfq_id = ? AND vendor_id = ? AND company_id = ?`,
      [rfqId, vendorId, companyId]
    );
    if (!bid) {
      return NextResponse.json({ error: 'No bid found for this RFQ' }, { status: 404 });
    }

    const [alternatives] = await pool.query(
      `SELECT id, rfq_item_id, alt_name, alt_description, alt_specifications,
              alt_unit_price, alt_quantity, reason_for_alternative, notes, created_at
       FROM bid_alternative_items
       WHERE bid_id = ? AND company_id = ?
       ORDER BY created_at ASC`,
      [bid.id, companyId]
    );

    return NextResponse.json({ message: 'ok', data: alternatives });
  } catch (err) {
    console.error('GET /api/bids/rfqs/[rfqId]/bid/alternatives', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/bids/rfqs/[rfqId]/bid/alternatives — add an alternative item suggestion
export async function POST(request, { params }) {
  const role   = request.headers.get('x-user-role');
  const userId = request.headers.get('x-user-id');

  if (role !== 'vendor_user') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { rfqId } = await params;

  try {
    const userInfo = await resolveVendor(userId);
    if (!userInfo?.vendor_id) {
      return NextResponse.json({ error: 'No vendor linked' }, { status: 404 });
    }

    const { vendor_id: vendorId, company_id: companyId } = userInfo;

    // Get the bid
    const [[bid]] = await pool.query(
      `SELECT id, status FROM bids WHERE rfq_id = ? AND vendor_id = ? AND company_id = ?`,
      [rfqId, vendorId, companyId]
    );
    if (!bid) {
      return NextResponse.json({ error: 'No bid found — create a bid first' }, { status: 400 });
    }
    if (bid.status === 'withdrawn' || bid.status === 'rejected') {
      return NextResponse.json({ error: 'Cannot add alternatives to a withdrawn/rejected bid' }, { status: 400 });
    }

    const body = await request.json();
    const {
      rfq_item_id,
      alt_name,
      alt_description,
      alt_specifications,
      alt_unit_price,
      alt_quantity,
      reason_for_alternative,
      notes,
    } = body;

    if (!rfq_item_id || !alt_name?.trim()) {
      return NextResponse.json({ error: 'rfq_item_id and alt_name are required' }, { status: 400 });
    }

    // Verify the rfq_item belongs to this RFQ
    const [[rfqItem]] = await pool.query(
      `SELECT id FROM rfq_items WHERE id = ? AND rfq_id = ? AND company_id = ?`,
      [rfq_item_id, rfqId, companyId]
    );
    if (!rfqItem) {
      return NextResponse.json({ error: 'Invalid rfq_item_id' }, { status: 400 });
    }

    const [result] = await pool.query(
      `INSERT INTO bid_alternative_items
         (bid_id, rfq_item_id, company_id, alt_name, alt_description, alt_specifications,
          alt_unit_price, alt_quantity, reason_for_alternative, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bid.id,
        rfq_item_id,
        companyId,
        alt_name.trim(),
        alt_description?.trim() || null,
        alt_specifications?.trim() || null,
        alt_unit_price != null && alt_unit_price !== '' ? parseFloat(alt_unit_price) : null,
        alt_quantity != null && alt_quantity !== '' ? parseFloat(alt_quantity) : 1,
        reason_for_alternative?.trim() || null,
        notes?.trim() || null,
      ]
    );

    const [[created]] = await pool.query(
      `SELECT id, rfq_item_id, alt_name, alt_description, alt_specifications,
              alt_unit_price, alt_quantity, reason_for_alternative, notes, created_at
       FROM bid_alternative_items WHERE id = ?`,
      [result.insertId]
    );

    return NextResponse.json({ message: 'Alternative item added', data: created }, { status: 201 });
  } catch (err) {
    console.error('POST /api/bids/rfqs/[rfqId]/bid/alternatives', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/bids/rfqs/[rfqId]/bid/alternatives?altId=<id> — remove an alternative item
export async function DELETE(request, { params }) {
  const role   = request.headers.get('x-user-role');
  const userId = request.headers.get('x-user-id');

  if (role !== 'vendor_user') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { rfqId } = await params;
  const { searchParams } = new URL(request.url);
  const altId = searchParams.get('altId');

  if (!altId) {
    return NextResponse.json({ error: 'altId is required' }, { status: 400 });
  }

  try {
    const userInfo = await resolveVendor(userId);
    if (!userInfo?.vendor_id) {
      return NextResponse.json({ error: 'No vendor linked' }, { status: 404 });
    }

    const { vendor_id: vendorId, company_id: companyId } = userInfo;

    // Get the bid
    const [[bid]] = await pool.query(
      `SELECT id FROM bids WHERE rfq_id = ? AND vendor_id = ? AND company_id = ?`,
      [rfqId, vendorId, companyId]
    );
    if (!bid) {
      return NextResponse.json({ error: 'No bid found' }, { status: 404 });
    }

    await pool.query(
      `DELETE FROM bid_alternative_items WHERE id = ? AND bid_id = ? AND company_id = ?`,
      [altId, bid.id, companyId]
    );

    return NextResponse.json({ message: 'Alternative item removed' });
  } catch (err) {
    console.error('DELETE /api/bids/rfqs/[rfqId]/bid/alternatives', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { validateUserContext } from '@/lib/authUtils';
import { validateNumericId } from '@/lib/authUtils';

async function resolveVendor(userId) {
  const [rows] = await pool.query(
    `SELECT u.id, u.company_id, u.vendor_id FROM users u WHERE u.id = ? LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

// GET /api/bids/rfqs/[rfqId]/rank — returns the calling vendor's L-level rank
export async function GET(request, { params }) {
  // CRITICAL: Validate against JWT, not headers
  const validated = await validateUserContext(request, {
    requireRole: ['vendor_user'],
    requireUserId: true,
  });

  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: validated.status });
  }

  const { userId } = validated;
  const { rfqId: rawRfqId } = await params;

  // CRITICAL: Validate URL parameter is numeric
  const { ok: rfqOk, value: rfqId } = validateNumericId(rawRfqId);
  if (!rfqOk) {
    return NextResponse.json({ error: 'Invalid RFQ ID' }, { status: 400 });
  }

  try {
    const userInfo = await resolveVendor(userId);
    if (!userInfo?.vendor_id) {
      return NextResponse.json({ error: 'No vendor linked' }, { status: 404 });
    }
    const { vendor_id: vendorId, company_id: companyId } = userInfo;

    // Get all submitted bids ordered by total_amount ASC
    const [bids] = await pool.query(
      `SELECT vendor_id, total_amount
       FROM bids
       WHERE rfq_id = ? AND company_id = ? AND status = 'submitted'
       ORDER BY total_amount ASC`,
      [rfqId, companyId]
    );

    if (bids.length === 0) {
      return NextResponse.json({ message: 'ok', data: { rank: null, totalBids: 0 } });
    }

    const rankIndex = bids.findIndex(b => b.vendor_id === vendorId);
    let rank = null;
    if (rankIndex >= 0) {
      const position = rankIndex + 1;
      if (position <= 3) {
        rank = `L${position}`;
      } else {
        rank = `Rank #${position}`;
      }
    }

    return NextResponse.json({
      message: 'ok',
      data: { rank, totalBids: bids.length },
    });
  } catch (err) {
    console.error('GET /api/bids/rfqs/[rfqId]/rank', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

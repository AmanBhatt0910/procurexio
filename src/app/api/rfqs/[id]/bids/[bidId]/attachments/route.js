// src/app/api/rfqs/[id]/bids/[bidId]/attachments/route.js
// Buyer-side: list attachments for a specific bid
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request, { params }) {
  const role      = request.headers.get('x-user-role');
  const companyId = request.headers.get('x-company-id');

  if (!['super_admin', 'company_admin', 'manager', 'employee'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: rfqId, bidId } = await params;
  try {
    // Verify bid belongs to this company's RFQ
    const [[bid]] = await pool.query(
      `SELECT b.id FROM bids b WHERE b.id = ? AND b.rfq_id = ? AND b.company_id = ?`,
      [bidId, rfqId, companyId]
    );
    if (!bid) return NextResponse.json({ error: 'Bid not found' }, { status: 404 });

    const [attachments] = await pool.query(
      `SELECT id, original_name, mime_type, file_size, file_path, created_at
       FROM bid_attachments WHERE bid_id = ? AND company_id = ?
       ORDER BY created_at ASC`,
      [bidId, companyId]
    );
    return NextResponse.json({ data: attachments });
  } catch (err) {
    console.error('GET bid attachments (buyer) error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

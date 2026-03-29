// src/app/api/bids/rfqs/[rfqId]/outcome/route.js
import db from '@/lib/db';

export async function GET(request, { params }) {
  const { rfqId }  = await params;
  const companyId  = request.headers.get('x-company-id');
  const userId     = request.headers.get('x-user-id');
  const role       = request.headers.get('x-user-role');

  if (role !== 'vendor_user') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Read vendor_id directly from users table
    const [[userRow]] = await db.query(
      `SELECT vendor_id FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );
    if (!userRow?.vendor_id) {
      return Response.json({ error: 'Vendor not found' }, { status: 404 });
    }
    const vendorId = userRow.vendor_id;

    // Check vendor is invited to this RFQ
    const [[invited]] = await db.query(
      `SELECT id FROM rfq_vendors WHERE rfq_id = ? AND vendor_id = ? AND company_id = ?`,
      [rfqId, vendorId, companyId]
    );
    if (!invited) return Response.json({ error: 'Not invited to this RFQ' }, { status: 404 });

    // Get own bid
    const [[bid]] = await db.query(
      `SELECT id, status, total_amount, currency, submitted_at
       FROM bids WHERE rfq_id = ? AND vendor_id = ? AND company_id = ?`,
      [rfqId, vendorId, companyId]
    );

    if (!bid) {
      return Response.json({ data: { awarded: false, bidStatus: null } });
    }

    const awarded = bid.status === 'awarded';
    let contractData = null;

    if (awarded) {
      const [[contract]] = await db.query(
        `SELECT id AS contract_id, contract_reference, total_amount, currency, awarded_at
         FROM contracts WHERE bid_id = ? AND company_id = ?`,
        [bid.id, companyId]
      );
      contractData = contract || null;
    }

    return Response.json({
      data: {
        awarded,
        bidStatus: bid.status,
        ...(contractData && {
          contractId:        contractData.contract_id,
          contractReference: contractData.contract_reference,
          totalAmount:       contractData.total_amount,
          currency:          contractData.currency,
          awardedAt:         contractData.awarded_at,
        }),
      },
    });
  } catch (err) {
    console.error('GET /api/bids/rfqs/[rfqId]/outcome', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
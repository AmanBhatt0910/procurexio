// src/app/api/bids/rfqs/[rfqId]/outcome/route.js
import db from '@/lib/db';

export async function GET(request, { params }) {
  const { rfqId } = await params;
  const companyId = request.headers.get('x-company-id');
  const userId    = request.headers.get('x-user-id');
  const role      = request.headers.get('x-user-role');

  // Only vendor_users (or internal users viewing their own data) use this
  if (role !== 'vendor_user') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Find the vendor associated with this user
  const [[vendorUser]] = await db.query(
    `SELECT v.id AS vendor_id FROM vendors v
     JOIN users u ON u.company_id = v.company_id
     WHERE u.id = ? AND v.company_id = ? LIMIT 1`,
    [userId, companyId]
  );

  if (!vendorUser) {
    return Response.json({ error: 'Vendor not found' }, { status: 404 });
  }

  // Check vendor is invited to this RFQ
  const [[invited]] = await db.query(
    `SELECT id FROM rfq_vendors WHERE rfq_id = ? AND vendor_id = ? AND company_id = ?`,
    [rfqId, vendorUser.vendor_id, companyId]
  );
  if (!invited) return Response.json({ error: 'Not invited to this RFQ' }, { status: 404 });

  // Get own bid status
  const [[bid]] = await db.query(
    `SELECT b.id, b.status, b.total_amount, b.currency, b.submitted_at
     FROM bids b
     WHERE b.rfq_id = ? AND b.vendor_id = ? AND b.company_id = ?`,
    [rfqId, vendorUser.vendor_id, companyId]
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
        contractId: contractData.contract_id,
        contractReference: contractData.contract_reference,
        totalAmount: contractData.total_amount,
        currency: contractData.currency,
        awardedAt: contractData.awarded_at,
      }),
    },
  });
}
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { createNotifications } from '@/lib/notifications';
import { sendBidSubmittedEmail } from '@/lib/mailer';
import { logAction, ACTION } from '@/lib/audit';
import { isDeadlinePassed } from '@/lib/deadline';

async function resolveVendor(userId) {
  const [rows] = await pool.query(
    `SELECT u.id, u.company_id, u.vendor_id
     FROM users u
     WHERE u.id = ? LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

// POST /api/bids/rfqs/[rfqId]/bid/submit
export async function POST(request, { params }) {
  const role   = request.headers.get('x-user-role');
  const userId = request.headers.get('x-user-id');
  if (role !== 'vendor_user') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { rfqId } = await params;

  try {
    const userInfo = await resolveVendor(userId);
    if (!userInfo?.vendor_id) return NextResponse.json({ error: 'No vendor linked' }, { status: 404 });
    const { vendor_id: vendorId, company_id: companyId } = userInfo;

    const [[rfq]] = await pool.query(
      `SELECT r.deadline, r.status, r.title, r.reference_number, r.created_by FROM rfqs r WHERE r.id = ? AND r.company_id = ?`,
      [rfqId, companyId]
    );
    if (!rfq) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });
    if (isDeadlinePassed(rfq.deadline)) {
      return NextResponse.json({ error: 'RFQ deadline has passed' }, { status: 422 });
    }
    if (!['published'].includes(rfq.status)) {
      return NextResponse.json({ error: 'RFQ is not open for bidding' }, { status: 422 });
    }

    const [[bid]] = await pool.query(
      `SELECT id, status FROM bids WHERE rfq_id = ? AND vendor_id = ? AND company_id = ?`,
      [rfqId, vendorId, companyId]
    );
    if (!bid) return NextResponse.json({ error: 'No bid found' }, { status: 404 });
    if (bid.status !== 'draft') {
      return NextResponse.json({ error: `Cannot submit a bid with status '${bid.status}'` }, { status: 422 });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(
        `UPDATE bids SET status = 'submitted', submitted_at = NOW() WHERE id = ?`,
        [bid.id]
      );
      await conn.query(
        `UPDATE rfq_vendors SET status = 'submitted' WHERE rfq_id = ? AND vendor_id = ? AND company_id = ?`,
        [rfqId, vendorId, companyId]
      );
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    // Notify company admins and managers that a bid was submitted on their RFQ
    try {
      const [managers] = await pool.query(
        `SELECT u.id AS userId, u.email, u.name FROM users u
         WHERE u.company_id = ? AND u.role IN ('company_admin', 'manager')`,
        [companyId]
      );
      if (managers.length) {
        // Fetch vendor name
        const [[vendorRow]] = await pool.query(
          `SELECT v.name FROM vendors v JOIN users u ON u.vendor_id = v.id WHERE u.id = ? LIMIT 1`,
          [userId]
        );
        const vendorName = vendorRow?.name || 'A vendor';
        await createNotifications(
          managers.map(m => ({ userId: m.userId, companyId })),
          {
            type:  'bid_submitted',
            title: `New bid received on "${rfq.title}"`,
            body:  'A vendor has submitted a bid. Review it in the RFQ bids page.',
            link:  `/dashboard/rfqs/${rfqId}/bids`,
          }
        );
        const rfqLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/dashboard/rfqs/${rfqId}/bids`;
        for (const m of managers) {
          sendBidSubmittedEmail({
            to: m.email,
            managerName: m.name,
            vendorName,
            rfqTitle: rfq.title,
            rfqReference: rfq.reference_number,
            rfqLink,
          }).catch(() => {});
        }
      }
    } catch (_) { /* notification errors must not fail the request */ }

    await logAction(request, {
      userId:       parseInt(userId, 10) || null,
      userEmail:    request.headers.get('x-user-email') || null,
      actionType:   ACTION.BID_SUBMITTED,
      resourceType: 'bid',
      resourceId:   bid.id,
      resourceName: rfq.title || `RFQ #${rfqId}`,
      status:       'success',
    });

    return NextResponse.json({ message: 'Bid submitted successfully' });
  } catch (err) {
    console.error('POST /api/bids/rfqs/[rfqId]/bid/submit', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

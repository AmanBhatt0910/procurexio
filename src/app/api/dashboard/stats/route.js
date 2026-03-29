import pool from '@/lib/db';

export async function GET(request) {
  const companyId = request.headers.get('x-company-id');

  if (!companyId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Total vendors
    const [[{ count: vendors }]] = await pool.execute(
      'SELECT COUNT(*) AS count FROM vendors WHERE company_id = ?',
      [companyId]
    );

    // Active RFQs – assuming status in ('published', 'open', 'active')
    const [[{ count: activeRfqs }]] = await pool.execute(
      `SELECT COUNT(*) AS count FROM rfqs
       WHERE company_id = ? AND status IN ('published', 'open', 'active')`,
      [companyId]
    );

    // Open bids – bids submitted for active RFQs of this company, not yet awarded
    const [[{ count: openBids }]] = await pool.execute(
      `SELECT COUNT(*) AS count FROM bids b
       INNER JOIN rfqs r ON b.rfq_id = r.id
       WHERE r.company_id = ?
         AND r.status IN ('published', 'open', 'active')
         AND b.status = 'submitted'`,
      [companyId]
    );

    // Awarded contracts
    const [[{ count: awardedContracts }]] = await pool.execute(
      'SELECT COUNT(*) AS count FROM contracts WHERE company_id = ?',
      [companyId]
    );

    return Response.json({
      data: {
        vendors,
        activeRfqs,
        openBids,
        awardedContracts,
      },
    });
  } catch (err) {
    console.error('[GET /api/dashboard/stats]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
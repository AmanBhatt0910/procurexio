import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/admin/stats — platform-level stats for super_admin
export async function GET(request) {
  const role = request.headers.get('x-user-role');

  if (role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const [[{ totalCompanies }]] = await pool.query(
      `SELECT COUNT(*) AS totalCompanies FROM companies`
    );
    const [[{ totalUsers }]] = await pool.query(
      `SELECT COUNT(*) AS totalUsers FROM users`
    );
    const [[{ totalVendors }]] = await pool.query(
      `SELECT COUNT(*) AS totalVendors FROM vendors`
    );
    const [[{ totalRfqs }]] = await pool.query(
      `SELECT COUNT(*) AS totalRfqs FROM rfqs`
    );
    const [[{ activeRfqs }]] = await pool.query(
      `SELECT COUNT(*) AS activeRfqs FROM rfqs WHERE status = 'open'`
    );
    const [[{ totalBids }]] = await pool.query(
      `SELECT COUNT(*) AS totalBids FROM bids`
    );
    const [[{ submittedBids }]] = await pool.query(
      `SELECT COUNT(*) AS submittedBids FROM bids WHERE status = 'submitted'`
    );
    const [[{ awardedContracts }]] = await pool.query(
      `SELECT COUNT(*) AS awardedContracts FROM contracts`
    );

    // Recent companies (last 10)
    const [recentCompanies] = await pool.query(
      `SELECT id, name, email, plan, created_at FROM companies ORDER BY created_at DESC LIMIT 10`
    );

    return NextResponse.json({
      message: 'ok',
      data: {
        totalCompanies,
        totalUsers,
        totalVendors,
        totalRfqs,
        activeRfqs,
        totalBids,
        submittedBids,
        awardedContracts,
        recentCompanies,
      },
    });
  } catch (err) {
    console.error('GET /api/admin/stats', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

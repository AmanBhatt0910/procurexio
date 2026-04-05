// src/app/api/rfqs/[id]/bids/export/route.js
// Export bids as CSV or JSON for an RFQ
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

function escCsv(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request, { params }) {
  const role      = request.headers.get('x-user-role');
  const companyId = request.headers.get('x-company-id');

  if (!['company_admin', 'manager', 'employee'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: rfqId } = await params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'csv';

  try {
    const [[rfq]] = await pool.query(
      `SELECT id, title, reference_number, status, deadline, currency
       FROM rfqs WHERE id = ? AND company_id = ?`,
      [rfqId, companyId]
    );
    if (!rfq) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });

    const [bids] = await pool.query(
      `SELECT b.id AS bid_id, v.name AS vendor_name, v.email AS vendor_email,
              b.status, b.total_amount, b.currency, b.submitted_at, b.notes,
              b.updated_at
       FROM bids b
       JOIN vendors v ON v.id = b.vendor_id
       WHERE b.rfq_id = ? AND b.company_id = ?
       ORDER BY b.total_amount ASC`,
      [rfqId, companyId]
    );

    // Fetch attachments count per bid
    const bidIds = bids.map(b => b.bid_id);
    let attachmentCounts = {};
    if (bidIds.length > 0) {
      const placeholders = bidIds.map(() => '?').join(',');
      const [attachRows] = await pool.query(
        `SELECT bid_id, COUNT(*) AS cnt FROM bid_attachments WHERE bid_id IN (${placeholders}) GROUP BY bid_id`,
        bidIds
      );
      for (const row of attachRows) {
        attachmentCounts[row.bid_id] = row.cnt;
      }
    }

    if (format === 'json') {
      return NextResponse.json({
        rfq,
        exportedAt: new Date().toISOString(),
        bids: bids.map(b => ({
          ...b,
          total_amount: parseFloat(b.total_amount),
          attachments: attachmentCounts[b.bid_id] || 0,
        })),
      });
    }

    // CSV format
    const headers = [
      'Bid ID', 'Vendor Name', 'Vendor Email', 'Status',
      'Total Amount', 'Currency', 'Submitted At', 'Last Updated',
      'Notes', 'Attachments Count',
    ];

    const rows = bids.map(b => [
      b.bid_id,
      b.vendor_name,
      b.vendor_email || '',
      b.status,
      parseFloat(b.total_amount).toFixed(2),
      b.currency,
      b.submitted_at ? new Date(b.submitted_at).toISOString() : '',
      b.updated_at ? new Date(b.updated_at).toISOString() : '',
      b.notes || '',
      attachmentCounts[b.bid_id] || 0,
    ]);

    const csvLines = [
      `# RFQ: ${rfq.title} (${rfq.reference_number})`,
      `# Status: ${rfq.status}`,
      `# Exported: ${new Date().toISOString()}`,
      '',
      headers.map(escCsv).join(','),
      ...rows.map(r => r.map(escCsv).join(',')),
    ];

    const csv = csvLines.join('\r\n');
    const filename = `bids-${rfq.reference_number}-${Date.now()}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('GET /api/rfqs/[id]/bids/export error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

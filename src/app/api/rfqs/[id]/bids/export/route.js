// src/app/api/rfqs/[id]/bids/export/route.js
// Export bids as PDF for an RFQ
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import PDFDocument from 'pdfkit';

// Colour palette matching app design system
const INK       = '#0f0e0d';
const INK_SOFT  = '#6b6660';
const INK_FAINT = '#b8b3ae';
const ACCENT    = '#c8501a';
const SURFACE   = '#faf9f7';
const BORDER    = '#e4e0db';
const WHITE     = '#ffffff';

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(n, decimals = 2) {
  const num = parseFloat(n) || 0;
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Collect a pdfkit stream into a Buffer
function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end',  ()    => resolve(Buffer.concat(chunks)));
    stream.on('error', err  => reject(err));
  });
}

// ─── route ────────────────────────────────────────────────────────────────────

export async function GET(request, { params }) {
  const role      = request.headers.get('x-user-role');
  const companyId = request.headers.get('x-company-id');

  if (!['company_admin', 'manager', 'employee'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: rfqId } = await params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'pdf';

  try {
    // ── Data fetching ──────────────────────────────────────────────────────────
    const [[rfq]] = await pool.query(
      `SELECT id, title, reference_number, status, deadline, currency,
              payment_terms, freight_charges, remarks
       FROM rfqs WHERE id = ? AND company_id = ?`,
      [rfqId, companyId]
    );
    if (!rfq) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });

    const [bids] = await pool.query(
      `SELECT b.id AS bid_id, v.name AS vendor_name, v.email AS vendor_email,
              b.status, b.total_amount, b.currency, b.gst,
              b.submitted_at, b.notes, b.updated_at,
              COALESCE(b.rate, '')            AS rate,
              COALESCE(b.payment_terms, '')   AS payment_terms,
              COALESCE(b.freight_charges, 0)  AS freight_charges,
              COALESCE(b.last_remarks, '')    AS last_remarks
       FROM bids b
       JOIN vendors v ON v.id = b.vendor_id
       WHERE b.rfq_id = ? AND b.company_id = ? AND b.status = 'submitted'
       ORDER BY b.total_amount ASC`,
      [rfqId, companyId]
    );

    const [rfqItems] = await pool.query(
      `SELECT id, description, quantity, unit, target_price
       FROM rfq_items WHERE rfq_id = ? AND company_id = ? ORDER BY id ASC`,
      [rfqId, companyId]
    );

    const bidIds = bids.map(b => b.bid_id);
    let bidItemsMap = {};
    if (bidIds.length > 0) {
      const safeIds = bidIds.map(id => parseInt(id, 10)).filter(Number.isFinite);
      const [bidItemRows] = await pool.query(
        `SELECT bid_id, rfq_item_id, unit_price, quantity
         FROM bid_items
         WHERE bid_id IN (${safeIds.map(() => '?').join(',')})`,
        safeIds
      );
      for (const item of bidItemRows) {
        if (!bidItemsMap[item.bid_id]) bidItemsMap[item.bid_id] = {};
        bidItemsMap[item.bid_id][item.rfq_item_id] = {
          unit_price: parseFloat(item.unit_price) || 0,
          quantity:   parseFloat(item.quantity)   || 0,
        };
      }
    }

    // JSON passthrough
    if (format === 'json') {
      return NextResponse.json({
        rfq,
        exportedAt: new Date().toISOString(),
        bids: bids.map(b => ({ ...b, total_amount: parseFloat(b.total_amount), gst: parseFloat(b.gst) || 0 })),
        items: rfqItems,
        bidItems: bidItemsMap,
      });
    }

    // ── PDF generation ─────────────────────────────────────────────────────────
    const topBids = bids.slice(0, 3);
    const pageWidth  = 841.89; // A4 landscape width in pts
    const pageHeight = 595.28; // A4 landscape height in pts
    const margin     = 36;
    const contentW   = pageWidth - margin * 2;

    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin,
      info: {
        Title:    `Bid Comparison — ${rfq.reference_number}`,
        Subject:  rfq.title,
        Creator:  'ProcureXio',
      },
    });

    // ── Header bar ─────────────────────────────────────────────────────────────
    doc.rect(0, 0, pageWidth, 56).fill(INK);
    doc.fontSize(16).font('Helvetica-Bold').fillColor(WHITE)
       .text('ProcureXio', margin, 16, { continued: true })
       .fontSize(10).font('Helvetica').fillColor('#b8b3ae')
       .text('  ·  Bid Comparison Report', { baseline: 'alphabetic' });
    doc.fontSize(9).fillColor('#b8b3ae')
       .text(`Generated ${fmtDate(new Date())}`, margin, 38);

    // RFQ title block
    const titleY = 72;
    doc.fontSize(15).font('Helvetica-Bold').fillColor(INK)
       .text(rfq.title, margin, titleY, { width: contentW * 0.6 });
    const afterTitle = doc.y + 4;
    doc.fontSize(9).font('Helvetica').fillColor(INK_SOFT)
       .text(`Ref: ${rfq.reference_number}`, margin, afterTitle, { continued: true })
       .text(`   ·   Deadline: ${fmtDate(rfq.deadline)}`, { continued: true })
       .text(`   ·   Status: ${(rfq.status || '').toUpperCase()}`, { continued: true })
       .text(`   ·   Currency: ${rfq.currency || '—'}`);

    // Horizontal rule
    const ruleY = doc.y + 10;
    doc.moveTo(margin, ruleY).lineTo(pageWidth - margin, ruleY)
       .strokeColor(BORDER).lineWidth(0.75).stroke();

    // ── Comparison table ───────────────────────────────────────────────────────
    const tableStartY = ruleY + 14;
    const colW = {
      idx:   22,
      desc:  contentW - 22 - 80 - 60 - (topBids.length * 130),
      qty:   80,
      unit:  60,
    };
    const vendorColW = topBids.length > 0 ? 130 : 0;

    // Minimum description width
    if (colW.desc < 100) colW.desc = 100;

    // Column X positions
    const col = {};
    col.idx  = margin;
    col.desc = col.idx  + colW.idx;
    col.qty  = col.desc + colW.desc;
    col.unit = col.qty  + colW.qty;
    const vendorCols = topBids.map((_, i) => col.unit + colW.unit + i * vendorColW);

    // ── Table header row ───────────────────────────────────────────────────────
    const headerH = 28;
    doc.rect(margin, tableStartY, contentW, headerH).fill(INK);

    const headerTextY = tableStartY + 9;
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor(WHITE);
    doc.text('#',           col.idx  + 2,  headerTextY, { width: colW.idx,  align: 'center' });
    doc.text('Item',        col.desc + 4,  headerTextY, { width: colW.desc - 4 });
    doc.text('Qty',         col.qty  + 4,  headerTextY, { width: colW.qty  - 8, align: 'right' });
    doc.text('Unit',        col.unit + 4,  headerTextY, { width: colW.unit - 4, align: 'center' });
    topBids.forEach((bid, i) => {
      const label = `L${i + 1}: ${bid.vendor_name.length > 14 ? bid.vendor_name.slice(0, 13) + '…' : bid.vendor_name}`;
      doc.text(label, vendorCols[i] + 4, headerTextY, { width: vendorColW - 8, align: 'right' });
    });

    // ── Item rows ──────────────────────────────────────────────────────────────
    let rowY = tableStartY + headerH;
    const rowH = 22;
    rfqItems.forEach((item, idx) => {
      const bg = idx % 2 === 0 ? WHITE : SURFACE;
      doc.rect(margin, rowY, contentW, rowH).fill(bg);

      const textY = rowY + 7;
      doc.fontSize(8).font('Helvetica').fillColor(INK_SOFT)
         .text(String(idx + 1), col.idx + 2, textY, { width: colW.idx, align: 'center' });
      doc.fillColor(INK)
         .text(item.description.length > 42 ? item.description.slice(0, 41) + '…' : item.description,
               col.desc + 4, textY, { width: colW.desc - 8 });
      doc.fillColor(INK_SOFT)
         .text(fmt(item.quantity, 0), col.qty + 4, textY, { width: colW.qty - 8, align: 'right' })
         .text(item.unit || '—',      col.unit + 4, textY, { width: colW.unit - 4, align: 'center' });

      topBids.forEach((bid, i) => {
        const bi      = bidItemsMap[bid.bid_id]?.[item.id];
        const up      = bi ? bi.unit_price : 0;
        const qty     = bi ? bi.quantity   : parseFloat(item.quantity) || 0;
        const lineAmt = up * qty;
        const gstRate = parseFloat(bid.gst) || 0;
        const lineTotal = lineAmt * (1 + gstRate / 100);

        const isLowest = i === 0 && lineAmt > 0;
        doc.fillColor(isLowest ? '#1a7a4a' : INK).font(isLowest ? 'Helvetica-Bold' : 'Helvetica')
           .text(lineTotal > 0 ? fmt(lineTotal) : '—', vendorCols[i] + 4, textY,
                 { width: vendorColW - 8, align: 'right' });
      });

      rowY += rowH;
    });

    // ── Totals row ─────────────────────────────────────────────────────────────
    doc.rect(margin, rowY, contentW, rowH + 2).fill('#f0ede9');
    const totY = rowY + 7;
    doc.fontSize(8).font('Helvetica-Bold').fillColor(INK)
       .text('TOTAL (incl. GST)', col.desc + 4, totY, { width: colW.desc + colW.qty + colW.unit - 8 });

    topBids.forEach((bid, i) => {
      const subtotal = rfqItems.reduce((sum, item) => {
        const bi  = bidItemsMap[bid.bid_id]?.[item.id];
        const up  = bi ? bi.unit_price : 0;
        const qty = bi ? bi.quantity   : parseFloat(item.quantity) || 0;
        return sum + up * qty;
      }, 0);
      const gstRate    = parseFloat(bid.gst) || 0;
      const grandTotal = subtotal * (1 + gstRate / 100);

      doc.fillColor(i === 0 ? ACCENT : INK)
         .text(`${bid.currency || rfq.currency} ${fmt(grandTotal)}`,
               vendorCols[i] + 4, totY, { width: vendorColW - 8, align: 'right' });
    });

    rowY += rowH + 2;

    // GST rate row
    doc.rect(margin, rowY, contentW, rowH).fill(SURFACE);
    doc.fontSize(7.5).font('Helvetica').fillColor(INK_SOFT)
       .text('GST Rate', col.desc + 4, rowY + 7, { width: colW.desc + colW.qty + colW.unit - 8 });
    topBids.forEach((bid, i) => {
      const gstRate = parseFloat(bid.gst) || 0;
      doc.text(`${gstRate}%`, vendorCols[i] + 4, rowY + 7, { width: vendorColW - 8, align: 'right' });
    });

    rowY += rowH + 14;

    // ── Summary section ─────────────────────────────────────────────────────────
    if (topBids.length > 0) {
      // Section header
      doc.fontSize(9).font('Helvetica-Bold').fillColor(INK)
         .text('Vendor Summary', margin, rowY);
      rowY += 16;

      const summaryRowH = 20;
      const summaryFields = [
        { label: 'Vendor',          key: b => b.vendor_name },
        { label: 'Payment Terms',   key: b => b.payment_terms ? `Net ${b.payment_terms} days` : '—' },
        { label: 'Freight / Unit',  key: b => b.freight_charges > 0 ? `${b.currency || rfq.currency} ${fmt(b.freight_charges)}` : '—' },
        { label: 'Bid Rate / Factor', key: b => b.rate !== '' && b.rate != null ? String(b.rate) : '—' },
        { label: 'Remarks',         key: b => b.last_remarks || '—' },
        { label: 'Submitted',       key: b => fmtDate(b.submitted_at) },
      ];

      const labelColW  = 130;
      const vendorSumW = (contentW - labelColW) / topBids.length;

      summaryFields.forEach((field, fi) => {
        const bg = fi % 2 === 0 ? SURFACE : WHITE;
        doc.rect(margin, rowY, contentW, summaryRowH).fill(bg);

        doc.fontSize(7.5).font('Helvetica-Bold').fillColor(INK_SOFT)
           .text(field.label, margin + 6, rowY + 6, { width: labelColW - 10 });

        topBids.forEach((bid, bi) => {
          const val = field.key(bid);
          const textVal = val.length > 36 ? val.slice(0, 35) + '…' : val;
          doc.font('Helvetica').fillColor(INK)
             .text(textVal, margin + labelColW + bi * vendorSumW + 4, rowY + 6,
                   { width: vendorSumW - 8 });
        });

        rowY += summaryRowH;
      });
    }

    // ── Footer ─────────────────────────────────────────────────────────────────
    const footerY = pageHeight - 28;
    doc.rect(0, footerY, pageWidth, 28).fill(INK);
    doc.fontSize(7.5).font('Helvetica').fillColor('#b8b3ae')
       .text(
         `ProcureXio  ·  Bid Comparison Export  ·  ${rfq.reference_number}  ·  Confidential`,
         margin, footerY + 9, { width: contentW, align: 'center' }
       );

    doc.end();
    const pdfBuffer = await streamToBuffer(doc);

    const filename = `bid-comparison-${rfq.reference_number}-${Date.now()}.pdf`;
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control':       'no-cache',
      },
    });
  } catch (err) {
    console.error('GET /api/rfqs/[id]/bids/export error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
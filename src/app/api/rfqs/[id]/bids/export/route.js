// src/app/api/rfqs/[id]/bids/export/route.js
// Export bids as PDF for an RFQ (uses pdf-lib — no AFM font files required)
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import {
  PDFDocument,
  StandardFonts,
  rgb,
  PageSizes,
} from 'pdf-lib';

// ─── colour helpers ───────────────────────────────────────────────────────────
// pdf-lib uses rgb(r,g,b) with values 0-1

function hex(h) {
  const n = parseInt(h.replace('#', ''), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

const C_INK      = hex('#0f0e0d');
const C_INK_SOFT = hex('#6b6660');
const C_INK_FAINT= hex('#b8b3ae');
const C_ACCENT   = hex('#c8501a');
const C_SURFACE  = hex('#faf9f7');
const C_BORDER   = hex('#e4e0db');
const C_WHITE    = rgb(1, 1, 1);
const C_GREEN    = hex('#1a7a4a');
const C_TOTAL_BG = hex('#f0ede9');

// ─── text helpers ─────────────────────────────────────────────────────────────

function fmt(n, decimals = 2) {
  const num = parseFloat(n) || 0;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function trunc(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max - 1) + '...' : str;
}

// ─── low-level drawing helpers ────────────────────────────────────────────────

function fillRect(page, x, y, w, h, color) {
  page.drawRectangle({ x, y, width: w, height: h, color });
}

function drawText(page, text, { x, y, size, font, color, maxWidth, align = 'left' }) {
  const safeText = String(text ?? '');
  if (!safeText) return;

  // Truncate to fit maxWidth if provided
  let display = safeText;
  if (maxWidth && maxWidth > 0) {
    while (display.length > 1 && font.widthOfTextAtSize(display, size) > maxWidth) {
      display = display.slice(0, -2) + '.';
    }
  }

  let drawX = x;
  if (align === 'right' && maxWidth) {
    const tw = font.widthOfTextAtSize(display, size);
    drawX = x + maxWidth - tw;
  } else if (align === 'center' && maxWidth) {
    const tw = font.widthOfTextAtSize(display, size);
    drawX = x + (maxWidth - tw) / 2;
  }

  page.drawText(display, { x: drawX, y, size, font, color });
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
    const bidItemsMap = {};
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

    // ── JSON passthrough ───────────────────────────────────────────────────────
    if (format === 'json') {
      return NextResponse.json({
        rfq,
        exportedAt: new Date().toISOString(),
        bids: bids.map(b => ({
          ...b,
          total_amount: parseFloat(b.total_amount),
          gst: parseFloat(b.gst) || 0,
        })),
        items: rfqItems,
        bidItems: bidItemsMap,
      });
    }

    // ── PDF generation (pdf-lib — no AFM files needed) ─────────────────────────
    const topBids = bids.slice(0, 3);

    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(`Bid Comparison - ${rfq.reference_number}`);
    pdfDoc.setSubject(rfq.title);
    pdfDoc.setCreator('ProcureXio');

    // Embed standard fonts (built into every PDF viewer, no external files)
    const fontBold   = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // A4 landscape
    const [pageWidth, pageHeight] = [PageSizes.A4[1], PageSizes.A4[0]]; // swap for landscape
    const page   = pdfDoc.addPage([pageWidth, pageHeight]);
    const margin = 36;
    const contentW = pageWidth - margin * 2;

    // pdf-lib y=0 is bottom-left; we track a cursor from top
    // Helper: convert top-origin y to pdf-lib bottom-origin y
    const py = (topY) => pageHeight - topY;

    // ── Header bar ─────────────────────────────────────────────────────────────
    const headerH = 56;
    fillRect(page, 0, py(headerH), pageWidth, headerH, C_INK);

    drawText(page, 'ProcureXio', {
      x: margin, y: py(32), size: 16, font: fontBold, color: C_WHITE,
    });
    drawText(page, '  Bid Comparison Report', {
      x: margin + fontBold.widthOfTextAtSize('ProcureXio', 16) + 4,
      y: py(32), size: 10, font: fontNormal, color: C_INK_FAINT,
    });
    drawText(page, `Generated ${fmtDate(new Date())}`, {
      x: margin, y: py(50), size: 8, font: fontNormal, color: C_INK_FAINT,
    });

    // ── RFQ title block ────────────────────────────────────────────────────────
    let cursorY = headerH + 14;

    drawText(page, trunc(rfq.title, 80), {
      x: margin, y: py(cursorY + 14), size: 14, font: fontBold, color: C_INK,
    });
    cursorY += 22;

    const meta = `Ref: ${rfq.reference_number}   |   Deadline: ${fmtDate(rfq.deadline)}   |   Status: ${(rfq.status || '').toUpperCase()}   |   Currency: ${rfq.currency || '-'}`;
    drawText(page, trunc(meta, 120), {
      x: margin, y: py(cursorY + 10), size: 8, font: fontNormal, color: C_INK_SOFT,
    });
    cursorY += 16;

    // Horizontal rule
    page.drawLine({
      start: { x: margin, y: py(cursorY) },
      end:   { x: pageWidth - margin, y: py(cursorY) },
      thickness: 0.75,
      color: C_BORDER,
    });
    cursorY += 14;

    // ── Empty state guard ──────────────────────────────────────────────────────
    if (bids.length === 0) {
      drawText(page, 'No submitted bids found for this RFQ.', {
        x: margin, y: py(cursorY + 14), size: 10, font: fontNormal, color: C_INK_SOFT,
      });
      const pdfBytes = await pdfDoc.save();
      const filename = `bid-comparison-${rfq.reference_number}-${Date.now()}.pdf`;
      return new NextResponse(Buffer.from(pdfBytes), {
        headers: {
          'Content-Type':        'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control':       'no-cache',
        },
      });
    }

    // ── Column layout ──────────────────────────────────────────────────────────
    const vendorColW = 130;
    const fixedW     = 22 + 80 + 60 + topBids.length * vendorColW;
    const descW      = Math.max(contentW - fixedW, 100);

    const colIdx  = margin;
    const colDesc = colIdx  + 22;
    const colQty  = colDesc + descW;
    const colUnit = colQty  + 80;
    const vendorCols = topBids.map((_, i) => colUnit + 60 + i * vendorColW);

    // ── Table header row ───────────────────────────────────────────────────────
    const tableHeaderH = 26;
    fillRect(page, margin, py(cursorY + tableHeaderH), contentW, tableHeaderH, C_INK);

    const thY = py(cursorY + tableHeaderH - 8);
    const thSize = 7.5;
    drawText(page, '#',    { x: colIdx  + 2,  y: thY, size: thSize, font: fontBold, color: C_WHITE, maxWidth: 18,       align: 'center' });
    drawText(page, 'Item', { x: colDesc + 4,  y: thY, size: thSize, font: fontBold, color: C_WHITE, maxWidth: descW - 8 });
    drawText(page, 'Qty',  { x: colQty  + 4,  y: thY, size: thSize, font: fontBold, color: C_WHITE, maxWidth: 72,       align: 'right'  });
    drawText(page, 'Unit', { x: colUnit + 4,  y: thY, size: thSize, font: fontBold, color: C_WHITE, maxWidth: 52,       align: 'center' });
    topBids.forEach((bid, i) => {
      const label = `L${i + 1}: ${trunc(bid.vendor_name, 14)}`;
      drawText(page, label, {
        x: vendorCols[i] + 4, y: thY, size: thSize,
        font: fontBold, color: C_WHITE, maxWidth: vendorColW - 8, align: 'right',
      });
    });

    cursorY += tableHeaderH;

    // ── Item rows ──────────────────────────────────────────────────────────────
    const rowH = 20;
    rfqItems.forEach((item, idx) => {
      const bg = idx % 2 === 0 ? C_WHITE : C_SURFACE;
      fillRect(page, margin, py(cursorY + rowH), contentW, rowH, bg);

      const rowTextY = py(cursorY + rowH - 6);
      const rowSize  = 8;

      drawText(page, String(idx + 1), {
        x: colIdx + 2, y: rowTextY, size: rowSize,
        font: fontNormal, color: C_INK_SOFT, maxWidth: 18, align: 'center',
      });
      drawText(page, trunc(item.description, 48), {
        x: colDesc + 4, y: rowTextY, size: rowSize,
        font: fontNormal, color: C_INK, maxWidth: descW - 8,
      });
      drawText(page, fmt(item.quantity, 0), {
        x: colQty + 4, y: rowTextY, size: rowSize,
        font: fontNormal, color: C_INK_SOFT, maxWidth: 72, align: 'right',
      });
      drawText(page, item.unit || '-', {
        x: colUnit + 4, y: rowTextY, size: rowSize,
        font: fontNormal, color: C_INK_SOFT, maxWidth: 52, align: 'center',
      });

      topBids.forEach((bid, i) => {
        const bi        = bidItemsMap[bid.bid_id]?.[item.id];
        const up        = bi ? bi.unit_price : 0;
        const qty       = bi ? bi.quantity   : parseFloat(item.quantity) || 0;
        const lineAmt   = up * qty;
        const gstRate   = parseFloat(bid.gst) || 0;
        const lineTotal = lineAmt * (1 + gstRate / 100);
        const isLowest  = i === 0 && lineAmt > 0;

        drawText(page, lineTotal > 0 ? fmt(lineTotal) : '-', {
          x: vendorCols[i] + 4, y: rowTextY, size: rowSize,
          font: isLowest ? fontBold : fontNormal,
          color: isLowest ? C_GREEN : C_INK,
          maxWidth: vendorColW - 8, align: 'right',
        });
      });

      cursorY += rowH;
    });

    // ── Totals row ─────────────────────────────────────────────────────────────
    const totRowH = rowH + 2;
    fillRect(page, margin, py(cursorY + totRowH), contentW, totRowH, C_TOTAL_BG);
    const totTextY = py(cursorY + totRowH - 7);

    drawText(page, 'TOTAL (incl. GST)', {
      x: colDesc + 4, y: totTextY, size: 8,
      font: fontBold, color: C_INK, maxWidth: descW + 80 + 60 - 8,
    });

    topBids.forEach((bid, i) => {
      const subtotal = rfqItems.reduce((sum, item) => {
        const bi  = bidItemsMap[bid.bid_id]?.[item.id];
        const up  = bi ? bi.unit_price : 0;
        const qty = bi ? bi.quantity   : parseFloat(item.quantity) || 0;
        return sum + up * qty;
      }, 0);
      const gstRate    = parseFloat(bid.gst) || 0;
      const grandTotal = subtotal * (1 + gstRate / 100);

      drawText(page, `${bid.currency || rfq.currency || ''} ${fmt(grandTotal)}`, {
        x: vendorCols[i] + 4, y: totTextY, size: 8,
        font: fontBold,
        color: i === 0 ? C_ACCENT : C_INK,
        maxWidth: vendorColW - 8, align: 'right',
      });
    });

    cursorY += totRowH;

    // GST rate row
    fillRect(page, margin, py(cursorY + rowH), contentW, rowH, C_SURFACE);
    const gstTextY = py(cursorY + rowH - 6);
    drawText(page, 'GST Rate', {
      x: colDesc + 4, y: gstTextY, size: 7.5,
      font: fontNormal, color: C_INK_SOFT, maxWidth: descW + 80 + 60 - 8,
    });
    topBids.forEach((bid, i) => {
      const gstRate = parseFloat(bid.gst) || 0;
      drawText(page, `${gstRate}%`, {
        x: vendorCols[i] + 4, y: gstTextY, size: 7.5,
        font: fontNormal, color: C_INK_SOFT, maxWidth: vendorColW - 8, align: 'right',
      });
    });

    cursorY += rowH + 16;

    // ── Vendor summary section ─────────────────────────────────────────────────
    drawText(page, 'Vendor Summary', {
      x: margin, y: py(cursorY + 10), size: 9, font: fontBold, color: C_INK,
    });
    cursorY += 18;

    const summaryRowH = 18;
    const labelColW   = 130;
    const vendorSumW  = (contentW - labelColW) / Math.max(topBids.length, 1);

    const summaryFields = [
      { label: 'Vendor',            val: b => b.vendor_name },
      { label: 'Payment Terms',     val: b => b.payment_terms ? `Net ${b.payment_terms} days` : '-' },
      { label: 'Freight / Unit',    val: b => parseFloat(b.freight_charges) > 0 ? `${b.currency || rfq.currency || ''} ${fmt(b.freight_charges)}` : '-' },
      { label: 'Bid Rate / Factor', val: b => b.rate !== '' && b.rate != null ? String(b.rate) : '-' },
      { label: 'Remarks',           val: b => b.last_remarks || '-' },
      { label: 'Submitted',         val: b => fmtDate(b.submitted_at) },
    ];

    summaryFields.forEach((field, fi) => {
      const bg = fi % 2 === 0 ? C_SURFACE : C_WHITE;
      fillRect(page, margin, py(cursorY + summaryRowH), contentW, summaryRowH, bg);

      const sY = py(cursorY + summaryRowH - 5);
      drawText(page, field.label, {
        x: margin + 6, y: sY, size: 7.5,
        font: fontBold, color: C_INK_SOFT, maxWidth: labelColW - 10,
      });

      topBids.forEach((bid, bi) => {
        drawText(page, trunc(field.val(bid), 38), {
          x: margin + labelColW + bi * vendorSumW + 4, y: sY, size: 7.5,
          font: fontNormal, color: C_INK, maxWidth: vendorSumW - 8,
        });
      });

      cursorY += summaryRowH;
    });

    // ── Footer ─────────────────────────────────────────────────────────────────
    const footerH = 26;
    fillRect(page, 0, 0, pageWidth, footerH, C_INK);
    const footerText = `ProcureXio  |  Bid Comparison Export  |  ${rfq.reference_number}  |  Confidential`;
    const ftW = fontNormal.widthOfTextAtSize(footerText, 7.5);
    drawText(page, footerText, {
      x: (pageWidth - ftW) / 2, y: 8, size: 7.5,
      font: fontNormal, color: C_INK_FAINT,
    });

    // ── Serialise & respond ────────────────────────────────────────────────────
    const pdfBytes = await pdfDoc.save();
    const filename = `bid-comparison-${rfq.reference_number}-${Date.now()}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
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
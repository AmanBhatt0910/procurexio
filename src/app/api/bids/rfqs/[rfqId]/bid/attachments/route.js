// src/app/api/bids/rfqs/[rfqId]/bid/attachments/route.js
// File upload and listing endpoint for bid attachments
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import pool from '@/lib/db';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
  'text/csv',
];

async function resolveVendor(userId) {
  const [rows] = await pool.query(
    `SELECT u.id, u.company_id, u.vendor_id FROM users u WHERE u.id = ? LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

// GET /api/bids/rfqs/[rfqId]/bid/attachments — list attachments for vendor's bid
export async function GET(request, { params }) {
  const role   = request.headers.get('x-user-role');
  const userId = request.headers.get('x-user-id');
  if (role !== 'vendor_user') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { rfqId } = await params;
  try {
    const userInfo = await resolveVendor(userId);
    if (!userInfo?.vendor_id) return NextResponse.json({ error: 'No vendor linked' }, { status: 404 });
    const { vendor_id: vendorId, company_id: companyId } = userInfo;

    const [[bid]] = await pool.query(
      `SELECT id FROM bids WHERE rfq_id = ? AND vendor_id = ? AND company_id = ?`,
      [rfqId, vendorId, companyId]
    );
    if (!bid) return NextResponse.json({ error: 'No bid found' }, { status: 404 });

    const [attachments] = await pool.query(
      `SELECT id, original_name, mime_type, file_size, created_at
       FROM bid_attachments WHERE bid_id = ? AND company_id = ?
       ORDER BY created_at ASC`,
      [bid.id, companyId]
    );
    return NextResponse.json({ data: attachments });
  } catch (err) {
    console.error('GET bid attachments error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/bids/rfqs/[rfqId]/bid/attachments — upload a file
export async function POST(request, { params }) {
  const role   = request.headers.get('x-user-role');
  const userId = request.headers.get('x-user-id');
  if (role !== 'vendor_user') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { rfqId } = await params;
  try {
    const userInfo = await resolveVendor(userId);
    if (!userInfo?.vendor_id) return NextResponse.json({ error: 'No vendor linked' }, { status: 404 });
    const { vendor_id: vendorId, company_id: companyId } = userInfo;

    // Verify RFQ is not closed
    const [[rfq]] = await pool.query(
      `SELECT id, status FROM rfqs WHERE id = ? AND company_id = ?`,
      [rfqId, companyId]
    );
    if (!rfq) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });
    if (rfq.status === 'closed' || rfq.status === 'cancelled') {
      return NextResponse.json({ error: 'RFQ is closed — file uploads are no longer allowed' }, { status: 422 });
    }

    // Get or verify bid exists
    const [[bid]] = await pool.query(
      `SELECT id FROM bids WHERE rfq_id = ? AND vendor_id = ? AND company_id = ?`,
      [rfqId, vendorId, companyId]
    );
    if (!bid) return NextResponse.json({ error: 'No bid found' }, { status: 404 });

    // Parse multipart form data
    let formData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
    }

    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File exceeds 10 MB limit' }, { status: 422 });
    }

    // Validate MIME type
    const mimeType = file.type || 'application/octet-stream';
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: `File type '${mimeType}' is not allowed` },
        { status: 422 }
      );
    }

    // Derive file extension from MIME type to prevent extension spoofing
    const MIME_TO_EXT = {
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'text/plain': 'txt',
      'text/csv': 'csv',
    };
    const ext = MIME_TO_EXT[mimeType] || 'bin';

    // Sanitize original name: allow only alphanumeric, underscore, hyphen, and a single dot before extension
    const baseName = file.name
      .replace(/\.[^.]*$/, '')           // remove extension
      .replace(/[^\w\-]/g, '_')          // allow only safe chars in basename
      .replace(/_+/g, '_')               // collapse multiple underscores
      .slice(0, 200) || 'file';
    const originalName = `${baseName}.${ext}`;
    const storedName = `${randomUUID()}.${ext}`;

    const uploadDir = join(process.cwd(), 'private', 'uploads', String(companyId), String(rfqId), String(vendorId));
    await mkdir(uploadDir, { recursive: true });

    const filePath = join(uploadDir, storedName);
    await writeFile(filePath, Buffer.from(bytes));

    // Store metadata in DB — path relative to private/uploads
    const relativePath = `${companyId}/${rfqId}/${vendorId}/${storedName}`;
    const [result] = await pool.query(
      `INSERT INTO bid_attachments
         (bid_id, rfq_id, vendor_id, company_id, original_name, stored_name, file_path, mime_type, file_size, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [bid.id, rfqId, vendorId, companyId, originalName, storedName, relativePath, mimeType, bytes.byteLength, userId]
    );

    return NextResponse.json({
      message: 'File uploaded',
      data: {
        id: result.insertId,
        original_name: originalName,
        mime_type: mimeType,
        file_size: bytes.byteLength,
      },
    }, { status: 201 });
  } catch (err) {
    console.error('POST bid attachment error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/bids/rfqs/[rfqId]/bid/attachments?attachmentId=X
export async function DELETE(request, { params }) {
  const role   = request.headers.get('x-user-role');
  const userId = request.headers.get('x-user-id');
  if (role !== 'vendor_user') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { rfqId } = await params;
  const { searchParams } = new URL(request.url);
  const attachmentId = searchParams.get('attachmentId');
  if (!attachmentId) return NextResponse.json({ error: 'attachmentId required' }, { status: 400 });

  try {
    const userInfo = await resolveVendor(userId);
    if (!userInfo?.vendor_id) return NextResponse.json({ error: 'No vendor linked' }, { status: 404 });
    const { vendor_id: vendorId, company_id: companyId } = userInfo;

    // Verify RFQ is not closed
    const [[rfq]] = await pool.query(
      `SELECT id, status FROM rfqs WHERE id = ? AND company_id = ?`,
      [rfqId, companyId]
    );
    if (!rfq) return NextResponse.json({ error: 'RFQ not found' }, { status: 404 });
    if (rfq.status === 'closed' || rfq.status === 'cancelled') {
      return NextResponse.json({ error: 'RFQ is closed — cannot delete attachments' }, { status: 422 });
    }

    const [[attachment]] = await pool.query(
      `SELECT ba.id, ba.file_path FROM bid_attachments ba
       JOIN bids b ON b.id = ba.bid_id
       WHERE ba.id = ? AND ba.vendor_id = ? AND ba.company_id = ?`,
      [attachmentId, vendorId, companyId]
    );
    if (!attachment) return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });

    // Remove DB record
    await pool.query(`DELETE FROM bid_attachments WHERE id = ?`, [attachmentId]);

    // Attempt to delete the physical file (non-fatal if it fails)
    try {
      const { unlink } = await import('fs/promises');
      const fullPath = join(process.cwd(), 'private', 'uploads', attachment.file_path);
      await unlink(fullPath);
    } catch (_) {}

    return NextResponse.json({ message: 'Attachment deleted' });
  } catch (err) {
    console.error('DELETE bid attachment error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

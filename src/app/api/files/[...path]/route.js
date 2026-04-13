// src/app/api/files/[...path]/route.js
// Secure file serving for bid attachments.
// Only authorized users can access files belonging to their company.
import { NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join, resolve } from 'path';
import { jwtVerify } from 'jose';
import pool from '@/lib/db';

export async function GET(request, { params }) {
  let role      = request.headers.get('x-user-role');
  let userId    = request.headers.get('x-user-id');
  let companyId = request.headers.get('x-company-id');

  // Middleware is skipped for dotted paths (e.g. "/api/files/.../quote.pdf"),
  // so recover auth context directly from cookie JWT when headers are absent.
  if (!userId || !role) {
    const token = request.cookies.get('auth_token')?.value;
    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        userId = String(payload.userId || '');
        role = String(payload.role || '');
        companyId = String(payload.companyId || '');
      } catch (err) {
        console.error('File route JWT verification failed:', err?.message || err);
      }
    }
  }

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { path: pathSegments } = await params;
  if (!pathSegments?.length) {
    return NextResponse.json({ error: 'File path required' }, { status: 400 });
  }

  // Validate each path segment: no '..' or absolute paths allowed
  for (const seg of pathSegments) {
    if (seg === '..' || seg === '.' || seg.includes('/') || seg.includes('\\') || seg.startsWith('/')) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }
  }

  // Reconstruct relative path and validate it matches expected structure
  const relativePath = pathSegments.join('/');

  // Security: path must start with the user's company ID or the user must have access
  // Path format: company_id/rfq_id/vendor_id/filename
  const parts = relativePath.split('/');
  if (parts.length < 4) {
    return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
  }

  const fileCompanyId = parts[0];

  // Verify numeric IDs
  if (!/^\d+$/.test(fileCompanyId) || !/^\d+$/.test(parts[1]) || !/^\d+$/.test(parts[2])) {
    return NextResponse.json({ error: 'Invalid file path structure' }, { status: 400 });
  }

  const isVendorRole = role === 'vendor_user';
  const isBuyerRole = ['company_admin', 'manager', 'employee'].includes(role);
  const isSuperAdmin = role === 'super_admin';

  if (!isVendorRole && !isBuyerRole && !isSuperAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Vendor users can only access their own company's files.
  if (isVendorRole) {
    // Vendor must belong to this company
    const [[userRow]] = await pool.query(
      `SELECT company_id FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );
    if (!userRow || String(userRow.company_id) !== fileCompanyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } else if (isBuyerRole) {
    // Buyer-side roles can access files only inside their own company.
    if (String(companyId) !== fileCompanyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } else if (isSuperAdmin) {
    // Super admin has platform-wide read access.
  }

  // Verify the attachment exists in DB (source of truth — prevents serving arbitrary files)
  const [[attachment]] = await pool.query(
    `SELECT id, original_name, mime_type FROM bid_attachments WHERE file_path = ?`,
    [relativePath]
  );
  if (!attachment) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  // Build and validate the full path stays within the uploads directory
  const uploadsBase = resolve(process.cwd(), 'private', 'uploads');
  const fullPath = resolve(uploadsBase, relativePath);
  if (!fullPath.startsWith(uploadsBase + '/') && fullPath !== uploadsBase) {
    return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
  }

  try {
    await stat(fullPath);
  } catch {
    return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
  }

  const fileBuffer = await readFile(fullPath);
  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': attachment.mime_type,
      'Content-Disposition': `inline; filename="${attachment.original_name}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}

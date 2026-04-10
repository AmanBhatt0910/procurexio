// src/app/api/settings/billing/route.js
// GET /api/settings/billing — subscription & billing info (admins only)

import { NextResponse } from 'next/server';
import { getBillingInfo } from '@/lib/settingsService';

const ALLOWED_ROLES = ['super_admin', 'company_admin'];

export async function GET(request) {
  const userId    = request.headers.get('x-user-id');
  const companyId = request.headers.get('x-company-id');
  const role      = request.headers.get('x-user-role');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Forbidden — admins only' }, { status: 403 });
  }
  if (!companyId) {
    return NextResponse.json({ error: 'No company associated with this account.' }, { status: 400 });
  }

  try {
    const data = await getBillingInfo(Number(companyId));
    if (!data) {
      return NextResponse.json({
        message: 'OK',
        data: null,
        note: 'No active subscription found for this company.',
      });
    }
    return NextResponse.json({ message: 'OK', data });
  } catch (err) {
    console.error('[GET /api/settings/billing]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// src/app/api/settings/billing/route.js
// GET /api/settings/billing — subscription & billing info (admins only)

import { NextResponse } from 'next/server';
import { getBillingInfo } from '@/lib/services/settingsService';
import { validateUserContext } from '@/lib/auth/authUtils';

const ALLOWED_ROLES = ['super_admin', 'company_admin'];

export async function GET(request) {
  // CRITICAL: Validate against JWT, not headers
  const validated = await validateUserContext(request, {
    requireRole: ALLOWED_ROLES,
    requireCompanyId: true,
  });

  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: validated.status });
  }

  const { companyId } = validated;

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

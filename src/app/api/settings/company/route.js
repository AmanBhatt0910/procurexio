// src/app/api/settings/company/route.js
// GET /api/settings/company — fetch company & compliance settings
// PUT /api/settings/company — update company settings (company_admin / super_admin only)

import { NextResponse } from 'next/server';
import { getCompanySettings, updateCompanySettings } from '@/lib/settingsService';
import { logAction, ACTION } from '@/lib/audit';
import { validateCurrency } from '@/lib/validation';
import { validateUserContext } from '@/lib/authUtils';

const ADMIN_ROLES = ['super_admin', 'company_admin'];

export async function GET(request) {
  // CRITICAL: Validate against JWT, not headers
  const validated = await validateUserContext(request, {
    requireCompanyId: true,
  });

  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: validated.status });
  }

  const { companyId, role } = validated;

  // vendor_user has no company context
  if (role === 'vendor_user') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const data = await getCompanySettings(Number(cid));
    if (!data) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'OK', data });
  } catch (err) {
    console.error('[GET /api/settings/company]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  // CRITICAL: Validate against JWT, not headers
  const validated = await validateUserContext(request, {
    requireRole: ADMIN_ROLES,
    requireCompanyId: true,
  });

  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: validated.status });
  }

  const { userId, companyId, email: userEmail } = validated;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const {
    timezone,
    currency,
    logo_url,
    tax_id,
    registered_address,
    phone_number,
    website_url,
  } = body;

  // Validate currency if provided
  if (currency) {
    const currErr = validateCurrency(currency, false);
    if (currErr) {
      return NextResponse.json({ error: currErr }, { status: 400 });
    }
  }

  // Basic length checks
  if (tax_id && tax_id.length > 64) {
    return NextResponse.json({ error: 'Tax ID is too long (max 64 chars).' }, { status: 400 });
  }
  if (registered_address && registered_address.length > 500) {
    return NextResponse.json({ error: 'Registered address is too long (max 500 chars).' }, { status: 400 });
  }
  if (phone_number && phone_number.length > 32) {
    return NextResponse.json({ error: 'Phone number is too long (max 32 chars).' }, { status: 400 });
  }

  try {
    const before = await getCompanySettings(Number(companyId));

    await updateCompanySettings(Number(companyId), {
      timezone,
      currency,
      logo_url,
      tax_id,
      registered_address,
      phone_number,
      website_url,
    });

    await logAction(request, {
      userId:       Number(userId),
      userEmail,
      actionType:   ACTION.COMPANY_UPDATED,
      resourceType: 'company',
      resourceId:   Number(companyId),
      resourceName: 'company_settings',
      changes:      { before, after: body },
      status:       'success',
    });

    return NextResponse.json({ message: 'Company settings updated' });
  } catch (err) {
    console.error('[PUT /api/settings/company]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

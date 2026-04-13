// src/app/api/settings/integrations/route.js
// GET    /api/settings/integrations — list company integrations
// POST   /api/settings/integrations — create a new integration
// DELETE /api/settings/integrations — deactivate an integration (body: { id })

import { NextResponse } from 'next/server';
import {
  getIntegrations,
  createIntegration,
  deleteIntegration,
} from '@/lib/settingsService';
import { logAction } from '@/lib/audit';
import { validateUserContext } from '@/lib/authUtils';

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
    const data = await getIntegrations(Number(companyId));
    return NextResponse.json({ message: 'OK', data });
  } catch (err) {
    console.error('[GET /api/settings/integrations]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  // CRITICAL: Validate against JWT, not headers
  const validated = await validateUserContext(request, {
    requireRole: ALLOWED_ROLES,
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

  const { name, type, api_key, webhook_url, webhook_secret, webhook_events } = body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Integration name is required.' }, { status: 400 });
  }

  const VALID_TYPES = ['api_key', 'webhook', 'oauth'];
  if (type && !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: `Type must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 });
  }

  try {
    const insertId = await createIntegration(Number(companyId), Number(userId), {
      name: name.trim(),
      type,
      api_key,
      webhook_url,
      webhook_secret,
      webhook_events,
    });

    await logAction(request, {
      userId:       Number(userId),
      userEmail,
      actionType:   'integration_created',
      resourceType: 'integration',
      resourceId:   insertId,
      resourceName: name.trim(),
      status:       'success',
    });

    return NextResponse.json({ message: 'Integration created', data: { id: insertId } }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/settings/integrations]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const userId    = request.headers.get('x-user-id');
  const companyId = request.headers.get('x-company-id');
  const role      = request.headers.get('x-user-role');
  const userEmail = request.headers.get('x-user-email') || null;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!companyId) {
    return NextResponse.json({ error: 'No company context.' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: 'Integration id is required.' }, { status: 400 });
  }

  try {
    await deleteIntegration(Number(companyId), Number(id));

    await logAction(request, {
      userId:       Number(userId),
      userEmail,
      actionType:   'integration_deleted',
      resourceType: 'integration',
      resourceId:   Number(id),
      status:       'success',
    });

    return NextResponse.json({ message: 'Integration deactivated.' });
  } catch (err) {
    console.error('[DELETE /api/settings/integrations]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

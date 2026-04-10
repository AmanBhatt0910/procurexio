// src/app/api/settings/personal/route.js
// GET /api/settings/personal — fetch personal info
// PUT /api/settings/personal — update editable fields (phone only)

import { NextResponse } from 'next/server';
import { getPersonalInfo, updatePersonalInfo } from '@/lib/settingsService';
import { logAction, ACTION } from '@/lib/audit';

export async function GET(request) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await getPersonalInfo(Number(userId));
    if (!data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    // Never expose password hash
    const { password: _pw, ...safe } = data;
    return NextResponse.json({ message: 'OK', data: safe });
  } catch (err) {
    console.error('[GET /api/settings/personal]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  const userId    = request.headers.get('x-user-id');
  const userEmail = request.headers.get('x-user-email') || null;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { phone_number } = body;

  // Basic length validation
  if (phone_number && typeof phone_number === 'string' && phone_number.length > 32) {
    return NextResponse.json({ error: 'Phone number is too long (max 32 chars).' }, { status: 400 });
  }

  try {
    await updatePersonalInfo(Number(userId), { phone_number: phone_number ?? null });

    await logAction(request, {
      userId:       Number(userId),
      userEmail,
      actionType:   ACTION.USER_UPDATED,
      resourceType: 'user',
      resourceId:   Number(userId),
      resourceName: 'personal_info',
      status:       'success',
    });

    return NextResponse.json({ message: 'Personal info updated' });
  } catch (err) {
    console.error('[PUT /api/settings/personal]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

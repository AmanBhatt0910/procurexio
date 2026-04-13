// src/app/api/settings/notifications/route.js
// GET /api/settings/notifications — fetch notification preferences
// PUT /api/settings/notifications — update notification preferences

import { NextResponse } from 'next/server';
import { getNotificationPrefs, updateNotificationPrefs } from '@/lib/settingsService';
import { validateUserContext } from '@/lib/authUtils';

export async function GET(request) {
  // CRITICAL: Validate against JWT, not headers
  const validated = await validateUserContext(request, {
    requireUserId: true,
  });

  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: validated.status });
  }

  const { userId } = validated;

  try {
    const data = await getNotificationPrefs(Number(userId));
    return NextResponse.json({ message: 'OK', data });
  } catch (err) {
    console.error('[GET /api/settings/notifications]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  // CRITICAL: Validate against JWT, not headers
  const validated = await validateUserContext(request, {
    requireUserId: true,
  });

  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: validated.status });
  }

  const { userId } = validated;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    await updateNotificationPrefs(Number(userId), body);
    return NextResponse.json({ message: 'Notification preferences updated' });
  } catch (err) {
    console.error('[PUT /api/settings/notifications]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// src/app/api/settings/security/2fa/disable/route.js
// POST /api/settings/security/2fa/disable — disable 2FA for the current user

import { NextResponse } from 'next/server';
import { disable2FA } from '@/lib/services/settingsService';
import { logAction, ACTION } from '@/lib/logging/audit';

export async function POST(request) {
  const userId    = request.headers.get('x-user-id');
  const userEmail = request.headers.get('x-user-email') || null;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await disable2FA(Number(userId));

    await logAction(request, {
      userId:       Number(userId),
      userEmail,
      actionType:   '2fa_disabled',
      resourceType: 'user',
      resourceId:   Number(userId),
      status:       'success',
    });

    return NextResponse.json({ message: '2FA has been disabled.' });
  } catch (err) {
    console.error('[POST /api/settings/security/2fa/disable]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

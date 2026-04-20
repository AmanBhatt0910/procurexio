// src/app/api/settings/security/status/route.js
// GET /api/settings/security/status — 2FA status, last password change, active sessions

import { NextResponse } from 'next/server';
import { getSecurityStatus, getActiveSessions } from '@/lib/services/settingsService';

export async function GET(request) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [security, sessions] = await Promise.all([
      getSecurityStatus(Number(userId)),
      getActiveSessions(Number(userId)),
    ]);

    return NextResponse.json({
      message: 'OK',
      data: {
        twofa_enabled:      !!security.twofa_enabled,
        twofa_enabled_at:   security.twofa_enabled_at,
        password_changed_at: security.password_changed_at,
        active_sessions:    sessions.length,
        sessions,
      },
    });
  } catch (err) {
    console.error('[GET /api/settings/security/status]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

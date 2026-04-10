// src/app/api/settings/security/sessions/route.js
// GET  /api/settings/security/sessions — list active sessions
// POST /api/settings/security/sessions — invalidate a session (or all)
//   Body: { session_id: number|null }  — null/absent → invalidate ALL

import { NextResponse } from 'next/server';
import { getActiveSessions, invalidateSession } from '@/lib/settingsService';
import { logAction } from '@/lib/audit';

export async function GET(request) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sessions = await getActiveSessions(Number(userId));
    return NextResponse.json({ message: 'OK', data: sessions });
  } catch (err) {
    console.error('[GET /api/settings/security/sessions]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const userId    = request.headers.get('x-user-id');
  const userEmail = request.headers.get('x-user-email') || null;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    // Empty body is fine — means invalidate all
  }

  const sessionId = body.session_id ?? null;

  try {
    await invalidateSession(Number(userId), sessionId);

    await logAction(request, {
      userId:       Number(userId),
      userEmail,
      actionType:   'session_invalidated',
      resourceType: 'session',
      resourceId:   sessionId,
      status:       'success',
      statusReason: sessionId ? `Session ${sessionId} revoked` : 'All sessions revoked',
    });

    return NextResponse.json({
      message: sessionId ? 'Session revoked.' : 'All sessions revoked.',
    });
  } catch (err) {
    console.error('[POST /api/settings/security/sessions]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

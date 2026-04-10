// src/app/api/settings/security/2fa/enable/route.js
// POST /api/settings/security/2fa/enable — enable 2FA for the current user
//
// NOTE: Full TOTP verification (QR code, OTP confirm) requires an external TOTP
// library (e.g., otplib). This route records the 2FA enablement flag and a
// placeholder secret. A production implementation should generate a real TOTP
// secret, return the QR code URI, and verify the first OTP before committing.

import { NextResponse } from 'next/server';
import { enable2FA } from '@/lib/settingsService';
import { logAction, ACTION } from '@/lib/audit';

export async function POST(request) {
  const userId    = request.headers.get('x-user-id');
  const userEmail = request.headers.get('x-user-email') || null;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // In production: generate a real TOTP secret here and return the QR code URI
    // for the user to scan before confirming. For now, we store a placeholder.
    const placeholderSecret = `2FA_PENDING_${userId}_${Date.now()}`;
    await enable2FA(Number(userId), placeholderSecret);

    await logAction(request, {
      userId:       Number(userId),
      userEmail,
      actionType:   '2fa_enabled',
      resourceType: 'user',
      resourceId:   Number(userId),
      status:       'success',
    });

    return NextResponse.json({
      message: '2FA has been enabled for your account.',
      note: 'Full TOTP setup (QR code + verify) will be available in a future release.',
    });
  } catch (err) {
    console.error('[POST /api/settings/security/2fa/enable]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

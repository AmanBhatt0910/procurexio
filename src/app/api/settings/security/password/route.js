// src/app/api/settings/security/password/route.js
// POST /api/settings/security/password — change own password

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword, comparePassword } from '@/lib/password';
import { validatePassword } from '@/lib/validation';
import { recordPasswordChange } from '@/lib/settingsService';
import { logAction, ACTION } from '@/lib/audit';

export async function POST(request) {
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

  const { current_password, new_password } = body;

  if (!current_password || !new_password) {
    return NextResponse.json({ error: 'current_password and new_password are required.' }, { status: 400 });
  }

  const pwErr = validatePassword(new_password);
  if (pwErr) {
    return NextResponse.json({ error: pwErr }, { status: 400 });
  }

  try {
    // Fetch current password hash
    const [rows] = await pool.execute(
      `SELECT password FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );
    if (!rows.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentHash = rows[0].password;

    // Google OAuth users may have no password
    if (!currentHash) {
      return NextResponse.json(
        { error: 'Password change is not available for accounts linked with Google OAuth.' },
        { status: 400 }
      );
    }

    const match = await comparePassword(current_password, currentHash);
    if (!match) {
      await logAction(request, {
        userId:     Number(userId),
        userEmail,
        actionType: ACTION.PASSWORD_RESET_COMPLETE,
        status:     'failure',
        statusReason: 'Incorrect current password',
      });
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
    }

    const newHash = await hashPassword(new_password);
    await pool.execute(`UPDATE users SET password = ? WHERE id = ?`, [newHash, userId]);
    await recordPasswordChange(Number(userId));

    await logAction(request, {
      userId:     Number(userId),
      userEmail,
      actionType: ACTION.PASSWORD_RESET_COMPLETE,
      status:     'success',
    });

    return NextResponse.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('[POST /api/settings/security/password]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

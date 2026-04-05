import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import pool from '@/lib/db';
import { comparePassword } from '@/lib/password';
import { signToken, buildAuthCookie } from '@/lib/jwt';
import { logAuthEvent, getRequestIP } from '@/lib/logger';
import { logAction, ACTION } from '@/lib/audit';
import { generateSessionToken, expiresInHours, expiresInMinutes, toMySQLDatetime } from '@/lib/security';
import { validateEmail } from '@/lib/validation';

// Max failed attempts before account lock, and lock duration in minutes
const MAX_FAILED_ATTEMPTS  = 5;
const LOCK_DURATION_MINUTES = 30;

export async function POST(request) {
  const ip = getRequestIP(request);
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const emailError = validateEmail(email);
    if (emailError) {
      return NextResponse.json(
        { error: emailError },
        { status: 400 }
      );
    }

    if (typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request.' },
        { status: 400 }
      );
    }

    const rows = await query(
      `SELECT u.id, u.name, u.email, u.password, u.role, u.company_id,
              u.is_active, u.failed_login_attempts, u.locked_until,
              c.name AS company_name
       FROM   users u
       LEFT JOIN companies c ON c.id = u.company_id
       WHERE  u.email = ?
       LIMIT  1`,
      [email.toLowerCase().trim()]
    );

    if (!rows.length) {
      logAuthEvent('login_failure', { ip, reason: 'user_not_found' });
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const user = rows[0];

    // ── Check if account is deactivated ─────────────────────────────────────
    if (user.is_active === false || user.is_active === 0) {
      logAuthEvent('login_failure', { email: user.email, userId: user.id, ip, reason: 'account_inactive' });
      await logAction(request, {
        userId:      user.id,
        userEmail:   user.email,
        actionType:  ACTION.LOGIN_FAILURE,
        resourceType:'user',
        resourceId:  user.id,
        status:      'failure',
        statusReason:'account_inactive',
      });
      return NextResponse.json(
        { error: 'Your account has been deactivated. Please contact your administrator.' },
        { status: 403 }
      );
    }

    // ── Check if account is locked ───────────────────────────────────────────
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      logAuthEvent('login_failure', { email: user.email, userId: user.id, ip, reason: 'account_locked' });
      await logAction(request, {
        userId:      user.id,
        userEmail:   user.email,
        actionType:  ACTION.LOGIN_FAILURE,
        resourceType:'user',
        resourceId:  user.id,
        status:      'failure',
        statusReason:`account_locked_${minutesLeft}min`,
      });
      return NextResponse.json(
        { error: `Account temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.` },
        { status: 423 }
      );
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      const newAttempts = (user.failed_login_attempts || 0) + 1;
      const shouldLock  = newAttempts >= MAX_FAILED_ATTEMPTS;
      const lockedUntil = shouldLock
        ? toMySQLDatetime(expiresInMinutes(LOCK_DURATION_MINUTES))
        : null;

      if (shouldLock) {
        await query(
          `UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?`,
          [newAttempts, lockedUntil, user.id]
        );
        logAuthEvent('login_failure', { email: user.email, userId: user.id, ip, reason: 'invalid_password_account_locked' });
        await logAction(request, {
          userId:      user.id,
          userEmail:   user.email,
          actionType:  ACTION.ACCOUNT_LOCKED,
          resourceType:'user',
          resourceId:  user.id,
          status:      'success',
          statusReason:`locked_after_${newAttempts}_failed_attempts`,
        });
        return NextResponse.json(
          { error: `Too many failed attempts. Account locked for ${LOCK_DURATION_MINUTES} minutes.` },
          { status: 423 }
        );
      } else {
        await query(
          `UPDATE users SET failed_login_attempts = ? WHERE id = ?`,
          [newAttempts, user.id]
        );
        logAuthEvent('login_failure', { email: user.email, userId: user.id, ip, reason: 'invalid_password' });
        await logAction(request, {
          userId:      user.id,
          userEmail:   user.email,
          actionType:  ACTION.LOGIN_FAILURE,
          resourceType:'user',
          resourceId:  user.id,
          status:      'failure',
          statusReason:`invalid_password_attempt_${newAttempts}`,
        });
        return NextResponse.json(
          { error: 'Invalid email or password.' },
          { status: 401 }
        );
      }
    }

    // ── Successful login — reset lockout counters ────────────────────────────
    await query(
      `UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?`,
      [user.id]
    );

    const token = await signToken({
      userId:    user.id,
      companyId: user.company_id,
      role:      user.role,
      email:     user.email,
      name:      user.name,
    });

    // ── Record session ───────────────────────────────────────────────────────
    const sessionToken = generateSessionToken();
    const sessionExpiry = toMySQLDatetime(expiresInHours(7 * 24)); // 7 days
    const userAgent = request.headers.get('user-agent') || null;
    try {
      await pool.execute(
        `INSERT INTO user_sessions (user_id, session_token, expires_at, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?)`,
        [user.id, sessionToken, sessionExpiry, ip, userAgent]
      );
    } catch (sessionErr) {
      // Non-fatal — don't fail login if session recording fails
      console.error('[login] session recording error:', sessionErr.message);
    }

    // Secure flag: always true in production (fixes x-forwarded-proto dependency)
    const isSecure = process.env.NODE_ENV === 'production';

    const safeUser = {
      id:          user.id,
      name:        user.name,
      email:       user.email,
      role:        user.role,
      companyId:   user.company_id,
      companyName: user.company_name,
    };

    logAuthEvent('login_success', { email: user.email, userId: user.id, role: user.role, ip });
    await logAction(request, {
      userId:      user.id,
      userEmail:   user.email,
      actionType:  ACTION.LOGIN_SUCCESS,
      resourceType:'user',
      resourceId:  user.id,
      status:      'success',
    });

    const response = NextResponse.json(
      { message: 'Login successful.', user: safeUser },
      { status: 200 }
    );

    response.headers.set('Set-Cookie', buildAuthCookie(token, { isSecure }));
    return response;

  } catch (err) {
    console.error('[POST /api/auth/login]', err.message);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}

// src/app/api/auth/google/callback/route.js
//
// GET /api/auth/google/callback
//   Handles the Google OAuth 2.0 authorization code callback.
//   Validates the CSRF state, exchanges the code for tokens, fetches the
//   Google user profile, then either:
//     • login  — signs in (or auto-links) the matching user and sets the JWT cookie
//     • link   — attaches the Google identity to the currently authenticated user
//
// Required environment variables:
//   GOOGLE_CLIENT_ID
//   GOOGLE_CLIENT_SECRET
//   GOOGLE_OAUTH_REDIRECT_URI

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { signToken, buildAuthCookie, getCookieSecure, verifyToken } from '@/lib/jwt';
import { logAuthEvent, getRequestIP } from '@/lib/logger';
import { logAction, ACTION } from '@/lib/audit';
import { generateSessionToken, expiresInHours, toMySQLDatetime } from '@/lib/security';
import { normalizeRole } from '@/lib/roleNormalizer';

// ── Google API helpers ────────────────────────────────────────────────────────

/** Exchange an authorization code for Google OAuth tokens. */
async function exchangeCodeForTokens(code, redirectUri) {
  const params = new URLSearchParams({
    code,
    client_id:     process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri:  redirectUri,
    grant_type:    'authorization_code',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    params.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Google token exchange failed: ${err.error_description || err.error || res.status}`
    );
  }

  return res.json();
}

/** Fetch the authenticated user's profile from Google using an access token. */
async function fetchGoogleProfile(accessToken) {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Google profile fetch failed: ${res.status}`);
  return res.json();
}

// ── Shared helpers ────────────────────────────────────────────────────────────

/**
 * Build the cookie header string that clears the oauth_state CSRF cookie.
 * Called in every exit path so the CSRF token is always invalidated.
 */
function buildClearStateCookie(isSecure) {
  return [
    'oauth_state=',
    'HttpOnly',
    'Path=/',
    'Max-Age=0',
    isSecure ? 'Secure' : '',
    'SameSite=Lax',
  ]
    .filter(Boolean)
    .join('; ');
}

/**
 * Redirect to a path and clear the oauth_state cookie in the same response.
 * All error/rejection paths use this so the CSRF token is consumed immediately.
 */
function redirectAndClearState(request, path, clearStateCookie) {
  const res = NextResponse.redirect(new URL(path, request.url));
  res.headers.append('Set-Cookie', clearStateCookie);
  return res;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request) {
  const ip              = getRequestIP(request);
  const { searchParams } = request.nextUrl;

  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const isSecure       = getCookieSecure(request);
  const clearStateCookie = buildClearStateCookie(isSecure);

  // ── User declined consent on Google's screen ────────────────────────────
  if (error) {
    logAuthEvent('oauth_denied', { ip, reason: error });
    return redirectAndClearState(request, '/login?error=oauth_denied', clearStateCookie);
  }

  if (!code || !state) {
    return redirectAndClearState(request, '/login?error=oauth_invalid', clearStateCookie);
  }

  // ── Verify CSRF state ────────────────────────────────────────────────────
  let stateData;
  try {
    stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
  } catch {
    return redirectAndClearState(request, '/login?error=oauth_invalid_state', clearStateCookie);
  }

  const savedCsrf = request.cookies.get('oauth_state')?.value;
  if (!savedCsrf || savedCsrf !== stateData.csrf) {
    logAuthEvent('oauth_csrf_fail', { ip });
    return redirectAndClearState(request, '/login?error=oauth_state_mismatch', clearStateCookie);
  }

  const action      = stateData.action === 'link' ? 'link' : 'login';
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!redirectUri || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return redirectAndClearState(request, '/login?error=oauth_not_configured', clearStateCookie);
  }

  try {
    // ── Exchange authorization code for tokens and fetch profile ──────────
    const tokens        = await exchangeCodeForTokens(code, redirectUri);
    const googleProfile = await fetchGoogleProfile(tokens.access_token);

    const googleId    = googleProfile.sub;
    const googleEmail = googleProfile.email?.toLowerCase().trim();
    const googleName  = googleProfile.name || googleEmail;

    if (!googleId || !googleEmail) {
      logAuthEvent('oauth_failure', { ip, reason: 'missing_google_profile' });
      return redirectAndClearState(request, '/login?error=oauth_profile_error', clearStateCookie);
    }

    // ════════════════════════════════════════════════════════════════════════
    // LINK mode — attach Google identity to an already-authenticated user
    // ════════════════════════════════════════════════════════════════════════
    if (action === 'link') {
      const authToken = request.cookies.get('auth_token')?.value;
      if (!authToken) {
        return redirectAndClearState(request, '/login?error=not_authenticated', clearStateCookie);
      }

      const payload = await verifyToken(authToken);
      if (!payload?.userId) {
        return redirectAndClearState(request, '/login?error=not_authenticated', clearStateCookie);
      }

      const userId = payload.userId;

      // Ensure this Google account is not already linked to a different user
      const [conflictRows] = await pool.query(
        `SELECT id FROM users WHERE google_id = ? AND id != ? LIMIT 1`,
        [googleId, userId]
      );
      if (conflictRows.length > 0) {
        logAuthEvent('oauth_link_conflict', { userId, googleEmail, ip });
        return redirectAndClearState(
          request,
          '/dashboard?error=google_already_linked',
          clearStateCookie
        );
      }

      // Link the Google account
      await pool.execute(
        `UPDATE users
         SET google_id       = ?,
             auth_method     = CASE
                                 WHEN auth_method = 'password' THEN 'both'
                                 ELSE auth_method
                               END,
             oauth_linked_at = NOW()
         WHERE id = ?`,
        [googleId, userId]
      );

      // Keep a provider-level record for future extensibility
      await pool.execute(
        `INSERT INTO oauth_accounts (user_id, provider, provider_id, provider_email)
         VALUES (?, 'google', ?, ?)
         ON DUPLICATE KEY UPDATE provider_email = VALUES(provider_email)`,
        [userId, googleId, googleEmail]
      );

      logAuthEvent('google_account_linked', { userId, email: googleEmail, ip });
      await logAction(request, {
        userId:       userId,
        userEmail:    googleEmail,
        actionType:   ACTION.GOOGLE_ACCOUNT_LINKED,
        resourceType: 'user',
        resourceId:   userId,
        status:       'success',
      });

      const res = NextResponse.redirect(
        new URL('/dashboard?linked=google', request.url)
      );
      res.headers.append('Set-Cookie', clearStateCookie);
      return res;
    }

    // ════════════════════════════════════════════════════════════════════════
    // LOGIN mode — sign in or auto-link an existing user
    // ════════════════════════════════════════════════════════════════════════

    // 1. Look up user by their stable Google ID (fastest path for returning users)
    let [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.company_id,
              u.is_active, u.auth_method, u.google_id,
              c.name AS company_name
       FROM   users u
       LEFT   JOIN companies c ON c.id = u.company_id
       WHERE  u.google_id = ?
       LIMIT  1`,
      [googleId]
    );

    // 2. If not found by google_id, try matching on email.
    //    Google guarantees email verification, so auto-linking is safe here.
    let autoLinked = false;
    if (!rows.length) {
      [rows] = await pool.query(
        `SELECT u.id, u.name, u.email, u.role, u.company_id,
                u.is_active, u.auth_method, u.google_id,
                c.name AS company_name
         FROM   users u
         LEFT   JOIN companies c ON c.id = u.company_id
         WHERE  u.email = ?
         LIMIT  1`,
        [googleEmail]
      );

      if (rows.length > 0) {
        // Auto-link: the email matches — attach Google to this account
        autoLinked = true;
        await pool.execute(
          `UPDATE users
           SET google_id       = ?,
               auth_method     = CASE
                                   WHEN auth_method = 'password' THEN 'both'
                                   ELSE 'google'
                                 END,
               oauth_linked_at = NOW()
           WHERE id = ?`,
          [googleId, rows[0].id]
        );

        await pool.execute(
          `INSERT INTO oauth_accounts (user_id, provider, provider_id, provider_email)
           VALUES (?, 'google', ?, ?)
           ON DUPLICATE KEY UPDATE provider_email = VALUES(provider_email)`,
          [rows[0].id, googleId, googleEmail]
        );

        logAuthEvent('google_account_auto_linked', {
          userId: rows[0].id,
          email:  googleEmail,
          ip,
        });
      }
    }

    // 3. No user found — deny access (invite-only B2B SaaS)
    if (!rows.length) {
      logAuthEvent('oauth_no_account', { email: googleEmail, ip });
      return redirectAndClearState(request, '/login?error=no_account', clearStateCookie);
    }

    const user = rows[0];

    // ── Account active check ────────────────────────────────────────────────
    if (user.is_active === false || user.is_active === 0) {
      logAuthEvent('login_failure', {
        email:  user.email,
        userId: user.id,
        ip,
        reason: 'account_inactive',
      });
      return redirectAndClearState(request, '/login?error=account_inactive', clearStateCookie);
    }

    // ── Sign JWT (same payload shape as password-based login) ───────────────
    const canonicalRole = normalizeRole(user.role) ?? user.role;

    const token = await signToken({
      userId:    user.id,
      companyId: user.company_id,
      role:      canonicalRole,
      email:     user.email,
      name:      user.name || googleName,
    });

    // ── Record session ──────────────────────────────────────────────────────
    const sessionToken  = generateSessionToken();
    const sessionExpiry = toMySQLDatetime(expiresInHours(7 * 24));
    const userAgent     = request.headers.get('user-agent') || null;

    try {
      // Invalidate previous active sessions (same policy as password login)
      await pool.execute(
        `UPDATE user_sessions SET invalidated_at = NOW()
         WHERE user_id = ? AND invalidated_at IS NULL`,
        [user.id]
      );
      await pool.execute(
        `INSERT INTO user_sessions (user_id, session_token, expires_at, ip_address, user_agent, auth_method)
         VALUES (?, ?, ?, ?, ?, 'google')`,
        [user.id, sessionToken, sessionExpiry, ip, userAgent]
      );
    } catch (sessionErr) {
      // Non-fatal — don't fail login if session recording fails
      console.error('[google/callback] session error:', sessionErr.message);
    }

    // ── Audit log ───────────────────────────────────────────────────────────
    logAuthEvent('login_success', {
      email:  user.email,
      userId: user.id,
      role:   user.role,
      ip,
      method: 'google',
    });
    await logAction(request, {
      userId:       user.id,
      userEmail:    user.email,
      actionType:   autoLinked ? ACTION.GOOGLE_AUTO_LINKED : ACTION.GOOGLE_LOGIN,
      resourceType: 'user',
      resourceId:   user.id,
      status:       'success',
      statusReason: 'google_oauth',
    });

    // ── Set cookie and redirect to dashboard ────────────────────────────────
    const authCookie = buildAuthCookie(token, { isSecure });
    const dest       = canonicalRole === 'super_admin' ? '/dashboard/admin' : '/dashboard';

    const response = NextResponse.redirect(new URL(dest, request.url));
    response.headers.set('Set-Cookie', authCookie);
    response.headers.append('Set-Cookie', clearStateCookie);
    return response;

  } catch (err) {
    console.error('[google/callback]', err.message);
    logAuthEvent('oauth_error', { ip, error: err.message });
    return redirectAndClearState(request, '/login?error=oauth_error', clearStateCookie);
  }
}

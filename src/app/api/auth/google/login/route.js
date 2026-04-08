// src/app/api/auth/google/login/route.js
//
// GET /api/auth/google/login
//   Starts the Google OAuth 2.0 authorization flow by redirecting the
//   browser to Google's consent screen.
//
// GET /api/auth/google/login?action=link
//   Same flow but marks the session as a "link" operation so that the
//   callback attaches the Google identity to the currently signed-in user
//   instead of creating a new session.
//
// Required environment variables:
//   GOOGLE_CLIENT_ID          — from Google Cloud Console
//   GOOGLE_OAUTH_REDIRECT_URI — must match the authorized redirect URI
//                               configured in Google Cloud Console

import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getCookieSecure } from '@/lib/jwt';

export async function GET(request) {
  const clientId    = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    // Google OAuth is not configured — redirect back to login with an error
    return NextResponse.redirect(
      new URL('/login?error=oauth_not_configured', request.url)
    );
  }

  const { searchParams } = request.nextUrl;
  const action = searchParams.get('action') === 'link' ? 'link' : 'login';
  // Preserve the intended destination so the callback can redirect there after login
  const redirect = searchParams.get('redirect') || null;

  // ── CSRF protection ────────────────────────────────────────────────────────
  // Generate a random token that is stored in an HttpOnly cookie and also
  // embedded inside the OAuth state parameter.  The callback verifies that
  // both values match before accepting any token from Google.
  const csrf  = randomBytes(32).toString('hex');
  const statePayload = { csrf, action };
  if (redirect) statePayload.redirect = redirect;
  const state = Buffer.from(JSON.stringify(statePayload)).toString('base64url');

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: 'code',
    scope:         'openid email profile',
    state,
    access_type:   'offline',
    prompt:        'select_account',
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  const isSecure      = getCookieSecure(request);

  const response = NextResponse.redirect(googleAuthUrl);

  // Store CSRF token in a short-lived HttpOnly cookie.
  // The callback verifies that this value matches the 'csrf' field in state.
  response.headers.set(
    'Set-Cookie',
    [
      `oauth_state=${csrf}`,
      'HttpOnly',
      'Path=/',
      'Max-Age=600',   // 10 minutes — plenty of time to complete OAuth
      isSecure ? 'Secure' : '',
      'SameSite=Lax',
    ]
      .filter(Boolean)
      .join('; ')
  );

  return response;
}

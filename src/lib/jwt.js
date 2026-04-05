// src/lib/jwt.js

import { SignJWT, jwtVerify } from 'jose';

/**
 * Using 'jose' instead of 'jsonwebtoken'.
 *
 * Why: Next.js middleware runs on Edge Runtime where jsonwebtoken
 * does NOT work. jose is fully Edge + Node compatible, so we use
 * it everywhere for consistency.
 *
 * Install: npm install jose
 */

const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Determine whether the auth cookie should carry the Secure attribute.
 *
 * Resolution order (first match wins):
 *  1. COOKIE_SECURE env var — set to "false" to force HTTP mode,
 *     "true" to force HTTPS mode (useful for non-standard setups).
 *  2. x-forwarded-proto request header — detects HTTPS behind a reverse
 *     proxy (Nginx, Cloudflare, AWS ALB, …) at request time.
 *  3. NODE_ENV fallback — production assumes HTTPS; development assumes HTTP.
 *
 * @param {Request|null} request  Next.js/Web Request object (optional).
 * @returns {boolean}
 */
export function getCookieSecure(request = null) {
  // Explicit operator override via environment variable.
  // Set COOKIE_SECURE=false for HTTP-only deployments (e.g. plain HTTP behind
  // Nginx without SSL), or COOKIE_SECURE=true to force Secure in all cases.
  if (process.env.COOKIE_SECURE === 'false') return false;
  if (process.env.COOKIE_SECURE === 'true')  return true;

  // Infer from the actual transport protocol when a request is available.
  // Nginx should be configured with:
  //   proxy_set_header X-Forwarded-Proto $scheme;
  //   proxy_set_header X-Forwarded-Ssl   on;  (HTTPS only)
  if (request) {
    // Primary: X-Forwarded-Proto set by Nginx / AWS ALB / Cloudflare
    const proto = request.headers.get('x-forwarded-proto');
    if (proto) return proto.split(',')[0].trim() === 'https';

    // Secondary: X-Forwarded-Ssl set by some Nginx / Apache configurations
    const xssl = request.headers.get('x-forwarded-ssl');
    if (xssl) return xssl.trim() === 'on';

    // Tertiary: Front-End-Https set by older Microsoft / IIS ARR proxies
    const feHttps = request.headers.get('front-end-https');
    if (feHttps) return feHttps.trim().toLowerCase() === 'on';
  }

  // Fallback: require HTTPS in production, allow HTTP in development.
  // If you are running HTTP-only in production (no SSL), set COOKIE_SECURE=false
  // in your .env.local — otherwise the Secure cookie attribute will prevent
  // the browser from sending the auth cookie over plain HTTP connections.
  return process.env.NODE_ENV === 'production';
}

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return new TextEncoder().encode(secret);
}

/**
 * Sign JWT
 */
export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES)
    .sign(getSecret());
}

/**
 * Verify JWT
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
  } catch {
    return null;
  }
}

/**
 * Build auth cookie
 * @param {string} token
 * @param {{ isSecure?: boolean, request?: Request }} [options]
 */
export function buildAuthCookie(token, options = {}) {
  const isSecure = options.isSecure ?? getCookieSecure(options.request ?? null);

  return [
    `auth_token=${token}`,
    'HttpOnly',
    'Path=/',
    `Max-Age=${7 * 24 * 60 * 60}`,
    isSecure ? 'Secure' : '',
    'SameSite=Lax',
  ]
    .filter(Boolean)
    .join('; ');
}

/**
 * Build a cookie header value that clears the auth cookie.
 * @param {{ isSecure?: boolean, request?: Request }} [options]
 */
export function clearAuthCookie(options = {}) {
  const isSecure = options.isSecure ?? getCookieSecure(options.request ?? null);
  return [
    'auth_token=',
    'HttpOnly',
    'Path=/',
    'Max-Age=0',
    isSecure ? 'Secure' : '',
    'SameSite=Lax',
  ]
    .filter(Boolean)
    .join('; ');
}
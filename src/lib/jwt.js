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
 */
export function buildAuthCookie(token, options = {}) {
  const {
    isSecure = false,
  } = options;

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

export function clearAuthCookie() {
  const isSecure = process.env.NODE_ENV === 'production';
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
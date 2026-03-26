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
  if (!secret) throw new Error('JWT_SECRET is not set in environment variables');
  return new TextEncoder().encode(secret);
}

/**
 * Sign a JWT token.
 * @param {object} payload  - data to encode (userId, companyId, role, etc.)
 * @returns {Promise<string>} - signed JWT string
 */
export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES)
    .sign(getSecret());
}

/**
 * Verify and decode a JWT token.
 * Returns null if invalid or expired — never throws.
 * @param {string} token
 * @returns {Promise<object|null>}
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
 * Build the httpOnly cookie string for Set-Cookie header.
 * @param {string} token
 * @returns {string}
 */
export function buildAuthCookie(token) {
  const isProd = process.env.NODE_ENV === 'production';
  return [
    `auth_token=${token}`,
    'HttpOnly',
    'Path=/',
    `Max-Age=${7 * 24 * 60 * 60}`, // 7 days in seconds
    isProd ? 'Secure' : '',
    'SameSite=Lax',
  ]
    .filter(Boolean)
    .join('; ');
}

/**
 * Build a cookie string that clears the auth cookie.
 * @returns {string}
 */
export function clearAuthCookie() {
  return 'auth_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax';
}
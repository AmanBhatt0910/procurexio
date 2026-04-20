/**
 * src/lib/rateLimit.js
 *
 * Simple sliding-window in-memory rate limiter.
 *
 * Suitable for single-instance (Node.js) deployments.
 * For distributed / serverless deployments, replace `store` with a Redis
 * or Upstash client so state is shared across instances.
 *
 * Usage (inside an API route handler):
 *
 *   import { applyRateLimit } from '@/lib/rateLimit';
 *
 *   export async function POST(request) {
 *     const limited = applyRateLimit(request, { max: 10, windowMs: 60_000 });
 *     if (limited) return limited;   // 429 response
 *     // ... handler logic
 *   }
 */

// Module-level store — persists across requests within a single Node.js process.
const store = new Map();
let _cleanupCounter = 0;

/**
 * Remove expired entries from the store.
 * Called probabilistically to avoid per-request overhead.
 */
function maybeCleanup() {
  _cleanupCounter += 1;
  if (_cleanupCounter < 500) return;
  _cleanupCounter = 0;
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

/**
 * Check and increment the rate-limit counter for a key.
 *
 * @param {string} key       - Unique key (e.g. "login:1.2.3.4")
 * @param {number} max       - Max requests allowed in the window
 * @param {number} windowMs  - Window duration in milliseconds
 * @returns {{ allowed: boolean, remaining: number, resetAt: number }}
 */
function checkRateLimit(key, max, windowMs) {
  maybeCleanup();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
  }

  entry.count += 1;
  const remaining = Math.max(0, max - entry.count);

  if (entry.count > max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining, resetAt: entry.resetAt };
}

/**
 * Extract the client IP address from a Next.js request.
 * Handles reverse-proxy setups that set X-Forwarded-For.
 *
 * @param {Request} request
 * @returns {string}
 */
export function getClientIP(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Apply rate limiting to a request.
 *
 * Returns a 429 `Response` if the limit is exceeded, otherwise `null`.
 *
 * @param {Request} request
 * @param {object}  options
 * @param {number}  [options.max=100]        - Max requests per window
 * @param {number}  [options.windowMs=60000] - Window in milliseconds
 * @param {string}  [options.keyPrefix='api']- Prefix for the store key
 * @returns {Response|null}
 */
export function applyRateLimit(request, options = {}) {
  const { max = 100, windowMs = 60_000, keyPrefix = 'api' } = options;
  const ip  = getClientIP(request);
  const key = `${keyPrefix}:${ip}`;

  const result = checkRateLimit(key, max, windowMs);

  if (!result.allowed) {
    const retryAfterSecs = Math.ceil((result.resetAt - Date.now()) / 1000);
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      {
        status: 429,
        headers: {
          'Content-Type':      'application/json',
          'Retry-After':       String(retryAfterSecs),
          'X-RateLimit-Limit': String(max),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
        },
      },
    );
  }

  return null;
}

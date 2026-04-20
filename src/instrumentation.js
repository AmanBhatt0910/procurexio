/**
 * src/instrumentation.js
 *
 * Next.js instrumentation hook — executed once when the server process starts.
 * Used to initialise background tasks such as the cron job scheduler.
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * Cron jobs are started only:
 *   - In the Node.js runtime (not in Edge or during the build step)
 *   - When NODE_ENV === 'production' OR when ENABLE_CRON=true is explicitly set
 *     (the ENABLE_CRON flag allows you to test cron startup in development
 *     without modifying NODE_ENV)
 */
export async function register() {
  // Guard: only run in the Node.js server runtime, not in Edge or during build
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const isProduction  = process.env.NODE_ENV === 'production';
  const forceEnabled  = process.env.ENABLE_CRON === 'true';

  if (!isProduction && !forceEnabled) {
    // In development the cron jobs are skipped by default to avoid duplicate
    // HTTP calls while Next.js hot-reloads the server.  Set ENABLE_CRON=true
    // in your .env.local to test the scheduler locally.
    return;
  }

  const { startCronJobs } = await import('@/lib/services/cronService');
  startCronJobs();
}

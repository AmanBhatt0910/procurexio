/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to every response
        source: '/(.*)',
        headers: [
          // Prevent MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Disallow embedding in iframes (clickjacking protection)
          { key: 'X-Frame-Options', value: 'DENY' },
          // Reduce information leakage via Referer header
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Disable DNS prefetching to reduce information leakage
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          // Restrict browser feature APIs to the minimum required
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          // NOTE: Strict-Transport-Security (HSTS) is intentionally set at the
          // reverse-proxy / CDN layer (nginx / Vercel / Cloudflare) rather than
          // here, so it only applies over HTTPS.  Uncomment the line below once
          // you have HTTPS and a reverse proxy in place:
          // { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
      {
        // Prevent browsers from caching authenticated API responses
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, private',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

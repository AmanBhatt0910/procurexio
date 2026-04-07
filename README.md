This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Variables

Create a `.env.local` file at the project root with the following variables:

```env
# ── Database ──────────────────────────────────────────────────────
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=procurement_db

# ── JWT / Auth ────────────────────────────────────────────────────
JWT_SECRET=your-very-secret-key-min-32-chars
JWT_EXPIRES_IN=7d

# ── Cookie ────────────────────────────────────────────────────────
# Set to "false" for plain HTTP deployments, "true" to force Secure
# COOKIE_SECURE=false

# ── Email (Resend) ────────────────────────────────────────────────
RESEND_API_KEY=re_...
INVITE_FROM_EMAIL=no-reply@procurexio.com

# ── App ───────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_NAME=Procurexio
NEXT_PUBLIC_BASE_URL=http://localhost:3001

# ── Google OAuth (optional — enables "Login with Google") ─────────
# 1. Go to https://console.cloud.google.com/
# 2. Create a project (or select an existing one)
# 3. Enable the "Google+ API" or "Google Identity" service
# 4. Navigate to APIs & Services → Credentials → Create OAuth 2.0 Client ID
# 5. Application type: Web application
# 6. Add an Authorized Redirect URI:
#      http://localhost:3001/api/auth/google/callback  (development)
#      https://yourdomain.com/api/auth/google/callback (production)
# 7. Copy the Client ID and Client Secret below
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
```

### Google OAuth Database Migration

Before enabling Google OAuth, run the migration once against your database:

```bash
mysql -u root -p procurement_db < src/sql/9_oauth_schema.sql
```

This migration:
- Adds `google_id`, `auth_method`, `oauth_linked_at` columns to the `users` table
- Makes the `password` column nullable (for Google-only accounts)
- Adds `auth_method` column to `user_sessions`
- Creates the `oauth_accounts` table

All existing data is fully preserved — no records are modified.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

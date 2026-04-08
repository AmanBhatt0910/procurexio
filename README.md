# Procurexio

**Procurexio** is a multi-tenant B2B SaaS procurement intelligence platform. It manages the end-to-end procurement lifecycle — from RFQ creation and vendor bid collection through evaluation, contract awarding, and team management.

---

## Product Overview

Procurexio is built for **procurement and sourcing teams** at organizations (buyers) who need to:

- Create and publish **Requests for Quotation (RFQs)** to qualified vendors
- Collect, compare, and **evaluate vendor bids** with structured scoring
- **Award contracts** and track fulfillment through a centralized dashboard
- Manage **vendor relationships** and maintain an organized vendor directory
- Enforce **role-based access control** across team members

Vendors access the platform through invite-only links to submit bids and track their proposal status.

---

## Key Features

| Feature | Description |
|---|---|
| **Multi-tenant Architecture** | Complete data isolation per organization — each company has its own workspace |
| **RFQ Management** | Create, publish, and track RFQs with line items, deadlines, and status workflows |
| **Vendor Collaboration** | Invite vendors via email; they access a dedicated portal to submit bids |
| **Bid Comparison** | Side-by-side comparison tables with per-item pricing and totals |
| **Smart Evaluation** | Score and rank bids using configurable evaluation criteria |
| **Contract Awarding** | Award contracts with one click; auto-notify vendors and generate contract records |
| **Role-Based Access** | Five roles with granular permissions: `super_admin`, `company_admin`, `manager`, `employee`, `vendor_user` |
| **Google OAuth** | Optional "Sign in with Google" for buyer accounts |
| **Audit Logs** | Full activity audit trail for compliance and accountability |
| **Smart Notifications** | In-app notification inbox for RFQ updates, bid submissions, and awards |

---

## User Roles & Workflows

### Buyer-Side Roles

| Role | Capabilities |
|---|---|
| `company_admin` | Full access: users, company settings, RFQs, vendors, contracts |
| `manager` | Create/manage RFQs, vendors, and contracts; cannot manage users |
| `employee` | Read-only access to RFQs, vendors, and contracts |

### Vendor-Side Role

| Role | Capabilities |
|---|---|
| `vendor_user` | View invited RFQs, submit and manage bids |

### Platform Role

| Role | Capabilities |
|---|---|
| `super_admin` | Platform-level admin: all companies, users, activity logs, settings |

### Key User Flows

**New Company Signup:**
`/` → Get Started → `/register` → Fill company details → Dashboard

**Team Invite:**
Email link → `/register?token=<token>` → Accept invite → Dashboard

**Procurement Workflow (Buyer):**
Create RFQ → Invite Vendors → Receive Bids → Evaluate & Score → Award Contract → Track in `/dashboard/contracts`

**Vendor Workflow:**
Receive invite email → Register → `/dashboard/bids` → Submit bid with line item pricing

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router, JavaScript) |
| **Styling** | Tailwind CSS + inline CSS-in-JSX |
| **Database** | MySQL |
| **Auth** | JWT (HTTP-only cookies) + Google OAuth 2.0 |
| **Email** | Resend API |
| **Deployment** | Vercel (recommended) or any Node.js host |

---

## Development Setup

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- A [Resend](https://resend.com) account (for transactional email)

### 1. Clone and install

```bash
git clone https://github.com/AmanBhatt0910/procurexio.git
cd procurexio
npm install
```

### 2. Configure environment variables

Create a `.env.local` file at the project root:

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

### 3. Set up the database

Run the SQL migration scripts in order:

```bash
mysql -u root -p -e "CREATE DATABASE procurement_db;"
mysql -u root -p procurement_db < src/sql/1_schema.sql
# ... run remaining migration files in sequence
```

To enable Google OAuth, also run:

```bash
mysql -u root -p procurement_db < src/sql/9_oauth_schema.sql
```

This migration adds `google_id`, `auth_method`, and `oauth_linked_at` columns to the `users` table, makes `password` nullable (for Google-only accounts), and creates the `oauth_accounts` table. All existing data is preserved.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### Useful Commands

```bash
npm run dev      # Start development server (port 3001)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## Deployment Guide

### Deploy on Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables from `.env.local` in the Vercel dashboard
4. Set `NEXT_PUBLIC_BASE_URL` to your production domain (e.g. `https://procurexio.com`)
5. Deploy

### Deploy on a VPS / Node.js Host

```bash
npm install
npm run build
npm run start
```

Ensure your MySQL instance is accessible and all environment variables are set in production.

### Environment Variables for Production

| Variable | Required | Notes |
|---|---|---|
| `DB_HOST` | ✅ | Your MySQL host |
| `DB_USER` | ✅ | Database user |
| `DB_PASSWORD` | ✅ | Database password |
| `DB_NAME` | ✅ | Database name |
| `JWT_SECRET` | ✅ | Min 32 chars, keep secret |
| `RESEND_API_KEY` | ✅ | For invite and reset emails |
| `NEXT_PUBLIC_BASE_URL` | ✅ | Your production URL |
| `GOOGLE_CLIENT_ID` | Optional | For Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Optional | For Google OAuth |
| `COOKIE_SECURE` | Optional | Set to `true` in production |

---

## Architecture Overview

```
/src
├── app/
│   ├── (auth)/          # Auth pages (login, register, forgot/reset password)
│   ├── dashboard/       # Authenticated dashboard (role-gated routes)
│   ├── contact/         # Contact page
│   ├── terms/           # Terms of Service
│   ├── privacy/         # Privacy Policy
│   ├── sitemap.js       # Dynamic sitemap for SEO
│   ├── layout.js        # Root layout with global metadata
│   └── page.js          # Public marketing homepage
├── components/
│   ├── auth/            # AuthInput, AuthButton, RoleGuard
│   ├── Layout/          # DashboardLayout, Sidebar, TopBar
│   └── marketing/       # Navbar, Hero, Features, Pricing, Footer, etc.
├── hooks/               # useAuth, custom hooks
├── lib/                 # audit.js, rbac.js, db.js, rateLimit.js, etc.
├── config/              # logging.js, other config
└── sql/                 # Database migration files
/public
└── robots.txt           # Crawler directives
```

### Key Architectural Decisions

- **Multi-tenancy**: Each company's data is scoped by `company_id` at the database query level
- **Auth**: JWT stored in HTTP-only cookies; middleware validates and enforces RBAC on every request
- **Rate Limiting**: In-memory rate limiter in `src/middleware.js` (10 req/min auth, 60 req/min API)
- **Audit Logging**: Dual storage — MySQL `audit_logs` table + category log files via `src/lib/audit.js`

---

## SEO & Sitemap

The sitemap is auto-generated at `/sitemap.xml` using Next.js App Router's `sitemap.js`. It includes all public pages with appropriate priorities. Submit `https://yourdomain.com/sitemap.xml` to Google Search Console.

Crawler directives are in `public/robots.txt` — dashboard and API routes are disallowed.

---

## Support & Contact

- **General:** hello@procurexio.com
- **Support:** support@procurexio.com
- **Security:** security@procurexio.com
- **Issues:** [GitHub Issues](https://github.com/AmanBhatt0910/procurexio/issues)

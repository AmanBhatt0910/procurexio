// src/config/README.md
# Configuration Guide

This directory contains all centralized configuration files for the Procurexio application. These files replace hardcoded values scattered throughout the codebase and provide a single source of truth for settings.

## Quick Reference

### Where to Find Configuration

| What You Need | File | Key Variable(s) |
|---------------|------|-----------------|
| API endpoints | `api.js` | `AUTH_ENDPOINTS`, `NOTIFICATION_ENDPOINTS`, etc. |
| Dashboard/App routes | `routes.js` | `DASHBOARD_ROUTES`, `AUTH_ROUTES`, `PUBLIC_ROUTES` |
| Email settings | `email.js` | `EMAIL_FROM`, `APP_NAME`, `EMAIL_SUBJECTS` |
| Auth & middleware rules | `middleware.js` | `PUBLIC_AUTH_ENDPOINTS`, `PROTECTED_ROUTES_CONFIG`, `JWT_SECRET` |
| Business rules | `constants.js` | Rate limits, password policies, bid minimums, etc. |
| Localization | `timezones.js`, `currencies.js`, `taxes.js`, etc. | Regional settings |

## File Descriptions

### api.js
Central location for all API endpoints and the base application URL.

```javascript
// Example usage
import { BASE_URL, AUTH_ENDPOINTS, NOTIFICATION_ENDPOINTS } from '@/config/api';

const loginUrl = `${BASE_URL}/login`;
const meEndpoint = AUTH_ENDPOINTS.ME;  // '/api/auth/me'
```

**When to use:** 
- Client-side API calls
- Email links and redirects
- Building dynamic URLs

### routes.js
Defines all application routes (dashboards, auth pages, public pages) and access control rules.

```javascript
// Example usage
import { DASHBOARD_ROUTES, PROTECTED_ROUTES, DEFAULT_LOGIN_REDIRECT } from '@/config/routes';

// Navigate to dashboard
redirect(DASHBOARD_ROUTES.HOME);

// Get role requirements for a route
const routeConfig = PROTECTED_ROUTES['/dashboard/admin'];  // { roles: ['super_admin'] }
```

**When to use:**
- Navigation and redirects
- Route protection checks
- Building navigation menus

### email.js
Centralized email configuration including sender, app name, polling intervals, and subjects.

```javascript
// Example usage
import { EMAIL_FROM, APP_NAME, EMAIL_SUBJECTS, NOTIFICATION_POLL_INTERVAL } from '@/config/email';

const emailSubject = EMAIL_SUBJECTS.TEAM_INVITE(companyName);
setInterval(fetchNotifications, NOTIFICATION_POLL_INTERVAL);
```

**When to use:**
- Email sending (from, app name, subjects)
- Notification polling setup
- Email retry logic

### middleware.js
Security and middleware configuration including JWT settings, rate limiting, and route protection.

```javascript
// Example usage (internal use only)
import { PUBLIC_AUTH_ENDPOINTS, JWT_SECRET, PROTECTED_ROUTES_CONFIG } from '@/config/middleware';
```

**When to use:**
- Middleware (src/middleware.js)
- JWT verification
- Route protection rules

### constants.js
Business logic constants including password policies, account lockout, bid minimums, etc.

```javascript
// Example usage
import { MAX_FAILED_ATTEMPTS, PASSWORD_MIN_LENGTH, INVITATION_EXPIRY_DAYS } from '@/config/constants';
```

**When to use:**
- Authentication logic (password validation, account lockout)
- Bidding logic (bid minimums, revisions)
- Evaluation logic (score ranges)
- OAuth and invitation expiry

## Common Patterns

### Adding a New API Endpoint

1. Open `src/config/api.js`
2. Add to the appropriate category (e.g., VENDOR_ENDPOINTS):
   ```javascript
   export const VENDOR_ENDPOINTS = {
     LIST: '/api/vendors',
     CREATE: '/api/vendors',
     GET: (id) => `/api/vendors/${id}`,
   };
   ```
3. Import and use in your component:
   ```javascript
   import { VENDOR_ENDPOINTS } from '@/config/api';
   const response = await fetch(VENDOR_ENDPOINTS.LIST);
   ```

### Adding a New Dashboard Route

1. Open `src/config/routes.js`
2. Add to DASHBOARD_ROUTES:
   ```javascript
   export const DASHBOARD_ROUTES = {
     HOME: '/dashboard',
     NEW_SECTION: '/dashboard/new-section',
   };
   ```
3. Add access control to PROTECTED_ROUTES if needed:
   ```javascript
   export const PROTECTED_ROUTES = {
     '/dashboard/new-section': { roles: ['super_admin', 'manager'] },
   };
   ```

### Adding a New Configuration Constant

1. Open the appropriate file (constants.js, email.js, etc.)
2. Add your constant with documentation:
   ```javascript
   /** Maximum file upload size in MB */
   export const MAX_FILE_UPLOAD_MB = parseInt(process.env.MAX_FILE_UPLOAD_MB, 10) || 100;
   ```
3. Add to .env.example for documentation
4. Import and use:
   ```javascript
   import { MAX_FILE_UPLOAD_MB } from '@/config/constants';
   ```

## Environment Variables

Config files read from environment variables with safe defaults. To override:

```env
# .env.local

# API Configuration
NEXT_PUBLIC_BASE_URL=https://app.example.com
NEXT_PUBLIC_APP_NAME=My App

# Email Configuration
INVITE_FROM_EMAIL="MyApp <no-reply@myapp.com>"

# Authentication
JWT_SECRET=your-super-secret-key-here
MAX_FAILED_ATTEMPTS=5
PASSWORD_MIN_LENGTH=8

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=60000

# Notification Polling
NOTIFICATION_POLL_INTERVAL=30000
```

## Best Practices

✅ **DO:**
- Use configurations from these files instead of hardcoding values
- Group related constants together
- Add clear comments for each configuration option
- Use environment variables with sensible defaults
- Create derived values (e.g., INVITATION_EXPIRY_MS from INVITATION_EXPIRY_DAYS)

❌ **DON'T:**
- Hardcode URLs, paths, or API endpoints in components
- Duplicate configuration values across files
- Add business logic to config files (use lib/ for that)
- Modify config values at runtime (they're immutable)

## Migration Checklist

When adding new features that might have hardcoded values:

- [ ] Identify any hardcoded strings/numbers
- [ ] Create or update appropriate config file
- [ ] Export the new constant
- [ ] Update all files that were using hardcoded values
- [ ] Add to environment variables documentation
- [ ] Test with different environment variable values

## Support

For questions about configuration management:
1. Check this README first
2. Review similar patterns in existing code
3. Check environment variables documentation

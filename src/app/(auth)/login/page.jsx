'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthButton, AuthInput, AuthSplitLayout } from '@/components/auth';

const OAUTH_ERROR_MESSAGES = {
  oauth_denied: 'Google sign-in was cancelled. Please try again.',
  oauth_invalid: 'Invalid OAuth request. Please try again.',
  oauth_invalid_state: 'Invalid OAuth state. Please try again.',
  oauth_state_mismatch: 'Security check failed. Please try again.',
  oauth_not_configured: 'Google sign-in is not available right now.',
  oauth_profile_error: 'Could not retrieve your Google profile. Please try again.',
  oauth_error: 'Google sign-in encountered an error. Please try again.',
  no_account: 'No account found for this Google address. Please register or ask for an invite.',
  account_inactive: 'Your account has been deactivated. Please contact your administrator.',
  not_authenticated: 'Please sign in first.',
};

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const errorCode = searchParams.get('error');
    if (errorCode && OAUTH_ERROR_MESSAGES[errorCode]) {
      setError(OAUTH_ERROR_MESSAGES[errorCode]);
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })
      .then((res) => {
        if (!cancelled && res.ok) {
          res.json().then((data) => {
            if (!cancelled) {
              const role = data.data?.role;
              const safeDest = redirect.startsWith('/') ? redirect : '/dashboard';
              const dest = role === 'super_admin' ? '/dashboard/admin' : safeDest;
              window.location.replace(dest);
            }
          });
        } else if (!cancelled) {
          setCheckingAuth(false);
        }
      })
      .catch(() => {
        if (!cancelled) setCheckingAuth(false);
      });
    return () => {
      cancelled = true;
    };
  }, [redirect]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed. Please try again.');
        return;
      }

      const role = data.data?.role;
      const safeDest = redirect.startsWith('/') ? redirect : '/dashboard';
      const destination = role === 'super_admin' ? '/dashboard/admin' : safeDest;
      window.location.href = destination;
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    setError('');
    setGoogleLoading(true);
    const dest = redirect.startsWith('/') && redirect !== '/dashboard' ? redirect : null;
    const loginUrl = dest
      ? `/api/auth/google/login?redirect=${encodeURIComponent(dest)}`
      : '/api/auth/google/login';
    window.location.href = loginUrl;
  }

  if (checkingAuth) return null;

  return (
    <>
      <button
        type="button"
        className="auth-login-google-btn"
        onClick={handleGoogleLogin}
        disabled={googleLoading || loading}
      >
        {googleLoading ? (
          <span className="auth-btn-spinner-wrap">
            <svg className="auth-btn-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="8" />
            </svg>
            Redirecting to Google…
          </span>
        ) : (
          <span className="auth-login-google-btn-inner">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </span>
        )}
      </button>

      <div className="auth-login-divider">or sign in with email</div>

      <form className="auth-login-form" onSubmit={handleSubmit}>
        {error && (
          <div className="auth-login-form-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        <AuthInput
          label="Work email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
          autoComplete="email"
          icon={(
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          )}
        />

        <div>
          <div className="auth-login-form-row">
            <label className="auth-input-label">Password <span className="auth-input-required">*</span></label>
            <Link href="/forgot-password" className="auth-login-forgot-link">
              Forgot password?
            </Link>
          </div>
          <AuthInput
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            icon={(
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            )}
          />
        </div>

        <AuthButton loading={loading}>Sign in</AuthButton>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <>
      <style>{`
        .auth-login-form-header { margin-bottom: 36px; }
        .auth-login-form-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.75rem;
          font-weight: 700;
          letter-spacing: -.03em;
          color: var(--ink);
          margin-bottom: 8px;
        }
        .auth-login-form-subtitle { color: var(--ink-soft); font-size: .93rem; line-height: 1.5; }
        .auth-login-form { display: flex; flex-direction: column; gap: 20px; }
        .auth-login-google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px 24px;
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          background: var(--white);
          font-family: 'DM Sans', sans-serif;
          font-size: .93rem;
          font-weight: 500;
          color: var(--ink);
          cursor: pointer;
          transition: background .15s, border-color .15s, box-shadow .15s, transform .1s;
          margin-bottom: 4px;
        }
        .auth-login-google-btn:hover:not(:disabled) {
          background: #f7f5f3;
          border-color: #ccc8c2;
          box-shadow: 0 2px 8px rgba(15,14,13,.07);
          transform: translateY(-1px);
        }
        .auth-login-google-btn:active:not(:disabled) { transform: translateY(0); }
        .auth-login-google-btn:disabled { opacity: .6; cursor: not-allowed; }
        .auth-login-google-btn-inner { display: flex; align-items: center; gap: 10px; }
        .auth-login-form-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .auth-login-forgot-link {
          font-size: .82rem;
          color: var(--ink-soft);
          text-decoration: none;
          transition: color .15s;
        }
        .auth-login-forgot-link:hover { color: var(--ink); }
        .auth-login-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--ink-faint);
          font-size: .8rem;
          margin: 4px 0;
        }
        .auth-login-divider::before,
        .auth-login-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }
        .auth-login-form-error {
          background: #fff5f2;
          border: 1px solid #f5c4b5;
          border-radius: var(--radius);
          padding: 12px 14px;
          font-size: .85rem;
          color: #a83e12;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .auth-login-form-footer {
          margin-top: 32px;
          text-align: center;
          font-size: .85rem;
          color: var(--ink-soft);
        }
        .auth-login-form-footer a {
          color: var(--ink);
          font-weight: 500;
          text-decoration: none;
        }
        .auth-login-form-footer a:hover { text-decoration: underline; }
      `}</style>

      <AuthSplitLayout
        badge="Multi-tenant procurement"
        tagline={<>Smarter sourcing.<br /><em>Faster decisions.</em></>}
        subtitle="One platform for RFQs, vendor bids, and contract awards — built for teams that move fast."
      >
        <div className="auth-login-form-header">
          <h1 className="auth-login-form-title">Welcome back</h1>
          <p className="auth-login-form-subtitle">Sign in to your workspace to continue.</p>
        </div>

        <Suspense fallback={<div className="auth-login-form">Loading...</div>}>
          <LoginForm />
        </Suspense>

        <div className="auth-login-form-footer">
          Don&apos;t have an account? <Link href="/register">Create workspace</Link>
        </div>
      </AuthSplitLayout>
    </>
  );
}

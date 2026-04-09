'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthSplitLayout from '@/components/auth/AuthSplitLayout';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenError('No reset token found. Please request a new password reset link.');
      setValidating(false);
      return;
    }

    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then((data) => {
        if (data.valid) {
          setTokenValid(true);
        } else {
          setTokenError(data.error || 'This reset link is invalid or has expired.');
        }
      })
      .catch(() => {
        setTokenError('Unable to validate the reset link. Please try again.');
      })
      .finally(() => setValidating(false));
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .auth-form-header { margin-bottom: 36px; }
        .auth-form-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.75rem;
          font-weight: 700;
          letter-spacing: -.03em;
          color: var(--ink);
          margin-bottom: 8px;
        }
        .auth-form-subtitle { color: var(--ink-soft); font-size: .93rem; line-height: 1.5; }
        .auth-form { display: flex; flex-direction: column; gap: 20px; }
        .auth-field { display: flex; flex-direction: column; gap: 6px; }
        .auth-field-label {
          font-size: .8rem;
          font-weight: 500;
          color: var(--ink);
          letter-spacing: .01em;
        }
        .auth-field-input-wrap {
          display: flex;
          align-items: center;
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          background: var(--white);
          transition: border-color .15s, box-shadow .15s;
          overflow: hidden;
        }
        .auth-field-input-wrap:focus-within {
          border-color: var(--ink);
          box-shadow: 0 0 0 3px rgba(15,14,13,.06);
        }
        .auth-field-input {
          flex: 1;
          border: none;
          outline: none;
          padding: 13px 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: .93rem;
          color: var(--ink);
          background: transparent;
        }
        .auth-field-input::placeholder { color: var(--ink-faint); }
        .auth-field-toggle {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0 14px;
          color: var(--ink-faint);
          display: flex;
          align-items: center;
        }
        .auth-field-toggle:hover { color: var(--ink-soft); }
        .auth-btn {
          border: none;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: .93rem;
          font-weight: 500;
          border-radius: var(--radius);
          padding: 13px 24px;
          transition: background .15s, transform .1s, box-shadow .15s;
          width: 100%;
        }
        .auth-btn--primary { background: var(--ink); color: #fff; }
        .auth-btn--primary:hover:not(:disabled) {
          background: #1e1c1a;
          box-shadow: 0 4px 16px rgba(15,14,13,.18);
          transform: translateY(-1px);
        }
        .auth-btn:disabled { cursor: not-allowed; opacity: .55; }
        .auth-form-error {
          background: #fff5f2;
          border: 1px solid #f5c4b5;
          border-radius: var(--radius);
          padding: 12px 14px;
          font-size: .85rem;
          color: #a83e12;
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }
        .auth-form-warning {
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: var(--radius);
          padding: 16px 18px;
          font-size: .88rem;
          color: #92400e;
          text-align: center;
        }
        .auth-form-success {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: var(--radius);
          padding: 20px;
          text-align: center;
        }
        .auth-form-success-icon { font-size: 2rem; margin-bottom: 10px; }
        .auth-form-success-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.05rem;
          font-weight: 700;
          color: #166534;
          margin-bottom: 6px;
        }
        .auth-form-success-sub { font-size: .88rem; color: #166534; line-height: 1.5; }
        .auth-validating {
          text-align: center;
          padding: 40px 0;
          color: var(--ink-soft);
          font-size: .93rem;
        }
        .auth-form-footer {
          margin-top: 32px;
          text-align: center;
          font-size: .85rem;
          color: var(--ink-soft);
        }
        .auth-form-footer a { color: var(--ink); font-weight: 500; text-decoration: none; }
        .auth-form-footer a:hover { text-decoration: underline; }
        @keyframes authSpin { to { transform: rotate(360deg); } }
        .auth-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: authSpin .7s linear infinite;
          display: inline-block;
          margin-right: 8px;
          vertical-align: middle;
        }
      `}</style>

      <AuthSplitLayout
        badge="Set new password"
        tagline={<>Almost there.<br /><em>Choose wisely.</em></>}
        subtitle="Pick a strong, unique password to secure your account. We recommend at least 12 characters."
      >
        <div className="auth-form-header">
          <h1 className="auth-form-title">Set new password</h1>
          <p className="auth-form-subtitle">Enter and confirm your new password below.</p>
        </div>

        {validating ? (
          <div className="auth-validating">
            <span className="auth-spinner" />
            Validating your reset link&hellip;
          </div>
        ) : !tokenValid ? (
          <>
            <div className="auth-form-warning">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline-block', marginRight: '6px', verticalAlign: 'middle', flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {tokenError}
            </div>
            <div className="auth-form-footer">
              <Link href="/forgot-password">Request a new reset link</Link>
              {' · '}
              <Link href="/login">Back to sign in</Link>
            </div>
          </>
        ) : success ? (
          <div className="auth-form-success">
            <div className="auth-form-success-icon">✅</div>
            <div className="auth-form-success-title">Password updated!</div>
            <p className="auth-form-success-sub">
              Your password has been changed successfully.
              Redirecting you to the sign-in page&hellip;
            </p>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
              <div className="auth-form-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <div className="auth-field">
              <label className="auth-field-label" htmlFor="password">New password</label>
              <div className="auth-field-input-wrap">
                <input
                  id="password"
                  className="auth-field-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  autoComplete="new-password"
                  minLength={8}
                />
                <button
                  type="button"
                  className="auth-field-toggle"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-field-label" htmlFor="confirm">Confirm new password</label>
              <div className="auth-field-input-wrap">
                <input
                  id="confirm"
                  className="auth-field-input"
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat your new password"
                  required
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-btn auth-btn--primary"
              disabled={loading}
            >
              {loading ? (
                <><span className="auth-spinner" />Updating password&hellip;</>
              ) : (
                'Set new password'
              )}
            </button>
          </form>
        )}

        <div className="auth-form-footer">
          Remember your password? <Link href="/login">Back to sign in</Link>
        </div>
      </AuthSplitLayout>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={(
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', fontFamily: 'sans-serif', color: '#6b6660' }}>
          Loading&hellip;
        </div>
      )}
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

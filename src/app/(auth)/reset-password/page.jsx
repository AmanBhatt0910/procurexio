// src/app/(auth)/reset-password/page.jsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const token        = searchParams.get('token') || '';

  const [password, setPassword]         = useState('');
  const [confirm, setConfirm]           = useState('');
  const [loading, setLoading]           = useState(false);
  const [validating, setValidating]     = useState(true);
  const [tokenValid, setTokenValid]     = useState(false);
  const [tokenError, setTokenError]     = useState('');
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenError('No reset token found. Please request a new password reset link.');
      setValidating(false);
      return;
    }

    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(data => {
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
      const res  = await fetch('/api/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      setSuccess(true);
      // Redirect to login after 3 seconds
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
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --ink:      #0f0e0d;
          --ink-soft: #6b6660;
          --ink-faint:#b8b3ae;
          --surface:  #faf9f7;
          --white:    #ffffff;
          --accent:   #c8501a;
          --accent-h: #a83e12;
          --border:   #e4e0db;
          --radius:   10px;
          --shadow:   0 1px 3px rgba(15,14,13,.06), 0 8px 32px rgba(15,14,13,.08);
        }

        body {
          font-family: 'DM Sans', sans-serif;
          background: var(--surface);
          color: var(--ink);
          min-height: 100dvh;
          display: flex;
        }

        .page {
          display: flex;
          width: 100%;
          min-height: 100dvh;
        }

        .panel-left {
          flex: 1;
          background: var(--ink);
          display: none;
          position: relative;
          overflow: hidden;
        }
        @media (min-width: 900px) { .panel-left { display: flex; align-items: flex-end; padding: 52px; } }

        .panel-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 50% at 20% 80%, rgba(200,80,26,.18) 0%, transparent 70%),
            radial-gradient(ellipse 40% 60% at 80% 20%, rgba(200,80,26,.10) 0%, transparent 60%);
        }

        .panel-left-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        .panel-left-content { position: relative; z-index: 1; }

        .panel-tagline {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2rem, 3.5vw, 3rem);
          font-weight: 700;
          color: #fff;
          line-height: 1.15;
          letter-spacing: -.02em;
          margin-bottom: 20px;
        }

        .panel-tagline em { font-style: normal; color: var(--accent); }

        .panel-sub {
          color: rgba(255,255,255,.45);
          font-size: .95rem;
          font-weight: 300;
          max-width: 320px;
          line-height: 1.7;
        }

        .panel-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 100px;
          padding: 6px 14px;
          font-size: .78rem;
          color: rgba(255,255,255,.6);
          margin-bottom: 32px;
          letter-spacing: .04em;
          text-transform: uppercase;
        }
        .panel-badge span { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; display: inline-block; }

        .panel-right {
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px 40px;
        }
        @media (min-width: 900px) { .panel-right { flex: none; width: 480px; margin: 0; } }
        @media (max-width: 480px) { .panel-right { padding: 40px 24px; } }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 56px;
          text-decoration: none;
        }

        .form-header { margin-bottom: 36px; }
        .form-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.75rem;
          font-weight: 700;
          letter-spacing: -.03em;
          color: var(--ink);
          margin-bottom: 8px;
        }
        .form-subtitle { color: var(--ink-soft); font-size: .93rem; line-height: 1.5; }

        .auth-form { display: flex; flex-direction: column; gap: 20px; }

        .field { display: flex; flex-direction: column; gap: 6px; }
        .field-label {
          font-size: .8rem;
          font-weight: 500;
          color: var(--ink);
          letter-spacing: .01em;
        }
        .field-input-wrap {
          display: flex;
          align-items: center;
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          background: var(--white);
          transition: border-color .15s, box-shadow .15s;
          overflow: hidden;
        }
        .field-input-wrap:focus-within {
          border-color: var(--ink);
          box-shadow: 0 0 0 3px rgba(15,14,13,.06);
        }
        .field-input {
          flex: 1;
          border: none;
          outline: none;
          padding: 13px 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: .93rem;
          color: var(--ink);
          background: transparent;
        }
        .field-input::placeholder { color: var(--ink-faint); }
        .field-toggle {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0 14px;
          color: var(--ink-faint);
          display: flex;
          align-items: center;
        }
        .field-toggle:hover { color: var(--ink-soft); }

        .auth-btn {
          border: none; cursor: pointer;
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

        .form-error {
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

        .form-warning {
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: var(--radius);
          padding: 16px 18px;
          font-size: .88rem;
          color: #92400e;
          text-align: center;
        }

        .form-success {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: var(--radius);
          padding: 20px;
          text-align: center;
        }
        .form-success-icon { font-size: 2rem; margin-bottom: 10px; }
        .form-success-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.05rem;
          font-weight: 700;
          color: #166534;
          margin-bottom: 6px;
        }
        .form-success-sub { font-size: .88rem; color: #166534; line-height: 1.5; }

        .validating {
          text-align: center;
          padding: 40px 0;
          color: var(--ink-soft);
          font-size: .93rem;
        }

        .form-footer {
          margin-top: 32px;
          text-align: center;
          font-size: .85rem;
          color: var(--ink-soft);
        }
        .form-footer a { color: var(--ink); font-weight: 500; text-decoration: none; }
        .form-footer a:hover { text-decoration: underline; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .panel-right { animation: fadeUp .4s ease both; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin .7s linear infinite;
          display: inline-block;
          margin-right: 8px;
          vertical-align: middle;
        }
      `}</style>

      <div className="page">
        {/* Decorative left panel */}
        <div className="panel-left">
          <div className="panel-left-grid" />
          <div className="panel-left-content">
            <div className="panel-badge"><span />Set new password</div>
            <h2 className="panel-tagline">
              Almost there.<br />
              <em>Choose wisely.</em>
            </h2>
            <p className="panel-sub">
              Pick a strong, unique password to secure your account.
              We recommend at least 12 characters.
            </p>
          </div>
        </div>

        {/* Form panel */}
        <div className="panel-right">
          <Link href="/" className="logo">
            <Logo variant="light" size="lg" />
          </Link>

          <div className="form-header">
            <h1 className="form-title">Set new password</h1>
            <p className="form-subtitle">Enter and confirm your new password below.</p>
          </div>

          {validating ? (
            <div className="validating">
              <span className="spinner" />
              Validating your reset link&hellip;
            </div>
          ) : !tokenValid ? (
            <>
              <div className="form-warning">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display:'inline-block', marginRight:'6px', verticalAlign:'middle', flexShrink:0 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {tokenError}
              </div>
              <div className="form-footer">
                <Link href="/forgot-password">Request a new reset link</Link>
                {' · '}
                <Link href="/login">Back to sign in</Link>
              </div>
            </>
          ) : success ? (
            <div className="form-success">
              <div className="form-success-icon">✅</div>
              <div className="form-success-title">Password updated!</div>
              <p className="form-success-sub">
                Your password has been changed successfully.
                Redirecting you to the sign-in page&hellip;
              </p>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              {error && (
                <div className="form-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <div className="field">
                <label className="field-label" htmlFor="password">New password</label>
                <div className="field-input-wrap">
                  <input
                    id="password"
                    className="field-input"
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
                    className="field-toggle"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="confirm">Confirm new password</label>
                <div className="field-input-wrap">
                  <input
                    id="confirm"
                    className="field-input"
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
                  <><span className="spinner" />Updating password&hellip;</>
                ) : (
                  'Set new password'
                )}
              </button>
            </form>
          )}

          <div className="form-footer">
            Remember your password?{' '}
            <Link href="/login">Back to sign in</Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', fontFamily: 'sans-serif', color: '#6b6660' }}>
        Loading&hellip;
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

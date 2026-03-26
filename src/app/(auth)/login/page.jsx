// src/app/(auth)/login/page.jsx

'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';

// Separate component that uses useSearchParams
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed. Please try again.');
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {error && (
        <div className="form-error">
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
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        required
        autoComplete="email"
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        }
      />

      <div>
        <div className="form-row" style={{ marginBottom: 6 }}>
          <label className="auth-input-label">Password <span className="auth-input-required">*</span></label>
          <Link href="/forgot-password" className="forgot-link">
            Forgot password?
          </Link>
        </div>
        <AuthInput
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          }
        />
      </div>

      <AuthButton loading={loading}>Sign in</AuthButton>
    </form>
  );
}

export default function LoginPage() {
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

        /* ─── Layout ─────────────────────────────── */
        .page {
          display: flex;
          width: 100%;
          min-height: 100dvh;
        }

        /* Left panel — decorative */
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

        .panel-left-content {
          position: relative;
          z-index: 1;
        }

        .panel-tagline {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2rem, 3.5vw, 3rem);
          font-weight: 700;
          color: #fff;
          line-height: 1.15;
          letter-spacing: -.02em;
          margin-bottom: 20px;
        }

        .panel-tagline em {
          font-style: normal;
          color: var(--accent);
        }

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

        /* Right panel — form */
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

        /* Logo */
        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 56px;
          text-decoration: none;
        }
        .logo-mark {
          width: 34px; height: 34px;
          background: var(--ink);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
        }
        .logo-mark svg { color: #fff; }
        .logo-name {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1.1rem;
          color: var(--ink);
          letter-spacing: -.01em;
        }
        .logo-name span { color: var(--accent); }

        /* Header */
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

        /* Form */
        .auth-form { display: flex; flex-direction: column; gap: 20px; }

        /* Input styles */
        .auth-input-wrapper { display: flex; flex-direction: column; gap: 6px; }
        .auth-input-label {
          font-size: .8rem;
          font-weight: 500;
          color: var(--ink);
          letter-spacing: .01em;
        }
        .auth-input-required { color: var(--accent); margin-left: 2px; }
        .auth-input-container {
          display: flex;
          align-items: center;
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          background: var(--white);
          transition: border-color .15s, box-shadow .15s;
          overflow: hidden;
        }
        .auth-input-container:focus-within {
          border-color: var(--ink);
          box-shadow: 0 0 0 3px rgba(15,14,13,.06);
        }
        .auth-input-container.has-error { border-color: var(--accent); }
        .auth-input-container.is-disabled { opacity: .5; pointer-events: none; }
        .auth-input-icon { padding: 0 12px 0 14px; color: var(--ink-faint); display: flex; }
        .auth-input-field {
          flex: 1;
          border: none;
          outline: none;
          padding: 13px 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: .93rem;
          color: var(--ink);
          background: transparent;
        }
        .auth-input-field::placeholder { color: var(--ink-faint); }
        .auth-input-toggle {
          background: none; border: none; cursor: pointer;
          padding: 0 14px; color: var(--ink-soft);
          display: flex; align-items: center;
          transition: color .15s;
        }
        .auth-input-toggle:hover { color: var(--ink); }
        .auth-input-error { font-size: .78rem; color: var(--accent); margin-top: 2px; }

        /* Button */
        .auth-btn {
          border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: .93rem;
          font-weight: 500;
          border-radius: var(--radius);
          padding: 13px 24px;
          transition: background .15s, transform .1s, box-shadow .15s;
        }
        .auth-btn--full { width: 100%; }
        .auth-btn--primary {
          background: var(--ink);
          color: #fff;
        }
        .auth-btn--primary:hover:not(:disabled) {
          background: #1e1c1a;
          box-shadow: 0 4px 16px rgba(15,14,13,.18);
          transform: translateY(-1px);
        }
        .auth-btn--primary:active:not(:disabled) { transform: translateY(0); }
        .auth-btn--loading { opacity: .75; cursor: not-allowed; }
        .auth-btn:disabled { cursor: not-allowed; opacity: .55; }
        .auth-btn-spinner-wrap { display: flex; align-items: center; justify-content: center; gap: 8px; }
        .auth-btn-spinner {
          width: 16px; height: 16px;
          animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Extras */
        .form-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .forgot-link {
          font-size: .82rem;
          color: var(--ink-soft);
          text-decoration: none;
          transition: color .15s;
        }
        .forgot-link:hover { color: var(--ink); }

        .divider {
          display: flex; align-items: center; gap: 12px;
          color: var(--ink-faint); font-size: .8rem;
          margin: 4px 0;
        }
        .divider::before, .divider::after {
          content: ''; flex: 1;
          height: 1px; background: var(--border);
        }

        /* Global error */
        .form-error {
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

        /* Footer */
        .form-footer {
          margin-top: 32px;
          text-align: center;
          font-size: .85rem;
          color: var(--ink-soft);
        }
        .form-footer a {
          color: var(--ink);
          font-weight: 500;
          text-decoration: none;
        }
        .form-footer a:hover { text-decoration: underline; }

        /* Animations */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .panel-right { animation: fadeUp .4s ease both; }
      `}</style>

      <div className="page">
        {/* ── Decorative left panel ── */}
        <div className="panel-left">
          <div className="panel-left-grid" />
          <div className="panel-left-content">
            <div className="panel-badge"><span />Multi-tenant procurement</div>
            <h2 className="panel-tagline">
              Smarter sourcing.<br />
              <em>Faster decisions.</em>
            </h2>
            <p className="panel-sub">
              One platform for RFQs, vendor bids, and contract awards — built for teams that move fast.
            </p>
          </div>
        </div>

        {/* ── Form panel ── */}
        <div className="panel-right">
          <Link href="/" className="logo">
            <div className="logo-mark">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <span className="logo-name">Procure<span>IQ</span></span>
          </Link>

          <div className="form-header">
            <h1 className="form-title">Welcome back</h1>
            <p className="form-subtitle">Sign in to your workspace to continue.</p>
          </div>

          {/* Wrap LoginForm in Suspense to handle useSearchParams during static generation */}
          <Suspense fallback={<div className="auth-form">Loading...</div>}>
            <LoginForm />
          </Suspense>

          <div className="form-footer">
            Don&apos;t have an account?{' '}
            <Link href="/register">Create workspace</Link>
          </div>
        </div>
      </div>
    </>
  );
}
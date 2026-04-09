'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import AuthSplitLayout from '@/components/auth/AuthSplitLayout';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      setSubmitted(true);
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
        .auth-form-error {
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
        .auth-form-success {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: var(--radius);
          padding: 20px 20px;
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
        .auth-form-footer {
          margin-top: 32px;
          text-align: center;
          font-size: .85rem;
          color: var(--ink-soft);
        }
        .auth-form-footer a { color: var(--ink); font-weight: 500; text-decoration: none; }
        .auth-form-footer a:hover { text-decoration: underline; }
      `}</style>

      <AuthSplitLayout
        badge="Account recovery"
        tagline={<>Locked out?<br /><em>We&apos;ve got you.</em></>}
        subtitle="Enter your work email and we&apos;ll send a secure reset link straight to your inbox."
      >
        <div className="auth-form-header">
          <h1 className="auth-form-title">Reset password</h1>
          <p className="auth-form-subtitle">
            Enter your work email and we&apos;ll send you a secure reset link.
          </p>
        </div>

        {submitted ? (
          <div className="auth-form-success">
            <div className="auth-form-success-icon">📬</div>
            <div className="auth-form-success-title">Check your inbox</div>
            <p className="auth-form-success-sub">
              If an account exists for that email, a password reset link has been sent.
              The link will expire in 24 hours.
            </p>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
              <div className="auth-form-error">
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
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              }
            />

            <AuthButton loading={loading}>Send reset link</AuthButton>
          </form>
        )}

        <div className="auth-form-footer">
          Remember your password? <Link href="/login">Back to sign in</Link>
        </div>
      </AuthSplitLayout>
    </>
  );
}

'use client';
// src/app/(auth)/register/page.jsx
//
// Supports THREE modes — visually distinct for each:
//
//   /register                    → New-company signup
//   /register?token=<tok>        → Team invite  (company_admin / manager / employee)
//   /register?token=<tok>        → Vendor invite (vendor_user) — different left-panel + badge

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams }    from 'next/navigation';
import Link                              from 'next/link';
import { AuthButton, AuthInput }         from '@/components/auth';
import RegisterContextBadge              from '@/components/auth/register/RegisterContextBadge';
import RegisterInviteError               from '@/components/auth/register/RegisterInviteError';
import RegisterInviteLoading             from '@/components/auth/register/RegisterInviteLoading';
import RegisterVendorPill                from '@/components/auth/register/RegisterVendorPill';

// ─── Inner component — uses useSearchParams ────────────────────────────────
function RegisterInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get('token');

  // Invite state
  const [inviteData,    setInviteData]    = useState(null);
  const [inviteError,   setInviteError]   = useState(null);
  const [inviteLoading, setInviteLoading] = useState(!!token);

  // Form state
  const [form, setForm] = useState({ companyName: '', name: '', email: '', password: '' });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState('');

  // Validate token on mount
  useEffect(() => {
    if (!token) return;
    async function run() {
      try {
        const res  = await fetch(`/api/auth/invite/validate?token=${token}`);
        const data = await res.json();
        if (!res.ok) {
          setInviteError(data.error || 'Invalid invitation link.');
        } else {
          setInviteData(data.data);
          setForm(prev => ({ ...prev, email: data.data.email }));
        }
      } catch {
        setInviteError('Could not validate invitation. Please try again.');
      } finally {
        setInviteLoading(false);
      }
    }
    run();
  }, [token]);

  function setField(key) {
    return (e) => {
      setForm(prev => ({ ...prev, [key]: e.target.value }));
      if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
    };
  }

  function validate() {
    const errs = {};
    if (!token && !form.companyName.trim()) errs.companyName = 'Company name is required.';
    if (!form.name.trim())                  errs.name        = 'Your full name is required.';
    if (!token && !form.email.trim())       errs.email       = 'Work email is required.';
    if (!form.password)                     errs.password    = 'Password is required.';
    if (form.password && form.password.length < 8)
      errs.password = 'At least 8 characters.';
    if (!token && !termsAccepted)
      errs.terms = 'You must agree to the Terms of Service and Privacy Policy.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = token
        ? { token, name: form.name, password: form.password }
        : form;

      const res  = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        else setApiError(data.error || 'Registration failed.');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setApiError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  const isInvite       = !!token;
  const isVendorInvite = isInvite && inviteData?.role === 'vendor_user';
  const isTeamInvite   = isInvite && !isVendorInvite;

  // ── Loading spinner ──────────────────────────────────────────────────────
  if (inviteLoading) {
    return <RegisterInviteLoading />;
  }

  // ── Invalid / expired token ──────────────────────────────────────────────
  if (isInvite && inviteError) {
    return <RegisterInviteError inviteError={inviteError} />;
  }

  // ── Left panel content (varies by mode) ─────────────────────────────────
  const leftPanelClass = `panel-left ${isVendorInvite ? 'panel-left--vendor' : ''}`;

  const leftSteps = isVendorInvite
    ? [
        { n: '1', title: 'Verify invitation',  desc: 'Confirm your contact email' },
        { n: '2', title: 'Set your password',  desc: 'Secure your vendor account' },
        { n: '3', title: 'Access the portal',  desc: 'View RFQs and submit bids' },
      ]
    : isTeamInvite
    ? [
        { n: '1', title: 'Verify invitation',  desc: 'Confirm your email and role' },
        { n: '2', title: 'Set your password',  desc: 'Choose a secure password' },
        { n: '3', title: 'Access workspace',   desc: 'Start collaborating immediately' },
      ]
    : [
        { n: '1', title: 'Create workspace',   desc: 'Register your company & admin account' },
        { n: '2', title: 'Add vendors',        desc: 'Invite & approve your vendor list' },
        { n: '3', title: 'Run your first RFQ', desc: 'Create, publish, and compare bids' },
      ];

  const leftTagline = isVendorInvite
    ? (<>You&apos;ve been<br /><em>invited to access</em><br />{inviteData?.companyName}&apos;s portal.</>)
    : isTeamInvite
    ? (<>You&apos;ve been<br /><em>invited to join</em><br />{inviteData?.companyName}.</>)
    : (<>Set up your<br /><em>procurement workspace</em><br />in minutes.</>);

  const leftSub = isVendorInvite
    ? 'Create your vendor account to view RFQs, submit bids, and collaborate directly with the procurement team.'
    : isTeamInvite
    ? 'Set your name and password to activate your account and start collaborating with your team.'
    : 'Create your company account, invite vendors, and start running RFQs today.';

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <div className="page">

      {/* Left panel */}
      <div className={leftPanelClass}>
        <div className="panel-left-grid" />

        <div className="panel-top">
          <Link href="/" className="logo">
            <div className="logo-mark">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <span className="logo-name">Procure<span>xio</span></span>
          </Link>
        </div>

        <div className="panel-bottom">
          {/* Vendor-invite label pill */}
          <RegisterVendorPill show={isVendorInvite} />
          <h2 className="panel-tagline">{leftTagline}</h2>
          <p className="panel-sub panel-sub--spaced">{leftSub}</p>
          <div className="steps">
            {leftSteps.map((s, i) => (
              <div className={`step ${i === 0 ? 'active' : ''}`} key={s.n}>
                <div className="step-num">{s.n}</div>
                <div className="step-label">
                  <span className="step-title">{s.title}</span>
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="panel-right">
        <Link href="/" className="mobile-logo">
          <div className="mobile-logo-mark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <span className="mobile-logo-name">Procure<span>xio</span></span>
        </Link>

        {/* Form header */}
        <div className="form-header">
          {isInvite ? (
            <>
              <h1 className="form-title">
                {isVendorInvite ? 'Set up your vendor account' : 'Accept your invitation'}
              </h1>
              <div className="form-context-badge-wrap">
                <RegisterContextBadge isInvite={isInvite} isVendorInvite={isVendorInvite} inviteData={inviteData} />
              </div>
            </>
          ) : (
            <>
              <h1 className="form-title">Create your workspace</h1>
              <p className="form-subtitle">
                Your company gets its own isolated environment. Takes 30 seconds.
              </p>
            </>
          )}
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {apiError && (
            <div className="form-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {apiError}
            </div>
          )}

          {/* Company name — only for new-company flow */}
          {!isInvite && (
            <>
              <p className="form-section">Company</p>
              <AuthInput
                label="Company name"
                type="text"
                value={form.companyName}
                onChange={setField('companyName')}
                placeholder="Acme Procurement Ltd."
                required
                autoComplete="organization"
                error={errors.companyName}
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                }
              />
              <div className="form-divider" />
              <p className="form-section">Your admin account</p>
            </>
          )}

          {/* Full name */}
          <AuthInput
            label="Full name"
            type="text"
            value={form.name}
            onChange={setField('name')}
            placeholder="Ravi Sharma"
            required
            autoComplete="name"
            autoFocus={isInvite}
            error={errors.name}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            }
          />

          {/* Email — locked for all invites */}
          <AuthInput
            label={isVendorInvite ? 'Vendor contact email' : 'Work email'}
            type="email"
            value={form.email}
            onChange={isInvite ? undefined : setField('email')}
            placeholder="contact@vendor.com"
            required
            autoComplete="email"
            error={errors.email}
            disabled={isInvite}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            }
          />

          {/* Password */}
          <AuthInput
            label="Password"
            type="password"
            value={form.password}
            onChange={setField('password')}
            placeholder="min. 8 characters"
            required
            autoComplete="new-password"
            error={errors.password}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            }
          />

          <AuthButton loading={loading}>
            {isVendorInvite
              ? 'Activate vendor account'
              : isTeamInvite
              ? 'Accept & activate account'
              : 'Create workspace'}
          </AuthButton>

          {!isInvite && (
            <div className="form-terms-check">
              <label className="terms-label">
                <input
                  type="checkbox"
                  className="terms-checkbox"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    if (errors.terms) setErrors(prev => ({ ...prev, terms: '' }));
                  }}
                />
                <span className="terms-text">
                  I agree to the{' '}
                  <a href="/terms" target="_blank" rel="noreferrer">Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>
                </span>
              </label>
              {errors.terms && (
                <p className="auth-input-error terms-error">{errors.terms}</p>
              )}
            </div>
          )}
        </form>

        <div className="form-footer">
          Already have an account?{' '}
          <Link href="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────
export default function RegisterPage() {
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
        }

        body {
          font-family: 'DM Sans', sans-serif;
          background: var(--surface);
          color: var(--ink);
          min-height: 100dvh;
        }

        .page { display: flex; min-height: 100dvh; }

        /* ── Left panel ── */
        .panel-left {
          flex: 1;
          --left-bg: #0f0e0d;
          --left-accent: #c8501a;
          background: var(--left-bg);
          display: none;
          position: relative;
          overflow: hidden;
          transition: background .3s;
        }
        .panel-left--vendor {
          --left-bg: #0d5c46;
          --left-accent: #34d399;
        }
        @media (min-width: 900px) {
          .panel-left {
            display: flex; flex-direction: column;
            justify-content: space-between; padding: 52px;
          }
        }
        .panel-left::before {
          content: ''; position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 50% 40% at 80% 10%, color-mix(in srgb, var(--left-accent, #c8501a) 20%, transparent) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 10% 90%, color-mix(in srgb, var(--left-accent, #c8501a) 15%, transparent) 0%, transparent 70%);
        }
        .panel-left-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .panel-top, .panel-bottom { position: relative; z-index: 1; }

        .logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .logo-mark {
          width: 34px; height: 34px; background: rgba(255,255,255,.1);
          border: 1px solid rgba(255,255,255,.15); border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
        }
        .logo-mark svg { color: #fff; }
        .logo-name {
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 1.1rem; color: #fff; letter-spacing: -.01em;
        }
        .logo-name span { color: var(--left-accent, #c8501a); }

        .steps { display: flex; flex-direction: column; gap: 28px; }
        .step { display: flex; gap: 16px; align-items: flex-start; }
        .step-num {
          width: 28px; height: 28px; border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,.2);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif; font-size: .75rem; font-weight: 700;
          color: rgba(255,255,255,.5); flex-shrink: 0; margin-top: 2px;
        }
        .step.active .step-num {
          background: var(--left-accent, #c8501a);
          border-color: var(--left-accent, #c8501a);
          color: #fff;
        }
        .step-label { font-size: .88rem; color: rgba(255,255,255,.4); line-height: 1.4; }
        .step-title { display: block; font-weight: 500; margin-bottom: 2px; }
        .step.active .step-label { color: rgba(255,255,255,.75); }
        .step.active .step-title { color: #fff; }

        .panel-tagline {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.6rem, 2.5vw, 2.2rem);
          font-weight: 700; color: #fff;
          line-height: 1.2; letter-spacing: -.02em; margin-bottom: 12px;
        }
        .panel-tagline em { font-style: normal; color: var(--left-accent, #c8501a); }
        .panel-sub { color: rgba(255,255,255,.4); font-size: .88rem; line-height: 1.6; }
        .panel-sub--spaced { margin-top: 12px; margin-bottom: 40px; }
        .register-vendor-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(52,211,153,.15);
          border: 1px solid rgba(52,211,153,.3);
          border-radius: 20px;
          padding: 4px 12px;
          margin-bottom: 20px;
          font-size: .75rem;
          font-weight: 600;
          color: #6ee7b7;
          letter-spacing: .05em;
          text-transform: uppercase;
        }
        .register-vendor-pill-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #34d399;
          display: inline-block;
        }

        /* ── Right panel ── */
        .panel-right {
          width: 100%; max-width: 500px; margin: 0 auto;
          display: flex; flex-direction: column; justify-content: center;
          padding: 48px 40px;
        }
        @media (min-width: 900px) { .panel-right { flex: none; width: 500px; margin: 0; } }
        @media (max-width: 480px) { .panel-right { padding: 40px 24px; } }

        .mobile-logo {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 48px; text-decoration: none;
        }
        .mobile-logo-mark {
          width: 34px; height: 34px; background: var(--ink);
          border-radius: 8px; display: flex; align-items: center; justify-content: center;
        }
        .mobile-logo-mark svg { color: #fff; }
        .mobile-logo-name {
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 1.1rem; color: var(--ink); letter-spacing: -.01em;
        }
        .mobile-logo-name span { color: var(--accent); }
        @media (min-width: 900px) { .mobile-logo { display: none; } }

        .form-header { margin-bottom: 28px; }
        .form-title {
          font-family: 'Syne', sans-serif; font-size: 1.65rem; font-weight: 700;
          letter-spacing: -.03em; color: var(--ink); margin-bottom: 0;
        }
        .form-subtitle { color: var(--ink-soft); font-size: .92rem; line-height: 1.5; margin-top: 6px; }
        .form-context-badge-wrap { margin-top: 12px; }

        .form-section {
          font-size: .72rem; font-weight: 600; letter-spacing: .08em;
          text-transform: uppercase; color: var(--ink-faint);
          margin-bottom: 12px; margin-top: 4px;
        }

        .auth-form { display: flex; flex-direction: column; gap: 18px; }
        .form-divider { height: 1px; background: var(--border); margin: 4px 0; }

        .form-error {
          background: #fff5f2; border: 1px solid #f5c4b5; border-radius: var(--radius);
          padding: 12px 14px; font-size: .85rem; color: #a83e12;
          display: flex; align-items: center; gap: 8px;
        }

        .form-terms {
          font-size: .78rem; color: var(--ink-faint); line-height: 1.5; text-align: center;
        }
        .form-terms a { color: var(--ink-soft); text-decoration: underline; }

        .form-terms-check { display: flex; flex-direction: column; gap: 6px; }
        .terms-label {
          display: flex; align-items: flex-start; gap: 10px; cursor: pointer;
        }
        .terms-checkbox {
          width: 16px; height: 16px; flex-shrink: 0; margin-top: 2px;
          accent-color: var(--ink); cursor: pointer;
        }
        .terms-text { font-size: .82rem; color: var(--ink-soft); line-height: 1.5; }
        .terms-text a { color: var(--ink); text-decoration: underline; }
        .terms-text a:hover { color: var(--accent); }
        .terms-error { margin-top: 0; }

        .form-footer { margin-top: 28px; text-align: center; font-size: .85rem; color: var(--ink-soft); }
        .form-footer a { color: var(--ink); font-weight: 500; text-decoration: none; }
        .form-footer a:hover { text-decoration: underline; }

        .panel-right { animation: authFadeUp .4s ease both; }

        @keyframes registerSpin { to { transform: rotate(360deg); } }
        .register-invite-loading {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--surface);
          font-family: 'DM Sans', sans-serif;
          gap: 16px;
        }
        .register-invite-loading-spinner { animation: registerSpin .7s linear infinite; }
        .register-invite-loading-text { font-size: .88rem; color: var(--ink-soft); margin: 0; }

        .register-invite-error-page {
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--surface);
          font-family: 'DM Sans', sans-serif;
          padding: 24px 16px;
        }
        .register-invite-error-card {
          text-align: center;
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 48px 40px;
          max-width: 400px;
          width: 100%;
        }
        .register-invite-error-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #fff5f2;
          border: 1px solid #f5c4b5;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }
        .register-invite-error-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--ink);
          margin: 0 0 8px;
        }
        .register-invite-error-message {
          font-size: .88rem;
          color: var(--ink-soft);
          margin: 0 0 6px;
          line-height: 1.6;
        }
        .register-invite-error-help {
          font-size: .82rem;
          color: var(--ink-faint);
          margin: 0 0 28px;
        }
        .register-invite-error-link {
          display: inline-block;
          padding: 11px 24px;
          background: var(--ink);
          color: #fff;
          border-radius: 10px;
          font-size: .88rem;
          font-weight: 500;
          text-decoration: none;
        }

        .register-context-badge {
          border-radius: 10px;
          font-size: .84rem;
        }
        .register-context-badge--vendor {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #374151;
        }
        .register-context-badge-icon {
          flex-shrink: 0;
          margin-top: 1px;
        }
        .register-context-badge-title {
          font-weight: 600;
          color: #065f46;
          margin-bottom: 2px;
        }
        .register-context-badge--team {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: var(--surface);
          border: 1px solid var(--border);
          color: #4b4845;
        }
        .register-context-badge-strong { color: var(--ink); }
      `}</style>

      <Suspense>
        <RegisterInner />
      </Suspense>
    </>
  );
}

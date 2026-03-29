'use client';
// src/app/(auth)/register/page.jsx
//
// Supports TWO modes — UI/CSS identical to original in both cases:
//
//   /register              → New-company signup (companyName + name + email + password)
//   /register?token=<tok>  → Accept invitation  (name + password only; email locked)
//
// vendor_user invites never see the companyName field (it's an invite-only role).
// company_admin / manager / employee invites also skip companyName (they join an existing company).

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams }    from 'next/navigation';
import Link                              from 'next/link';
import AuthInput                         from '@/components/auth/AuthInput';
import AuthButton                        from '@/components/auth/AuthButton';

// ─── Inner component — uses useSearchParams, must live inside <Suspense> ─────
function RegisterInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get('token');

  // ── Invite validation state ──────────────────────────────────────────────
  const [inviteData,    setInviteData]    = useState(null); // { email, role, companyName }
  const [inviteError,   setInviteError]   = useState(null);
  const [inviteLoading, setInviteLoading] = useState(!!token);

  // ── Form state ───────────────────────────────────────────────────────────
  const [form, setForm] = useState({ companyName: '', name: '', email: '', password: '' });
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState('');

  // ── Validate token on mount ──────────────────────────────────────────────
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

  // ── Helpers ──────────────────────────────────────────────────────────────
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
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      // Invite mode: only send token + name + password
      // New-company mode: send full form
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

  // ── Derived ───────────────────────────────────────────────────────────────
  const isInvite = !!token;

  // ── Render: validating token spinner ─────────────────────────────────────
  if (inviteLoading) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#faf9f7', fontFamily: "'DM Sans', sans-serif", gap: 16,
      }}>
        <svg style={{ animation: 'spin .7s linear infinite' }}
          width="28" height="28" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#e4e0db" strokeWidth="2.5"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke="#0f0e0d" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
        <p style={{ fontSize: '.88rem', color: '#6b6660', margin: 0 }}>Validating invitation…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Render: invalid / expired token ──────────────────────────────────────
  if (isInvite && inviteError) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#faf9f7',
        fontFamily: "'DM Sans', sans-serif", padding: '24px 16px',
      }}>
        <div style={{
          textAlign: 'center', background: '#fff', border: '1px solid #e4e0db',
          borderRadius: 14, padding: '48px 40px', maxWidth: 400, width: '100%',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', background: '#fff5f2',
            border: '1px solid #f5c4b5', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="#c8501a" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 style={{
            fontFamily: "'Syne', sans-serif", fontSize: '1.2rem',
            fontWeight: 700, color: '#0f0e0d', margin: '0 0 8px',
          }}>
            Invitation invalid
          </h2>
          <p style={{ fontSize: '.88rem', color: '#6b6660', margin: '0 0 6px', lineHeight: 1.6 }}>
            {inviteError}
          </p>
          <p style={{ fontSize: '.82rem', color: '#b8b3ae', margin: '0 0 28px' }}>
            Please ask your admin to resend the invitation.
          </p>
          <Link href="/login" style={{
            display: 'inline-block', padding: '11px 24px',
            background: '#0f0e0d', color: '#fff', borderRadius: 10,
            fontSize: '.88rem', fontWeight: 500, textDecoration: 'none',
          }}>
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  // ── Render: main form ─────────────────────────────────────────────────────
  return (
    <div className="page">

      {/* ── Left panel ── */}
      <div className="panel-left">
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
          {isInvite ? (
            <>
              <h2 className="panel-tagline">
                You&apos;ve been<br /><em>invited to join</em><br />{inviteData?.companyName}.
              </h2>
              <p className="panel-sub" style={{ marginTop: 12, marginBottom: 40 }}>
                Set your name and password to activate your account and get started.
              </p>
              <div className="steps">
                {[
                  { n: '1', title: 'Verify invitation', desc: 'Confirm your email and assigned role' },
                  { n: '2', title: 'Set your password', desc: 'Choose a secure password' },
                  { n: '3', title: 'Access workspace',  desc: 'Start collaborating immediately' },
                ].map((s, i) => (
                  <div className={`step ${i === 0 ? 'active' : ''}`} key={s.n}>
                    <div className="step-num">{s.n}</div>
                    <div className="step-label">
                      <span className="step-title">{s.title}</span>
                      {s.desc}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 className="panel-tagline">
                Set up your<br /><em>procurement workspace</em><br />in minutes.
              </h2>
              <p className="panel-sub" style={{ marginTop: 12, marginBottom: 40 }}>
                Create your company account, invite vendors, and start running RFQs today.
              </p>
              <div className="steps">
                {[
                  { n: '1', title: 'Create workspace',  desc: 'Register your company & admin account' },
                  { n: '2', title: 'Add vendors',        desc: 'Invite & approve your vendor list' },
                  { n: '3', title: 'Run your first RFQ', desc: 'Create, publish, and compare bids' },
                ].map((s, i) => (
                  <div className={`step ${i === 0 ? 'active' : ''}`} key={s.n}>
                    <div className="step-num">{s.n}</div>
                    <div className="step-label">
                      <span className="step-title">{s.title}</span>
                      {s.desc}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Right panel ── */}
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
              <h1 className="form-title">Accept your invitation</h1>
              {/* Invite context badge — shows company + role */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', background: '#faf9f7',
                border: '1px solid #e4e0db', borderRadius: 10,
                fontSize: '.84rem', color: '#4b4845',
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="#6b6660" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <span>
                  Joining{' '}
                  <strong style={{ color: '#0f0e0d' }}>{inviteData?.companyName}</strong>
                  {' '}as{' '}
                  <strong style={{ color: '#0f0e0d' }}>
                    {inviteData?.role
                      ?.replace(/_/g, ' ')
                      .replace(/\b\w/g, c => c.toUpperCase())}
                  </strong>
                </span>
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

          {/* Company name — only for new-company signup, never for any invite role */}
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

          {/* Email — editable for new-company, locked/read-only for invite */}
          <AuthInput
            label="Work email"
            type="email"
            value={form.email}
            onChange={isInvite ? undefined : setField('email')}
            placeholder="ravi@company.com"
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
            {isInvite ? 'Accept & activate account' : 'Create workspace'}
          </AuthButton>

          {/* Terms — only relevant for new-company flow */}
          {!isInvite && (
            <p className="form-terms">
              By creating an account you agree to our{' '}
              <a href="/terms">Terms of Service</a> and{' '}
              <a href="/privacy">Privacy Policy</a>.
            </p>
          )}
        </form>

        <div className="form-footer">
          Already have a workspace?{' '}
          <Link href="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

// ─── Page export — all CSS lives here so it applies regardless of mode ────────
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
          flex: 1; background: var(--ink);
          display: none; position: relative; overflow: hidden;
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
            radial-gradient(ellipse 50% 40% at 80% 10%, rgba(200,80,26,.14) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 10% 90%, rgba(200,80,26,.12) 0%, transparent 70%);
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
        .logo-name span { color: var(--accent); }

        .steps { display: flex; flex-direction: column; gap: 28px; }
        .step { display: flex; gap: 16px; align-items: flex-start; }
        .step-num {
          width: 28px; height: 28px; border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,.2);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif; font-size: .75rem; font-weight: 700;
          color: rgba(255,255,255,.5); flex-shrink: 0; margin-top: 2px;
        }
        .step.active .step-num { background: var(--accent); border-color: var(--accent); color: #fff; }
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
        .panel-tagline em { font-style: normal; color: var(--accent); }
        .panel-sub { color: rgba(255,255,255,.4); font-size: .88rem; line-height: 1.6; }

        /* ── Right panel ── */
        .panel-right {
          width: 100%; max-width: 480px; margin: 0 auto;
          display: flex; flex-direction: column; justify-content: center;
          padding: 48px 40px;
        }
        @media (min-width: 900px) { .panel-right { flex: none; width: 480px; margin: 0; } }
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

        .form-header { margin-bottom: 32px; }
        .form-title {
          font-family: 'Syne', sans-serif; font-size: 1.65rem; font-weight: 700;
          letter-spacing: -.03em; color: var(--ink); margin-bottom: 8px;
        }
        .form-subtitle { color: var(--ink-soft); font-size: .92rem; line-height: 1.5; }

        .form-section {
          font-size: .72rem; font-weight: 600; letter-spacing: .08em;
          text-transform: uppercase; color: var(--ink-faint);
          margin-bottom: 12px; margin-top: 4px;
        }

        .auth-form { display: flex; flex-direction: column; gap: 18px; }
        .form-divider { height: 1px; background: var(--border); margin: 4px 0; }

        /* Input styles (used by AuthInput component) */
        .auth-input-wrapper { display: flex; flex-direction: column; gap: 5px; }
        .auth-input-label { font-size: .79rem; font-weight: 500; color: var(--ink); letter-spacing: .01em; }
        .auth-input-required { color: var(--accent); margin-left: 2px; }
        .auth-input-container {
          display: flex; align-items: center;
          border: 1.5px solid var(--border); border-radius: var(--radius);
          background: var(--white); transition: border-color .15s, box-shadow .15s; overflow: hidden;
        }
        .auth-input-container:focus-within {
          border-color: var(--ink); box-shadow: 0 0 0 3px rgba(15,14,13,.06);
        }
        .auth-input-container.has-error { border-color: var(--accent); }
        .auth-input-container.is-disabled { opacity: .6; background: var(--surface); pointer-events: none; }
        .auth-input-icon { padding: 0 12px 0 14px; color: var(--ink-faint); display: flex; }
        .auth-input-field {
          flex: 1; border: none; outline: none; padding: 12px 14px;
          font-family: 'DM Sans', sans-serif; font-size: .92rem;
          color: var(--ink); background: transparent;
        }
        .auth-input-field::placeholder { color: var(--ink-faint); }
        .auth-input-toggle {
          background: none; border: none; cursor: pointer;
          padding: 0 14px; color: var(--ink-soft);
          display: flex; align-items: center; transition: color .15s;
        }
        .auth-input-toggle:hover { color: var(--ink); }
        .auth-input-error { font-size: .77rem; color: var(--accent); margin-top: 2px; }

        /* Button */
        .auth-btn {
          border: none; cursor: pointer; font-family: 'DM Sans', sans-serif;
          font-size: .93rem; font-weight: 500; border-radius: var(--radius);
          padding: 13px 24px; transition: background .15s, transform .1s, box-shadow .15s;
        }
        .auth-btn--full { width: 100%; }
        .auth-btn--primary { background: var(--ink); color: #fff; }
        .auth-btn--primary:hover:not(:disabled) {
          background: #1e1c1a; box-shadow: 0 4px 16px rgba(15,14,13,.18); transform: translateY(-1px);
        }
        .auth-btn--primary:active:not(:disabled) { transform: translateY(0); }
        .auth-btn--loading { opacity: .75; cursor: not-allowed; }
        .auth-btn:disabled { cursor: not-allowed; opacity: .55; }
        .auth-btn-spinner-wrap { display: flex; align-items: center; justify-content: center; gap: 8px; }
        .auth-btn-spinner { width: 16px; height: 16px; animation: spin .7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .form-error {
          background: #fff5f2; border: 1px solid #f5c4b5; border-radius: var(--radius);
          padding: 12px 14px; font-size: .85rem; color: #a83e12;
          display: flex; align-items: center; gap: 8px;
        }

        .form-terms {
          font-size: .78rem; color: var(--ink-faint); line-height: 1.5; text-align: center;
        }
        .form-terms a { color: var(--ink-soft); text-decoration: underline; }

        .form-footer { margin-top: 28px; text-align: center; font-size: .85rem; color: var(--ink-soft); }
        .form-footer a { color: var(--ink); font-weight: 500; text-decoration: none; }
        .form-footer a:hover { text-decoration: underline; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .panel-right { animation: fadeUp .4s ease both; }
      `}</style>

      <Suspense>
        <RegisterInner />
      </Suspense>
    </>
  );
}
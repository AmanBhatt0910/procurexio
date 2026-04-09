'use client';

import Link from 'next/link';

export default function AuthSplitLayout({ badge, tagline, subtitle, children }) {
  return (
    <div className="auth-page">
      <div className="auth-panel-left">
        <div className="auth-panel-left-grid" />
        <div className="auth-panel-left-content">
          <div className="auth-panel-badge"><span />{badge}</div>
          <h2 className="auth-panel-tagline">{tagline}</h2>
          <p className="auth-panel-sub">{subtitle}</p>
        </div>
      </div>

      <div className="auth-panel-right">
        <Link href="/" className="auth-logo">
          <div className="auth-logo-mark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="auth-logo-name">Procure<span>xio</span></span>
        </Link>

        {children}
      </div>
    </div>
  );
}

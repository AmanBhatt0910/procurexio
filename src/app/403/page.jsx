// src/app/403/page.jsx

'use client';

import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

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
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .container {
          text-align: center;
          padding: 48px 24px;
          max-width: 480px;
          width: 100%;
        }

        .error-code {
          font-family: 'Syne', sans-serif;
          font-size: 7rem;
          font-weight: 800;
          color: var(--ink);
          letter-spacing: -.04em;
          line-height: 1;
          margin-bottom: 16px;
        }

        .error-code span { color: var(--accent); }

        .error-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--ink);
          letter-spacing: -.02em;
          margin-bottom: 12px;
        }

        .error-description {
          font-size: .93rem;
          color: var(--ink-soft);
          line-height: 1.6;
          margin-bottom: 36px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--ink);
          color: #fff;
          border: none;
          padding: 12px 24px;
          border-radius: var(--radius);
          font-family: 'DM Sans', sans-serif;
          font-size: .93rem;
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          transition: background .15s, transform .1s, box-shadow .15s;
        }

        .btn:hover {
          background: #1e1c1a;
          box-shadow: 0 4px 16px rgba(15,14,13,.18);
          transform: translateY(-1px);
        }

        .btn:active { transform: translateY(0); }

        .divider-line {
          width: 48px;
          height: 3px;
          background: var(--accent);
          border-radius: 2px;
          margin: 0 auto 32px;
        }
      `}</style>

      <div className="container">
        <div className="error-code">4<span>0</span>3</div>
        <div className="divider-line" />
        <h1 className="error-title">Access Denied</h1>
        <p className="error-description">
          You don&apos;t have permission to view this page. If you believe this
          is a mistake, please contact your administrator.
        </p>
        <Link href="/dashboard" className="btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Return to Dashboard
        </Link>
      </div>
    </>
  );
}

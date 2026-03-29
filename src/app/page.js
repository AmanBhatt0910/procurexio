import Link from 'next/link';

export default function Home() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

        :root {
          --ink: #0f0e0d;
          --ink-soft: #6b6660;
          --ink-faint: #b8b3ae;
          --surface: #faf9f7;
          --white: #ffffff;
          --accent: #c8501a;
          --accent-h: #a83e12;
          --border: #e4e0db;
          --radius: 10px;
          --shadow: 0 1px 3px rgba(15,14,13,.06), 0 8px 32px rgba(15,14,13,.08);
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'DM Sans', sans-serif;
          background: var(--surface);
          color: var(--ink);
          min-height: 100vh;
        }

        .container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* Header */
        .header {
          padding: 24px 0;
          border-bottom: 1px solid var(--border);
          background: var(--white);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .logo-mark {
          width: 34px;
          height: 34px;
          background: var(--ink);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-mark svg {
          color: #fff;
        }

        .logo-name {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1.1rem;
          color: var(--ink);
          letter-spacing: -0.01em;
        }

        .logo-name span {
          color: var(--accent);
        }

        .nav {
          display: flex;
          gap: 24px;
          align-items: center;
        }

        .nav-link {
          text-decoration: none;
          color: var(--ink-soft);
          font-size: 0.9rem;
          font-weight: 500;
          transition: color 0.15s;
        }

        .nav-link:hover {
          color: var(--ink);
        }

        .btn-outline {
          border: 1.5px solid var(--border);
          border-radius: var(--radius);
          padding: 8px 16px;
          background: transparent;
          color: var(--ink);
          font-weight: 500;
          text-decoration: none;
          transition: background 0.15s, border-color 0.15s;
        }

        .btn-outline:hover {
          background: var(--surface);
          border-color: var(--ink-soft);
        }

        .btn-primary {
          background: var(--ink);
          color: #fff;
          border: none;
          border-radius: var(--radius);
          padding: 8px 20px;
          font-weight: 500;
          text-decoration: none;
          transition: background 0.15s, transform 0.1s;
        }

        .btn-primary:hover {
          background: #1e1c1a;
          transform: translateY(-1px);
        }

        /* Hero */
        .hero {
          padding: 80px 0;
          text-align: center;
        }

        .hero-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2.8rem, 6vw, 4rem);
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: -0.02em;
          color: var(--ink);
          margin-bottom: 24px;
        }

        .hero-title span {
          color: var(--accent);
        }

        .hero-description {
          font-size: 1.2rem;
          color: var(--ink-soft);
          max-width: 600px;
          margin: 0 auto 40px;
          line-height: 1.5;
        }

        .hero-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-large {
          padding: 12px 28px;
          font-size: 1rem;
        }

        /* Features */
        .features {
          padding: 80px 0;
          background: var(--white);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }

        .section-title {
          font-family: 'Syne', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          text-align: center;
          margin-bottom: 48px;
          color: var(--ink);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 40px;
        }

        .feature-card {
          text-align: center;
          padding: 24px;
          border-radius: var(--radius);
          transition: box-shadow 0.2s;
        }

        .feature-card:hover {
          box-shadow: var(--shadow);
        }

        .feature-icon {
          width: 56px;
          height: 56px;
          background: var(--surface);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          color: var(--accent);
        }

        .feature-title {
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .feature-description {
          color: var(--ink-soft);
          font-size: 0.9rem;
          line-height: 1.5;
        }

        /* Footer */
        .footer {
          padding: 48px 0;
          text-align: center;
          color: var(--ink-faint);
          font-size: 0.85rem;
        }

        .footer-links {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .footer-links a {
          color: var(--ink-soft);
          text-decoration: none;
          transition: color 0.15s;
        }

        .footer-links a:hover {
          color: var(--ink);
        }

        .copyright {
          margin-top: 24px;
        }

        @media (max-width: 768px) {
          .hero {
            padding: 60px 0;
          }
          .features {
            padding: 60px 0;
          }
          .hero-buttons {
            flex-direction: column;
            align-items: center;
          }
          .hero-buttons .btn-large {
            width: 200px;
          }
        }
      `}</style>

      <header className="header">
        <div className="container header-inner">
          <Link href="/" className="logo">
            <div className="logo-mark">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="logo-name">Procure<span>xio</span></span>
          </Link>
          <nav className="nav">
            <Link href="/login" className="nav-link">Sign in</Link>
            <Link href="/register" className="btn-outline">Get started</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container">
            <h1 className="hero-title">
              Modern procurement,<br />
              <span>simplified & accelerated</span>
            </h1>
            <p className="hero-description">
              Procurexio brings your entire sourcing process into one place — from RFQs to vendor management, all in a collaborative workspace.
            </p>
            <div className="hero-buttons">
              <Link href="/register" className="btn-primary btn-large">Create workspace</Link>
              <Link href="/login" className="btn-outline btn-large">Sign in</Link>
            </div>
          </div>
        </section>

        <section className="features">
          <div className="container">
            <h2 className="section-title">Why teams choose Procurexio</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <h3 className="feature-title">Multi-tenant workspaces</h3>
                <p className="feature-description">Each company gets its own isolated environment. Perfect for procurement teams, vendors, and partners.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <h3 className="feature-title">Streamlined RFQs</h3>
                <p className="feature-description">Create, publish, and compare bids in one place. Real-time updates and collaborative evaluation.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                </div>
                <h3 className="feature-title">Vendor management</h3>
                <p className="feature-description">Invite vendors, manage approvals, and keep all communication centralized.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="7.5 10.5 12 13 16.5 10.5" />
                    <line x1="12" y1="13" x2="12" y2="21" />
                  </svg>
                </div>
                <h3 className="feature-title">Secure & scalable</h3>
                <p className="feature-description">Enterprise-grade security with role-based access controls and audit trails.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-links">
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <a href="mailto:support@procurexio.com">Support</a>
          </div>
          <div className="copyright">
            © {new Date().getFullYear()} Procurexio. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
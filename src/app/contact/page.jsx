// src/app/contact/page.jsx
import Link from 'next/link';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://procurexio.com';

export const metadata = {
  title: 'Contact Procurexio | Get in Touch',
  description:
    'Get in touch with the Procurexio team. Reach out for enterprise sales inquiries, product support, or partnership opportunities.',
  alternates: {
    canonical: `${baseUrl}/contact`,
  },
  openGraph: {
    title: 'Contact Procurexio | Get in Touch',
    description:
      'Get in touch with the Procurexio team for enterprise sales, support, or partnership inquiries.',
    url: `${baseUrl}/contact`,
  },
};

export default function ContactPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

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
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }

        .contact-nav {
          border-bottom: 1px solid var(--border);
          background: var(--white);
          padding: 0 32px;
          height: 60px;
          display: flex;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .contact-nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .contact-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .contact-logo-mark {
          width: 28px; height: 28px;
          background: var(--ink);
          border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
        }
        .contact-logo-mark svg { color: #fff; }
        .contact-logo-name {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: .95rem;
          color: var(--ink);
          letter-spacing: -.01em;
        }
        .contact-logo-name span { color: var(--accent); }
        .contact-nav-back {
          font-size: .85rem;
          color: var(--ink-soft);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: color .15s;
        }
        .contact-nav-back:hover { color: var(--ink); }

        .contact-root {
          max-width: 780px;
          margin: 64px auto;
          padding: 0 24px 80px;
        }

        .contact-breadcrumb {
          font-size: .8rem;
          color: var(--ink-faint);
          margin-bottom: 32px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .contact-breadcrumb a {
          color: var(--ink-faint);
          text-decoration: none;
          transition: color .15s;
        }
        .contact-breadcrumb a:hover { color: var(--ink-soft); }
        .contact-breadcrumb span { color: var(--ink-soft); }

        .contact-hero {
          margin-bottom: 48px;
        }
        .contact-tag {
          display: inline-block;
          font-size: .72rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: .08em;
          color: var(--accent);
          background: rgba(200,80,26,.08);
          border-radius: 20px;
          padding: 4px 12px;
          margin-bottom: 16px;
        }
        .contact-title {
          font-family: 'Syne', sans-serif;
          font-size: 2.2rem;
          font-weight: 800;
          color: var(--ink);
          line-height: 1.15;
          margin-bottom: 12px;
        }
        .contact-subtitle {
          font-size: 1rem;
          color: var(--ink-soft);
          line-height: 1.65;
          max-width: 520px;
        }

        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
          margin-bottom: 48px;
        }
        .contact-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 24px;
          text-decoration: none;
          transition: box-shadow .2s, border-color .2s;
        }
        .contact-card:hover {
          box-shadow: var(--shadow);
          border-color: var(--ink-faint);
        }
        .contact-card-icon {
          width: 36px; height: 36px;
          background: rgba(200,80,26,.08);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 12px;
          color: var(--accent);
        }
        .contact-card-title {
          font-family: 'Syne', sans-serif;
          font-size: .9rem;
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 6px;
        }
        .contact-card-desc {
          font-size: .82rem;
          color: var(--ink-soft);
          line-height: 1.55;
        }

        .contact-section-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 20px;
        }
        .contact-email-block {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 32px;
          margin-bottom: 40px;
        }
        .contact-email-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 16px 0;
          border-bottom: 1px solid var(--border);
        }
        .contact-email-row:last-child { border-bottom: none; padding-bottom: 0; }
        .contact-email-row:first-child { padding-top: 0; }
        .contact-email-label {
          font-size: .85rem;
          font-weight: 600;
          color: var(--ink);
          margin-bottom: 4px;
        }
        .contact-email-desc {
          font-size: .8rem;
          color: var(--ink-soft);
        }
        .contact-email-link {
          font-size: .85rem;
          color: var(--accent);
          text-decoration: none;
          white-space: nowrap;
          transition: color .15s;
        }
        .contact-email-link:hover { color: var(--accent-h); }

        .contact-footer {
          text-align: center;
          padding-top: 32px;
          border-top: 1px solid var(--border);
        }
        .contact-footer-text {
          font-size: .85rem;
          color: var(--ink-soft);
          margin-bottom: 12px;
        }
        .contact-footer-links {
          display: flex;
          justify-content: center;
          gap: 24px;
        }
        .contact-footer-link {
          font-size: .82rem;
          color: var(--ink-faint);
          text-decoration: none;
          transition: color .15s;
        }
        .contact-footer-link:hover { color: var(--ink-soft); }

        @media (max-width: 640px) {
          .contact-grid { grid-template-columns: 1fr; }
          .contact-title { font-size: 1.75rem; }
          .contact-root { margin: 40px auto; }
          .contact-email-row { flex-direction: column; gap: 8px; }
        }
      `}</style>

      <nav className="contact-nav">
        <div className="contact-nav-inner">
          <Link href="/" className="contact-logo">
            <div className="contact-logo-mark">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="contact-logo-name">Procure<span>xio</span></span>
          </Link>
          <Link href="/" className="contact-nav-back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back to home
          </Link>
        </div>
      </nav>

      <main className="contact-root">
        <nav className="contact-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
          <span>Contact</span>
        </nav>

        <div className="contact-hero">
          <div className="contact-tag">Get in touch</div>
          <h1 className="contact-title">How can we help?</h1>
          <p className="contact-subtitle">
            Whether you need enterprise pricing, technical support, or have a partnership idea — our team is ready to help.
          </p>
        </div>

        <div className="contact-grid">
          <div className="contact-card">
            <div className="contact-card-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.85a16 16 0 0 0 6 6l.95-.94a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.73 16z"/>
              </svg>
            </div>
            <div className="contact-card-title">Sales</div>
            <p className="contact-card-desc">Talk to our sales team about enterprise plans and custom pricing.</p>
          </div>
          <div className="contact-card">
            <div className="contact-card-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div className="contact-card-title">Support</div>
            <p className="contact-card-desc">Get help with your account, billing, or technical issues.</p>
          </div>
          <div className="contact-card">
            <div className="contact-card-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="contact-card-title">Partnerships</div>
            <p className="contact-card-desc">Explore integration and co-marketing partnership opportunities.</p>
          </div>
        </div>

        <h2 className="contact-section-title">Reach us by email</h2>
        <div className="contact-email-block">
          <div className="contact-email-row">
            <div>
              <div className="contact-email-label">General Inquiries</div>
              <div className="contact-email-desc">For any questions about Procurexio</div>
            </div>
            <a href="mailto:hello@procurexio.com" className="contact-email-link">hello@procurexio.com</a>
          </div>
          <div className="contact-email-row">
            <div>
              <div className="contact-email-label">Enterprise Sales</div>
              <div className="contact-email-desc">Custom pricing, demos, and enterprise contracts</div>
            </div>
            <a href="mailto:sales@procurexio.com" className="contact-email-link">sales@procurexio.com</a>
          </div>
          <div className="contact-email-row">
            <div>
              <div className="contact-email-label">Customer Support</div>
              <div className="contact-email-desc">Technical issues, billing, and account help</div>
            </div>
            <a href="mailto:support@procurexio.com" className="contact-email-link">support@procurexio.com</a>
          </div>
          <div className="contact-email-row">
            <div>
              <div className="contact-email-label">Security &amp; Privacy</div>
              <div className="contact-email-desc">Vulnerability reports and data privacy requests</div>
            </div>
            <a href="mailto:security@procurexio.com" className="contact-email-link">security@procurexio.com</a>
          </div>
        </div>

        <div className="contact-footer">
          <p className="contact-footer-text">
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Sign in</Link>
            {' '}or{' '}
            <Link href="/register" style={{ color: 'var(--accent)', textDecoration: 'none' }}>create a free account</Link>.
          </p>
          <div className="contact-footer-links">
            <Link href="/privacy" className="contact-footer-link">Privacy Policy</Link>
            <Link href="/terms" className="contact-footer-link">Terms of Service</Link>
            <Link href="/" className="contact-footer-link">Home</Link>
          </div>
        </div>
      </main>
    </>
  );
}

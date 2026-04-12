import Link from 'next/link';
import Logo from '@/components/Logo';

export default function Footer() {
  const links = {
    Product: [
      { label: 'Features', href: '#features' },
      { label: 'How it Works', href: '#how-it-works' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Changelog', href: '#' },
      { label: 'Roadmap', href: '#' },
    ],
    Company: [
      { label: 'About', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: '/contact' },
    ],
    Legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '#' },
      { label: 'Security', href: '#' },
    ],
  };

  return (
    <>
      <style>{`
        .footer-root {
          border-top: 1px solid var(--border);
          background: var(--white);
          padding: 64px 32px 40px;
        }
        .footer-inner {
          max-width: 1200px;
          margin: 0 auto;
        }

        .footer-top {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 48px;
          padding-bottom: 56px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 32px;
        }

        .footer-brand {}
        .footer-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          margin-bottom: 16px;
        }
        .footer-tagline {
          font-size: .85rem;
          color: var(--ink-soft);
          line-height: 1.65;
          max-width: 240px;
          margin-bottom: 20px;
        }
        .footer-social {
          display: flex;
          gap: 8px;
        }
        .footer-social-btn {
          width: 32px; height: 32px;
          border-radius: 7px;
          border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          color: var(--ink-soft);
          text-decoration: none;
          transition: border-color .15s, color .15s, background .15s;
        }
        .footer-social-btn:hover {
          border-color: var(--ink-soft);
          color: var(--ink);
          background: var(--surface);
        }

        .footer-col-title {
          font-family: 'Syne', sans-serif;
          font-size: .78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .07em;
          color: var(--ink);
          margin-bottom: 16px;
        }
        .footer-col-links {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .footer-col-link {
          font-size: .85rem;
          color: var(--ink-soft);
          text-decoration: none;
          transition: color .15s;
        }
        .footer-col-link:hover { color: var(--ink); }

        .footer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .footer-copy {
          font-size: .8rem;
          color: var(--ink-faint);
        }
        .footer-copy span { color: var(--ink-soft); font-weight: 500; }

        .footer-bottom-links {
          display: flex;
          gap: 20px;
        }
        .footer-bottom-link {
          font-size: .8rem;
          color: var(--ink-faint);
          text-decoration: none;
          transition: color .15s;
        }
        .footer-bottom-link:hover { color: var(--ink-soft); }

        @media (max-width: 900px) {
          .footer-top { grid-template-columns: 1fr 1fr; gap: 36px; }
          .footer-root { padding: 56px 24px 36px; }
        }
        @media (max-width: 560px) {
          .footer-top { grid-template-columns: 1fr; gap: 32px; }
          .footer-root { padding: 48px 16px 32px; }
          .footer-bottom { flex-direction: column; align-items: flex-start; gap: 16px; }
          .footer-bottom-links { gap: 16px; flex-wrap: wrap; }
        }
      `}</style>

      <footer className="footer-root">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <Link href="/" className="footer-logo">
                <Logo variant="light" size={30} />
              </Link>
              <p className="footer-tagline">
                The procurement intelligence platform for modern sourcing teams.
              </p>
              <div className="footer-social">
                <a href="#" className="footer-social-btn" aria-label="Twitter/X">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
                  </svg>
                </a>
                <a href="#" className="footer-social-btn" aria-label="LinkedIn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                    <rect x="2" y="9" width="4" height="12"/>
                    <circle cx="4" cy="4" r="2"/>
                  </svg>
                </a>
                <a href="#" className="footer-social-btn" aria-label="GitHub">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                  </svg>
                </a>
              </div>
            </div>

            {Object.entries(links).map(([section, items]) => (
              <div key={section}>
                <div className="footer-col-title">{section}</div>
                <ul className="footer-col-links">
                  {items.map(item => (
                    <li key={item.label}>
                      <Link href={item.href} className="footer-col-link">{item.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="footer-bottom">
            <p className="footer-copy">
              © {new Date().getFullYear()} <span>Procurexio</span>. All rights reserved.
            </p>
            <div className="footer-bottom-links">
              <Link href="/privacy" className="footer-bottom-link">Privacy</Link>
              <Link href="/terms" className="footer-bottom-link">Terms</Link>
              <a href="#" className="footer-bottom-link">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
import Link from 'next/link';

export default function CTASection() {
  return (
    <>
      <style>{`
        .cta-wrapper {
          padding: 0 32px 100px;
        }
        .cta-inner {
          max-width: 1200px;
          margin: 0 auto;
        }
        .cta-card {
          background: var(--ink);
          border-radius: 20px;
          padding: 72px 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 48px;
          position: relative;
          overflow: hidden;
        }
        .cta-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 80% at -10% 50%, rgba(200,80,26,.18) 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 110% 30%, rgba(200,80,26,.1) 0%, transparent 60%);
          pointer-events: none;
        }
        .cta-grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        .cta-content {
          position: relative;
          z-index: 1;
          max-width: 560px;
        }
        .cta-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(200,80,26,.15);
          border: 1px solid rgba(200,80,26,.3);
          border-radius: 100px;
          padding: 4px 12px;
          font-size: .72rem;
          font-weight: 700;
          color: rgba(200,80,26,.9);
          letter-spacing: .06em;
          text-transform: uppercase;
          margin-bottom: 24px;
        }
        .cta-heading {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.8rem, 3vw, 2.6rem);
          font-weight: 800;
          letter-spacing: -.03em;
          color: #fff;
          line-height: 1.15;
          margin-bottom: 16px;
        }
        .cta-sub {
          font-size: 1rem;
          color: rgba(255,255,255,.5);
          line-height: 1.65;
        }

        .cta-actions {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
          flex-shrink: 0;
        }
        .cta-btn-main {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--accent);
          color: #fff;
          text-decoration: none;
          border-radius: 10px;
          padding: 14px 28px;
          font-size: 1rem;
          font-weight: 700;
          white-space: nowrap;
          transition: background .15s, transform .15s, box-shadow .15s;
        }
        .cta-btn-main:hover {
          background: var(--accent-h);
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(200,80,26,.4);
        }
        .cta-btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          color: rgba(255,255,255,.55);
          text-decoration: none;
          font-size: .85rem;
          font-weight: 500;
          transition: color .15s;
          border: none;
          cursor: pointer;
          padding: 0;
        }
        .cta-btn-ghost:hover { color: rgba(255,255,255,.85); }

        .cta-guarantee {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: .75rem;
          color: rgba(255,255,255,.3);
          margin-top: 4px;
        }

        @media (max-width: 860px) {
          .cta-card {
            flex-direction: column;
            align-items: flex-start;
            padding: 48px 40px;
            gap: 32px;
          }
          .cta-actions { width: 100%; }
          .cta-btn-main { width: 100%; justify-content: center; }
        }
        @media (max-width: 640px) {
          .cta-wrapper { padding: 0 24px 80px; }
          .cta-card { padding: 40px 28px; border-radius: 16px; }
          .cta-heading { font-size: clamp(1.5rem, 5vw, 2rem); }
        }
        @media (max-width: 560px) {
          .cta-wrapper { padding: 0 16px 64px; }
          .cta-card { padding: 32px 20px; }
        }
      `}</style>

      <div className="cta-wrapper">
        <div className="cta-inner">
          <div className="cta-card">
            <div className="cta-grid-overlay" />

            <div className="cta-content">
              <div className="cta-tag">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                Get started today
              </div>
              <h2 className="cta-heading">
                Start managing procurement<br />the smarter way
              </h2>
              <p className="cta-sub">
                Join hundreds of procurement teams who&apos;ve cut their sourcing cycle in half. Free to start, no credit card required.
              </p>
            </div>

            <div className="cta-actions">
              <Link href="/register" className="cta-btn-main">
                Get Started Free
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
              <Link href="/login" className="cta-btn-ghost">
                Already have an account? Sign in →
              </Link>
              <div className="cta-guarantee">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                14-day free trial · No credit card needed
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
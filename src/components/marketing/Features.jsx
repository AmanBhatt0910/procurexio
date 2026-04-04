export default function Features() {
  const features = [
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      ),
      title: 'RFQ Management',
      desc: 'Create structured RFQs with line items, deadlines, and custom evaluation criteria. Publish in minutes.',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      title: 'Vendor Collaboration',
      desc: 'Invite vendors by email, manage approvals, and keep all communication centralized per RFQ.',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      ),
      title: 'Bid Comparison',
      desc: 'Side-by-side bid analysis with weighted scoring. Instantly spot the best value, not just the lowest price.',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ),
      title: 'Smart Evaluation',
      desc: 'Score bids on technical and commercial criteria. Collaborative team scoring with audit trails.',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="18" height="18" rx="3"/>
          <path d="M9 12l2 2 4-4"/>
        </svg>
      ),
      title: 'Contract Awarding',
      desc: 'Award contracts with one click. Auto-notify winning and non-winning vendors with custom messages.',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      ),
      title: 'Smart Notifications',
      desc: 'Real-time alerts for bid submissions, deadlines, and status changes. Never miss a critical update.',
    },
  ];

  return (
    <>
      <style>{`
        .features-section {
          padding: 100px 32px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .section-eyebrow {
          font-size: .75rem;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 12px;
        }
        .section-heading {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.8rem, 3.5vw, 2.6rem);
          font-weight: 800;
          letter-spacing: -.03em;
          color: var(--ink);
          line-height: 1.15;
          margin-bottom: 16px;
        }
        .section-sub {
          font-size: 1.05rem;
          color: var(--ink-soft);
          max-width: 500px;
          line-height: 1.65;
        }

        .features-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 64px;
          gap: 32px;
        }
        .features-header-right {
          flex-shrink: 0;
        }
        .features-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: .88rem;
          font-weight: 600;
          color: var(--ink);
          text-decoration: none;
          border-bottom: 1.5px solid var(--border);
          padding-bottom: 2px;
          transition: border-color .15s, color .15s;
        }
        .features-link:hover {
          color: var(--accent);
          border-color: var(--accent);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
        }

        .feature-item {
          background: var(--white);
          padding: 36px 32px;
          transition: background .2s;
          position: relative;
        }
        .feature-item:hover { background: #fdfcfa; }

        .feature-icon-wrap {
          width: 44px; height: 44px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
          color: var(--ink);
          transition: background .2s, border-color .2s, color .2s;
        }
        .feature-item:hover .feature-icon-wrap {
          background: #fff5f0;
          border-color: #f5c4b5;
          color: var(--accent);
        }

        .feature-title {
          font-family: 'Syne', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 8px;
          letter-spacing: -.01em;
        }
        .feature-desc {
          font-size: .875rem;
          color: var(--ink-soft);
          line-height: 1.6;
        }

        @media (max-width: 900px) {
          .features-grid { grid-template-columns: repeat(2, 1fr); }
          .features-header { flex-direction: column; align-items: flex-start; }
        }
        @media (max-width: 560px) {
          .features-grid { grid-template-columns: 1fr; }
          .features-section { padding: 64px 20px; }
          .feature-item { padding: 28px 24px; }
        }
      `}</style>

      <section id="features" className="features-section">
        <div className="features-header">
          <div>
            <div className="section-eyebrow">Features</div>
            <h2 className="section-heading">
              Everything your procurement<br />team needs to move fast
            </h2>
            <p className="section-sub">
              From the first RFQ to the final contract — Procurexio handles the entire sourcing cycle.
            </p>
          </div>
          <div className="features-header-right">
            <a href="/register" className="features-link">
              View all features
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
        </div>

        <div className="features-grid">
          {features.map(f => (
            <div className="feature-item" key={f.title}>
              <div className="feature-icon-wrap">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
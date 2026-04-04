export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Create & Publish RFQ',
      desc: 'Define your requirements with line items, specifications, and deadline. Set evaluation criteria — price, quality, delivery — however you need.',
      detail: 'Customizable templates · Deadline management · Multi-item support',
      color: '#fff5f0',
      accent: '#c8501a',
    },
    {
      num: '02',
      title: 'Invite Vendors & Receive Bids',
      desc: 'Invite from your vendor library or add new ones on the fly. Vendors submit structured bids through their dedicated portal — no email chaos.',
      detail: 'Email invitations · Vendor portal · Real-time tracking',
      color: '#eff6ff',
      accent: '#1d4ed8',
    },
    {
      num: '03',
      title: 'Evaluate, Compare & Award',
      desc: 'Compare bids side-by-side with weighted scoring. Collaborate with your team, then award the contract — with auto-notifications to all vendors.',
      detail: 'Scoring engine · Team collaboration · Instant award notifications',
      color: '#f0fdf4',
      accent: '#15803d',
    },
  ];

  return (
    <>
      <style>{`
        .hiw-wrapper {
          background: var(--ink);
          padding: 100px 32px;
        }
        .hiw-inner {
          max-width: 1200px;
          margin: 0 auto;
        }

        .hiw-header {
          margin-bottom: 72px;
        }
        .hiw-eyebrow {
          font-size: .75rem;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: rgba(200,80,26,.7);
          margin-bottom: 12px;
        }
        .hiw-heading {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.8rem, 3.5vw, 2.6rem);
          font-weight: 800;
          color: #fff;
          letter-spacing: -.03em;
          line-height: 1.15;
          margin-bottom: 16px;
        }
        .hiw-sub {
          font-size: 1rem;
          color: rgba(255,255,255,.45);
          max-width: 460px;
          line-height: 1.65;
        }

        .hiw-steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          position: relative;
        }

        .hiw-connector {
          position: absolute;
          top: 56px;
          left: calc(33.33% + 12px);
          width: calc(33.33% - 24px);
          height: 1px;
          background: repeating-linear-gradient(90deg, rgba(255,255,255,.15) 0, rgba(255,255,255,.15) 6px, transparent 6px, transparent 12px);
        }
        .hiw-connector-2 {
          left: calc(66.66% + 12px);
        }

        .hiw-step {
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 14px;
          padding: 32px 28px;
          transition: background .2s, border-color .2s;
          position: relative;
          overflow: hidden;
        }
        .hiw-step::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 2px;
          background: var(--step-accent);
          opacity: 0;
          transition: opacity .2s;
        }
        .hiw-step:hover {
          background: rgba(255,255,255,.07);
          border-color: rgba(255,255,255,.14);
        }
        .hiw-step:hover::before { opacity: 1; }

        .hiw-num {
          font-family: 'Syne', sans-serif;
          font-size: .75rem;
          font-weight: 800;
          letter-spacing: .08em;
          color: rgba(255,255,255,.2);
          margin-bottom: 20px;
        }

        .hiw-step-icon {
          width: 48px; height: 48px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
          font-size: 1.4rem;
        }

        .hiw-step-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.05rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 12px;
          letter-spacing: -.01em;
        }

        .hiw-step-desc {
          font-size: .875rem;
          color: rgba(255,255,255,.45);
          line-height: 1.65;
          margin-bottom: 20px;
        }

        .hiw-step-detail {
          font-size: .72rem;
          color: rgba(255,255,255,.25);
          font-weight: 500;
          letter-spacing: .01em;
          border-top: 1px solid rgba(255,255,255,.08);
          padding-top: 16px;
        }

        @media (max-width: 860px) {
          .hiw-steps { grid-template-columns: 1fr; }
          .hiw-connector { display: none; }
          .hiw-wrapper { padding: 64px 20px; }
        }
      `}</style>

      <section id="how-it-works" className="hiw-wrapper">
        <div className="hiw-inner">
          <div className="hiw-header">
            <div className="hiw-eyebrow">How it Works</div>
            <h2 className="hiw-heading">Three steps to smarter procurement</h2>
            <p className="hiw-sub">
              From requirements to awarded contract — Procurexio cuts your sourcing cycle in half.
            </p>
          </div>

          <div className="hiw-steps">
            <div className="hiw-connector" />
            <div className="hiw-connector hiw-connector-2" />

            {steps.map((s, i) => (
              <div className="hiw-step" key={s.num} style={{ '--step-accent': s.accent }}>
                <div className="hiw-num">{s.num}</div>
                <div className="hiw-step-icon" style={{ background: s.color }}>
                  {i === 0 && '📋'}
                  {i === 1 && '🤝'}
                  {i === 2 && '🏆'}
                </div>
                <div className="hiw-step-title">{s.title}</div>
                <div className="hiw-step-desc">{s.desc}</div>
                <div className="hiw-step-detail">{s.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
import Link from 'next/link';

function PricingCard({ tier, price, period, desc, features, cta, href, highlighted, badge }) {
  return (
    <>
      <style>{`
        .pricing-card {
          background: var(--white);
          border: 1.5px solid var(--border);
          border-radius: 16px;
          padding: 32px 28px;
          display: flex;
          flex-direction: column;
          gap: 0;
          transition: box-shadow .2s, transform .2s, border-color .2s;
          position: relative;
        }
        .pricing-card:hover {
          box-shadow: var(--shadow);
          transform: translateY(-3px);
        }
        .pricing-card.highlighted {
          border-color: var(--ink);
          box-shadow: 0 4px 12px rgba(15,14,13,.08), 0 24px 64px rgba(15,14,13,.1);
        }
        .pricing-card.highlighted:hover { transform: translateY(-4px); }

        .pricing-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--ink);
          color: #fff;
          font-size: .68rem;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          padding: 4px 12px;
          border-radius: 100px;
          white-space: nowrap;
        }

        .pricing-tier {
          font-size: .78rem;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--ink-faint);
          margin-bottom: 16px;
        }
        .pricing-card.highlighted .pricing-tier { color: var(--accent); }

        .pricing-price-row {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 6px;
        }
        .pricing-currency {
          font-family: 'Syne', sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--ink-soft);
          margin-top: 6px;
        }
        .pricing-amount {
          font-family: 'Syne', sans-serif;
          font-size: 2.8rem;
          font-weight: 800;
          letter-spacing: -.04em;
          color: var(--ink);
          line-height: 1;
        }
        .pricing-period {
          font-size: .82rem;
          color: var(--ink-faint);
          font-weight: 500;
        }

        .pricing-desc {
          font-size: .85rem;
          color: var(--ink-soft);
          line-height: 1.55;
          margin-bottom: 28px;
          margin-top: 8px;
        }

        .pricing-divider {
          height: 1px;
          background: var(--border);
          margin-bottom: 24px;
        }

        .pricing-features {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
          margin-bottom: 32px;
        }
        .pricing-feature {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: .85rem;
          color: var(--ink-soft);
          line-height: 1.45;
        }
        .pricing-check {
          flex-shrink: 0;
          margin-top: 1px;
          color: #16a34a;
        }
        .pricing-card.highlighted .pricing-check { color: var(--accent); }

        .pricing-cta {
          display: block;
          text-align: center;
          text-decoration: none;
          border-radius: 10px;
          padding: 12px 20px;
          font-size: .9rem;
          font-weight: 600;
          transition: background .15s, transform .1s, box-shadow .15s;
        }
        .pricing-cta-ghost {
          border: 1.5px solid var(--border);
          color: var(--ink);
          background: transparent;
        }
        .pricing-cta-ghost:hover {
          border-color: var(--ink-soft);
          background: rgba(15,14,13,.03);
          transform: translateY(-1px);
        }
        .pricing-cta-solid {
          background: var(--ink);
          color: #fff;
          border: none;
        }
        .pricing-cta-solid:hover {
          background: #222;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(15,14,13,.2);
        }
        .pricing-cta-accent {
          background: var(--accent);
          color: #fff;
          border: none;
        }
        .pricing-cta-accent:hover {
          background: var(--accent-h);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(200,80,26,.3);
        }
      `}</style>

      <div className={`pricing-card${highlighted ? ' highlighted' : ''}`}>
        {badge && <span className="pricing-badge">{badge}</span>}
        <div className="pricing-tier">{tier}</div>
        <div className="pricing-price-row">
          {price !== 'Custom' && <span className="pricing-currency">₹</span>}
          <span className="pricing-amount">{price}</span>
          {period && <span className="pricing-period">/{period}</span>}
        </div>
        <p className="pricing-desc">{desc}</p>
        <div className="pricing-divider" />
        <ul className="pricing-features">
          {features.map(f => (
            <li key={f} className="pricing-feature">
              <svg className="pricing-check" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {f}
            </li>
          ))}
        </ul>
        <Link href={href} className={`pricing-cta pricing-cta-${highlighted ? 'accent' : tier === 'Enterprise' ? 'ghost' : 'ghost'}`}>
          {cta}
        </Link>
      </div>
    </>
  );
}

export default function Pricing() {
  const tiers = [
    {
      tier: 'Free',
      price: '0',
      period: 'mo',
      desc: 'Get started with procurement basics. Perfect for small teams just getting organized.',
      features: [
        'Up to 5 RFQs/month',
        '10 vendor invitations',
        'Basic bid comparison',
        'Email notifications',
        '1 team member',
        'Community support',
      ],
      cta: 'Start for free',
      href: '/register',
      highlighted: false,
    },
    {
      tier: 'Pro',
      price: '5999',
      period: 'mo',
      desc: 'Everything your team needs to run a full procurement operation at scale.',
      features: [
        'Unlimited RFQs',
        'Unlimited vendors',
        'Advanced bid scoring',
        'Team collaboration (10 seats)',
        'Contract management',
        'Priority email support',
        'Audit trail & reporting',
        'Custom evaluation criteria',
      ],
      cta: 'Start free trial',
      href: '/register',
      highlighted: true,
      badge: 'Most Popular',
    },
    {
      tier: 'Enterprise',
      price: 'Custom',
      period: null,
      desc: 'For large organizations with complex procurement workflows and compliance needs.',
      features: [
        'Everything in Pro',
        'Unlimited team seats',
        'SSO / SAML authentication',
        'Dedicated success manager',
        'Custom integrations & API',
        'SLA guarantees',
        'On-premise deployment option',
        'Custom contract terms',
      ],
      cta: 'Contact sales',
      href: '/contact',
      highlighted: false,
    },
  ];

  return (
    <>
      <style>{`
        .pricing-section {
          padding: 100px 32px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .pricing-header {
          text-align: center;
          margin-bottom: 64px;
        }
        .pricing-eyebrow {
          font-size: .75rem;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 12px;
        }
        .pricing-heading {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.8rem, 3.5vw, 2.6rem);
          font-weight: 800;
          letter-spacing: -.03em;
          color: var(--ink);
          line-height: 1.15;
          margin-bottom: 14px;
        }
        .pricing-sub {
          font-size: 1rem;
          color: var(--ink-soft);
          max-width: 420px;
          margin: 0 auto;
          line-height: 1.65;
        }
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          align-items: start;
        }
        .pricing-grid > :nth-child(2) {
          margin-top: -16px;
        }
        .pricing-note {
          text-align: center;
          margin-top: 40px;
          font-size: .82rem;
          color: var(--ink-faint);
        }
        .pricing-note a {
          color: var(--ink-soft);
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        @media (max-width: 900px) and (min-width: 641px) {
          .pricing-grid { grid-template-columns: repeat(2, 1fr); max-width: 700px; margin: 0 auto; }
          .pricing-grid > :nth-child(2) { margin-top: 0; }
          .pricing-section { padding: 80px 24px; }
        }
        @media (max-width: 860px) {
          .pricing-grid { grid-template-columns: 1fr; max-width: 440px; margin: 0 auto; }
          .pricing-grid > :nth-child(2) { margin-top: 0; }
        }
        @media (max-width: 560px) {
          .pricing-section { padding: 64px 16px; }
          .pricing-heading { font-size: clamp(1.6rem, 6vw, 2.2rem); }
        }
      `}</style>

      <section id="pricing" className="pricing-section">
        <div className="pricing-header">
          <div className="pricing-eyebrow">Pricing</div>
          <h2 className="pricing-heading">Simple, transparent pricing</h2>
          <p className="pricing-sub">No hidden fees. No surprise invoices. Cancel anytime.</p>
        </div>

        <div className="pricing-grid">
          {tiers.map(t => (
            <PricingCard key={t.tier} {...t} />
          ))}
        </div>

        <p className="pricing-note">
          All plans include a 14-day free trial. No credit card required.{' '}
          <a href="#">Compare all features →</a>
        </p>
      </section>
    </>
  );
}
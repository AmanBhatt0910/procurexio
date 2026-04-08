// src/app/terms/page.jsx
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — Procurexio',
  description: 'Procurexio Terms of Service for the procurement SaaS platform.',
};

export default function TermsPage() {
  const lastUpdated = 'April 8, 2025';

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
          --border:   #e4e0db;
          --radius:   10px;
        }

        body {
          font-family: 'DM Sans', sans-serif;
          background: var(--surface);
          color: var(--ink);
        }

        .policy-wrap {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
        }

        /* ── Top nav bar ── */
        .policy-nav {
          border-bottom: 1px solid var(--border);
          background: var(--white);
          padding: 0 40px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        @media (max-width: 600px) { .policy-nav { padding: 0 20px; } }

        .policy-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .policy-logo-mark {
          width: 30px; height: 30px;
          background: var(--ink);
          border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
        }
        .policy-logo-mark svg { color: #fff; }
        .policy-logo-name {
          font-family: 'Syne', sans-serif;
          font-weight: 700; font-size: 1rem;
          color: var(--ink); letter-spacing: -.01em;
        }
        .policy-logo-name span { color: var(--accent); }

        .policy-nav-links { display: flex; gap: 20px; align-items: center; }
        .policy-nav-links a {
          font-size: .84rem; color: var(--ink-soft);
          text-decoration: none; transition: color .15s;
        }
        .policy-nav-links a:hover { color: var(--ink); }
        .policy-nav-links .nav-cta {
          background: var(--ink); color: #fff;
          padding: 7px 16px; border-radius: 7px;
          font-size: .82rem; font-weight: 500;
        }
        .policy-nav-links .nav-cta:hover { background: #1e1c1a; color: #fff; }

        /* ── Hero band ── */
        .policy-hero {
          background: var(--ink);
          color: #fff;
          padding: 56px 40px 52px;
          text-align: center;
        }
        @media (max-width: 600px) { .policy-hero { padding: 44px 20px 40px; } }

        .policy-hero-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,.1);
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 20px;
          padding: 4px 14px;
          font-size: .75rem; color: rgba(255,255,255,.6);
          letter-spacing: .04em; text-transform: uppercase;
          margin-bottom: 20px;
        }

        .policy-hero h1 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.8rem, 4vw, 2.6rem);
          font-weight: 800; letter-spacing: -.03em;
          margin-bottom: 12px;
        }
        .policy-hero h1 span { color: var(--accent); }

        .policy-hero p {
          color: rgba(255,255,255,.55);
          font-size: .92rem; max-width: 560px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* ── Main layout ── */
        .policy-main {
          display: flex;
          gap: 48px;
          max-width: 1080px;
          width: 100%;
          margin: 0 auto;
          padding: 56px 40px 80px;
          align-items: flex-start;
        }
        @media (max-width: 900px) {
          .policy-main { flex-direction: column; gap: 0; padding: 40px 24px 64px; }
        }
        @media (max-width: 600px) { .policy-main { padding: 28px 16px 56px; } }

        /* ── Sidebar TOC ── */
        .policy-toc {
          width: 220px;
          flex-shrink: 0;
          position: sticky;
          top: 80px;
        }
        @media (max-width: 900px) {
          .policy-toc {
            position: static; width: 100%;
            background: var(--white);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 20px; margin-bottom: 36px;
          }
        }

        .toc-title {
          font-size: .72rem; font-weight: 600;
          letter-spacing: .08em; text-transform: uppercase;
          color: var(--ink-faint); margin-bottom: 12px;
        }

        .toc-list { list-style: none; display: flex; flex-direction: column; gap: 4px; }
        .toc-list a {
          display: block; padding: 5px 10px;
          font-size: .82rem; color: var(--ink-soft);
          text-decoration: none; border-radius: 6px;
          border-left: 2px solid transparent;
          transition: color .15s, background .15s, border-color .15s;
          line-height: 1.4;
        }
        .toc-list a:hover {
          color: var(--ink);
          background: rgba(15,14,13,.04);
          border-left-color: var(--border);
        }

        /* ── Content ── */
        .policy-content { flex: 1; min-width: 0; }

        .policy-meta {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 36px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border);
          flex-wrap: wrap;
        }
        .policy-meta-item {
          font-size: .78rem; color: var(--ink-soft);
          display: flex; align-items: center; gap: 5px;
        }
        .policy-meta-dot {
          width: 3px; height: 3px; border-radius: 50%;
          background: var(--ink-faint);
        }

        .policy-section {
          margin-bottom: 44px;
          scroll-margin-top: 80px;
        }

        .section-number {
          display: inline-block;
          font-size: .7rem; font-weight: 700;
          letter-spacing: .06em; text-transform: uppercase;
          color: var(--accent);
          background: rgba(200,80,26,.08);
          padding: 3px 9px; border-radius: 20px;
          margin-bottom: 10px;
        }

        .policy-section h2 {
          font-family: 'Syne', sans-serif;
          font-size: 1.2rem; font-weight: 700;
          color: var(--ink); margin-bottom: 14px;
          letter-spacing: -.02em;
        }

        .policy-section p {
          font-size: .9rem; color: var(--ink-soft);
          line-height: 1.75; margin-bottom: 12px;
        }
        .policy-section p:last-child { margin-bottom: 0; }

        .policy-section ul, .policy-section ol {
          padding-left: 20px;
          display: flex; flex-direction: column; gap: 7px;
          margin-bottom: 12px;
        }
        .policy-section li {
          font-size: .9rem; color: var(--ink-soft);
          line-height: 1.65;
        }

        .policy-section strong { color: var(--ink); font-weight: 500; }

        .policy-callout {
          background: rgba(200,80,26,.06);
          border-left: 3px solid var(--accent);
          border-radius: 0 8px 8px 0;
          padding: 14px 18px;
          margin: 16px 0;
          font-size: .88rem; color: var(--ink-soft);
          line-height: 1.6;
        }

        .policy-divider {
          height: 1px; background: var(--border);
          margin: 44px 0;
        }

        /* ── Footer ── */
        .policy-footer {
          border-top: 1px solid var(--border);
          background: var(--white);
          padding: 28px 40px;
          display: flex; align-items: center;
          justify-content: space-between; gap: 16px;
          flex-wrap: wrap;
        }
        @media (max-width: 600px) { .policy-footer { padding: 24px 20px; flex-direction: column; align-items: flex-start; } }

        .policy-footer p { font-size: .8rem; color: var(--ink-faint); }
        .policy-footer-links { display: flex; gap: 20px; }
        .policy-footer-links a {
          font-size: .8rem; color: var(--ink-soft);
          text-decoration: none; transition: color .15s;
        }
        .policy-footer-links a:hover { color: var(--ink); }
        .policy-footer-links a.active { color: var(--accent); font-weight: 500; }
      `}</style>

      <div className="policy-wrap">
        {/* Nav */}
        <nav className="policy-nav">
          <Link href="/" className="policy-logo">
            <span className="policy-logo-mark">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </span>
            <span className="policy-logo-name">Procure<span>x</span>io</span>
          </Link>
          <div className="policy-nav-links">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/login" className="nav-cta">Sign in</Link>
          </div>
        </nav>

        {/* Hero */}
        <div className="policy-hero">
          <div className="policy-hero-badge">Legal</div>
          <h1>Terms of <span>Service</span></h1>
          <p>
            Please read these terms carefully before using the Procurexio procurement
            platform. By using our service you agree to be bound by these terms.
          </p>
        </div>

        {/* Main */}
        <div className="policy-main">
          {/* Sidebar TOC */}
          <aside className="policy-toc">
            <p className="toc-title">Contents</p>
            <ul className="toc-list">
              {[
                ['#acceptance',      '1. Acceptance of Terms'],
                ['#description',     '2. Service Description'],
                ['#accounts',        '3. Accounts & Access'],
                ['#responsibilities','4. User Responsibilities'],
                ['#data',            '5. Data & Privacy'],
                ['#ip',              '6. Intellectual Property'],
                ['#payment',         '7. Payment & Billing'],
                ['#termination',     '8. Termination'],
                ['#liability',       '9. Limitation of Liability'],
                ['#disputes',        '10. Disputes & Governing Law'],
                ['#changes',         '11. Changes to Terms'],
                ['#contact',         '12. Contact'],
              ].map(([href, label]) => (
                <li key={href}>
                  <a href={href}>{label}</a>
                </li>
              ))}
            </ul>
          </aside>

          {/* Content */}
          <article className="policy-content">
            <div className="policy-meta">
              <span className="policy-meta-item">Last updated: {lastUpdated}</span>
              <span className="policy-meta-dot" />
              <span className="policy-meta-item">Version 1.0</span>
              <span className="policy-meta-dot" />
              <span className="policy-meta-item">Effective immediately</span>
            </div>

            {/* 1 */}
            <section className="policy-section" id="acceptance">
              <span className="section-number">Section 01</span>
              <h2>Acceptance of Terms</h2>
              <p>
                By accessing or using Procurexio (&quot;Service&quot;, &quot;Platform&quot;), operated by
                Procurexio Inc. (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;), you (&quot;User&quot;,
                &quot;you&quot;, &quot;your&quot;) agree to be legally bound by these Terms of Service
                (&quot;Terms&quot;) and our <Link href="/privacy">Privacy Policy</Link>.
              </p>
              <p>
                If you are accepting these Terms on behalf of a company or other legal
                entity, you represent that you have the authority to bind that entity to
                these Terms. If you do not have such authority, or if you do not agree
                with these Terms, you must not access or use the Service.
              </p>
              <div className="policy-callout">
                These Terms constitute the entire agreement between you and Procurexio
                regarding use of the Service and supersede any prior agreements.
              </div>
            </section>

            <div className="policy-divider" />

            {/* 2 */}
            <section className="policy-section" id="description">
              <span className="section-number">Section 02</span>
              <h2>Service Description</h2>
              <p>
                Procurexio is a cloud-based, multi-tenant procurement management platform
                that enables organisations to manage the full source-to-pay cycle,
                including but not limited to:
              </p>
              <ul>
                <li>Supplier and vendor onboarding and management</li>
                <li>Request for Quotation (RFQ) creation, distribution, and bid evaluation</li>
                <li>Purchase order creation, approval workflows, and tracking</li>
                <li>Contract lifecycle management</li>
                <li>Spend analytics and reporting dashboards</li>
                <li>Role-based access control for procurement teams</li>
              </ul>
              <p>
                The Service is provided on a software-as-a-service (&quot;SaaS&quot;) basis.
                We reserve the right to modify, update, or discontinue any feature of the
                Service at any time with reasonable notice where practicable.
              </p>
            </section>

            <div className="policy-divider" />

            {/* 3 */}
            <section className="policy-section" id="accounts">
              <span className="section-number">Section 03</span>
              <h2>Accounts &amp; Access</h2>
              <p>
                <strong>Account creation.</strong> To access the Service you must create
                an account and provide accurate, complete, and current information.
                You are responsible for maintaining the confidentiality of your login
                credentials.
              </p>
              <p>
                <strong>Multi-tenant environment.</strong> Procurexio operates as a
                multi-tenant platform. Each registered company (&quot;Tenant&quot;) has an
                isolated workspace. Company administrators (&quot;Admins&quot;) may invite
                team members and vendors, and are responsible for managing permissions
                within their workspace.
              </p>
              <p>
                <strong>Prohibited sharing.</strong> You must not share your account
                credentials with others or allow multiple individuals to use the same
                account. Each user must have their own credentials.
              </p>
              <p>
                <strong>Account security.</strong> You agree to notify us immediately at{' '}
                <a href="mailto:security@procurexio.com">security@procurexio.com</a> if
                you suspect unauthorised access to your account.
              </p>
            </section>

            <div className="policy-divider" />

            {/* 4 */}
            <section className="policy-section" id="responsibilities">
              <span className="section-number">Section 04</span>
              <h2>User Responsibilities</h2>
              <p>
                You agree to use the Service only for lawful purposes and in accordance
                with these Terms. You must not:
              </p>
              <ul>
                <li>Upload, transmit, or store content that is unlawful, harmful, defamatory, or infringes third-party rights.</li>
                <li>Attempt to gain unauthorised access to any part of the Service, other tenants&apos; data, or related systems.</li>
                <li>Use the Service to send unsolicited commercial communications (spam).</li>
                <li>Reverse engineer, decompile, or disassemble any part of the Service.</li>
                <li>Use automated tools (bots, scrapers, crawlers) to access the Service without our prior written consent.</li>
                <li>Introduce malicious code, viruses, or any material that is harmful to the Service or other users.</li>
                <li>Violate any applicable laws or regulations, including export control laws.</li>
              </ul>
              <p>
                Company Admins bear additional responsibility for ensuring that all users
                within their workspace comply with these Terms and applicable laws,
                including data protection regulations.
              </p>
            </section>

            <div className="policy-divider" />

            {/* 5 */}
            <section className="policy-section" id="data">
              <span className="section-number">Section 05</span>
              <h2>Data &amp; Privacy</h2>
              <p>
                Our collection and use of personal data is governed by our{' '}
                <Link href="/privacy">Privacy Policy</Link>, which is incorporated into
                these Terms by reference.
              </p>
              <p>
                <strong>Your data.</strong> You retain ownership of all data you submit to
                the Service (&quot;Customer Data&quot;). You grant us a limited, non-exclusive
                licence to process Customer Data solely to provide and improve the Service.
              </p>
              <p>
                <strong>Data isolation.</strong> We implement technical and organisational
                measures to ensure Customer Data is logically isolated between tenants.
                We will not access your data except as required to provide the Service,
                for security purposes, or as required by law.
              </p>
              <p>
                <strong>Data retention.</strong> Upon termination of your account, we will
                retain your data for 30 days to allow for retrieval, after which it will
                be securely deleted unless longer retention is required by law.
              </p>
            </section>

            <div className="policy-divider" />

            {/* 6 */}
            <section className="policy-section" id="ip">
              <span className="section-number">Section 06</span>
              <h2>Intellectual Property</h2>
              <p>
                <strong>Our IP.</strong> The Service, including all software, designs,
                trademarks, and content created by us, is owned by Procurexio Inc. and
                protected by intellectual property laws. These Terms do not grant you any
                right, title, or interest in our IP.
              </p>
              <p>
                <strong>Licence to use.</strong> Subject to these Terms and payment of
                applicable fees, we grant you a limited, non-exclusive, non-transferable,
                revocable licence to access and use the Service for your internal business
                purposes.
              </p>
              <p>
                <strong>Feedback.</strong> Any feedback, suggestions, or ideas you provide
                regarding the Service may be used by us without restriction or compensation
                to you.
              </p>
            </section>

            <div className="policy-divider" />

            {/* 7 */}
            <section className="policy-section" id="payment">
              <span className="section-number">Section 07</span>
              <h2>Payment &amp; Billing</h2>
              <p>
                <strong>Subscription fees.</strong> Access to certain features of the
                Service requires payment of subscription fees as set out in your chosen
                plan. All fees are exclusive of applicable taxes unless stated otherwise.
              </p>
              <p>
                <strong>Billing.</strong> Fees are billed in advance on a monthly or
                annual basis. By providing payment details, you authorise us to charge the
                applicable fees to your payment method.
              </p>
              <p>
                <strong>Refunds.</strong> Except where required by applicable law, fees
                paid are non-refundable. If you believe a billing error has occurred,
                please contact us within 30 days of the charge.
              </p>
              <p>
                <strong>Price changes.</strong> We may change subscription fees with at
                least 30 days&apos; prior notice. Continued use of the Service after a price
                change constitutes your acceptance of the new fees.
              </p>
            </section>

            <div className="policy-divider" />

            {/* 8 */}
            <section className="policy-section" id="termination">
              <span className="section-number">Section 08</span>
              <h2>Termination</h2>
              <p>
                <strong>By you.</strong> You may cancel your account at any time from the
                account settings. Cancellation takes effect at the end of the current
                billing period.
              </p>
              <p>
                <strong>By us.</strong> We may suspend or terminate your access to the
                Service immediately, without prior notice, if:
              </p>
              <ul>
                <li>You materially breach these Terms and fail to remedy the breach within 7 days of notice.</li>
                <li>You engage in fraudulent, illegal, or abusive conduct.</li>
                <li>Continued access poses a security risk to the Service or other users.</li>
              </ul>
              <p>
                Upon termination, your licence to use the Service ceases immediately.
                Provisions of these Terms that by their nature should survive termination
                will do so, including limitations of liability and intellectual property
                rights.
              </p>
            </section>

            <div className="policy-divider" />

            {/* 9 */}
            <section className="policy-section" id="liability">
              <span className="section-number">Section 09</span>
              <h2>Limitation of Liability</h2>
              <p>
                <strong>Disclaimer of warranties.</strong> The Service is provided
                &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either
                express or implied, including but not limited to implied warranties of
                merchantability, fitness for a particular purpose, or non-infringement.
              </p>
              <p>
                <strong>Limitation.</strong> To the maximum extent permitted by applicable
                law, in no event will Procurexio, its officers, directors, employees, or
                agents be liable for any indirect, incidental, special, consequential, or
                punitive damages, including loss of profits, data, or goodwill, arising
                out of or in connection with these Terms or your use of (or inability to
                use) the Service.
              </p>
              <p>
                <strong>Cap.</strong> Our total aggregate liability to you for any claims
                under these Terms will not exceed the greater of (a) the amount you paid
                to us in the 12 months preceding the claim, or (b) USD 100.
              </p>
              <div className="policy-callout">
                Some jurisdictions do not allow certain limitations of liability. In such
                jurisdictions, our liability is limited to the fullest extent permitted by
                applicable law.
              </div>
            </section>

            <div className="policy-divider" />

            {/* 10 */}
            <section className="policy-section" id="disputes">
              <span className="section-number">Section 10</span>
              <h2>Disputes &amp; Governing Law</h2>
              <p>
                These Terms are governed by and construed in accordance with the laws of
                the jurisdiction in which Procurexio Inc. is incorporated, without regard
                to its conflict of law provisions.
              </p>
              <p>
                <strong>Informal resolution.</strong> Before initiating any formal dispute,
                you agree to contact us at{' '}
                <a href="mailto:legal@procurexio.com">legal@procurexio.com</a> and give us
                30 days to resolve the issue informally.
              </p>
              <p>
                <strong>Arbitration.</strong> If informal resolution fails, disputes will
                be resolved by binding arbitration in accordance with the rules of a
                mutually agreed arbitration body, except that either party may seek
                injunctive relief in a court of competent jurisdiction.
              </p>
            </section>

            <div className="policy-divider" />

            {/* 11 */}
            <section className="policy-section" id="changes">
              <span className="section-number">Section 11</span>
              <h2>Changes to Terms</h2>
              <p>
                We may update these Terms from time to time. We will notify you of material
                changes by email or by displaying a prominent notice in the Service at least
                14 days before the changes take effect.
              </p>
              <p>
                Your continued use of the Service after the effective date of the updated
                Terms constitutes your acceptance of the changes. If you do not agree to
                the updated Terms, you must stop using the Service and cancel your account.
              </p>
            </section>

            <div className="policy-divider" />

            {/* 12 */}
            <section className="policy-section" id="contact">
              <span className="section-number">Section 12</span>
              <h2>Contact</h2>
              <p>
                If you have any questions about these Terms, please contact us:
              </p>
              <ul>
                <li><strong>Email:</strong> <a href="mailto:legal@procurexio.com">legal@procurexio.com</a></li>
                <li><strong>Support:</strong> <a href="mailto:support@procurexio.com">support@procurexio.com</a></li>
              </ul>
            </section>
          </article>
        </div>

        {/* Footer */}
        <footer className="policy-footer">
          <p>© {new Date().getFullYear()} Procurexio Inc. All rights reserved.</p>
          <div className="policy-footer-links">
            <Link href="/terms" className="active">Terms of Service</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/login">Sign in</Link>
          </div>
        </footer>
      </div>
    </>
  );
}

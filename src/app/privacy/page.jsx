// src/app/privacy/page.jsx
import Link from 'next/link';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://procurexio.com';

export const metadata = {
  title: 'Privacy Policy — Procurexio',
  description:
    'Learn how Procurexio collects, uses, and protects your data. Our Privacy Policy covers GDPR compliance, multi-tenant data segregation, and your rights.',
  alternates: {
    canonical: `${baseUrl}/privacy`,
  },
  openGraph: {
    title: 'Privacy Policy — Procurexio',
    description:
      'Learn how Procurexio collects, uses, and protects your data. Our Privacy Policy covers GDPR compliance, multi-tenant data segregation, and your rights.',
    url: `${baseUrl}/privacy`,
  },
};

export default function PrivacyPage() {
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
            <Link href="/terms">Terms of Service</Link>
            <Link href="/login" className="nav-cta">Sign in</Link>
          </div>
        </nav>

        {/* Hero */}
        <div className="policy-hero">
          <div className="policy-hero-badge">Legal</div>
          <h1>Privacy <span>Policy</span></h1>
          <p>
            We are committed to protecting your personal data. This policy explains what
            we collect, how we use it, and the rights you have over your information.
          </p>
        </div>

        {/* Main */}
        <div className="policy-main">
          {/* Sidebar TOC */}
          <aside className="policy-toc">
            <p className="toc-title">Contents</p>
            <ul className="toc-list">
              {[
                ['#overview',     '1. Overview'],
                ['#collection',   '2. Data We Collect'],
                ['#use',          '3. How We Use Data'],
                ['#sharing',      '4. Data Sharing'],
                ['#multitenant',  '5. Multi-Tenant Environment'],
                ['#retention',    '6. Data Retention'],
                ['#security',     '7. Security'],
                ['#cookies',      '8. Cookies'],
                ['#rights',       '9. Your Rights'],
                ['#transfers',    '10. International Transfers'],
                ['#children',     '11. Children\'s Privacy'],
                ['#changes',      '12. Policy Changes'],
                ['#contact',      '13. Contact & DPO'],
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
              <span className="policy-meta-item">GDPR compliant</span>
            </div>

            {/* 1 */}
            <section className="policy-section" id="overview">
              <span className="section-number">Section 01</span>
              <h2>Overview</h2>
              <p>
                Procurexio Inc. (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the Procurexio
                procurement SaaS platform (&quot;Service&quot;). This Privacy Policy explains how
                we collect, use, store, and share information about you when you use our
                Service, and the rights you have in relation to that information.
              </p>
              <p>
                We act as both a <strong>data controller</strong> (for account and usage
                data we collect directly) and a <strong>data processor</strong> (for
                Customer Data you upload to the platform on behalf of your organisation).
              </p>
              <div className="policy-callout">
                If you are a resident of the European Economic Area (EEA), United Kingdom,
                or other jurisdictions with equivalent data protection laws, you have
                additional rights described in Section 9.
              </div>
            </section>

            <div className="policy-divider" />

            {/* 2 */}
            <section className="policy-section" id="collection">
              <span className="section-number">Section 02</span>
              <h2>Data We Collect</h2>
              <p>We collect the following categories of personal data:</p>
              <p><strong>Account &amp; profile data:</strong></p>
              <ul>
                <li>Full name, work email address, and password (hashed)</li>
                <li>Company name, job title, and role within the platform</li>
                <li>Profile photo (if provided)</li>
              </ul>
              <p><strong>Usage &amp; activity data:</strong></p>
              <ul>
                <li>Log data: IP address, browser type, pages visited, timestamps</li>
                <li>Feature usage patterns and interaction events</li>
                <li>Audit logs of procurement actions (RFQs created, bids submitted, POs approved, etc.)</li>
              </ul>
              <p><strong>Communications data:</strong></p>
              <ul>
                <li>Messages sent through the platform (e.g., RFQ communications with vendors)</li>
                <li>Support tickets and correspondence with our team</li>
              </ul>
              <p><strong>Device &amp; technical data:</strong></p>
              <ul>
                <li>Device identifiers, operating system, and screen resolution</li>
                <li>Cookie data (see Section 8)</li>
              </ul>
              <p>
                We do not collect sensitive personal data (such as health information,
                racial or ethnic origin, or biometric data) through the Service.
              </p>
            </section>

            <div className="policy-divider" />

            {/* 3 */}
            <section className="policy-section" id="use">
              <span className="section-number">Section 03</span>
              <h2>How We Use Data</h2>
              <p>We use personal data for the following purposes:</p>
              <ul>
                <li><strong>Service delivery:</strong> To create and manage your account, authenticate you, and provide platform features.</li>
                <li><strong>Communication:</strong> To send transaction emails (account creation, password reset, invitations) and service announcements.</li>
                <li><strong>Support:</strong> To respond to support requests and resolve technical issues.</li>
                <li><strong>Security:</strong> To detect, prevent, and respond to fraud, abuse, and security incidents.</li>
                <li><strong>Compliance:</strong> To meet our legal obligations and enforce our Terms of Service.</li>
                <li><strong>Product improvement:</strong> To analyse usage patterns (in aggregated, anonymised form where possible) to improve the Service.</li>
              </ul>
              <p>
                We rely on the following legal bases under GDPR for processing:
              </p>
              <ul>
                <li><strong>Contract performance</strong> — processing necessary to deliver the Service you subscribed to.</li>
                <li><strong>Legitimate interests</strong> — security monitoring, fraud prevention, and product analytics.</li>
                <li><strong>Legal obligation</strong> — compliance with applicable laws.</li>
                <li><strong>Consent</strong> — for optional marketing communications (you may withdraw at any time).</li>
              </ul>
            </section>

            <div className="policy-divider" />

            {/* 4 */}
            <section className="policy-section" id="sharing">
              <span className="section-number">Section 04</span>
              <h2>Data Sharing</h2>
              <p>
                We do not sell your personal data. We may share it in the following
                limited circumstances:
              </p>
              <ul>
                <li>
                  <strong>Service providers:</strong> We use vetted third-party processors
                  (cloud hosting, email delivery, analytics) who process data only on our
                  instructions and under contractual data protection obligations.
                </li>
                <li>
                  <strong>Within your organisation:</strong> Data you submit is visible to
                  other authorised users within your company&apos;s workspace as determined by
                  your Admin.
                </li>
                <li>
                  <strong>Vendors (by your choice):</strong> When you invite a vendor to
                  respond to an RFQ, limited contact information is shared with that vendor
                  to enable the procurement workflow.
                </li>
                <li>
                  <strong>Legal requirements:</strong> We may disclose data if required by
                  law, court order, or to protect the rights, property, or safety of
                  Procurexio, our users, or the public.
                </li>
                <li>
                  <strong>Business transfers:</strong> In the event of a merger, acquisition,
                  or sale of assets, personal data may be transferred as part of that
                  transaction. We will notify you before your data is subject to a different
                  privacy policy.
                </li>
              </ul>
            </section>

            <div className="policy-divider" />

            {/* 5 */}
            <section className="policy-section" id="multitenant">
              <span className="section-number">Section 05</span>
              <h2>Multi-Tenant Environment</h2>
              <p>
                Procurexio is a multi-tenant SaaS platform where multiple organisations
                (&quot;Tenants&quot;) share the same underlying infrastructure while maintaining
                strict data isolation.
              </p>
              <p>
                <strong>Isolation measures include:</strong>
              </p>
              <ul>
                <li>All database queries are scoped to the authenticated tenant&apos;s company ID.</li>
                <li>API responses never include data belonging to a different tenant.</li>
                <li>Audit logs are tenant-scoped and accessible only to that tenant&apos;s Admins.</li>
                <li>Role-based access control (RBAC) enforces data visibility within each workspace.</li>
              </ul>
              <p>
                While we implement strict technical controls, the Company Admin is
                responsible for managing which users have access to data within their
                organisation&apos;s workspace.
              </p>
            </section>

            <div className="policy-divider" />

            {/* 6 */}
            <section className="policy-section" id="retention">
              <span className="section-number">Section 06</span>
              <h2>Data Retention</h2>
              <p>We retain personal data for as long as necessary to:</p>
              <ul>
                <li>Maintain your account and provide the Service.</li>
                <li>Comply with legal, regulatory, and contractual obligations.</li>
                <li>Resolve disputes and enforce our agreements.</li>
              </ul>
              <p>Specific retention periods:</p>
              <ul>
                <li><strong>Account data:</strong> Retained while your account is active, plus 30 days after account deletion to allow for data retrieval.</li>
                <li><strong>Audit logs:</strong> Retained for 2 years to support compliance and security investigations.</li>
                <li><strong>Billing records:</strong> Retained for 7 years as required by tax regulations.</li>
                <li><strong>Support communications:</strong> Retained for 3 years.</li>
              </ul>
              <p>
                After the applicable retention period, data is securely deleted or
                anonymised.
              </p>
            </section>

            <div className="policy-divider" />

            {/* 7 */}
            <section className="policy-section" id="security">
              <span className="section-number">Section 07</span>
              <h2>Security</h2>
              <p>
                We implement industry-standard technical and organisational measures to
                protect your personal data from unauthorised access, loss, or disclosure,
                including:
              </p>
              <ul>
                <li>Encryption in transit (TLS 1.2+) and at rest for sensitive data.</li>
                <li>Password hashing using bcrypt with an appropriate cost factor.</li>
                <li>Role-based access controls for our internal team.</li>
                <li>Regular security reviews and vulnerability assessments.</li>
                <li>Audit logging of privileged access and administrative actions.</li>
              </ul>
              <p>
                No security measure is perfect. If you believe your account has been
                compromised, please contact us immediately at{' '}
                <a href="mailto:security@procurexio.com">security@procurexio.com</a>.
              </p>
            </section>

            <div className="policy-divider" />

            {/* 8 */}
            <section className="policy-section" id="cookies">
              <span className="section-number">Section 08</span>
              <h2>Cookies</h2>
              <p>
                We use cookies and similar technologies to operate and improve the
                Service. The cookies we use fall into the following categories:
              </p>
              <ul>
                <li>
                  <strong>Strictly necessary:</strong> Session cookies required for
                  authentication and security. These cannot be disabled.
                </li>
                <li>
                  <strong>Functional:</strong> Cookies that remember your preferences
                  (e.g., language, timezone) to personalise your experience.
                </li>
                <li>
                  <strong>Analytics:</strong> Aggregated, anonymised data about how users
                  interact with the Service, used to improve product features.
                </li>
              </ul>
              <p>
                You can manage cookie preferences through your browser settings. Disabling
                non-essential cookies will not affect core Service functionality.
              </p>
            </section>

            <div className="policy-divider" />

            {/* 9 */}
            <section className="policy-section" id="rights">
              <span className="section-number">Section 09</span>
              <h2>Your Rights</h2>
              <p>
                Depending on your location, you may have the following rights regarding
                your personal data:
              </p>
              <ul>
                <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
                <li><strong>Rectification:</strong> Request correction of inaccurate or incomplete data.</li>
                <li><strong>Erasure:</strong> Request deletion of your personal data (&quot;right to be forgotten&quot;), subject to legal retention requirements.</li>
                <li><strong>Restriction:</strong> Request that we restrict processing of your data in certain circumstances.</li>
                <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format.</li>
                <li><strong>Objection:</strong> Object to processing based on legitimate interests or for direct marketing.</li>
                <li><strong>Withdraw consent:</strong> Where processing is based on consent, withdraw it at any time without affecting prior processing.</li>
              </ul>
              <div className="policy-callout">
                To exercise any of these rights, email us at{' '}
                <a href="mailto:privacy@procurexio.com">privacy@procurexio.com</a>.
                We will respond within 30 days. You also have the right to lodge a
                complaint with your local data protection authority.
              </div>
            </section>

            <div className="policy-divider" />

            {/* 10 */}
            <section className="policy-section" id="transfers">
              <span className="section-number">Section 10</span>
              <h2>International Transfers</h2>
              <p>
                Your data may be transferred to and processed in countries outside your
                country of residence, including countries that may not provide the same
                level of data protection as your home country.
              </p>
              <p>
                When we transfer personal data from the EEA, UK, or Switzerland to a
                third country, we ensure appropriate safeguards are in place, such as
                Standard Contractual Clauses (SCCs) approved by the European Commission,
                or transfers to countries with an adequacy decision.
              </p>
            </section>

            <div className="policy-divider" />

            {/* 11 */}
            <section className="policy-section" id="children">
              <span className="section-number">Section 11</span>
              <h2>Children&apos;s Privacy</h2>
              <p>
                The Service is intended for business use by adults. We do not knowingly
                collect personal data from individuals under the age of 16 (or the
                applicable minimum age in your jurisdiction). If you believe a minor has
                provided us with personal data, please contact us and we will promptly
                delete it.
              </p>
            </section>

            <div className="policy-divider" />

            {/* 12 */}
            <section className="policy-section" id="changes">
              <span className="section-number">Section 12</span>
              <h2>Policy Changes</h2>
              <p>
                We may update this Privacy Policy periodically. We will notify you of
                material changes by email or by displaying a prominent notice in the
                Service. The updated policy will include the revised &quot;last updated&quot; date
                at the top.
              </p>
              <p>
                Continued use of the Service after the effective date of the updated
                policy constitutes acceptance. If you disagree with the changes, you must
                stop using the Service and delete your account.
              </p>
            </section>

            <div className="policy-divider" />

            {/* 13 */}
            <section className="policy-section" id="contact">
              <span className="section-number">Section 13</span>
              <h2>Contact &amp; DPO</h2>
              <p>
                For any privacy-related queries, data subject requests, or concerns:
              </p>
              <ul>
                <li><strong>Privacy email:</strong> <a href="mailto:privacy@procurexio.com">privacy@procurexio.com</a></li>
                <li><strong>Security issues:</strong> <a href="mailto:security@procurexio.com">security@procurexio.com</a></li>
                <li><strong>General support:</strong> <a href="mailto:support@procurexio.com">support@procurexio.com</a></li>
              </ul>
              <p>
                If you are located in the EEA or UK and have concerns about our data
                processing that we have not satisfactorily resolved, you have the right to
                contact your local supervisory authority.
              </p>
            </section>
          </article>
        </div>

        {/* Footer */}
        <footer className="policy-footer">
          <p>© {new Date().getFullYear()} Procurexio Inc. All rights reserved.</p>
          <div className="policy-footer-links">
            <Link href="/terms">Terms of Service</Link>
            <Link href="/privacy" className="active">Privacy Policy</Link>
            <Link href="/login">Sign in</Link>
          </div>
        </footer>
      </div>
    </>
  );
}

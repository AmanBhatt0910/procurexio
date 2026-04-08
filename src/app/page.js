import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';

import Navbar from '@/components/marketing/Navbar';
import Hero from '@/components/marketing/Hero';
import SocialProof from '@/components/marketing/SocialProof';
import Features from '@/components/marketing/Features';
import HowItWorks from '@/components/marketing/HowItWorks';
import ProductPreview from '@/components/marketing/ProductPreview';
import Pricing from '@/components/marketing/Pricing';
import CTASection from '@/components/marketing/CTASection';
import Footer from '@/components/marketing/Footer';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://procurexio.com';

export const metadata = {
  title: 'Procurexio — Procurement Intelligence Platform',
  description:
    'RFQs, vendor bids, and contract awards — all in one platform. Move faster, negotiate smarter, and close deals with confidence.',
  alternates: {
    canonical: `${baseUrl}/`,
  },
  openGraph: {
    title: 'Procurexio — Procurement Intelligence Platform',
    description:
      'RFQs, vendor bids, and contract awards — all in one platform. Move faster, negotiate smarter, and close deals with confidence.',
    url: `${baseUrl}/`,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Procurexio — Procurement Intelligence Platform',
      },
    ],
  },
  twitter: {
    title: 'Procurexio — Procurement Intelligence Platform',
    description:
      'RFQs, vendor bids, and contract awards — all in one platform. Move faster, negotiate smarter, and close deals with confidence.',
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Procurexio',
  url: baseUrl,
  logo: `${baseUrl}/logo.png`,
  description:
    'Multi-tenant SaaS platform for intelligent procurement management',
  sameAs: [
    'https://twitter.com/procurexio',
    'https://linkedin.com/company/procurexio',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Service',
    email: 'support@procurexio.com',
  },
};

const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Procurexio',
  description: 'Intelligent multi-tenant procurement platform',
  url: baseUrl,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'INR',
  },
};

export default async function Home() {
  // If user has a valid auth token, redirect to dashboard
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(token, secret);
      redirect('/dashboard');
    } catch {
      // Invalid or expired token — show landing page
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        :root {
          --ink:       #0f0e0d;
          --ink-soft:  #6b6660;
          --ink-faint: #b8b3ae;
          --surface:   #faf9f7;
          --white:     #ffffff;
          --accent:    #c8501a;
          --accent-h:  #a83e12;
          --border:    #e4e0db;
          --radius:    10px;
          --shadow:    0 1px 3px rgba(15,14,13,.06), 0 8px 32px rgba(15,14,13,.08);
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          font-family: 'DM Sans', sans-serif;
          background: var(--surface);
          color: var(--ink);
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* ── Page-level layout ─────────────────────── */
        .page-root {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        main { flex: 1; }

        /* Utility resets that might conflict with layout.js globals */
        a { color: inherit; }
        button { font-family: inherit; cursor: pointer; }
        ul, ol { list-style: none; }

        /* Fade-in animation for sections */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover { background: var(--ink-faint); }
      `}</style>

      <div className="page-root">
        <Navbar />

        <main>
          <Hero />
          <SocialProof />
          <Features />
          <HowItWorks />
          <ProductPreview />
          <Pricing />
          <CTASection />
        </main>

        <Footer />
      </div>
    </>
  );
}
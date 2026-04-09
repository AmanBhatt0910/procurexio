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
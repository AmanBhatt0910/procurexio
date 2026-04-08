// src/app/layout.js

import "./globals.css";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://procurexio.com';

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Procurexio — Intelligent Procurement Platform',
    template: '%s | Procurexio',
  },
  description:
    'Procurexio is a multi-tenant SaaS platform for intelligent procurement management. Streamline RFQs, vendor bids, evaluations, and contract awards in one place.',
  keywords: [
    'procurement software',
    'RFQ management',
    'vendor management',
    'contract management',
    'SaaS procurement',
    'procurement platform',
    'bid management',
  ],
  authors: [{ name: 'Procurexio' }],
  creator: 'Procurexio',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'Procurexio',
    title: 'Procurexio — Intelligent Procurement Platform',
    description:
      'Streamline RFQs, vendor bids, evaluations, and contract awards. The procurement intelligence platform for modern sourcing teams.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Procurexio — Intelligent Procurement Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Procurexio — Intelligent Procurement Platform',
    description:
      'Streamline RFQs, vendor bids, evaluations, and contract awards. The procurement intelligence platform for modern sourcing teams.',
    images: ['/og-image.png'],
    creator: '@procurexio',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: baseUrl,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body>{children}</body>
    </html>
  );
}

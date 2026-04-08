// src/app/(auth)/login/layout.js

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://procurexio.com';

export const metadata = {
  title: 'Sign In to Procurexio | Procurement Platform',
  description:
    'Sign in to your Procurexio account to manage RFQs, vendor bids, and procurement workflows. Secure login with email or Google.',
  alternates: {
    canonical: `${baseUrl}/login`,
  },
  openGraph: {
    title: 'Sign In to Procurexio | Procurement Platform',
    description:
      'Sign in to your Procurexio account to manage RFQs, vendor bids, and procurement workflows.',
    url: `${baseUrl}/login`,
  },
};

export default function LoginLayout({ children }) {
  return children;
}

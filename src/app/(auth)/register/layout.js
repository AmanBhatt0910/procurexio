// src/app/(auth)/register/layout.js

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://procurexio.com';

export const metadata = {
  title: 'Create Your Procurexio Account | Free Signup',
  description:
    'Get started with Procurexio for free. Create your account to streamline procurement, manage vendors, and automate RFQ workflows for your team.',
  alternates: {
    canonical: `${baseUrl}/register`,
  },
  openGraph: {
    title: 'Create Your Procurexio Account | Free Signup',
    description:
      'Get started with Procurexio for free. Streamline procurement, manage vendors, and automate RFQ workflows for your team.',
    url: `${baseUrl}/register`,
  },
};

export default function RegisterLayout({ children }) {
  return children;
}

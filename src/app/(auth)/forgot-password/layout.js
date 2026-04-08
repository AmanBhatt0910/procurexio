// src/app/(auth)/forgot-password/layout.js

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://procurexio.com';

export const metadata = {
  title: 'Reset Your Procurexio Password',
  description:
    'Forgot your Procurexio password? Enter your email address and we will send you a secure link to reset your password.',
  alternates: {
    canonical: `${baseUrl}/forgot-password`,
  },
  openGraph: {
    title: 'Reset Your Procurexio Password',
    description:
      'Forgot your Procurexio password? Enter your email to receive a secure password reset link.',
    url: `${baseUrl}/forgot-password`,
  },
};

export default function ForgotPasswordLayout({ children }) {
  return children;
}

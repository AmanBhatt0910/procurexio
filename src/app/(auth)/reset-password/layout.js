// src/app/(auth)/reset-password/layout.js

export const metadata = {
  title: 'Create New Password | Procurexio',
  description:
    'Set a new secure password for your Procurexio account. This link is valid for a limited time.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResetPasswordLayout({ children }) {
  return children;
}

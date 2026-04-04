// src/app/layout.js

import "./globals.css";

export const metadata = {
  title: "Procurexio",
  description: "A multi-tenant SaaS procurement platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body>{children}</body>
    </html>
  );
}

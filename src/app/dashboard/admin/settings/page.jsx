'use client';

import DashboardLayout from '@/components/Layout/DashboardLayout';
import RoleGuard from '@/components/auth/RoleGuard';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function RedirectToDashboard() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard'); }, [router]);
  return null;
}

const SETTINGS_SECTIONS = [
  {
    title: 'Platform Information',
    icon: '🏢',
    fields: [
      { label: 'Platform Name', value: 'Procurexio', note: 'Shown in emails and UI' },
      { label: 'Support Email', value: 'support@procurexio.com', note: 'Used for outbound notifications' },
      { label: 'Default Timezone', value: 'UTC+5:30 (India Standard Time)', note: 'Used for timestamps' },
      { label: 'Default Currency', value: 'INR (₹)', note: 'Used for bid amounts' },
    ],
  },
  {
    title: 'Subscription Plans',
    icon: '💎',
    fields: [
      { label: 'Free Plan', value: 'Up to 5 users, 10 RFQs/month', note: 'Default for new companies' },
      { label: 'Pro Plan', value: 'Up to 50 users, unlimited RFQs', note: 'Paid tier' },
      { label: 'Enterprise Plan', value: 'Unlimited users and RFQs', note: 'Custom pricing' },
    ],
  },
  {
    title: 'Security & Access',
    icon: '🔐',
    fields: [
      { label: 'Session Timeout', value: '24 hours', note: 'JWT token expiry' },
      { label: 'Password Policy', value: 'Min 8 characters', note: 'Applied at registration' },
      { label: 'Multi-factor Auth', value: 'Not enabled', note: 'Coming soon' },
    ],
  },
  {
    title: 'Email Configuration',
    icon: '📧',
    fields: [
      { label: 'Email Provider', value: 'SMTP', note: 'Configure via environment variables' },
      { label: 'Notifications', value: 'Enabled', note: 'RFQ, bid, and invite emails' },
      { label: 'Digest Frequency', value: 'Real-time', note: 'Sent immediately on action' },
    ],
  },
];

export default function AdminSettingsPage() {
  return (
    <DashboardLayout pageTitle="Platform Settings">
      <RoleGuard roles={['super_admin']} fallback={<RedirectToDashboard />}>
        <style>{`
          .page-header { margin-bottom: 28px; }
          .page-title {
            font-family: 'Syne', sans-serif; font-weight: 700;
            font-size: 1.4rem; color: var(--ink);
            letter-spacing: -.03em; margin-bottom: 4px;
          }
          .page-sub { font-size: .855rem; color: var(--ink-soft); }

          .info-note {
            background: #f0f5ff; border: 1px solid #c3d5f8;
            border-radius: var(--radius); padding: 12px 18px;
            color: #2d5bb8; font-size: .85rem; margin-bottom: 28px;
            display: flex; align-items: center; gap: 8px;
          }

          .settings-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
            gap: 20px;
          }
          .settings-section {
            background: var(--white); border: 1px solid var(--border);
            border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow);
          }
          .section-header {
            display: flex; align-items: center; gap: 10px;
            padding: 14px 18px; border-bottom: 1px solid var(--border);
            background: var(--surface);
          }
          .section-icon { font-size: 1.1rem; }
          .section-title {
            font-family: 'Syne', sans-serif; font-weight: 600;
            font-size: .92rem; color: var(--ink); letter-spacing: -.01em;
          }
          .field-row {
            display: flex; flex-direction: column; gap: 2px;
            padding: 12px 18px; border-bottom: 1px solid var(--border);
          }
          .field-row:last-child { border-bottom: none; }
          .field-label {
            font-size: .72rem; font-weight: 600; letter-spacing: .07em;
            text-transform: uppercase; color: var(--ink-faint);
          }
          .field-value {
            font-size: .88rem; font-weight: 500; color: var(--ink);
          }
          .field-note {
            font-size: .77rem; color: var(--ink-faint); margin-top: 1px;
          }
        `}</style>

        <div className="page-header">
            <div className="page-title">Platform Settings</div>
            <div className="page-sub">Global configuration for the Procurexio platform</div>
          </div>

          <div className="info-note">
            ⚙️ These settings reflect the current platform configuration. To change values, update the server environment variables or contact your infrastructure team.
          </div>

          <div className="settings-grid">
            {SETTINGS_SECTIONS.map(section => (
              <div className="settings-section" key={section.title}>
                <div className="section-header">
                  <span className="section-icon">{section.icon}</span>
                  <span className="section-title">{section.title}</span>
                </div>
                {section.fields.map(field => (
                  <div className="field-row" key={field.label}>
                    <div className="field-label">{field.label}</div>
                    <div className="field-value">{field.value}</div>
                    {field.note && <div className="field-note">{field.note}</div>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </RoleGuard>
    </DashboardLayout>
  );
}

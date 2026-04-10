'use client';
// src/app/dashboard/settings/page.jsx
// Main settings page — role-aware, multi-section, responsive

import { useState } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import {
  SettingsLayout,
  getVisibleSections,
  PersonalInfo,
  CompanyCompliance,
  UserAccessManagement,
  NotificationPreferences,
  SecuritySettings,
  IntegrationsSettings,
  BillingPlans,
  PreferencesSettings,
} from '@/components/settings';

function SectionContent({ section, userRole }) {
  switch (section) {
    case 'personal':      return <PersonalInfo />;
    case 'company':       return <CompanyCompliance />;
    case 'userAccess':    return <UserAccessManagement userRole={userRole} />;
    case 'notifications': return <NotificationPreferences />;
    case 'security':      return <SecuritySettings />;
    case 'integrations':  return <IntegrationsSettings />;
    case 'billing':       return <BillingPlans />;
    case 'preferences':   return <PreferencesSettings />;
    default:              return null;
  }
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const userRole = user?.role;

  // Default to 'personal' — but wait until we know the role so we can
  // potentially skip to the first visible section if needed.
  const [activeSection, setActiveSection] = useState('personal');

  if (authLoading) {
    return (
      <DashboardLayout pageTitle="Settings">
        <div style={{ padding: 40, color: 'var(--ink-faint)', fontFamily: "'DM Sans', sans-serif", fontSize: '.875rem' }}>
          Loading…
        </div>
      </DashboardLayout>
    );
  }

  const visible = getVisibleSections(userRole);

  // If the current section is not visible for this role, snap to the first visible
  const effectiveSection = visible.find(s => s.key === activeSection)
    ? activeSection
    : visible[0]?.key;

  return (
    <DashboardLayout pageTitle="Settings">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .settings-page-header {
          margin-bottom: 24px;
        }
        .settings-page-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1.4rem;
          color: var(--ink);
          letter-spacing: -.03em;
          margin-bottom: 4px;
        }
        .settings-page-sub {
          font-size: .855rem;
          color: var(--ink-soft);
        }
      `}</style>

      <div className="settings-page-header">
        <div className="settings-page-title">Settings</div>
        <div className="settings-page-sub">Manage your account, company, notifications, and more.</div>
      </div>

      <SettingsLayout
        activeSection={effectiveSection}
        onSectionChange={setActiveSection}
        role={userRole}
      >
        <SectionContent section={effectiveSection} userRole={userRole} />
      </SettingsLayout>
    </DashboardLayout>
  );
}

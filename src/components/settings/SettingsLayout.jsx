'use client';
// src/components/settings/SettingsLayout.jsx
// Main settings page layout with side-navigation tabs and role-aware section filtering

import { ROLES } from '@/lib/rbac';

// Map each section key → which roles can see it
const SECTION_ACCESS = {
  personal:    ['super_admin', 'company_admin', 'manager', 'employee', 'vendor_user'],
  company:     ['company_admin'],
  userAccess:  ['super_admin', 'company_admin', 'manager'],
  notifications: ['super_admin', 'company_admin', 'manager', 'employee', 'vendor_user'],
  security:    ['super_admin', 'company_admin', 'manager', 'employee', 'vendor_user'],
  integrations: ['super_admin', 'company_admin'],
  billing:     ['super_admin', 'company_admin'],
  preferences: ['super_admin', 'company_admin', 'manager', 'employee', 'vendor_user'],
};

const ALL_SECTIONS = [
  { key: 'personal',      label: 'Personal Info',       icon: '👤' },
  { key: 'company',       label: 'Company & Compliance', icon: '🏢' },
  { key: 'userAccess',    label: 'User & Access',        icon: '👥' },
  { key: 'notifications', label: 'Notifications',        icon: '🔔' },
  { key: 'security',      label: 'Security',             icon: '🔐' },
  { key: 'integrations',  label: 'Integrations',         icon: '🔗' },
  { key: 'billing',       label: 'Billing & Plans',      icon: '💳' },
  { key: 'preferences',   label: 'Preferences',          icon: '⚙️' },
];

export function getVisibleSections(role) {
  if (!role) return [];
  return ALL_SECTIONS.filter(s => (SECTION_ACCESS[s.key] || []).includes(role));
}

export default function SettingsLayout({ activeSection, onSectionChange, role, children }) {
  const visible = getVisibleSections(role);

  return (
    <>
      <style>{`
        .settings-shell {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 24px;
          min-height: 0;
        }
        @media (max-width: 768px) {
          .settings-shell { grid-template-columns: 1fr; }
        }
        .settings-sidenav {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 8px 0;
          height: fit-content;
          position: sticky;
          top: 80px;
          box-shadow: var(--shadow);
        }
        @media (max-width: 768px) {
          .settings-sidenav {
            position: static;
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            padding: 10px;
          }
        }
        .sidenav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: .855rem;
          font-weight: 400;
          color: var(--ink-soft);
          transition: background .12s, color .12s;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          border-left: 3px solid transparent;
        }
        @media (max-width: 768px) {
          .sidenav-item {
            width: auto;
            padding: 7px 12px;
            border-left: none;
            border-radius: 6px;
          }
        }
        .sidenav-item:hover:not(.sidenav-item--active) {
          background: var(--surface);
          color: var(--ink);
        }
        .sidenav-item--active {
          color: var(--ink);
          font-weight: 500;
          background: #fdf3ef;
          border-left-color: var(--accent);
        }
        @media (max-width: 768px) {
          .sidenav-item--active {
            background: var(--accent);
            color: #fff;
            border-left-color: transparent;
          }
        }
        .sidenav-icon { font-size: .95rem; flex-shrink: 0; }
        .settings-content {
          min-width: 0;
        }
      `}</style>

      <div className="settings-shell">
        {/* Side navigation */}
        <div className="settings-sidenav">
          {visible.map(s => (
            <button
              key={s.key}
              className={`sidenav-item${activeSection === s.key ? ' sidenav-item--active' : ''}`}
              onClick={() => onSectionChange(s.key)}
            >
              <span className="sidenav-icon">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Active section content */}
        <div className="settings-content">
          {children}
        </div>
      </div>
    </>
  );
}

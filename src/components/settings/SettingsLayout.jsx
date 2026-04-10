'use client';
// src/components/settings/SettingsLayout.jsx
// Modern settings layout — grouped sidebar nav with SVG icons, role badge, mobile tabs

// ── Access control ────────────────────────────────────────────────────────────
const SECTION_ACCESS = {
  personal:      ['super_admin', 'company_admin', 'manager', 'employee', 'vendor_user'],
  company:       ['company_admin'],
  userAccess:    ['super_admin', 'company_admin', 'manager'],
  notifications: ['super_admin', 'company_admin', 'manager', 'employee', 'vendor_user'],
  security:      ['super_admin', 'company_admin', 'manager', 'employee', 'vendor_user'],
  integrations:  ['super_admin', 'company_admin'],
  billing:       ['super_admin', 'company_admin'],
  preferences:   ['super_admin', 'company_admin', 'manager', 'employee', 'vendor_user'],
};

// Ordered sections with group membership
const ALL_SECTIONS = [
  { key: 'personal',      label: 'Personal Info',    group: 'account' },
  { key: 'notifications', label: 'Notifications',     group: 'account' },
  { key: 'security',      label: 'Security',          group: 'account' },
  { key: 'preferences',   label: 'Preferences',       group: 'account' },
  { key: 'company',       label: 'Company Profile',   group: 'org' },
  { key: 'userAccess',    label: 'User & Access',     group: 'org' },
  { key: 'integrations',  label: 'Integrations',      group: 'admin' },
  { key: 'billing',       label: 'Billing & Plans',   group: 'admin' },
];

const GROUP_LABEL = { account: 'My Account', org: 'Organization', admin: 'Administration' };

const ROLE_META = {
  super_admin:   { label: 'Super Admin',   color: '#1d4ed8', bg: '#dbeafe' },
  company_admin: { label: 'Company Admin', color: '#c8501a', bg: '#fef3c7' },
  manager:       { label: 'Manager',       color: '#065f46', bg: '#d1fae5' },
  employee:      { label: 'Employee',      color: '#374151', bg: '#f3f4f6' },
  vendor_user:   { label: 'Vendor',        color: '#6d28d9', bg: '#ede9fe' },
};

export function getVisibleSections(role) {
  if (!role) return [];
  return ALL_SECTIONS.filter(s => (SECTION_ACCESS[s.key] || []).includes(role));
}

// ── SVG Icon components ───────────────────────────────────────────────────────
function IcoUser() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  );
}
function IcoBell() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
    </svg>
  );
}
function IcoShield() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}
function IcoSliders() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/>
      <line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/>
      <line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/>
      <line x1="1" x2="7" y1="14" y2="14"/><line x1="9" x2="15" y1="8" y2="8"/>
      <line x1="17" x2="23" y1="16" y2="16"/>
    </svg>
  );
}
function IcoBuilding() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="20" x="4" y="2" rx="2"/>
      <path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>
    </svg>
  );
}
function IcoUsers() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function IcoLink() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  );
}
function IcoCreditCard() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
    </svg>
  );
}

const SECTION_ICON = {
  personal:      <IcoUser />,
  notifications: <IcoBell />,
  security:      <IcoShield />,
  preferences:   <IcoSliders />,
  company:       <IcoBuilding />,
  userAccess:    <IcoUsers />,
  integrations:  <IcoLink />,
  billing:       <IcoCreditCard />,
};

// ── Layout component ──────────────────────────────────────────────────────────
export default function SettingsLayout({ activeSection, onSectionChange, role, children }) {
  const visible = getVisibleSections(role);
  const roleMeta = ROLE_META[role] || { label: role || 'Unknown', color: '#374151', bg: '#f3f4f6' };

  // Build grouped structure
  const groups = {};
  visible.forEach(s => {
    if (!groups[s.group]) groups[s.group] = [];
    groups[s.group].push(s);
  });
  const groupOrder = ['account', 'org', 'admin'].filter(g => groups[g]);

  return (
    <>
      <style>{`
        /* ── Shell ── */
        .st-shell {
          display: grid;
          grid-template-columns: 232px 1fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 800px) {
          .st-shell { grid-template-columns: 1fr; gap: 16px; }
        }

        /* ── Sidebar ── */
        .st-nav {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          position: sticky;
          top: 76px;
          box-shadow: 0 1px 4px rgba(15,14,13,.05);
        }
        @media (max-width: 800px) {
          .st-nav { position: static; border-radius: 10px; }
        }

        /* Role badge header */
        .st-nav-header {
          padding: 14px 14px 12px;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
        }
        .st-role-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 4px 10px 4px 7px;
          border-radius: 99px;
          font-size: .68rem;
          font-weight: 700;
          letter-spacing: .05em;
          text-transform: uppercase;
        }
        .st-role-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: currentColor;
          flex-shrink: 0;
        }

        /* Nav group */
        .st-nav-group { padding: 6px 7px 4px; }
        .st-nav-group + .st-nav-group { border-top: 1px solid var(--border); }
        .st-group-label {
          padding: 5px 8px 3px;
          font-size: .63rem;
          font-weight: 700;
          letter-spacing: .09em;
          text-transform: uppercase;
          color: var(--ink-faint);
        }

        /* Nav items */
        .st-nav-item {
          display: flex;
          align-items: center;
          gap: 9px;
          width: 100%;
          padding: 8px 10px;
          border: none;
          background: none;
          border-radius: 7px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: .845rem;
          font-weight: 400;
          color: var(--ink-soft);
          text-align: left;
          transition: background .1s, color .1s;
          margin-bottom: 1px;
          position: relative;
        }
        .st-nav-item:hover:not(.st-nav-item--on) {
          background: var(--surface);
          color: var(--ink);
        }
        .st-nav-item--on {
          background: #fdf3ef;
          color: var(--accent);
          font-weight: 500;
        }
        .st-nav-item--on::before {
          content: '';
          position: absolute;
          left: 0; top: 4px; bottom: 4px;
          width: 3px;
          background: var(--accent);
          border-radius: 0 3px 3px 0;
        }
        .st-nav-ico {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          opacity: .65;
        }
        .st-nav-item--on .st-nav-ico { opacity: 1; }

        /* Mobile: horizontal tabs */
        @media (max-width: 800px) {
          .st-nav-header { display: none; }
          .st-nav {
            display: flex;
            flex-direction: row;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            padding: 6px 8px;
            gap: 0;
            border-radius: 10px;
          }
          .st-nav::-webkit-scrollbar { display: none; }
          .st-nav-group {
            display: contents;
          }
          .st-nav-group + .st-nav-group { border: none; }
          .st-group-label { display: none; }
          .st-nav-item {
            flex-shrink: 0;
            white-space: nowrap;
            padding: 7px 12px;
            font-size: .8rem;
            border-radius: 7px;
            margin-bottom: 0;
            gap: 6px;
          }
          .st-nav-item--on::before { display: none; }
          .st-nav-item--on {
            background: var(--accent);
            color: #fff;
          }
          .st-nav-item--on .st-nav-ico { opacity: 1; }
        }

        /* Content pane */
        .st-content { min-width: 0; }
      `}</style>

      <div className="st-shell">
        {/* ── Sidebar nav ── */}
        <nav className="st-nav" aria-label="Settings navigation">
          <div className="st-nav-header">
            <span
              className="st-role-pill"
              style={{ color: roleMeta.color, background: roleMeta.bg }}
            >
              <span className="st-role-dot" />
              {roleMeta.label}
            </span>
          </div>

          {groupOrder.map(gKey => (
            <div key={gKey} className="st-nav-group">
              <div className="st-group-label">{GROUP_LABEL[gKey]}</div>
              {groups[gKey].map(s => (
                <button
                  key={s.key}
                  className={`st-nav-item${activeSection === s.key ? ' st-nav-item--on' : ''}`}
                  onClick={() => onSectionChange(s.key)}
                  aria-current={activeSection === s.key ? 'page' : undefined}
                >
                  <span className="st-nav-ico">{SECTION_ICON[s.key]}</span>
                  {s.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* ── Section content ── */}
        <div className="st-content">
          {children}
        </div>
      </div>
    </>
  );
}

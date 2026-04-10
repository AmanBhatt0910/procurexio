'use client';
// src/components/Layout/Sidebar.jsx

import { memo, useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNotifications } from '@/context/NotificationContext';

// ------------------------------------------------------------------
// Super Admin navigation (platform-level only)
// ------------------------------------------------------------------
const SUPER_ADMIN_NAV = [
  {
    label: 'Dashboard',
    href: '/dashboard/admin',
    exact: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    section: 'Platform',
    items: [
      {
        label: 'Companies',
        href: '/dashboard/admin/companies',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="4" width="14" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 4V2.5A1.5 1.5 0 0 1 6.5 1h3A1.5 1.5 0 0 1 11 2.5V4" stroke="currentColor" strokeWidth="1.5" />
            <path d="M1 8h14" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
      },
      {
        label: 'Users (Global)',
        href: '/dashboard/admin/users',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="5.5" cy="5" r="2.25" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="11" cy="5" r="2.25" stroke="currentColor" strokeWidth="1.5" />
            <path d="M1 13.5c.7-2.2 2.5-3.5 4.5-3.5s3.8 1.3 4.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M11.5 10.5c1.5.4 2.7 1.6 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        label: 'Vendors Overview',
        href: '/dashboard/admin',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4" />
            <path d="M5 3V2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.4" />
            <path d="M1 7h14" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="5.5" cy="10" r="1" fill="currentColor" />
          </svg>
        ),
      },
      {
        label: 'RFQs Analytics',
        href: '/dashboard/rfqs',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="1.5" width="10" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 5h4M5 8h4M5 11h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12.5" cy="12.5" r="2.5" fill="currentColor" opacity=".15" stroke="currentColor" strokeWidth="1.2" />
            <path d="M12.5 11.5v1l.7.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
  {
    section: 'Settings',
    items: [
      {
        label: 'Platform Settings',
        href: '/dashboard/admin/settings',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        label: 'Activity Logs',
        href: '/dashboard/admin/activity-logs',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="1.5" width="12" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 5h6M5 8h6M5 11h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
  {
    section: 'Account',
    items: [
      {
        label: 'Notifications',
        href: '/dashboard/notifications',
        isNotifications: true,
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        ),
      },
      {
        label: 'My Settings',
        href: '/dashboard/settings',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="6" r="2.25" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 14c.8-2.2 2.6-3.5 5-3.5s4.2 1.3 5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
];

// ------------------------------------------------------------------
// Navigation items with role-based visibility
// ------------------------------------------------------------------
const NAV_ITEMS = [
  {
    label: 'Overview',
    href: '/dashboard',
    exact: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    allowedRoles: ['company_admin', 'manager', 'employee', 'vendor_user'],
  },
  // Notifications — visible to all non-super_admin roles (super_admin has its own nav)
  {
    label: 'Notifications',
    href: '/dashboard/notifications',
    isNotifications: true, // flag so NavLink can render the live badge
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
    allowedRoles: ['company_admin', 'manager', 'employee', 'vendor_user'],
  },
  {
    section: 'Company',
    items: [
      {
        label: 'Profile & Settings',
        href: '/dashboard/company',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="8" cy="6" r="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3.5 13c.8-2 2.5-3 4.5-3s3.7 1 4.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
        allowedRoles: ['company_admin'],
      },
      {
        label: 'Users',
        href: '/dashboard/company/users',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="5.5" cy="5" r="2.25" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="11" cy="5" r="2.25" stroke="currentColor" strokeWidth="1.5" />
            <path d="M1 13.5c.7-2.2 2.5-3.5 4.5-3.5s3.8 1.3 4.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M11.5 10.5c1.5.4 2.7 1.6 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
        allowedRoles: ['company_admin'],
      },
    ],
  },
  // Vendors (top-level, after Company section)
  {
    label: 'Vendors',
    href: '/dashboard/vendors',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5 3V2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.4" />
        <path d="M1 7h14" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="5.5" cy="10" r="1" fill="currentColor" />
      </svg>
    ),
    allowedRoles: ['company_admin', 'manager', 'employee'],
  },
  {
    section: 'Procurement',
    items: [
      {
        label: 'RFQs',
        href: '/dashboard/rfqs',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="1.5" width="10" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 5h4M5 8h4M5 11h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12.5" cy="12.5" r="2.5" fill="currentColor" opacity=".15" stroke="currentColor" strokeWidth="1.2" />
            <path d="M12.5 11.5v1l.7.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        ),
        allowedRoles: ['company_admin', 'manager', 'employee'],
      },
      {
        label: 'Contracts',
        href: '/dashboard/contracts',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="1.5" width="12" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 5h6M5 8h6M5 11h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
        allowedRoles: ['company_admin', 'manager', 'employee'],
      },
      {
        label: 'Bids',
        href: '/dashboard/bids',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5l1.8 3.7 4 .6-2.9 2.8.7 4L8 10.5l-3.6 1.9.7-4L2.2 5.8l4-.6L8 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        ),
        allowedRoles: ['vendor_user'],
      },
    ],
  },
  {
    section: 'Account',
    items: [
      {
        label: 'Settings',
        href: '/dashboard/settings',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        ),
        allowedRoles: ['company_admin', 'manager', 'employee', 'vendor_user'],
      },
    ],
  },
];

function filterNavItems(items, userRole) {
  if (!userRole) return [];
  return items
    .map(item => {
      if (item.section) {
        const filteredItems = filterNavItems(item.items, userRole);
        if (filteredItems.length === 0) return null;
        return { ...item, items: filteredItems };
      }
      const allowed = item.allowedRoles ? item.allowedRoles.includes(userRole) : true;
      return allowed ? item : null;
    })
    .filter(Boolean);
}

const Sidebar = memo(function Sidebar({ company, user, mobileOpen, onMobileClose }) {
  const pathname     = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { unreadCount } = useNotifications();

  // Keep a CSS custom property in sync with sidebar width so DashboardLayout
  // can adjust the main content margin without lifting state.
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-w',
      collapsed ? '64px' : '224px'
    );
  }, [collapsed]);

  const userRole     = user?.role;
  // Super admin gets its own dedicated platform nav; other roles use the company nav
  const filteredItems = useMemo(
    () => userRole === 'super_admin'
      ? SUPER_ADMIN_NAV
      : filterNavItems(NAV_ITEMS, userRole),
    [userRole]
  );

  function isActive(href, exact = false) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <>
      <style>{`
        .sidebar {
          width: ${collapsed ? '64px' : '224px'};
          height: 100vh;
          height: 100dvh;
          background: var(--ink);
          display: flex;
          flex-direction: column;
          transition: width .22s cubic-bezier(.4,0,.2,1), transform .25s cubic-bezier(.4,0,.2,1);
          flex-shrink: 0;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 40;
          overflow-x: hidden;
          overflow-y: auto;
        }
        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            z-index: 50;
            width: 240px !important;
            transform: translateX(-100%);
            box-shadow: 4px 0 24px rgba(15,14,13,.2);
          }
          .sidebar.sidebar--mobile-open {
            transform: translateX(0);
          }
        }
        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: ${collapsed ? '20px 0' : '20px 20px'};
          justify-content: ${collapsed ? 'center' : 'flex-start'};
          border-bottom: 1px solid rgba(255,255,255,.07);
          height: 64px;
        }
        @media (max-width: 768px) {
          .sidebar-logo {
            padding: 20px 20px;
            justify-content: space-between;
          }
        }
        .sidebar-logo-mark {
          width: 30px;
          height: 30px;
          background: var(--accent);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: .9rem;
          color: #fff;
          letter-spacing: -.02em;
        }
        .sidebar-logo-text {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: .95rem;
          color: #fff;
          white-space: nowrap;
          opacity: ${collapsed ? 0 : 1};
          transition: opacity .15s;
          letter-spacing: -.02em;
          flex: 1;
        }
        @media (max-width: 768px) {
          .sidebar-logo-text { opacity: 1 !important; }
        }
        .sidebar-mobile-close {
          display: none;
          background: rgba(255,255,255,.07);
          border: none;
          border-radius: 6px;
          width: 26px;
          height: 26px;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: rgba(255,255,255,.6);
          transition: background .15s, color .15s;
          flex-shrink: 0;
        }
        .sidebar-mobile-close:hover {
          background: rgba(255,255,255,.14);
          color: #fff;
        }
        @media (max-width: 768px) {
          .sidebar-mobile-close { display: flex; }
        }
        .sidebar-nav {
          flex: 1;
          padding: 12px 0;
          overflow-y: auto;
          overflow-x: hidden;
        }
        .nav-section-label {
          font-size: .65rem;
          font-weight: 600;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: rgba(255,255,255,.25);
          padding: 16px 20px 6px;
          white-space: nowrap;
          opacity: ${collapsed ? 0 : 1};
          transition: opacity .1s;
        }
        @media (max-width: 768px) {
          .nav-section-label { opacity: 1 !important; }
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: ${collapsed ? '9px 0' : '9px 20px'};
          justify-content: ${collapsed ? 'center' : 'flex-start'};
          color: rgba(255,255,255,.45);
          text-decoration: none;
          font-family: 'DM Sans', sans-serif;
          font-size: .855rem;
          font-weight: 400;
          transition: color .15s, background .15s;
          cursor: pointer;
          white-space: nowrap;
          position: relative;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          min-height: 44px;
        }
        @media (max-width: 768px) {
          .nav-item {
            padding: 11px 20px;
            justify-content: flex-start;
            font-size: .9rem;
            min-height: 44px;
          }
        }
        .nav-item:hover:not(.nav-item--disabled) {
          color: rgba(255,255,255,.85);
          background: rgba(255,255,255,.05);
        }
        .nav-item--active {
          color: #fff !important;
          background: rgba(200,80,26,.18) !important;
        }
        .nav-item--active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 4px;
          bottom: 4px;
          width: 3px;
          background: var(--accent);
          border-radius: 0 2px 2px 0;
        }
        .nav-item--disabled {
          opacity: .3;
          cursor: not-allowed;
        }
        .nav-icon {
          flex-shrink: 0;
          width: 16px;
          height: 16px;
        }
        .nav-label {
          opacity: ${collapsed ? 0 : 1};
          transition: opacity .1s;
          flex: 1;
        }
        @media (max-width: 768px) {
          .nav-label { opacity: 1 !important; }
        }
        .nav-badge {
          font-size: .6rem;
          background: rgba(255,255,255,.08);
          color: rgba(255,255,255,.3);
          padding: 1px 6px;
          border-radius: 20px;
          font-weight: 500;
          opacity: ${collapsed ? 0 : 1};
        }
        @media (max-width: 768px) {
          .nav-badge { opacity: 1 !important; }
        }
        /* Notification unread count badge — uses accent colour */
        .nav-badge--notif {
          font-size: .58rem;
          background: var(--accent);
          color: #fff;
          padding: 1px 6px;
          border-radius: 20px;
          font-weight: 700;
          opacity: ${collapsed ? 0 : 1};
          transition: opacity .1s;
        }
        @media (max-width: 768px) {
          .nav-badge--notif { opacity: 1 !important; }
        }
        .sidebar-footer {
          padding: ${collapsed ? '16px 0' : '16px 20px'};
          border-top: 1px solid rgba(255,255,255,.07);
          display: flex;
          align-items: center;
          justify-content: ${collapsed ? 'center' : 'space-between'};
        }
        @media (max-width: 768px) {
          .sidebar-footer {
            padding: 16px 20px !important;
            justify-content: space-between !important;
          }
        }
        .sidebar-company-name {
          font-family: 'DM Sans', sans-serif;
          font-size: .78rem;
          color: rgba(255,255,255,.4);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 120px;
          opacity: ${collapsed ? 0 : 1};
          transition: opacity .1s;
        }
        @media (max-width: 768px) {
          .sidebar-company-name { opacity: 1 !important; max-width: 160px; }
          .collapse-btn { display: none !important; }
        }
        .collapse-btn {
          background: rgba(255,255,255,.07);
          border: none;
          border-radius: 6px;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: rgba(255,255,255,.4);
          transition: background .15s, color .15s;
          flex-shrink: 0;
        }
        .collapse-btn:hover {
          background: rgba(255,255,255,.12);
          color: rgba(255,255,255,.8);
        }
      `}</style>

      <aside className={`sidebar${mobileOpen ? ' sidebar--mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">P</div>
          <span className="sidebar-logo-text">Procurexio</span>
          <button
            className="sidebar-mobile-close"
            onClick={onMobileClose}
            aria-label="Close menu"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          {filteredItems.map((item, i) => {
            if (item.section) {
              return (
                <div key={i}>
                  <div className="nav-section-label">{item.section}</div>
                  {item.items.map((sub) => (
                    <NavLink
                      key={sub.href}
                      item={sub}
                      active={isActive(sub.href, sub.exact)}
                      collapsed={collapsed}
                      unreadCount={sub.isNotifications ? unreadCount : 0}
                      onNavigate={onMobileClose}
                    />
                  ))}
                </div>
              );
            }
            return (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(item.href, item.exact)}
                collapsed={collapsed}
                unreadCount={item.isNotifications ? unreadCount : 0}
                onNavigate={onMobileClose}
              />
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <span className="sidebar-company-name">
            {userRole === 'super_admin' ? 'Platform Admin' : (company?.name ?? 'Your Company')}
          </span>
          <button
            className="collapse-btn"
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d={collapsed ? 'M4 2l4 4-4 4' : 'M8 2L4 6l4 4'}
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
});

export default Sidebar;

function NavLink({ item, active, collapsed, unreadCount = 0, onNavigate }) {
  const cls = [
    'nav-item',
    active  ? 'nav-item--active'   : '',
    item.disabled ? 'nav-item--disabled' : '',
  ].filter(Boolean).join(' ');

  const badge = item.disabled ? (
    <span className="nav-badge">Soon</span>
  ) : unreadCount > 0 ? (
    <span className="nav-badge--notif">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  ) : null;

  if (item.disabled) {
    return (
      <div className={cls} title={item.label}>
        <span className="nav-icon">{item.icon}</span>
        <span className="nav-label">{item.label}</span>
        <span className="nav-badge">Soon</span>
      </div>
    );
  }

  return (
    <Link href={item.href} className={cls} title={collapsed ? item.label : undefined} onClick={onNavigate}>
      <span className="nav-icon">{item.icon}</span>
      <span className="nav-label">{item.label}</span>
      {badge}
    </Link>
  );
}
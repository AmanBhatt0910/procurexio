'use client';
// src/components/settings/UserAccessManagement.jsx

import { useState, useEffect } from 'react';
import { settingsSectionStyles, SettingsSectionHeader, ConfirmDialog } from './shared';
import Badge from '@/components/ui/Badge';

// Role options available for assignment — company_admin is excluded;
// that role is protected and cannot be assigned or removed here.
const ROLE_OPTIONS = [
  { value: 'manager',     label: 'Manager' },
  { value: 'employee',    label: 'Employee' },
  { value: 'vendor_user', label: 'Vendor' },
];

// Lock icon SVG
function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4, flexShrink: 0 }}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

// Avatar initials
function Avatar({ name }) {
  const initials = (name || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  const colors = ['#fde8dc', '#dbeafe', '#d1fae5', '#ede9fe', '#fef3c7'];
  const textColors = ['#c8501a', '#1d4ed8', '#065f46', '#6d28d9', '#92400e'];
  const idx = (name || '').charCodeAt(0) % colors.length;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 30, height: 30, borderRadius: '50%',
      background: colors[idx], color: textColors[idx],
      fontSize: '.7rem', fontWeight: 700, flexShrink: 0,
    }}>
      {initials}
    </span>
  );
}

// Users icon for section header
function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

export default function UserAccessManagement({ userRole }) {
  const [users, setUsers]     = useState([]);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState(null);
  const [confirm, setConfirm] = useState(null); // { userId, userName, newRole }
  const [saving, setSaving]   = useState(false);

  function showToast(type, msg) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    fetch('/api/settings/user-access')
      .then(r => r.json())
      .then(j => {
        if (j.data) {
          setUsers(j.data);
          setCanEdit(!!j.canEdit);
        }
      })
      .catch(() => showToast('error', 'Failed to load user list.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleRoleChange() {
    const { userId, newRole } = confirm;
    setConfirm(null);
    setSaving(true);
    try {
      const res = await fetch('/api/settings/user-access', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_user_id: userId, new_role: newRole }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Role change failed');
      showToast('success', 'Role updated successfully.');
      setUsers(us => us.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSaving(false);
    }
  }

  const isAdminRole   = u => u.role === 'company_admin' || u.role === 'super_admin';
  const roleLabel     = r => ({ company_admin: 'Company Admin', super_admin: 'Super Admin', manager: 'Manager', employee: 'Employee', vendor_user: 'Vendor' }[r] || r);

  return (
    <>
      <style>{settingsSectionStyles + `
        .ua-name-cell { display: flex; align-items: center; gap: 10px; }
        .ua-name-text { font-weight: 500; font-size: .875rem; line-height: 1.3; }
        .ua-email-text { font-size: .76rem; color: var(--ink-faint); }
        .ua-locked-hint {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: .74rem; color: #3b4ea6;
          background: #f0f4ff; border: 1px solid #c7d2fe;
          padding: 3px 9px; border-radius: 99px; font-weight: 500;
          white-space: nowrap;
        }
        .ua-role-select {
          padding: 5px 10px;
          border: 1px solid var(--border);
          border-radius: 7px;
          font-family: 'DM Sans', sans-serif;
          font-size: .8rem;
          color: var(--ink);
          background: var(--white);
          cursor: pointer;
          outline: none;
          transition: border-color .15s;
        }
        .ua-role-select:focus { border-color: var(--accent); }
        .ua-role-select:disabled { opacity: .5; cursor: not-allowed; }
        @media (max-width: 640px) {
          .settings-table thead { display: none; }
          .settings-table tr {
            display: block;
            border-bottom: 1px solid var(--border);
            padding: 12px 16px;
          }
          .settings-table td {
            display: flex; align-items: center;
            padding: 4px 0; border: none;
            gap: 8px;
          }
          .settings-table td::before {
            content: attr(data-label);
            font-size: .68rem; font-weight: 700; letter-spacing: .07em;
            text-transform: uppercase; color: var(--ink-faint);
            min-width: 70px;
          }
        }
      `}</style>

      {toast && (
        <div className={`settings-toast settings-toast--${toast.type}`}>
          {toast.type === 'success' ? '✓ ' : '⚠ '}{toast.msg}
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          title="Change User Role?"
          body={`You are about to change ${confirm.userName}'s role to "${ROLE_OPTIONS.find(r => r.value === confirm.newRole)?.label}". This will immediately affect their access and permissions.`}
          confirmLabel="Change Role"
          onConfirm={handleRoleChange}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="settings-section-card">
        <SettingsSectionHeader
          icon={<UsersIcon />}
          title="User & Access Management"
          subtitle={canEdit
            ? 'Manage roles for team members. Company Admin roles are protected.'
            : 'View your team hierarchy (read-only for your role).'}
        />

        {loading ? (
          <div className="settings-loading">Loading team members…</div>
        ) : users.length === 0 ? (
          <div className="settings-empty">No users found in your company.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="settings-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Status</th>
                  {canEdit && <th>Change Role</th>}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td data-label="Member">
                      <div className="ua-name-cell">
                        <Avatar name={u.name} />
                        <div>
                          <div className="ua-name-text">{u.name}</div>
                          <div className="ua-email-text">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td data-label="Role">
                      <Badge variant={u.role}>{roleLabel(u.role)}</Badge>
                    </td>
                    <td data-label="Status">
                      <span className={`settings-badge ${u.is_active ? 'settings-badge--success' : 'settings-badge--neutral'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {canEdit && (
                      <td data-label="Change Role">
                        {isAdminRole(u) ? (
                          <span className="ua-locked-hint">
                            <LockIcon />Protected
                          </span>
                        ) : (
                          <select
                            className="ua-role-select"
                            value={u.role}
                            onChange={e => setConfirm({ userId: u.id, userName: u.name, newRole: e.target.value })}
                            disabled={saving}
                          >
                            {ROLE_OPTIONS.map(r => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

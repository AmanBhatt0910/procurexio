'use client';
// src/components/settings/UserAccessManagement.jsx

import { useState, useEffect } from 'react';
import { settingsSectionStyles, SettingsSectionHeader, ConfirmDialog } from './shared';
import Badge from '@/components/ui/Badge';

const ROLE_OPTIONS = [
  { value: 'company_admin', label: 'Company Admin' },
  { value: 'manager',       label: 'Manager' },
  { value: 'employee',      label: 'Employee' },
  { value: 'vendor_user',   label: 'Vendor' },
];

export default function UserAccessManagement({ userRole }) {
  const [users, setUsers]       = useState([]);
  const [canEdit, setCanEdit]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState(null);
  const [confirm, setConfirm]   = useState(null); // { userId, userName, newRole }
  const [saving, setSaving]     = useState(false);

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

  return (
    <>
      <style>{settingsSectionStyles}</style>
      {toast && <div className={`settings-toast settings-toast--${toast.type}`}>{toast.msg}</div>}

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
          icon="👥"
          title="User & Access Management"
          subtitle={canEdit ? 'Manage roles for users in your company.' : 'View roles and team hierarchy (read-only for your role).'}
        />

        {loading ? (
          <div className="settings-loading">Loading…</div>
        ) : users.length === 0 ? (
          <div className="settings-empty">No users found in your company.</div>
        ) : (
          <table className="settings-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                {canEdit && <th>Change Role</th>}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500, fontSize: '.875rem' }}>{u.name}</td>
                  <td style={{ fontSize: '.82rem', color: 'var(--ink-soft)' }}>{u.email}</td>
                  <td><Badge variant={u.role}>{u.role}</Badge></td>
                  <td>
                    <span className={`settings-badge ${u.is_active ? 'settings-badge--success' : 'settings-badge--neutral'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {canEdit && (
                    <td>
                      <select
                        className="settings-select"
                        style={{ maxWidth: 160, padding: '5px 10px', fontSize: '.82rem' }}
                        value={u.role}
                        onChange={e => setConfirm({ userId: u.id, userName: u.name, newRole: e.target.value })}
                        disabled={saving}
                      >
                        {ROLE_OPTIONS.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

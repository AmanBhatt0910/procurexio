'use client';
// src/components/settings/PersonalInfo.jsx
// Personal Information section — name/email are read-only, phone is editable

import { useState, useEffect } from 'react';
import { settingsSectionStyles, SettingsSectionHeader, SettingsField, SaveButton, Toast } from './shared';

export default function PersonalInfo() {
  const [data, setData]       = useState(null);
  const [phone, setPhone]     = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);

  useEffect(() => {
    fetch('/api/settings/personal')
      .then(r => r.json())
      .then(j => {
        if (j.data) {
          setData(j.data);
          setPhone(j.data.phone_number || '');
        }
      })
      .catch(() => setToast({ type: 'error', msg: 'Failed to load personal info.' }))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings/personal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Update failed');
      setToast({ type: 'success', msg: 'Personal info updated.' });
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 4000);
    }
  }

  const roleLabel = {
    super_admin:   'Super Admin',
    company_admin: 'Company Admin',
    manager:       'Manager',
    employee:      'Employee',
    vendor_user:   'Vendor',
  };

  return (
    <>
      <style>{settingsSectionStyles}</style>
      {toast && <div className={`settings-toast settings-toast--${toast.type}`}>{toast.msg}</div>}

      <div className="settings-section-card">
        <SettingsSectionHeader
          icon="👤"
          title="Personal Information"
          subtitle="View your account details. Name and email are managed by your administrator."
        />

        {loading ? (
          <div className="settings-loading">Loading…</div>
        ) : (
          <form onSubmit={handleSave}>
            <SettingsField label="Full Name" readOnly value={data?.name || '—'} />
            <SettingsField label="Email Address" readOnly value={data?.email || '—'} />
            <SettingsField label="Role" readOnly value={roleLabel[data?.role] || data?.role || '—'} />
            <SettingsField label="Member Since" readOnly value={data?.created_at ? new Date(data.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—'} />

            <div className="settings-field-group">
              <label className="settings-field-label">Phone Number</label>
              <input
                className="settings-input"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 555 000 0000"
                maxLength={32}
              />
              <div className="settings-field-hint">Used for SMS alerts (optional)</div>
            </div>

            <div className="settings-actions">
              <SaveButton saving={saving} />
            </div>
          </form>
        )}
      </div>
    </>
  );
}

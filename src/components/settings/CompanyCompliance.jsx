'use client';
// src/components/settings/CompanyCompliance.jsx
// Company & Compliance section — company_admin only

import { useState, useEffect } from 'react';
import { settingsSectionStyles, SettingsSectionHeader, SaveButton, Toast } from './shared';
import { ALLOWED_CURRENCIES } from '@/lib/validation';

const TIMEZONES = [
  'UTC', 'UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:00', 'UTC-08:00',
  'UTC-07:00', 'UTC-06:00', 'UTC-05:00', 'UTC-04:00', 'UTC-03:00', 'UTC-02:00',
  'UTC-01:00', 'UTC+01:00', 'UTC+02:00', 'UTC+03:00', 'UTC+04:00', 'UTC+04:30',
  'UTC+05:00', 'UTC+05:30', 'UTC+05:45', 'UTC+06:00', 'UTC+06:30', 'UTC+07:00',
  'UTC+08:00', 'UTC+09:00', 'UTC+09:30', 'UTC+10:00', 'UTC+11:00', 'UTC+12:00',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'America/Vancouver', 'America/Sao_Paulo', 'America/Buenos_Aires',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Shanghai', 'Asia/Tokyo',
  'Australia/Sydney', 'Pacific/Auckland',
];

const CURRENCIES = [...ALLOWED_CURRENCIES].sort();

export default function CompanyCompliance() {
  const [form, setForm]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);
  const [errors, setErrors]   = useState({});

  useEffect(() => {
    fetch('/api/settings/company')
      .then(r => r.json())
      .then(j => {
        if (j.data) {
          setForm({
            name:               j.data.name || '',
            timezone:           j.data.timezone || 'UTC',
            currency:           j.data.currency || 'USD',
            logo_url:           j.data.logo_url || '',
            tax_id:             j.data.tax_id || '',
            registered_address: j.data.registered_address || '',
            phone_number:       j.data.phone_number || '',
            website_url:        j.data.website_url || '',
          });
        }
      })
      .catch(() => setToast({ type: 'error', msg: 'Failed to load company settings.' }))
      .finally(() => setLoading(false));
  }, []);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: null }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const res = await fetch('/api/settings/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.errors) setErrors(json.errors);
        throw new Error(json.error || 'Update failed');
      }
      setToast({ type: 'success', msg: 'Company settings saved.' });
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 4000);
    }
  }

  return (
    <>
      <style>{settingsSectionStyles}</style>
      {toast && <div className={`settings-toast settings-toast--${toast.type}`}>{toast.msg}</div>}

      <div className="settings-section-card">
        <SettingsSectionHeader
          icon="🏢"
          title="Company & Compliance"
          subtitle="Manage your company profile, tax identification, and localisation settings."
        />

        {loading ? (
          <div className="settings-loading">Loading…</div>
        ) : !form ? (
          <div className="settings-loading">No company data found.</div>
        ) : (
          <form onSubmit={handleSave}>
            {/* Company Name — read-only; changed via admin */}
            <div className="settings-field-group">
              <label className="settings-field-label">Company Name</label>
              <input className="settings-input" value={form.name} disabled readOnly />
              <div className="settings-field-hint">Contact your platform admin to change the company name.</div>
            </div>

            <div className="settings-field-group">
              <label className="settings-field-label">Tax / GST / VAT ID</label>
              <input
                className="settings-input"
                value={form.tax_id}
                onChange={e => set('tax_id', e.target.value)}
                placeholder="e.g. GSTIN 22AAAAA0000A1Z5"
                maxLength={64}
              />
              {errors.tax_id && <div className="settings-field-error">{errors.tax_id}</div>}
            </div>

            <div className="settings-field-group">
              <label className="settings-field-label">Registered Address</label>
              <textarea
                className="settings-textarea"
                value={form.registered_address}
                onChange={e => set('registered_address', e.target.value)}
                placeholder="Full registered business address"
                maxLength={500}
              />
              {errors.registered_address && <div className="settings-field-error">{errors.registered_address}</div>}
            </div>

            <div className="settings-field-group">
              <label className="settings-field-label">Phone Number</label>
              <input
                className="settings-input"
                type="tel"
                value={form.phone_number}
                onChange={e => set('phone_number', e.target.value)}
                placeholder="+1 800 000 0000"
                maxLength={32}
              />
            </div>

            <div className="settings-field-group">
              <label className="settings-field-label">Website URL</label>
              <input
                className="settings-input"
                type="url"
                value={form.website_url}
                onChange={e => set('website_url', e.target.value)}
                placeholder="https://yourcompany.com"
                maxLength={512}
              />
            </div>

            <div className="settings-field-group">
              <label className="settings-field-label">Default Currency</label>
              <select className="settings-select" value={form.currency} onChange={e => set('currency', e.target.value)}>
                {CURRENCIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.currency && <div className="settings-field-error">{errors.currency}</div>}
            </div>

            <div className="settings-field-group">
              <label className="settings-field-label">Timezone</label>
              <select className="settings-select" value={form.timezone} onChange={e => set('timezone', e.target.value)}>
                {TIMEZONES.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
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

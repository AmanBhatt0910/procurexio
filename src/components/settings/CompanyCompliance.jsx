'use client';
// src/components/settings/CompanyCompliance.jsx
// Company Profile section — company_admin only
// Covers full company profile + compliance settings (implements dashboard/company in settings)

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

const PLAN_META = {
  free:       { color: '#6b7280', bg: '#f3f4f6' },
  pro:        { color: '#c8501a', bg: '#fdf3ef' },
  enterprise: { color: '#1d4ed8', bg: '#dbeafe' },
};

function BuildingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="20" x="4" y="2" rx="2"/>
      <path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>
    </svg>
  );
}

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
            email:              j.data.email || '',
            plan:               j.data.plan || 'free',
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
        body: JSON.stringify({
          timezone:           form.timezone,
          currency:           form.currency,
          logo_url:           form.logo_url,
          tax_id:             form.tax_id,
          registered_address: form.registered_address,
          phone_number:       form.phone_number,
          website_url:        form.website_url,
        }),
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

  const planMeta = form ? (PLAN_META[form.plan] || PLAN_META.free) : null;

  return (
    <>
      <style>{settingsSectionStyles + `
        .cc-info-banner {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 24px;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
          flex-wrap: wrap;
        }
        .cc-logo-placeholder {
          width: 52px; height: 52px;
          border-radius: 10px;
          background: #fdf3ef;
          border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif;
          font-weight: 700; font-size: 1.2rem;
          color: var(--accent);
          flex-shrink: 0;
          overflow: hidden;
        }
        .cc-logo-img { width: 100%; height: 100%; object-fit: cover; }
        .cc-company-name {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          color: var(--ink);
          letter-spacing: -.02em;
          margin-bottom: 4px;
        }
        .cc-company-meta {
          display: flex; gap: 10px; align-items: center; flex-wrap: wrap;
        }
        .cc-plan-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 10px; border-radius: 99px;
          font-size: .7rem; font-weight: 700; letter-spacing: .04em;
          text-transform: uppercase;
        }
        .cc-email-text {
          font-size: .8rem; color: var(--ink-soft);
        }
        .cc-section-divider {
          padding: 12px 24px 4px;
          border-top: 1px solid var(--border);
          background: var(--surface);
        }
        .cc-section-divider-label {
          font-size: .68rem; font-weight: 700;
          letter-spacing: .09em; text-transform: uppercase;
          color: var(--ink-faint);
        }
        .cc-field-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        @media (max-width: 600px) { .cc-field-grid { grid-template-columns: 1fr; } }
        .cc-field-grid .settings-field-group {
          border-right: 1px solid var(--border);
        }
        .cc-field-grid .settings-field-group:nth-child(even) {
          border-right: none;
        }
        @media (max-width: 600px) {
          .cc-field-grid .settings-field-group { border-right: none; }
        }
        .cc-logo-preview-row {
          display: flex; align-items: center; gap: 12px; margin-top: 6px;
        }
        .cc-logo-preview {
          width: 40px; height: 40px;
          border-radius: 8px;
          border: 1px solid var(--border);
          object-fit: cover;
        }
      `}</style>

      {toast && (
        <div className={`settings-toast settings-toast--${toast.type}`}>
          {toast.type === 'success' ? '✓ ' : '⚠ '}{toast.msg}
        </div>
      )}

      <div className="settings-section-card">
        <SettingsSectionHeader
          icon={<BuildingIcon />}
          title="Company Profile"
          subtitle="Manage your company details, localisation settings, and compliance information."
        />

        {loading ? (
          <div className="settings-loading">Loading company data…</div>
        ) : !form ? (
          <div className="settings-empty">No company data found.</div>
        ) : (
          <>
            {/* Company info banner */}
            <div className="cc-info-banner">
              <div className="cc-logo-placeholder">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Logo" className="cc-logo-img" onError={e => { e.target.style.display = 'none'; }} />
                ) : (
                  form.name.charAt(0).toUpperCase() || '?'
                )}
              </div>
              <div>
                <div className="cc-company-name">{form.name || 'Your Company'}</div>
                <div className="cc-company-meta">
                  <span
                    className="cc-plan-badge"
                    style={{ color: planMeta.color, background: planMeta.bg }}
                  >
                    {form.plan}
                  </span>
                  {form.email && <span className="cc-email-text">{form.email}</span>}
                </div>
              </div>
            </div>

            <form onSubmit={handleSave}>
              {/* Read-only identity fields */}
              <div className="cc-section-divider">
                <div className="cc-section-divider-label">Identity (managed by platform admin)</div>
              </div>
              <div className="cc-field-grid">
                <div className="settings-field-group">
                  <label className="settings-field-label">Company Name</label>
                  <input className="settings-input" value={form.name} disabled readOnly />
                  <div className="settings-field-hint">Contact your platform admin to change this.</div>
                </div>
                <div className="settings-field-group">
                  <label className="settings-field-label">Contact Email</label>
                  <input className="settings-input" value={form.email} disabled readOnly />
                  <div className="settings-field-hint">Contact your platform admin to change this.</div>
                </div>
              </div>

              {/* Compliance fields */}
              <div className="cc-section-divider">
                <div className="cc-section-divider-label">Compliance &amp; Tax</div>
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

              {/* Contact fields */}
              <div className="cc-section-divider">
                <div className="cc-section-divider-label">Contact &amp; Web</div>
              </div>
              <div className="cc-field-grid">
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
              </div>

              {/* Localisation */}
              <div className="cc-section-divider">
                <div className="cc-section-divider-label">Localisation</div>
              </div>
              <div className="cc-field-grid">
                <div className="settings-field-group">
                  <label className="settings-field-label">Default Currency</label>
                  <select className="settings-select" value={form.currency} onChange={e => set('currency', e.target.value)}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.currency && <div className="settings-field-error">{errors.currency}</div>}
                </div>
                <div className="settings-field-group">
                  <label className="settings-field-label">Timezone</label>
                  <select className="settings-select" value={form.timezone} onChange={e => set('timezone', e.target.value)}>
                    {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
              </div>

              {/* Branding */}
              <div className="cc-section-divider">
                <div className="cc-section-divider-label">Branding</div>
              </div>
              <div className="settings-field-group">
                <label className="settings-field-label">Logo URL</label>
                <div className="cc-logo-preview-row">
                  {form.logo_url && (
                    <img src={form.logo_url} alt="Logo preview" className="cc-logo-preview"
                      onError={e => { e.target.style.display = 'none'; }} />
                  )}
                  <input
                    className="settings-input"
                    type="url"
                    value={form.logo_url}
                    onChange={e => set('logo_url', e.target.value)}
                    placeholder="https://your-cdn.com/logo.png"
                    maxLength={512}
                  />
                </div>
                <div className="settings-field-hint">A publicly accessible image URL for your company logo.</div>
              </div>

              <div className="settings-actions">
                <SaveButton saving={saving} />
              </div>
            </form>
          </>
        )}
      </div>
    </>
  );
}

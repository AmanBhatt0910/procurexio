'use client';
// src/app/dashboard/company/page.jsx

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Asia/Kolkata', 'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney',
];

const CURRENCIES = [
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'INR', label: 'INR — Indian Rupee' },
  { code: 'JPY', label: 'JPY — Japanese Yen' },
  { code: 'CAD', label: 'CAD — Canadian Dollar' },
  { code: 'AUD', label: 'AUD — Australian Dollar' },
  { code: 'SGD', label: 'SGD — Singapore Dollar' },
];

export default function CompanyPage() {
  const [company,  setCompany]  = useState(null);
  const [settings, setSettings] = useState({ timezone: 'UTC', currency: 'USD', logo_url: '' });
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState(null);

  // Profile form state
  const [name,  setName]  = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [cRes, sRes] = await Promise.all([
          fetch('/api/company'),
          fetch('/api/company/settings'),
        ]);
        if (cRes.ok) {
          const d = (await cRes.json()).data;
          setCompany(d);
          setName(d.name ?? '');
          setEmail(d.email ?? '');
        }
        if (sRes.ok) {
          const s = (await sRes.json()).data;
          setSettings({
            timezone: s.timezone ?? 'UTC',
            currency: s.currency ?? 'USD',
            logo_url: s.logo_url ?? '',
          });
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      if (res.ok) showToast('Profile saved.');
      else showToast((await res.json()).error, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function saveSettings(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/company/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) showToast('Settings saved.');
      else showToast((await res.json()).error, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout pageTitle="Company">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .two-col-form { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 680px) { .two-col-form { grid-template-columns: 1fr; } }

        .form-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 24px 26px;
          margin-bottom: 20px;
        }
        .form-card-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: .95rem;
          color: var(--ink);
          letter-spacing: -.02em;
          margin-bottom: 2px;
        }
        .form-card-sub {
          font-size: .81rem;
          color: var(--ink-soft);
          margin-bottom: 20px;
        }
        .field { margin-bottom: 16px; }
        .field-label {
          display: block;
          font-size: .8rem;
          font-weight: 500;
          color: var(--ink);
          margin-bottom: 6px;
          font-family: 'DM Sans', sans-serif;
        }
        .field-input {
          width: 100%;
          padding: 9px 12px;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: .875rem;
          color: var(--ink);
          background: var(--white);
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .field-input:focus {
          border-color: var(--ink);
          box-shadow: 0 0 0 3px rgba(15,14,13,.06);
        }
        .field-input:disabled { background: var(--surface); color: var(--ink-soft); }
        select.field-input { cursor: pointer; }
        .save-btn {
          background: var(--accent);
          color: #fff;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          font-size: .855rem;
          cursor: pointer;
          transition: background .15s, transform .1s;
          margin-top: 4px;
        }
        .save-btn:hover:not(:disabled) { background: var(--accent-h); }
        .save-btn:active:not(:disabled) { transform: scale(.98); }
        .save-btn:disabled { opacity: .6; cursor: not-allowed; }
        .plan-row {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px 14px;
          margin-bottom: 16px;
        }
        .plan-label { font-size: .83rem; color: var(--ink-soft); flex: 1; font-family: 'DM Sans'; }
        .toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          padding: 12px 18px;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: .855rem;
          font-weight: 500;
          z-index: 999;
          box-shadow: var(--shadow);
          animation: toastIn .2s ease;
        }
        .toast--success { background: #166534; color: #fff; }
        .toast--error   { background: #991b1b; color: #fff; }
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <PageHeader
        title="Company Profile"
        subtitle="Manage your organization's details and workspace settings."
      />

      {/* Plan info */}
      {company && (
        <div className="form-card" style={{ marginBottom: 20 }}>
          <div className="plan-row">
            <span className="plan-label">Current plan</span>
            <Badge variant={company.plan}>{company.plan}</Badge>
            <span style={{ fontSize: '.78rem', color: 'var(--ink-faint)', fontFamily: 'DM Sans' }}>
              Member since {new Date(company.created_at).getFullYear()}
            </span>
          </div>
        </div>
      )}

      {/* Profile form */}
      <form onSubmit={saveProfile} className="form-card">
        <div className="form-card-title">Organization Profile</div>
        <div className="form-card-sub">Update your company&apos;s name and contact email.</div>

        <div className="two-col-form">
          <div className="field">
            <label className="field-label">Company Name</label>
            <input
              className="field-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Acme Corporation"
              required
              disabled={loading}
            />
          </div>
          <div className="field">
            <label className="field-label">Contact Email</label>
            <input
              className="field-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@company.com"
              required
              disabled={loading}
            />
          </div>
        </div>

        <button type="submit" className="save-btn" disabled={saving || loading}>
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </form>

      {/* Settings form */}
      <form onSubmit={saveSettings} className="form-card">
        <div className="form-card-title">Workspace Settings</div>
        <div className="form-card-sub">Configure timezone, currency, and branding for your team.</div>

        <div className="two-col-form">
          <div className="field">
            <label className="field-label">Timezone</label>
            <select
              className="field-input"
              value={settings.timezone}
              onChange={e => setSettings(s => ({ ...s, timezone: e.target.value }))}
              disabled={loading}
            >
              {TIMEZONES.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Currency</label>
            <select
              className="field-input"
              value={settings.currency}
              onChange={e => setSettings(s => ({ ...s, currency: e.target.value }))}
              disabled={loading}
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label className="field-label">Logo URL <span style={{ color: 'var(--ink-faint)', fontWeight: 400 }}>(optional)</span></label>
          <input
            className="field-input"
            type="url"
            value={settings.logo_url}
            onChange={e => setSettings(s => ({ ...s, logo_url: e.target.value }))}
            placeholder="https://your-cdn.com/logo.png"
            disabled={loading}
          />
        </div>

        <button type="submit" className="save-btn" disabled={saving || loading}>
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>

      {toast && (
        <div className={`toast toast--${toast.type}`}>{toast.msg}</div>
      )}
    </DashboardLayout>
  );
}
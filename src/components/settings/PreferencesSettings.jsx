'use client';
// src/components/settings/PreferencesSettings.jsx

import { useState, useEffect } from 'react';
import { settingsSectionStyles, SettingsSectionHeader, SaveButton } from './shared';

const LANGUAGES = [
  { value: 'en',    label: 'English' },
  { value: 'fr',    label: 'Français (French)' },
  { value: 'de',    label: 'Deutsch (German)' },
  { value: 'es',    label: 'Español (Spanish)' },
  { value: 'pt',    label: 'Português (Portuguese)' },
  { value: 'ar',    label: 'العربية (Arabic)' },
  { value: 'hi',    label: 'हिन्दी (Hindi)' },
  { value: 'zh',    label: '中文 (Chinese)' },
  { value: 'ja',    label: '日本語 (Japanese)' },
];

const THEMES = [
  { value: 'system', label: 'System Default' },
  { value: 'light',  label: 'Light' },
  { value: 'dark',   label: 'Dark' },
];

const DASHBOARD_VIEWS = [
  { value: 'overview',  label: 'Overview' },
  { value: 'rfqs',      label: 'RFQs' },
  { value: 'vendors',   label: 'Vendors' },
  { value: 'contracts', label: 'Contracts' },
];

const PAGE_SIZES = [10, 20, 25, 50, 100];

export default function PreferencesSettings() {
  const [form, setForm]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);

  useEffect(() => {
    fetch('/api/settings/preferences')
      .then(r => r.json())
      .then(j => { if (j.data) setForm(j.data); })
      .catch(() => setToast({ type: 'error', msg: 'Failed to load preferences.' }))
      .finally(() => setLoading(false));
  }, []);

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Update failed');
      setToast({ type: 'success', msg: 'Preferences saved.' });
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
          icon="⚙️"
          title="Preferences"
          subtitle="Personalise your language, appearance, and dashboard defaults."
        />

        {loading ? (
          <div className="settings-loading">Loading…</div>
        ) : !form ? (
          <div className="settings-loading">Could not load preferences.</div>
        ) : (
          <form onSubmit={handleSave}>
            <div className="settings-field-group">
              <label className="settings-field-label">Language</label>
              <select className="settings-select" value={form.language} onChange={e => set('language', e.target.value)}>
                {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
              <div className="settings-field-hint">UI language preference (takes effect on next load).</div>
            </div>

            <div className="settings-field-group">
              <label className="settings-field-label">Theme</label>
              <select className="settings-select" value={form.theme} onChange={e => set('theme', e.target.value)}>
                {THEMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <div className="settings-field-hint">Dark mode is coming soon — the setting is stored for when it ships.</div>
            </div>

            <div className="settings-field-group">
              <label className="settings-field-label">Default Dashboard View</label>
              <select className="settings-select" value={form.default_dashboard_view} onChange={e => set('default_dashboard_view', e.target.value)}>
                {DASHBOARD_VIEWS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </div>

            <div className="settings-field-group">
              <label className="settings-field-label">Default Page Size</label>
              <select className="settings-select" value={form.items_per_page} onChange={e => set('items_per_page', Number(e.target.value))}>
                {PAGE_SIZES.map(n => <option key={n} value={n}>{n} items per page</option>)}
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

'use client';
// src/components/settings/IntegrationsSettings.jsx

import { useState, useEffect, useCallback } from 'react';
import { settingsSectionStyles, SettingsSectionHeader, SaveButton, ConfirmDialog } from './shared';

const TYPE_OPTIONS = [
  { value: 'api_key', label: 'API Key' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'oauth',   label: 'OAuth' },
];

const BLANK_FORM = { name: '', type: 'api_key', api_key: '', webhook_url: '', webhook_secret: '' };

export default function IntegrationsSettings() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(BLANK_FORM);
  const [formErr, setFormErr]   = useState({});
  const [saving, setSaving]     = useState(false);
  const [confirmDel, setConfirmDel] = useState(null); // { id, name }

  function showToast(type, msg) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  const loadIntegrations = useCallback(() => {
    return fetch('/api/settings/integrations')
      .then(r => r.json())
      .then(j => { if (j.data) setItems(j.data); })
      .catch(() => {
        setToast({ type: 'error', msg: 'Failed to load integrations.' });
        setTimeout(() => setToast(null), 4000);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadIntegrations(); }, [loadIntegrations]);

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    setFormErr(e => ({ ...e, [key]: null }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (form.type === 'webhook' && !form.webhook_url) errs.webhook_url = 'Webhook URL is required.';
    if (form.type === 'api_key' && !form.api_key) errs.api_key = 'API key is required.';
    if (Object.keys(errs).length) { setFormErr(errs); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/settings/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Creation failed');
      showToast('success', 'Integration added.');
      setForm(BLANK_FORM);
      setShowForm(false);
      await loadIntegrations();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const { id } = confirmDel;
    setConfirmDel(null);
    try {
      const res = await fetch('/api/settings/integrations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Deletion failed');
      showToast('success', 'Integration removed.');
      setItems(it => it.filter(i => i.id !== id));
    } catch (err) {
      showToast('error', err.message);
    }
  }

  return (
    <>
      <style>{settingsSectionStyles}</style>
      {toast && <div className={`settings-toast settings-toast--${toast.type}`}>{toast.msg}</div>}

      {confirmDel && (
        <ConfirmDialog
          title="Remove Integration?"
          body={`"${confirmDel.name}" will be deactivated. This cannot be undone.`}
          danger
          confirmLabel="Remove"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDel(null)}
        />
      )}

      <div className="settings-section-card">
        <SettingsSectionHeader
          icon="🔗"
          title="Integrations"
          subtitle="Manage third-party API keys, webhooks, and OAuth connections."
        />

        {loading ? (
          <div className="settings-loading">Loading…</div>
        ) : (
          <>
            {/* List */}
            {items.length === 0 ? (
              <div className="settings-empty">No integrations configured yet.</div>
            ) : (
              <table className="settings-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Credential</th>
                    <th>Status</th>
                    <th>Added</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(it => (
                    <tr key={it.id}>
                      <td style={{ fontWeight: 500 }}>{it.name}</td>
                      <td>
                        <span className="settings-badge settings-badge--neutral" style={{ textTransform: 'capitalize' }}>
                          {TYPE_OPTIONS.find(t => t.value === it.type)?.label || it.type}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '.8rem', color: 'var(--ink-faint)' }}>
                        {it.api_key_preview || it.webhook_url?.slice(0, 30) + (it.webhook_url?.length > 30 ? '…' : '') || '—'}
                      </td>
                      <td>
                        <span className={`settings-badge ${it.is_active ? 'settings-badge--success' : 'settings-badge--neutral'}`}>
                          {it.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ fontSize: '.82rem', whiteSpace: 'nowrap' }}>
                        {new Date(it.created_at).toLocaleDateString('en-US', { dateStyle: 'short' })}
                      </td>
                      <td>
                        <button
                          className="settings-btn settings-btn--danger"
                          style={{ fontSize: '.78rem', padding: '4px 10px' }}
                          onClick={() => setConfirmDel({ id: it.id, name: it.name })}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Add form toggle */}
            {!showForm && (
              <div className="settings-actions" style={{ borderTop: items.length > 0 ? '1px solid var(--border)' : 'none' }}>
                <button className="settings-btn settings-btn--primary" onClick={() => setShowForm(true)}>
                  + Add Integration
                </button>
              </div>
            )}

            {/* Add form */}
            {showForm && (
              <form onSubmit={handleCreate} style={{ borderTop: '1px solid var(--border)' }}>
                <div className="settings-sub-section">
                  <div className="settings-sub-title">New Integration</div>
                </div>

                <div className="settings-field-group">
                  <label className="settings-field-label">Name</label>
                  <input
                    className="settings-input"
                    value={form.name}
                    onChange={e => setField('name', e.target.value)}
                    placeholder="e.g. Slack Webhook, ERP API"
                    maxLength={128}
                  />
                  {formErr.name && <div className="settings-field-error">{formErr.name}</div>}
                </div>

                <div className="settings-field-group">
                  <label className="settings-field-label">Type</label>
                  <select className="settings-select" value={form.type} onChange={e => setField('type', e.target.value)}>
                    {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                {form.type === 'api_key' && (
                  <div className="settings-field-group">
                    <label className="settings-field-label">API Key</label>
                    <input
                      className="settings-input"
                      type="password"
                      value={form.api_key}
                      onChange={e => setField('api_key', e.target.value)}
                      placeholder="Paste API key here"
                      maxLength={512}
                    />
                    {formErr.api_key && <div className="settings-field-error">{formErr.api_key}</div>}
                    <div className="settings-field-hint">Stored securely; only a masked preview will be shown.</div>
                  </div>
                )}

                {form.type === 'webhook' && (
                  <>
                    <div className="settings-field-group">
                      <label className="settings-field-label">Webhook URL</label>
                      <input
                        className="settings-input"
                        type="url"
                        value={form.webhook_url}
                        onChange={e => setField('webhook_url', e.target.value)}
                        placeholder="https://hooks.example.com/…"
                        maxLength={2048}
                      />
                      {formErr.webhook_url && <div className="settings-field-error">{formErr.webhook_url}</div>}
                    </div>
                    <div className="settings-field-group">
                      <label className="settings-field-label">Webhook Secret (optional)</label>
                      <input
                        className="settings-input"
                        type="password"
                        value={form.webhook_secret}
                        onChange={e => setField('webhook_secret', e.target.value)}
                        placeholder="HMAC signing secret"
                        maxLength={256}
                      />
                    </div>
                  </>
                )}

                <div className="settings-actions">
                  <SaveButton saving={saving} label="Add Integration" />
                  <button
                    type="button"
                    className="settings-btn settings-btn--ghost"
                    onClick={() => { setShowForm(false); setForm(BLANK_FORM); setFormErr({}); }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </>
  );
}

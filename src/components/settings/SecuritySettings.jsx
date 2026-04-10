'use client';
// src/components/settings/SecuritySettings.jsx

import { useState, useEffect } from 'react';
import { settingsSectionStyles, SettingsSectionHeader, SaveButton, ConfirmDialog } from './shared';

export default function SecuritySettings() {
  const [status, setStatus]     = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [toast, setToast]       = useState(null);

  // Password form
  const [pwForm, setPwForm]     = useState({ current: '', next: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaving, setPwSaving] = useState(false);

  // 2FA confirm dialog
  const [confirm2FA, setConfirm2FA] = useState(null); // 'enable' | 'disable' | null
  const [tfa2Saving, set2FASaving]  = useState(false);

  // Session confirm dialog
  const [confirmSession, setConfirmSession] = useState(null); // { id: null|number, label: string }
  const [sessionSaving, setSessionSaving]   = useState(false);

  function showToast(type, msg) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4500);
  }

  useEffect(() => {
    fetch('/api/settings/security/status')
      .then(r => r.json())
      .then(j => {
        if (j.data) {
          setStatus(j.data);
          setSessions(j.data.sessions || []);
        }
      })
      .catch(() => showToast('error', 'Failed to load security status.'))
      .finally(() => setLoading(false));
  }, []);

  // ── Password change ───────────────────────────────────────────────────────

  async function handlePasswordSave(e) {
    e.preventDefault();
    const errs = {};
    if (!pwForm.current) errs.current = 'Current password is required.';
    if (!pwForm.next)    errs.next    = 'New password is required.';
    else if (pwForm.next.length < 8) errs.next = 'New password must be at least 8 characters.';
    if (pwForm.next && pwForm.next !== pwForm.confirm) errs.confirm = 'Passwords do not match.';

    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    setPwErrors({});
    setPwSaving(true);

    try {
      const res = await fetch('/api/settings/security/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: pwForm.current, new_password: pwForm.next }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Password update failed');
      showToast('success', 'Password updated successfully.');
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setPwSaving(false);
    }
  }

  // ── 2FA ──────────────────────────────────────────────────────────────────

  async function handle2FA() {
    const action = confirm2FA;
    setConfirm2FA(null);
    set2FASaving(true);
    try {
      const endpoint = action === 'enable'
        ? '/api/settings/security/2fa/enable'
        : '/api/settings/security/2fa/disable';
      const res = await fetch(endpoint, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '2FA update failed');
      showToast('success', json.message);
      setStatus(s => ({ ...s, twofa_enabled: action === 'enable' }));
    } catch (err) {
      showToast('error', err.message);
    } finally {
      set2FASaving(false);
    }
  }

  // ── Sessions ─────────────────────────────────────────────────────────────

  async function handleRevokeSession() {
    const { id } = confirmSession;
    setConfirmSession(null);
    setSessionSaving(true);
    try {
      const res = await fetch('/api/settings/security/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: id ?? null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to revoke session');
      showToast('success', json.message);
      // Refresh session list
      const sRes = await fetch('/api/settings/security/status');
      const sJson = await sRes.json();
      if (sJson.data) setSessions(sJson.data.sessions || []);
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSessionSaving(false);
    }
  }

  return (
    <>
      <style>{settingsSectionStyles + `
        .pw-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
        @media (max-width: 640px) { .pw-grid { grid-template-columns: 1fr; } }
      `}</style>

      {toast && <div className={`settings-toast settings-toast--${toast.type}`}>{toast.msg}</div>}

      {confirm2FA && (
        <ConfirmDialog
          title={confirm2FA === 'enable' ? 'Enable Two-Factor Authentication?' : 'Disable Two-Factor Authentication?'}
          body={
            confirm2FA === 'enable'
              ? 'Enabling 2FA adds an extra layer of security to your account. You will be required to verify your identity on each login.'
              : 'Disabling 2FA reduces your account security. Are you sure you want to proceed?'
          }
          danger={confirm2FA === 'disable'}
          confirmLabel={confirm2FA === 'enable' ? 'Enable 2FA' : 'Disable 2FA'}
          onConfirm={handle2FA}
          onCancel={() => setConfirm2FA(null)}
        />
      )}

      {confirmSession && (
        <ConfirmDialog
          title={confirmSession.id ? 'Revoke Session?' : 'Sign Out All Devices?'}
          body={
            confirmSession.id
              ? 'This session will be immediately invalidated. The device will be signed out.'
              : 'All active sessions across all devices will be revoked. You will remain signed in on this device until your token expires.'
          }
          danger
          confirmLabel={confirmSession.id ? 'Revoke' : 'Sign Out All'}
          onConfirm={handleRevokeSession}
          onCancel={() => setConfirmSession(null)}
        />
      )}

      {/* Password Section */}
      <div className="settings-section-card" style={{ marginBottom: 24 }}>
        <SettingsSectionHeader
          icon="🔑"
          title="Change Password"
          subtitle="Choose a strong password you don't use elsewhere."
        />
        {loading ? (
          <div className="settings-loading">Loading…</div>
        ) : (
          <form onSubmit={handlePasswordSave}>
            <div className="settings-field-group">
              <label className="settings-field-label">Current Password</label>
              <input
                className="settings-input"
                type="password"
                value={pwForm.current}
                onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                autoComplete="current-password"
              />
              {pwErrors.current && <div className="settings-field-error">{pwErrors.current}</div>}
            </div>
            <div className="settings-field-group">
              <label className="settings-field-label">New Password</label>
              <input
                className="settings-input"
                type="password"
                value={pwForm.next}
                onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                autoComplete="new-password"
              />
              {pwErrors.next && <div className="settings-field-error">{pwErrors.next}</div>}
              <div className="settings-field-hint">Minimum 8 characters</div>
            </div>
            <div className="settings-field-group">
              <label className="settings-field-label">Confirm New Password</label>
              <input
                className="settings-input"
                type="password"
                value={pwForm.confirm}
                onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                autoComplete="new-password"
              />
              {pwErrors.confirm && <div className="settings-field-error">{pwErrors.confirm}</div>}
            </div>
            <div className="settings-actions">
              <SaveButton saving={pwSaving} label="Update Password" />
            </div>
          </form>
        )}
      </div>

      {/* 2FA Section */}
      <div className="settings-section-card" style={{ marginBottom: 24 }}>
        <SettingsSectionHeader
          icon="🛡️"
          title="Two-Factor Authentication"
          subtitle="Add an extra layer of protection to your account."
        />
        {loading ? (
          <div className="settings-loading">Loading…</div>
        ) : (
          <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '.875rem', fontWeight: 500, color: 'var(--ink)', marginBottom: 4 }}>
                Status:{' '}
                <span className={`settings-badge ${status?.twofa_enabled ? 'settings-badge--success' : 'settings-badge--neutral'}`}>
                  {status?.twofa_enabled ? '✓ Enabled' : 'Disabled'}
                </span>
              </div>
              {status?.twofa_enabled_at && (
                <div style={{ fontSize: '.78rem', color: 'var(--ink-faint)' }}>
                  Enabled on {new Date(status.twofa_enabled_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                </div>
              )}
              <div style={{ fontSize: '.77rem', color: 'var(--ink-faint)', marginTop: 4 }}>
                Note: Full TOTP/authenticator app setup will be available in a future release.
              </div>
            </div>
            <button
              className={`settings-btn ${status?.twofa_enabled ? 'settings-btn--danger' : 'settings-btn--primary'}`}
              onClick={() => setConfirm2FA(status?.twofa_enabled ? 'disable' : 'enable')}
              disabled={tfa2Saving}
            >
              {tfa2Saving ? 'Updating…' : status?.twofa_enabled ? 'Disable 2FA' : 'Enable 2FA'}
            </button>
          </div>
        )}
      </div>

      {/* Sessions Section */}
      <div className="settings-section-card">
        <SettingsSectionHeader
          icon="💻"
          title="Active Sessions"
          subtitle="Devices and browsers currently signed in to your account."
        />
        {loading ? (
          <div className="settings-loading">Loading…</div>
        ) : (
          <>
            {sessions.length === 0 ? (
              <div className="settings-empty">No active sessions found.</div>
            ) : (
              <table className="settings-table">
                <thead>
                  <tr>
                    <th>Device / Browser</th>
                    <th>IP Address</th>
                    <th>Started</th>
                    <th>Expires</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontSize: '.82rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.user_agent ? s.user_agent.slice(0, 50) + (s.user_agent.length > 50 ? '…' : '') : '—'}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '.82rem' }}>{s.ip_address || '—'}</td>
                      <td style={{ fontSize: '.82rem', whiteSpace: 'nowrap' }}>
                        {new Date(s.created_at).toLocaleDateString('en-US', { dateStyle: 'short' })}
                      </td>
                      <td style={{ fontSize: '.82rem', whiteSpace: 'nowrap' }}>
                        {new Date(s.expires_at).toLocaleDateString('en-US', { dateStyle: 'short' })}
                      </td>
                      <td>
                        <button
                          className="settings-btn settings-btn--ghost"
                          style={{ fontSize: '.78rem', padding: '4px 10px' }}
                          onClick={() => setConfirmSession({ id: s.id, label: 'Revoke Session' })}
                          disabled={sessionSaving}
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="settings-actions">
              <button
                className="settings-btn settings-btn--danger"
                onClick={() => setConfirmSession({ id: null, label: 'Sign Out All Devices' })}
                disabled={sessionSaving || sessions.length === 0}
              >
                {sessionSaving ? 'Revoking…' : 'Sign Out All Devices'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

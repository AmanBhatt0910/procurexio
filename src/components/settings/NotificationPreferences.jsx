'use client';
// src/components/settings/NotificationPreferences.jsx

import { useState, useEffect } from 'react';
import { settingsSectionStyles, SettingsSectionHeader, ToggleRow, SaveButton } from './shared';

const DEFAULTS = {
  email_rfq_updates:       true,
  email_bid_updates:       true,
  email_contract_updates:  true,
  email_system_alerts:     true,
  email_weekly_digest:     false,
  notify_rfq_updates:      true,
  notify_bid_updates:      true,
  notify_contract_updates: true,
  notify_system_alerts:    true,
  sms_enabled:             false,
  sms_critical_only:       true,
};

function bool(v) { return v === 1 || v === true; }

export default function NotificationPreferences() {
  const [prefs, setPrefs]     = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);

  useEffect(() => {
    fetch('/api/settings/notifications')
      .then(r => r.json())
      .then(j => { if (j.data) setPrefs({ ...DEFAULTS, ...j.data }); })
      .catch(() => setToast({ type: 'error', msg: 'Failed to load notification preferences.' }))
      .finally(() => setLoading(false));
  }, []);

  function toggle(key) {
    setPrefs(p => ({ ...p, [key]: !p[key] }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Update failed');
      setToast({ type: 'success', msg: 'Notification preferences saved.' });
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
          icon="🔔"
          title="Notification Preferences"
          subtitle="Control how and when you receive notifications."
        />

        {loading ? (
          <div className="settings-loading">Loading…</div>
        ) : (
          <form onSubmit={handleSave}>
            {/* Email section */}
            <div className="settings-sub-section">
              <div className="settings-sub-title">Email Notifications</div>
            </div>
            <ToggleRow
              label="RFQ Updates"
              hint="New RFQs, status changes, and deadline reminders"
              checked={bool(prefs.email_rfq_updates)}
              onChange={() => toggle('email_rfq_updates')}
            />
            <ToggleRow
              label="Bid Updates"
              hint="New bids received or status changes on your bids"
              checked={bool(prefs.email_bid_updates)}
              onChange={() => toggle('email_bid_updates')}
            />
            <ToggleRow
              label="Contract Updates"
              hint="Contract awards, amendments, and completions"
              checked={bool(prefs.email_contract_updates)}
              onChange={() => toggle('email_contract_updates')}
            />
            <ToggleRow
              label="System Alerts"
              hint="Security notices, account changes, and platform announcements"
              checked={bool(prefs.email_system_alerts)}
              onChange={() => toggle('email_system_alerts')}
            />
            <ToggleRow
              label="Weekly Digest"
              hint="A weekly summary of activity in your workspace"
              checked={bool(prefs.email_weekly_digest)}
              onChange={() => toggle('email_weekly_digest')}
            />

            <hr className="settings-divider" />

            {/* In-app section */}
            <div className="settings-sub-section">
              <div className="settings-sub-title">In-App Notifications</div>
            </div>
            <ToggleRow
              label="RFQ Updates"
              hint="Bell icon alerts for RFQ activity"
              checked={bool(prefs.notify_rfq_updates)}
              onChange={() => toggle('notify_rfq_updates')}
            />
            <ToggleRow
              label="Bid Updates"
              hint="In-app alerts for bid activity"
              checked={bool(prefs.notify_bid_updates)}
              onChange={() => toggle('notify_bid_updates')}
            />
            <ToggleRow
              label="Contract Updates"
              hint="In-app alerts for contract events"
              checked={bool(prefs.notify_contract_updates)}
              onChange={() => toggle('notify_contract_updates')}
            />
            <ToggleRow
              label="System Alerts"
              hint="In-app platform and security alerts"
              checked={bool(prefs.notify_system_alerts)}
              onChange={() => toggle('notify_system_alerts')}
            />

            <hr className="settings-divider" />

            {/* SMS section */}
            <div className="settings-sub-section">
              <div className="settings-sub-title">SMS Notifications</div>
            </div>
            <ToggleRow
              label="Enable SMS Alerts"
              hint="Requires a verified phone number in Personal Info"
              checked={bool(prefs.sms_enabled)}
              onChange={() => toggle('sms_enabled')}
            />
            <ToggleRow
              label="Critical Alerts Only"
              hint="Only send SMS for urgent events (security, overdue deadlines)"
              checked={bool(prefs.sms_critical_only)}
              onChange={() => toggle('sms_critical_only')}
              disabled={!bool(prefs.sms_enabled)}
            />

            <div className="settings-actions">
              <SaveButton saving={saving} />
            </div>
          </form>
        )}
      </div>
    </>
  );
}

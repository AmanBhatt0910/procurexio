'use client';
// src/components/settings/shared.jsx
// Shared micro-components and styles used across all settings sections

// ── Shared CSS string ─────────────────────────────────────────────────────────
export const settingsSectionStyles = `
  .settings-section-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    overflow: hidden;
  }
  .settings-section-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }
  .settings-section-icon { font-size: 1.2rem; margin-top: 1px; flex-shrink: 0; }
  .settings-section-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 1rem;
    color: var(--ink);
    letter-spacing: -.02em;
    margin-bottom: 2px;
  }
  .settings-section-subtitle {
    font-size: .82rem;
    color: var(--ink-soft);
    line-height: 1.5;
  }
  .settings-loading {
    padding: 32px 24px;
    color: var(--ink-faint);
    font-size: .855rem;
    font-family: 'DM Sans', sans-serif;
  }
  .settings-field-row {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 14px 24px;
    border-bottom: 1px solid var(--border);
  }
  .settings-field-row:last-of-type { border-bottom: none; }
  .settings-field-label {
    font-size: .71rem;
    font-weight: 600;
    letter-spacing: .07em;
    text-transform: uppercase;
    color: var(--ink-faint);
  }
  .settings-field-value {
    font-size: .88rem;
    font-weight: 500;
    color: var(--ink);
  }
  .settings-field-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 14px 24px;
    border-bottom: 1px solid var(--border);
  }
  .settings-field-group:last-of-type { border-bottom: none; }
  .settings-input {
    width: 100%;
    max-width: 440px;
    padding: 9px 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: .875rem;
    color: var(--ink);
    background: var(--white);
    outline: none;
    transition: border-color .15s;
    box-sizing: border-box;
  }
  .settings-input:focus { border-color: var(--accent); }
  .settings-input:disabled {
    background: var(--surface);
    color: var(--ink-faint);
    cursor: not-allowed;
  }
  .settings-select {
    width: 100%;
    max-width: 440px;
    padding: 9px 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: .875rem;
    color: var(--ink);
    background: var(--white);
    outline: none;
    cursor: pointer;
    transition: border-color .15s;
    box-sizing: border-box;
  }
  .settings-select:focus { border-color: var(--accent); }
  .settings-textarea {
    width: 100%;
    max-width: 440px;
    padding: 9px 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: .875rem;
    color: var(--ink);
    background: var(--white);
    outline: none;
    resize: vertical;
    min-height: 80px;
    transition: border-color .15s;
    box-sizing: border-box;
  }
  .settings-textarea:focus { border-color: var(--accent); }
  .settings-field-hint {
    font-size: .77rem;
    color: var(--ink-faint);
  }
  .settings-field-error {
    font-size: .77rem;
    color: #dc2626;
  }
  .settings-actions {
    padding: 16px 24px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-top: 1px solid var(--border);
    background: var(--surface);
  }
  .settings-btn {
    padding: 9px 20px;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: .855rem;
    font-weight: 500;
    cursor: pointer;
    transition: background .15s, opacity .15s;
    border: none;
  }
  .settings-btn--primary {
    background: var(--accent);
    color: #fff;
  }
  .settings-btn--primary:hover:not(:disabled) { background: var(--accent-h); }
  .settings-btn--primary:disabled { opacity: .6; cursor: not-allowed; }
  .settings-btn--ghost {
    background: none;
    color: var(--ink-soft);
    border: 1px solid var(--border);
  }
  .settings-btn--ghost:hover { background: var(--surface); color: var(--ink); }
  .settings-btn--danger {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }
  .settings-btn--danger:hover:not(:disabled) { background: #fee2e2; }
  .settings-btn--danger:disabled { opacity: .6; cursor: not-allowed; }
  .settings-toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 24px;
    border-bottom: 1px solid var(--border);
  }
  .settings-toggle-row:last-of-type { border-bottom: none; }
  .settings-toggle-info { flex: 1; min-width: 0; }
  .settings-toggle-label {
    font-size: .875rem;
    font-weight: 500;
    color: var(--ink);
    margin-bottom: 2px;
  }
  .settings-toggle-hint { font-size: .77rem; color: var(--ink-faint); }
  .settings-toggle {
    position: relative;
    width: 44px;
    height: 24px;
    flex-shrink: 0;
    margin-left: 16px;
  }
  .settings-toggle input { opacity: 0; width: 0; height: 0; }
  .settings-toggle-slider {
    position: absolute;
    inset: 0;
    background: #d1d5db;
    border-radius: 24px;
    cursor: pointer;
    transition: background .2s;
  }
  .settings-toggle-slider::before {
    content: '';
    position: absolute;
    width: 18px;
    height: 18px;
    left: 3px;
    top: 3px;
    background: #fff;
    border-radius: 50%;
    transition: transform .2s;
    box-shadow: 0 1px 3px rgba(0,0,0,.2);
  }
  .settings-toggle input:checked + .settings-toggle-slider { background: var(--accent); }
  .settings-toggle input:checked + .settings-toggle-slider::before { transform: translateX(20px); }
  .settings-divider {
    border: none;
    border-top: 1px solid var(--border);
    margin: 0;
  }
  .settings-sub-section {
    padding: 16px 24px 8px;
  }
  .settings-sub-title {
    font-family: 'Syne', sans-serif;
    font-weight: 600;
    font-size: .82rem;
    color: var(--ink-faint);
    letter-spacing: .06em;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .settings-toast {
    padding: 12px 18px;
    border-radius: var(--radius);
    font-size: .855rem;
    font-family: 'DM Sans', sans-serif;
    margin-bottom: 16px;
    font-weight: 500;
  }
  .settings-toast--success {
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #a7f3d0;
  }
  .settings-toast--error {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }
  .settings-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 99px;
    font-size: .72rem;
    font-weight: 600;
  }
  .settings-badge--success { background: #d1fae5; color: #065f46; }
  .settings-badge--warning { background: #fef3c7; color: #92400e; }
  .settings-badge--neutral { background: #f3f4f6; color: #4b5563; }
  .settings-table {
    width: 100%;
    border-collapse: collapse;
    font-size: .875rem;
    font-family: 'DM Sans', sans-serif;
  }
  .settings-table th {
    font-size: .7rem;
    font-weight: 600;
    letter-spacing: .07em;
    text-transform: uppercase;
    color: var(--ink-faint);
    padding: 10px 16px;
    text-align: left;
    border-bottom: 1px solid var(--border);
  }
  .settings-table td {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    vertical-align: middle;
  }
  .settings-table tr:last-child td { border-bottom: none; }
  .settings-table tr:hover td { background: #faf9f7; }
  .settings-empty {
    padding: 28px 24px;
    text-align: center;
    color: var(--ink-faint);
    font-size: .855rem;
    font-family: 'DM Sans', sans-serif;
  }
  .settings-confirm-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.35);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }
  .settings-confirm-box {
    background: var(--white);
    border-radius: var(--radius);
    padding: 28px;
    max-width: 420px;
    width: 100%;
    box-shadow: 0 8px 32px rgba(0,0,0,.18);
  }
  .settings-confirm-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 1rem;
    color: var(--ink);
    margin-bottom: 8px;
    letter-spacing: -.02em;
  }
  .settings-confirm-body {
    font-size: .875rem;
    color: var(--ink-soft);
    margin-bottom: 20px;
    line-height: 1.5;
  }
  .settings-confirm-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }
`;

// ── Shared Components ─────────────────────────────────────────────────────────

export function SettingsSectionHeader({ icon, title, subtitle }) {
  return (
    <div className="settings-section-header">
      <span className="settings-section-icon">{icon}</span>
      <div>
        <div className="settings-section-title">{title}</div>
        {subtitle && <div className="settings-section-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
}

export function SettingsField({ label, value, readOnly = false }) {
  return (
    <div className="settings-field-row">
      <div className="settings-field-label">{label}</div>
      <div className="settings-field-value">
        {readOnly ? (
          value
        ) : (
          value
        )}
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, disabled = false }) {
  return (
    <label className="settings-toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} disabled={disabled} />
      <span className="settings-toggle-slider" />
    </label>
  );
}

export function ToggleRow({ label, hint, checked, onChange, disabled }) {
  return (
    <div className="settings-toggle-row">
      <div className="settings-toggle-info">
        <div className="settings-toggle-label">{label}</div>
        {hint && <div className="settings-toggle-hint">{hint}</div>}
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

export function SaveButton({ saving, label = 'Save Changes' }) {
  return (
    <button className="settings-btn settings-btn--primary" type="submit" disabled={saving}>
      {saving ? 'Saving…' : label}
    </button>
  );
}

export function ConfirmDialog({ title, body, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }) {
  return (
    <div className="settings-confirm-overlay">
      <div className="settings-confirm-box">
        <div className="settings-confirm-title">{title}</div>
        <div className="settings-confirm-body">{body}</div>
        <div className="settings-confirm-actions">
          <button className="settings-btn settings-btn--ghost" onClick={onCancel}>Cancel</button>
          <button
            className={`settings-btn ${danger ? 'settings-btn--danger' : 'settings-btn--primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

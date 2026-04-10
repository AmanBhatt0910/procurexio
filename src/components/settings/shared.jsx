'use client';
// src/components/settings/shared.jsx
// Shared micro-components and styles used across all settings sections

// ── Shared CSS string ─────────────────────────────────────────────────────────
export const settingsSectionStyles = `
  /* Card wrapper */
  .settings-section-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: 0 1px 4px rgba(15,14,13,.05);
    overflow: hidden;
  }

  /* Card header */
  .settings-section-header {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 20px 24px 18px;
    border-bottom: 1px solid var(--border);
    background: linear-gradient(to right, var(--surface), var(--white));
  }
  .settings-section-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 9px;
    background: #fdf3ef;
    color: var(--accent);
    flex-shrink: 0;
    font-size: 1rem;
  }
  .settings-section-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: .98rem;
    color: var(--ink);
    letter-spacing: -.025em;
    margin-bottom: 3px;
  }
  .settings-section-subtitle {
    font-size: .8rem;
    color: var(--ink-soft);
    line-height: 1.5;
  }

  /* Loading / empty states */
  .settings-loading {
    padding: 36px 24px;
    color: var(--ink-faint);
    font-size: .855rem;
    font-family: 'DM Sans', sans-serif;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .settings-loading::before {
    content: '';
    display: inline-block;
    width: 14px; height: 14px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin .7s linear infinite;
    flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .settings-empty {
    padding: 36px 24px;
    text-align: center;
    color: var(--ink-faint);
    font-size: .855rem;
    font-family: 'DM Sans', sans-serif;
  }

  /* Read-only field rows */
  .settings-field-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 13px 24px;
    border-bottom: 1px solid var(--border);
  }
  .settings-field-row:last-of-type { border-bottom: none; }

  /* Editable field groups */
  .settings-field-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 13px 24px;
    border-bottom: 1px solid var(--border);
  }
  .settings-field-group:last-of-type { border-bottom: none; }

  /* Two-column field grid */
  .settings-field-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 1px;
    background: var(--border);
    border-bottom: 1px solid var(--border);
  }
  @media (max-width: 640px) {
    .settings-field-grid { grid-template-columns: 1fr; }
  }
  .settings-field-grid .settings-field-group {
    background: var(--white);
    border-bottom: none;
  }

  /* Labels */
  .settings-field-label {
    font-size: .7rem;
    font-weight: 700;
    letter-spacing: .07em;
    text-transform: uppercase;
    color: var(--ink-faint);
  }
  .settings-field-value {
    font-size: .875rem;
    font-weight: 500;
    color: var(--ink);
  }

  /* Inputs */
  .settings-input {
    width: 100%;
    max-width: 460px;
    padding: 9px 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: .875rem;
    color: var(--ink);
    background: var(--white);
    outline: none;
    transition: border-color .15s, box-shadow .15s;
    box-sizing: border-box;
  }
  .settings-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(200,80,26,.1);
  }
  .settings-input:disabled {
    background: var(--surface);
    color: var(--ink-faint);
    cursor: not-allowed;
  }
  .settings-select {
    width: 100%;
    max-width: 460px;
    padding: 9px 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: .875rem;
    color: var(--ink);
    background: var(--white);
    outline: none;
    cursor: pointer;
    transition: border-color .15s, box-shadow .15s;
    box-sizing: border-box;
    appearance: auto;
  }
  .settings-select:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(200,80,26,.1);
  }
  .settings-select:disabled {
    background: var(--surface);
    color: var(--ink-faint);
    cursor: not-allowed;
  }
  .settings-textarea {
    width: 100%;
    max-width: 460px;
    padding: 9px 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: .875rem;
    color: var(--ink);
    background: var(--white);
    outline: none;
    resize: vertical;
    min-height: 84px;
    transition: border-color .15s, box-shadow .15s;
    box-sizing: border-box;
  }
  .settings-textarea:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(200,80,26,.1);
  }
  .settings-field-hint {
    font-size: .76rem;
    color: var(--ink-faint);
    line-height: 1.4;
  }
  .settings-field-error {
    font-size: .76rem;
    color: #dc2626;
    font-weight: 500;
  }

  /* Actions bar */
  .settings-actions {
    padding: 14px 24px;
    display: flex;
    align-items: center;
    gap: 10px;
    border-top: 1px solid var(--border);
    background: var(--surface);
  }

  /* Buttons */
  .settings-btn {
    padding: 9px 20px;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: .845rem;
    font-weight: 500;
    cursor: pointer;
    transition: background .15s, opacity .15s, transform .1s;
    border: none;
    line-height: 1;
  }
  .settings-btn:active:not(:disabled) { transform: scale(.98); }
  .settings-btn--primary {
    background: var(--accent);
    color: #fff;
    box-shadow: 0 1px 3px rgba(200,80,26,.3);
  }
  .settings-btn--primary:hover:not(:disabled) { background: var(--accent-h); }
  .settings-btn--primary:disabled { opacity: .55; cursor: not-allowed; }
  .settings-btn--ghost {
    background: var(--white);
    color: var(--ink-soft);
    border: 1px solid var(--border);
  }
  .settings-btn--ghost:hover:not(:disabled) { background: var(--surface); color: var(--ink); }
  .settings-btn--danger {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }
  .settings-btn--danger:hover:not(:disabled) { background: #fee2e2; }
  .settings-btn--danger:disabled { opacity: .55; cursor: not-allowed; }

  /* Toggle rows */
  .settings-toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 13px 24px;
    border-bottom: 1px solid var(--border);
    gap: 16px;
  }
  .settings-toggle-row:last-of-type { border-bottom: none; }
  .settings-toggle-info { flex: 1; min-width: 0; }
  .settings-toggle-label {
    font-size: .875rem;
    font-weight: 500;
    color: var(--ink);
    margin-bottom: 2px;
  }
  .settings-toggle-hint { font-size: .77rem; color: var(--ink-faint); line-height: 1.4; }
  .settings-toggle {
    position: relative;
    width: 44px;
    height: 24px;
    flex-shrink: 0;
  }
  .settings-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
  .settings-toggle-slider {
    position: absolute;
    inset: 0;
    background: #d1d5db;
    border-radius: 24px;
    cursor: pointer;
    transition: background .18s;
  }
  .settings-toggle-slider::before {
    content: '';
    position: absolute;
    width: 18px; height: 18px;
    left: 3px; top: 3px;
    background: #fff;
    border-radius: 50%;
    transition: transform .18s;
    box-shadow: 0 1px 3px rgba(0,0,0,.18);
  }
  .settings-toggle input:checked + .settings-toggle-slider { background: var(--accent); }
  .settings-toggle input:checked + .settings-toggle-slider::before { transform: translateX(20px); }
  .settings-toggle input:disabled + .settings-toggle-slider { opacity: .4; cursor: not-allowed; }

  /* Divider */
  .settings-divider {
    border: none;
    border-top: 1px solid var(--border);
    margin: 0;
  }

  /* Sub section label */
  .settings-sub-section { padding: 14px 24px 6px; }
  .settings-sub-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: .7rem;
    color: var(--ink-faint);
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  /* Toast */
  .settings-toast {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-radius: 10px;
    font-size: .845rem;
    font-family: 'DM Sans', sans-serif;
    margin-bottom: 16px;
    font-weight: 500;
    animation: toastSlide .2s ease;
  }
  @keyframes toastSlide {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .settings-toast--success {
    background: #f0fdf4;
    color: #166534;
    border: 1px solid #bbf7d0;
  }
  .settings-toast--error {
    background: #fef2f2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }

  /* Inline badges */
  .settings-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 9px;
    border-radius: 99px;
    font-size: .71rem;
    font-weight: 600;
    letter-spacing: .02em;
  }
  .settings-badge--success { background: #d1fae5; color: #065f46; }
  .settings-badge--warning { background: #fef3c7; color: #92400e; }
  .settings-badge--neutral { background: #f3f4f6; color: #4b5563; }
  .settings-badge--locked  { background: #f0f4ff; color: #3b4ea6; }

  /* Table */
  .settings-table {
    width: 100%;
    border-collapse: collapse;
    font-size: .86rem;
    font-family: 'DM Sans', sans-serif;
  }
  .settings-table th {
    font-size: .68rem;
    font-weight: 700;
    letter-spacing: .07em;
    text-transform: uppercase;
    color: var(--ink-faint);
    padding: 10px 16px;
    text-align: left;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }
  .settings-table td {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    vertical-align: middle;
  }
  .settings-table tr:last-child td { border-bottom: none; }
  .settings-table tbody tr:hover td { background: #faf9f7; }

  /* Confirm dialog */
  .settings-confirm-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.38);
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    animation: fadeIn .15s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .settings-confirm-box {
    background: var(--white);
    border-radius: 12px;
    padding: 28px;
    max-width: 420px;
    width: 100%;
    box-shadow: 0 8px 40px rgba(0,0,0,.18);
    animation: scaleIn .18s ease;
  }
  @keyframes scaleIn { from { transform: scale(.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
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
    margin-bottom: 22px;
    line-height: 1.55;
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
      <div className="settings-section-icon-wrap">{icon}</div>
      <div>
        <div className="settings-section-title">{title}</div>
        {subtitle && <div className="settings-section-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
}

export function SettingsField({ label, value }) {
  return (
    <div className="settings-field-row">
      <div className="settings-field-label">{label}</div>
      <div className="settings-field-value">{value}</div>
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

'use client';
// src/components/settings/BillingPlans.jsx

import { useState, useEffect } from 'react';
import { settingsSectionStyles, SettingsSectionHeader } from './shared';

const PLAN_FEATURES = {
  free:       { color: '#6b7280', bg: '#f3f4f6', label: 'Free' },
  pro:        { color: '#c8501a', bg: '#fdf3ef', label: 'Pro' },
  enterprise: { color: '#1d4ed8', bg: '#eff6ff', label: 'Enterprise' },
};

function LimitLabel({ value }) {
  if (value === -1 || value === null) return <span style={{ color: '#065f46', fontWeight: 600 }}>Unlimited</span>;
  return <span>{value.toLocaleString()}</span>;
}

export default function BillingPlans() {
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState(null);

  useEffect(() => {
    fetch('/api/settings/billing')
      .then(r => r.json())
      .then(j => { if (j.data) setBilling(j.data); })
      .catch(() => setToast({ type: 'error', msg: 'Failed to load billing information.' }))
      .finally(() => setLoading(false));
  }, []);

  const planMeta = billing ? (PLAN_FEATURES[billing.plan_name] || PLAN_FEATURES.free) : null;

  return (
    <>
      <style>{settingsSectionStyles + `
        .billing-plan-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 14px; border-radius: 99px;
          font-family: 'Syne', sans-serif; font-weight: 700; font-size: .9rem;
          letter-spacing: -.01em;
        }
        .billing-stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 12px;
          padding: 16px 24px;
        }
        .billing-stat {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 14px 16px;
        }
        .billing-stat-label {
          font-size: .7rem; font-weight: 600; letter-spacing: .07em;
          text-transform: uppercase; color: var(--ink-faint); margin-bottom: 4px;
        }
        .billing-stat-value {
          font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1.3rem;
          color: var(--ink); letter-spacing: -.03em;
        }
      `}</style>

      {toast && <div className={`settings-toast settings-toast--${toast.type}`}>{toast.msg}</div>}

      <div className="settings-section-card">
        <SettingsSectionHeader
          icon="💳"
          title="Billing & Plans"
          subtitle="Your current subscription plan and usage limits."
        />

        {loading ? (
          <div className="settings-loading">Loading…</div>
        ) : !billing ? (
          <div className="settings-empty">
            No active subscription found. Contact your administrator to set up a plan.
          </div>
        ) : (
          <>
            {/* Current plan badge */}
            <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
              <span
                className="billing-plan-badge"
                style={{ background: planMeta?.bg, color: planMeta?.color }}
              >
                {planMeta?.label || billing.plan_name}
              </span>
              <div>
                <div style={{ fontSize: '.88rem', fontWeight: 500, color: 'var(--ink)' }}>
                  {billing.price === 0 ? 'Free' : `$${parseFloat(billing.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}/mo`}
                </div>
                <div style={{ fontSize: '.78rem', color: 'var(--ink-faint)', marginTop: 2 }}>
                  Status:{' '}
                  <span className={`settings-badge ${billing.status === 'active' ? 'settings-badge--success' : 'settings-badge--neutral'}`}>
                    {billing.status}
                  </span>
                </div>
              </div>
              {billing.ends_at && (
                <div style={{ fontSize: '.78rem', color: 'var(--ink-soft)' }}>
                  Renews / Expires: {new Date(billing.ends_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                </div>
              )}
            </div>

            {/* Usage limits */}
            <div className="billing-stat-grid">
              <div className="billing-stat">
                <div className="billing-stat-label">RFQs / Month</div>
                <div className="billing-stat-value"><LimitLabel value={billing.rfq_limit} /></div>
              </div>
              <div className="billing-stat">
                <div className="billing-stat-label">Vendors</div>
                <div className="billing-stat-value"><LimitLabel value={billing.vendor_limit} /></div>
              </div>
              <div className="billing-stat">
                <div className="billing-stat-label">Users</div>
                <div className="billing-stat-value"><LimitLabel value={billing.user_limit} /></div>
              </div>
              <div className="billing-stat">
                <div className="billing-stat-label">Emails / Month</div>
                <div className="billing-stat-value"><LimitLabel value={billing.email_limit} /></div>
              </div>
            </div>

            {/* Features */}
            {billing.features && (
              <div style={{ padding: '0 24px 20px' }}>
                <div className="settings-sub-title" style={{ marginBottom: 10 }}>Features Included</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {Object.entries(
                    typeof billing.features === 'string' ? JSON.parse(billing.features) : billing.features
                  ).map(([key, enabled]) => (
                    <span
                      key={key}
                      className={`settings-badge ${enabled ? 'settings-badge--success' : 'settings-badge--neutral'}`}
                    >
                      {enabled ? '✓' : '✕'}{' '}
                      {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="settings-actions">
              <a
                href="/dashboard/company"
                className="settings-btn settings-btn--primary"
                style={{ textDecoration: 'none' }}
              >
                Manage Subscription →
              </a>
            </div>
          </>
        )}
      </div>
    </>
  );
}

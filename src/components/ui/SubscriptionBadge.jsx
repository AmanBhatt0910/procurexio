'use client';
// src/components/ui/SubscriptionBadge.jsx

/**
 * SubscriptionBadge — displays the current subscription plan prominently.
 *
 * Props:
 *   plan        {string}   - 'free' | 'pro' | 'enterprise'
 *   limits      {object}   - optional { rfq_limit, vendor_limit, user_limit }
 *   size        {string}   - 'small' | 'medium' | 'large'  (default: 'medium')
 *   showUpgrade {boolean}  - show upgrade button for non-enterprise plans
 *   onUpgrade   {function} - callback when upgrade button is clicked
 */

const PLAN_CONFIG = {
  free: {
    label: 'Free',
    bg: 'var(--surface)',
    color: 'var(--ink-soft)',
    border: 'var(--border)',
    accentBg: '#f3f4f6',
    icon: '🆓',
    limitLabel: 'Up to 5 users · 10 RFQs/month',
  },
  pro: {
    label: 'Pro',
    bg: '#eff6ff',
    color: '#1e40af',
    border: '#bfdbfe',
    accentBg: '#dbeafe',
    icon: '⭐',
    limitLabel: 'Up to 25 users · 100 RFQs/month',
  },
  enterprise: {
    label: 'Enterprise',
    bg: '#f5f3ff',
    color: '#6b21a8',
    border: '#ddd6fe',
    accentBg: '#ede9fe',
    icon: '🏢',
    limitLabel: 'Unlimited users & RFQs',
  },
};

function formatLimit(value) {
  if (value == null || value < 0) return '∞';
  return value.toLocaleString();
}

export default function SubscriptionBadge({
  plan = 'free',
  limits = null,
  size = 'medium',
  showUpgrade = false,
  onUpgrade = null,
}) {
  const planKey = (plan || 'free').toLowerCase();
  const cfg = PLAN_CONFIG[planKey] || PLAN_CONFIG.free;
  const isEnterprise = planKey === 'enterprise';

  // ── Size variants ──────────────────────────────────────────────────────────
  if (size === 'small') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 10px',
          borderRadius: 20,
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          color: cfg.color,
          fontSize: '.72rem',
          fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
          whiteSpace: 'nowrap',
          letterSpacing: '.01em',
        }}
        title={cfg.limitLabel}
      >
        <span aria-hidden="true">{cfg.icon}</span>
        {cfg.label}
      </span>
    );
  }

  if (size === 'large') {
    return (
      <div
        style={{
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          borderRadius: 12,
          padding: '20px 24px',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontSize: '1.5rem',
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: cfg.accentBg,
                borderRadius: 10,
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              {cfg.icon}
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink)', letterSpacing: '-.02em' }}>
                  {cfg.label} Plan
                </span>
                <span
                  style={{
                    background: cfg.accentBg,
                    color: cfg.color,
                    border: `1px solid ${cfg.border}`,
                    borderRadius: 20,
                    padding: '1px 8px',
                    fontSize: '.68rem',
                    fontWeight: 700,
                    letterSpacing: '.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {cfg.label}
                </span>
              </div>
              <div style={{ fontSize: '.82rem', color: 'var(--ink-soft)' }}>
                {limits
                  ? `${formatLimit(limits.user_limit)} users · ${formatLimit(limits.rfq_limit)} RFQs/month · ${formatLimit(limits.vendor_limit)} vendors`
                  : cfg.limitLabel}
              </div>
            </div>
          </div>

          {showUpgrade && !isEnterprise && (
            <button
              type="button"
              onClick={onUpgrade}
              style={{
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                padding: '9px 18px',
                borderRadius: 8,
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
                fontSize: '.85rem',
                cursor: 'pointer',
                transition: 'background .15s',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-h)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}
            >
              ⬆ Upgrade Plan
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Medium (default) ───────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: 10,
        padding: '8px 14px',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <span
        style={{
          fontSize: '1.1rem',
          width: 30,
          height: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: cfg.accentBg,
          borderRadius: 7,
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        {cfg.icon}
      </span>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 600, fontSize: '.88rem', color: 'var(--ink)' }}>
            {cfg.label} Plan
          </span>
          <span
            style={{
              background: cfg.accentBg,
              color: cfg.color,
              border: `1px solid ${cfg.border}`,
              borderRadius: 20,
              padding: '1px 7px',
              fontSize: '.65rem',
              fontWeight: 700,
              letterSpacing: '.04em',
              textTransform: 'uppercase',
            }}
          >
            {cfg.label}
          </span>
        </div>
        <div style={{ fontSize: '.75rem', color: 'var(--ink-soft)', marginTop: 1 }}>
          {limits
            ? `${formatLimit(limits.user_limit)} users · ${formatLimit(limits.rfq_limit)} RFQs · ${formatLimit(limits.vendor_limit)} vendors`
            : cfg.limitLabel}
        </div>
      </div>
      {showUpgrade && !isEnterprise && (
        <button
          type="button"
          onClick={onUpgrade}
          style={{
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            padding: '6px 12px',
            borderRadius: 7,
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            fontSize: '.78rem',
            cursor: 'pointer',
            transition: 'background .15s',
            whiteSpace: 'nowrap',
            marginLeft: 4,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-h)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}
        >
          Upgrade
        </button>
      )}
    </div>
  );
}

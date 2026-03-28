'use client';

// BidStatusBadge — status pill: draft / submitted / withdrawn
// Usage: <BidStatusBadge status="submitted" />

const CONFIG = {
  draft:     { label: 'Draft',     bg: '#f3f2f0', color: '#6b6660' },
  submitted: { label: 'Submitted', bg: '#e6f4ea', color: '#1e7e34' },
  withdrawn: { label: 'Withdrawn', bg: '#fce8e6', color: '#c62828' },
};

export default function BidStatusBadge({ status }) {
  const cfg = CONFIG[status] ?? { label: status, bg: '#f3f2f0', color: '#6b6660' };
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 10px',
      borderRadius: 20,
      fontSize: '.74rem',
      fontWeight: 600,
      letterSpacing: '.04em',
      textTransform: 'uppercase',
      background: cfg.bg,
      color: cfg.color,
      fontFamily: "'DM Sans', sans-serif",
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}
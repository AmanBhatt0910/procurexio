// src/components/bids/BidStatusBadge.jsx

'use client';

const STATUS_MAP = {
  draft: {
    label: 'Draft',
    bg: '#f3f4f6',
    color: '#4b5563',
    border: '#d1d5db',
  },
  submitted: {
    label: 'Submitted',
    bg: '#dbeafe',
    color: '#1d4ed8',
    border: '#93c5fd',
  },
  withdrawn: {
    label: 'Withdrawn',
    bg: '#fef3c7',
    color: '#92400e',
    border: '#fcd34d',
  },
  awarded: {
    label: 'Awarded',
    bg: '#fef9c3',
    color: '#713f12',
    border: '#fde047',
  },
  rejected: {
    label: 'Rejected',
    bg: '#f3f4f6',
    color: '#9ca3af',
    border: '#e5e7eb',
  },
};

export default function BidStatusBadge({ status }) {
  const cfg = STATUS_MAP[status] || {
    label: status || 'Unknown',
    bg: '#f3f4f6',
    color: '#6b7280',
    border: '#e5e7eb',
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 10px',
        borderRadius: '999px',
        fontSize: '.72rem',
        fontWeight: 600,
        letterSpacing: '.04em',
        textTransform: 'uppercase',
        fontFamily: "'DM Sans', sans-serif",
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'currentColor',
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </span>
  );
}
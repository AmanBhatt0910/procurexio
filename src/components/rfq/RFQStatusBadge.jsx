// src/components/rfq/RFQStatusBadge.jsx
'use client';

const STATUS_CONFIG = {
  draft:      { label: 'Draft',      bg: '#f0ede8', color: '#6b6660' },
  published:  { label: 'Published',  bg: '#e8f2ea', color: '#2d7a3a' },
  closed:     { label: 'Closed',     bg: '#e8edf5', color: '#2a4a8c' },
  cancelled:  { label: 'Cancelled',  bg: '#fdecea', color: '#c0392b' },
};

export default function RFQStatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '.72rem',
      fontWeight: 600,
      letterSpacing: '.04em',
      textTransform: 'uppercase',
      backgroundColor: cfg.bg,
      color: cfg.color,
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        backgroundColor: cfg.color,
        flexShrink: 0,
      }} />
      {cfg.label}
    </span>
  );
}
'use client';
// src/components/rfq/RFQStatusBadge.jsx

const STATUS_CONFIG = {
  draft:     { label: 'Draft',     bg: '#F1EFE8', color: '#5F5E5A', dot: '#888780' },
  published: { label: 'Published', bg: '#EAF3DE', color: '#3B6D11', dot: '#639922' },
  closed:    { label: 'Closed',    bg: '#E6F1FB', color: '#185FA5', dot: '#378ADD' },
  cancelled: { label: 'Cancelled', bg: '#FCEBEB', color: '#A32D2D', dot: '#E24B4A' },
};

export default function RFQStatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '3px 9px 3px 7px',
      borderRadius: 20,
      fontSize: '.71rem',
      fontWeight: 600,
      letterSpacing: '.05em',
      textTransform: 'uppercase',
      backgroundColor: cfg.bg,
      color: cfg.color,
      whiteSpace: 'nowrap',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <span style={{
        width: 5,
        height: 5,
        borderRadius: '50%',
        backgroundColor: cfg.dot,
        flexShrink: 0,
        display: 'inline-block',
      }} />
      {cfg.label}
    </span>
  );
}
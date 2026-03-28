// BidStatusBadge — status pill: draft / submitted / withdrawn
// Usage: <BidStatusBadge status="submitted" />

'use client';

export default function BidStatusBadge({ status }) {
  const map = {
    draft:     { label: 'Draft',     color: '#b8b3ae', bg: '#f5f4f2' },
    submitted: { label: 'Submitted', color: '#1a7a4a', bg: '#e8f5ee' },
    withdrawn: { label: 'Withdrawn', color: '#c8501a', bg: '#fdf0eb' },
  };
  const cfg = map[status] || { label: status, color: '#6b6660', bg: '#f5f4f2' };

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '20px',
      background: cfg.bg, color: cfg.color,
      fontSize: '.72rem', fontWeight: 600,
      letterSpacing: '.04em', textTransform: 'uppercase',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: cfg.color, flexShrink: 0,
      }} />
      {cfg.label}
    </span>
  );
}
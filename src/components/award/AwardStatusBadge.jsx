// src/components/award/AwardStatusBadge.jsx
'use client';

export default function AwardStatusBadge({ status }) {
  const styles = {
    active: {
      background: '#d1fae5',
      color: '#065f46',
      border: '1px solid #6ee7b7',
    },
    cancelled: {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fca5a5',
    },
  };

  const labels = {
    active: 'Active',
    cancelled: 'Cancelled',
  };

  const style = styles[status] || styles.active;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '3px 10px',
      borderRadius: '99px',
      fontSize: '.72rem',
      fontWeight: 600,
      letterSpacing: '.04em',
      textTransform: 'uppercase',
      fontFamily: "'DM Sans', sans-serif",
      ...style,
    }}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: 'currentColor',
        display: 'inline-block',
      }} />
      {labels[status] || status}
    </span>
  );
}
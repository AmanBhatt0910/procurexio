// src/components/vendors/VendorStatusBadge.jsx
'use client';

const STATUS_STYLES = {
  active: {
    background: '#dcfce7',
    color: '#166534',
    label: 'Active',
  },
  inactive: {
    background: '#f1f5f9',
    color: '#475569',
    label: 'Inactive',
  },
  pending: {
    background: '#fef9c3',
    color: '#854d0e',
    label: 'Pending',
  },
};

export default function VendorStatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '3px 9px',
      borderRadius: 99,
      fontSize: '.75rem',
      fontWeight: 500,
      fontFamily: 'DM Sans, sans-serif',
      background: s.background,
      color: s.color,
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: s.color,
        flexShrink: 0,
      }} />
      {s.label}
    </span>
  );
}
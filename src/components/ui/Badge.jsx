// src/components/ui/Badge.jsx

const VARIANTS = {
  // Role badges
  super_admin:   { bg: '#f0eaff', color: '#6b21a8' },
  company_admin: { bg: '#fef3c7', color: '#92400e' },
  manager:       { bg: '#dbeafe', color: '#1e40af' },
  employee:      { bg: '#dcfce7', color: '#166534' },
  vendor_user:   { bg: '#ffe4e6', color: '#9f1239' },
  // Status / plan badges
  free:          { bg: 'var(--surface)', color: 'var(--ink-soft)', border: '1px solid var(--border)' },
  pro:           { bg: '#dbeafe', color: '#1e40af' },
  enterprise:    { bg: '#f0eaff', color: '#6b21a8' },
  active:        { bg: '#dcfce7', color: '#166534' },
  inactive:      { bg: '#fee2e2', color: '#991b1b' },
  pending:       { bg: '#fef9c3', color: '#854d0e' },
  default:       { bg: 'var(--surface)', color: 'var(--ink-soft)', border: '1px solid var(--border)' },
};

export default function Badge({ children, variant }) {
  const style = VARIANTS[variant] ?? VARIANTS.default;

  const LABELS = {
    super_admin:   'Super Admin',
    company_admin: 'Company Admin',
    manager:       'Manager',
    employee:      'Employee',
    vendor_user:   'Vendor',
  };

  const text = LABELS[children] ?? children;

  return (
    <>
      <style>{`
        .badge {
          display: inline-flex;
          align-items: center;
          font-family: 'DM Sans', sans-serif;
          font-size: .72rem;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: 20px;
          letter-spacing: .01em;
          white-space: nowrap;
          line-height: 1.6;
        }
      `}</style>
      <span
        className="badge"
        style={{
          background: style.bg,
          color: style.color,
          border: style.border ?? 'none',
        }}
      >
        {text}
      </span>
    </>
  );
}
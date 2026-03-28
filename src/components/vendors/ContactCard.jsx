// src/components/vendors/ContactCard.jsx
'use client';

/**
 * Displays a single vendor contact.
 * Props:
 *   contact  { id, name, email, phone, is_primary }
 *   onRemove (contactId) => void   — if provided, shows remove button (write roles only)
 */
export default function ContactCard({ contact, onRemove }) {
  const initials = contact.name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 14px',
      borderRadius: 10,
      border: '1px solid var(--border)',
      background: 'var(--white)',
      transition: 'box-shadow .15s',
    }}>
      {/* Avatar */}
      <div style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Syne, sans-serif',
        fontWeight: 700,
        fontSize: '.64rem',
        color: 'var(--ink-soft)',
        flexShrink: 0,
      }}>
        {initials}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          marginBottom: 2,
        }}>
          <span style={{
            fontWeight: 500,
            fontSize: '.875rem',
            fontFamily: 'DM Sans, sans-serif',
            color: 'var(--ink)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {contact.name}
          </span>
          {!!contact.is_primary && (
            <span style={{
              fontSize: '.68rem',
              fontWeight: 600,
              color: '#166534',
              background: '#dcfce7',
              padding: '1px 7px',
              borderRadius: 99,
              fontFamily: 'DM Sans, sans-serif',
              whiteSpace: 'nowrap',
            }}>
              Primary
            </span>
          )}
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '2px 14px',
        }}>
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              style={{
                fontSize: '.78rem',
                color: 'var(--ink-soft)',
                textDecoration: 'none',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {contact.email}
            </a>
          )}
          {contact.phone && (
            <span style={{
              fontSize: '.78rem',
              color: 'var(--ink-faint)',
              fontFamily: 'DM Sans, sans-serif',
            }}>
              {contact.phone}
            </span>
          )}
        </div>
      </div>

      {/* Remove */}
      {onRemove && (
        <button
          onClick={() => onRemove(contact.id)}
          title="Remove contact"
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 6,
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--ink-faint)',
            flexShrink: 0,
            transition: 'border-color .12s, color .12s, background .12s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#fca5a5';
            e.currentTarget.style.color = '#dc2626';
            e.currentTarget.style.background = '#fef2f2';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--ink-faint)';
            e.currentTarget.style.background = 'none';
          }}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M2 2l7 7M9 2L2 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </div>
  );
}

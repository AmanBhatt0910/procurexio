// src/components/vendors/VendorCategoryTag.jsx
'use client';

/**
 * Renders a colored pill for a single category.
 * Props:
 *   name  {string}  - category label
 *   color {string}  - hex color from the palette
 *   onRemove        - optional; if provided, shows an × remove button
 */
export default function VendorCategoryTag({ name, color = '#6b6660', onRemove }) {
  // Derive a very light tinted background from the hex color
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 9px',
      borderRadius: 99,
      fontSize: '.73rem',
      fontWeight: 500,
      fontFamily: 'DM Sans, sans-serif',
      background: `${color}18`,   // 18 = ~9% opacity in hex
      color: color,
      border: `1px solid ${color}33`,  // 33 = ~20% opacity
      whiteSpace: 'nowrap',
    }}>
      {name}
      {onRemove && (
        <button
          onClick={onRemove}
          title={`Remove ${name}`}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            margin: 0,
            cursor: 'pointer',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
            opacity: 0.7,
            lineHeight: 1,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </span>
  );
}
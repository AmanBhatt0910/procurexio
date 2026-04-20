'use client';
// src/components/ui/ViewToggle.jsx

import { ROLES } from '@/lib/auth/rbac';

/**
 * ViewToggle — switches between 'list' and 'grid' views.
 *
 * Props:
 *   view         {string}   - current view: 'list' | 'grid'
 *   onViewChange {function} - called with 'list' or 'grid'
 *   userRole     {string}   - RBAC role; employee/vendor_user cannot use grid
 */
export default function ViewToggle({ view, onViewChange, userRole }) {
  const canUseGrid =
    !!userRole &&
    ![ROLES.EMPLOYEE, ROLES.VENDOR_USER].includes(userRole);

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    transition: 'background .12s, color .12s',
    color: 'var(--ink-soft)',
  };

  const activeStyle = {
    background: 'var(--ink)',
    color: '#fff',
  };

  const disabledStyle = {
    opacity: 0.35,
    cursor: 'not-allowed',
  };

  return (
    <div
      role="group"
      aria-label="View toggle"
      style={{
        display: 'inline-flex',
        border: '1px solid var(--border)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {/* List view button */}
      <button
        type="button"
        onClick={() => onViewChange('list')}
        aria-label="List view"
        aria-pressed={view === 'list'}
        title="List view"
        style={{
          ...baseStyle,
          ...(view === 'list' ? activeStyle : {}),
        }}
        onMouseEnter={e => {
          if (view !== 'list') e.currentTarget.style.background = 'var(--surface)';
        }}
        onMouseLeave={e => {
          if (view !== 'list') e.currentTarget.style.background = 'none';
        }}
      >
        {/* Three horizontal lines icon */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <line x1="2" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="2" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Divider */}
      <div style={{ width: 1, background: 'var(--border)' }} aria-hidden="true" />

      {/* Grid view button */}
      <button
        type="button"
        onClick={() => canUseGrid && onViewChange('grid')}
        disabled={!canUseGrid}
        aria-label={canUseGrid ? 'Grid view' : 'Grid view (not available for your role)'}
        aria-pressed={view === 'grid'}
        title={canUseGrid ? 'Grid view' : 'Grid view is not available for your role'}
        style={{
          ...baseStyle,
          ...(view === 'grid' ? activeStyle : {}),
          ...(!canUseGrid ? disabledStyle : {}),
        }}
        onMouseEnter={e => {
          if (canUseGrid && view !== 'grid') e.currentTarget.style.background = 'var(--surface)';
        }}
        onMouseLeave={e => {
          if (canUseGrid && view !== 'grid') e.currentTarget.style.background = 'none';
        }}
      >
        {/* 2×2 grid icon */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      </button>
    </div>
  );
}

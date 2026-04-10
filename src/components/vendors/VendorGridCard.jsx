'use client';
// src/components/vendors/VendorGridCard.jsx

import VendorStatusBadge from '@/components/vendors/VendorStatusBadge';
import VendorCategoryTag from '@/components/vendors/VendorCategoryTag';

export default function VendorGridCard({ vendor, onView, onDeactivate, canWrite }) {
  const name = vendor.name || '';
  const initials = name.slice(0, 2).toUpperCase() || '??';

  return (
    <>
      <style>{`
        .vendor-grid-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 160px;
          cursor: pointer;
          transition: box-shadow .15s, border-color .15s, transform .15s;
        }
        .vendor-grid-card:hover {
          box-shadow: 0 4px 16px rgba(15,14,13,.08);
          border-color: var(--ink-soft);
          transform: translateY(-1px);
        }
        .vendor-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
        .vendor-card-avatar {
          width: 40px; height: 40px; border-radius: 10px;
          background: var(--surface); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif; font-weight: 700; font-size: .68rem;
          color: var(--ink-soft); flex-shrink: 0;
        }
        .vendor-card-name { font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: .92rem; color: var(--ink); line-height: 1.3; }
        .vendor-card-email { font-size: .76rem; color: var(--ink-faint); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; }
        .vendor-card-cats { display: flex; flex-wrap: wrap; gap: 4px; }
        .vendor-card-footer { margin-top: auto; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .vendor-card-contact { font-size: .76rem; color: var(--ink-soft); font-family: 'DM Sans', sans-serif; }
        .vendor-card-actions { display: flex; gap: 6px; }
        .vendor-card-btn {
          background: none; border: 1px solid var(--border);
          border-radius: 6px; padding: 5px 10px; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: .78rem; color: var(--ink-soft);
          transition: background .12s, color .12s;
        }
        .vendor-card-btn:hover { background: var(--surface); color: var(--ink); }
        .vendor-card-btn-danger:hover { border-color: #fca5a5; color: #dc2626; background: #fef2f2; }
      `}</style>
      <div
        className="vendor-grid-card"
        onClick={() => onView(vendor.id)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onView(vendor.id)}
        aria-label={`Vendor: ${name}`}
      >
        {/* Header */}
        <div className="vendor-card-header">
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div className="vendor-card-avatar">{initials}</div>
            <div style={{ minWidth: 0 }}>
              <div className="vendor-card-name">{name || '—'}</div>
              {vendor.email && <div className="vendor-card-email">{vendor.email}</div>}
            </div>
          </div>
          <VendorStatusBadge status={vendor.status} />
        </div>

        {/* Categories */}
        {(vendor.categories || []).length > 0 && (
          <div className="vendor-card-cats">
            {(vendor.categories || []).map(cat => (
              <VendorCategoryTag key={cat.id} name={cat.name} color={cat.color} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="vendor-card-footer">
          <div className="vendor-card-contact">
            {vendor.primary_contact || <span style={{ color: 'var(--ink-faint)' }}>—</span>}
          </div>
          <div className="vendor-card-actions">
            <button
              className="vendor-card-btn"
              onClick={e => { e.stopPropagation(); onView(vendor.id); }}
            >
              View
            </button>
            {canWrite && vendor.status !== 'inactive' && (
              <button
                className="vendor-card-btn vendor-card-btn-danger"
                onClick={e => { e.stopPropagation(); onDeactivate?.(vendor); }}
              >
                Deactivate
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

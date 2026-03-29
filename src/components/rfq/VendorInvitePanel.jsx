'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

const INVITE_STATUS_COLORS = {
  invited:   { bg: '#e8edf5', color: '#2a4a8c' },
  viewed:    { bg: '#f0ede8', color: '#6b6660' },
  submitted: { bg: '#e8f2ea', color: '#2d7a3a' },
  declined:  { bg: '#fdecea', color: '#c0392b' },
};

function InviteStatusBadge({ status }) {
  const cfg = INVITE_STATUS_COLORS[status] || INVITE_STATUS_COLORS.invited;
  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: 20,
      fontSize: '.7rem',
      fontWeight: 600,
      letterSpacing: '.04em',
      textTransform: 'uppercase',
      background: cfg.bg,
      color: cfg.color,
    }}>
      {status}
    </span>
  );
}

export default function VendorInvitePanel({ rfqId, rfqStatus, invitedVendors, canWrite, onVendorsChange }) {
  const [availableVendors, setAvailableVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const debounceRef = useRef(null);

  const canInvite = canWrite && rfqStatus === 'published';
  const invitedVendorIds = new Set(invitedVendors.map(v => v.vendor_id));

  // Fetch vendors (with search, pagination)
  const fetchVendors = useCallback(async (page = 1, append = false, searchTerm = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: 'active',
        page: page.toString(),
        limit: 20,
      });
      if (searchTerm.trim()) params.set('search', searchTerm);

      const res = await fetch(`/api/vendors?${params}`);
      const json = await res.json();
      if (res.ok) {
        const newVendors = json.data || [];
        setAvailableVendors(prev => append ? [...prev, ...newVendors] : newVendors);
        setPagination(json.pagination);
        setHasMore(page < json.pagination.pages);
      }
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial load & when search changes
  useEffect(() => {
    // Clear debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchVendors(1, false, search);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, fetchVendors]);

  // Load more
  const loadMore = () => {
    if (hasMore && !loadingMore && !loading) {
      setLoadingMore(true);
      fetchVendors(pagination.page + 1, true, search);
    }
  };

  const toggleSelect = (id) => {
    if (invitedVendorIds.has(id)) return; // cannot select already invited
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleInvite = async () => {
    if (selected.size === 0) return;
    setInviting(true);
    setError('');
    try {
      const res = await fetch(`/api/rfqs/${rfqId}/vendors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorIds: [...selected] }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      if (json.data?.warnings?.length > 0) {
        setError(json.data.warnings.map(w => w.warning).join('; '));
      }
      // Refresh invited vendors list
      const refreshRes = await fetch(`/api/rfqs/${rfqId}/vendors`);
      const refreshJson = await refreshRes.json();
      if (refreshRes.ok) onVendorsChange(refreshJson.data.vendors);
      // Clear selection and refresh available vendors (to remove newly invited ones)
      setSelected(new Set());
      fetchVendors(1, false, search);
    } catch { setError('Network error'); }
    setInviting(false);
  };

  const handleRemove = async (vendorId) => {
    setRemoving(vendorId);
    setError('');
    try {
      const res = await fetch(`/api/rfqs/${rfqId}/vendors/${vendorId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) { setError(json.error); setRemoving(null); return; }
      onVendorsChange(invitedVendors.filter(v => v.vendor_id !== vendorId));
      // Also refresh available vendors list (the removed vendor becomes available again)
      fetchVendors(1, false, search);
    } catch { setError('Network error'); }
    setRemoving(null);
  };

  const clearSearch = () => {
    setSearch('');
    setSelected(new Set());
  };

  return (
    <div>
      {error && (
        <div style={{ background: '#fdecea', color: '#c0392b', padding: '8px 12px',
          borderRadius: 'var(--radius)', fontSize: '.82rem', marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* Invited vendors list */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, fontSize: '.8rem', marginBottom: 8, color: 'var(--ink)' }}>
          Invited Vendors
        </div>
        {invitedVendors.length === 0 ? (
          <p style={{ color: 'var(--ink-faint)', fontSize: '.84rem', fontStyle: 'italic', marginBottom: 8 }}>
            No vendors invited yet
          </p>
        ) : (
          <div>
            {invitedVendors.map(v => (
              <div key={v.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                marginBottom: 6,
                background: 'var(--white)',
              }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '.88rem', color: 'var(--ink)' }}>
                    {v.vendor_name}
                    {v.vendor_status !== 'active' && (
                      <span style={{ marginLeft: 6, fontSize: '.7rem', color: 'var(--accent)', fontWeight: 600 }}>
                        ({v.vendor_status})
                      </span>
                    )}
                  </div>
                  {v.vendor_email && (
                    <div style={{ fontSize: '.78rem', color: 'var(--ink-faint)' }}>{v.vendor_email}</div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <InviteStatusBadge status={v.invite_status} />
                  {canInvite && v.invite_status !== 'submitted' && (
                    <button
                      onClick={() => handleRemove(v.vendor_id)}
                      disabled={removing === v.vendor_id}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--ink-faint)', fontSize: '1rem', lineHeight: 1,
                        padding: '2px 4px', borderRadius: 4,
                      }}
                      title="Remove vendor"
                    >
                      {removing === v.vendor_id ? '…' : '×'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite new vendors section */}
      {canInvite && (
        <div>
          <div style={{ fontWeight: 600, fontSize: '.8rem', marginBottom: 8, color: 'var(--ink)' }}>
            Invite New Vendors
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              style={{
                width: '100%',
                padding: '9px 12px',
                paddingRight: search ? '60px' : '12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontSize: '.84rem',
                fontFamily: 'inherit',
                color: 'var(--ink)',
                background: 'var(--white)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {search && (
              <button
                onClick={clearSearch}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '.8rem',
                  color: 'var(--ink-faint)',
                  padding: '4px 8px',
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Vendor list */}
          {loading && availableVendors.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--ink-faint)' }}>
              Loading vendors...
            </div>
          ) : availableVendors.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--ink-faint)' }}>
              No active vendors found
            </div>
          ) : (
            <div style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              background: 'var(--white)',
              maxHeight: 280,
              overflowY: 'auto',
              marginBottom: 12,
            }}>
              {availableVendors.map(v => {
                const alreadyInvited = invitedVendorIds.has(v.id);
                const isSelected = selected.has(v.id);
                return (
                  <div
                    key={v.id}
                    onClick={() => !alreadyInvited && toggleSelect(v.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      cursor: alreadyInvited ? 'default' : 'pointer',
                      borderBottom: '1px solid var(--border)',
                      background: isSelected ? '#e8edf5' : 'transparent',
                      opacity: alreadyInvited ? 0.6 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      disabled={alreadyInvited}
                      style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: '.85rem' }}>{v.name}</div>
                      {v.email && <div style={{ fontSize: '.76rem', color: 'var(--ink-faint)' }}>{v.email}</div>}
                    </div>
                    {alreadyInvited && (
                      <span style={{ fontSize: '.7rem', color: 'var(--ink-faint)' }}>
                        Already invited
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Load more button */}
          {hasMore && !loading && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '6px 12px',
                fontSize: '.8rem',
                cursor: 'pointer',
                marginBottom: 12,
                width: '100%',
                textAlign: 'center',
                color: 'var(--ink-soft)',
              }}
            >
              {loadingMore ? 'Loading...' : 'Load more vendors'}
            </button>
          )}

          {/* Invite button */}
          {selected.size > 0 && (
            <button
              onClick={handleInvite}
              disabled={inviting}
              style={{
                width: '100%',
                padding: '10px',
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius)',
                fontSize: '.86rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-h)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
            >
              {inviting ? 'Inviting...' : `Invite ${selected.size} vendor${selected.size !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
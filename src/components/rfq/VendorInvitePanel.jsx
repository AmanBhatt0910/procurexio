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
      padding: '3px 9px',
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
      const params = new URLSearchParams({ page: page.toString(), limit: 20 });
      if (searchTerm.trim()) params.set('search', searchTerm);
      const res  = await fetch(`/api/vendors?${params}`);
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
  }, [search]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { fetchVendors(1, false, search); }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, fetchVendors]);

  const loadMore = () => {
    if (hasMore && !loadingMore && !loading) {
      setLoadingMore(true);
      fetchVendors(pagination.page + 1, true, search);
    }
  };

  const toggleSelect = (id) => {
    if (invitedVendorIds.has(id)) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleInvite = async () => {
    if (selected.size === 0) return;
    setInviting(true);
    setError('');
    try {
      const res = await fetch(`/api/rfqs/${rfqId}/vendors`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ vendorIds: [...selected] }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      if (json.data?.warnings?.length > 0) {
        setError(json.data.warnings.map(w => w.warning).join('; '));
      }
      const refreshRes  = await fetch(`/api/rfqs/${rfqId}/vendors`);
      const refreshJson = await refreshRes.json();
      if (refreshRes.ok) onVendorsChange(refreshJson.data.vendors);
      setSelected(new Set());
      fetchVendors(1, false, search);
    } catch { setError('Network error'); }
    setInviting(false);
  };

  const handleRemove = async (vendorId) => {
    setRemoving(vendorId);
    setError('');
    try {
      const res  = await fetch(`/api/rfqs/${rfqId}/vendors/${vendorId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) { setError(json.error); setRemoving(null); return; }
      onVendorsChange(invitedVendors.filter(v => v.vendor_id !== vendorId));
      fetchVendors(1, false, search);
    } catch { setError('Network error'); }
    setRemoving(null);
  };

  const clearSearch = () => { setSearch(''); setSelected(new Set()); };

  // ── Not-yet-published hint ─────────────────────────────────────────────────
  if (canWrite && rfqStatus === 'draft') {
    return (
      <div style={{
        background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius)',
        padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: '1.1rem' }}>💡</span>
        <span style={{ fontSize: '.86rem', color: '#92400e', lineHeight: 1.5 }}>
          <strong>Publish this RFQ</strong> to start inviting vendors. Vendor invitations are only available once the RFQ is published.
        </span>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div style={{
          background: '#fdecea', color: '#c0392b', padding: '10px 14px',
          borderRadius: 'var(--radius)', fontSize: '.82rem', marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {/* ── Invite-new-vendors CTA (top, prominent) ─────────────────────── */}
      {canInvite && (
        <div style={{
          background: '#f0f5ff', border: '1px solid #c3d5f8', borderRadius: 'var(--radius)',
          padding: '14px 18px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.2rem' }}>📨</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '.88rem', color: '#1e3a8a' }}>Invite Vendors</div>
              <div style={{ fontSize: '.78rem', color: '#3b5bbd', marginTop: 1 }}>
                Select vendors below and send them an invitation to quote on this RFQ.
              </div>
            </div>
          </div>
          {selected.size > 0 && (
            <button
              onClick={handleInvite}
              disabled={inviting}
              style={{
                padding: '8px 18px', background: 'var(--accent)', color: '#fff',
                border: 'none', borderRadius: 'var(--radius)', fontSize: '.84rem',
                fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'background .15s', whiteSpace: 'nowrap',
                opacity: inviting ? .6 : 1,
              }}
              onMouseEnter={e => !inviting && (e.currentTarget.style.background = 'var(--accent-h)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
            >
              {inviting
                ? 'Sending invitations…'
                : `Invite ${selected.size} vendor${selected.size !== 1 ? 's' : ''} →`}
            </button>
          )}
        </div>
      )}

      {/* ── Invite-new-vendors: search + list ──────────────────────────────── */}
      {canInvite && (
        <div style={{
          border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          background: 'var(--white)', marginBottom: 24, overflow: 'hidden',
        }}>
          {/* Search header */}
          <div style={{
            padding: '12px 14px', borderBottom: '1px solid var(--border)',
            background: 'var(--surface)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--ink-faint)', flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search vendors by name or email…"
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontSize: '.84rem', fontFamily: 'inherit', color: 'var(--ink)',
              }}
            />
            {search && (
              <button
                onClick={clearSearch}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '.78rem', color: 'var(--ink-faint)', padding: '2px 6px',
                  fontFamily: 'inherit',
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Vendor list */}
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {loading && availableVendors.length === 0 ? (
              <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--ink-faint)', fontSize: '.84rem' }}>
                Loading vendors…
              </div>
            ) : availableVendors.length === 0 ? (
              <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--ink-faint)', fontSize: '.84rem' }}>
                {search ? `No vendors match "${search}"` : 'No active vendors found'}
              </div>
            ) : (
              availableVendors.map(v => {
                const alreadyInvited = invitedVendorIds.has(v.id);
                const isSelected     = selected.has(v.id);
                return (
                  <div
                    key={v.id}
                    onClick={() => !alreadyInvited && toggleSelect(v.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', cursor: alreadyInvited ? 'default' : 'pointer',
                      borderBottom: '1px solid var(--border)',
                      background: isSelected ? '#eef3ff' : 'transparent',
                      opacity: alreadyInvited ? 0.55 : 1,
                      transition: 'background .1s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      disabled={alreadyInvited}
                      style={{ accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: '.85rem', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {v.name}
                      </div>
                      {v.email && (
                        <div style={{ fontSize: '.76rem', color: 'var(--ink-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {v.email}
                        </div>
                      )}
                    </div>
                    {alreadyInvited && (
                      <span style={{ fontSize: '.7rem', color: 'var(--ink-faint)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        ✓ Invited
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Load more footer */}
          {hasMore && !loading && (
            <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
              <button
                onClick={loadMore}
                disabled={loadingMore}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '.8rem', color: 'var(--accent)', fontFamily: 'inherit',
                  fontWeight: 500, padding: 0, width: '100%', textAlign: 'center',
                  opacity: loadingMore ? .6 : 1,
                }}
              >
                {loadingMore ? 'Loading…' : 'Load more vendors'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Invited vendors list ─────────────────────────────────────────── */}
      <div>
        <div style={{
          fontWeight: 600, fontSize: '.72rem', letterSpacing: '.07em',
          textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 10,
        }}>
          Invited Vendors ({invitedVendors.length})
        </div>
        {invitedVendors.length === 0 ? (
          <p style={{ color: 'var(--ink-faint)', fontSize: '.84rem', fontStyle: 'italic' }}>
            No vendors invited yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {invitedVendors.map(v => (
              <div key={v.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 'var(--radius)',
                border: '1px solid var(--border)', background: 'var(--white)',
                gap: 10,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: '.88rem', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {v.vendor_name}
                    {v.vendor_status !== 'active' && (
                      <span style={{ fontSize: '.7rem', color: 'var(--accent)', fontWeight: 600 }}>
                        ({v.vendor_status})
                      </span>
                    )}
                  </div>
                  {v.vendor_email && (
                    <div style={{ fontSize: '.78rem', color: 'var(--ink-faint)', marginTop: 1 }}>
                      {v.vendor_email}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <InviteStatusBadge status={v.invite_status} />
                  {canInvite && v.invite_status !== 'submitted' && (
                    <button
                      onClick={() => handleRemove(v.vendor_id)}
                      disabled={removing === v.vendor_id}
                      title="Remove vendor invitation"
                      style={{
                        background: 'none', border: '1px solid var(--border)', cursor: 'pointer',
                        color: 'var(--ink-faint)', fontSize: '.75rem', lineHeight: 1,
                        padding: '3px 8px', borderRadius: 6, fontFamily: 'inherit',
                        transition: 'color .12s, border-color .12s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#c0392b'; e.currentTarget.style.borderColor = '#f5c6cb'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-faint)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                    >
                      {removing === v.vendor_id ? '…' : 'Remove'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

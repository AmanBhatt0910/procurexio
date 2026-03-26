// src/components/rfq/VendorInvitePanel.jsx
'use client';
import { useState, useEffect, useRef } from 'react';

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
  const [search, setSearch]           = useState('');
  const [results, setResults]         = useState([]);
  const [searching, setSearching]     = useState(false);
  const [selected, setSelected]       = useState(new Set());
  const [inviting, setInviting]       = useState(false);
  const [error, setError]             = useState('');
  const [removing, setRemoving]       = useState(null);
  const debounceRef                   = useRef(null);

  const canInvite = canWrite && rfqStatus !== 'closed' && rfqStatus !== 'cancelled';
  const invitedVendorIds = new Set(invitedVendors.map(v => v.vendor_id));

  // Debounced vendor search — clear results synchronously via ref so we never
  // call setState in the effect body directly (avoids cascading-render lint warning).
  useEffect(() => {
    if (!search.trim()) {
      // Schedule the clear inside the timeout so it's not a synchronous setState
      debounceRef.current = setTimeout(() => setResults([]), 0);
      return () => clearTimeout(debounceRef.current);
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/vendors?search=${encodeURIComponent(search)}&status=active&pageSize=10`);
        const json = await res.json();
        if (res.ok) setResults(json.data?.vendors || []);
      } catch { /* ignore */ }
      setSearching(false);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const toggleSelect = (id) => {
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
      // Refresh vendor list
      const refreshRes = await fetch(`/api/rfqs/${rfqId}/vendors`);
      const refreshJson = await refreshRes.json();
      if (refreshRes.ok) onVendorsChange(refreshJson.data.vendors);
      setSelected(new Set());
      setSearch('');
      setResults([]);
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
    } catch { setError('Network error'); }
    setRemoving(null);
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
      {invitedVendors.length === 0 ? (
        <p style={{ color: 'var(--ink-faint)', fontSize: '.84rem', fontStyle: 'italic', marginBottom: 16 }}>
          No vendors invited yet
        </p>
      ) : (
        <div style={{ marginBottom: 20 }}>
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

      {/* Invite search — only shown when canInvite */}
      {canInvite && (
        <div>
          <div style={{ position: 'relative' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search active vendors to invite…"
              style={{
                width: '100%',
                padding: '9px 12px',
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
            {searching && (
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                fontSize: '.75rem', color: 'var(--ink-faint)' }}>
                Searching…
              </span>
            )}
          </div>

          {results.length > 0 && (
            <div style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              background: 'var(--white)',
              marginTop: 4,
              maxHeight: 220,
              overflowY: 'auto',
              boxShadow: 'var(--shadow)',
            }}>
              {results.map(v => {
                const alreadyInvited = invitedVendorIds.has(v.id);
                const isSelected     = selected.has(v.id);
                return (
                  <div
                    key={v.id}
                    onClick={() => !alreadyInvited && toggleSelect(v.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 12px',
                      cursor: alreadyInvited ? 'default' : 'pointer',
                      borderBottom: '1px solid var(--border)',
                      background: isSelected ? '#e8edf5' : 'transparent',
                      opacity: alreadyInvited ? 0.5 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      disabled={alreadyInvited}
                      style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                    />
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '.85rem' }}>{v.name}</div>
                      {v.email && <div style={{ fontSize: '.76rem', color: 'var(--ink-faint)' }}>{v.email}</div>}
                    </div>
                    {alreadyInvited && (
                      <span style={{ marginLeft: 'auto', fontSize: '.7rem', color: 'var(--ink-faint)' }}>
                        Already invited
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {selected.size > 0 && (
            <button
              onClick={handleInvite}
              disabled={inviting}
              style={{
                marginTop: 10,
                padding: '9px 18px',
                background: 'var(--ink)',
                color: 'var(--white)',
                border: 'none',
                borderRadius: 'var(--radius)',
                fontSize: '.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {inviting ? 'Inviting…' : `Invite ${selected.size} vendor${selected.size !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
// src/app/dashboard/rfqs/[id]/page.jsx
'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import RFQStatusBadge from '@/components/rfq/RFQStatusBadge';
import RFQItemsTable from '@/components/rfq/RFQItemsTable';
import VendorInvitePanel from '@/components/rfq/VendorInvitePanel';
import { useAuth } from '@/hooks/useAuth';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AED', 'SGD', 'CAD', 'AUD'];

// Status machine
const VALID_TRANSITIONS = {
  draft:     [{ to: 'published', label: 'Publish RFQ', style: 'primary' }, { to: 'cancelled', label: 'Cancel', style: 'danger' }],
  published: [{ to: 'closed', label: 'Close RFQ', style: 'secondary' }, { to: 'cancelled', label: 'Cancel', style: 'danger' }],
  closed:    [],
  cancelled: [],
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function SectionCard({ title, children, action }) {
  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: 24, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <span style={{ fontSize: '.72rem', fontWeight: 600, letterSpacing: '.08em',
          textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
          {title}
        </span>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function RFQDetailPage({ params }) {
  const { id }   = use(params);
  const { user } = useAuth();
  const router   = useRouter();

  const canWrite = user && ['company_admin', 'manager'].includes(user.role);
  const canViewBids = user && ['company_admin', 'manager', 'employee'].includes(user.role);

  const [rfq, setRfq]           = useState(null);
  const [items, setItems]       = useState([]);
  const [vendors, setVendors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  // Edit mode state
  const [editing, setEditing]   = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving]     = useState(false);
  const [editError, setEditError] = useState('');

  // Status transition
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res  = await fetch(`/api/rfqs/${id}`);
        const json = await res.json();
        console.log('RFQ API response:', json);
        if (!res.ok) { setError(json.error || 'RFQ not found'); setLoading(false); return; }
        setRfq(json.data.rfq);
        setItems(json.data.items);
        setVendors(json.data.vendors);
      } catch { setError('Failed to load RFQ'); }
      setLoading(false);
    })();
  }, [id]);

  const startEdit = () => {
    setEditForm({
      title:       rfq.title,
      description: rfq.description || '',
      deadline:    rfq.deadline ? new Date(rfq.deadline).toISOString().slice(0, 16) : '',
      budget:      rfq.budget || '',
      currency:    rfq.currency,
    });
    setEditError('');
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setEditError('');
    try {
      const res = await fetch(`/api/rfqs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          budget:   editForm.budget   || null,
          deadline: editForm.deadline || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setEditError(json.error); setSaving(false); return; }
      setRfq(json.data.rfq);
      setEditing(false);
    } catch { setEditError('Network error'); }
    setSaving(false);
  };

  const handleTransition = async (toStatus) => {
    if (!window.confirm(`Transition RFQ to "${toStatus}"? This cannot be undone.`)) return;
    setTransitioning(true);
    setError('');
    try {
      const res = await fetch(`/api/rfqs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: toStatus }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error); setTransitioning(false); return; }
      setRfq(json.data.rfq);
    } catch { setError('Network error'); }
    setTransitioning(false);
  };

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <DashboardLayout>
      <div style={{ padding: 40, color: 'var(--ink-faint)', fontSize: '.88rem' }}>Loading RFQ…</div>
    </DashboardLayout>
  );

  if (error && !rfq) return (
    <DashboardLayout>
      <div style={{ padding: 40, color: 'var(--accent)', fontSize: '.88rem' }}>{error}</div>
    </DashboardLayout>
  );

  // Safety net: loading is false but rfq hasn't been set yet (e.g. useAuth re-render race)
  if (!rfq) return (
    <DashboardLayout>
      <div style={{ padding: 40, color: 'var(--ink-faint)', fontSize: '.88rem' }}>Loading RFQ…</div>
    </DashboardLayout>
  );
  // ──────────────────────────────────────────────────────────────────────────

  const transitions = VALID_TRANSITIONS[rfq?.status] || [];
  const isEditable  = rfq && !['closed', 'cancelled'].includes(rfq.status) && canWrite;

  return (
    <DashboardLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@300;400;500&display=swap');
        .rfq-detail { animation: fadeUp .35s ease both; max-width: 960px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }
        .field-label { display:block; font-size:.79rem; font-weight:500; color:var(--ink); margin-bottom:6px; }
        .form-input { width:100%; padding:9px 12px; border:1px solid var(--border);
          border-radius:var(--radius); font-family:'DM Sans',sans-serif; font-size:.88rem;
          color:var(--ink); background:var(--white); outline:none; box-sizing:border-box; transition:border-color .15s; }
        .form-input:focus { border-color:var(--ink-soft); }
        textarea.form-input { resize:vertical; min-height:72px; }
        .meta-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(180px,1fr)); gap:16px; }
        .meta-item-label { font-size:.72rem; font-weight:600; letter-spacing:.06em;
          text-transform:uppercase; color:var(--ink-faint); margin-bottom:4px; }
        .meta-item-value { font-size:.9rem; color:var(--ink); font-weight:500; }
      `}</style>

      <div className="rfq-detail">
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => router.push('/dashboard/rfqs')}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--ink-faint)', fontSize: '.8rem', padding: '0 0 12px', fontFamily: 'inherit' }}
          >
            ← Back to RFQs
          </button>
          <PageHeader
            title={rfq.title}
            subtitle={
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '.85rem',
                  color: 'var(--ink-soft)' }}>
                  {rfq.reference_number}
                </span>
                <RFQStatusBadge status={rfq.status} />
              </span>
            }
            action={isEditable && !editing ? {
              label: 'Edit Details',
              onClick: startEdit,
            } : undefined}
          />
        </div>

        {error && (
          <div style={{ background: '#fdecea', color: '#c0392b', padding: '10px 14px',
            borderRadius: 'var(--radius)', fontSize: '.84rem', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Status transitions */}
        {transitions.length > 0 && canWrite && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {transitions.map(t => (
              <button
                key={t.to}
                onClick={() => handleTransition(t.to)}
                disabled={transitioning}
                style={{
                  padding: '7px 16px',
                  borderRadius: 'var(--radius)',
                  fontSize: '.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: t.style === 'danger' ? '1px solid #f5c6cb' : '1px solid var(--border)',
                  background: t.style === 'primary' ? 'var(--ink)'
                    : t.style === 'danger' ? '#fdecea' : 'var(--white)',
                  color: t.style === 'primary' ? 'var(--white)'
                    : t.style === 'danger' ? '#c0392b' : 'var(--ink)',
                  fontFamily: 'inherit',
                  opacity: transitioning ? .6 : 1,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* View Bids — visible to admin, manager, employee */}
        {canViewBids && (
          <div style={{ marginBottom: 20 }}>
            <button
              onClick={() => router.push(`/dashboard/rfqs/${id}/bids`)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', background: 'var(--accent)', color: '#fff',
                border: 'none', borderRadius: 'var(--radius)', fontSize: '.84rem',
                fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'background .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-h)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              View Bids
            </button>
          </div>
        )}

        {/* Main details */}
        <SectionCard title="Details">
          {editing ? (
            <div>
              {editError && (
                <div style={{ background: '#fdecea', color: '#c0392b', padding: '8px 12px',
                  borderRadius: 'var(--radius)', fontSize: '.82rem', marginBottom: 14 }}>
                  {editError}
                </div>
              )}
              <div style={{ marginBottom: 14 }}>
                <label className="field-label">Title *</label>
                <input
                  className="form-input"
                  value={editForm.title}
                  onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="field-label">Description</label>
                <textarea
                  className="form-input"
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 14, marginBottom: 18 }}>
                <div>
                  <label className="field-label">Deadline</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={editForm.deadline}
                    onChange={e => setEditForm(f => ({ ...f, deadline: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="field-label">Budget</label>
                  <input
                    type="number" min="0"
                    className="form-input"
                    value={editForm.budget}
                    onChange={e => setEditForm(f => ({ ...f, budget: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="field-label">Currency</label>
                  <select
                    className="form-input"
                    value={editForm.currency}
                    onChange={e => setEditForm(f => ({ ...f, currency: e.target.value }))}
                    style={{ cursor: 'pointer' }}
                  >
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleSave} disabled={saving}
                  style={{ padding: '8px 20px', background: 'var(--ink)', color: 'var(--white)',
                    border: 'none', borderRadius: 'var(--radius)', fontFamily: 'inherit',
                    fontSize: '.84rem', fontWeight: 600, cursor: 'pointer', opacity: saving ? .6 : 1 }}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', fontFamily: 'inherit', fontSize: '.84rem', cursor: 'pointer',
                    color: 'var(--ink-soft)' }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              {rfq.description && (
                <p style={{ fontSize: '.88rem', color: 'var(--ink)', marginBottom: 20,
                  lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {rfq.description}
                </p>
              )}
              <div className="meta-grid">
                <div>
                  <div className="meta-item-label">Deadline</div>
                  <div className="meta-item-value" style={{
                    color: rfq.deadline && new Date(rfq.deadline) < new Date() && rfq.status === 'published'
                      ? 'var(--accent)' : 'var(--ink)'
                  }}>
                    {formatDate(rfq.deadline)}
                  </div>
                </div>
                <div>
                  <div className="meta-item-label">Budget</div>
                  <div className="meta-item-value">
                    {rfq.budget
                      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: rfq.currency }).format(rfq.budget)
                      : '—'}
                  </div>
                </div>
                <div>
                  <div className="meta-item-label">Currency</div>
                  <div className="meta-item-value">{rfq.currency}</div>
                </div>
                <div>
                  <div className="meta-item-label">Created By</div>
                  <div className="meta-item-value">{rfq.created_by_name}</div>
                </div>
                <div>
                  <div className="meta-item-label">Created At</div>
                  <div className="meta-item-value">{formatDate(rfq.created_at)}</div>
                </div>
                <div>
                  <div className="meta-item-label">Last Updated</div>
                  <div className="meta-item-value">{formatDate(rfq.updated_at)}</div>
                </div>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Line Items */}
        <SectionCard title={`Line Items (${items.length})`}>
          <RFQItemsTable
            items={items}
            currency={rfq.currency}
            canWrite={isEditable}
            rfqId={id}
            onItemsChange={setItems}
          />
        </SectionCard>

        {/* Vendor Invitations */}
        <SectionCard title={`Vendor Invitations (${vendors.length})`}>
          <VendorInvitePanel
            rfqId={id}
            rfqStatus={rfq.status}
            invitedVendors={vendors}
            canWrite={canWrite}
            onVendorsChange={setVendors}
          />
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}
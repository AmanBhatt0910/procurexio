'use client';
// src/app/dashboard/vendors/[id]/page.jsx

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import VendorStatusBadge from '@/components/vendors/VendorStatusBadge';
import VendorCategoryTag from '@/components/vendors/VendorCategoryTag';
import ContactCard from '@/components/vendors/ContactCard';
import { useAuth } from '@/hooks/useAuth';

const STATUSES = ['pending', 'active', 'inactive'];

export default function VendorDetailPage() {
  const router      = useRouter();
  const { id }      = useParams();
  const { user }    = useAuth();
  const canWrite    = user && ['company_admin', 'manager', 'super_admin'].includes(user.role);

  const [vendor,      setVendor]      = useState(null);
  const [categories,  setCategories]  = useState([]);   // all company categories
  const [loading,     setLoading]     = useState(true);
  const [toast,       setToast]       = useState(null);

  // Inline edit state
  const [editing,   setEditing]   = useState(false);
  const [editForm,  setEditForm]  = useState({});
  const [editCats,  setEditCats]  = useState([]);
  const [saving,    setSaving]    = useState(false);

  // Add contact modal
  const [addContactOpen,     setAddContactOpen]     = useState(false);
  const [contactForm,        setContactForm]        = useState({ name: '', email: '', phone: '', is_primary: false });
  const [addingContact,      setAddingContact]      = useState(false);

  // New category (inline creation in edit mode)
  const [newCatName,  setNewCatName]  = useState('');
  const [creatingCat, setCreatingCat] = useState(false);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  const loadVendor = useCallback(async () => {
    const res = await fetch(`/api/vendors/${id}`);
    if (res.ok) {
      const data = await res.json();
      setVendor(data.data);
    } else {
      router.push('/dashboard/vendors');
    }
    setLoading(false);
  }, [id, router]);

  const loadCategories = useCallback(async () => {
    const res = await fetch('/api/vendors/categories');
    if (res.ok) setCategories((await res.json()).data);
  }, []);

  useEffect(() => { loadVendor(); loadCategories(); }, [loadVendor, loadCategories]);

  function startEdit() {
    if (!vendor) return;
    setEditForm({
      name:    vendor.name,
      email:   vendor.email   || '',
      phone:   vendor.phone   || '',
      website: vendor.website || '',
      address: vendor.address || '',
      status:  vendor.status,
      notes:   vendor.notes   || '',
    });
    setEditCats(vendor.categories ? vendor.categories.map(c => c.id) : []);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setEditForm({});
    setEditCats([]);
    setNewCatName('');
  }

  function setField(key, value) {
    setEditForm(f => ({ ...f, [key]: value }));
  }

  function toggleEditCat(catId) {
    setEditCats(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  }

  async function handleSave() {
    if (!editForm.name?.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/vendors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, category_ids: editCats }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Vendor updated');
        setEditing(false);
        loadVendor();
      } else {
        showToast(data.error, 'error');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateCategory(e) {
    e?.preventDefault?.();
    if (!newCatName.trim()) return;
    setCreatingCat(true);
    try {
      const res = await fetch('/api/vendors/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        await loadCategories();
        setEditCats(prev => [...prev, data.data.id]);
        setNewCatName('');
      } else {
        showToast(data.error, 'error');
      }
    } finally {
      setCreatingCat(false);
    }
  }

  async function handleAddContact(e) {
    e.preventDefault();
    if (!contactForm.name.trim()) return;
    setAddingContact(true);
    try {
      const res = await fetch(`/api/vendors/${id}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Contact added');
        setAddContactOpen(false);
        setContactForm({ name: '', email: '', phone: '', is_primary: false });
        loadVendor();
      } else {
        showToast(data.error, 'error');
      }
    } finally {
      setAddingContact(false);
    }
  }

  async function handleRemoveContact(contactId) {
    const res = await fetch(`/api/vendors/${id}/contacts/${contactId}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) { showToast('Contact removed'); loadVendor(); }
    else showToast(data.error, 'error');
  }

  if (loading) {
    return (
      <DashboardLayout pageTitle="Vendor">
        <div style={{ padding: '60px 0', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', color: 'var(--ink-faint)' }}>
          Loading…
        </div>
      </DashboardLayout>
    );
  }

  if (!vendor) return null;

  const editBtn = canWrite && !editing && (
    <button
      onClick={startEdit}
      style={{
        background: 'var(--accent)', color: '#fff', border: 'none',
        padding: '10px 18px', borderRadius: 8,
        fontFamily: 'DM Sans, sans-serif', fontWeight: 500, fontSize: '.855rem',
        cursor: 'pointer', transition: 'background .15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-h)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
    >
      Edit Vendor
    </button>
  );

  return (
    <DashboardLayout pageTitle={vendor.name}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@300;400;500&display=swap');
        .detail-grid { display: grid; grid-template-columns: 1fr 340px; gap: 20px; align-items: start; }
        .card { background: var(--white); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px 28px; }
        .section-label { font-size: .72rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-faint); font-family: 'DM Sans', sans-serif; margin: 0 0 16px; }
        .divider { border: none; border-top: 1px solid var(--border); margin: 22px 0; }
        .detail-row { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
        .detail-label { font-size: .78rem; font-weight: 500; color: var(--ink-faint); font-family: 'DM Sans', sans-serif; width: 90px; flex-shrink: 0; padding-top: 1px; }
        .detail-value { font-size: .875rem; color: var(--ink); font-family: 'DM Sans', sans-serif; flex: 1; word-break: break-word; }
        .detail-value a { color: var(--accent); text-decoration: none; }
        .detail-value a:hover { text-decoration: underline; }
        .field { margin-bottom: 14px; }
        .field-label { display: block; font-size: .8rem; font-weight: 500; color: var(--ink); margin-bottom: 5px; font-family: 'DM Sans', sans-serif; }
        .field-input { width: 100%; padding: 8px 12px; border: 1px solid var(--border); border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: .875rem; color: var(--ink); background: var(--white); outline: none; transition: border-color .15s, box-shadow .15s; box-sizing: border-box; }
        .field-input:focus { border-color: var(--ink); box-shadow: 0 0 0 3px rgba(15,14,13,.06); }
        .field-textarea { resize: vertical; min-height: 72px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 14px; }
        .edit-actions { display: flex; gap: 8px; padding-top: 6px; }
        .btn-save { background: var(--accent); color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: .845rem; cursor: pointer; }
        .btn-save:hover:not(:disabled) { background: var(--accent-h); }
        .btn-save:disabled { opacity: .6; cursor: not-allowed; }
        .btn-cancel { background: none; border: 1px solid var(--border); padding: 8px 14px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: .845rem; color: var(--ink-soft); cursor: pointer; }
        .btn-cancel:hover { background: var(--surface); }
        .cat-grid { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; }
        .cat-toggle { padding: 3px 10px; border-radius: 99px; font-size: .73rem; font-weight: 500; font-family: 'DM Sans', sans-serif; cursor: pointer; border: 1px solid var(--border); background: var(--surface); color: var(--ink-soft); transition: all .12s; }
        .cat-toggle--selected { border-color: transparent; }
        .new-cat-row { display: flex; gap: 7px; margin-top: 4px; }
        .new-cat-input { flex: 1; height: 30px; padding: 0 10px; border: 1px solid var(--border); border-radius: 7px; font-family: 'DM Sans', sans-serif; font-size: .8rem; color: var(--ink); outline: none; }
        .new-cat-input:focus { border-color: var(--ink); }
        .new-cat-btn { height: 30px; padding: 0 11px; background: var(--surface); border: 1px solid var(--border); border-radius: 7px; font-family: 'DM Sans', sans-serif; font-size: .76rem; color: var(--ink-soft); cursor: pointer; white-space: nowrap; }
        .new-cat-btn:hover:not(:disabled) { background: var(--border); }
        .contacts-empty { font-size: .85rem; color: var(--ink-faint); font-family: 'DM Sans', sans-serif; padding: 16px 0 4px; }
        .contacts-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
        .add-contact-btn { width: 100%; padding: 8px; border: 1px dashed var(--border); border-radius: 8px; background: none; font-family: 'DM Sans', sans-serif; font-size: .82rem; color: var(--ink-soft); cursor: pointer; transition: background .12s, border-color .12s, color .12s; }
        .add-contact-btn:hover { background: var(--surface); border-color: var(--ink-faint); color: var(--ink); }
        .modal-field { margin-bottom: 14px; }
        .modal-label { display: block; font-size: .8rem; font-weight: 500; color: var(--ink); margin-bottom: 5px; font-family: 'DM Sans', sans-serif; }
        .modal-input { width: 100%; padding: 8px 12px; border: 1px solid var(--border); border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: .875rem; color: var(--ink); background: var(--white); outline: none; transition: border-color .15s; box-sizing: border-box; }
        .modal-input:focus { border-color: var(--ink); box-shadow: 0 0 0 3px rgba(15,14,13,.06); }
        .checkbox-row { display: flex; align-items: center; gap: 8px; font-family: 'DM Sans', sans-serif; font-size: .855rem; color: var(--ink-soft); margin-bottom: 16px; }
        .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 18px; }
        .btn-secondary { background: none; border: 1px solid var(--border); padding: 8px 16px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: .845rem; color: var(--ink-soft); cursor: pointer; }
        .btn-secondary:hover { background: var(--surface); }
        .btn-primary { background: var(--accent); color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: .845rem; cursor: pointer; }
        .btn-primary:hover:not(:disabled) { background: var(--accent-h); }
        .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
        .toast { position: fixed; bottom: 24px; right: 24px; padding: 12px 18px; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: .855rem; font-weight: 500; z-index: 999; box-shadow: var(--shadow); animation: toastIn .2s ease; }
        .toast--success { background: #166534; color: #fff; }
        .toast--error   { background: #991b1b; color: #fff; }
        @keyframes toastIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } }
      `}</style>

      <PageHeader
        title={vendor.name}
        subtitle={
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <VendorStatusBadge status={vendor.status} />
            {vendor.categories?.map(cat => (
              <VendorCategoryTag key={cat.id} name={cat.name} color={cat.color} />
            ))}
          </span>
        }
        action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => router.push('/dashboard/vendors')}
              style={{
                background: 'none', color: 'var(--ink-soft)', border: '1px solid var(--border)',
                padding: '9px 16px', borderRadius: 8,
                fontFamily: 'DM Sans, sans-serif', fontWeight: 500, fontSize: '.855rem',
                cursor: 'pointer', transition: 'background .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              ← Back
            </button>
            {editBtn}
          </div>
        }
      />

      <div className="detail-grid">
        {/* ── Left: Vendor Info ──────────────────────────────────── */}
        <div>
          <div className="card">
            {!editing ? (
              <>
                <p className="section-label">Vendor Details</p>

                <div className="detail-row">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">
                    {vendor.email
                      ? <a href={`mailto:${vendor.email}`}>{vendor.email}</a>
                      : <span style={{ color: 'var(--ink-faint)' }}>—</span>}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">{vendor.phone || <span style={{ color: 'var(--ink-faint)' }}>—</span>}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Website</span>
                  <span className="detail-value">
                    {vendor.website
                      ? <a href={vendor.website} target="_blank" rel="noopener noreferrer">{vendor.website}</a>
                      : <span style={{ color: 'var(--ink-faint)' }}>—</span>}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Address</span>
                  <span className="detail-value" style={{ whiteSpace: 'pre-line' }}>
                    {vendor.address || <span style={{ color: 'var(--ink-faint)' }}>—</span>}
                  </span>
                </div>

                {vendor.notes && (
                  <>
                    <hr className="divider" />
                    <p className="section-label">Notes</p>
                    <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '.875rem', color: 'var(--ink-soft)', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-line' }}>
                      {vendor.notes}
                    </p>
                  </>
                )}
              </>
            ) : (
              <>
                <p className="section-label">Edit Vendor</p>
                <div className="grid-2">
                  <div className="field">
                    <label className="field-label">Vendor Name *</label>
                    <input className="field-input" value={editForm.name} onChange={e => setField('name', e.target.value)} required autoFocus />
                  </div>
                  <div className="field">
                    <label className="field-label">Status</label>
                    <select className="field-input" value={editForm.status} onChange={e => setField('status', e.target.value)}>
                      {STATUSES.map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="field">
                    <label className="field-label">Email</label>
                    <input className="field-input" type="email" value={editForm.email} onChange={e => setField('email', e.target.value)} />
                  </div>
                  <div className="field">
                    <label className="field-label">Phone</label>
                    <input className="field-input" type="tel" value={editForm.phone} onChange={e => setField('phone', e.target.value)} />
                  </div>
                </div>
                <div className="field">
                  <label className="field-label">Website</label>
                  <input className="field-input" type="url" value={editForm.website} onChange={e => setField('website', e.target.value)} />
                </div>
                <div className="field">
                  <label className="field-label">Address</label>
                  <textarea className="field-input field-textarea" value={editForm.address} onChange={e => setField('address', e.target.value)} />
                </div>

                <hr className="divider" />

                <p className="section-label">Categories</p>
                {categories.length > 0 && (
                  <div className="cat-grid">
                    {categories.map(cat => {
                      const selected = editCats.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          className={`cat-toggle${selected ? ' cat-toggle--selected' : ''}`}
                          onClick={() => toggleEditCat(cat.id)}
                          style={selected ? { background: `${cat.color}18`, color: cat.color, borderColor: `${cat.color}33` } : {}}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="new-cat-row">
                  <input
                    className="new-cat-input"
                    placeholder="New category…"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateCategory(); } }}
                  />
                  <button type="button" className="new-cat-btn" onClick={handleCreateCategory} disabled={creatingCat || !newCatName.trim()}>
                    {creatingCat ? 'Adding…' : '+ Add'}
                  </button>
                </div>

                <hr className="divider" />

                <p className="section-label">Notes</p>
                <div className="field">
                  <textarea className="field-input field-textarea" value={editForm.notes} onChange={e => setField('notes', e.target.value)} placeholder="Internal notes…" />
                </div>

                <div className="edit-actions">
                  <button className="btn-cancel" onClick={cancelEdit}>Cancel</button>
                  <button className="btn-save" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Right: Contacts sidebar ───────────────────────────── */}
        <div>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p className="section-label" style={{ margin: 0 }}>Contacts</p>
              {canWrite && (
                <button
                  onClick={() => setAddContactOpen(true)}
                  style={{
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif', fontSize: '.78rem', fontWeight: 500,
                    color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                  Add
                </button>
              )}
            </div>

            {vendor.contacts?.length === 0 && (
              <p className="contacts-empty">No contacts yet.</p>
            )}

            <div className="contacts-list">
              {(vendor.contacts || []).map(contact => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onRemove={canWrite ? handleRemoveContact : undefined}
                />
              ))}
            </div>

            {canWrite && (
              <button className="add-contact-btn" onClick={() => setAddContactOpen(true)}>
                + Add Contact
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add Contact Modal */}
      <Modal open={addContactOpen} onClose={() => setAddContactOpen(false)} title="Add Contact">
        <form onSubmit={handleAddContact}>
          <div className="modal-field">
            <label className="modal-label">Name *</label>
            <input
              className="modal-input"
              value={contactForm.name}
              onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Jane Smith"
              required
              autoFocus
            />
          </div>
          <div className="modal-field">
            <label className="modal-label">Email</label>
            <input
              className="modal-input"
              type="email"
              value={contactForm.email}
              onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
              placeholder="jane@vendor.com"
            />
          </div>
          <div className="modal-field">
            <label className="modal-label">Phone</label>
            <input
              className="modal-input"
              type="tel"
              value={contactForm.phone}
              onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+1 555 000 0000"
            />
          </div>
          <div className="checkbox-row">
            <input
              type="checkbox"
              id="is_primary"
              checked={contactForm.is_primary}
              onChange={e => setContactForm(f => ({ ...f, is_primary: e.target.checked }))}
            />
            <label htmlFor="is_primary">Mark as primary contact</label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setAddContactOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={addingContact}>
              {addingContact ? 'Adding…' : 'Add Contact'}
            </button>
          </div>
        </form>
      </Modal>

      {toast && <div className={`toast toast--${toast.type}`}>{toast.msg}</div>}
    </DashboardLayout>
  );
}
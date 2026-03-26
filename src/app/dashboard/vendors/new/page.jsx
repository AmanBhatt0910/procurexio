'use client';
// src/app/dashboard/vendors/new/page.jsx

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import VendorCategoryTag from '@/components/vendors/VendorCategoryTag';

const STATUSES = ['pending', 'active', 'inactive'];

export default function NewVendorPage() {
  const router = useRouter();

  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState(null);
  const [categories, setCategories] = useState([]);

  // Form fields
  const [form, setForm] = useState({
    name: '', email: '', phone: '', website: '', address: '', status: 'pending', notes: '',
  });
  const [selectedCats, setSelectedCats] = useState([]);

  // New category creation (inline)
  const [newCatName,    setNewCatName]    = useState('');
  const [creatingCat,   setCreatingCat]   = useState(false);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    fetch('/api/vendors/categories')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setCategories(d.data); });
  }, []);

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function toggleCategory(cat) {
    setSelectedCats(prev =>
      prev.find(c => c.id === cat.id)
        ? prev.filter(c => c.id !== cat.id)
        : [...prev, cat]
    );
  }

  async function handleCreateCategory(e) {
    e.preventDefault();
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
        setCategories(prev => [...prev, data.data]);
        setSelectedCats(prev => [...prev, data.data]);
        setNewCatName('');
      } else {
        showToast(data.error, 'error');
      }
    } finally {
      setCreatingCat(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          category_ids: selectedCats.map(c => c.id),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/dashboard/vendors/${data.data.id}`);
      } else {
        showToast(data.error, 'error');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout pageTitle="Add Vendor">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@300;400;500&display=swap');
        .form-card { background: var(--white); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px 32px; max-width: 720px; }
        .section-label { font-size: .72rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-faint); font-family: 'DM Sans', sans-serif; margin: 0 0 16px; }
        .divider { border: none; border-top: 1px solid var(--border); margin: 24px 0; }
        .field { margin-bottom: 16px; }
        .field-label { display: block; font-size: .8rem; font-weight: 500; color: var(--ink); margin-bottom: 6px; font-family: 'DM Sans', sans-serif; }
        .field-label span { color: var(--ink-faint); font-weight: 400; margin-left: 4px; }
        .field-input { width: 100%; padding: 9px 12px; border: 1px solid var(--border); border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: .875rem; color: var(--ink); background: var(--white); outline: none; transition: border-color .15s, box-shadow .15s; box-sizing: border-box; }
        .field-input:focus { border-color: var(--ink); box-shadow: 0 0 0 3px rgba(15,14,13,.06); }
        .field-textarea { resize: vertical; min-height: 80px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
        .cat-grid { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
        .cat-toggle {
          padding: 4px 10px; border-radius: 99px; font-size: .75rem; font-weight: 500;
          font-family: 'DM Sans', sans-serif; cursor: pointer; border: 1px solid var(--border);
          background: var(--surface); color: var(--ink-soft); transition: all .12s;
        }
        .cat-toggle--selected { border-color: transparent; }
        .new-cat-row { display: flex; gap: 8px; align-items: center; margin-top: 4px; }
        .new-cat-input { flex: 1; height: 32px; padding: 0 10px; border: 1px solid var(--border); border-radius: 7px; font-family: 'DM Sans', sans-serif; font-size: .82rem; color: var(--ink); outline: none; background: var(--white); }
        .new-cat-input:focus { border-color: var(--ink); }
        .new-cat-btn { height: 32px; padding: 0 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 7px; font-family: 'DM Sans', sans-serif; font-size: .78rem; color: var(--ink-soft); cursor: pointer; white-space: nowrap; }
        .new-cat-btn:hover:not(:disabled) { background: var(--border); }
        .form-actions { display: flex; gap: 10px; justify-content: flex-end; padding-top: 8px; }
        .btn-secondary { background: none; border: 1px solid var(--border); padding: 9px 18px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: .855rem; color: var(--ink-soft); cursor: pointer; }
        .btn-secondary:hover { background: var(--surface); }
        .btn-primary { background: var(--accent); color: #fff; border: none; padding: 9px 22px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: .855rem; cursor: pointer; }
        .btn-primary:hover:not(:disabled) { background: var(--accent-h); }
        .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
        .toast { position: fixed; bottom: 24px; right: 24px; padding: 12px 18px; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: .855rem; font-weight: 500; z-index: 999; box-shadow: var(--shadow); animation: toastIn .2s ease; }
        .toast--success { background: #166534; color: #fff; }
        .toast--error   { background: #991b1b; color: #fff; }
        @keyframes toastIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <PageHeader
        title="Add Vendor"
        subtitle="Register a new vendor in your directory"
      />

      <form onSubmit={handleSubmit}>
        <div className="form-card">
          {/* Basic Info */}
          <p className="section-label">Basic Information</p>
          <div className="grid-2">
            <div className="field">
              <label className="field-label">Vendor Name <span>*</span></label>
              <input className="field-input" value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Acme Supplies Ltd." required autoFocus />
            </div>
            <div className="field">
              <label className="field-label">Status</label>
              <select className="field-input" value={form.status} onChange={e => setField('status', e.target.value)}>
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label className="field-label">Email <span>(optional)</span></label>
              <input className="field-input" type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="contact@vendor.com" />
            </div>
            <div className="field">
              <label className="field-label">Phone <span>(optional)</span></label>
              <input className="field-input" type="tel" value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="+1 555 000 0000" />
            </div>
          </div>

          <div className="field">
            <label className="field-label">Website <span>(optional)</span></label>
            <input className="field-input" type="url" value={form.website} onChange={e => setField('website', e.target.value)} placeholder="https://vendor.com" />
          </div>

          <div className="field">
            <label className="field-label">Address <span>(optional)</span></label>
            <textarea className="field-input field-textarea" value={form.address} onChange={e => setField('address', e.target.value)} placeholder="Street, City, Country" />
          </div>

          <hr className="divider" />

          {/* Categories */}
          <p className="section-label">Categories</p>
          {categories.length > 0 && (
            <div className="cat-grid">
              {categories.map(cat => {
                const selected = !!selectedCats.find(c => c.id === cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`cat-toggle${selected ? ' cat-toggle--selected' : ''}`}
                    onClick={() => toggleCategory(cat)}
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
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateCategory(e); } }}
            />
            <button type="button" className="new-cat-btn" onClick={handleCreateCategory} disabled={creatingCat || !newCatName.trim()}>
              {creatingCat ? 'Adding…' : '+ Add'}
            </button>
          </div>

          <hr className="divider" />

          {/* Notes */}
          <p className="section-label">Notes</p>
          <div className="field">
            <textarea className="field-input field-textarea" value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Internal notes about this vendor…" />
          </div>
        </div>

        <div className="form-actions" style={{ marginTop: 20 }}>
          <button type="button" className="btn-secondary" onClick={() => router.push('/dashboard/vendors')}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Create Vendor'}
          </button>
        </div>
      </form>

      {toast && <div className={`toast toast--${toast.type}`}>{toast.msg}</div>}
    </DashboardLayout>
  );
}
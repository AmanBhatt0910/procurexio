'use client';
// src/app/dashboard/vendors/new/page.jsx
//
// Add Vendor page — two-step flow:
//   Step 1: Fill in vendor details → POST /api/vendors  → get vendorId
//   Step 2: (Optional) Invite a portal user for that vendor
//           → POST /api/company/invite { email, role:'vendor_user', vendorId, vendorName }
//
// The portal invite section is revealed after Step 1 succeeds.
// The user can skip Step 2 and go straight to the vendor profile.

import { useEffect, useState } from 'react';
import { useRouter }           from 'next/navigation';
import DashboardLayout         from '@/components/Layout/DashboardLayout';
import PageHeader              from '@/components/ui/PageHeader';

const STATUSES = ['pending', 'active', 'inactive'];

export default function NewVendorPage() {
  const router = useRouter();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [step,    setStep]    = useState(1);  // 1 = vendor form, 2 = invite portal
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);

  // ── Vendor form state ─────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name: '', email: '', phone: '', gst: '', address: '',
    status: 'active', notes: '',
  });
  const [categories,    setCategories]    = useState([]);
  const [selectedCats,  setSelectedCats]  = useState([]);
  const [newCatName,    setNewCatName]    = useState('');
  const [creatingCat,   setCreatingCat]   = useState(false);

  // ── After vendor created ──────────────────────────────────────────────────
  const [createdVendorId,   setCreatedVendorId]   = useState(null);
  const [createdVendorName, setCreatedVendorName] = useState('');

  // ── Portal invite state ───────────────────────────────────────────────────
  const [inviteEmail,  setInviteEmail]  = useState('');
  const [inviting,     setInviting]     = useState(false);
  const [inviteSent,   setInviteSent]   = useState(false);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
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
      const res  = await fetch('/api/vendors/categories', {
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

  // Step 1 — Create the vendor record
  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res  = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          category_ids: selectedCats.map(c => c.id),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCreatedVendorId(data.data.id);
        setCreatedVendorName(form.name.trim());
        // Pre-fill invite email from vendor email if available
        if (form.email) setInviteEmail(form.email);
        setStep(2);
        showToast('Vendor created successfully!');
      } else {
        showToast(data.error, 'error');
      }
    } finally {
      setSaving(false);
    }
  }

  // Step 2 — Send portal invite
  async function handleInvite(e) {
    e.preventDefault();
    if (!inviteEmail.trim() || !createdVendorId) return;
    setInviting(true);
    try {
      const res  = await fetch('/api/company/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:      inviteEmail.trim().toLowerCase(),
          role:       'vendor_user',
          vendorId:   createdVendorId,
          vendorName: createdVendorName,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteSent(true);
        showToast(`Portal invite sent to ${inviteEmail}`);
      } else {
        showToast(data.error, 'error');
      }
    } finally {
      setInviting(false);
    }
  }

  function goToVendor() {
    router.push(`/dashboard/vendors/${createdVendorId}`);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout pageTitle="Add Vendor">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@300;400;500&display=swap');

        /* ── Layout ── */
        .vendor-form-wrap {
          display: flex;
          justify-content: center;
          padding: 8px 0 48px;
        }
        .vendor-form-inner {
          width: 100%;
          max-width: 680px;
        }

        /* ── Progress indicator ── */
        .progress-bar {
          display: flex;
          align-items: center;
          gap: 0;
          margin-bottom: 32px;
        }
        .progress-step {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: .8rem;
          color: var(--ink-faint);
          font-weight: 400;
        }
        .progress-step.active  { color: var(--ink); font-weight: 500; }
        .progress-step.done    { color: #059669; }
        .progress-dot {
          width: 24px; height: 24px; border-radius: 50%;
          border: 1.5px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: .7rem; font-weight: 700; font-family: 'Syne', sans-serif;
          color: var(--ink-faint); flex-shrink: 0; transition: all .2s;
        }
        .progress-step.active .progress-dot {
          background: var(--ink); border-color: var(--ink); color: #fff;
        }
        .progress-step.done .progress-dot {
          background: #059669; border-color: #059669; color: #fff;
        }
        .progress-line {
          flex: 1; height: 1.5px; background: var(--border);
          margin: 0 12px; min-width: 32px;
        }

        /* ── Card ── */
        .form-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 32px;
        }

        /* ── Section label ── */
        .section-label {
          font-size: .72rem; font-weight: 600; letter-spacing: .08em;
          text-transform: uppercase; color: var(--ink-faint);
          font-family: 'DM Sans', sans-serif; margin: 0 0 16px;
        }
        .divider { border: none; border-top: 1px solid var(--border); margin: 24px 0; }

        /* ── Fields ── */
        .field { margin-bottom: 16px; }
        .field-label {
          display: block; font-size: .8rem; font-weight: 500;
          color: var(--ink); margin-bottom: 6px; font-family: 'DM Sans', sans-serif;
        }
        .field-label span { color: var(--ink-faint); font-weight: 400; margin-left: 4px; }
        .field-input {
          width: 100%; padding: 9px 12px; border: 1px solid var(--border);
          border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: .875rem;
          color: var(--ink); background: var(--white); outline: none;
          transition: border-color .15s, box-shadow .15s; box-sizing: border-box;
        }
        .field-input:focus { border-color: var(--ink); box-shadow: 0 0 0 3px rgba(15,14,13,.06); }
        .field-textarea { resize: vertical; min-height: 80px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
        @media (max-width: 560px) { .grid-2 { grid-template-columns: 1fr; } }

        /* ── Categories ── */
        .cat-grid { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
        .cat-toggle {
          padding: 4px 10px; border-radius: 99px; font-size: .75rem; font-weight: 500;
          font-family: 'DM Sans', sans-serif; cursor: pointer; border: 1px solid var(--border);
          background: var(--surface); color: var(--ink-soft); transition: all .12s;
        }
        .new-cat-row { display: flex; gap: 8px; align-items: center; margin-top: 4px; }
        .new-cat-input {
          flex: 1; height: 32px; padding: 0 10px; border: 1px solid var(--border);
          border-radius: 7px; font-family: 'DM Sans', sans-serif; font-size: .82rem;
          color: var(--ink); outline: none; background: var(--white);
        }
        .new-cat-input:focus { border-color: var(--ink); }
        .new-cat-btn {
          height: 32px; padding: 0 12px; background: var(--surface);
          border: 1px solid var(--border); border-radius: 7px;
          font-family: 'DM Sans', sans-serif; font-size: .78rem;
          color: var(--ink-soft); cursor: pointer; white-space: nowrap;
        }
        .new-cat-btn:hover:not(:disabled) { background: var(--border); }

        /* ── Buttons ── */
        .form-actions {
          display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px;
        }
        .btn-ghost {
          background: none; border: 1px solid var(--border); padding: 10px 20px;
          border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: .855rem;
          color: var(--ink-soft); cursor: pointer; transition: background .12s;
        }
        .btn-ghost:hover { background: var(--surface); }
        .btn-primary {
          background: var(--accent); color: #fff; border: none;
          padding: 10px 22px; border-radius: 8px;
          font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: .855rem;
          cursor: pointer; transition: background .15s;
          display: flex; align-items: center; gap: 6px;
        }
        .btn-primary:hover:not(:disabled) { background: var(--accent-h); }
        .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
        .btn-ink {
          background: var(--ink); color: #fff; border: none;
          padding: 10px 22px; border-radius: 8px;
          font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: .855rem;
          cursor: pointer; transition: background .15s;
          display: flex; align-items: center; gap: 6px;
        }
        .btn-ink:hover:not(:disabled) { background: #1e1c1a; }
        .btn-ink:disabled { opacity: .6; cursor: not-allowed; }

        /* ── Portal invite card (Step 2) ── */
        .invite-hero {
          text-align: center;
          padding: 0 0 28px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 28px;
        }
        .invite-icon-wrap {
          width: 56px; height: 56px; border-radius: 14px;
          background: #f0fdf4; border: 1.5px solid #bbf7d0;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 16px;
        }
        .invite-title {
          font-family: 'Syne', sans-serif; font-size: 1.2rem;
          font-weight: 700; color: var(--ink); letter-spacing: -.02em;
          margin: 0 0 6px;
        }
        .invite-sub {
          font-size: .86rem; color: var(--ink-soft); line-height: 1.6;
          margin: 0;
        }
        .vendor-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 10px 4px 6px; background: var(--surface);
          border: 1px solid var(--border); border-radius: 20px;
          font-size: .8rem; color: var(--ink); margin-top: 10px;
        }
        .vendor-chip-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #059669;
        }

        .portal-features {
          display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
          margin-bottom: 24px;
        }
        @media (max-width: 480px) { .portal-features { grid-template-columns: 1fr; } }
        .feature-item {
          display: flex; align-items: flex-start; gap: 8px;
          padding: 10px 12px; background: #f8fffe;
          border: 1px solid #d1fae5; border-radius: 8px;
          font-size: .8rem; color: #374151; line-height: 1.4;
        }
        .feature-check {
          width: 16px; height: 16px; border-radius: 50%;
          background: #059669; color: #fff;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 1px;
        }

        .invite-form-row {
          display: flex; gap: 8px; align-items: flex-end;
        }
        .invite-form-row .field { flex: 1; margin-bottom: 0; }

        .invite-sent-state {
          display: flex; flex-direction: column; align-items: center;
          gap: 12px; padding: 24px;
          background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px;
          text-align: center;
        }
        .invite-sent-icon {
          width: 44px; height: 44px; border-radius: 50%;
          background: #059669; color: #fff;
          display: flex; align-items: center; justify-content: center;
        }
        .invite-sent-title {
          font-weight: 600; font-size: .93rem; color: #065f46;
          font-family: 'DM Sans', sans-serif;
        }
        .invite-sent-sub {
          font-size: .82rem; color: #059669;
          font-family: 'DM Sans', sans-serif;
        }

        .skip-link {
          background: none; border: none; padding: 0;
          font-family: 'DM Sans', sans-serif; font-size: .82rem;
          color: var(--ink-faint); cursor: pointer; text-decoration: underline;
          text-underline-offset: 3px;
        }
        .skip-link:hover { color: var(--ink-soft); }

        /* ── Toast ── */
        .toast {
          position: fixed; bottom: 24px; right: 24px; padding: 12px 18px;
          border-radius: 10px; font-family: 'DM Sans', sans-serif;
          font-size: .855rem; font-weight: 500; z-index: 999;
          box-shadow: var(--shadow); animation: toastIn .2s ease;
        }
        .toast--success { background: #166534; color: #fff; }
        .toast--error   { background: #991b1b; color: #fff; }
        @keyframes toastIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <PageHeader
        title="Add Vendor"
        subtitle="Register a new vendor and optionally invite them to the portal"
      />

      <div className="vendor-form-wrap">
        <div className="vendor-form-inner">

          {/* ── Progress bar ── */}
          <div className="progress-bar">
            <div className={`progress-step ${step === 1 ? 'active' : 'done'}`}>
              <div className="progress-dot">
                {step > 1
                  ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  : '1'
                }
              </div>
              Vendor Details
            </div>
            <div className="progress-line" />
            <div className={`progress-step ${step === 2 ? 'active' : step > 2 ? 'done' : ''}`}>
              <div className="progress-dot">2</div>
              Portal Access
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* STEP 1 — Vendor form                                          */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <form onSubmit={handleSubmit}>
              <div className="form-card">

                {/* Basic Info */}
                <p className="section-label">Basic Information</p>
                <div className="grid-2">
                  <div className="field">
                    <label className="field-label">Vendor Name <span>*</span></label>
                    <input
                      className="field-input"
                      value={form.name}
                      onChange={e => setField('name', e.target.value)}
                      placeholder="Acme Supplies Ltd."
                      required
                      autoFocus
                    />
                  </div>
                  <div className="field">
                    <label className="field-label">Status</label>
                    <select
                      className="field-input"
                      value={form.status}
                      onChange={e => setField('status', e.target.value)}
                    >
                      {STATUSES.map(s => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label className="field-label">Email <span>(optional)</span></label>
                    <input
                      className="field-input"
                      type="email"
                      value={form.email}
                      onChange={e => setField('email', e.target.value)}
                      placeholder="contact@vendor.com"
                    />
                  </div>
                  <div className="field">
                    <label className="field-label">Phone <span>(optional)</span></label>
                    <input
                      className="field-input"
                      type="tel"
                      value={form.phone}
                      onChange={e => setField('phone', e.target.value)}
                      placeholder="+1 555 000 0000"
                    />
                  </div>
                </div>

                <div className="field">
                  <label className="field-label">GST Number <span>(optional)</span></label>
                  <input
                    className="field-input"
                    type="text"
                    value={form.gst}
                    onChange={e => setField('gst', e.target.value)}
                    placeholder="e.g. 22AAAAA0000A1Z5"
                    maxLength={15}
                  />
                </div>

                <div className="field">
                  <label className="field-label">Address <span>(optional)</span></label>
                  <textarea
                    className="field-input field-textarea"
                    value={form.address}
                    onChange={e => setField('address', e.target.value)}
                    placeholder="Street, City, Country"
                  />
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
                          className="cat-toggle"
                          onClick={() => toggleCategory(cat)}
                          style={selected
                            ? { background: `${cat.color}18`, color: cat.color, borderColor: `${cat.color}33` }
                            : {}}
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
                  <button
                    type="button"
                    className="new-cat-btn"
                    onClick={handleCreateCategory}
                    disabled={creatingCat || !newCatName.trim()}
                  >
                    {creatingCat ? 'Adding…' : '+ Add'}
                  </button>
                </div>

                <hr className="divider" />

                {/* Notes */}
                <p className="section-label">Notes</p>
                <div className="field">
                  <textarea
                    className="field-input field-textarea"
                    value={form.notes}
                    onChange={e => setField('notes', e.target.value)}
                    placeholder="Internal notes about this vendor…"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => router.push('/dashboard/vendors')}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <svg style={{ animation: 'spin .7s linear infinite' }} width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.3)" strokeWidth="2.5"/>
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
                      </svg>
                      Saving…
                    </>
                  ) : (
                    <>
                      Create Vendor
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M2.5 6.5h8M7 3l3.5 3.5L7 10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* STEP 2 — Portal invite                                        */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div>
              <div className="form-card">

                {/* Hero */}
                <div className="invite-hero">
                  <div className="invite-icon-wrap">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                      stroke="#059669" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <h2 className="invite-title">Invite to Vendor Portal</h2>
                  <p className="invite-sub">
                    Give a contact at <strong>{createdVendorName}</strong> access to view
                    RFQs, submit bids, and collaborate.
                  </p>
                  <div>
                    <span className="vendor-chip">
                      <span className="vendor-chip-dot" />
                      {createdVendorName} · just created
                    </span>
                  </div>
                </div>

                {/* Feature list */}
                <div className="portal-features">
                  {[
                    'View & respond to RFQs',
                    'Submit and track bids',
                    'Manage vendor profile',
                    'Real-time notifications',
                  ].map(f => (
                    <div className="feature-item" key={f}>
                      <span className="feature-check">
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4L3.2 5.7 6.5 2.5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round"/>
                        </svg>
                      </span>
                      {f}
                    </div>
                  ))}
                </div>

                {/* Invite form or sent state */}
                {inviteSent ? (
                  <div className="invite-sent-state">
                    <span className="invite-sent-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                        stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
                        <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
                      </svg>
                    </span>
                    <div className="invite-sent-title">Invitation sent!</div>
                    <div className="invite-sent-sub">{inviteEmail}</div>
                  </div>
                ) : (
                  <form onSubmit={handleInvite}>
                    <div className="field">
                      <label className="field-label">Contact Email</label>
                      <div className="invite-form-row">
                        <div className="field">
                          <input
                            className="field-input"
                            type="email"
                            value={inviteEmail}
                            onChange={e => setInviteEmail(e.target.value)}
                            placeholder="contact@vendor.com"
                            required
                            autoFocus
                          />
                        </div>
                        <button type="submit" className="btn-ink" disabled={inviting || !inviteEmail.trim()}>
                          {inviting ? (
                            <>
                              <svg style={{ animation: 'spin .7s linear infinite' }} width="13" height="13" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.3)" strokeWidth="2.5"/>
                                <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
                              </svg>
                              Sending…
                            </>
                          ) : (
                            <>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
                              </svg>
                              Send Invite
                            </>
                          )}
                        </button>
                      </div>
                      <p style={{ fontSize: '.77rem', color: 'var(--ink-faint)', marginTop: 6, lineHeight: 1.5 }}>
                        They&apos;ll receive an email to set up their account and access{' '}
                        <strong>{createdVendorName}</strong>&apos;s vendor portal.
                      </p>
                    </div>
                  </form>
                )}
              </div>

              {/* Actions */}
              <div className="form-actions" style={{ marginTop: 20 }}>
                {!inviteSent && (
                  <button type="button" className="skip-link" onClick={goToVendor}>
                    Skip for now
                  </button>
                )}
                <button type="button" className="btn-primary" onClick={goToVendor}>
                  {inviteSent ? 'Go to Vendor Profile' : 'Go to Profile'}
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M2.5 6.5h8M7 3l3.5 3.5L7 10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

        </div>
      </div>

      {toast && <div className={`toast toast--${toast.type}`}>{toast.msg}</div>}
    </DashboardLayout>
  );
}
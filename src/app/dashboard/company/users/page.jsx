'use client';
// src/app/dashboard/company/users/page.jsx
//
// Team Members management page.
// vendor_user is intentionally excluded — vendors are invited from
// the Vendor detail page (dashboard/vendors/[id]) instead.

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';

// vendor_user deliberately omitted — vendor invites go through the Vendors module
const ROLES = ['company_admin', 'manager', 'employee'];

export default function UsersPage() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState(null);

  // Invite modal
  const [inviteOpen,  setInviteOpen]  = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole,  setInviteRole]  = useState('employee');
  const [inviting,    setInviting]    = useState(false);

  // Edit role modal
  const [editUser,   setEditUser]   = useState(null);
  const [editRole,   setEditRole]   = useState('');
  const [editSaving, setEditSaving] = useState(false);

  async function loadUsers() {
    const res = await fetch('/api/company/users');
    if (res.ok) setUsers((await res.json()).data);
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleInvite(e) {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await fetch('/api/company/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Invitation sent to ${inviteEmail}`);
        setInviteOpen(false);
        setInviteEmail('');
        setInviteRole('employee');
      } else {
        showToast(data.error, 'error');
      }
    } finally {
      setInviting(false);
    }
  }

  function openEdit(user) {
    setEditUser(user);
    setEditRole(user.role);
  }

  async function handleEditSave() {
    if (!editUser) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/company/users/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('User role updated.');
        setEditUser(null);
        loadUsers();
      } else {
        showToast(data.error, 'error');
      }
    } finally {
      setEditSaving(false);
    }
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  function roleLabel(r) {
    return r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--surface)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '.64rem',
            color: 'var(--ink-soft)', flexShrink: 0,
          }}>
            {row.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 500, fontSize: '.87rem' }}>{row.name}</div>
            <div style={{ fontSize: '.75rem', color: 'var(--ink-faint)' }}>{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      width: 160,
      render: (row) => <Badge variant={row.role}>{row.role}</Badge>,
    },
    {
      key: 'created_at',
      label: 'Joined',
      width: 130,
      render: (row) => (
        <span style={{ fontSize: '.82rem', color: 'var(--ink-soft)' }}>
          {formatDate(row.created_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 80,
      render: (row) => (
        // Don't allow editing vendor_user accounts from here
        row.role === 'vendor_user' ? null : (
          <button
            onClick={() => openEdit(row)}
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 6, padding: '5px 10px', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', fontSize: '.78rem',
              color: 'var(--ink-soft)', transition: 'background .12s, color .12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--ink)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--ink-soft)'; }}
          >
            Edit
          </button>
        )
      ),
    },
  ];

  const inviteBtn = (
    <button
      onClick={() => setInviteOpen(true)}
      style={{
        background: 'var(--accent)', color: '#fff', border: 'none',
        padding: '10px 18px', borderRadius: 8,
        fontFamily: 'DM Sans, sans-serif', fontWeight: 500, fontSize: '.855rem',
        cursor: 'pointer', transition: 'background .15s',
        display: 'flex', alignItems: 'center', gap: 7,
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-h)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M6.5 2v9M2 6.5h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      Invite Member
    </button>
  );

  return (
    <DashboardLayout pageTitle="Users">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@400;500&display=swap');
        .field { margin-bottom: 16px; }
        .field-label { display: block; font-size: .8rem; font-weight: 500; color: var(--ink); margin-bottom: 6px; font-family: 'DM Sans', sans-serif; }
        .field-input { width: 100%; padding: 9px 12px; border: 1px solid var(--border); border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: .875rem; color: var(--ink); background: var(--white); outline: none; transition: border-color .15s, box-shadow .15s; box-sizing: border-box; }
        .field-input:focus { border-color: var(--ink); box-shadow: 0 0 0 3px rgba(15,14,13,.06); }
        .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
        .btn-secondary { background: none; border: 1px solid var(--border); padding: 9px 16px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: .855rem; color: var(--ink-soft); cursor: pointer; transition: background .12s; }
        .btn-secondary:hover { background: var(--surface); }
        .btn-primary { background: var(--accent); color: #fff; border: none; padding: 9px 18px; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: .855rem; cursor: pointer; transition: background .15s; }
        .btn-primary:hover:not(:disabled) { background: var(--accent-h); }
        .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
        .info-note { display: flex; align-items: flex-start; gap: 8px; padding: 10px 12px; background: #faf9f7; border: 1px solid var(--border); border-radius: 8px; font-size: .8rem; color: var(--ink-faint); line-height: 1.5; margin-bottom: 4px; }
        .toast { position: fixed; bottom: 24px; right: 24px; padding: 12px 18px; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: .855rem; font-weight: 500; z-index: 999; box-shadow: var(--shadow); animation: toastIn .2s ease; }
        .toast--success { background: #166534; color: #fff; }
        .toast--error   { background: #991b1b; color: #fff; }
        @keyframes toastIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <PageHeader
        title="Team Members"
        subtitle={`${users.length} member${users.length !== 1 ? 's' : ''} in your organization`}
        action={inviteBtn}
      />

      <DataTable
        columns={columns}
        rows={users}
        loading={loading}
        emptyMessage="No team members yet. Invite your first colleague."
      />

      {/* Invite Modal */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Team Member">
        <form onSubmit={handleInvite}>
          <div className="field">
            <label className="field-label">Email Address</label>
            <input
              className="field-input"
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label className="field-label">Role</label>
            <select
              className="field-input"
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value)}
            >
              {ROLES.map(r => (
                <option key={r} value={r}>{roleLabel(r)}</option>
              ))}
            </select>
          </div>
          <div className="info-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>
              An invitation link will be emailed. The invitee uses it to create their account.
              To invite vendors, go to <strong>Vendors → Add Vendor</strong>.
            </span>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setInviteOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={inviting}>
              {inviting ? 'Sending…' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit Member Role">
        {editUser && (
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 20, padding: '12px 14px',
              background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: 'var(--ink)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '.7rem',
                color: '#fff', flexShrink: 0,
              }}>
                {editUser.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 500, fontSize: '.9rem', fontFamily: 'DM Sans' }}>
                  {editUser.name}
                </div>
                <div style={{ fontSize: '.78rem', color: 'var(--ink-faint)', fontFamily: 'DM Sans' }}>
                  {editUser.email}
                </div>
              </div>
            </div>
            <div className="field">
              <label className="field-label">Role</label>
              <select
                className="field-input"
                value={editRole}
                onChange={e => setEditRole(e.target.value)}
              >
                {ROLES.map(r => (
                  <option key={r} value={r}>{roleLabel(r)}</option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setEditUser(null)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleEditSave} disabled={editSaving}>
                {editSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {toast && <div className={`toast toast--${toast.type}`}>{toast.msg}</div>}
    </DashboardLayout>
  );
}
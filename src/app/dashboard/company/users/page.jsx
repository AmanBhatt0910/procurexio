'use client';
// src/app/dashboard/company/users/page.jsx

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/lib/rbac';

// Roles available when inviting a new member (company_admin is excluded — only 1 per company)
const INVITE_ROLES = [ROLES.MANAGER, ROLES.EMPLOYEE];

// Roles available when editing an existing member (company_admin excluded for same reason)
const EDIT_ROLES = [ROLES.MANAGER, ROLES.EMPLOYEE];

function getInitials(name) {
  if (!name) return '??';
  return name
    .split(' ')
    .map(n => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const currentRole = currentUser?.role;
  const isAdmin = currentRole === ROLES.COMPANY_ADMIN || currentRole === ROLES.SUPER_ADMIN;

  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState(null);

  const [inviteOpen,  setInviteOpen]  = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole,  setInviteRole]  = useState(ROLES.EMPLOYEE);
  const [inviting,    setInviting]    = useState(false);

  const [editUser,   setEditUser]   = useState(null);
  const [editRole,   setEditRole]   = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [page, setPage]   = useState(1);
  const [meta, setMeta]   = useState({ total: 0, totalPages: 1 });
  const PAGE_LIMIT = 20;

  async function loadUsers(p = 1) {
    setLoading(true);
    const res = await fetch(`/api/company/users?page=${p}&limit=${PAGE_LIMIT}`);
    if (res.ok) {
      const json = await res.json();
      setUsers(json.data);
      setMeta(json.meta || {});
    }
    setLoading(false);
  }

  useEffect(() => { loadUsers(page); }, [page]);

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
        setInviteRole(ROLES.EMPLOYEE);
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
        loadUsers(page);
      } else {
        showToast(data.error, 'error');
      }
    } finally {
      setEditSaving(false);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  function roleLabel(r) {
    return r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  const inviteBtn = isAdmin ? (
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
  ) : null;

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
        .pagination { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 14px 0 0; flex-wrap: wrap; }
        .page-info { font-size: .82rem; color: var(--ink-faint); font-family: 'DM Sans', sans-serif; }
        .page-btns { display: flex; gap: 6px; }
        .page-btn { padding: 6px 13px; border: 1px solid var(--border); border-radius: 6px; background: var(--white); font-family: 'DM Sans', sans-serif; font-size: .83rem; font-weight: 500; color: var(--ink); cursor: pointer; transition: background .15s; }
        .page-btn:hover:not(:disabled) { background: var(--surface); }
        .page-btn:disabled { opacity: .4; cursor: not-allowed; }
        .page-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }
        .cu-table-wrap { background: var(--white); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); }
        .cu-table { width: 100%; border-collapse: collapse; font-family: 'DM Sans', sans-serif; font-size: .855rem; }
        .cu-th { padding: 11px 16px; text-align: left; font-size: .71rem; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; color: var(--ink-faint); background: var(--surface); border-bottom: 1px solid var(--border); white-space: nowrap; }
        .cu-td { padding: 13px 16px; color: var(--ink); border-bottom: 1px solid var(--border); vertical-align: middle; }
        .cu-tr:last-child .cu-td { border-bottom: none; }
        .cu-tr:hover .cu-td { background: var(--surface); }
        .cu-role-header td { background: var(--surface); padding: 7px 16px; font-family: 'Syne', sans-serif; font-size: .72rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--ink-soft); border-top: 2px solid var(--border); border-bottom: 1px solid var(--border); }
        .cu-role-header:first-child td { border-top: none; }
        .cu-empty { padding: 48px 16px; text-align: center; color: var(--ink-faint); font-size: .875rem; }
        .cu-loading { padding: 48px 16px; text-align: center; }
        .cu-spinner { width: 20px; height: 20px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin .7s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <PageHeader
        title="Team Members"
        subtitle={`${meta.total ?? users.length} member${(meta.total ?? users.length) !== 1 ? 's' : ''} in your organization`}
        action={inviteBtn}
      />

      <div className="cu-table-wrap">
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="cu-table">
            <thead>
              <tr>
                <th className="cu-th">Name</th>
                <th className="cu-th" style={{ width: 160 }}>Role</th>
                <th className="cu-th" style={{ width: 130 }}>Joined</th>
                {isAdmin && <th className="cu-th" style={{ width: 80 }}></th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isAdmin ? 4 : 3} className="cu-loading"><div className="cu-spinner" /></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={isAdmin ? 4 : 3} className="cu-empty">No team members yet. Invite your first colleague.</td></tr>
              ) : (
                users.flatMap((u, idx) => {
                  const isNewRole = idx === 0 || !users[idx - 1] || users[idx - 1].role !== u.role;
                  const rows = [];
                  if (isNewRole) {
                    rows.push(
                      <tr key={`rh-${u.role}-${idx}`} className="cu-role-header">
                        <td colSpan={isAdmin ? 4 : 3}>{roleLabel(u.role)}</td>
                      </tr>
                    );
                  }
                  rows.push(
                    <tr key={u.id} className="cu-tr">
                      <td className="cu-td">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'var(--surface)', border: '1px solid var(--border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '.64rem',
                            color: 'var(--ink-soft)', flexShrink: 0,
                          }}>
                            {getInitials(u.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: '.87rem' }}>{u.name || '—'}</div>
                            <div style={{ fontSize: '.75rem', color: 'var(--ink-faint)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="cu-td"><Badge variant={u.role}>{u.role}</Badge></td>
                      <td className="cu-td">
                        <span style={{ fontSize: '.82rem', color: 'var(--ink-soft)' }}>{formatDate(u.created_at)}</span>
                      </td>
                      {isAdmin && (
                        <td className="cu-td">
                          {u.role !== ROLES.VENDOR_USER && (
                            <button
                              onClick={() => openEdit(u)}
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
                          )}
                        </td>
                      )}
                    </tr>
                  );
                  return rows;
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!loading && meta.totalPages > 1 && (
        <div className="pagination">
          <span className="page-info">
            Showing {((page - 1) * PAGE_LIMIT) + 1}–{Math.min(page * PAGE_LIMIT, meta.total)} of {meta.total} members
          </span>
          <div className="page-btns">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
              let p;
              if (meta.totalPages <= 5) p = i + 1;
              else if (page <= 3) p = i + 1;
              else if (page >= meta.totalPages - 2) p = meta.totalPages - 4 + i;
              else p = page - 2 + i;
              return (
                <button key={p} className={`page-btn${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              );
            })}
            <button className="page-btn" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        </div>
      )}

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
              {INVITE_ROLES.map(r => (
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
                {getInitials(editUser.name)}
              </div>
              <div>
                <div style={{ fontWeight: 500, fontSize: '.9rem', fontFamily: 'DM Sans' }}>
                  {editUser.name || '—'}
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
                {EDIT_ROLES.map(r => (
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
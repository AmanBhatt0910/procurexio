// src/app/dashboard/contracts/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import AwardStatusBadge from '@/components/award/AwardStatusBadge';
import RoleGuard from '@/components/auth/RoleGuard';

function RedirectToDashboard() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard'); }, [router]);
  return null;
}

function fmt(amount, currency) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount);
}

function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchContracts();
  }, [statusFilter, page]);

  async function fetchContracts() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/contracts?${params}`);
      if (res.ok) {
        const d = await res.json();
        setContracts(d.data || []);
        setMeta(d.meta || {});
      }
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    {
      key: 'contractRef',
      label: 'Contract #',
      render: row => (
        <span style={{ fontFamily: "'DM Sans', monospace", fontSize: '.82rem', fontWeight: 500, color: 'var(--ink-soft)' }}>
          {row.contractRef}
        </span>
      ),
    },
    {
      key: 'rfqRef',
      label: 'RFQ Reference',
      render: row => (
        <div>
          <div style={{ fontWeight: 500, color: 'var(--ink)', fontSize: '.88rem', fontFamily: "'DM Sans', sans-serif" }}>{row.rfqRef}</div>
          <div style={{ fontSize: '.78rem', color: 'var(--ink-soft)', fontFamily: "'DM Sans', sans-serif" }}>{row.rfqTitle}</div>
        </div>
      ),
    },
    {
      key: 'vendorName',
      label: 'Vendor',
      render: row => (
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '.9rem', fontWeight: 500, color: 'var(--ink)' }}>
          {row.vendorName}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      label: 'Total Amount',
      render: row => (
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '.9rem', fontWeight: 600, color: 'var(--accent)' }}>
          {fmt(row.totalAmount, row.currency)}
        </span>
      ),
    },
    {
      key: 'awardedAt',
      label: 'Awarded At',
      render: row => (
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '.85rem', color: 'var(--ink-soft)' }}>
          {fmtDate(row.awardedAt)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: row => <AwardStatusBadge status={row.status} />,
    },
  ];

  return (
    <DashboardLayout>
      <RoleGuard roles={['company_admin', 'manager', 'employee', 'super_admin']} fallback={<RedirectToDashboard />}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@400;500&display=swap');
          :root {
            --ink: #0f0e0d; --ink-soft: #6b6660; --ink-faint: #b8b3ae;
            --surface: #faf9f7; --white: #ffffff;
            --accent: #c8501a; --accent-h: #a83e12;
            --border: #e4e0db; --radius: 10px;
            --shadow: 0 1px 3px rgba(15,14,13,.06), 0 8px 32px rgba(15,14,13,.08);
          }
          .contracts-page { max-width: 1080px; margin: 0 auto; padding: 32px 24px; animation: fadeUp .35s ease both; }
          @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
          .filter-bar { display: flex; gap: 10px; margin-bottom: 20px; align-items: center; }
          .filter-select {
            padding: 7px 12px; border: 1px solid var(--border); border-radius: 8px;
            font-family: 'DM Sans', sans-serif; font-size: .85rem; color: var(--ink);
            background: var(--white); cursor: pointer;
          }
          .filter-select:focus { outline: none; border-color: var(--accent); }
          .filter-label { font-size: .78rem; font-weight: 500; color: var(--ink-soft); font-family: 'DM Sans', sans-serif; }
          .pager { display: flex; justify-content: center; gap: 8px; margin-top: 24px; }
          .pager-btn {
            padding: 6px 16px; border: 1px solid var(--border); border-radius: 8px;
            background: var(--white); font-family: 'DM Sans', sans-serif; font-size: .85rem;
            cursor: pointer; transition: border-color .15s;
          }
          .pager-btn:hover:not(:disabled) { border-color: var(--accent); }
          .pager-btn:disabled { opacity: .4; cursor: not-allowed; }
          .pager-info { font-size: .85rem; color: var(--ink-soft); font-family: 'DM Sans', sans-serif; display: flex; align-items: center; }
          .row-clickable { cursor: pointer; }
          .row-clickable:hover td { background: var(--surface) !important; }
        `}</style>

        <div className="contracts-page">
          <PageHeader
            title="Contracts"
            subtitle={`${meta.total ?? 0} contract${meta.total !== 1 ? 's' : ''} found`}
          />

          <div className="filter-bar">
            <span className="filter-label">Filter by status:</span>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <DataTable
            columns={columns}
            rows={contracts}
            loading={loading}
            emptyMessage="No contracts found."
            onRowClick={row => router.push(`/dashboard/contracts/${row.contractId}`)}
          />

          {meta.pages > 1 && (
            <div className="pager">
              <button className="pager-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
              <span className="pager-info">Page {page} of {meta.pages}</span>
              <button className="pager-btn" disabled={page >= meta.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </div>
      </RoleGuard>
    </DashboardLayout>
  );
}
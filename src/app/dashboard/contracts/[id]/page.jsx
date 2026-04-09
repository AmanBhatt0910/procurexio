// src/app/dashboard/contracts/[id]/page.jsx
'use client';
import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import ContractCard from '@/components/award/ContractCard';
import RoleGuard from '@/components/auth/RoleGuard';
import {useAuth} from '@/hooks/useAuth';

function fmt(amount, currency) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount);
}

function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function ContractDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const isAdmin = user?.role === 'company_admin' || user?.role === 'super_admin';

  const fetchContract = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contracts/${id}`);
      if (!res.ok) { setError('Contract not found'); return; }
      const d = await res.json();
      setContract(d.data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  async function handleCancel() {
    if (!contract) return;
    if (!confirm('Cancel this award? The RFQ will be reopened for re-awarding.')) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/rfqs/${contract.rfq_id}/award`, { method: 'DELETE' });
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Failed to cancel'); return; }
      fetchContract();
    } finally {
      setCancelling(false);
    }
  }

  return (
    <DashboardLayout>
      <RoleGuard roles={['company_admin', 'manager', 'employee', 'super_admin']}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@400;500&display=swap');
          :root {
            --ink: #0f0e0d; --ink-soft: #6b6660; --ink-faint: #b8b3ae;
            --surface: #faf9f7; --white: #ffffff;
            --accent: #c8501a; --accent-h: #a83e12;
            --border: #e4e0db; --radius: 10px;
            --shadow: 0 1px 3px rgba(15,14,13,.06), 0 8px 32px rgba(15,14,13,.08);
          }
          .contract-detail-page { max-width: 860px; margin: 0 auto; padding: 32px 24px; animation: fadeUp .35s ease both; }
          @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
          .section-label {
            font-size: .72rem; font-weight: 600; letter-spacing: .08em;
            text-transform: uppercase; color: var(--ink-faint);
            font-family: 'DM Sans', sans-serif; margin-bottom: 12px;
          }
          .card { border: 1px solid var(--border); border-radius: var(--radius); background: var(--white); box-shadow: var(--shadow); overflow: hidden; margin-bottom: 24px; }
          .card-body { padding: 20px 24px; }
          .rfq-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .rfq-field label { display: block; font-size: .72rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 3px; font-family: 'DM Sans', sans-serif; }
          .rfq-field p { margin: 0; font-size: .9rem; color: var(--ink); font-family: 'DM Sans', sans-serif; }
          .items-table { width: 100%; border-collapse: collapse; font-family: 'DM Sans', sans-serif; }
          .items-table th { text-align: left; font-size: .72rem; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--ink-faint); padding: 0 0 10px; border-bottom: 1px solid var(--border); }
          .items-table td { font-size: .88rem; color: var(--ink); padding: 10px 0; border-bottom: 1px solid var(--border); vertical-align: top; }
          .items-table tr:last-child td { border-bottom: none; }
          .items-table .amount { font-weight: 600; color: var(--accent); text-align: right; }
          .items-table .num { text-align: right; color: var(--ink-soft); }
          .total-row { display: flex; justify-content: flex-end; padding: 12px 24px; border-top: 1px solid var(--border); background: var(--surface); font-family: 'DM Sans', sans-serif; font-size: .95rem; gap: 16px; }
          .total-label { color: var(--ink-soft); }
          .total-value { font-weight: 700; color: var(--accent); font-family: 'Syne', sans-serif; font-size: 1.1rem; }
          .loading-state { display: flex; justify-content: center; align-items: center; min-height: 300px; color: var(--ink-faint); font-family: 'DM Sans', sans-serif; }
          .alert-error { padding: 12px 16px; border-radius: var(--radius); background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; font-family: 'DM Sans', sans-serif; font-size: .88rem; margin-bottom: 16px; }
        `}</style>

        <div className="contract-detail-page">
          <PageHeader
            title="Contract Detail"
            subtitle={contract?.contract_reference}
            action={
              <button
                onClick={() => router.push('/dashboard/contracts')}
                style={{ padding: '8px 16px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--white)', color: 'var(--ink)', fontFamily: "'DM Sans', sans-serif", fontSize: '.85rem', cursor: 'pointer' }}
              >
                ← All Contracts
              </button>
            }
          />

          {loading ? (
            <div className="loading-state">Loading contract…</div>
          ) : error ? (
            <div className="alert-error">{error}</div>
          ) : contract ? (
            <>
              {/* Contract card */}
              <div style={{ marginBottom: 24 }}>
                <div className="section-label">Contract Summary</div>
                <ContractCard
                  contract={contract}
                  onCancel={isAdmin ? handleCancel : null}
                  readOnly={!isAdmin}
                />
              </div>

              {/* RFQ snapshot */}
              <div style={{ marginBottom: 24 }}>
                <div className="section-label">RFQ Details</div>
                <div className="card">
                  <div className="card-body">
                    <div className="rfq-summary">
                      <div className="rfq-field">
                        <label>Reference</label>
                        <p>{contract.rfq_ref}</p>
                      </div>
                      <div className="rfq-field">
                        <label>Title</label>
                        <p>{contract.rfq_title}</p>
                      </div>
                      <div className="rfq-field">
                        <label>Deadline</label>
                        <p>{fmtDate(contract.rfq_deadline)}</p>
                      </div>
                      {contract.rfq_description && (
                        <div className="rfq-field" style={{ gridColumn: '1 / -1' }}>
                          <label>Description</label>
                          <p style={{ whiteSpace: 'pre-wrap' }}>{contract.rfq_description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Winning bid line items */}
              {contract.items?.length > 0 && (
                <div>
                  <div className="section-label">Awarded Bid — Line Items</div>
                  <div className="card">
                    <div className="card-body">
                      <table className="items-table">
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th style={{ textAlign: 'right' }}>Qty</th>
                            <th style={{ textAlign: 'right' }}>Unit</th>
                            <th style={{ textAlign: 'right' }}>Unit Price</th>
                            <th style={{ textAlign: 'right' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contract.items.map(item => (
                            <tr key={item.id}>
                              <td>{item.item_description}</td>
                              <td className="num">{item.quantity}</td>
                              <td className="num" style={{ color: 'var(--ink-faint)' }}>{item.unit}</td>
                              <td className="num">{fmt(item.unit_price, contract.currency)}</td>
                              <td className="amount">{fmt(item.total_price, contract.currency)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="total-row">
                      <span className="total-label">Contract Total</span>
                      <span className="total-value">{fmt(contract.total_amount, contract.currency)}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </RoleGuard>
    </DashboardLayout>
  );
}

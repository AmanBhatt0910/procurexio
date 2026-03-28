'use client';

// /dashboard/bids/[rfqId] — Vendor bid workspace

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import RFQStatusBadge from '@/components/rfq/RFQStatusBadge';
import BidStatusBadge from '@/components/bids/BidStatusBadge';
import BidItemsForm from '@/components/bids/BidItemsForm';

function InfoRow({ label, children }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
      <span style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ink-faint)', minWidth: 110, paddingTop: 2 }}>{label}</span>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '.9rem', color: 'var(--ink)' }}>{children}</span>
    </div>
  );
}

export default function VendorBidWorkspace() {
  const { rfqId } = useParams();
  const router = useRouter();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [bidItemsState, setBidItemsState] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bids/rfqs/${rfqId}`);
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setData(d.data);
      setNotes(d.data.bid?.notes || '');
      setCurrency(d.data.bid?.currency || d.data.rfq?.currency || 'USD');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [rfqId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const rfq = data?.rfq;
  const bid = data?.bid;
  const isDeadlinePassed = rfq?.deadline && new Date() > new Date(rfq.deadline);
  const isRfqClosed = ['closed', 'cancelled'].includes(rfq?.status);
  const canEdit = !isDeadlinePassed && !isRfqClosed && bid?.status !== 'withdrawn';
  const canSubmit = canEdit && bid?.status === 'draft';
  const canWithdraw = !isDeadlinePassed && !isRfqClosed && bid?.status === 'submitted';

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      // Ensure bid exists
      if (!bid) {
        const r = await fetch(`/api/bids/rfqs/${rfqId}/bid`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes, currency }),
        });
        const d = await r.json();
        if (d.error) throw new Error(d.error);
      }

      const r = await fetch(`/api/bids/rfqs/${rfqId}/bid`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, currency, items: bidItemsState }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setSuccess('Bid saved as draft.');
      fetchData();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await handleSave(); // save first
      const r = await fetch(`/api/bids/rfqs/${rfqId}/bid/submit`, { method: 'POST' });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setSuccess('Bid submitted successfully!');
      fetchData();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWithdraw() {
    if (!confirm('Are you sure you want to withdraw this bid?')) return;
    setWithdrawing(true);
    setError(null);
    try {
      const r = await fetch(`/api/bids/rfqs/${rfqId}/bid/withdraw`, { method: 'POST' });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setSuccess('Bid withdrawn.');
      fetchData();
    } catch (e) {
      setError(e.message);
    } finally {
      setWithdrawing(false);
    }
  }

  return (
    <DashboardLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&family=Syne:wght@400;600;700;800&display=swap');
        :root {
          --ink: #0f0e0d; --ink-soft: #6b6660; --ink-faint: #b8b3ae;
          --surface: #faf9f7; --white: #ffffff; --accent: #c8501a; --accent-h: #a83e12;
          --border: #e4e0db; --radius: 10px; --shadow: 0 1px 3px rgba(15,14,13,.06), 0 8px 32px rgba(15,14,13,.08);
        }
        .bw-page { padding: 32px; max-width: 1100px; }
        .bw-grid { display: grid; grid-template-columns: 1fr 300px; gap: 28px; margin-top: 28px; }
        .bw-main { min-width: 0; }
        .bw-aside {}
        .bw-card {
          background: var(--white); border: 1px solid var(--border); border-radius: var(--radius);
          box-shadow: var(--shadow); padding: 24px; margin-bottom: 20px;
        }
        .bw-card-title {
          font-family: 'Syne', sans-serif; font-size: .88rem; font-weight: 700;
          letter-spacing: -.01em; color: var(--ink); margin: 0 0 16px 0; padding-bottom: 12px;
          border-bottom: 1px solid var(--border);
        }
        .bw-label {
          font-size: .72rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
          color: var(--ink-faint); display: block; margin-bottom: 5px;
        }
        .bw-input, .bw-textarea, .bw-select {
          width: 100%; padding: 8px 12px; border: 1px solid var(--border); border-radius: 7px;
          font-size: .875rem; font-family: 'DM Sans', sans-serif; color: var(--ink);
          background: var(--white); outline: none; transition: border-color .15s; box-sizing: border-box;
        }
        .bw-input:focus, .bw-textarea:focus, .bw-select:focus { border-color: var(--accent); }
        .bw-textarea { resize: vertical; min-height: 80px; }
        .bw-row { margin-bottom: 16px; }
        .bw-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 20px; }
        .btn-primary {
          padding: 10px 22px; border-radius: var(--radius); border: none;
          background: var(--accent); color: #fff; font-family: 'DM Sans', sans-serif;
          font-size: .875rem; font-weight: 500; cursor: pointer; transition: background .15s;
        }
        .btn-primary:hover { background: var(--accent-h); }
        .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
        .btn-secondary {
          padding: 10px 20px; border-radius: var(--radius); border: 1px solid var(--border);
          background: var(--white); color: var(--ink); font-family: 'DM Sans', sans-serif;
          font-size: .875rem; font-weight: 500; cursor: pointer; transition: all .15s;
        }
        .btn-secondary:hover { border-color: var(--ink-soft); }
        .btn-danger {
          padding: 10px 20px; border-radius: var(--radius); border: 1px solid #f9c6c6;
          background: #fff5f5; color: #c62828; font-family: 'DM Sans', sans-serif;
          font-size: .875rem; font-weight: 500; cursor: pointer; transition: all .15s;
        }
        .btn-danger:hover { background: #ffe8e8; }
        .alert {
          padding: 12px 16px; border-radius: 8px; font-family: 'DM Sans', sans-serif;
          font-size: .875rem; margin-bottom: 20px;
        }
        .alert-error { background: #fff5f5; color: #c62828; border: 1px solid #f9c6c6; }
        .alert-success { background: #e8f5e9; color: #1b5e20; border: 1px solid #c8e6c9; }
        .alert-warning { background: #fff8e1; color: #e65100; border: 1px solid #ffe0b2; }
        .bw-spinner { text-align: center; padding: 80px 0; color: var(--ink-faint); font-family: 'DM Sans', sans-serif; }
        @media (max-width: 768px) { .bw-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="bw-page">
        {loading ? (
          <div className="bw-spinner">Loading…</div>
        ) : error && !data ? (
          <div className="alert alert-error">{error}</div>
        ) : (
          <>
            <PageHeader
              title={rfq?.title}
              subtitle={`${rfq?.reference_number} · Bid Workspace`}
              action={
                <button className="btn-secondary" onClick={() => router.push('/dashboard/bids')}>
                  ← Back to My Bids
                </button>
              }
            />

            {error   && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            {isDeadlinePassed && <div className="alert alert-warning">⚠ The deadline for this RFQ has passed. Bids can no longer be edited or submitted.</div>}
            {isRfqClosed && <div className="alert alert-warning">⚠ This RFQ is {rfq?.status}. Bids can no longer be modified.</div>}

            <div className="bw-grid">
              {/* Main — bid form */}
              <div className="bw-main">
                <div className="bw-card">
                  <div className="bw-card-title">Your Bid Items</div>
                  <BidItemsForm
                    rfqItems={data?.items || []}
                    bidItems={data?.bidItems || []}
                    onChange={setBidItemsState}
                    readOnly={!canEdit}
                  />
                </div>

                {canEdit && (
                  <div className="bw-card">
                    <div className="bw-card-title">Bid Details</div>
                    <div className="bw-row">
                      <label className="bw-label">Currency</label>
                      <select className="bw-select" value={currency} onChange={e => setCurrency(e.target.value)}>
                        {['USD','EUR','GBP','INR','AED','JPY','CAD','AUD','SGD'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="bw-row">
                      <label className="bw-label">Notes (optional)</label>
                      <textarea
                        className="bw-textarea"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Add any notes, conditions, or comments about your bid…"
                      />
                    </div>
                  </div>
                )}

                <div className="bw-actions">
                  {canEdit && (
                    <button className="btn-secondary" disabled={saving} onClick={handleSave}>
                      {saving ? 'Saving…' : 'Save Draft'}
                    </button>
                  )}
                  {canSubmit && (
                    <button className="btn-primary" disabled={submitting} onClick={handleSubmit}>
                      {submitting ? 'Submitting…' : 'Submit Bid'}
                    </button>
                  )}
                  {canWithdraw && (
                    <button className="btn-danger" disabled={withdrawing} onClick={handleWithdraw}>
                      {withdrawing ? 'Withdrawing…' : 'Withdraw Bid'}
                    </button>
                  )}
                  {bid?.status === 'withdrawn' && !isDeadlinePassed && !isRfqClosed && (
                    <button className="btn-primary" onClick={handleSave}>
                      Resubmit Bid
                    </button>
                  )}
                </div>
              </div>

              {/* Sidebar — RFQ info */}
              <div className="bw-aside">
                <div className="bw-card">
                  <div className="bw-card-title">RFQ Information</div>
                  <InfoRow label="Reference">{rfq?.reference_number}</InfoRow>
                  <InfoRow label="Status"><RFQStatusBadge status={rfq?.status} /></InfoRow>
                  <InfoRow label="Deadline">
                    {rfq?.deadline
                      ? new Date(rfq.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </InfoRow>
                  {rfq?.budget && <InfoRow label="Budget">{parseFloat(rfq.budget).toLocaleString('en-US', { minimumFractionDigits: 2 })} {rfq.currency}</InfoRow>}
                  {rfq?.description && (
                    <div style={{ marginTop: 12, fontSize: '.86rem', color: 'var(--ink-soft)', lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
                      {rfq.description}
                    </div>
                  )}
                </div>

                {bid && (
                  <div className="bw-card">
                    <div className="bw-card-title">Your Bid Status</div>
                    <InfoRow label="Status"><BidStatusBadge status={bid.status} /></InfoRow>
                    <InfoRow label="Total Amount">
                      <strong>{parseFloat(bid.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} {bid.currency}</strong>
                    </InfoRow>
                    {bid.submitted_at && (
                      <InfoRow label="Submitted">
                        {new Date(bid.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </InfoRow>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
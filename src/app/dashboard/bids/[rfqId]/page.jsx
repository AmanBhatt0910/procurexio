'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import BidHeader from '@/components/bids/BidHeader';
import BidValidationMessages from '@/components/bids/BidValidationMessages';
import BidWorkflowSteps from '@/components/bids/BidWorkflowSteps';
import BidStepOne from '@/components/bids/BidStepOne';
import BidStepTwo from '@/components/bids/BidStepTwo';
import BidStepThree from '@/components/bids/BidStepThree';
import BidStepFour from '@/components/bids/BidStepFour';
import Modal from '@/components/ui/Modal';

// Minimum bid reduction required when updating a submitted bid (in currency units)
const MIN_BID_REDUCTION = 100;

export default function VendorBidWorkspacePage() {
  const { rfqId } = useParams();
  const router    = useRouter();

  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [bidItems, setBidItems]   = useState([]);
  const [notes, setNotes]         = useState('');
  const [currency, setCurrency]   = useState('USD');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [freightCharge, setFreightCharge] = useState('');
  const [confirmModal, setConfirmModal] = useState({ open: false, action: '' });
  const [companyCurrency, setCompanyCurrency] = useState('USD');

  const [outcome, setOutcome]   = useState(null);
  const [bidRank, setBidRank]   = useState(null);
  const [updateMode, setUpdateMode] = useState(false);

  // File attachment state
  const [attachments, setAttachments]     = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError]     = useState('');

  // Alternative items state
  const [altItems, setAltItems] = useState([]);

  // Step navigation (1-4); synced from workflowStep after data loads
  const [substep, setSubstep] = useState(1);

  const normalizeBidItems = (items = []) =>
    items.map((item) => ({
      rfq_item_id: item.rfq_item_id,
      unit_price: parseFloat(item.unit_price) || 0,
      quantity: parseFloat(item.quantity) || 0,
      tax_rate: parseFloat(item.tax_rate) || 0,
      notes: item.notes || '',
    }));

  const refreshRank = useCallback(async () => {
    try {
      const res = await fetch(`/api/bids/rfqs/${rfqId}/rank`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) setBidRank(json.data);
      }
    } catch { /* ignore */ }
  }, [rfqId]);

  const fetchData = useCallback(async (overrideCurrency) => {
    try {
      const res  = await fetch(`/api/bids/rfqs/${rfqId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setData(json.data);
      if (json.data.bid) {
        setBidItems(normalizeBidItems(json.data.bid.items || []));
        setNotes(json.data.bid.notes || '');
        setCurrency(json.data.bid.currency || overrideCurrency || 'USD');
        setPaymentTerms(json.data.bid.payment_terms   != null ? String(json.data.bid.payment_terms)   : '');
        setFreightCharge(json.data.bid.freight_charges != null ? String(json.data.bid.freight_charges) : '');
        try {
          const attRes = await fetch(`/api/bids/rfqs/${rfqId}/bid/attachments`);
          if (attRes.ok) {
            const attJson = await attRes.json();
            setAttachments(attJson.data || []);
          }
        } catch { /* ignore */ }
        try {
          const altRes = await fetch(`/api/bids/rfqs/${rfqId}/bid/alternatives`);
          if (altRes.ok) {
            const altJson = await altRes.json();
            setAltItems(altJson.data || []);
          }
        } catch { /* ignore */ }
      } else {
        setBidItems([]);
        setCurrency(overrideCurrency || 'USD');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [rfqId]);

  useEffect(() => {
    Promise.all([
      fetch('/api/company/settings').then(r => r.ok ? r.json() : null),
      fetch(`/api/bids/rfqs/${rfqId}/outcome`).then(r => r.ok ? r.json() : null),
      fetch(`/api/bids/rfqs/${rfqId}/rank`).then(r => r.ok ? r.json() : null),
    ]).then(([settingsJson, outcomeJson, rankJson]) => {
      const resolved = settingsJson?.data?.currency || 'USD';
      setCompanyCurrency(resolved);
      if (outcomeJson?.data) setOutcome(outcomeJson.data);
      if (rankJson?.data) setBidRank(rankJson.data);
      fetchData(resolved);
    }).catch(() => {
      fetchData('USD');
    });
  }, [rfqId, fetchData]);

  const rfq      = data?.rfq;
  const bid      = data?.bid;
  const rfqItems = data?.items || [];

  const isClosed       = rfq?.status === 'closed' || rfq?.status === 'cancelled';
  const isPastDeadline = rfq?.deadline && new Date() > new Date(rfq.deadline);
  const isLocked       = isClosed || isPastDeadline;
  const canEdit        = bid && bid.status === 'draft'     && !isLocked;
  const canUpdate      = bid && bid.status === 'submitted' && !isLocked;
  const canWithdraw    = bid?.status === 'submitted' && !isLocked;

  // Derive progress step (1-based 1..4) used to initialise the substep after load
  const workflowStep = (() => {
    if (!bid) return 1;
    if (bid.status === 'submitted' || bid.status === 'awarded' || bid.status === 'rejected') return 4;
    const hasPrices = (bid.items || []).some(i => (parseFloat(i.unit_price) || 0) > 0);
    if (hasPrices) return 3;
    return 2;
  })();

  // Once data finishes loading, place the user at their natural workflow step
  useEffect(() => {
    if (!loading) setSubstep(workflowStep);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // ── File Attachments ──────────────────────────────────────────────────────
  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploadingFile(true); setUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res  = await fetch(`/api/bids/rfqs/${rfqId}/bid/attachments`, { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');
      setAttachments(prev => [...prev, json.data]);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploadingFile(false);
    }
  }

  async function handleDeleteAttachment(id) {
    if (!confirm('Remove this attachment?')) return;
    try {
      const res = await fetch(`/api/bids/rfqs/${rfqId}/bid/attachments?attachmentId=${id}`, { method: 'DELETE' });
      if (res.ok) setAttachments(prev => prev.filter(a => a.id !== id));
    } catch { /* ignore */ }
  }

  // ── Alternative Items ──────────────────────────────────────────────────────
  async function handleAddAlt(payload) {
    const res  = await fetch(`/api/bids/rfqs/${rfqId}/bid/alternatives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    setAltItems(prev => [...prev, json.data]);
  }

  async function handleDeleteAlt(altId) {
    if (!confirm('Remove this alternative item suggestion?')) return;
    try {
      await fetch(`/api/bids/rfqs/${rfqId}/bid/alternatives?altId=${altId}`, { method: 'DELETE' });
      setAltItems(prev => prev.filter(a => a.id !== altId));
    } catch { /* ignore */ }
  }

  // ── Bid Actions ──────────────────────────────────────────────────────────
  async function handleCreateBid() {
    setSaving(true); setError(''); setSuccess('');
    try {
      const res  = await fetch(`/api/bids/rfqs/${rfqId}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency,
          payment_terms:  paymentTerms  !== '' ? paymentTerms  : null,
          freight_charge: freightCharge !== '' ? freightCharge : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSuccess('Bid created! Fill in your prices below.');
      await fetchData(companyCurrency);
      setSubstep(2);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    setSaving(true); setError(''); setSuccess('');
    try {
      const res  = await fetch(`/api/bids/rfqs/${rfqId}/bid`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, currency, items: bidItems }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSuccess('Bid saved successfully.');
      await fetchData(companyCurrency);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    setSaving(true); setError(''); setSuccess('');
    try {
      const saveRes = await fetch(`/api/bids/rfqs/${rfqId}/bid`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, currency, items: bidItems }),
      });
      const saveJson = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveJson.error || 'Failed to save bid before submission. Please try again.');
      const res  = await fetch(`/api/bids/rfqs/${rfqId}/bid/submit`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSuccess('Bid submitted successfully!');
      setConfirmModal({ open: false, action: '' });
      await fetchData(companyCurrency);
      await refreshRank();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate() {
    setSaving(true); setError(''); setSuccess('');
    try {
      const res  = await fetch(`/api/bids/rfqs/${rfqId}/bid/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, currency, items: bidItems }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSuccess('Bid updated successfully!');
      setUpdateMode(false);
      setConfirmModal({ open: false, action: '' });
      if (json.data?.rank !== undefined) {
        setBidRank({ rank: json.data.rank, totalBids: json.data.totalBids });
      } else {
        await refreshRank();
      }
      await fetchData(companyCurrency);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleWithdraw() {
    setSaving(true); setError(''); setSuccess('');
    try {
      const res  = await fetch(`/api/bids/rfqs/${rfqId}/bid/withdraw`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSuccess('Bid withdrawn.');
      setConfirmModal({ open: false, action: '' });
      await fetchData(companyCurrency);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Syne:wght@600;700;800&display=swap');
        :root {
          --ink:#0f0e0d;--ink-soft:#6b6660;--ink-faint:#b8b3ae;
          --surface:#faf9f7;--white:#ffffff;--accent:#c8501a;--accent-h:#a83e12;
          --border:#e4e0db;--radius:10px;
          --shadow:0 1px 3px rgba(15,14,13,.06),0 8px 32px rgba(15,14,13,.08);
        }
        body { font-family: 'DM Sans', sans-serif; }
        .rfq-meta-card {
          background: var(--white); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 20px 24px;
          margin-bottom: 24px; box-shadow: var(--shadow);
        }
        .rfq-meta-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px; margin-top: 12px;
        }
        .meta-item label {
          display: block; font-size: .72rem; font-weight: 600;
          letter-spacing: .08em; text-transform: uppercase;
          color: var(--ink-faint); margin-bottom: 4px;
        }
        .meta-item span { font-size: .9rem; font-weight: 500; color: var(--ink); }
        .bid-card {
          background: var(--white); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 24px;
          margin-bottom: 24px; box-shadow: var(--shadow);
        }
        .bid-card-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 20px;
        }
        .section-label {
          font-size: .72rem; font-weight: 600; letter-spacing: .08em;
          text-transform: uppercase; color: var(--ink-faint);
        }
        .form-row { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
        .form-group { flex: 1; min-width: 200px; }
        .form-group label {
          display: block; font-size: .79rem; font-weight: 500;
          color: var(--ink); margin-bottom: 6px;
        }
        .form-control {
          width: 100%; padding: 9px 12px; border: 1px solid var(--border);
          border-radius: 6px; font-size: .88rem; font-family: 'DM Sans', sans-serif;
          color: var(--ink); background: var(--white); outline: none;
          transition: border-color .15s; box-sizing: border-box;
        }
        .form-control:focus { border-color: var(--accent); }
        .form-control:disabled { background: var(--surface); color: var(--ink-soft); cursor: not-allowed; }
        .actions-bar {
          display: flex; gap: 10px; align-items: center;
          padding-top: 20px; border-top: 1px solid var(--border);
          margin-top: 20px; flex-wrap: wrap;
        }
        .btn {
          padding: 9px 20px; border-radius: 8px; font-size: .88rem;
          font-weight: 600; cursor: pointer; border: none;
          font-family: 'DM Sans', sans-serif; transition: all .15s;
        }
        .btn-primary { background: var(--ink); color: var(--white); }
        .btn-primary:hover:not(:disabled) { background: #2a2928; }
        .btn-accent { background: var(--accent); color: var(--white); }
        .btn-accent:hover:not(:disabled) { background: var(--accent-h); }
        .btn-outline {
          background: transparent; color: var(--ink);
          border: 1px solid var(--border);
        }
        .btn-outline:hover:not(:disabled) { background: var(--surface); }
        .btn-danger { background: #fdf0eb; color: var(--accent); border: 1px solid #f5c9b6; }
        .btn-danger:hover:not(:disabled) { background: #fae3d9; }
        .btn:disabled { opacity: .5; cursor: not-allowed; }
        .error-box {
          background: #fdf0eb; border: 1px solid #f5c9b6; border-radius: var(--radius);
          padding: 12px 16px; color: var(--accent); font-size: .86rem; margin-bottom: 16px;
        }
        .success-box {
          background: #e8f5ee; border: 1px solid #b8dfc8; border-radius: var(--radius);
          padding: 12px 16px; color: #1a7a4a; font-size: .86rem; margin-bottom: 16px;
        }
        .warning-banner {
          background: #fff8e8; border: 1px solid #f5dfa0; border-radius: var(--radius);
          padding: 12px 16px; color: #8a6500; font-size: .86rem; margin-bottom: 16px;
          display: flex; align-items: center; gap: 8px;
        }
        .confirm-text { font-family: 'DM Sans', sans-serif; color: var(--ink); font-size: .92rem; line-height: 1.6; }
        .confirm-actions { display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end; }
        .skeleton { background: linear-gradient(90deg, #f0ede9 25%, #faf9f7 50%, #f0ede9 75%); background-size: 200% 100%; animation: shimmer 1.2s infinite; border-radius: 6px; }
        @keyframes shimmer { to { background-position: -200% 0; } }
        /* Ranking card */
        .rank-card {
          border-radius: var(--radius); padding: 20px 24px;
          margin-bottom: 24px; box-shadow: var(--shadow);
          display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
        }
        .rank-card--l1 { background: #e8f5ee; border: 1.5px solid #6ee7b7; }
        .rank-card--l2 { background: #e8edf9; border: 1.5px solid #93c5fd; }
        .rank-card--l3 { background: #f4f4f5; border: 1.5px solid #d4d4d8; }
        .rank-card--other { background: var(--white); border: 1px solid var(--border); }
        .rank-badge-large {
          font-family: 'Syne', sans-serif; font-weight: 800;
          font-size: 2rem; letter-spacing: -.04em; line-height: 1; flex-shrink: 0;
        }
        .rank-badge-large--l1 { color: #1a7a4a; }
        .rank-badge-large--l2 { color: #2563eb; }
        .rank-badge-large--l3 { color: #6b7280; }
        .rank-badge-large--other { color: var(--ink); }
        .rank-label {
          font-size: .72rem; font-weight: 600; letter-spacing: .08em;
          text-transform: uppercase; margin-bottom: 2px;
        }
        .rank-label--l1 { color: #1a7a4a; }
        .rank-label--l2 { color: #2563eb; }
        .rank-label--l3 { color: #6b7280; }
        .rank-label--other { color: var(--ink-soft); }
        .rank-desc { font-size: .88rem; color: var(--ink-soft); }
        .rank-total { font-size: .78rem; color: var(--ink-faint); margin-top: 2px; }
        /* Update bid panel */
        .update-panel {
          background: #fff8e8; border: 1px solid #f5dfa0; border-radius: var(--radius);
          padding: 16px 20px; margin-bottom: 16px;
        }
        .update-panel-title {
          font-family: 'Syne', sans-serif; font-weight: 700; font-size: .9rem;
          color: #8a6500; margin-bottom: 4px;
        }
        .update-panel-sub { font-size: .82rem; color: #8a6500; opacity: .8; }
        /* Alt items */
        .alt-card {
          background: var(--white); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 20px 24px;
          margin-bottom: 24px; box-shadow: var(--shadow);
        }
        .alt-item-row {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 8px; padding: 14px 16px; margin-bottom: 10px;
          display: flex; align-items: flex-start; gap: 12px;
        }
        .alt-item-row:last-child { margin-bottom: 0; }
        .alt-item-details { flex: 1; min-width: 0; }
        .alt-item-name { font-weight: 600; font-size: .9rem; color: var(--ink); }
        .alt-item-meta { font-size: .78rem; color: var(--ink-soft); margin-top: 3px; }
        .alt-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 640px) {
          .alt-form-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <DashboardLayout>
        {loading ? (
          <div>
            <div className="skeleton" style={{ height: 32, width: 300, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 18, width: 200, marginBottom: 24 }} />
            <div className="skeleton" style={{ height: 120, marginBottom: 24 }} />
            <div className="skeleton" style={{ height: 300 }} />
          </div>
        ) : !rfq && error ? (
          <div className="error-box">{error}</div>
        ) : rfq ? (
          <>
            <PageHeader
              title={rfq.title}
              subtitle={`${rfq.reference_number} · Bid Workspace`}
              action={
                <button className="btn btn-outline" onClick={() => router.back()}>
                  ← Back
                </button>
              }
            />

            {/* Workflow step indicator */}
            <BidWorkflowSteps currentStep={substep} isLocked={isLocked} />

            {/* RFQ Details + Countdown */}
            <BidHeader rfq={rfq} rfqItems={rfqItems} isPastDeadline={isPastDeadline} />

            {/* Validation messages, warnings, and outcome banner */}
            <BidValidationMessages
              error={error}
              success={success}
              isClosed={isClosed}
              isPastDeadline={isPastDeadline}
              outcome={outcome}
              rfqClosed={isClosed}
            />

            {/* Step 1 — Create / Review bid setup */}
            {substep === 1 && (
              <BidStepOne
                bid={bid}
                isPastDeadline={isPastDeadline}
                currency={currency}
                setCurrency={setCurrency}
                companyCurrency={companyCurrency}
                paymentTerms={paymentTerms}
                setPaymentTerms={setPaymentTerms}
                freightCharge={freightCharge}
                setFreightCharge={setFreightCharge}
                saving={saving}
                onCreateBid={handleCreateBid}
                onNext={() => setSubstep(2)}
              />
            )}

            {/* Step 2 — Enter item prices */}
            {substep === 2 && bid && (
              <BidStepTwo
                rfqItems={rfqItems}
                bid={bid}
                currency={currency}
                setCurrency={setCurrency}
                companyCurrency={companyCurrency}
                notes={notes}
                setNotes={setNotes}
                bidItems={bidItems}
                setBidItems={setBidItems}
                canEdit={canEdit}
                canUpdate={canUpdate}
                updateMode={updateMode}
                saving={saving}
                isLocked={isLocked}
                onSave={handleSave}
                onEnterUpdateMode={() => { setUpdateMode(true); setSubstep(2); setError(''); setSuccess(''); }}
                onCancelUpdateMode={() => { setUpdateMode(false); setError(''); setSuccess(''); }}
                onBack={() => setSubstep(1)}
                onNext={() => setSubstep(3)}
              />
            )}

            {/* Step 3 — Attachments & Alternative items */}
            {substep === 3 && bid && (
              <BidStepThree
                rfqId={rfqId}
                rfqItems={rfqItems}
                isLocked={isLocked}
                attachments={attachments}
                uploadingFile={uploadingFile}
                uploadError={uploadError}
                onFileUpload={handleFileUpload}
                onDeleteAttachment={handleDeleteAttachment}
                altItems={altItems}
                onAddAlt={handleAddAlt}
                onDeleteAlt={handleDeleteAlt}
                onBack={() => setSubstep(2)}
                onNext={() => setSubstep(4)}
              />
            )}

            {/* Step 4 — Review & Submit */}
            {substep === 4 && bid && (
              <BidStepFour
                bid={bid}
                currency={currency}
                bidRank={bidRank}
                canEdit={canEdit}
                canUpdate={canUpdate}
                canWithdraw={canWithdraw}
                updateMode={updateMode}
                saving={saving}
                bidItems={bidItems}
                onSave={handleSave}
                onEnterUpdateMode={() => { setUpdateMode(true); setSubstep(2); setError(''); setSuccess(''); }}
                onCancelUpdateMode={() => { setUpdateMode(false); setError(''); setSuccess(''); }}
                onOpenConfirmModal={action => setConfirmModal({ open: true, action })}
                onBack={() => setSubstep(3)}
              />
            )}
          </>
        ) : null}

        {/* Confirm modal */}
        <Modal
          open={confirmModal.open}
          onClose={() => setConfirmModal({ open: false, action: '' })}
          title={
            confirmModal.action === 'submit' ? 'Confirm Bid Submission' :
            confirmModal.action === 'update' ? 'Confirm Bid Update'     :
            'Confirm Bid Withdrawal'
          }
          width={500}
        >
          {confirmModal.action === 'submit' ? (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: '#fdf0eb', border: '1px solid #f5c9b6',
                borderRadius: 8, padding: '14px 16px', marginBottom: 16,
              }}>
                <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>📤</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.92rem', color: 'var(--accent)', marginBottom: 2 }}>
                    Ready to submit your bid?
                  </div>
                  <div style={{ fontSize: '.82rem', color: '#8a4010' }}>
                    Once submitted, the buyer can see your prices.
                    You can still withdraw it before the deadline.
                  </div>
                </div>
              </div>
              <p className="confirm-text">
                Please review your item prices before confirming. The buyer will receive a
                notification and will be able to see your prices immediately.
              </p>
              <div className="confirm-actions">
                <button className="btn btn-outline" onClick={() => setConfirmModal({ open: false, action: '' })}>
                  Cancel
                </button>
                <button
                  className="btn btn-accent"
                  disabled={saving}
                  onClick={handleSubmit}
                  style={{ minWidth: 140, fontSize: '.92rem' }}
                >
                  {saving ? 'Submitting…' : '✓ Yes, Submit Bid'}
                </button>
              </div>
            </>
          ) : confirmModal.action === 'update' ? (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: '#fff8e8', border: '1px solid #f5dfa0',
                borderRadius: 8, padding: '14px 16px', marginBottom: 16,
              }}>
                <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>✏️</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.92rem', color: '#8a6500', marginBottom: 2 }}>
                    Updating your submitted bid
                  </div>
                  <div style={{ fontSize: '.82rem', color: '#8a6500', opacity: .85 }}>
                    Your new prices must be at least{' '}
                    <strong>{MIN_BID_REDUCTION} {currency} lower</strong> than your current bid.
                  </div>
                </div>
              </div>
              <p className="confirm-text">
                Your new prices will replace your current submission. The buyer will see the
                updated figures.
              </p>
              <div className="confirm-actions">
                <button className="btn btn-outline" onClick={() => setConfirmModal({ open: false, action: '' })}>
                  Cancel
                </button>
                <button
                  className="btn btn-accent"
                  disabled={saving}
                  onClick={handleUpdate}
                  style={{ minWidth: 140, fontSize: '.92rem' }}
                >
                  {saving ? 'Updating…' : '✓ Yes, Update Bid'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: '#fdf0eb', border: '1px solid #f5c9b6',
                borderRadius: 8, padding: '14px 16px', marginBottom: 16,
              }}>
                <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>⚠️</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.92rem', color: 'var(--accent)', marginBottom: 2 }}>
                    Withdraw your bid?
                  </div>
                  <div style={{ fontSize: '.82rem', color: '#8a4010' }}>
                    Your submission will be removed. You can resubmit before the deadline.
                  </div>
                </div>
              </div>
              <p className="confirm-text">
                Are you sure you want to withdraw? The buyer will no longer see your prices.
              </p>
              <div className="confirm-actions">
                <button className="btn btn-outline" onClick={() => setConfirmModal({ open: false, action: '' })}>
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  disabled={saving}
                  onClick={handleWithdraw}
                  style={{ minWidth: 140, fontSize: '.92rem' }}
                >
                  {saving ? 'Withdrawing…' : 'Yes, Withdraw'}
                </button>
              </div>
            </>
          )}
        </Modal>
      </DashboardLayout>
    </>
  );
}

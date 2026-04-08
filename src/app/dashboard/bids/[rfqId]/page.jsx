'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import BidStatusBadge from '@/components/bids/BidStatusBadge';
import BidItemsForm from '@/components/bids/BidItemsForm';
import BidHeader from '@/components/bids/BidHeader';
import BidValidationMessages from '@/components/bids/BidValidationMessages';
import BidSubmissionSection from '@/components/bids/BidSubmissionSection';
import BidWorkflowSteps from '@/components/bids/BidWorkflowSteps';
import Modal from '@/components/ui/Modal';

const EMPTY_ALT_FORM = {
  rfq_item_id: '',
  alt_name: '',
  alt_description: '',
  alt_specifications: '',
  alt_unit_price: '',
  alt_quantity: '',
  reason_for_alternative: '',
  notes: '',
};

// ── Standalone Ranking Card Component ──────────────────────────────────────
function RankCard({ rank, totalBids }) {
  if (!rank) return null;

  const isL1 = rank === 'L1';
  const isL2 = rank === 'L2';
  const isL3 = rank === 'L3';
  const tier = isL1 ? 'l1' : isL2 ? 'l2' : isL3 ? 'l3' : 'other';

  const rankDesc = isL1
    ? 'You have the lowest bid — best position! 🎉'
    : isL2
    ? 'Second lowest bid — strong position!'
    : isL3
    ? 'Third lowest bid — in the top 3!'
    : `Your position among ${totalBids} submitted bid${totalBids !== 1 ? 's' : ''}`;

  return (
    <div className={`rank-card rank-card--${tier}`}>
      <div>
        <div className={`rank-label rank-label--${tier}`}>Your Current Rank</div>
        <div className={`rank-badge-large rank-badge-large--${tier}`}>{rank}</div>
      </div>
      <div>
        <div className="rank-desc">{rankDesc}</div>
        {totalBids > 0 && (
          <div className="rank-total">{totalBids} bid{totalBids !== 1 ? 's' : ''} submitted in total</div>
        )}
      </div>
    </div>
  );
}

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
  const [altModal, setAltModal] = useState(false);
  const [altForm, setAltForm]   = useState(EMPTY_ALT_FORM);
  const [altSaving, setAltSaving] = useState(false);
  const [altError, setAltError]   = useState('');

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
        setNotes(json.data.bid.notes || '');
        setCurrency(json.data.bid.currency || overrideCurrency || 'USD');
        setPaymentTerms(json.data.bid.payment_terms  != null ? String(json.data.bid.payment_terms)  : '');
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

  const isClosed      = rfq?.status === 'closed' || rfq?.status === 'cancelled';
  const isPastDeadline = rfq?.deadline && new Date() > new Date(rfq.deadline);
  const isLocked      = isClosed || isPastDeadline;
  const canEdit       = bid && bid.status === 'draft'     && !isLocked;
  const canUpdate     = bid && bid.status === 'submitted' && !isLocked;
  const canWithdraw   = bid?.status === 'submitted' && !isLocked;

  // Derive the current workflow step (1-based 1..4)
  const workflowStep = (() => {
    if (!bid) return 1;
    if (bid.status === 'submitted' || bid.status === 'awarded' || bid.status === 'rejected') return 4;
    const hasPrices = (bid.items || []).some(i => (parseFloat(i.unit_price) || 0) > 0);
    if (hasPrices) return 3;
    return 2;
  })();

  // ── File Attachments ────────────────────────────────────────────────────
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

  // ── Bid Actions ─────────────────────────────────────────────────────────
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
      await fetch(`/api/bids/rfqs/${rfqId}/bid`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, currency, items: bidItems }),
      });
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

  // ── Alternative Items ────────────────────────────────────────────────────
  async function handleAddAlt() {
    setAltSaving(true); setAltError('');
    try {
      const res  = await fetch(`/api/bids/rfqs/${rfqId}/bid/alternatives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rfq_item_id:            Number(altForm.rfq_item_id),
          alt_name:               altForm.alt_name,
          alt_description:        altForm.alt_description,
          alt_specifications:     altForm.alt_specifications,
          alt_unit_price:         altForm.alt_unit_price  !== '' ? altForm.alt_unit_price  : null,
          alt_quantity:           altForm.alt_quantity    !== '' ? altForm.alt_quantity    : null,
          reason_for_alternative: altForm.reason_for_alternative,
          notes:                  altForm.notes,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setAltItems(prev => [...prev, json.data]);
      setAltModal(false);
    } catch (e) {
      setAltError(e.message);
    } finally {
      setAltSaving(false);
    }
  }

  async function handleDeleteAlt(altId) {
    if (!confirm('Remove this alternative item suggestion?')) return;
    try {
      await fetch(`/api/bids/rfqs/${rfqId}/bid/alternatives?altId=${altId}`, { method: 'DELETE' });
      setAltItems(prev => prev.filter(a => a.id !== altId));
    } catch { /* ignore */ }
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
        /* RFQ items list */
        .rfq-items-card {
          background: var(--white); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 20px 24px;
          margin-bottom: 24px; box-shadow: var(--shadow);
        }
        .rfq-item-row {
          display: grid;
          grid-template-columns: 32px 1fr auto auto;
          gap: 12px; align-items: start;
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
        }
        .rfq-item-row:last-child { border-bottom: none; }
        .rfq-item-num {
          width: 26px; height: 26px; border-radius: 50%;
          background: var(--surface); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: .75rem; font-weight: 600; color: var(--ink-soft);
          flex-shrink: 0; margin-top: 2px;
        }
        .rfq-item-name { font-weight: 500; font-size: .9rem; color: var(--ink); margin-bottom: 2px; }
        .rfq-item-meta { font-size: .78rem; color: var(--ink-soft); }
        .rfq-item-qty-badge {
          display: inline-flex; align-items: center; gap: 4px;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 6px; padding: 4px 10px;
          font-size: .78rem; font-weight: 500; color: var(--ink-soft);
          white-space: nowrap; flex-shrink: 0;
        }
        .rfq-item-price-badge {
          display: inline-flex; align-items: center;
          background: #fdf0eb; border-radius: 6px; padding: 4px 10px;
          font-size: .78rem; font-weight: 500; color: var(--accent);
          white-space: nowrap; flex-shrink: 0;
        }
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
          .rfq-item-row { grid-template-columns: 28px 1fr; }
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
            <BidWorkflowSteps currentStep={workflowStep} isLocked={isLocked} />

            {/* RFQ Details + Countdown */}
            <BidHeader rfq={rfq} rfqItems={rfqItems} isPastDeadline={isPastDeadline} />

            {/* RFQ Items List */}
            {rfqItems.length > 0 && (
              <div className="rfq-items-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="section-label">Items in this RFQ</span>
                  <span style={{ fontSize: '.78rem', color: 'var(--ink-faint)' }}>
                    {rfqItems.length} item{rfqItems.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <p style={{ color: 'var(--ink-soft)', fontSize: '.82rem', margin: '0 0 12px' }}>
                  Review all required items before placing your bid. Enter your unit prices in the bid form below.
                </p>
                <div>
                  {rfqItems.map((item, idx) => (
                    <div key={item.id} className="rfq-item-row">
                      <div className="rfq-item-num">{idx + 1}</div>
                      <div>
                        <div className="rfq-item-name">{item.description}</div>
                        {item.unit && <div className="rfq-item-meta">Unit: {item.unit}</div>}
                      </div>
                      <div className="rfq-item-qty-badge">
                        <span style={{ color: 'var(--ink-faint)', fontSize: '.72rem' }}>Qty</span>
                        {parseFloat(item.quantity).toLocaleString()}
                      </div>
                      {item.target_price != null && parseFloat(item.target_price) > 0 ? (
                        <div className="rfq-item-price-badge">
                          Target: {parseFloat(item.target_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      ) : (
                        <div style={{ width: 80 }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Validation messages, warnings, and outcome banner */}
            <BidValidationMessages
              error={error}
              success={success}
              isClosed={isClosed}
              isPastDeadline={isPastDeadline}
              outcome={outcome}
              rfqClosed={isClosed}
            />

            {/* Bid section */}
            {!bid ? (
              <div className="bid-card">
                <span className="section-label" style={{ display: 'block', marginBottom: 8 }}>Start Your Bid</span>
                <p style={{ color: 'var(--ink-soft)', fontSize: '.9rem', margin: '0 0 20px' }}>
                  Fill in the details below to create your bid for this RFQ. These fields can only be set once.
                </p>
                <div className="form-row">
                  <div className="form-group">
                    <label>Currency</label>
                    <select
                      className="form-control"
                      value={currency}
                      onChange={e => setCurrency(e.target.value)}
                      disabled={isPastDeadline}
                    >
                      {Array.from(new Set([companyCurrency, 'USD','EUR','GBP','INR','AED','SGD','CAD','AUD']))
                        .map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Payment Terms (days)</label>
                    <input
                      className="form-control"
                      type="number" min="0" step="1" placeholder="e.g. 30 for Net 30"
                      value={paymentTerms}
                      onChange={e => setPaymentTerms(e.target.value)}
                      disabled={isPastDeadline}
                    />
                  </div>
                  <div className="form-group">
                    <label>Freight Charge per Unit</label>
                    <input
                      className="form-control"
                      type="number" min="0" step="0.01" placeholder="0.00"
                      value={freightCharge}
                      onChange={e => setFreightCharge(e.target.value)}
                      disabled={isPastDeadline}
                    />
                  </div>
                </div>
                <button
                  className="btn btn-accent"
                  disabled={isPastDeadline || saving}
                  onClick={handleCreateBid}
                >
                  {saving ? 'Creating…' : 'Create Bid'}
                </button>
              </div>
            ) : (
              <>
                {/* Ranking card */}
                {bid.status === 'submitted' && bidRank && (
                  <RankCard rank={bidRank.rank} totalBids={bidRank.totalBids} currency={currency} />
                )}

                <div className="bid-card">
                  <div className="bid-card-header">
                    <span className="section-label">Your Bid</span>
                    <BidStatusBadge status={bid.status} />
                  </div>

                  {/* Update mode notice */}
                  {updateMode && (
                    <div className="update-panel">
                      <div className="update-panel-title">✏️ Updating Your Submitted Bid</div>
                      <div className="update-panel-sub">
                        {(() => {
                          const total    = parseFloat(bid.total_amount || 0);
                          const maxBid   = total - MIN_BID_REDUCTION;
                          const fmtAmt   = (n) => `${currency} ${parseFloat(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                          return (
                            <>
                              Your new bid must be at least <strong>{MIN_BID_REDUCTION} {currency} lower</strong> than your
                              current bid of {fmtAmt(total)}. Maximum allowed: {fmtAmt(maxBid)}.
                              Adjust your item prices below — live feedback shows whether your total qualifies.
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Read-only creation fields */}
                  {(paymentTerms !== '' || freightCharge !== '') && (
                    <div style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 20,
                    }}>
                      <div style={{
                        fontSize: '.72rem', fontWeight: 600, letterSpacing: '.08em',
                        textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 12,
                      }}>
                        Bid Terms (set at creation — read only)
                      </div>
                      <div className="form-row" style={{ margin: 0, gap: 12 }}>
                        {paymentTerms !== '' && (
                          <div className="form-group" style={{ minWidth: 0 }}>
                            <label>Payment Terms (days)</label>
                            <input className="form-control" value={paymentTerms} readOnly disabled />
                          </div>
                        )}
                        {freightCharge !== '' && (
                          <div className="form-group" style={{ minWidth: 0 }}>
                            <label>Freight Charge per Unit</label>
                            <input className="form-control" value={freightCharge} readOnly disabled />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Header fields */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Currency</label>
                      <select
                        className="form-control"
                        value={currency}
                        onChange={e => setCurrency(e.target.value)}
                        disabled={!canEdit && !updateMode}
                      >
                        {Array.from(new Set([companyCurrency, 'USD','EUR','GBP','INR','AED','SGD','CAD','AUD']))
                          .map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 3 }}>
                      <label>Notes / Cover Message (optional)</label>
                      <textarea
                        className="form-control"
                        rows={4}
                        placeholder="Any overall notes for the buyer…"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        disabled={!canEdit && !updateMode}
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                  </div>

                  {/* Items table */}
                  <div style={{ marginBottom: 20 }}>
                    <BidItemsForm
                      rfqItems={rfqItems}
                      initialItems={bid.items || []}
                      onChange={setBidItems}
                      readOnly={!canEdit && !updateMode}
                    />
                  </div>

                  {/* File Attachments */}
                  <div style={{ marginBottom: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{
                        fontSize: '.8rem', fontWeight: 600, letterSpacing: '.07em',
                        textTransform: 'uppercase', color: 'var(--ink-faint)',
                      }}>
                        Attachments ({attachments.length})
                      </span>
                      {!isLocked && (
                        <label style={{
                          cursor: 'pointer', fontSize: '.8rem', fontWeight: 600,
                          color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          <input
                            type="file"
                            style={{ display: 'none' }}
                            onChange={handleFileUpload}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.txt,.csv"
                            disabled={uploadingFile}
                          />
                          {uploadingFile ? 'Uploading…' : '+ Add File'}
                        </label>
                      )}
                    </div>
                    {uploadError && (
                      <div style={{ color: 'var(--accent)', fontSize: '.8rem', marginBottom: 8 }}>
                        {uploadError}
                      </div>
                    )}
                    {attachments.length === 0 ? (
                      <p style={{ fontSize: '.84rem', color: 'var(--ink-soft)', margin: 0 }}>
                        No files attached yet.{!isLocked && ' Use "Add File" to attach supporting documents.'}
                      </p>
                    ) : (
                      attachments.map(att => (
                        <div key={att.id} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 12px', border: '1px solid var(--border)',
                          borderRadius: 'var(--radius)', marginBottom: 6, background: 'var(--surface)',
                        }}>
                          <span>📎</span>
                          <span style={{
                            flex: 1, fontSize: '.84rem', color: 'var(--ink)',
                            fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {att.original_name}
                          </span>
                          <span style={{ fontSize: '.76rem', color: 'var(--ink-soft)' }}>
                            {att.file_size >= 1024 * 1024
                              ? `${(att.file_size / (1024 * 1024)).toFixed(1)} MB`
                              : `${(att.file_size / 1024).toFixed(1)} KB`}
                          </span>
                          {!isLocked && (
                            <button
                              onClick={() => handleDeleteAttachment(att.id)}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--ink-faint)', fontSize: '.82rem', padding: '2px 4px',
                              }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Action buttons with 100-unit real-time validation */}
                  <BidSubmissionSection
                    bid={bid}
                    canEdit={canEdit}
                    canUpdate={canUpdate}
                    canWithdraw={canWithdraw}
                    updateMode={updateMode}
                    saving={saving}
                    bidItems={bidItems}
                    currency={currency}
                    onSave={handleSave}
                    onEnterUpdateMode={() => { setUpdateMode(true); setError(''); setSuccess(''); }}
                    onCancelUpdateMode={() => { setUpdateMode(false); setError(''); setSuccess(''); }}
                    onOpenConfirmModal={action => setConfirmModal({ open: true, action })}
                  />
                </div>
              </>
            )}

            {/* Alternative Items Section */}
            {bid && (
              <div className="alt-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div>
                    <span className="section-label">Alternative Items</span>
                    <span style={{
                      marginLeft: 8, fontSize: '.72rem', color: 'var(--ink-faint)',
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 4, padding: '1px 7px',
                    }}>
                      {altItems.length}
                    </span>
                  </div>
                  {!isLocked && (
                    <button
                      className="btn btn-outline"
                      style={{ fontSize: '.8rem', padding: '6px 14px' }}
                      onClick={() => {
                        setAltModal(true);
                        setAltError('');
                        setAltForm({ ...EMPTY_ALT_FORM, rfq_item_id: rfqItems[0]?.id || '' });
                      }}
                    >
                      + Suggest Alternative
                    </button>
                  )}
                </div>
                <p style={{ color: 'var(--ink-soft)', fontSize: '.82rem', margin: '0 0 14px' }}>
                  If you have a similar or equivalent item that can fulfil a requirement, suggest it here.
                  The buyer will review your alternatives alongside your main bid.
                </p>

                {altItems.length === 0 ? (
                  <div style={{
                    textAlign: 'center', padding: '24px 16px',
                    border: '2px dashed var(--border)', borderRadius: 8,
                  }}>
                    <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>🔄</div>
                    <div style={{ fontSize: '.86rem', color: 'var(--ink-soft)' }}>
                      No alternative items suggested yet.
                      {!isLocked && ' Use the button above to suggest a similar item.'}
                    </div>
                  </div>
                ) : (
                  altItems.map(alt => {
                    const origItem = rfqItems.find(i => i.id === alt.rfq_item_id);
                    return (
                      <div key={alt.id} className="alt-item-row">
                        <div style={{ fontSize: '1.2rem', marginTop: 2 }}>🔄</div>
                        <div className="alt-item-details">
                          <div className="alt-item-name">{alt.alt_name}</div>
                          <div className="alt-item-meta">
                            {origItem && <span>For: <strong>{origItem.description}</strong> · </span>}
                            {alt.alt_quantity  && <span>Qty: {alt.alt_quantity} · </span>}
                            {alt.alt_unit_price && <span>Price: {parseFloat(alt.alt_unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })} · </span>}
                            {alt.alt_description && <span>{alt.alt_description}</span>}
                          </div>
                          {alt.alt_specifications && (
                            <div style={{ fontSize: '.76rem', color: 'var(--ink-faint)', marginTop: 2 }}>
                              Specs: {alt.alt_specifications}
                            </div>
                          )}
                          {alt.reason_for_alternative && (
                            <div style={{
                              fontSize: '.78rem', color: 'var(--ink-soft)', marginTop: 4,
                              background: '#eff6ff', borderRadius: 4, padding: '3px 8px', display: 'inline-block',
                            }}>
                              💡 {alt.reason_for_alternative}
                            </div>
                          )}
                        </div>
                        {!isLocked && (
                          <button
                            onClick={() => handleDeleteAlt(alt.id)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: 'var(--ink-faint)', fontSize: '.82rem', padding: '4px 6px', flexShrink: 0,
                            }}
                            title="Remove alternative"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        ) : null}

        {/* Alternative Item Modal */}
        <Modal
          open={altModal}
          onClose={() => setAltModal(false)}
          title="Suggest an Alternative Item"
          width={560}
        >
          <div>
            <p style={{ color: 'var(--ink-soft)', fontSize: '.86rem', margin: '0 0 16px' }}>
              Select the RFQ item you are offering an alternative for, then provide details about your item.
            </p>
            {altError && <div className="error-box" style={{ marginBottom: 12 }}>{altError}</div>}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: '.79rem', fontWeight: 500, marginBottom: 4 }}>
                Original RFQ Item *
              </label>
              <select
                className="form-control"
                value={altForm.rfq_item_id}
                onChange={e => setAltForm(f => ({ ...f, rfq_item_id: e.target.value }))}
              >
                {rfqItems.map((item, idx) => (
                  <option key={item.id} value={item.id}>
                    {idx + 1}. {item.description} (Qty: {item.quantity} {item.unit || ''})
                  </option>
                ))}
              </select>
            </div>
            <div className="alt-form-grid" style={{ marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '.79rem', fontWeight: 500, marginBottom: 4 }}>
                  Alternative Item Name *
                </label>
                <input
                  className="form-control"
                  type="text" placeholder="e.g. Brand X Model Y"
                  value={altForm.alt_name}
                  onChange={e => setAltForm(f => ({ ...f, alt_name: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.79rem', fontWeight: 500, marginBottom: 4 }}>
                  Unit Price (optional)
                </label>
                <input
                  className="form-control"
                  type="number" min="0" step="0.01" placeholder="0.00"
                  value={altForm.alt_unit_price}
                  onChange={e => setAltForm(f => ({ ...f, alt_unit_price: e.target.value }))}
                />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: '.79rem', fontWeight: 500, marginBottom: 4 }}>
                Description
              </label>
              <input
                className="form-control"
                type="text" placeholder="Brief description of the alternative item"
                value={altForm.alt_description}
                onChange={e => setAltForm(f => ({ ...f, alt_description: e.target.value }))}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: '.79rem', fontWeight: 500, marginBottom: 4 }}>
                Specifications
              </label>
              <textarea
                className="form-control"
                rows={2} placeholder="Technical specs, model number, dimensions, etc."
                value={altForm.alt_specifications}
                onChange={e => setAltForm(f => ({ ...f, alt_specifications: e.target.value }))}
                style={{ resize: 'vertical' }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '.79rem', fontWeight: 500, marginBottom: 4 }}>
                Why is this a suitable alternative?
              </label>
              <textarea
                className="form-control"
                rows={2} placeholder="Explain why your item meets the requirement or is better suited…"
                value={altForm.reason_for_alternative}
                onChange={e => setAltForm(f => ({ ...f, reason_for_alternative: e.target.value }))}
                style={{ resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setAltModal(false)}>Cancel</button>
              <button
                className="btn btn-accent"
                disabled={altSaving || !altForm.alt_name?.trim() || !altForm.rfq_item_id}
                onClick={handleAddAlt}
              >
                {altSaving ? 'Adding…' : 'Add Alternative'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Confirm modal */}
        <Modal
          open={confirmModal.open}
          onClose={() => setConfirmModal({ open: false, action: '' })}
          title={
            confirmModal.action === 'submit'   ? 'Confirm Bid Submission'  :
            confirmModal.action === 'update'   ? 'Confirm Bid Update'      :
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
                Please review your item prices before confirming. The buyer will receive a notification and will be able to see your prices immediately.
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
                    Your new prices must be at least <strong>{MIN_BID_REDUCTION} {currency} lower</strong> than your current bid.
                  </div>
                </div>
              </div>
              <p className="confirm-text">
                Your new prices will replace your current submission. The buyer will see the updated figures.
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

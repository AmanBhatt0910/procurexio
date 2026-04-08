'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import BidStatusBadge from '@/components/bids/BidStatusBadge';
import RFQStatusBadge from '@/components/rfq/RFQStatusBadge';
import Modal from '@/components/ui/Modal';
import CountdownTimer from '@/components/bids/CountdownTimer';
import OutcomeBanner from '@/components/bids/OutcomeBanner';
import RankCard from '@/components/bids/RankCard';
import MinBidGuidancePanel from '@/components/bids/MinBidGuidancePanel';
import BidStartSection from '@/components/bids/BidStartSection';
import BidFormSection from '@/components/bids/BidFormSection';
import AlternativeItemsSection from '@/components/bids/AlternativeItemsSection';

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
  const [paymentTerms, setPaymentTerms]   = useState('');
  const [freightCharge, setFreightCharge] = useState('');
  const [confirmModal, setConfirmModal]   = useState({ open: false, action: '' });
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
          if (attRes.ok) { const attJson = await attRes.json(); setAttachments(attJson.data || []); }
        } catch { /* ignore */ }
        try {
          const altRes = await fetch(`/api/bids/rfqs/${rfqId}/bid/alternatives`);
          if (altRes.ok) { const altJson = await altRes.json(); setAltItems(altJson.data || []); }
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
      if (rankJson?.data)    setBidRank(rankJson.data);
      fetchData(resolved);
    }).catch(() => { fetchData('USD'); });
  }, [rfqId, fetchData]);

  const rfq      = data?.rfq;
  const bid      = data?.bid;
  const rfqItems = data?.items || [];

  const isClosed       = rfq?.status === 'closed' || rfq?.status === 'cancelled';
  const isPastDeadline = rfq?.deadline && new Date() > new Date(rfq.deadline);
  const isLocked       = isClosed || isPastDeadline;
  const canEdit        = bid && bid.status === 'draft'     && !isLocked;
  const canUpdate      = bid && bid.status === 'submitted' && !isLocked;
  const canWithdraw    = bid?.status === 'submitted'       && !isLocked;

  // Live \u20b9100 validation: new total must be at least \u20b9100 lower than current
  const newBidTotal = bidItems.reduce((sum, item) => {
    const up  = parseFloat(item.unit_price) || 0;
    const qty = parseFloat(item.quantity)   || 1;
    return sum + up * qty;
  }, 0);
  const currentBidTotal = parseFloat(bid?.total_amount || 0);
  const isValidUpdate   = newBidTotal > 0 && newBidTotal <= currentBidTotal - 100;

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

  async function handleCreateBid() {
    setSaving(true); setError(''); setSuccess('');
    try {
      const res  = await fetch(`/api/bids/rfqs/${rfqId}/bid`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          currency,
          payment_terms:  paymentTerms  !== '' ? paymentTerms  : null,
          freight_charge: freightCharge !== '' ? freightCharge : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSuccess('Bid created! Fill in your unit prices below.');
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
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ notes, currency, items: bidItems }),
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
      // Save items first, then submit
      await fetch(`/api/bids/rfqs/${rfqId}/bid`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ notes, currency, items: bidItems }),
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
    // Frontend validation — no redirects, no API call if invalid
    if (!isValidUpdate) {
      const fmt = n => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      setError(
        `Your new bid (${currency} ${fmt(newBidTotal)}) must be at least \u20b9100 lower than your current bid ` +
        `(${currency} ${fmt(currentBidTotal)}). ` +
        `Maximum allowed: ${currency} ${fmt(currentBidTotal - 100)}.`
      );
      setConfirmModal({ open: false, action: '' });
      return;
    }

    setSaving(true); setError(''); setSuccess('');
    try {
      const res  = await fetch(`/api/bids/rfqs/${rfqId}/bid/update`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ notes, currency, items: bidItems }),
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
          --ink:#0f0e0d; --ink-soft:#6b6660; --ink-faint:#b8b3ae;
          --surface:#faf9f7; --white:#ffffff; --accent:#c8501a; --accent-h:#a83e12;
          --border:#e4e0db; --radius:10px;
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
          margin-top: 4px; flex-wrap: wrap;
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
        .btn-outline { background: transparent; color: var(--ink); border: 1px solid var(--border); }
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
        .skeleton {
          background: linear-gradient(90deg, #f0ede9 25%, #faf9f7 50%, #f0ede9 75%);
          background-size: 200% 100%; animation: shimmer 1.2s infinite; border-radius: 6px;
        }
        @keyframes shimmer { to { background-position: -200% 0; } }
        .rfq-items-card {
          background: var(--white); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 20px 24px;
          margin-bottom: 24px; box-shadow: var(--shadow);
        }
        .rfq-item-row {
          display: grid; grid-template-columns: 32px 1fr auto auto;
          gap: 12px; align-items: start;
          padding: 12px 0; border-bottom: 1px solid var(--border);
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
        @media (max-width: 640px) { .rfq-item-row { grid-template-columns: 28px 1fr; } }
      `}</style>

      <DashboardLayout>
        {loading ? (
          <div>
            <div className="skeleton" style={{ height: 32, width: 300, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 18, width: 200, marginBottom: 24 }} />
            <div className="skeleton" style={{ height: 120, marginBottom: 24 }} />
            <div className="skeleton" style={{ height: 300 }} />
          </div>
        ) : error && !data ? (
          <div className="error-box">{error}</div>
        ) : rfq ? (
          <>
            {/* Page Header */}
            <PageHeader
              title={rfq.title}
              subtitle={`${rfq.reference_number} \u00b7 Bid Workspace`}
              action={
                <button className="btn btn-outline" onClick={() => router.back()}>
                  \u2190 Back
                </button>
              }
            />

            {/* RFQ Details Card */}
            <div className="rfq-meta-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="section-label">RFQ Details</span>
                  <RFQStatusBadge status={rfq.status} />
                </div>
                {rfq.deadline && <CountdownTimer deadline={rfq.deadline} />}
              </div>
              {rfq.description && (
                <p style={{ color: 'var(--ink-soft)', fontSize: '.9rem', margin: '0 0 12px' }}>{rfq.description}</p>
              )}
              <div className="rfq-meta-grid">
                <div className="meta-item">
                  <label>Deadline</label>
                  <span style={{ color: isPastDeadline ? 'var(--accent)' : 'var(--ink)' }}>
                    {rfq.deadline
                      ? new Date(rfq.deadline).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                      : '\u2014'}
                    {isPastDeadline && ' (Closed)'}
                  </span>
                </div>
                {rfq.budget && (
                  <div className="meta-item">
                    <label>Budget</label>
                    <span>{rfq.currency} {parseFloat(rfq.budget).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="meta-item">
                  <label>Line Items</label>
                  <span>{rfqItems.length}</span>
                </div>
              </div>
            </div>

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

            {/* Status Alerts */}
            {error && <div className="error-box">{error}</div>}
            {success && <div className="success-box">{success}</div>}
            {isClosed && (
              <div className="warning-banner">\ud83d\udd12 This RFQ is closed. Bid submission and editing are no longer allowed.</div>
            )}
            {!isClosed && isPastDeadline && (
              <div className="warning-banner">\u26a0 The deadline for this RFQ has passed. Bid editing is locked.</div>
            )}

            {/* Outcome Banner */}
            <OutcomeBanner outcome={outcome} rfqClosed={isClosed} />

            {/* No Bid Yet: Start Your Bid */}
            {!bid ? (
              <BidStartSection
                currency={currency}
                setCurrency={setCurrency}
                paymentTerms={paymentTerms}
                setPaymentTerms={setPaymentTerms}
                freightCharge={freightCharge}
                setFreightCharge={setFreightCharge}
                companyCurrency={companyCurrency}
                isPastDeadline={isPastDeadline}
                saving={saving}
                onCreateBid={handleCreateBid}
              />
            ) : (
              <>
                {/* Rank Card (shown when bid is submitted) */}
                {bid.status === 'submitted' && bidRank && (
                  <RankCard rank={bidRank.rank} totalBids={bidRank.totalBids} />
                )}

                {/* Min \u20b9100 Guidance Panel (pre-edit banner, shown before user clicks Update Bid) */}
                {canUpdate && !updateMode && (
                  <MinBidGuidancePanel
                    currentTotal={bid.total_amount}
                    newTotal={0}
                    currency={currency}
                    updateMode={false}
                  />
                )}

                {/* Bid Form Card */}
                <div className="bid-card">
                  <div className="bid-card-header">
                    <span className="section-label">
                      {canEdit ? 'Step 2 \u2014 Fill in Your Prices' : 'Your Bid'}
                    </span>
                    <BidStatusBadge status={bid.status} />
                  </div>

                  <BidFormSection
                    bid={bid}
                    rfqItems={rfqItems}
                    currency={currency}
                    setCurrency={setCurrency}
                    notes={notes}
                    setNotes={setNotes}
                    bidItems={bidItems}
                    setBidItems={setBidItems}
                    canEdit={canEdit}
                    updateMode={updateMode}
                    companyCurrency={companyCurrency}
                    paymentTerms={paymentTerms}
                    freightCharge={freightCharge}
                    attachments={attachments}
                    uploadingFile={uploadingFile}
                    uploadError={uploadError}
                    isLocked={isLocked}
                    onFileUpload={handleFileUpload}
                    onDeleteAttachment={handleDeleteAttachment}
                  />

                  {/* Actions Bar */}
                  {(canEdit || canUpdate || canWithdraw) && (
                    <div className="actions-bar">
                      {canEdit && (
                        <>
                          <button className="btn btn-outline" disabled={saving} onClick={handleSave}>
                            {saving ? 'Saving\u2026' : 'Save Draft'}
                          </button>
                          <button
                            className="btn btn-accent"
                            disabled={saving || bidItems.length === 0}
                            onClick={() => setConfirmModal({ open: true, action: 'submit' })}
                          >
                            Step 3 \u2014 Submit Bid
                          </button>
                        </>
                      )}
                      {canUpdate && !updateMode && (
                        <button
                          className="btn btn-outline"
                          disabled={saving}
                          onClick={() => { setUpdateMode(true); setError(''); setSuccess(''); }}
                        >
                          \u270f\ufe0f Update Bid
                        </button>
                      )}
                      {canUpdate && updateMode && (
                        <>
                          <button
                            className="btn btn-accent"
                            disabled={saving || bidItems.length === 0 || !isValidUpdate}
                            title={!isValidUpdate ? 'Your new bid must be at least \u20b9100 lower than your current bid' : ''}
                            onClick={() => setConfirmModal({ open: true, action: 'update' })}
                          >
                            {saving ? 'Saving\u2026' : 'Save Update'}
                          </button>
                          <button
                            className="btn btn-outline"
                            disabled={saving}
                            onClick={() => { setUpdateMode(false); setError(''); setSuccess(''); }}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {canWithdraw && (
                        <button
                          className="btn btn-danger"
                          disabled={saving}
                          onClick={() => setConfirmModal({ open: true, action: 'withdraw' })}
                        >
                          Withdraw Bid
                        </button>
                      )}
                      {bid.submitted_at && (
                        <span style={{ marginLeft: 'auto', color: 'var(--ink-soft)', fontSize: '.8rem' }}>
                          Submitted {new Date(bid.submitted_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Alternative Items Section */}
                <AlternativeItemsSection
                  rfqId={rfqId}
                  rfqItems={rfqItems}
                  altItems={altItems}
                  setAltItems={setAltItems}
                  isLocked={isLocked}
                />
              </>
            )}
          </>
        ) : null}

        {/* Confirm Modals */}
        <Modal
          open={confirmModal.open}
          onClose={() => setConfirmModal({ open: false, action: '' })}
          title={
            confirmModal.action === 'submit'   ? 'Submit Bid'  :
            confirmModal.action === 'update'   ? 'Update Bid'  :
            'Withdraw Bid'
          }
          width={460}
        >
          {confirmModal.action === 'submit' ? (
            <>
              <p className="confirm-text">
                Are you sure you want to submit your bid? Once submitted, the buyer will be able to
                see your prices. You can still withdraw it before the deadline.
              </p>
              <div className="confirm-actions">
                <button className="btn btn-outline" onClick={() => setConfirmModal({ open: false, action: '' })}>Cancel</button>
                <button className="btn btn-accent" disabled={saving} onClick={handleSubmit}>
                  {saving ? 'Submitting\u2026' : 'Yes, Submit Bid'}
                </button>
              </div>
            </>
          ) : confirmModal.action === 'update' ? (
            <>
              <p className="confirm-text">
                Are you sure you want to update your submitted bid? Your new prices will replace your
                current submission. A minimum reduction of \u20b9100 is required.
              </p>
              <div className="confirm-actions">
                <button className="btn btn-outline" onClick={() => setConfirmModal({ open: false, action: '' })}>Cancel</button>
                <button className="btn btn-accent" disabled={saving} onClick={handleUpdate}>
                  {saving ? 'Updating\u2026' : 'Yes, Update Bid'}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="confirm-text">
                Are you sure you want to withdraw your bid? Your submission will be removed and
                you&apos;ll need to resubmit if you change your mind.
              </p>
              <div className="confirm-actions">
                <button className="btn btn-outline" onClick={() => setConfirmModal({ open: false, action: '' })}>Cancel</button>
                <button className="btn btn-danger" disabled={saving} onClick={handleWithdraw}>
                  {saving ? 'Withdrawing\u2026' : 'Yes, Withdraw'}
                </button>
              </div>
            </>
          )}
        </Modal>
      </DashboardLayout>
    </>
  );
}

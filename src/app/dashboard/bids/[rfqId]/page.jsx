'use client';
// src/app/dashboard/bids/[rfqId]/page.jsx

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
import { isDeadlinePassed } from '@/lib/utils/deadline';

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

  const [attachments, setAttachments]     = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError]     = useState('');

  const [altItems, setAltItems] = useState([]);
  const [substep, setSubstep]   = useState(1);

  const toFiniteNumber = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const normalizeBidItems = (items = []) =>
    items.map((item) => ({
      rfq_item_id: item.rfq_item_id,
      unit_price:  toFiniteNumber(item.unit_price),
      quantity:    toFiniteNumber(item.quantity),
      tax_rate:    toFiniteNumber(item.tax_rate),
      notes:       item.notes || '',
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
        setPaymentTerms(json.data.bid.payment_terms    != null ? String(json.data.bid.payment_terms)   : '');
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
    }).catch(() => { fetchData('USD'); });
  }, [rfqId, fetchData]);

  const rfq      = data?.rfq;
  const bid      = data?.bid;
  const rfqItems = data?.items || [];

  const isClosed       = rfq?.status === 'closed' || rfq?.status === 'cancelled';
  const isPastDeadline = isDeadlinePassed(rfq?.deadline);
  const isLocked       = isClosed || isPastDeadline;
  const canEdit        = bid && bid.status === 'draft'     && !isLocked;
  const canUpdate      = bid && bid.status === 'submitted' && !isLocked;
  const canWithdraw    = bid?.status === 'submitted' && !isLocked;

  const workflowStep = (() => {
    if (!bid) return 1;
    if (bid.status === 'submitted' || bid.status === 'awarded' || bid.status === 'rejected') return 4;
    const hasPrices = (bid.items || []).some(i => (parseFloat(i.unit_price) || 0) > 0);
    if (hasPrices) return 3;
    return 2;
  })();

  useEffect(() => {
    if (!loading) setSubstep(workflowStep);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

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
      const saveRes  = await fetch(`/api/bids/rfqs/${rfqId}/bid`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, currency, items: bidItems }),
      });
      const saveJson = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveJson.error || 'Failed to save bid before submission. Please verify bid details and try again.');
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

  const modalTitle = {
    submit:   'Submit Your Bid',
    update:   'Update Your Bid',
    withdraw: 'Withdraw Bid',
  }[confirmModal.action] || '';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        .bid-workspace-page { animation: bwFadeUp .3s ease both; }
        @keyframes bwFadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
        .bw-skeleton {
          border-radius: 10px; background: var(--border);
          animation: bwPulse 1.4s ease-in-out infinite;
        }
        @keyframes bwPulse { 0%,100%{opacity:1} 50%{opacity:.45} }

        /* Confirm modal inner styles */
        .cm-notice {
          display: flex; align-items: flex-start; gap: 14px;
          border-radius: 10px; padding: 14px 16px; margin-bottom: 18px;
        }
        .cm-notice--submit { background: #FAEEDA; border: 1px solid #FAC775; }
        .cm-notice--update { background: #E6F1FB; border: 1px solid #B5D4F4; }
        .cm-notice--withdraw { background: #FCEBEB; border: 1px solid #F7C1C1; }
        .cm-notice-icon {
          width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .cm-notice-icon--submit { background: #FAC775; }
        .cm-notice-icon--update { background: #B5D4F4; }
        .cm-notice-icon--withdraw { background: #F7C1C1; }
        .cm-notice-title {
          font-family: 'Syne', sans-serif; font-weight: 700; font-size: .92rem;
          letter-spacing: -.02em; margin-bottom: 3px;
        }
        .cm-notice-title--submit { color: #633806; }
        .cm-notice-title--update { color: #0C447C; }
        .cm-notice-title--withdraw { color: #A32D2D; }
        .cm-notice-sub {
          font-size: .835rem; line-height: 1.5; font-family: 'DM Sans', sans-serif;
        }
        .cm-notice-sub--submit { color: #854F0B; }
        .cm-notice-sub--update { color: #185FA5; }
        .cm-notice-sub--withdraw { color: '#c0392b'; }
        .cm-body-text {
          font-size: .875rem; color: var(--ink-soft);
          line-height: 1.65; margin-bottom: 22px;
          font-family: 'DM Sans', sans-serif;
        }
        .cm-actions { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }
        .cm-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 20px; border-radius: 10px;
          font-family: 'DM Sans', sans-serif; font-size: .875rem; font-weight: 600;
          cursor: pointer; border: none; transition: all .14s; min-width: 130px;
          justify-content: center; letter-spacing: -.01em;
        }
        .cm-btn:disabled { opacity: .5; cursor: not-allowed; }
        .cm-btn--cancel {
          background: transparent; color: var(--ink-soft);
          border: 1.5px solid var(--border) !important;
          border: none;
        }
        .cm-btn--cancel:hover:not(:disabled) { 
          background: var(--surface); 
          color: var(--ink);
          border: 1.5px solid var(--border);
          transform: translateY(-1px);
        }
        .cm-btn--submit { 
          background: var(--accent); 
          color: #fff;
          box-shadow: 0 2px 8px rgba(200,80,26,.15);
        }
        .cm-btn--submit:hover:not(:disabled) { 
          background: var(--accent-h);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(200,80,26,.2);
        }
        .cm-btn--update { 
          background: #185FA5; 
          color: #fff;
          box-shadow: 0 2px 8px rgba(24,95,165,.15);
        }
        .cm-btn--update:hover:not(:disabled) { 
          background: #0C447C;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(24,95,165,.2);
        }
        .cm-btn--withdraw { 
          background: #A32D2D; 
          color: #fff;
          box-shadow: 0 2px 8px rgba(163,45,45,.15);
        }
        .cm-btn--withdraw:hover:not(:disabled) { 
          background: #791F1F;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(163,45,45,.2);
        }
      `}</style>

      <DashboardLayout>
        {loading ? (
          <div>
            <div className="bw-skeleton" style={{ height: 28, width: 260, marginBottom: 8 }} />
            <div className="bw-skeleton" style={{ height: 16, width: 180, marginBottom: 28 }} />
            <div className="bw-skeleton" style={{ height: 80, marginBottom: 18 }} />
            <div className="bw-skeleton" style={{ height: 130, marginBottom: 18 }} />
            <div className="bw-skeleton" style={{ height: 280 }} />
          </div>
        ) : !rfq && error ? (
          <div style={{
            background: '#FCEBEB', border: '1px solid #F7C1C1',
            borderRadius: 10, padding: '14px 18px', color: '#A32D2D',
            fontSize: '.875rem', fontFamily: "'DM Sans', sans-serif",
          }}>
            {error}
          </div>
        ) : rfq ? (
          <div className="bid-workspace-page">
            <PageHeader
              title={rfq.title}
              subtitle={`${rfq.reference_number} · Bid Workspace`}
              action={
                <button
                  onClick={() => router.back()}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', background: 'transparent',
                    border: '1.5px solid var(--border)', borderRadius: 9,
                    fontFamily: "'DM Sans', sans-serif", fontSize: '.835rem',
                    fontWeight: 600, color: 'var(--ink-soft)', cursor: 'pointer',
                    transition: 'all .13s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--ink)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--ink)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-soft)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M10 6.5H3M3 6.5l3-3M3 6.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Back
                </button>
              }
            />

            <BidWorkflowSteps currentStep={substep} isLocked={isLocked} />
            <BidHeader rfq={rfq} rfqItems={rfqItems} isPastDeadline={isPastDeadline} />

            <BidValidationMessages
              error={error}
              success={success}
              isClosed={isClosed}
              isPastDeadline={isPastDeadline}
              outcome={outcome}
              rfqClosed={isClosed}
            />

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
          </div>
        ) : null}

        {/* ── Confirm Modal ── */}
        <Modal
          open={confirmModal.open}
          onClose={() => setConfirmModal({ open: false, action: '' })}
          title={modalTitle}
          width={480}
        >
          {confirmModal.action === 'submit' && (
            <>
              <div className="cm-notice cm-notice--submit">
                <div className="cm-notice-icon cm-notice-icon--submit">
                  <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                    <path d="M2 8.5L6 12.5L15 4" stroke="#633806" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <div className="cm-notice-title cm-notice-title--submit">Ready to submit your bid?</div>
                  <div className="cm-notice-sub cm-notice-sub--submit">
                    Once submitted, the buyer can see your prices. You can still withdraw before the deadline.
                  </div>
                </div>
              </div>
              <p className="cm-body-text">
                Please review your item prices before confirming. The buyer will receive a
                notification and can see your prices immediately after submission.
              </p>
              <div className="cm-actions">
                <button className="cm-btn cm-btn--cancel" style={{ border: '1.5px solid var(--border)' }} onClick={() => setConfirmModal({ open: false, action: '' })}>
                  Cancel
                </button>
                <button className="cm-btn cm-btn--submit" disabled={saving} onClick={handleSubmit}>
                  {saving ? 'Submitting…' : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Submit Bid
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {confirmModal.action === 'update' && (
            <>
              <div className="cm-notice cm-notice--update">
                <div className="cm-notice-icon cm-notice-icon--update">
                  <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                    <path d="M11 3L14 6L6 14H3V11L11 3z" stroke="#0C447C" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M9 5l3 3" stroke="#0C447C" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <div className="cm-notice-title cm-notice-title--update">Updating your submitted bid</div>
                  <div className="cm-notice-sub cm-notice-sub--update">
                    Your new prices must be at least <strong>{MIN_BID_REDUCTION} {currency} lower</strong> than your current bid.
                  </div>
                </div>
              </div>
              <p className="cm-body-text">
                Your new prices will replace your current submission. The buyer will see the updated figures immediately.
              </p>
              <div className="cm-actions">
                <button className="cm-btn cm-btn--cancel" style={{ border: '1.5px solid var(--border)' }} onClick={() => setConfirmModal({ open: false, action: '' })}>
                  Cancel
                </button>
                <button className="cm-btn cm-btn--update" disabled={saving} onClick={handleUpdate}>
                  {saving ? 'Updating…' : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M8.5 2L11.5 5 4.5 12H2v-2.5L8.5 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                      </svg>
                      Update Bid
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {confirmModal.action === 'withdraw' && (
            <>
              <div className="cm-notice cm-notice--withdraw">
                <div className="cm-notice-icon cm-notice-icon--withdraw">
                  <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                    <path d="M3 8.5h11M3 8.5l4-4M3 8.5l4 4" stroke="#A32D2D" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <div className="cm-notice-title cm-notice-title--withdraw">Withdraw your bid?</div>
                  <div className="cm-notice-sub" style={{ color: '#c0392b' }}>
                    Your submission will be removed. You can resubmit a new bid before the deadline.
                  </div>
                </div>
              </div>
              <p className="cm-body-text">
                Are you sure you want to withdraw? The buyer will no longer see your prices, and your position in the ranking will be removed.
              </p>
              <div className="cm-actions">
                <button className="cm-btn cm-btn--cancel" style={{ border: '1.5px solid var(--border)' }} onClick={() => setConfirmModal({ open: false, action: '' })}>
                  Cancel
                </button>
                <button className="cm-btn cm-btn--withdraw" disabled={saving} onClick={handleWithdraw}>
                  {saving ? 'Withdrawing…' : 'Withdraw Bid'}
                </button>
              </div>
            </>
          )}
        </Modal>
      </DashboardLayout>
    </>
  );
}
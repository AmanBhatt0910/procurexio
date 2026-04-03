'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import BidStatusBadge from '@/components/bids/BidStatusBadge';
import BidItemsForm from '@/components/bids/BidItemsForm';
import RFQStatusBadge from '@/components/rfq/RFQStatusBadge';
import Modal from '@/components/ui/Modal';

// OutcomeBanner component (defined inside the file)
function OutcomeBanner({ outcome }) {
  if (!outcome || outcome.bidStatus === 'submitted' || outcome.bidStatus === 'draft') return null;

  function fmt(amount, currency) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount);
  }

  const awarded = outcome.awarded;

  return (
    <>
      <style>{`
        .outcome-banner {
          border-radius: 10px;
          padding: 20px 24px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          font-family: 'DM Sans', sans-serif;
          animation: fadeUp .3s ease both;
        }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .outcome-banner.awarded {
          background: #d1fae5;
          border: 1px solid #6ee7b7;
          color: #065f46;
        }
        .outcome-banner.rejected {
          background: var(--surface, #faf9f7);
          border: 1px solid var(--border, #e4e0db);
          color: var(--ink-soft, #6b6660);
        }
        .outcome-icon { font-size: 2rem; line-height: 1; flex-shrink: 0; }
        .outcome-title {
          font-family: 'Syne', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: -.02em;
          margin-bottom: 2px;
        }
        .outcome-sub { font-size: .85rem; opacity: .8; }
        .outcome-amount {
          margin-left: auto;
          font-family: 'Syne', sans-serif;
          font-size: 1.4rem;
          font-weight: 700;
          letter-spacing: -.02em;
          flex-shrink: 0;
        }
      `}</style>

      <div className={`outcome-banner ${awarded ? 'awarded' : 'rejected'}`}>
        <div className="outcome-icon">{awarded ? '🎉' : '📋'}</div>
        <div>
          <div className="outcome-title">
            {awarded ? 'You won this contract!' : 'Contract awarded to another vendor'}
          </div>
          <div className="outcome-sub">
            {awarded
              ? `Contract ref: ${outcome.contractReference || '—'}`
              : 'Thank you for participating. This RFQ has been closed.'}
          </div>
        </div>
        {awarded && outcome.totalAmount && (
          <div className="outcome-amount">
            {fmt(outcome.totalAmount, outcome.currency)}
          </div>
        )}
      </div>
    </>
  );
}

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
  const [confirmModal, setConfirmModal] = useState({ open: false, action: '' });
  const [companyCurrency, setCompanyCurrency] = useState('USD');

  // Outcome state (added per patch)
  const [outcome, setOutcome] = useState(null);
  const [bidRank, setBidRank] = useState(null);

  const fetchData = useCallback(async (overrideCurrency) => {
    try {
      const res = await fetch(`/api/bids/rfqs/${rfqId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setData(json.data);
      if (json.data.bid) {
        setNotes(json.data.bid.notes || '');
        // Use saved bid currency, then company currency, then USD
        setCurrency(json.data.bid.currency || overrideCurrency || 'USD');
      } else {
        // No bid yet — pre-select company currency
        setCurrency(overrideCurrency || 'USD');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [rfqId]);

  useEffect(() => {
    // Fetch company settings first, then load RFQ data with the correct currency default
    Promise.all([
      fetch('/api/company/settings').then(r => r.ok ? r.json() : null),
      fetch(`/api/bids/rfqs/${rfqId}/outcome`).then(r => r.ok ? r.json() : null),
      fetch(`/api/bids/rfqs/${rfqId}/rank`).then(r => r.ok ? r.json() : null),
    ]).then(([settingsJson, outcomeJson, rankJson]) => {
      const resolved = settingsJson?.data?.currency || 'USD';
      setCompanyCurrency(resolved);
      if (outcomeJson?.data) setOutcome(outcomeJson.data);
      if (rankJson?.data?.rank) setBidRank(rankJson.data);
      // Now fetch RFQ data, passing the resolved currency so the fallback is correct
      fetchData(resolved);
    }).catch(() => {
      fetchData('USD');
    });
  }, [rfqId, fetchData]);

  const rfq = data?.rfq;
  const bid = data?.bid;
  const rfqItems = data?.items || [];

  const isPastDeadline = rfq?.deadline && new Date() > new Date(rfq.deadline);
  const canEdit = bid && bid.status === 'draft' && !isPastDeadline;
  const canSubmit = canEdit && bidItems.length > 0;
  const canWithdraw = bid?.status === 'submitted' && !isPastDeadline;
  const showForm = bid && (bid.status === 'draft' || bid.status === 'submitted');

  async function handleCreateBid() {
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`/api/bids/rfqs/${rfqId}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency }),
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
      // Calculate new total from bidItems
      const newTotal = bidItems.reduce((sum, item) => {
        const up  = parseFloat(item.unit_price) || 0;
        const qty = parseFloat(item.quantity)   || 1;
        return sum + (up * qty);
      }, 0);

      // Enforce ₹100 minimum increment when editing a previously submitted bid
      if (bid?.status === 'submitted' && bid?.total_amount != null) {
        const prevTotal = parseFloat(bid.total_amount);
        if (newTotal > 0 && newTotal >= prevTotal - 99.99) {
          setError(`Your revised bid (₹${newTotal.toFixed(2)}) must be at least ₹100 lower than your previous bid (₹${prevTotal.toFixed(2)}). Minimum new bid: ₹${(prevTotal - 100).toFixed(2)}.`);
          setSaving(false);
          return;
        }
      }

      const res = await fetch(`/api/bids/rfqs/${rfqId}/bid`, {
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
      // Save first
      await fetch(`/api/bids/rfqs/${rfqId}/bid`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, currency, items: bidItems }),
      });
      // Then submit
      const res = await fetch(`/api/bids/rfqs/${rfqId}/bid/submit`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSuccess('Bid submitted successfully!');
      setConfirmModal({ open: false, action: '' });
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
      const res = await fetch(`/api/bids/rfqs/${rfqId}/bid/withdraw`, { method: 'POST' });
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
        .start-box {
          text-align: center; padding: 40px 24px;
          border: 2px dashed var(--border); border-radius: var(--radius);
        }
        .start-box h3 { font-family: 'Syne', sans-serif; font-weight: 700; color: var(--ink); margin: 0 0 8px; }
        .start-box p { color: var(--ink-soft); font-size: .9rem; margin: 0 0 20px; }
        .confirm-text { font-family: 'DM Sans', sans-serif; color: var(--ink); font-size: .92rem; line-height: 1.6; }
        .confirm-actions { display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end; }
        .skeleton { background: linear-gradient(90deg, #f0ede9 25%, #faf9f7 50%, #f0ede9 75%); background-size: 200% 100%; animation: shimmer 1.2s infinite; border-radius: 6px; }
        @keyframes shimmer { to { background-position: -200% 0; } }
      `}</style>

      <DashboardLayout>
        {loading ? (
          <div>
            <div className="skeleton" style={{ height: 32, width: 300, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 18, width: 200, marginBottom: 24 }} />
            <div className="skeleton" style={{ height: 120, marginBottom: 24 }} />
            <div className="skeleton" style={{ height: 300 }} />
          </div>
        ) : error ? (
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

            {/* RFQ Details */}
            <div className="rfq-meta-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span className="section-label">RFQ Details</span>
                <RFQStatusBadge status={rfq.status} />
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
                      : '—'}
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

            {/* Alerts */}
            {error && <div className="error-box">{error}</div>}
            {success && <div className="success-box">{success}</div>}
            {isPastDeadline && (
              <div className="warning-banner">⚠ The deadline for this RFQ has passed. Bid editing is locked.</div>
            )}

            {/* Outcome Banner (added per patch) */}
            <OutcomeBanner outcome={outcome} />

            {/* Bid section */}
            {!bid ? (
              <div className="bid-card">
                <div className="start-box">
                  <h3>Start Your Bid</h3>
                  <p>You haven&apos;t created a bid for this RFQ yet. Click below to begin.</p>
                  <button
                    className="btn btn-accent"
                    disabled={isPastDeadline || saving}
                    onClick={handleCreateBid}
                  >
                    {saving ? 'Creating…' : 'Create Bid'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bid-card">
                <div className="bid-card-header">
                  <span className="section-label">Your Bid</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {bidRank?.rank && (
                      <span style={{
                        display: 'inline-block', padding: '3px 10px',
                        borderRadius: 6, fontSize: '.78rem', fontWeight: 700, letterSpacing: '.04em',
                        background: bidRank.rank === 'L1' ? '#e8f5ee' : bidRank.rank === 'L2' ? '#e8edf5' : '#f0ede8',
                        color: bidRank.rank === 'L1' ? '#1a7a4a' : bidRank.rank === 'L2' ? '#2a4a8c' : '#6b6660',
                      }}>
                        {bidRank.rank} · {bidRank.rank === 'L1' ? 'Lowest bid' : bidRank.rank === 'L2' ? '2nd lowest' : `${bidRank.rank} of ${bidRank.totalBids}`}
                      </span>
                    )}
                    <BidStatusBadge status={bid.status} />
                  </div>
                </div>

                {/* Header fields */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Currency</label>
                    <select
                      className="form-control"
                      value={currency}
                      onChange={e => setCurrency(e.target.value)}
                      disabled={!canEdit}
                    >
                      {Array.from(new Set([companyCurrency, 'USD','EUR','GBP','INR','AED','SGD','CAD','AUD']))
                        .map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 3 }}>
                    <label>Notes / Cover Message (optional)</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Any overall notes for the buyer…"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      disabled={!canEdit}
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
                    readOnly={!canEdit}
                  />
                </div>

                {/* Actions */}
                {(canEdit || canWithdraw) && (
                  <div className="actions-bar">
                    {canEdit && (
                      <>
                        <button className="btn btn-outline" disabled={saving} onClick={handleSave}>
                          {saving ? 'Saving…' : 'Save Draft'}
                        </button>
                        <button
                          className="btn btn-accent"
                          disabled={saving || bidItems.length === 0}
                          onClick={() => setConfirmModal({ open: true, action: 'submit' })}
                        >
                          Submit Bid
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
            )}
          </>
        ) : null}

        {/* Confirm modal */}
        <Modal
          open={confirmModal.open}
          onClose={() => setConfirmModal({ open: false, action: '' })}
          title={confirmModal.action === 'submit' ? 'Submit Bid' : 'Withdraw Bid'}
          width={460}
        >
          {confirmModal.action === 'submit' ? (
            <>
              <p className="confirm-text">
                Are you sure you want to submit your bid? Once submitted, the buyer will be able to see your prices.
                You can still withdraw it before the deadline.
              </p>
              <div className="confirm-actions">
                <button className="btn btn-outline" onClick={() => setConfirmModal({ open: false, action: '' })}>Cancel</button>
                <button className="btn btn-accent" disabled={saving} onClick={handleSubmit}>
                  {saving ? 'Submitting…' : 'Yes, Submit Bid'}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="confirm-text">
                Are you sure you want to withdraw your bid? Your submission will be removed and you&apos;ll need to resubmit if you change your mind.
              </p>
              <div className="confirm-actions">
                <button className="btn btn-outline" onClick={() => setConfirmModal({ open: false, action: '' })}>Cancel</button>
                <button className="btn btn-danger" disabled={saving} onClick={handleWithdraw}>
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
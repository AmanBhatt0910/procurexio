// src/app/dashboard/rfqs/[id]/award/page.jsx
'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import EvaluationPanel from '@/components/award/EvaluationPanel';
import ContractCard from '@/components/award/ContractCard';
import BidStatusBadge from '@/components/bids/BidStatusBadge';
import RoleGuard from '@/components/auth/RoleGuard';
import {useAuth} from '@/hooks/useAuth';
import { ROLES } from '@/lib/rbac';

function fmt(amount, currency) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount);
}

export default function AwardContractPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [rfq, setRfq] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBidId, setSelectedBidId] = useState('');
  const [awardNotes, setAwardNotes] = useState('');
  const [awarding, setAwarding] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isAdmin = user?.role === 'company_admin' || user?.role === 'super_admin';
  const canAward = ['company_admin', 'manager', 'super_admin'].includes(user?.role);
  const readOnly = !canAward;

  useEffect(() => {
    fetchAll();
  }, [id]);

  async function fetchAll() {
    setLoading(true);
    try {
      const [rfqRes, evalRes, contractRes] = await Promise.all([
        fetch(`/api/rfqs/${id}`),
        fetch(`/api/rfqs/${id}/evaluations`),
        fetch(`/api/rfqs/${id}/award`),
      ]);

      if (rfqRes.ok) {
        const d = await rfqRes.json();
        setRfq(d.data);
      }
      if (evalRes.ok) {
        const d = await evalRes.json();
        setEvaluations(d.data || []);
      }
      if (contractRes.ok) {
        const d = await contractRes.json();
        setContract(d.data);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEvaluation(bidId, { score, notes }) {
    const res = await fetch(`/api/rfqs/${id}/bids/${bidId}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, notes }),
    });
    if (res.ok) {
      // Refresh evaluations
      const evalRes = await fetch(`/api/rfqs/${id}/evaluations`);
      if (evalRes.ok) {
        const d = await evalRes.json();
        setEvaluations(d.data || []);
      }
    }
  }

  async function handleAward() {
    if (!selectedBidId) { setError('Please select a bid to award.'); return; }
    setError('');
    setAwarding(true);
    try {
      const res = await fetch(`/api/rfqs/${id}/award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidId: Number(selectedBidId), notes: awardNotes }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Failed to award contract'); return; }
      setSuccess('Contract awarded successfully!');
      setContract(d.data);
      fetchAll();
    } finally {
      setAwarding(false);
    }
  }

  async function handleCancelAward() {
    if (!confirm('Cancel this award? The RFQ will be reopened for re-awarding.')) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/rfqs/${id}/award`, { method: 'DELETE' });
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Failed to cancel award'); return; }
      setContract(null);
      setSuccess('Award cancelled. RFQ is now re-opened.');
      fetchAll();
    } finally {
      setCancelling(false);
    }
  }

  // Find my own evaluation for a bid
  function myEval(bid) {
    if (!user) return null;
    return bid.evaluations?.find(e => e.evaluatedBy == user.id) || null;
  }

  // Highest score bid
  const maxScore = evaluations.length
    ? Math.max(...evaluations.map(b => b.avgScore ?? -1))
    : -1;

  // Lowest price bid
  const minPrice = evaluations.length
    ? Math.min(...evaluations.map(b => parseFloat(b.totalAmount)))
    : Infinity;

  return (
    <RoleGuard roles={[ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE, ROLES.SUPER_ADMIN]}>
      <DashboardLayout>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

          :root {
            --ink: #0f0e0d;
            --ink-soft: #6b6660;
            --ink-faint: #b8b3ae;
            --surface: #faf9f7;
            --white: #ffffff;
            --accent: #c8501a;
            --accent-h: #a83e12;
            --border: #e4e0db;
            --radius: 10px;
            --shadow: 0 1px 3px rgba(15,14,13,.06), 0 8px 32px rgba(15,14,13,.08);
          }

          .award-page {
            max-width: 1080px;
            margin: 0 auto;
            padding: 32px 24px 120px;
            animation: fadeUp .35s ease both;
          }

          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }

          .section-label {
            font-size: .72rem;
            font-weight: 600;
            letter-spacing: .08em;
            text-transform: uppercase;
            color: var(--ink-faint);
            font-family: 'DM Sans', sans-serif;
            margin-bottom: 14px;
          }

          .bids-grid {
            display: flex;
            flex-direction: column;
            gap: 16px;
            margin-bottom: 32px;
          }

          .bid-row {
            border: 1px solid var(--border);
            border-radius: var(--radius);
            background: var(--white);
            box-shadow: var(--shadow);
            overflow: hidden;
            transition: border-color .2s;
          }

          .bid-row.is-selected {
            border-color: var(--accent);
          }

          .bid-row-header {
            padding: 16px 20px;
            display: grid;
            grid-template-columns: auto 1fr auto auto;
            align-items: center;
            gap: 14px;
            border-bottom: 1px solid var(--border);
            background: var(--surface);
          }

          .bid-select-radio {
            width: 18px;
            height: 18px;
            accent-color: var(--accent);
            cursor: pointer;
          }

          .bid-vendor-name {
            font-family: 'Syne', sans-serif;
            font-size: 1rem;
            font-weight: 700;
            color: var(--ink);
            letter-spacing: -.02em;
          }

          .bid-amount {
            font-family: 'DM Sans', sans-serif;
            font-size: .95rem;
            font-weight: 500;
            color: var(--ink);
          }

          .badge-strip {
            display: flex;
            gap: 6px;
            align-items: center;
          }

          .highlight-badge {
            padding: 2px 8px;
            border-radius: 99px;
            font-size: .68rem;
            font-weight: 600;
            letter-spacing: .05em;
            text-transform: uppercase;
            font-family: 'DM Sans', sans-serif;
          }
          .best-score { background: #fef9c3; color: #713f12; border: 1px solid #fde047; }
          .best-price { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }

          .bid-row-body {
            padding: 16px 20px;
            display: grid;
            grid-template-columns: 1fr 340px;
            gap: 20px;
          }

          .bid-items-mini {
            font-family: 'DM Sans', sans-serif;
          }

          .bid-items-mini table {
            width: 100%;
            border-collapse: collapse;
          }

          .bid-items-mini th {
            text-align: left;
            font-size: .72rem;
            font-weight: 600;
            letter-spacing: .06em;
            text-transform: uppercase;
            color: var(--ink-faint);
            padding: 0 0 6px;
            border-bottom: 1px solid var(--border);
          }

          .bid-items-mini td {
            font-size: .84rem;
            color: var(--ink);
            padding: 7px 0;
            border-bottom: 1px solid var(--border);
            vertical-align: middle;
          }

          .bid-items-mini tr:last-child td { border-bottom: none; }

          .score-display {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
          }

          .score-num {
            font-family: 'Syne', sans-serif;
            font-size: 2rem;
            font-weight: 800;
            line-height: 1;
          }

          .alert {
            padding: 12px 16px;
            border-radius: var(--radius);
            font-family: 'DM Sans', sans-serif;
            font-size: .88rem;
            margin-bottom: 16px;
          }
          .alert-error { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
          .alert-success { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }

          /* Sticky award bar */
          .award-bar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: var(--white);
            border-top: 1px solid var(--border);
            box-shadow: 0 -4px 24px rgba(15,14,13,.1);
            padding: 16px 32px;
            display: flex;
            align-items: center;
            gap: 16px;
            z-index: 100;
          }

          .award-notes-input {
            flex: 1;
            max-width: 400px;
            padding: 9px 12px;
            border: 1px solid var(--border);
            border-radius: 8px;
            font-family: 'DM Sans', sans-serif;
            font-size: .88rem;
            color: var(--ink);
            background: var(--surface);
          }
          .award-notes-input:focus { outline: none; border-color: var(--accent); background: var(--white); }

          .award-btn {
            padding: 10px 28px;
            background: var(--accent);
            color: white;
            border: none;
            border-radius: 8px;
            font-family: 'DM Sans', sans-serif;
            font-size: .9rem;
            font-weight: 600;
            cursor: pointer;
            transition: background .15s, transform .1s;
          }
          .award-btn:hover:not(:disabled) { background: var(--accent-h); transform: translateY(-1px); }
          .award-btn:disabled { opacity: .5; cursor: not-allowed; }

          .loading-state {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 300px;
            color: var(--ink-faint);
            font-family: 'DM Sans', sans-serif;
          }

          .empty-state {
            text-align: center;
            padding: 60px 24px;
            color: var(--ink-soft);
            font-family: 'DM Sans', sans-serif;
          }

          .empty-state h3 {
            font-family: 'Syne', sans-serif;
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--ink);
            margin: 0 0 8px;
          }
        `}</style>

        <div className="award-page">
          <PageHeader
            title="Award Contract"
            subtitle={rfq ? `${rfq.reference_number} — ${rfq.title}` : ''}
            action={
              <button
                onClick={() => router.push(`/dashboard/rfqs/${id}`)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  background: 'var(--white)',
                  color: 'var(--ink)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '.85rem',
                  cursor: 'pointer',
                }}
              >
                ← Back to RFQ
              </button>
            }
          />

          {loading ? (
            <div className="loading-state">Loading evaluations…</div>
          ) : (
            <>
              {error && <div className="alert alert-error">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              {/* If already awarded — show contract card */}
              {contract && (
                <div style={{ marginBottom: 32 }}>
                  <div className="section-label">Contract Awarded</div>
                  <ContractCard
                    contract={contract}
                    onCancel={isAdmin ? handleCancelAward : null}
                    readOnly={!isAdmin}
                  />
                </div>
              )}

              {/* Bids list */}
              {evaluations.length === 0 ? (
                <div className="empty-state">
                  <h3>No submitted bids yet</h3>
                  <p>Vendors need to submit bids before you can evaluate and award.</p>
                </div>
              ) : (
                <>
                  <div className="section-label">
                    Submitted Bids ({evaluations.length})
                  </div>

                  <div className="bids-grid">
                    {evaluations.map(bid => {
                      const isBestScore = bid.avgScore !== null && bid.avgScore === maxScore && maxScore > -1;
                      const isBestPrice = parseFloat(bid.totalAmount) === minPrice;
                      const myEvaluation = myEval(bid);
                      const scoreColor = bid.avgScore === null ? 'var(--ink-faint)'
                        : bid.avgScore >= 80 ? '#059669'
                        : bid.avgScore >= 50 ? '#d97706'
                        : '#dc2626';

                      return (
                        <div
                          key={bid.bidId}
                          className={`bid-row ${selectedBidId == bid.bidId ? 'is-selected' : ''}`}
                        >
                          <div className="bid-row-header">
                            {!contract && canAward && (
                              <input
                                type="radio"
                                className="bid-select-radio"
                                name="selectedBid"
                                value={String(bid.bidId)}
                                checked={selectedBidId == bid.bidId}
                                onChange={e => setSelectedBidId(e.target.value)}
                              />
                            )}
                            {(contract || !canAward) && <div style={{ width: 18 }} />}

                            <div>
                              <div className="bid-vendor-name">{bid.vendorName}</div>
                              <div style={{ marginTop: 4 }}>
                                <BidStatusBadge status={bid.bidStatus} />
                              </div>
                            </div>

                            <div className="bid-amount">
                              {fmt(bid.totalAmount, bid.currency)}
                            </div>

                            <div className="badge-strip">
                              {isBestScore && <span className="highlight-badge best-score">⭐ Top Score</span>}
                              {isBestPrice && <span className="highlight-badge best-price">💰 Best Price</span>}
                            </div>
                          </div>

                          <div className="bid-row-body">
                            <div className="bid-items-mini">
                              <div style={{ fontSize: '.72rem', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 8 }}>
                                Avg. Team Score
                              </div>
                              <div className="score-display">
                                <span className="score-num" style={{ color: scoreColor }}>
                                  {bid.avgScore ?? '—'}
                                </span>
                                {bid.avgScore !== null && (
                                  <span style={{ color: 'var(--ink-faint)', fontSize: '.82rem', fontFamily: "'DM Sans', sans-serif" }}>
                                    / 100 · {bid.evaluations.length} evaluator{bid.evaluations.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                              {bid.evaluations.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 8 }}>
                                  {bid.evaluations.map((ev, i) => (
                                    <div key={i} style={{ fontSize: '.8rem', color: 'var(--ink-soft)', fontFamily: "'DM Sans', sans-serif", display: 'flex', gap: 8 }}>
                                      <span>{ev.evaluatorName}:</span>
                                      <strong style={{ color: 'var(--ink)' }}>{ev.score ?? '—'}</strong>
                                      {ev.notes && <span style={{ color: 'var(--ink-faint)' }}>&quot;{ev.notes.substring(0, 40)}{ev.notes.length > 40 ? '…' : ''}&quot;</span>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* My evaluation panel */}
                            {canAward && !contract && (
                              <EvaluationPanel
                                bid={bid}
                                evaluation={myEvaluation}
                                onSave={(data) => handleSaveEvaluation(bid.bidId, data)}
                                readOnly={false}
                              />
                            )}
                            {(readOnly || contract) && (
                              <EvaluationPanel
                                bid={bid}
                                evaluation={myEvaluation}
                                onSave={() => {}}
                                readOnly={true}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Sticky award bar — only show if not yet awarded and user can award */}
        {!contract && canAward && !loading && evaluations.length > 0 && (
          <div className="award-bar">
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '.88rem', color: 'var(--ink-soft)', marginRight: 8 }}>
              {selectedBidId
                ? `Awarding to: ${evaluations.find(b => b.bidId == selectedBidId)?.vendorName}`
                : 'Select a bid above to award'}
            </div>
            <input
              className="award-notes-input"
              placeholder="Award notes (optional)…"
              value={awardNotes}
              onChange={e => setAwardNotes(e.target.value)}
            />
            <button
              className="award-btn"
              onClick={handleAward}
              disabled={!selectedBidId || awarding}
            >
              {awarding ? 'Awarding…' : '🏆 Award Contract'}
            </button>
          </div>
        )}
      </DashboardLayout>
    </RoleGuard>
  );
}

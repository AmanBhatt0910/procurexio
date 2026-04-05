'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import BidComparisonTable from '@/components/bids/BidComparisonTable';
import BidStatusBadge from '@/components/bids/BidStatusBadge';
import RFQStatusBadge from '@/components/rfq/RFQStatusBadge';

export default function RFQBidsPage() {
  const { id: rfqId } = useParams();
  const router = useRouter();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [activeTab, setActiveTab] = useState('comparison'); // 'comparison' | 'list' | 'report'
  const [report, setReport]   = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError]     = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchBids = useCallback(async () => {
    try {
      const res = await fetch(`/api/rfqs/${rfqId}/bids`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setData(json.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [rfqId]);

  useEffect(() => { fetchBids(); }, [fetchBids]);

  const exportCSV = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/rfqs/${rfqId}/bids/export?format=csv`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cd = res.headers.get('Content-Disposition') || '';
      const match = cd.match(/filename="([^"]+)"/);
      a.download = match ? match[1] : `bids-${rfqId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Export failed: ' + e.message);
    } finally {
      setExporting(false);
    }
  };

  const fetchReport = async () => {
    setReportLoading(true);
    setReportError('');
    try {
      const res = await fetch(`/api/rfqs/${rfqId}/report`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate report');
      setReport(json.data);
    } catch (e) {
      setReportError(e.message);
    } finally {
      setReportLoading(false);
    }
  };

  const handleReportTab = () => {
    setActiveTab('report');
    if (!report) fetchReport();
  };

  const downloadReport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rfq-report-${report.rfq?.reference || rfqId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const rfq     = data?.rfq;
  const items   = data?.items || [];
  const bids    = data?.bids  || [];
  const submitted = bids.filter(b => b.status === 'submitted');
  const totalBids = bids.length;

  const fmtAmount = (val, cur) =>
    val != null ? `${cur || ''} ${parseFloat(val).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—';

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
        .stats-row {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px; margin-bottom: 24px;
        }
        .stat-card {
          background: var(--white); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 16px 20px;
          box-shadow: var(--shadow);
        }
        .stat-card .stat-label {
          font-size: .72rem; font-weight: 600; letter-spacing: .08em;
          text-transform: uppercase; color: var(--ink-faint); margin-bottom: 6px;
        }
        .stat-card .stat-value {
          font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1.6rem;
          color: var(--ink); line-height: 1;
        }
        .stat-card .stat-sub { font-size: .78rem; color: var(--ink-soft); margin-top: 4px; }
        .tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); margin-bottom: 20px; }
        .tab-btn {
          padding: 10px 20px; background: none; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: .88rem; font-weight: 500;
          color: var(--ink-soft); border-bottom: 2px solid transparent;
          transition: all .15s; margin-bottom: -1px;
        }
        .tab-btn.active { color: var(--ink); border-bottom-color: var(--ink); }
        .tab-btn:hover:not(.active) { color: var(--ink); }
        .bid-list-card {
          background: var(--white); border: 1px solid var(--border);
          border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow);
        }
        .bid-list-item {
          display: flex; align-items: center; gap: 16px;
          padding: 16px 20px; border-bottom: 1px solid var(--border);
          transition: background .12s;
        }
        .bid-list-item:last-child { border-bottom: none; }
        .bid-list-item:hover { background: var(--surface); }
        .vendor-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: var(--surface); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: .8rem; font-weight: 700; color: var(--ink-soft);
          flex-shrink: 0; text-transform: uppercase;
        }
        .bid-list-info { flex: 1; min-width: 0; }
        .bid-vendor-name { font-weight: 600; color: var(--ink); font-size: .9rem; }
        .bid-meta { font-size: .78rem; color: var(--ink-soft); margin-top: 2px; }
        .bid-total { font-variant-numeric: tabular-nums; font-weight: 600; font-size: .95rem; color: var(--ink); }
        .btn {
          padding: 7px 16px; border-radius: 6px; font-size: .82rem;
          font-weight: 600; cursor: pointer; border: 1px solid var(--border);
          font-family: 'DM Sans', sans-serif; background: var(--surface);
          color: var(--ink); transition: all .12s;
        }
        .btn:hover { background: var(--border); }
        .error-box {
          background: #fdf0eb; border: 1px solid #f5c9b6; border-radius: var(--radius);
          padding: 12px 16px; color: var(--accent); font-size: .86rem; margin-bottom: 16px;
        }
        .skeleton { background: linear-gradient(90deg, #f0ede9 25%, #faf9f7 50%, #f0ede9 75%); background-size: 200% 100%; animation: shimmer 1.2s infinite; border-radius: 6px; }
        @keyframes shimmer { to { background-position: -200% 0; } }
        .main-card {
          background: var(--white); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 24px; box-shadow: var(--shadow);
        }
        .lowest-badge {
          display: inline-block; padding: 2px 8px; border-radius: 4px;
          background: #e8f5ee; color: #1a7a4a; font-size: .72rem; font-weight: 600;
        }
      `}</style>

      <DashboardLayout>
        {loading ? (
          <div>
            <div className="skeleton" style={{ height: 32, width: 320, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 18, width: 200, marginBottom: 24 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
              {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 80 }} />)}
            </div>
            <div className="skeleton" style={{ height: 400 }} />
          </div>
        ) : error ? (
          <div className="error-box">{error}</div>
        ) : rfq ? (
          <>
            <PageHeader
              title={`Bids — ${rfq.title}`}
              subtitle={`${rfq.reference_number} · Bid Comparison`}
              action={
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" onClick={() => router.push(`/dashboard/rfqs/${rfqId}`)}>
                    ← RFQ Details
                  </button>
                  <button
                    className="btn"
                    onClick={exportCSV}
                    disabled={exporting}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    {exporting ? 'Exporting…' : '⬇ Export CSV'}
                  </button>
                </div>
              }
            />

            {/* Stats */}
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-label">Total Bids</div>
                <div className="stat-value">{totalBids}</div>
                <div className="stat-sub">received</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Submitted</div>
                <div className="stat-value" style={{ color: '#1a7a4a' }}>{submitted.length}</div>
                <div className="stat-sub">active bids</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Lowest Bid</div>
                <div className="stat-value" style={{ fontSize: '1.1rem', marginTop: 4 }}>
                  {submitted.length
                    ? fmtAmount(Math.min(...submitted.map(b => b.totalAmount)), rfq.currency)
                    : '—'}
                </div>
                <div className="stat-sub">best offer</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">RFQ Status</div>
                <div style={{ marginTop: 8 }}><RFQStatusBadge status={rfq.status} /></div>
                <div className="stat-sub" style={{ marginTop: 6 }}>
                  {rfq.deadline
                    ? `Deadline: ${new Date(rfq.deadline).toLocaleDateString('en-US', { dateStyle: 'medium' })}`
                    : 'No deadline'}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
              <button
                className={`tab-btn ${activeTab === 'comparison' ? 'active' : ''}`}
                onClick={() => setActiveTab('comparison')}
              >
                Side-by-Side Comparison
              </button>
              <button
                className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
                onClick={() => setActiveTab('list')}
              >
                All Bids ({totalBids})
              </button>
              <button
                className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`}
                onClick={handleReportTab}
              >
                📄 Report
              </button>
            </div>

            {activeTab === 'comparison' ? (
              <div className="main-card">
                <BidComparisonTable rfqItems={items} bids={bids} currency={rfq.currency} />
              </div>
            ) : activeTab === 'report' ? (
              <div className="main-card">
                {reportLoading ? (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-faint)' }}>Generating report…</div>
                ) : reportError ? (
                  <div style={{ color: 'var(--accent)', fontSize: '.86rem' }}>{reportError}</div>
                ) : report ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                      <div>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--ink)' }}>
                          RFQ Report
                        </div>
                        <div style={{ fontSize: '.76rem', color: 'var(--ink-faint)', marginTop: 2 }}>
                          Generated at {new Date(report.generatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </div>
                      <button className="btn" onClick={downloadReport} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        ⬇ Download JSON
                      </button>
                    </div>

                    {/* Summary cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 24 }}>
                      {[
                        { label: 'Total Bids', value: report.summary.totalBids },
                        { label: 'Submitted', value: report.summary.submittedBids },
                        { label: 'Lowest Bid', value: report.summary.lowestBid ? `${rfq.currency} ${report.summary.lowestBid.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—' },
                        { label: 'Average Bid', value: report.summary.averageBid ? `${rfq.currency} ${report.summary.averageBid.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—' },
                      ].map(card => (
                        <div key={card.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
                          <div style={{ fontSize: '.7rem', fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 4 }}>{card.label}</div>
                          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--ink)' }}>{card.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Bids table */}
                    <div style={{ fontSize: '.8rem', fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 10 }}>
                      Bid Rankings
                    </div>
                    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                      {report.bids.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-faint)' }}>No bids received</div>
                      ) : (
                        report.bids.map((bid, i) => {
                          const lvlColors = { L1: { bg: '#e8f5ee', color: '#1a7a4a' }, L2: { bg: '#e8edf5', color: '#2a4a8c' }, L3: { bg: '#f0ede8', color: '#6b6660' } };
                          const lc = bid.level && lvlColors[bid.level] ? lvlColors[bid.level] : { bg: '#f5f4f2', color: '#b8b3ae' };
                          return (
                            <div key={bid.bidId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < report.bids.length - 1 ? '1px solid var(--border)' : 'none' }}>
                              {bid.level && (
                                <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: '.72rem', fontWeight: 700, background: lc.bg, color: lc.color, letterSpacing: '.04em', minWidth: 28, textAlign: 'center' }}>
                                  {bid.level}
                                </span>
                              )}
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '.88rem', color: 'var(--ink)' }}>
                                  {bid.vendorName}
                                  {bid.status === 'awarded' && <span style={{ marginLeft: 6, fontSize: '.72rem', background: '#e8f5ee', color: '#1a7a4a', padding: '1px 7px', borderRadius: 4, fontWeight: 700 }}>★ Awarded</span>}
                                </div>
                                {bid.submittedAt && (
                                  <div style={{ fontSize: '.76rem', color: 'var(--ink-faint)' }}>
                                    {new Date(bid.submittedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                                  </div>
                                )}
                              </div>
                              <div style={{ fontWeight: 600, fontSize: '.92rem', color: 'var(--ink)' }}>
                                {bid.totalAmount > 0 ? fmtAmount(bid.totalAmount, bid.currency) : '—'}
                              </div>
                              <span style={{ fontSize: '.74rem', padding: '2px 8px', borderRadius: 4, background: bid.status === 'submitted' ? '#e8f2ea' : bid.status === 'awarded' ? '#e8f5ee' : '#f5f4f2', color: bid.status === 'submitted' ? '#2d7a3a' : bid.status === 'awarded' ? '#1a7a4a' : '#6b6660', fontWeight: 600, textTransform: 'uppercase' }}>
                                {bid.status}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="bid-list-card">
                {bids.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--ink-soft)', fontSize: '.9rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>📭</div>
                    <div style={{ fontWeight: 500, color: 'var(--ink)', marginBottom: 4 }}>No bids yet</div>
                    Vendors will appear here once they start bidding.
                  </div>
                ) : (
                  (() => {
                    // Compute L-levels from submitted bids sorted by totalAmount ASC
                    const rankedSubmitted = [...submitted].sort((a, b) => a.totalAmount - b.totalAmount);
                    const levelMap = {};
                    rankedSubmitted.forEach((b, i) => { levelMap[b.bidId] = `L${i + 1}`; });
                    const levelColors = {
                      L1: { bg: '#e8f5ee', color: '#1a7a4a' },
                      L2: { bg: '#e8edf5', color: '#2a4a8c' },
                      L3: { bg: '#f0ede8', color: '#6b6660' },
                    };
                    return bids.map(bid => {
                      const level = levelMap[bid.bidId];
                      const lvlCfg = level && levelColors[level] ? levelColors[level] : null;
                      return (
                        <div key={bid.bidId} className="bid-list-item">
                          <div className="vendor-avatar">
                            {bid.vendorName.charAt(0)}
                          </div>
                          <div className="bid-list-info">
                            <div className="bid-vendor-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {bid.vendorName}
                              {level && (
                                <span style={{
                                  display: 'inline-block', padding: '1px 7px',
                                  borderRadius: 4, fontSize: '.7rem', fontWeight: 700,
                                  background: lvlCfg ? lvlCfg.bg : '#f0ede8',
                                  color: lvlCfg ? lvlCfg.color : '#6b6660',
                                  letterSpacing: '.04em',
                                }}>
                                  {level}
                                </span>
                              )}
                            </div>
                            <div className="bid-meta">
                              {bid.submittedAt
                                ? `Submitted ${new Date(bid.submittedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`
                                : `Updated ${bid.status}`}
                            </div>
                          </div>
                          <div>
                            <BidStatusBadge status={bid.status} />
                          </div>
                          <div className="bid-total">
                            {bid.totalAmount > 0 ? fmtAmount(bid.totalAmount, bid.currency) : '—'}
                          </div>
                          <button
                            className="btn"
                            onClick={() => router.push(`/dashboard/rfqs/${rfqId}/bids/${bid.bidId}`)}
                          >
                            View →
                          </button>
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            )}
          </>
        ) : null}
      </DashboardLayout>
    </>
  );
}
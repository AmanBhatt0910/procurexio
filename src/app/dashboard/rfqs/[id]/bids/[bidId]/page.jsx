'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import BidStatusBadge from '@/components/bids/BidStatusBadge';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

function fmtAmount(val, currency) {
  if (val == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(val);
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: '.72rem', fontWeight: 600, letterSpacing: '.07em',
        textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
        {label}
      </span>
      <span style={{ fontSize: '.9rem', color: 'var(--ink)', fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}

export default function BidDetailPage() {
  const { id: rfqId, bidId } = useParams();
  const router = useRouter();

  const [bid, setBid]       = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [bidRes, attRes] = await Promise.all([
          fetch(`/api/rfqs/${rfqId}/bids/${bidId}`),
          fetch(`/api/rfqs/${rfqId}/bids/${bidId}/attachments`),
        ]);
        const bidJson = await bidRes.json();
        if (!bidRes.ok) throw new Error(bidJson.error || 'Failed to load bid');
        setBid(bidJson.data);

        if (attRes.ok) {
          const attJson = await attRes.json();
          setAttachments(attJson.data || []);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [rfqId, bidId]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Syne:wght@600;700;800&display=swap');
        :root {
          --ink:#0f0e0d;--ink-soft:#6b6660;--ink-faint:#b8b3ae;
          --surface:#faf9f7;--white:#ffffff;--accent:#c8501a;
          --border:#e4e0db;--radius:10px;
          --shadow:0 1px 3px rgba(15,14,13,.06),0 8px 32px rgba(15,14,13,.08);
        }
        body { font-family: 'DM Sans', sans-serif; }
        .bid-detail { max-width: 840px; animation: fadeUp .3s ease both; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }
        .card {
          background: var(--white); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 24px; margin-bottom: 16px;
          box-shadow: var(--shadow);
        }
        .card-title {
          font-size: .72rem; font-weight: 600; letter-spacing: .08em;
          text-transform: uppercase; color: var(--ink-faint); margin-bottom: 16px;
        }
        .meta-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px;
        }
        .items-table { width: 100%; border-collapse: collapse; font-size: .86rem; }
        .items-table th {
          text-align: left; padding: 8px 12px; font-size: .72rem; font-weight: 600;
          letter-spacing: .07em; text-transform: uppercase; color: var(--ink-faint);
          border-bottom: 1px solid var(--border);
        }
        .items-table td { padding: 10px 12px; border-bottom: 1px solid var(--border); color: var(--ink); }
        .items-table tr:last-child td { border-bottom: none; }
        .items-table .num { text-align: right; font-variant-numeric: tabular-nums; }
        .total-row td { font-weight: 700; background: var(--surface); }
        .btn {
          padding: 7px 16px; border-radius: 6px; font-size: .82rem;
          font-weight: 600; cursor: pointer; border: 1px solid var(--border);
          font-family: 'DM Sans', sans-serif; background: var(--surface);
          color: var(--ink); transition: all .12s; text-decoration: none;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .btn:hover { background: var(--border); }
        .skeleton { background: linear-gradient(90deg, #f0ede9 25%, #faf9f7 50%, #f0ede9 75%);
          background-size: 200% 100%; animation: shimmer 1.2s infinite; border-radius: 6px; }
        @keyframes shimmer { to { background-position: -200% 0; } }
        .error-box {
          background: #fdf0eb; border: 1px solid #f5c9b6; border-radius: var(--radius);
          padding: 12px 16px; color: var(--accent); font-size: .86rem;
        }
        .attach-row {
          display: flex; align-items: center; gap: 12px; padding: 10px 14px;
          border: 1px solid var(--border); border-radius: var(--radius);
          margin-bottom: 8px; background: var(--surface);
        }
        .attach-icon { font-size: 1.2rem; }
        .attach-info { flex: 1; min-width: 0; }
        .attach-name { font-size: .88rem; font-weight: 500; color: var(--ink);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .attach-meta { font-size: .75rem; color: var(--ink-soft); margin-top: 2px; }
      `}</style>

      <DashboardLayout>
        {loading ? (
          <div>
            <div className="skeleton" style={{ height: 32, width: 280, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 18, width: 200, marginBottom: 24 }} />
            <div className="skeleton" style={{ height: 200, marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 300 }} />
          </div>
        ) : error ? (
          <div className="error-box">{error}</div>
        ) : bid ? (
          <div className="bid-detail">
            <PageHeader
              title={`Bid from ${bid.vendor_name}`}
              subtitle={
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BidStatusBadge status={bid.status} />
                  <span style={{ color: 'var(--ink-faint)', fontSize: '.82rem' }}>
                    {bid.submitted_at ? `Submitted ${fmtDate(bid.submitted_at)}` : 'Not yet submitted'}
                  </span>
                </span>
              }
              action={{
                label: '← Back to Bids',
                onClick: () => router.push(`/dashboard/rfqs/${rfqId}/bids`),
              }}
            />

            {/* Overview */}
            <div className="card">
              <div className="card-title">Overview</div>
              <div className="meta-grid">
                <InfoRow label="Vendor" value={bid.vendor_name} />
                <InfoRow label="Status" value={<BidStatusBadge status={bid.status} />} />
                <InfoRow label="Total Amount" value={
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)' }}>
                    {fmtAmount(bid.total_amount, bid.currency)}
                  </span>
                } />
                <InfoRow label="Currency" value={bid.currency} />
                <InfoRow label="Submitted At" value={fmtDate(bid.submitted_at)} />
                <InfoRow label="Last Updated" value={fmtDate(bid.updated_at)} />
              </div>
              {bid.notes && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '.72rem', fontWeight: 600, letterSpacing: '.07em',
                    textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 6 }}>
                    Notes
                  </div>
                  <p style={{ fontSize: '.88rem', color: 'var(--ink)', lineHeight: 1.6,
                    whiteSpace: 'pre-wrap', margin: 0 }}>
                    {bid.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Line Items */}
            {bid.items?.length > 0 && (
              <div className="card">
                <div className="card-title">Line Items</div>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th className="num">Qty</th>
                      <th>Unit</th>
                      <th className="num">Unit Price</th>
                      <th className="num">Total Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bid.items.map((item, i) => (
                      <tr key={i}>
                        <td>{item.description}</td>
                        <td className="num">{parseFloat(item.quantity).toLocaleString()}</td>
                        <td>{item.unit || '—'}</td>
                        <td className="num">{fmtAmount(item.unit_price, bid.currency)}</td>
                        <td className="num">{fmtAmount(item.total_price, bid.currency)}</td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td colSpan={4} style={{ textAlign: 'right' }}>Total</td>
                      <td className="num">{fmtAmount(bid.total_amount, bid.currency)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Attachments */}
            <div className="card">
              <div className="card-title">Attachments ({attachments.length})</div>
              {attachments.length === 0 ? (
                <p style={{ fontSize: '.86rem', color: 'var(--ink-soft)', margin: 0 }}>
                  No attachments submitted with this bid.
                </p>
              ) : (
                attachments.map(att => (
                  <div key={att.id} className="attach-row">
                    <span className="attach-icon">📎</span>
                    <div className="attach-info">
                      <div className="attach-name">{att.original_name}</div>
                      <div className="attach-meta">
                        {att.mime_type} · {(att.file_size / 1024).toFixed(1)} KB ·
                        Uploaded {fmtDate(att.created_at)}
                      </div>
                    </div>
                    <a
                      href={`/api/files/${att.file_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn"
                    >
                      View
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </DashboardLayout>
    </>
  );
}

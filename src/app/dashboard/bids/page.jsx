'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import DataTable from '@/components/ui/DataTable';
import BidStatusBadge from '@/components/bids/BidStatusBadge';
import RFQStatusBadge from '@/components/rfq/RFQStatusBadge';
import { useRouter } from 'next/navigation';

export default function VendorBidsPage() {
  const [rfqs, setRfqs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [companyCurrency, setCompanyCurrency] = useState('USD');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/bids/rfqs')
      .then(r => r.json())
      .then(rfqJson => {
        if (rfqJson.data?.rfqs) setRfqs(rfqJson.data.rfqs);
        else setError(rfqJson.error || 'Failed to load');
        // Currency now comes from the RFQ API — no separate settings call needed
        if (rfqJson.data?.companyCurrency) setCompanyCurrency(rfqJson.data.companyCurrency);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const isPastDeadline = (deadline) => deadline && new Date() > new Date(deadline);

  const columns = [
    {
      key: 'reference_number',
      label: 'Reference',
      render: (val) => (
        <span style={{ fontFamily: 'monospace', fontSize: '.82rem', color: 'var(--ink-soft)', fontWeight: 600 }}>
          {val}
        </span>
      ),
    },
    { key: 'title', label: 'RFQ Title', render: (val) => <span style={{ fontWeight: 500 }}>{val}</span> },
    {
      key: 'rfq_status',
      label: 'RFQ Status',
      render: (val) => <RFQStatusBadge status={val} />,
    },
    {
      key: 'deadline',
      label: 'Deadline',
      render: (val) => {
        if (!val) return <span style={{ color: 'var(--ink-faint)' }}>—</span>;
        const past = isPastDeadline(val);
        return (
          <span style={{ color: past ? 'var(--accent)' : 'var(--ink)', fontSize: '.86rem' }}>
            {past && '⚠ '}{new Date(val).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        );
      },
    },
    {
      key: 'bid_status',
      label: 'My Bid',
      render: (val) => val ? <BidStatusBadge status={val} /> : (
        <span style={{ color: 'var(--ink-faint)', fontSize: '.82rem' }}>Not started</span>
      ),
    },
    {
      key: 'total_amount',
      label: 'Bid Total',
      render: (val, row) => {
        if (!val) return <span style={{ color: 'var(--ink-faint)' }}>—</span>;
        // Use row currency, fall back to company currency, then USD
        const currency = row?.currency || companyCurrency || 'USD';
        return (
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
            {currency} {parseFloat(val).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        );
      },
    },
    {
      key: 'id',
      label: '',
      render: (val, row) => (
        <button
          onClick={() => router.push(`/dashboard/bids/${row.id}`)}
          style={{
            padding: '6px 16px', background: 'var(--ink)', color: '#fff',
            border: 'none', borderRadius: 6, fontSize: '.8rem',
            fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {row.bid_status === 'submitted' ? 'View' : row.bid_status === 'draft' ? 'Continue' : 'Open'}
        </button>
      ),
    },
  ];

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
        .error-box {
          background: #fdf0eb; border: 1px solid #f5c9b6; border-radius: var(--radius);
          padding: 14px 18px; color: var(--accent); font-size: .88rem; margin-bottom: 20px;
        }
        .info-banner {
          background: #f0f5ff; border: 1px solid #c3d5f8; border-radius: var(--radius);
          padding: 12px 18px; color: #2d5bb8; font-size: .85rem; margin-bottom: 20px;
        }
      `}</style>
      <DashboardLayout>
        <PageHeader
          title="My Bid Invitations"
          subtitle="RFQs you have been invited to respond to"
        />
        {error && <div className="error-box">{error}</div>}
        {!loading && rfqs.length === 0 && !error && (
          <div className="info-banner">
            You haven&apos;t been invited to any open RFQs yet. Check back later.
          </div>
        )}
        <DataTable
          columns={columns}
          rows={rfqs}
          loading={loading}
          emptyMessage="No RFQ invitations found"
        />
      </DashboardLayout>
    </>
  );
}
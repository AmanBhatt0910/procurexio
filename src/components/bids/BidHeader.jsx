'use client';
// src/components/bids/BidHeader.jsx

import { useState, useEffect } from 'react';
import RFQStatusBadge from '@/components/rfq/RFQStatusBadge';
import { getDeadlineTimeLeftMs } from '@/lib/utils/deadline';

function pad(n) { return String(n).padStart(2, '0'); }

function CountdownTimer({ deadline }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!deadline) return;
    const calc = () => {
      const diff = getDeadlineTimeLeftMs(deadline);
      if (diff == null || diff <= 0) { setTimeLeft({ expired: true }); return; }
      setTimeLeft({
        expired: false,
        diff,
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000)  / 60000),
        seconds: Math.floor((diff % 60000)    / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (!timeLeft) return null;

  if (timeLeft.expired) {
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        background: '#FCEBEB', border: '1px solid #F7C1C1',
        borderRadius: 10, padding: '8px 14px',
        color: '#A32D2D', fontWeight: 600, fontSize: '.82rem',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        Bidding Closed
      </div>
    );
  }

  const isUrgent  = timeLeft.diff < 86400000;
  const isWarning = timeLeft.diff < 3 * 86400000;

  const theme = isUrgent
    ? { bg: '#FCEBEB', border: '#F7C1C1', color: '#A32D2D', label: 'Closes soon' }
    : isWarning
    ? { bg: '#FAEEDA', border: '#FAC775', color: '#633806', label: 'Time remaining' }
    : { bg: '#EAF3DE', border: '#C0DD97', color: '#3B6D11', label: 'Time remaining' };

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 12,
      background: theme.bg, border: `1px solid ${theme.border}`,
      borderRadius: 12, padding: '10px 16px', color: theme.color,
    }}>
      <div>
        <div style={{
          fontSize: '.67rem', fontWeight: 700, letterSpacing: '.08em',
          textTransform: 'uppercase', opacity: .7, marginBottom: 3,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {theme.label}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
          {timeLeft.days > 0 && (
            <span>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-.03em' }}>
                {timeLeft.days}
              </span>
              <span style={{ fontSize: '.68rem', fontWeight: 700, marginLeft: 1, opacity: .7 }}>d</span>
            </span>
          )}
          {[
            [pad(timeLeft.hours), 'h'],
            [pad(timeLeft.minutes), 'm'],
            [pad(timeLeft.seconds), 's'],
          ].map(([val, unit]) => (
            <span key={unit}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-.03em' }}>
                {val}
              </span>
              <span style={{ fontSize: '.68rem', fontWeight: 700, marginLeft: 1, opacity: .7 }}>{unit}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetaItem({ label, value, accent }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 4,
      padding: '12px 16px',
      background: 'var(--surface)',
      borderRadius: 10,
      border: '1px solid var(--border)',
    }}>
      <span style={{
        fontSize: '.67rem', fontWeight: 700, letterSpacing: '.08em',
        textTransform: 'uppercase', color: 'var(--ink-faint)',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {label}
      </span>
      <span style={{
        fontSize: '.92rem', fontWeight: 600, color: accent ? 'var(--accent)' : 'var(--ink)',
        fontFamily: "'DM Sans', sans-serif", lineHeight: 1.3,
      }}>
        {value}
      </span>
    </div>
  );
}

export default function BidHeader({ rfq, rfqItems, isPastDeadline }) {
  if (!rfq) return null;
  const isClosedStatus = rfq.status === 'closed' || rfq.status === 'cancelled';

  return (
    <>
      <style>{`
        .bid-header-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 22px 24px;
          margin-bottom: 20px;
        }
        .bid-header-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .bid-header-meta-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 10px;
        }
        @media (max-width: 540px) {
          .bid-header-card { padding: 18px 16px; }
          .bid-header-meta-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className="bid-header-card">
        <div className="bid-header-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '.67rem', fontWeight: 700, letterSpacing: '.1em',
              textTransform: 'uppercase', color: 'var(--ink-faint)',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              RFQ Overview
            </span>
            <RFQStatusBadge status={rfq.status} />
          </div>
          {rfq.deadline && !isClosedStatus && (
            <CountdownTimer deadline={rfq.deadline} />
          )}
        </div>

        {rfq.description && (
          <p style={{
            color: 'var(--ink-soft)', fontSize: '.875rem', margin: '0 0 16px',
            lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif",
          }}>
            {rfq.description}
          </p>
        )}

        <div className="bid-header-meta-grid">
          <MetaItem
            label="Deadline"
            value={rfq.deadline
              ? new Date(rfq.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : '—'}
            accent={isPastDeadline}
          />
          {rfq.budget && (
            <MetaItem
              label="Budget"
              value={`${rfq.currency || ''} ${parseFloat(rfq.budget).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
            />
          )}
          <MetaItem label="Line Items" value={rfqItems.length} />
          {rfq.reference_number && (
            <MetaItem label="Reference" value={rfq.reference_number} />
          )}
        </div>
      </div>
    </>
  );
}
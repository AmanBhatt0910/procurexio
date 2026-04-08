'use client';
import { useState, useEffect } from 'react';
import RFQStatusBadge from '@/components/rfq/RFQStatusBadge';

// ── Countdown Timer ────────────────────────────────────────────────────────
function CountdownTimer({ deadline }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!deadline) return;
    const calc = () => {
      const diff = new Date(deadline) - new Date();
      if (diff <= 0) { setTimeLeft({ expired: true }); return; }
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
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: '#fdf0eb', border: '1px solid #f5c9b6',
        borderRadius: 8, padding: '6px 12px',
        color: '#c8501a', fontWeight: 600, fontSize: '.82rem',
      }}>
        🔒 Bidding Closed
      </div>
    );
  }

  const isUrgent  = timeLeft.diff < 86400000;
  const isWarning = timeLeft.diff < 3 * 86400000;
  const bg  = isUrgent  ? '#fdf0eb' : isWarning ? '#fff8e8' : '#e8f5ee';
  const brd = isUrgent  ? '#f5c9b6' : isWarning ? '#f5dfa0' : '#6ee7b7';
  const clr = isUrgent  ? '#c8501a' : isWarning ? '#8a6500' : '#1a7a4a';
  const pad = n => String(n).padStart(2, '0');

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      background: bg, border: `1px solid ${brd}`,
      borderRadius: 10, padding: '10px 16px', color: clr,
    }}>
      <span style={{ fontSize: '1.1rem' }}>{isUrgent ? '⚡' : isWarning ? '⏰' : '🟢'}</span>
      <div>
        <div style={{
          fontSize: '.68rem', fontWeight: 700, letterSpacing: '.08em',
          textTransform: 'uppercase', opacity: .8, marginBottom: 2,
        }}>
          Time Remaining
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
          {timeLeft.days > 0 && (
            <span>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-.03em' }}>
                {timeLeft.days}
              </span>
              <span style={{ fontSize: '.72rem', fontWeight: 600, marginLeft: 2, opacity: .75 }}>d</span>
            </span>
          )}
          <span>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-.03em' }}>
              {pad(timeLeft.hours)}
            </span>
            <span style={{ fontSize: '.72rem', fontWeight: 600, marginLeft: 2, opacity: .75 }}>h</span>
          </span>
          <span>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-.03em' }}>
              {pad(timeLeft.minutes)}
            </span>
            <span style={{ fontSize: '.72rem', fontWeight: 600, marginLeft: 2, opacity: .75 }}>m</span>
          </span>
          <span>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-.03em' }}>
              {pad(timeLeft.seconds)}
            </span>
            <span style={{ fontSize: '.72rem', fontWeight: 600, marginLeft: 2, opacity: .75 }}>s</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ── BidHeader — RFQ details card with countdown timer ─────────────────────
export default function BidHeader({ rfq, rfqItems, isPastDeadline }) {
  if (!rfq) return null;

  return (
    <div className="rfq-meta-card">
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap',
        gap: 12, marginBottom: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="section-label">RFQ Details</span>
          <RFQStatusBadge status={rfq.status} />
        </div>
        {rfq.deadline && <CountdownTimer deadline={rfq.deadline} />}
      </div>

      {rfq.description && (
        <p style={{ color: 'var(--ink-soft)', fontSize: '.9rem', margin: '0 0 12px' }}>
          {rfq.description}
        </p>
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
            <span>
              {rfq.currency}{' '}
              {parseFloat(rfq.budget).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
        <div className="meta-item">
          <label>Line Items</label>
          <span>{rfqItems.length}</span>
        </div>
      </div>
    </div>
  );
}

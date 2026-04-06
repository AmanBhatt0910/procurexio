'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function Hero() {
  const heroRef = useRef(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    el.classList.add('hero-visible');
  }, []);

  return (
    <>
      <style>{`
        .hero-section {
          padding: 140px 32px 100px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 100px;
          padding: 5px 14px 5px 8px;
          font-size: .78rem;
          font-weight: 500;
          color: var(--ink-soft);
          margin-bottom: 36px;
          box-shadow: 0 1px 4px rgba(15,14,13,.06);
          opacity: 0;
          transform: translateY(10px);
          transition: opacity .5s ease, transform .5s ease;
        }
        .hero-visible .hero-badge {
          opacity: 1;
          transform: translateY(0);
        }
        .hero-badge-dot {
          width: 20px; height: 20px;
          background: #fff5f0;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }
        .hero-badge-dot span {
          width: 7px; height: 7px;
          background: var(--accent);
          border-radius: 50%;
          display: block;
        }

        .hero-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: center;
        }

        .hero-left {}

        .hero-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2.6rem, 5vw, 4rem);
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -.03em;
          color: var(--ink);
          margin-bottom: 24px;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity .6s ease .1s, transform .6s ease .1s;
        }
        .hero-visible .hero-title { opacity: 1; transform: translateY(0); }
        .hero-title .accent { color: var(--accent); }
        .hero-title .line2 { display: block; }

        .hero-sub {
          font-size: 1.1rem;
          color: var(--ink-soft);
          line-height: 1.7;
          max-width: 460px;
          margin-bottom: 40px;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity .6s ease .2s, transform .6s ease .2s;
        }
        .hero-visible .hero-sub { opacity: 1; transform: translateY(0); }

        .hero-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity .6s ease .3s, transform .6s ease .3s;
        }
        .hero-visible .hero-actions { opacity: 1; transform: translateY(0); }

        .hero-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--ink);
          color: #fff;
          text-decoration: none;
          border-radius: 10px;
          padding: 12px 24px;
          font-size: .95rem;
          font-weight: 600;
          transition: background .15s, transform .15s, box-shadow .15s;
        }
        .hero-btn-primary:hover {
          background: #1e1c1a;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(15,14,13,.18);
        }
        .hero-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          color: var(--ink);
          text-decoration: none;
          border-radius: 10px;
          padding: 12px 24px;
          font-size: .95rem;
          font-weight: 500;
          border: 1.5px solid var(--border);
          transition: border-color .15s, background .15s, transform .15s;
        }
        .hero-btn-secondary:hover {
          border-color: var(--ink-soft);
          background: rgba(15,14,13,.03);
          transform: translateY(-2px);
        }

        .hero-stats {
          display: flex;
          gap: 32px;
          margin-top: 48px;
          padding-top: 40px;
          border-top: 1px solid var(--border);
          opacity: 0;
          transform: translateY(16px);
          transition: opacity .6s ease .4s, transform .6s ease .4s;
        }
        .hero-visible .hero-stats { opacity: 1; transform: translateY(0); }
        .hero-stat-num {
          font-family: 'Syne', sans-serif;
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--ink);
          letter-spacing: -.03em;
          line-height: 1;
          margin-bottom: 4px;
        }
        .hero-stat-label {
          font-size: .8rem;
          color: var(--ink-faint);
          font-weight: 500;
        }

        /* Right — mock UI card */
        .hero-right {
          opacity: 0;
          transform: translateY(20px) scale(.98);
          transition: opacity .7s ease .15s, transform .7s ease .15s;
        }
        .hero-visible .hero-right { opacity: 1; transform: translateY(0) scale(1); }

        .mock-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(15,14,13,.05), 0 24px 80px rgba(15,14,13,.1);
          position: relative;
        }

        .mock-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--border);
        }
        .mock-topbar-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: .88rem;
          color: var(--ink);
        }
        .mock-topbar-btn {
          background: var(--accent);
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 5px 12px;
          font-size: .75rem;
          font-weight: 600;
          cursor: default;
        }

        .mock-stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 16px;
        }
        .mock-stat-card {
          background: var(--surface);
          border-radius: 10px;
          padding: 12px 14px;
          border: 1px solid var(--border);
        }
        .mock-stat-val {
          font-family: 'Syne', sans-serif;
          font-size: 1.3rem;
          font-weight: 800;
          color: var(--ink);
          letter-spacing: -.02em;
        }
        .mock-stat-lbl {
          font-size: .7rem;
          color: var(--ink-faint);
          margin-top: 2px;
        }
        .mock-stat-trend {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          font-size: .68rem;
          font-weight: 600;
          color: #16a34a;
          background: #f0fdf4;
          padding: 1px 6px;
          border-radius: 100px;
          margin-top: 4px;
        }

        .mock-rfq-list { display: flex; flex-direction: column; gap: 8px; }
        .mock-rfq-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: var(--surface);
          border-radius: 8px;
          border: 1px solid var(--border);
        }
        .mock-rfq-title { font-size: .8rem; font-weight: 600; color: var(--ink); }
        .mock-rfq-meta { font-size: .7rem; color: var(--ink-faint); margin-top: 2px; }
        .mock-badge {
          font-size: .68rem;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 100px;
        }
        .badge-active { background: #eff6ff; color: #1d4ed8; }
        .badge-eval { background: #fef3c7; color: #92400e; }
        .badge-awarded { background: #f0fdf4; color: #15803d; }

        .mock-footer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid var(--border);
        }
        .mock-avatars {
          display: flex;
          gap: -4px;
        }
        .mock-avatar {
          width: 24px; height: 24px;
          border-radius: 50%;
          border: 2px solid var(--white);
          margin-right: -6px;
          font-size: .6rem;
          font-weight: 700;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mock-footer-label { font-size: .72rem; color: var(--ink-faint); }

        @media (max-width: 900px) {
          .hero-section { padding: 120px 24px 80px; }
          .hero-layout { grid-template-columns: 1fr; gap: 40px; }
          .hero-stats { gap: 20px; }
          .hero-right { order: -1; }
          .mock-card { max-width: 480px; margin: 0 auto; }
        }
        @media (max-width: 640px) {
          .hero-section { padding: 100px 16px 60px; }
          .hero-sub { font-size: 1rem; }
          .hero-stats { gap: 16px; flex-wrap: wrap; }
          .hero-stat-num { font-size: 1.3rem; }
        }
        @media (max-width: 480px) {
          .hero-title { font-size: clamp(2rem, 8vw, 2.6rem); }
          .hero-actions { flex-direction: column; }
          .hero-actions a { text-align: center; justify-content: center; }
          .mock-stats-row { grid-template-columns: repeat(3, 1fr); }
          .mock-rfq-row { flex-direction: column; align-items: flex-start; gap: 6px; }
        }
      `}</style>

      <section className="hero-section" ref={heroRef}>
        <div className="hero-badge">
          <div className="hero-badge-dot"><span /></div>
          Procurement Intelligence Platform
        </div>

        <div className="hero-layout">
          <div className="hero-left">
            <h1 className="hero-title">
              Procurement,
              <span className="line2"><span className="accent">Simplified</span> with</span>
              <span className="line2">Intelligence.</span>
            </h1>
            <p className="hero-sub">
              RFQs, vendor bids, and contract awards — all in one platform. Move faster, negotiate smarter, and close deals with confidence.
            </p>
            <div className="hero-actions">
              <Link href="/register" className="hero-btn-primary">
                Start Free
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
              <a href="#how-it-works" className="hero-btn-secondary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polygon points="10 8 16 12 10 16 10 8"/>
                </svg>
                View Demo
              </a>
            </div>

            <div className="hero-stats">
              <div>
                <div className="hero-stat-num">2.4k+</div>
                <div className="hero-stat-label">RFQs processed</div>
              </div>
              <div>
                <div className="hero-stat-num">98%</div>
                <div className="hero-stat-label">Bid response rate</div>
              </div>
              <div>
                <div className="hero-stat-num">3×</div>
                <div className="hero-stat-label">Faster cycle time</div>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <div className="mock-card">
              <div className="mock-topbar">
                <span className="mock-topbar-title">Procurement Dashboard</span>
                <button className="mock-topbar-btn">+ New RFQ</button>
              </div>

              <div className="mock-stats-row">
                <div className="mock-stat-card">
                  <div className="mock-stat-val">24</div>
                  <div className="mock-stat-lbl">Active RFQs</div>
                  <div className="mock-stat-trend">↑ 12%</div>
                </div>
                <div className="mock-stat-card">
                  <div className="mock-stat-val">147</div>
                  <div className="mock-stat-lbl">Total Bids</div>
                  <div className="mock-stat-trend">↑ 8%</div>
                </div>
                <div className="mock-stat-card">
                  <div className="mock-stat-val">38</div>
                  <div className="mock-stat-lbl">Vendors</div>
                  <div className="mock-stat-trend">↑ 5%</div>
                </div>
              </div>

              <div className="mock-rfq-list">
                {[
                  { title: 'Office Equipment Q3', meta: '8 vendors · 6 bids', badge: 'Active', cls: 'badge-active' },
                  { title: 'IT Infrastructure Upgrade', meta: '12 vendors · 11 bids', badge: 'Evaluating', cls: 'badge-eval' },
                  { title: 'Catering Services 2025', meta: '5 vendors · 5 bids', badge: 'Awarded', cls: 'badge-awarded' },
                ].map(r => (
                  <div className="mock-rfq-row" key={r.title}>
                    <div>
                      <div className="mock-rfq-title">{r.title}</div>
                      <div className="mock-rfq-meta">{r.meta}</div>
                    </div>
                    <span className={`mock-badge ${r.cls}`}>{r.badge}</span>
                  </div>
                ))}
              </div>

              <div className="mock-footer-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="mock-avatars">
                    {[['#c8501a','R'],['#1d4ed8','M'],['#16a34a','S'],['#7c3aed','P']].map(([bg,l]) => (
                      <div key={l} className="mock-avatar" style={{ background: bg }}>{l}</div>
                    ))}
                  </div>
                  <span className="mock-footer-label">4 team members active</span>
                </div>
                <span style={{ fontSize: '.72rem', color: 'var(--accent)', fontWeight: 600 }}>Live ●</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
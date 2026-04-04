export default function ProductPreview() {
  return (
    <>
      <style>{`
        .preview-section {
          padding: 100px 32px;
          background: var(--surface);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .preview-inner {
          max-width: 1200px;
          margin: 0 auto;
        }

        .preview-header {
          text-align: center;
          margin-bottom: 64px;
        }
        .preview-eyebrow {
          font-size: .75rem;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 12px;
        }
        .preview-heading {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.8rem, 3.5vw, 2.6rem);
          font-weight: 800;
          letter-spacing: -.03em;
          color: var(--ink);
          line-height: 1.15;
          margin-bottom: 14px;
        }
        .preview-sub {
          font-size: 1rem;
          color: var(--ink-soft);
          max-width: 480px;
          margin: 0 auto;
          line-height: 1.65;
        }

        /* Big mock dashboard */
        .mock-dashboard {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 18px;
          box-shadow: 0 4px 12px rgba(15,14,13,.05), 0 32px 100px rgba(15,14,13,.1);
          overflow: hidden;
        }

        .mock-dash-titlebar {
          background: var(--ink);
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .titlebar-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
        }
        .titlebar-url {
          margin-left: 12px;
          flex: 1;
          background: rgba(255,255,255,.08);
          border-radius: 6px;
          height: 24px;
          display: flex;
          align-items: center;
          padding: 0 12px;
          font-size: .72rem;
          color: rgba(255,255,255,.35);
          font-weight: 500;
        }

        .mock-dash-body {
          display: flex;
          min-height: 480px;
        }

        .mock-sidebar {
          width: 200px;
          flex-shrink: 0;
          border-right: 1px solid var(--border);
          padding: 20px 0;
          background: #fdfcfa;
        }
        .mock-sidebar-logo {
          padding: 0 16px 16px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 12px;
          font-family: 'Syne', sans-serif;
          font-size: .88rem;
          font-weight: 700;
          color: var(--ink);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .mock-sidebar-logo-icon {
          width: 24px; height: 24px;
          background: var(--ink);
          border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
        }
        .mock-sidebar-logo-icon svg { color: #fff; }
        .mock-sidebar-logo span { color: var(--accent); }
        .mock-nav-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          font-size: .78rem;
          font-weight: 500;
          color: var(--ink-faint);
          border-radius: 0;
          cursor: default;
        }
        .mock-nav-item.active {
          color: var(--ink);
          background: rgba(15,14,13,.05);
          font-weight: 600;
          position: relative;
        }
        .mock-nav-item.active::before {
          content: '';
          position: absolute;
          left: 0; top: 4px; bottom: 4px;
          width: 2.5px;
          background: var(--accent);
          border-radius: 0 2px 2px 0;
        }
        .mock-nav-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--accent);
          margin-left: auto;
        }

        .mock-main {
          flex: 1;
          padding: 24px;
          overflow: hidden;
        }

        .mock-main-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .mock-main-title {
          font-family: 'Syne', sans-serif;
          font-size: .95rem;
          font-weight: 800;
          color: var(--ink);
          letter-spacing: -.01em;
        }
        .mock-main-actions {
          display: flex;
          gap: 8px;
        }
        .mock-action-btn {
          padding: 5px 12px;
          border-radius: 7px;
          font-size: .72rem;
          font-weight: 600;
          cursor: default;
        }
        .mock-action-btn-ghost {
          border: 1px solid var(--border);
          color: var(--ink-soft);
          background: transparent;
        }
        .mock-action-btn-solid {
          background: var(--accent);
          color: #fff;
          border: none;
        }

        .mock-kpi-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }
        .mock-kpi {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 14px 16px;
        }
        .mock-kpi-label {
          font-size: .68rem;
          color: var(--ink-faint);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: .04em;
          margin-bottom: 6px;
        }
        .mock-kpi-val {
          font-family: 'Syne', sans-serif;
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--ink);
          letter-spacing: -.02em;
          line-height: 1;
        }
        .mock-kpi-change {
          margin-top: 4px;
          font-size: .66rem;
          font-weight: 600;
          color: #16a34a;
        }

        .mock-table {
          border: 1px solid var(--border);
          border-radius: 10px;
          overflow: hidden;
        }
        .mock-table-head {
          background: var(--surface);
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
          padding: 9px 14px;
          border-bottom: 1px solid var(--border);
        }
        .mock-th {
          font-size: .66rem;
          font-weight: 700;
          color: var(--ink-faint);
          text-transform: uppercase;
          letter-spacing: .06em;
        }
        .mock-table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
          padding: 10px 14px;
          border-bottom: 1px solid var(--border);
          align-items: center;
          transition: background .1s;
        }
        .mock-table-row:last-child { border-bottom: none; }
        .mock-table-row:hover { background: #fdfcfa; }
        .mock-td {
          font-size: .75rem;
          color: var(--ink-soft);
        }
        .mock-td-title {
          font-weight: 600;
          color: var(--ink);
        }
        .mock-status {
          display: inline-flex;
          padding: 3px 8px;
          border-radius: 100px;
          font-size: .66rem;
          font-weight: 700;
        }

        /* Floating card */
        .preview-float-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 32px;
        }
        .preview-float-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
          transition: box-shadow .2s, transform .2s;
        }
        .preview-float-card:hover {
          box-shadow: var(--shadow);
          transform: translateY(-2px);
        }
        .pfcard-icon {
          width: 36px; height: 36px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          font-size: 1.1rem;
        }
        .pfcard-title {
          font-size: .82rem;
          font-weight: 700;
          color: var(--ink);
          margin-bottom: 3px;
          font-family: 'Syne', sans-serif;
        }
        .pfcard-desc {
          font-size: .75rem;
          color: var(--ink-soft);
          line-height: 1.5;
        }

        @media (max-width: 860px) {
          .mock-sidebar { display: none; }
          .mock-kpi-row { grid-template-columns: repeat(2, 1fr); }
          .mock-table-head,
          .mock-table-row { grid-template-columns: 2fr 1fr 1fr; }
          .mock-th:nth-child(4), .mock-th:nth-child(5),
          .mock-td:nth-child(4), .mock-td:nth-child(5) { display: none; }
          .preview-float-cards { grid-template-columns: 1fr; }
        }
        @media (max-width: 560px) {
          .preview-section { padding: 64px 20px; }
          .mock-kpi-row { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <section id="product" className="preview-section">
        <div className="preview-inner">
          <div className="preview-header">
            <div className="preview-eyebrow">Product Preview</div>
            <h2 className="preview-heading">Your procurement hub, beautifully organized</h2>
            <p className="preview-sub">Every RFQ, bid, and vendor relationship in one clean dashboard.</p>
          </div>

          <div className="mock-dashboard">
            {/* Title bar */}
            <div className="mock-dash-titlebar">
              <div className="titlebar-dot" style={{ background: '#ff5f57' }} />
              <div className="titlebar-dot" style={{ background: '#ffbd2e' }} />
              <div className="titlebar-dot" style={{ background: '#28c840' }} />
              <div className="titlebar-url">procurexio.com/dashboard/rfqs</div>
            </div>

            <div className="mock-dash-body">
              {/* Sidebar */}
              <div className="mock-sidebar">
                <div className="mock-sidebar-logo">
                  <div className="mock-sidebar-logo-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                      <path d="M2 17l10 5 10-5"/>
                      <path d="M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  Procure<span>xio</span>
                </div>
                {[
                  { label: 'Dashboard', active: false },
                  { label: 'RFQs', active: true, dot: true },
                  { label: 'Bids', active: false },
                  { label: 'Vendors', active: false },
                  { label: 'Contracts', active: false },
                  { label: 'Notifications', active: false },
                ].map(item => (
                  <div key={item.label} className={`mock-nav-item${item.active ? ' active' : ''}`}>
                    <span>{item.label}</span>
                    {item.dot && <span className="mock-nav-dot" />}
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div className="mock-main">
                <div className="mock-main-header">
                  <div className="mock-main-title">RFQ Management</div>
                  <div className="mock-main-actions">
                    <button className="mock-action-btn mock-action-btn-ghost">Filter</button>
                    <button className="mock-action-btn mock-action-btn-solid">+ New RFQ</button>
                  </div>
                </div>

                <div className="mock-kpi-row">
                  {[
                    { label: 'Total RFQs', val: '24', ch: '+3 this week' },
                    { label: 'Active Bids', val: '147', ch: '+12 today' },
                    { label: 'Awarded', val: '18', ch: '+2 this week' },
                    { label: 'Vendors', val: '38', ch: '+5 this month' },
                  ].map(k => (
                    <div key={k.label} className="mock-kpi">
                      <div className="mock-kpi-label">{k.label}</div>
                      <div className="mock-kpi-val">{k.val}</div>
                      <div className="mock-kpi-change">{k.ch}</div>
                    </div>
                  ))}
                </div>

                <div className="mock-table">
                  <div className="mock-table-head">
                    <div className="mock-th">Title</div>
                    <div className="mock-th">Bids</div>
                    <div className="mock-th">Deadline</div>
                    <div className="mock-th">Value</div>
                    <div className="mock-th">Status</div>
                  </div>
                  {[
                    { title: 'Office Equipment Q3', bids: 8, deadline: 'Jul 15', value: '$48k', status: 'Active', sc: { bg: '#eff6ff', c: '#1d4ed8' } },
                    { title: 'IT Infrastructure', bids: 11, deadline: 'Jul 22', value: '$240k', status: 'Evaluating', sc: { bg: '#fef3c7', c: '#92400e' } },
                    { title: 'Catering Services', bids: 5, deadline: 'Jun 30', value: '$18k', status: 'Awarded', sc: { bg: '#f0fdf4', c: '#15803d' } },
                    { title: 'Security Systems', bids: 3, deadline: 'Aug 05', value: '$92k', status: 'Draft', sc: { bg: '#f5f5f4', c: '#78716c' } },
                  ].map(r => (
                    <div key={r.title} className="mock-table-row">
                      <div className="mock-td mock-td-title">{r.title}</div>
                      <div className="mock-td">{r.bids}</div>
                      <div className="mock-td">{r.deadline}</div>
                      <div className="mock-td">{r.value}</div>
                      <div className="mock-td">
                        <span className="mock-status" style={{ background: r.sc.bg, color: r.sc.c }}>{r.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3 callout cards */}
          <div className="preview-float-cards">
            {[
              { icon: '📊', bg: '#fff5f0', title: 'Bid Analytics', desc: 'Compare bids on price, quality and delivery with weighted scoring.' },
              { icon: '🔔', bg: '#eff6ff', title: 'Real-time Alerts', desc: 'Instant notifications when bids come in, deadlines approach, or contracts are awarded.' },
              { icon: '📁', bg: '#f0fdf4', title: 'Contract Records', desc: 'Every awarded contract archived and searchable — full audit trail included.' },
            ].map(c => (
              <div key={c.title} className="preview-float-card">
                <div className="pfcard-icon" style={{ background: c.bg }}>{c.icon}</div>
                <div>
                  <div className="pfcard-title">{c.title}</div>
                  <div className="pfcard-desc">{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
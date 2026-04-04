'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import RoleGuard from '@/components/auth/RoleGuard';
import { useRouter } from 'next/navigation';

function RedirectToDashboard() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard'); }, [router]);
  return null;
}

const ACTION_ICONS = {
  company_created:  '🏢',
  user_registered:  '👤',
  rfq_created:      '📋',
  bid_submitted:    '⭐',
  contract_awarded: '✅',
};

const ACTION_LABELS = {
  company_created:  'Company created',
  user_registered:  'User registered',
  rfq_created:      'RFQ created',
  bid_submitted:    'Bid submitted',
  contract_awarded: 'Contract awarded',
};

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)   return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ActivityLogsPage() {
  const [logs, setLogs]       = useState([]);
  const [meta, setMeta]       = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);

  const fetchLogs = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/activity-logs?page=${p}&limit=30`);
      const data = await res.json();
      if (res.ok) {
        setLogs(data.data);
        setMeta(data.meta);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(page); }, [fetchLogs, page]);

  return (
    <RoleGuard roles={['super_admin']} fallback={<RedirectToDashboard />}>
      <>
        <style>{`
          .page-header { margin-bottom: 24px; }
          .page-title {
            font-family: 'Syne', sans-serif; font-weight: 700;
            font-size: 1.4rem; color: var(--ink);
            letter-spacing: -.03em; margin-bottom: 4px;
          }
          .page-sub { font-size: .855rem; color: var(--ink-soft); }

          .timeline {
            background: var(--white); border: 1px solid var(--border);
            border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow);
          }
          .timeline-item {
            display: flex; align-items: flex-start; gap: 14px;
            padding: 14px 18px; border-bottom: 1px solid var(--border);
            transition: background .12s;
          }
          .timeline-item:last-child { border-bottom: none; }
          .timeline-item:hover { background: #fdfcfb; }

          .timeline-icon {
            width: 32px; height: 32px; border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
            font-size: 1rem; flex-shrink: 0;
            background: var(--surface); border: 1px solid var(--border);
          }

          .timeline-body { flex: 1; min-width: 0; }
          .timeline-action {
            font-size: .855rem; font-weight: 500; color: var(--ink);
            display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
          }
          .timeline-resource {
            font-size: .83rem; color: var(--ink-soft); margin-top: 2px;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          .timeline-meta {
            font-size: .77rem; color: var(--ink-faint); margin-top: 3px;
            display: flex; gap: 10px; flex-wrap: wrap;
          }

          .action-badge {
            font-size: .68rem; padding: 2px 7px; border-radius: 20px;
            font-weight: 600; letter-spacing: .03em; text-transform: uppercase;
          }
          .badge-company   { background: #eff6ff; color: #1d4ed8; }
          .badge-user      { background: #f0fdf4; color: #166534; }
          .badge-rfq       { background: #fefce8; color: #854d0e; }
          .badge-bid       { background: #fdf4ff; color: #6b21a8; }
          .badge-contract  { background: #f0fdf4; color: #065f46; }

          .timeline-time {
            font-size: .78rem; color: var(--ink-faint);
            white-space: nowrap; flex-shrink: 0; padding-top: 2px;
          }

          .pagination {
            display: flex; align-items: center; justify-content: center;
            gap: 12px; padding: 20px;
            font-size: .85rem; color: var(--ink-soft);
          }
          .page-btn {
            padding: 6px 14px; border: 1px solid var(--border); border-radius: 6px;
            background: var(--white); font-family: 'DM Sans', sans-serif;
            font-size: .83rem; font-weight: 500; color: var(--ink);
            cursor: pointer; transition: background .15s;
          }
          .page-btn:hover:not(:disabled) { background: var(--surface); }
          .page-btn:disabled { opacity: .4; cursor: not-allowed; }

          .empty-state {
            padding: 48px 24px; text-align: center; color: var(--ink-faint); font-size: .88rem;
          }
          .skel-row {
            display: flex; gap: 14px; padding: 14px 18px;
            border-bottom: 1px solid var(--border); align-items: center;
          }
          .skel { background: linear-gradient(90deg,#f0ede9 25%,#faf9f7 50%,#f0ede9 75%); background-size:200% 100%; animation:shimmer 1.2s infinite; border-radius:4px; }
          @keyframes shimmer { to { background-position: -200% 0; } }
        `}</style>

        <DashboardLayout pageTitle="Activity Logs">
          <div className="page-header">
            <div className="page-title">Activity Logs</div>
            <div className="page-sub">Platform-wide audit trail of recent actions</div>
          </div>

          <div className="timeline">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <div className="skel-row" key={i}>
                  <div className="skel" style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skel" style={{ height: 13, width: '55%', marginBottom: 6 }} />
                    <div className="skel" style={{ height: 11, width: '40%' }} />
                  </div>
                  <div className="skel" style={{ width: 60, height: 11 }} />
                </div>
              ))
            ) : logs.length === 0 ? (
              <div className="empty-state">No activity found.</div>
            ) : (
              logs.map((log, i) => {
                const badgeClass = {
                  company_created:  'badge-company',
                  user_registered:  'badge-user',
                  rfq_created:      'badge-rfq',
                  bid_submitted:    'badge-bid',
                  contract_awarded: 'badge-contract',
                }[log.action_type] ?? '';

                return (
                  <div className="timeline-item" key={i}>
                    <div className="timeline-icon">
                      {ACTION_ICONS[log.action_type] ?? '📌'}
                    </div>
                    <div className="timeline-body">
                      <div className="timeline-action">
                        <span className={`action-badge ${badgeClass}`}>
                          {log.action_type?.replace('_', ' ')}
                        </span>
                        <span>{ACTION_LABELS[log.action_type] ?? log.action_type}</span>
                      </div>
                      {log.resource_name && (
                        <div className="timeline-resource">
                          {log.resource_name}
                        </div>
                      )}
                      <div className="timeline-meta">
                        {log.actor_name && <span>👤 {log.actor_name}</span>}
                        {log.company_name && <span>🏢 {log.company_name}</span>}
                      </div>
                    </div>
                    <div className="timeline-time">{timeAgo(log.occurred_at)}</div>
                  </div>
                );
              })
            )}
          </div>

          {!loading && meta.totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span>Page {page} of {meta.totalPages}</span>
              <button className="page-btn" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </DashboardLayout>
      </>
    </RoleGuard>
  );
}

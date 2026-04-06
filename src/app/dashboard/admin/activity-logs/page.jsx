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
  login_success:           '🔑',
  login_failure:           '🚫',
  logout:                  '👋',
  register_success:        '✅',
  register_failure:        '❌',
  password_reset_request:  '🔐',
  password_reset_sent:     '📧',
  password_reset_complete: '🔓',
  account_locked:          '🔒',
  user_created:            '👤',
  user_updated:            '✏️',
  user_deactivated:        '⛔',
  user_role_changed:       '🎭',
  company_created:         '🏢',
  company_updated:         '🏗️',
  company_status_changed:  '🔄',
  vendor_created:          '🏪',
  vendor_updated:          '📝',
  vendor_deactivated:      '🚫',
  rfq_created:             '📋',
  rfq_updated:             '✏️',
  rfq_status_changed:      '🔄',
  bid_created:             '💼',
  bid_submitted:           '⭐',
  bid_withdrawn:           '↩️',
  award_created:           '🏆',
  award_cancelled:         '❌',
  evaluation_submitted:    '📊',
  invitation_created:      '✉️',
  invitation_accepted:     '🤝',
};

const STATUS_COLORS = {
  success: { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },
  failure: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
  error:   { bg: '#fff7ed', text: '#9a3412', border: '#fed7aa' },
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

function formatFullDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function truncateUserAgent(ua) {
  if (!ua) return null;
  // Extract browser + OS from UA string
  const match = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)[/\s]([\d.]+)/) ||
                ua.match(/(MSIE|Trident)\s?([\d.]+)/);
  if (match) {
    const osMatch = ua.match(/\(([^)]+)\)/);
    const os = osMatch ? osMatch[1].split(';')[0].trim() : '';
    return `${match[1]} ${match[2]}${os ? ` · ${os}` : ''}`;
  }
  return ua.length > 60 ? ua.slice(0, 60) + '…' : ua;
}

export default function ActivityLogsPage() {
  const [logs, setLogs]               = useState([]);
  const [meta, setMeta]               = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading]         = useState(true);
  const [page, setPage]               = useState(1);
  const [actionFilter, setActionFilter]     = useState('');
  const [statusFilter, setStatusFilter]     = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [dateFrom, setDateFrom]             = useState('');
  const [dateTo, setDateTo]                 = useState('');
  const [searchQuery, setSearchQuery]       = useState('');
  const [availableActions, setAvailableActions] = useState([]);
  const [expandedId, setExpandedId]   = useState(null);

  const fetchLogs = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 30 });
      if (actionFilter)   params.set('action_type',   actionFilter);
      if (statusFilter)   params.set('status',        statusFilter);
      if (resourceFilter) params.set('resource_type', resourceFilter);
      if (dateFrom)       params.set('date_from',     dateFrom);
      if (dateTo)         params.set('date_to',       dateTo);
      if (searchQuery)    params.set('search',        searchQuery);

      const res  = await fetch(`/api/admin/activity-logs?${params}`);
      const data = await res.json();
      if (res.ok) {
        setLogs(data.data || []);
        setMeta(data.meta || {});
        if (data.filters?.actionTypes?.length) {
          setAvailableActions(data.filters.actionTypes);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [actionFilter, statusFilter, resourceFilter, dateFrom, dateTo, searchQuery]);

  useEffect(() => {
    setPage(1);
    fetchLogs(1);
  }, [actionFilter, statusFilter, resourceFilter, dateFrom, dateTo, searchQuery, fetchLogs]);

  useEffect(() => {
    fetchLogs(page);
  }, [page, fetchLogs]);

  function handleFilterChange(setter) {
    return (e) => {
      setter(e.target.value);
      setPage(1);
    };
  }

  async function handleExport(format) {
    const params = new URLSearchParams({ page: 1, limit: 1000 });
    if (actionFilter)   params.set('action_type',   actionFilter);
    if (statusFilter)   params.set('status',        statusFilter);
    if (resourceFilter) params.set('resource_type', resourceFilter);
    if (dateFrom)       params.set('date_from',     dateFrom);
    if (dateTo)         params.set('date_to',       dateTo);
    if (searchQuery)    params.set('search',        searchQuery);

    const res  = await fetch(`/api/admin/activity-logs?${params}`);
    const data = await res.json();
    const rows = data.data || [];

    if (format === 'csv') {
      const headers = ['id','created_at','action_type','description','user_email','actor_name','resource_type','resource_name','status','ip_address'];
      const lines   = [
        headers.join(','),
        ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))
      ];
      const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'activity-logs.csv'; a.click();
      URL.revokeObjectURL(url);
    } else {
      const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'activity-logs.json'; a.click();
      URL.revokeObjectURL(url);
    }
  }

  const RESOURCE_TYPES = ['user', 'vendor', 'rfq', 'bid', 'contract', 'invitation', 'company'];

  return (
    <DashboardLayout pageTitle="Activity Logs">
      <RoleGuard roles={['super_admin']} fallback={<RedirectToDashboard />}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@400;500&display=swap');

          .al-header { margin-bottom: 24px; }
          .al-title {
            font-family: 'Syne', sans-serif; font-weight: 700;
            font-size: 1.4rem; color: var(--ink);
            letter-spacing: -.03em; margin-bottom: 4px;
          }
          .al-sub { font-size: .855rem; color: var(--ink-soft); }

          .al-filters {
            display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;
          }
          .al-select {
            padding: 8px 12px; border: 1px solid var(--border); border-radius: 8px;
            font-family: 'DM Sans', sans-serif; font-size: .845rem;
            background: var(--white); color: var(--ink); outline: none; cursor: pointer;
            transition: border-color .15s;
          }
          .al-select:focus { border-color: var(--accent); }

          .al-stats {
            font-size: .82rem; color: var(--ink-faint);
            display: flex; align-items: center; margin-left: auto;
            white-space: nowrap;
          }

          .al-timeline {
            background: var(--white); border: 1px solid var(--border);
            border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow);
          }

          .al-item {
            border-bottom: 1px solid var(--border);
            transition: background .12s;
            cursor: default;
          }
          .al-item:last-child { border-bottom: none; }
          .al-item:hover { background: #fdfcfb; }

          .al-row {
            display: flex; align-items: flex-start; gap: 14px;
            padding: 14px 18px;
          }

          .al-icon {
            width: 34px; height: 34px; border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
            font-size: 1rem; flex-shrink: 0;
            background: var(--surface); border: 1px solid var(--border);
          }

          .al-body { flex: 1; min-width: 0; }

          .al-main-row {
            display: flex; align-items: flex-start;
            gap: 8px; flex-wrap: wrap; margin-bottom: 4px;
          }

          .al-description {
            font-size: .875rem; font-weight: 500; color: var(--ink);
            font-family: 'DM Sans', sans-serif;
          }

          .al-status-badge {
            font-size: .68rem; padding: 2px 7px; border-radius: 20px;
            font-weight: 600; letter-spacing: .03em; text-transform: uppercase;
            border: 1px solid;
            flex-shrink: 0;
          }

          .al-resource {
            font-size: .82rem; color: var(--ink-soft);
            font-family: 'DM Sans', sans-serif;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            margin-bottom: 3px;
          }

          .al-meta {
            font-size: .77rem; color: var(--ink-faint);
            display: flex; gap: 12px; flex-wrap: wrap;
            font-family: 'DM Sans', sans-serif;
            align-items: center;
          }

          .al-meta-chip {
            display: inline-flex; align-items: center; gap: 4px;
          }

          .al-time-col {
            font-size: .78rem; color: var(--ink-faint);
            white-space: nowrap; flex-shrink: 0;
            padding-top: 3px; text-align: right;
            font-family: 'DM Sans', sans-serif;
          }
          .al-time-full {
            font-size: .72rem; color: var(--ink-faint);
            display: block; margin-top: 2px;
          }

          .al-expand-btn {
            background: none; border: none; cursor: pointer;
            font-size: .72rem; color: var(--accent);
            padding: 0; font-family: 'DM Sans', sans-serif;
            margin-left: auto; flex-shrink: 0;
            text-decoration: underline;
          }

          .al-detail {
            padding: 10px 18px 14px 66px;
            border-top: 1px dashed var(--border);
            background: var(--surface);
          }
          .al-detail-grid {
            display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 8px 20px;
          }
          .al-detail-item {
            font-size: .78rem; font-family: 'DM Sans', sans-serif;
          }
          .al-detail-label {
            font-size: .68rem; font-weight: 600; letter-spacing: .06em;
            text-transform: uppercase; color: var(--ink-faint); margin-bottom: 2px;
          }
          .al-detail-value { color: var(--ink); word-break: break-all; }
          .al-changes {
            margin-top: 10px;
            font-size: .78rem; font-family: 'DM Sans', sans-serif;
          }
          .al-changes-label {
            font-size: .68rem; font-weight: 600; letter-spacing: .06em;
            text-transform: uppercase; color: var(--ink-faint); margin-bottom: 4px;
          }
          .al-changes-pre {
            background: #1e1e1e; color: #d4d4d4;
            padding: 8px 12px; border-radius: 6px; overflow-x: auto;
            font-size: .75rem; line-height: 1.5;
            font-family: 'Courier New', monospace;
          }

          .al-pagination {
            display: flex; align-items: center; justify-content: space-between;
            gap: 12px; padding: 16px 18px;
            font-size: .85rem; color: var(--ink-soft);
            border-top: 1px solid var(--border);
            flex-wrap: wrap;
          }
          .al-page-info { font-size: .82rem; color: var(--ink-faint); }
          .al-page-btns { display: flex; gap: 6px; }
          .al-page-btn {
            padding: 6px 14px; border: 1px solid var(--border); border-radius: 6px;
            background: var(--white); font-family: 'DM Sans', sans-serif;
            font-size: .83rem; font-weight: 500; color: var(--ink);
            cursor: pointer; transition: background .15s;
          }
          .al-page-btn:hover:not(:disabled) { background: var(--surface); }
          .al-page-btn:disabled { opacity: .4; cursor: not-allowed; }
          .al-page-btn.active {
            background: var(--accent); color: #fff;
            border-color: var(--accent);
          }

          .al-empty {
            padding: 48px 24px; text-align: center;
            color: var(--ink-faint); font-size: .88rem;
            font-family: 'DM Sans', sans-serif;
          }

          .skel-row {
            display: flex; gap: 14px; padding: 14px 18px;
            border-bottom: 1px solid var(--border); align-items: center;
          }
          .skel {
            background: linear-gradient(90deg,#f0ede9 25%,#faf9f7 50%,#f0ede9 75%);
            background-size:200% 100%;
            animation: shimmer 1.2s infinite;
            border-radius: 4px;
          }
          @keyframes shimmer { to { background-position: -200% 0; } }
        `}</style>

        <div className="al-header">
          <div className="al-title">Activity Logs</div>
          <div className="al-sub">Platform-wide audit trail — every action, who did it, and when</div>
        </div>

        {/* Filter bar */}
        <div className="al-filters">
          <input
            className="al-select"
            type="text"
            placeholder="Search user, resource, action…"
            value={searchQuery}
            onChange={handleFilterChange(setSearchQuery)}
            style={{ minWidth: 200 }}
          />

          <select
            className="al-select"
            value={actionFilter}
            onChange={handleFilterChange(setActionFilter)}
          >
            <option value="">All Actions</option>
            {availableActions.map(a => (
              <option key={a} value={a}>
                {a.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </option>
            ))}
          </select>

          <select
            className="al-select"
            value={resourceFilter}
            onChange={handleFilterChange(setResourceFilter)}
          >
            <option value="">All Resources</option>
            {RESOURCE_TYPES.map(r => (
              <option key={r} value={r}>{r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
            ))}
          </select>

          <select
            className="al-select"
            value={statusFilter}
            onChange={handleFilterChange(setStatusFilter)}
          >
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="error">Error</option>
          </select>

          <input
            className="al-select"
            type="date"
            value={dateFrom}
            onChange={handleFilterChange(setDateFrom)}
            title="From date"
          />
          <input
            className="al-select"
            type="date"
            value={dateTo}
            onChange={handleFilterChange(setDateTo)}
            title="To date"
          />

          <span className="al-stats">
            {!loading && `${meta.total?.toLocaleString() ?? 0} event${meta.total !== 1 ? 's' : ''}`}
          </span>

          <button
            className="al-page-btn"
            onClick={() => handleExport('csv')}
            title="Export as CSV"
            style={{ marginLeft: 'auto' }}
          >⬇ CSV</button>
          <button
            className="al-page-btn"
            onClick={() => handleExport('json')}
            title="Export as JSON"
          >⬇ JSON</button>
        </div>

        <div className="al-timeline">
          {loading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div className="skel-row" key={i}>
                <div className="skel" style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skel" style={{ height: 13, width: '55%', marginBottom: 6 }} />
                  <div className="skel" style={{ height: 11, width: '35%', marginBottom: 5 }} />
                  <div className="skel" style={{ height: 10, width: '70%' }} />
                </div>
                <div className="skel" style={{ width: 70, height: 11 }} />
              </div>
            ))
          ) : logs.length === 0 ? (
            <div className="al-empty">
              No activity found{actionFilter || statusFilter || resourceFilter ? ' matching these filters' : ''}.
            </div>
          ) : (
            logs.map((log) => {
              const sc = STATUS_COLORS[log.status] || {};
              const isExpanded = expandedId === log.id;
              return (
                <div className="al-item" key={log.id}>
                  <div className="al-row">
                    <div className="al-icon">{ACTION_ICONS[log.action_type] ?? '📌'}</div>

                    <div className="al-body">
                      <div className="al-main-row">
                        <span className="al-description">{log.description}</span>
                        {log.status && (
                          <span
                            className="al-status-badge"
                            style={{ background: sc.bg, color: sc.text, borderColor: sc.border }}
                          >
                            {log.status}
                          </span>
                        )}
                      </div>

                      {log.resource_name && (
                        <div className="al-resource">
                          {log.resource_type && (
                            <span style={{ fontWeight: 500, textTransform: 'capitalize', marginRight: 4 }}>
                              {log.resource_type}:
                            </span>
                          )}
                          {log.resource_name}
                        </div>
                      )}

                      <div className="al-meta">
                        {(log.actor_name || log.user_email) && (
                          <span className="al-meta-chip">
                            👤 {log.actor_name || log.user_email}
                            {log.actor_role && (
                              <span style={{ opacity: .6, marginLeft: 3 }}>
                                ({log.actor_role.replace(/_/g, ' ')})
                              </span>
                            )}
                          </span>
                        )}
                        {log.company_name && (
                          <span className="al-meta-chip">🏢 {log.company_name}</span>
                        )}
                        {log.ip_address && log.ip_address !== 'unknown' && (
                          <span className="al-meta-chip">🌐 {log.ip_address}</span>
                        )}
                        {log.status_reason && (
                          <span className="al-meta-chip" style={{ color: '#991b1b' }}>
                            ⚠ {log.status_reason.replace(/_/g, ' ')}
                          </span>
                        )}
                        {(log.changes || log.user_agent) && (
                          <button
                            className="al-expand-btn"
                            onClick={() => setExpandedId(isExpanded ? null : log.id)}
                          >
                            {isExpanded ? 'Hide details ▲' : 'Show details ▼'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="al-time-col">
                      <span title={formatFullDate(log.created_at)}>{timeAgo(log.created_at)}</span>
                      <span className="al-time-full">{formatFullDate(log.created_at)}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="al-detail">
                      <div className="al-detail-grid">
                        {log.user_email && (
                          <div className="al-detail-item">
                            <div className="al-detail-label">User Email</div>
                            <div className="al-detail-value">{log.user_email}</div>
                          </div>
                        )}
                        {log.ip_address && (
                          <div className="al-detail-item">
                            <div className="al-detail-label">IP Address</div>
                            <div className="al-detail-value">{log.ip_address}</div>
                          </div>
                        )}
                        {log.resource_id && (
                          <div className="al-detail-item">
                            <div className="al-detail-label">Resource ID</div>
                            <div className="al-detail-value">#{log.resource_id}</div>
                          </div>
                        )}
                        {log.user_agent && (
                          <div className="al-detail-item" style={{ gridColumn: '1 / -1' }}>
                            <div className="al-detail-label">Browser / Client</div>
                            <div className="al-detail-value">{truncateUserAgent(log.user_agent)}</div>
                          </div>
                        )}
                      </div>
                      {log.changes && (
                        <div className="al-changes">
                          <div className="al-changes-label">Changes</div>
                          <pre className="al-changes-pre">
                            {JSON.stringify(log.changes, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {!loading && meta.totalPages > 1 && (
          <div className="al-pagination">
            <span className="al-page-info">
              Showing {((page - 1) * 30) + 1}–{Math.min(page * 30, meta.total)} of {meta.total?.toLocaleString()} events
            </span>
            <div className="al-page-btns">
              <button
                className="al-page-btn"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                // Show pages around the current page
                let p;
                if (meta.totalPages <= 5) {
                  p = i + 1;
                } else if (page <= 3) {
                  p = i + 1;
                } else if (page >= meta.totalPages - 2) {
                  p = meta.totalPages - 4 + i;
                } else {
                  p = page - 2 + i;
                }
                return (
                  <button
                    key={p}
                    className={`al-page-btn${page === p ? ' active' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                className="al-page-btn"
                disabled={page >= meta.totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </RoleGuard>
    </DashboardLayout>
  );
}

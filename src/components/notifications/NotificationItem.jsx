'use client';

import { timeAgo } from '@/lib/utils/timeAgo';

const TYPE_ICONS = {
  rfq_published:            '📋',
  bid_submitted:            '📨',
  bid_withdrawn:            '↩️',
  contract_awarded:         '🏆',
  contract_cancelled:       '❌',
  rfq_deadline_approaching: '⏰',
  default:                  '🔔',
};

/**
 * NotificationItem
 * Props:
 *   notification: { id, type, title, body, link, isRead, createdAt }
 *   onRead: (notification) => void   — called when item is clicked
 */
export default function NotificationItem({ notification, onRead }) {
  const icon = TYPE_ICONS[notification.type] ?? TYPE_ICONS.default;
  const isUnread = !notification.isRead;

  function handleClick() {
    onRead(notification);
  }

  return (
    <>
      <style>{`
        .notif-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 18px 14px 16px;
          cursor: pointer;
          border-bottom: 1px solid var(--border);
          background: var(--white);
          transition: background .15s;
          position: relative;
          text-decoration: none;
          color: inherit;
        }
        .notif-item.unread {
          background: var(--surface);
        }
        .notif-item.unread::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: var(--accent);
          border-radius: 0 2px 2px 0;
        }
        .notif-item:hover {
          background: #f3f0ec;
        }
        .notif-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
          margin-top: 1px;
          width: 28px;
          text-align: center;
        }
        .notif-content {
          flex: 1;
          min-width: 0;
        }
        .notif-title {
          font-family: 'DM Sans', sans-serif;
          font-size: .88rem;
          font-weight: ${isUnread ? 500 : 400};
          color: var(--ink);
          margin: 0 0 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .notif-body {
          font-family: 'DM Sans', sans-serif;
          font-size: .8rem;
          color: var(--ink-soft);
          margin: 0 0 5px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .notif-time {
          font-size: .72rem;
          font-weight: 500;
          letter-spacing: .04em;
          color: var(--ink-faint);
          text-transform: uppercase;
        }
        .notif-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--accent);
          flex-shrink: 0;
          margin-top: 6px;
        }
      `}</style>

      <div
        className={`notif-item${isUnread ? ' unread' : ''}`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && handleClick()}
      >
        <span className="notif-icon">{icon}</span>
        <div className="notif-content">
          <p className="notif-title">{notification.title}</p>
          {notification.body && <p className="notif-body">{notification.body}</p>}
          <span className="notif-time">{timeAgo(notification.createdAt)}</span>
        </div>
        {isUnread && <div className="notif-dot" aria-label="Unread" />}
      </div>
    </>
  );
}
'use client';
// src/components/ui/Modal.jsx

import { useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ open, onClose, title, children, width = 480 }) {
  // Prevent SSR/client hydration mismatch for portals:
  // server snapshot is always false, client snapshot is always true.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  // Render into document.body so position:fixed is always relative to the
  // viewport, regardless of any CSS transform on ancestor elements.
  return createPortal(
    <>
      <style>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15,14,13,.45);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: backdropIn .15s ease;
        }
        @keyframes backdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .modal-box {
          background: var(--white);
          border-radius: 14px;
          box-shadow: 0 8px 40px rgba(15,14,13,.18);
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          animation: modalIn .18s cubic-bezier(.34,1.56,.64,1);
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .modal-header {
          display: flex;
          align-items: center;
          padding: 20px 24px 18px;
          border-bottom: 1px solid var(--border);
        }
        .modal-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          color: var(--ink);
          letter-spacing: -.02em;
          flex: 1;
        }
        .modal-close {
          background: none;
          border: 1px solid var(--border);
          border-radius: 6px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--ink-soft);
          transition: background .12s, color .12s;
          flex-shrink: 0;
        }
        .modal-close:hover { background: var(--surface); color: var(--ink); }
        .modal-body { padding: 24px; }
        @media (max-width: 560px) {
          .modal-backdrop { padding: 12px; align-items: flex-end; }
          .modal-box {
            border-radius: 16px 16px 12px 12px;
            max-height: 85vh;
            animation: modalInMobile .2s ease;
          }
          @keyframes modalInMobile {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .modal-header { padding: 16px 20px 14px; }
          .modal-body { padding: 20px; }
        }
      `}</style>

      <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal-box" style={{ maxWidth: width }}>
          <div className="modal-header">
            <span className="modal-title">{title}</span>
            <button className="modal-close" onClick={onClose}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    </>,
    document.body
  );
}

'use client';
// src/components/ui/Modal.jsx

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ open, onClose, title, children, width = 480 }) {
  // Use ref instead of state to track mount — avoids cascading setState-in-effect warning
  const mountRef = useRef(false);
  useEffect(() => { mountRef.current = true; }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <>
      <style>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15,14,13,.5);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: mBackdropIn .15s ease;
        }
        @keyframes mBackdropIn { from { opacity:0 } to { opacity:1 } }
        .modal-box {
          background: var(--white);
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(15,14,13,.22);
          width: 100%;
          max-height: 88vh;
          overflow-y: auto;
          animation: mBoxIn .2s cubic-bezier(.34,1.4,.64,1);
          display: flex;
          flex-direction: column;
        }
        @keyframes mBoxIn {
          from { opacity:0; transform:scale(.96) translateY(10px) }
          to   { opacity:1; transform:scale(1) translateY(0) }
        }
        .modal-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .modal-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1.05rem;
          color: var(--ink);
          letter-spacing: -.025em;
          flex: 1;
        }
        .modal-close {
          width: 30px;
          height: 30px;
          border-radius: 7px;
          border: 1px solid var(--border);
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--ink-soft);
          transition: background .12s, color .12s;
          flex-shrink: 0;
        }
        .modal-close:hover { background: var(--surface); color: var(--ink); }
        .modal-body { padding: 24px; flex: 1; }

        @media (max-width: 540px) {
          .modal-backdrop { padding: 0; align-items: flex-end; }
          .modal-box {
            border-radius: 18px 18px 0 0;
            max-height: 88vh;
            animation: mBoxInMobile .22s ease;
          }
          @keyframes mBoxInMobile {
            from { opacity:0; transform:translateY(30px) }
            to   { opacity:1; transform:translateY(0) }
          }
          .modal-header { padding: 18px 20px; }
          .modal-body { padding: 20px; }
        }
      `}</style>

      <div
        className="modal-backdrop"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title-id"
      >
        <div className="modal-box" style={{ maxWidth: width }}>
          <div className="modal-header">
            <span className="modal-title" id="modal-title-id">{title}</span>
            <button className="modal-close" onClick={onClose} aria-label="Close dialog">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M1.5 1.5l8 8M9.5 1.5l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
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
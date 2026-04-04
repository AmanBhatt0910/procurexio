'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <style>{`
        .nav-root {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          transition: background .2s, box-shadow .2s, border-color .2s;
          border-bottom: 1px solid transparent;
        }
        .nav-root.scrolled {
          background: rgba(250,249,247,.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-color: var(--border);
          box-shadow: 0 1px 0 rgba(15,14,13,.04);
        }
        .nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 32px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          flex-shrink: 0;
        }
        .nav-logo-mark {
          width: 32px; height: 32px;
          background: var(--ink);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .nav-logo-mark svg { color: #fff; }
        .nav-logo-name {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1.05rem;
          color: var(--ink);
          letter-spacing: -.01em;
        }
        .nav-logo-name span { color: var(--accent); }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .nav-link {
          padding: 6px 12px;
          font-size: .875rem;
          font-weight: 500;
          color: var(--ink-soft);
          text-decoration: none;
          border-radius: 7px;
          transition: color .15s, background .15s;
        }
        .nav-link:hover {
          color: var(--ink);
          background: rgba(15,14,13,.05);
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .nav-btn-ghost {
          padding: 7px 16px;
          font-size: .875rem;
          font-weight: 500;
          color: var(--ink);
          text-decoration: none;
          border-radius: 8px;
          border: 1.5px solid var(--border);
          transition: border-color .15s, background .15s;
        }
        .nav-btn-ghost:hover {
          border-color: var(--ink-soft);
          background: rgba(15,14,13,.03);
        }
        .nav-btn-primary {
          padding: 7px 16px;
          font-size: .875rem;
          font-weight: 600;
          color: #fff;
          text-decoration: none;
          border-radius: 8px;
          background: var(--ink);
          transition: background .15s, transform .1s;
        }
        .nav-btn-primary:hover {
          background: #222;
          transform: translateY(-1px);
        }

        .nav-mobile-toggle {
          display: none;
          background: none;
          border: 1.5px solid var(--border);
          border-radius: 8px;
          width: 36px; height: 36px;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--ink);
        }

        /* Mobile */
        .nav-mobile-menu {
          display: none;
          flex-direction: column;
          gap: 2px;
          padding: 12px 20px 20px;
          border-top: 1px solid var(--border);
          background: rgba(250,249,247,.97);
          backdrop-filter: blur(12px);
        }
        .nav-mobile-menu.open { display: flex; }
        .nav-mobile-link {
          padding: 10px 12px;
          font-size: .93rem;
          font-weight: 500;
          color: var(--ink-soft);
          text-decoration: none;
          border-radius: 8px;
          transition: color .15s, background .15s;
        }
        .nav-mobile-link:hover {
          color: var(--ink);
          background: rgba(15,14,13,.05);
        }
        .nav-mobile-divider {
          height: 1px;
          background: var(--border);
          margin: 8px 0;
        }
        .nav-mobile-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 4px;
        }
        .nav-mobile-btn {
          padding: 11px 16px;
          font-size: .93rem;
          font-weight: 500;
          text-decoration: none;
          border-radius: 8px;
          text-align: center;
        }
        .nav-mobile-btn-ghost {
          color: var(--ink);
          border: 1.5px solid var(--border);
        }
        .nav-mobile-btn-primary {
          color: #fff;
          background: var(--ink);
        }

        @media (max-width: 860px) {
          .nav-links { display: none; }
          .nav-actions { display: none; }
          .nav-mobile-toggle { display: flex; }
          .nav-inner { padding: 0 20px; }
        }
      `}</style>

      <header className={`nav-root${scrolled ? ' scrolled' : ''}`}>
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <div className="nav-logo-mark">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="nav-logo-name">Procure<span>xio</span></span>
          </Link>

          <nav className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How it Works</a>
            <a href="#pricing" className="nav-link">Pricing</a>
          </nav>

          <div className="nav-actions">
            <Link href="/login" className="nav-btn-ghost">Sign in</Link>
            <Link href="/register" className="nav-btn-primary">Get Started</Link>
          </div>

          <button
            className="nav-mobile-toggle"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </button>
        </div>

        <div className={`nav-mobile-menu${menuOpen ? ' open' : ''}`}>
          <a href="#features" className="nav-mobile-link" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#how-it-works" className="nav-mobile-link" onClick={() => setMenuOpen(false)}>How it Works</a>
          <a href="#pricing" className="nav-mobile-link" onClick={() => setMenuOpen(false)}>Pricing</a>
          <div className="nav-mobile-divider" />
          <div className="nav-mobile-actions">
            <Link href="/login" className="nav-mobile-btn nav-mobile-btn-ghost">Sign in</Link>
            <Link href="/register" className="nav-mobile-btn nav-mobile-btn-primary">Get Started Free</Link>
          </div>
        </div>
      </header>
    </>
  );
}
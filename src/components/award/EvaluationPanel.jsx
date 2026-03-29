// src/components/award/EvaluationPanel.jsx
'use client';
import { useState } from 'react';

export default function EvaluationPanel({ bid, evaluation, onSave, readOnly = false }) {
  const [score, setScore] = useState(evaluation?.score ?? '');
  const [notes, setNotes] = useState(evaluation?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await onSave({ score: score === '' ? null : Number(score), notes });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const scoreNum = score === '' ? null : Number(score);
  const scoreColor = scoreNum === null ? 'var(--ink-faint)'
    : scoreNum >= 80 ? '#059669'
    : scoreNum >= 50 ? '#d97706'
    : '#dc2626';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&display=swap');
        .eval-panel {
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 16px;
          background: var(--white);
          font-family: 'DM Sans', sans-serif;
        }
        .eval-score-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .eval-score-input {
          width: 70px;
          padding: 6px 10px;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: .95rem;
          font-weight: 600;
          color: var(--ink);
          text-align: center;
          background: var(--surface);
        }
        .eval-score-input:focus {
          outline: none;
          border-color: var(--accent);
          background: var(--white);
        }
        .eval-score-display {
          font-size: 1.4rem;
          font-weight: 700;
          font-family: 'Syne', sans-serif;
          transition: color .2s;
        }
        .eval-slider {
          flex: 1;
          -webkit-appearance: none;
          height: 4px;
          border-radius: 4px;
          background: linear-gradient(
            to right,
            var(--accent) 0%,
            var(--accent) ${scoreNum ?? 0}%,
            var(--border) ${scoreNum ?? 0}%,
            var(--border) 100%
          );
          outline: none;
        }
        .eval-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,.2);
        }
        .eval-slider:disabled { opacity: .4; pointer-events: none; }
        .eval-notes {
          width: 100%;
          min-height: 72px;
          padding: 8px 10px;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: .85rem;
          color: var(--ink);
          background: var(--surface);
          resize: vertical;
          margin-bottom: 12px;
          box-sizing: border-box;
        }
        .eval-notes:focus {
          outline: none;
          border-color: var(--accent);
          background: var(--white);
        }
        .eval-notes:disabled { opacity: .5; }
        .eval-save-btn {
          padding: 7px 18px;
          background: var(--accent);
          color: white;
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: .82rem;
          font-weight: 500;
          cursor: pointer;
          transition: background .15s, transform .1s;
        }
        .eval-save-btn:hover:not(:disabled) { background: var(--accent-h); transform: translateY(-1px); }
        .eval-save-btn:disabled { opacity: .6; cursor: not-allowed; }
        .eval-avg {
          font-size: .78rem;
          color: var(--ink-soft);
          margin-top: 10px;
        }
        .eval-avg strong { color: var(--ink); }
      `}</style>

      <div className="eval-panel">
        <div style={{ fontSize: '.72rem', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 12 }}>
          Your Evaluation
        </div>

        <div className="eval-score-row">
          <span className="eval-score-display" style={{ color: scoreColor }}>
            {scoreNum ?? '–'}
          </span>
          <input
            type="range"
            min={1}
            max={100}
            value={scoreNum ?? 50}
            onChange={e => setScore(e.target.value)}
            disabled={readOnly}
            className="eval-slider"
          />
          <input
            type="number"
            min={1}
            max={100}
            value={score}
            onChange={e => setScore(e.target.value)}
            placeholder="—"
            disabled={readOnly}
            className="eval-score-input"
          />
        </div>

        <textarea
          className="eval-notes"
          placeholder="Add evaluation notes (optional)…"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          disabled={readOnly}
        />

        {!readOnly && (
          <button
            className="eval-save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Evaluation'}
          </button>
        )}

        {bid.avgScore !== null && (
          <div className="eval-avg">
            Team average: <strong>{bid.avgScore}/100</strong>
            {bid.evaluations?.length > 0 && ` (${bid.evaluations.length} evaluator${bid.evaluations.length > 1 ? 's' : ''})`}
          </div>
        )}
      </div>
    </>
  );
}
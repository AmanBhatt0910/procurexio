// src/app/dashboard/rfqs/new/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import { useAuth } from '@/hooks/useAuth';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AED', 'SGD', 'CAD', 'AUD'];

/* ─── Inline icon components ─────────────────────────────────────────── */
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 3.5h10M5.5 3.5V2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1M6 6v4M8 6v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M3 3.5l.7 7.2a.5.5 0 0 0 .5.3h5.6a.5.5 0 0 0 .5-.3L11 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M6.5 2v9M2 6.5h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function DragIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="4" cy="3" r="1" fill="currentColor"/>
      <circle cx="8" cy="3" r="1" fill="currentColor"/>
      <circle cx="4" cy="6" r="1" fill="currentColor"/>
      <circle cx="8" cy="6" r="1" fill="currentColor"/>
      <circle cx="4" cy="9" r="1" fill="currentColor"/>
      <circle cx="8" cy="9" r="1" fill="currentColor"/>
    </svg>
  );
}

/* ─── Field component ─────────────────────────────────────────────────── */
function Field({ label, required, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: '.785rem', fontWeight: 600, color: 'var(--ink)',
        fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 5,
      }}>
        {label}
        {required && <span style={{ color: 'var(--accent)', fontWeight: 700 }}>*</span>}
        {hint && <span style={{ fontWeight: 400, color: 'var(--ink-faint)', fontSize: '.75rem' }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

/* ─── Line items editor ───────────────────────────────────────────────── */
function LineItemsEditor({ items, onChange, currency }) {
  const addRow = () =>
    onChange([...items, { _key: Date.now(), description: '', quantity: 1, unit: '', target_price: '' }]);

  const updateRow = (idx, field, value) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };

  const removeRow = (idx) => onChange(items.filter((_, i) => i !== idx));

  const rowTotal = (item) => {
    const qty   = parseFloat(item.quantity)    || 0;
    const price = parseFloat(item.target_price) || 0;
    return qty * price;
  };

  return (
    <div>
      {items.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '32px 16px',
          border: '1.5px dashed var(--border)', borderRadius: 10,
          marginBottom: 12,
        }}>
          <div style={{ fontSize: '.835rem', color: 'var(--ink-faint)', fontFamily: "'DM Sans', sans-serif" }}>
            No line items yet
          </div>
          <div style={{ fontSize: '.78rem', color: 'var(--ink-faint)', marginTop: 3, fontFamily: "'DM Sans', sans-serif" }}>
            Add items to auto-calculate the budget
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', marginBottom: 2 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.835rem', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 32 }} />
              <col />
              <col style={{ width: 88 }} />
              <col style={{ width: 96 }} />
              <col style={{ width: 128 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 44 }} />
            </colgroup>
            <thead>
              <tr>
                <th style={thStyle}></th>
                <th style={thStyle}>Description</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Qty</th>
                <th style={thStyle}>Unit</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Unit Price</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const total = rowTotal(item);
                return (
                  <tr key={item._key ?? idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ ...tdStyle, color: 'var(--ink-faint)', verticalAlign: 'middle', paddingRight: 4 }}>
                      <span style={{ cursor: 'grab', display: 'flex', alignItems: 'center', opacity: .5 }}>
                        <DragIcon />
                      </span>
                    </td>
                    <td style={{ ...tdStyle, paddingRight: 8 }}>
                      <input
                        value={item.description}
                        onChange={e => updateRow(idx, 'description', e.target.value)}
                        placeholder="Item description"
                        style={inlineInputStyle}
                        className="rfq-inline-input"
                      />
                    </td>
                    <td style={{ ...tdStyle, paddingRight: 8 }}>
                      <input
                        type="number" min="0"
                        value={item.quantity}
                        onChange={e => updateRow(idx, 'quantity', e.target.value)}
                        style={{ ...inlineInputStyle, textAlign: 'right' }}
                        className="rfq-inline-input"
                      />
                    </td>
                    <td style={{ ...tdStyle, paddingRight: 8 }}>
                      <input
                        value={item.unit}
                        onChange={e => updateRow(idx, 'unit', e.target.value)}
                        placeholder="pcs"
                        style={inlineInputStyle}
                        className="rfq-inline-input"
                      />
                    </td>
                    <td style={{ ...tdStyle, paddingRight: 8 }}>
                      <input
                        type="number" min="0" step="0.01"
                        value={item.target_price}
                        onChange={e => updateRow(idx, 'target_price', e.target.value)}
                        placeholder="0.00"
                        style={{ ...inlineInputStyle, textAlign: 'right' }}
                        className="rfq-inline-input"
                      />
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: total > 0 ? 'var(--ink)' : 'var(--ink-faint)', fontWeight: total > 0 ? 500 : 400, fontSize: '.82rem', paddingRight: 8 }}>
                      {total > 0
                        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format(total)
                        : '—'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button
                        onClick={() => removeRow(idx)}
                        aria-label="Remove item"
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--ink-faint)', padding: '4px',
                          borderRadius: 5, display: 'flex', alignItems: 'center',
                          transition: 'color .12s, background .12s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = '#fdecea'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-faint)'; e.currentTarget.style.background = 'none'; }}
                      >
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <button
        onClick={addRow}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          width: '100%', padding: '9px 14px',
          background: 'transparent',
          border: '1.5px dashed var(--border)',
          borderRadius: 9, cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '.82rem', color: 'var(--ink-soft)',
          transition: 'all .14s',
          marginTop: items.length > 0 ? 10 : 0,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--ink-soft)';
          e.currentTarget.style.color = 'var(--ink)';
          e.currentTarget.style.background = 'var(--surface)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.color = 'var(--ink-soft)';
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <PlusIcon />
        Add line item
      </button>
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────────────── */
export default function NewRFQPage() {
  const { user } = useAuth();
  const router   = useRouter();

  const [form, setForm] = useState({
    title:       '',
    description: '',
    deadline:    '',
    currency:    'USD',
  });
  const [items, setItems]           = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  // Compute budget from items during render
  const calculatedBudget = items.reduce((sum, item) => {
    const qty   = parseFloat(item.quantity)    || 0;
    const price = parseFloat(item.target_price) || 0;
    return sum + qty * price;
  }, 0);

  const budgetAutoFilled = calculatedBudget > 0;
  const displayBudget    = calculatedBudget > 0 ? calculatedBudget.toFixed(2) : '';

  const formattedBudget  = budgetAutoFilled
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: form.currency || 'USD', maximumFractionDigits: 0 }).format(calculatedBudget)
    : null;

  // Auto-fill currency from company settings
  useEffect(() => {
    fetch('/api/company/settings')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.data?.currency) setForm(f => ({ ...f, currency: d.data.currency })); })
      .catch(() => {});
  }, []);

  // Role guard
  if (user && !['company_admin', 'manager'].includes(user.role)) {
    return (
      <DashboardLayout>
        <p style={{ color: 'var(--ink-soft)', padding: 32, fontFamily: "'DM Sans', sans-serif" }}>
          You do not have permission to create RFQs.
        </p>
      </DashboardLayout>
    );
  }

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    if (!form.title.trim()) { setError('Please enter a title for the RFQ.'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/rfqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          budget:   displayBudget || null,
          deadline: form.deadline || null,
          items:    items.filter(i => i.description.trim()),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Failed to create RFQ'); setSubmitting(false); return; }
      router.push(`/dashboard/rfqs/${json.data.rfq.id}`);
    } catch { setError('Network error — please try again.'); setSubmitting(false); }
  };

  const validItemCount = items.filter(i => i.description.trim()).length;

  return (
    <DashboardLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');

        .new-rfq-page {
          animation: rfqFadeUp .3s ease both;
          max-width: 820px;
          margin: 0 auto;
          padding: 32px 24px;
        }
        @keyframes rfqFadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }

        .rfq-form-input {
          width: 100%;
          padding: 10px 13px;
          border: 1.5px solid var(--border);
          border-radius: 9px;
          font-family: 'DM Sans', sans-serif;
          font-size: .875rem;
          color: var(--ink);
          background: var(--white);
          outline: none;
          box-sizing: border-box;
          transition: border-color .15s, box-shadow .15s;
          -webkit-appearance: none;
        }
        .rfq-form-input::placeholder { color: var(--ink-faint); }
        .rfq-form-input:focus {
          border-color: var(--ink);
          box-shadow: 0 0 0 3px rgba(15,14,13,.07);
        }
        .rfq-form-input:disabled {
          background: var(--surface);
          color: var(--ink-soft);
          cursor: not-allowed;
          border-style: dashed;
        }
        textarea.rfq-form-input { resize: vertical; min-height: 96px; line-height: 1.55; }

        .rfq-section-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 24px;
          margin-bottom: 14px;
        }
        .rfq-section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border);
        }
        .rfq-section-num {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--ink);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: .72rem;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          flex-shrink: 0;
        }
        .rfq-section-title {
          font-family: 'Syne', sans-serif;
          font-size: .98rem;
          font-weight: 700;
          color: var(--ink);
          letter-spacing: -.02em;
        }
        .rfq-section-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: .785rem;
          color: var(--ink-faint);
          margin-top: 1px;
        }

        .rfq-budget-display {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 13px;
          border: 1.5px dashed var(--border);
          border-radius: 9px;
          background: var(--surface);
          min-height: 44px;
          box-sizing: border-box;
        }
        .rfq-budget-value {
          font-family: 'DM Sans', sans-serif;
          font-size: .92rem;
          font-weight: 600;
          color: var(--ink);
          letter-spacing: -.02em;
        }
        .rfq-budget-auto-badge {
          font-size: .7rem;
          font-weight: 600;
          color: #2d7a3a;
          background: #EAF3DE;
          border-radius: 5px;
          padding: '2px 7px';
          font-family: 'DM Sans', sans-serif;
          margin-left: 2px;
        }

        .rfq-error-banner {
          display: flex;
          align-items: center;
          gap: 9px;
          background: #FCEBEB;
          color: #A32D2D;
          padding: 11px 14px;
          border-radius: 10px;
          font-size: .845rem;
          font-family: 'DM Sans', sans-serif;
          margin-bottom: 16px;
          border: 1px solid #F7C1C1;
        }

        .rfq-inline-input {
          transition: border-color .12s, box-shadow .12s;
        }
        .rfq-inline-input:focus {
          border-color: var(--ink) !important;
          box-shadow: 0 0 0 2px rgba(15,14,13,.07);
          outline: none;
        }

        .rfq-submit-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 11px 24px;
          background: var(--accent);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: .875rem;
          font-weight: 600;
          cursor: pointer;
          transition: background .15s, transform .12s, opacity .15s;
          letter-spacing: -.01em;
        }
        .rfq-submit-btn:hover:not(:disabled) {
          background: var(--accent-h);
          transform: translateY(-1px);
        }
        .rfq-submit-btn:disabled { opacity: .5; cursor: not-allowed; transform: none; }

        .rfq-cancel-btn {
          display: inline-flex;
          align-items: center;
          padding: 11px 20px;
          background: transparent;
          color: var(--ink-soft);
          border: 1.5px solid var(--border);
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: .875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all .14s;
        }
        .rfq-cancel-btn:hover {
          background: var(--surface);
          border-color: var(--ink-soft);
          color: var(--ink);
        }

        .rfq-summary-strip {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 12px 20px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }
        .rfq-summary-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'DM Sans', sans-serif;
          font-size: .8rem;
          color: var(--ink-soft);
        }
        .rfq-summary-val {
          font-weight: 600;
          color: var(--ink);
        }
      `}</style>

      <div className="new-rfq-page">
        <PageHeader
          title="New RFQ"
          subtitle="Create a request for quotation to send to vendors"
        />

        {error && (
          <div className="rfq-error-banner" role="alert">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M8 5v3.5M8 11v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        {/* Summary strip — only show if something is filled in */}
        {(form.title || items.length > 0 || form.deadline) && (
          <div className="rfq-summary-strip">
            {form.title && (
              <div className="rfq-summary-item">
                <span>Title:</span>
                <span className="rfq-summary-val" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {form.title}
                </span>
              </div>
            )}
            {validItemCount > 0 && (
              <div className="rfq-summary-item">
                <span>Items:</span>
                <span className="rfq-summary-val">{validItemCount}</span>
              </div>
            )}
            {formattedBudget && (
              <div className="rfq-summary-item">
                <span>Budget:</span>
                <span className="rfq-summary-val">{formattedBudget}</span>
              </div>
            )}
            {form.deadline && (
              <div className="rfq-summary-item">
                <span>Deadline:</span>
                <span className="rfq-summary-val">
                  {new Date(form.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Section 1: Details ───────────────────────────────────── */}
        <div className="rfq-section-card">
          <div className="rfq-section-header">
            <div className="rfq-section-num">1</div>
            <div>
              <div className="rfq-section-title">RFQ Details</div>
              <div className="rfq-section-desc">Basic information about this request</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Title" required>
              <input
                className="rfq-form-input"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Office Furniture Procurement Q3 2026"
                autoFocus
              />
            </Field>

            <Field label="Description" hint="— optional">
              <textarea
                className="rfq-form-input"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Provide context, requirements, or scope details for vendors…"
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 14, alignItems: 'end' }}>
              <Field label="Deadline" hint="— optional">
                <input
                  type="date"
                  className="rfq-form-input"
                  value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                />
              </Field>

              <Field
                label="Budget"
                hint={budgetAutoFilled ? '— auto-calculated' : '— calculated from items'}
              >
                <div className="rfq-budget-display">
                  {formattedBudget
                    ? <span className="rfq-budget-value">{formattedBudget}</span>
                    : <span style={{ fontSize: '.835rem', color: 'var(--ink-faint)', fontFamily: "'DM Sans', sans-serif" }}>
                        Add items below to calculate
                      </span>
                  }
                </div>
              </Field>

              <Field label="Currency">
                <select
                  className="rfq-form-input"
                  value={form.currency}
                  onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                  style={{ cursor: 'pointer', width: 96 }}
                >
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>
          </div>
        </div>

        {/* ── Section 2: Line Items ────────────────────────────────── */}
        <div className="rfq-section-card">
          <div className="rfq-section-header">
            <div className="rfq-section-num">2</div>
            <div>
              <div className="rfq-section-title">Line Items</div>
              <div className="rfq-section-desc">Specify what you need — budget auto-calculates</div>
            </div>
            {items.length > 0 && (
              <div style={{ marginLeft: 'auto', fontFamily: "'DM Sans', sans-serif", fontSize: '.78rem', color: 'var(--ink-faint)' }}>
                {items.length} item{items.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          <LineItemsEditor items={items} onChange={setItems} currency={form.currency} />
        </div>

        {/* ── Actions ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center', paddingTop: 4 }}>
          <button className="rfq-cancel-btn" onClick={() => router.push('/dashboard/rfqs')}>
            Cancel
          </button>
          <button
            className="rfq-submit-btn"
            onClick={handleSubmit}
            disabled={submitting || !form.title.trim()}
          >
            {submitting ? (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"
                  style={{ animation: 'rfqSpin .65s linear infinite' }}>
                  <circle cx="7" cy="7" r="5.5" stroke="rgba(255,255,255,.3)" strokeWidth="1.5"/>
                  <path d="M7 1.5a5.5 5.5 0 0 1 5.5 5.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Creating…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Create RFQ
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`@keyframes rfqSpin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  );
}

/* ─── Table styles ────────────────────────────────────────────────────── */
const thStyle = {
  padding: '0 8px 10px 0',
  textAlign: 'left',
  fontSize: '.71rem',
  fontWeight: 600,
  letterSpacing: '.07em',
  textTransform: 'uppercase',
  color: 'var(--ink-faint)',
  borderBottom: '1px solid var(--border)',
  fontFamily: "'DM Sans', sans-serif",
};

const tdStyle = {
  padding: '9px 0',
  verticalAlign: 'middle',
};

const inlineInputStyle = {
  width: '100%',
  padding: '7px 9px',
  border: '1.5px solid var(--border)',
  borderRadius: '7px',
  fontSize: '.835rem',
  fontFamily: "'DM Sans', sans-serif",
  color: 'var(--ink)',
  background: 'var(--white)',
  outline: 'none',
  boxSizing: 'border-box',
};
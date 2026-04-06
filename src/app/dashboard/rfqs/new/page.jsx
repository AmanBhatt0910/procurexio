// src/app/dashboard/rfqs/new/page.jsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import { useAuth } from '@/hooks/useAuth';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AED', 'SGD', 'CAD', 'AUD'];

function LineItemsEditor({ items, onChange }) {
  const addRow = () =>
    onChange([...items, { _key: Date.now(), description: '', quantity: 1, unit: '', target_price: '' }]);

  const updateRow = (idx, field, value) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };

  const removeRow = (idx) => onChange(items.filter((_, i) => i !== idx));

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.84rem' }}>
          <thead>
            <tr>
              <th style={th}>#</th>
              <th style={th}>Description *</th>
              <th style={{ ...th, width: 90 }}>Qty</th>
              <th style={{ ...th, width: 100 }}>Unit</th>
              <th style={{ ...th, width: 130 }}>Target Price</th>
              <th style={{ ...th, width: 48 }} />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: 'var(--ink-faint)',
                  fontStyle: 'italic', padding: '20px 0' }}>
                  No items yet — click Add below
                </td>
              </tr>
            )}
            {items.map((item, idx) => (
              <tr key={item._key ?? idx}>
                <td style={{ ...tdStyle, color: 'var(--ink-faint)', textAlign: 'center', width: 36 }}>
                  {idx + 1}
                </td>
                <td style={tdStyle}>
                  <input
                    value={item.description}
                    onChange={e => updateRow(idx, 'description', e.target.value)}
                    placeholder="Item description"
                    style={inlineInput}
                  />
                </td>
                <td style={tdStyle}>
                  <input
                    type="number" min="0"
                    value={item.quantity}
                    onChange={e => updateRow(idx, 'quantity', e.target.value)}
                    style={{ ...inlineInput, textAlign: 'right' }}
                  />
                </td>
                <td style={tdStyle}>
                  <input
                    value={item.unit}
                    onChange={e => updateRow(idx, 'unit', e.target.value)}
                    placeholder="pcs"
                    style={inlineInput}
                  />
                </td>
                <td style={tdStyle}>
                  <input
                    type="number" min="0"
                    value={item.target_price}
                    onChange={e => updateRow(idx, 'target_price', e.target.value)}
                    placeholder="0.00"
                    style={{ ...inlineInput, textAlign: 'right' }}
                  />
                </td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  <button onClick={() => removeRow(idx)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--ink-faint)', fontSize: '1.1rem', lineHeight: 1, padding: '2px 4px' }}>
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addRow} style={addRowBtn}>+ Add line item</button>
    </div>
  );
}

export default function NewRFQPage() {
  const { user } = useAuth();
  const router   = useRouter();

  const [form, setForm] = useState({
    title:       '',
    description: '',
    deadline:    '',
    budget:      '',
    currency:    'USD',
  });
  const [items, setItems]   = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]   = useState('');

  // Auto-fill currency from company settings
  useEffect(() => {
    fetch('/api/company/settings')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.data?.currency) {
          setForm(f => ({ ...f, currency: d.data.currency }));
        }
      })
      .catch(() => {});
  }, []);

  // Role guard
  if (user && !['company_admin', 'manager'].includes(user.role)) {
    return (
      <DashboardLayout>
        <p style={{ color: 'var(--ink-soft)', padding: 32 }}>You do not have permission to create RFQs.</p>
      </DashboardLayout>
    );
  }

  const handleSubmit = async () => {
    setError('');
    if (!form.title.trim()) { setError('Title is required'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/rfqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          budget:   form.budget   || null,
          deadline: form.deadline || null,
          items:    items.filter(i => i.description.trim()),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Failed to create RFQ'); setSubmitting(false); return; }
      router.push(`/dashboard/rfqs/${json.data.rfq.id}`);
    } catch { setError('Network error'); setSubmitting(false); }
  };

  return (
    <DashboardLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@300;400;500&display=swap');
        .new-rfq-page { animation: fadeUp .35s ease both; max-width: 860px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }
        .field-label { display:block; font-size:.79rem; font-weight:500; color:var(--ink);
          margin-bottom:6px; font-family:'DM Sans',sans-serif; }
        .form-input { width:100%; padding:10px 12px; border:1px solid var(--border);
          border-radius:var(--radius); font-family:'DM Sans',sans-serif; font-size:.88rem;
          color:var(--ink); background:var(--white); outline:none; box-sizing:border-box;
          transition:border-color .15s; }
        .form-input:focus { border-color:var(--ink-soft); }
        textarea.form-input { resize:vertical; min-height:80px; }
        .section-card { background:var(--white); border:1px solid var(--border);
          border-radius:var(--radius); padding:24px; margin-bottom:16px; }
        .section-label { font-size:.72rem; font-weight:600; letter-spacing:.08em;
          text-transform:uppercase; color:var(--ink-faint); margin-bottom:14px; display:block; }
        .submit-btn { padding:10px 28px; background:var(--ink); color:var(--white); border:none;
          border-radius:var(--radius); font-family:'DM Sans',sans-serif; font-size:.88rem;
          font-weight:600; cursor:pointer; transition:opacity .15s; }
        .submit-btn:hover:not(:disabled) { opacity:.85; }
        .submit-btn:disabled { opacity:.5; cursor:not-allowed; }
        .cancel-btn { padding:10px 20px; background:transparent; color:var(--ink-soft);
          border:1px solid var(--border); border-radius:var(--radius);
          font-family:'DM Sans',sans-serif; font-size:.88rem; cursor:pointer; }
        .cancel-btn:hover { background:var(--surface); }
      `}</style>

      <div className="new-rfq-page">
        <PageHeader title="New RFQ" subtitle="Create a request for quotation" />

        {error && (
          <div style={{ background: '#fdecea', color: '#c0392b', padding: '10px 14px',
            borderRadius: 'var(--radius)', fontSize: '.84rem', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Basic Details */}
        <div className="section-card">
          <span className="section-label">RFQ Details</span>

          <div style={{ marginBottom: 16 }}>
            <label className="field-label">Title *</label>
            <input
              className="form-input"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Office Furniture Procurement Q3 2025"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="field-label">Description</label>
            <textarea
              className="form-input"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Provide context, requirements, or scope details…"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 16 }}>
            <div>
              <label className="field-label">Deadline</label>
              <input
                type="date"
                className="form-input"
                value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
              />
            </div>
            <div>
              <label className="field-label">Budget</label>
              <input
                type="number"
                className="form-input"
                value={form.budget}
                onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                placeholder="0.00"
                min="0"
              />
            </div>
            <div>
              <label className="field-label">Currency</label>
              <select
                className="form-input"
                value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                style={{ cursor: 'pointer' }}
              >
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="section-card">
          <span className="section-label">Line Items</span>
          <LineItemsEditor items={items} onChange={setItems} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="cancel-btn" onClick={() => router.push('/dashboard/rfqs')}>
            Cancel
          </button>
          <button className="submit-btn" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create RFQ'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

const th = {
  padding: '8px 10px',
  textAlign: 'left',
  fontSize: '.72rem',
  fontWeight: 600,
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  color: 'var(--ink-faint)',
  borderBottom: '1px solid var(--border)',
};

const tdStyle = {
  padding: '8px 10px',
  borderBottom: '1px solid var(--border)',
  verticalAlign: 'middle',
};

const inlineInput = {
  width: '100%',
  padding: '6px 8px',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  fontSize: '.84rem',
  fontFamily: 'inherit',
  color: 'var(--ink)',
  background: 'var(--white)',
  outline: 'none',
  boxSizing: 'border-box',
};

const addRowBtn = {
  marginTop: 10,
  background: 'none',
  border: '1px dashed var(--border)',
  borderRadius: 'var(--radius)',
  padding: '7px 14px',
  fontSize: '.82rem',
  color: 'var(--ink-soft)',
  cursor: 'pointer',
  width: '100%',
  fontFamily: 'DM Sans, sans-serif',
};
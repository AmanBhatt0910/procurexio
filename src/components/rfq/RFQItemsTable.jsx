// src/components/rfq/RFQItemsTable.jsx
'use client';
import { useState } from 'react';

// ── Helpers ────────────────────────────────────────────────────────────────
function formatCurrency(value, currency = 'USD') {
  if (!value && value !== 0) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
}

// ── Editable row (for persisted items) ────────────────────────────────────
function ItemRow({ item, currency, canWrite, onSave, onDelete }) {
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [draft, setDraft]       = useState({ ...item });

  if (!editing) {
    return (
      <tr>
        <td style={td}>{item.description}</td>
        <td style={{ ...td, textAlign: 'right' }}>{item.quantity}</td>
        <td style={td}>{item.unit || '—'}</td>
        <td style={{ ...td, textAlign: 'right' }}>
          {formatCurrency(item.target_price, currency)}
        </td>
        {canWrite && (
          <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
            <button onClick={() => setEditing(true)} style={actionBtn}>Edit</button>
            <button onClick={() => onDelete(item.id)} style={{ ...actionBtn, color: 'var(--accent)' }}>Remove</button>
          </td>
        )}
      </tr>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    await onSave(item.id, {
      description:  draft.description,
      quantity:     draft.quantity,
      unit:         draft.unit,
      target_price: draft.target_price || null,
    });
    setSaving(false);
    setEditing(false);
  };

  return (
    <tr style={{ backgroundColor: 'var(--surface)' }}>
      <td style={td}>
        <input
          value={draft.description}
          onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
          style={inlineInput}
          placeholder="Description"
        />
      </td>
      <td style={{ ...td }}>
        <input
          type="number"
          value={draft.quantity}
          onChange={e => setDraft(d => ({ ...d, quantity: e.target.value }))}
          style={{ ...inlineInput, width: 70, textAlign: 'right' }}
          min="0"
        />
      </td>
      <td style={td}>
        <input
          value={draft.unit || ''}
          onChange={e => setDraft(d => ({ ...d, unit: e.target.value }))}
          style={{ ...inlineInput, width: 80 }}
          placeholder="pcs"
        />
      </td>
      <td style={td}>
        <input
          type="number"
          value={draft.target_price || ''}
          onChange={e => setDraft(d => ({ ...d, target_price: e.target.value }))}
          style={{ ...inlineInput, width: 110, textAlign: 'right' }}
          placeholder="0.00"
          min="0"
        />
      </td>
      <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
        <button onClick={handleSave} disabled={saving} style={{ ...actionBtn, color: '#2d7a3a', fontWeight: 600 }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={() => setEditing(false)} style={actionBtn}>Cancel</button>
      </td>
    </tr>
  );
}

// ── New row form ───────────────────────────────────────────────────────────
function NewItemRow({ currency, onAdd, onCancel }) {
  const [form, setForm]   = useState({ description: '', quantity: 1, unit: '', target_price: '' });
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!form.description.trim()) return;
    setAdding(true);
    await onAdd({
      description:  form.description.trim(),
      quantity:     form.quantity     || 1,
      unit:         form.unit         || null,
      target_price: form.target_price || null,
    });
    setAdding(false);
    setForm({ description: '', quantity: 1, unit: '', target_price: '' });
  };

  return (
    <tr style={{ backgroundColor: '#fffdf9' }}>
      <td style={td}>
        <input
          autoFocus
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          style={inlineInput}
          placeholder="Item description *"
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
      </td>
      <td style={td}>
        <input
          type="number"
          value={form.quantity}
          onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
          style={{ ...inlineInput, width: 70, textAlign: 'right' }}
          min="0"
        />
      </td>
      <td style={td}>
        <input
          value={form.unit}
          onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
          style={{ ...inlineInput, width: 80 }}
          placeholder="pcs"
        />
      </td>
      <td style={td}>
        <input
          type="number"
          value={form.target_price}
          onChange={e => setForm(f => ({ ...f, target_price: e.target.value }))}
          style={{ ...inlineInput, width: 110, textAlign: 'right' }}
          placeholder="0.00"
          min="0"
        />
      </td>
      <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
        <button onClick={handleAdd} disabled={adding || !form.description.trim()}
          style={{ ...actionBtn, color: '#2d7a3a', fontWeight: 600 }}>
          {adding ? 'Adding…' : 'Add'}
        </button>
        <button onClick={onCancel} style={actionBtn}>Cancel</button>
      </td>
    </tr>
  );
}

// ── Main exported component ────────────────────────────────────────────────
export default function RFQItemsTable({ items, currency = 'USD', canWrite, rfqId, onItemsChange }) {
  const [showNewRow, setShowNewRow] = useState(false);
  const [error, setError]           = useState('');

  const handleSave = async (itemId, data) => {
    setError('');
    try {
      const res = await fetch(`/api/rfqs/${rfqId}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      onItemsChange(items.map(i => (i.id === itemId ? json.data.item : i)));
    } catch { setError('Network error'); }
  };

  const handleDelete = async (itemId) => {
    setError('');
    try {
      const res = await fetch(`/api/rfqs/${rfqId}/items/${itemId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      onItemsChange(items.filter(i => i.id !== itemId));
    } catch { setError('Network error'); }
  };

  const handleAdd = async (data) => {
    setError('');
    try {
      const res = await fetch(`/api/rfqs/${rfqId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      onItemsChange([...items, json.data.item]);
      setShowNewRow(false);
    } catch { setError('Network error'); }
  };

  return (
    <div>
      {error && (
        <div style={{ background: '#fdecea', color: '#c0392b', padding: '8px 12px',
          borderRadius: 'var(--radius)', fontSize: '.82rem', marginBottom: 10 }}>
          {error}
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
          <thead>
            <tr>
              <th style={th}>Description</th>
              <th style={{ ...th, textAlign: 'right', width: 90 }}>Qty</th>
              <th style={{ ...th, width: 100 }}>Unit</th>
              <th style={{ ...th, textAlign: 'right', width: 130 }}>Target Price</th>
              {canWrite && <th style={{ ...th, width: 130 }} />}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && !showNewRow && (
              <tr>
                <td colSpan={canWrite ? 5 : 4}
                  style={{ ...td, textAlign: 'center', color: 'var(--ink-faint)',
                    fontStyle: 'italic', padding: '24px 0' }}>
                  No line items yet
                </td>
              </tr>
            )}
            {items.map(item => (
              <ItemRow
                key={item.id}
                item={item}
                currency={currency}
                canWrite={canWrite}
                onSave={handleSave}
                onDelete={handleDelete}
              />
            ))}
            {showNewRow && (
              <NewItemRow
                currency={currency}
                onAdd={handleAdd}
                onCancel={() => setShowNewRow(false)}
              />
            )}
          </tbody>
          {items.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan={3} style={{ ...td, fontSize: '.78rem', color: 'var(--ink-faint)' }}>
                  {items.length} item{items.length !== 1 ? 's' : ''}
                </td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 600, fontSize: '.88rem' }}>
                  {items.some(i => i.target_price)
                    ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
                        items.reduce((s, i) => s + (parseFloat(i.target_price) || 0) * (parseFloat(i.quantity) || 1), 0)
                      )
                    : '—'
                  }
                </td>
                {canWrite && <td />}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {canWrite && !showNewRow && (
        <button onClick={() => setShowNewRow(true)} style={addBtn}>
          + Add line item
        </button>
      )}
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const th = {
  padding: '8px 12px',
  textAlign: 'left',
  fontSize: '.72rem',
  fontWeight: 600,
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  color: 'var(--ink-faint)',
  borderBottom: '1px solid var(--border)',
  background: 'transparent',
};

const td = {
  padding: '10px 12px',
  borderBottom: '1px solid var(--border)',
  color: 'var(--ink)',
  verticalAlign: 'middle',
};

const inlineInput = {
  width: '100%',
  padding: '5px 8px',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  fontSize: '.84rem',
  fontFamily: 'inherit',
  color: 'var(--ink)',
  background: 'var(--white)',
  outline: 'none',
};

const actionBtn = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '.8rem',
  fontWeight: 500,
  color: 'var(--ink-soft)',
  padding: '3px 6px',
  marginLeft: 2,
  borderRadius: 4,
};

const addBtn = {
  marginTop: 12,
  background: 'none',
  border: '1px dashed var(--border)',
  borderRadius: 'var(--radius)',
  padding: '8px 16px',
  fontSize: '.82rem',
  color: 'var(--ink-soft)',
  cursor: 'pointer',
  width: '100%',
  fontFamily: 'DM Sans, sans-serif',
};
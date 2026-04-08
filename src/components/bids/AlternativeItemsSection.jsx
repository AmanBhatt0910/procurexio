'use client';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';

const EMPTY_ALT_FORM = {
  rfq_item_id: '',
  alt_name: '',
  alt_description: '',
  alt_specifications: '',
  alt_unit_price: '',
  alt_quantity: '',
  reason_for_alternative: '',
  notes: '',
};

export default function AlternativeItemsSection({ rfqId, rfqItems, altItems, setAltItems, isLocked }) {
  const [altModal, setAltModal] = useState(false);
  const [altForm, setAltForm]   = useState(EMPTY_ALT_FORM);
  const [altSaving, setAltSaving] = useState(false);
  const [altError, setAltError]   = useState('');

  async function handleAddAlt() {
    setAltSaving(true); setAltError('');
    try {
      const res = await fetch(`/api/bids/rfqs/${rfqId}/bid/alternatives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rfq_item_id:            Number(altForm.rfq_item_id),
          alt_name:               altForm.alt_name,
          alt_description:        altForm.alt_description,
          alt_specifications:     altForm.alt_specifications,
          alt_unit_price:         altForm.alt_unit_price !== '' ? altForm.alt_unit_price : null,
          alt_quantity:           altForm.alt_quantity   !== '' ? altForm.alt_quantity   : null,
          reason_for_alternative: altForm.reason_for_alternative,
          notes:                  altForm.notes,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setAltItems(prev => [...prev, json.data]);
      setAltModal(false);
    } catch (e) {
      setAltError(e.message);
    } finally {
      setAltSaving(false);
    }
  }

  async function handleDeleteAlt(altId) {
    if (!confirm('Remove this alternative item suggestion?')) return;
    try {
      await fetch(`/api/bids/rfqs/${rfqId}/bid/alternatives?altId=${altId}`, { method: 'DELETE' });
      setAltItems(prev => prev.filter(a => a.id !== altId));
    } catch { /* ignore */ }
  }

  return (
    <>
      <style>{`
        .alt-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 640px) { .alt-form-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="alt-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <span className="section-label">Alternative Items</span>
            <span style={{ marginLeft: 8, fontSize: '.72rem', color: 'var(--ink-faint)',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 4, padding: '1px 7px' }}>
              {altItems.length}
            </span>
          </div>
          {!isLocked && (
            <button
              className="btn btn-outline"
              style={{ fontSize: '.8rem', padding: '6px 14px' }}
              onClick={() => {
                setAltModal(true);
                setAltError('');
                setAltForm({ ...EMPTY_ALT_FORM, rfq_item_id: rfqItems[0]?.id || '' });
              }}
            >
              + Suggest Alternative
            </button>
          )}
        </div>
        <p style={{ color: 'var(--ink-soft)', fontSize: '.82rem', margin: '0 0 14px' }}>
          If you have a similar or equivalent item that can fulfil a requirement, suggest it here.
          The buyer will review your alternatives alongside your main bid.
        </p>

        {altItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 16px',
            border: '2px dashed var(--border)', borderRadius: 8 }}>
            <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>🔄</div>
            <div style={{ fontSize: '.86rem', color: 'var(--ink-soft)' }}>
              No alternative items suggested yet.
              {!isLocked && ' Use the button above to suggest a similar item.'}
            </div>
          </div>
        ) : (
          altItems.map(alt => {
            const origItem = rfqItems.find(i => i.id === alt.rfq_item_id);
            return (
              <div key={alt.id} className="alt-item-row">
                <div style={{ fontSize: '1.2rem', marginTop: 2 }}>🔄</div>
                <div className="alt-item-details">
                  <div className="alt-item-name">{alt.alt_name}</div>
                  <div className="alt-item-meta">
                    {origItem && <span>For: <strong>{origItem.description}</strong> · </span>}
                    {alt.alt_quantity && <span>Qty: {alt.alt_quantity} · </span>}
                    {alt.alt_unit_price && <span>Price: {parseFloat(alt.alt_unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })} · </span>}
                    {alt.alt_description && <span>{alt.alt_description}</span>}
                  </div>
                  {alt.alt_specifications && (
                    <div style={{ fontSize: '.76rem', color: 'var(--ink-faint)', marginTop: 2 }}>
                      Specs: {alt.alt_specifications}
                    </div>
                  )}
                  {alt.reason_for_alternative && (
                    <div style={{ fontSize: '.78rem', color: 'var(--ink-soft)', marginTop: 4,
                      background: '#eff6ff', borderRadius: 4, padding: '3px 8px', display: 'inline-block' }}>
                      💡 {alt.reason_for_alternative}
                    </div>
                  )}
                </div>
                {!isLocked && (
                  <button
                    onClick={() => handleDeleteAlt(alt.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--ink-faint)', fontSize: '.82rem', padding: '4px 6px',
                      flexShrink: 0 }}
                    title="Remove alternative"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Alternative Item Modal */}
      <Modal
        open={altModal}
        onClose={() => setAltModal(false)}
        title="Suggest an Alternative Item"
        width={560}
      >
        <div>
          <p style={{ color: 'var(--ink-soft)', fontSize: '.86rem', margin: '0 0 16px' }}>
            Select the RFQ item you are offering an alternative for, then provide details about your item.
          </p>
          {altError && (
            <div className="error-box" style={{ marginBottom: 12 }}>{altError}</div>
          )}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: '.79rem', fontWeight: 500, marginBottom: 4 }}>
              Original RFQ Item *
            </label>
            <select
              className="form-control"
              value={altForm.rfq_item_id}
              onChange={e => setAltForm(f => ({ ...f, rfq_item_id: e.target.value }))}
            >
              {rfqItems.map((item, idx) => (
                <option key={item.id} value={item.id}>
                  {idx + 1}. {item.description} (Qty: {item.quantity} {item.unit || ''})
                </option>
              ))}
            </select>
          </div>
          <div className="alt-form-grid" style={{ marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '.79rem', fontWeight: 500, marginBottom: 4 }}>
                Alternative Item Name *
              </label>
              <input
                className="form-control"
                type="text"
                placeholder="e.g. Brand X Model Y"
                value={altForm.alt_name}
                onChange={e => setAltForm(f => ({ ...f, alt_name: e.target.value }))}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '.79rem', fontWeight: 500, marginBottom: 4 }}>
                Unit Price (optional)
              </label>
              <input
                className="form-control"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={altForm.alt_unit_price}
                onChange={e => setAltForm(f => ({ ...f, alt_unit_price: e.target.value }))}
              />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: '.79rem', fontWeight: 500, marginBottom: 4 }}>
              Description
            </label>
            <input
              className="form-control"
              type="text"
              placeholder="Brief description of the alternative item"
              value={altForm.alt_description}
              onChange={e => setAltForm(f => ({ ...f, alt_description: e.target.value }))}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: '.79rem', fontWeight: 500, marginBottom: 4 }}>
              Specifications
            </label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Technical specs, model number, dimensions, etc."
              value={altForm.alt_specifications}
              onChange={e => setAltForm(f => ({ ...f, alt_specifications: e.target.value }))}
              style={{ resize: 'vertical' }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '.79rem', fontWeight: 500, marginBottom: 4 }}>
              Why is this a suitable alternative?
            </label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Explain why your item meets the requirement or is better suited…"
              value={altForm.reason_for_alternative}
              onChange={e => setAltForm(f => ({ ...f, reason_for_alternative: e.target.value }))}
              style={{ resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={() => setAltModal(false)}>Cancel</button>
            <button
              className="btn btn-accent"
              disabled={altSaving || !altForm.alt_name?.trim() || !altForm.rfq_item_id}
              onClick={handleAddAlt}
            >
              {altSaving ? 'Adding…' : 'Add Alternative'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

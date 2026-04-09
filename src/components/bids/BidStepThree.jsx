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

/**
 * BidStepThree — Step 3: Add Alternative Items & Attachments
 *
 * Lets the vendor upload supporting documents and suggest alternative items
 * to fulfil RFQ requirements.  Includes Back / Next navigation.
 */
export default function BidStepThree({
  rfqId,
  rfqItems,
  isLocked,
  attachments,
  uploadingFile,
  uploadError,
  onFileUpload,
  onDeleteAttachment,
  altItems,
  onAddAlt,
  onDeleteAlt,
  onBack,
  onNext,
}) {
  const [altModal,  setAltModal]  = useState(false);
  const [altForm,   setAltForm]   = useState(EMPTY_ALT_FORM);
  const [altSaving, setAltSaving] = useState(false);
  const [altError,  setAltError]  = useState('');

  async function handleAddAlt() {
    setAltSaving(true);
    setAltError('');
    try {
      await onAddAlt({
        rfq_item_id:            Number(altForm.rfq_item_id),
        alt_name:               altForm.alt_name,
        alt_description:        altForm.alt_description,
        alt_specifications:     altForm.alt_specifications,
        alt_unit_price:         altForm.alt_unit_price  !== '' ? altForm.alt_unit_price  : null,
        alt_quantity:           altForm.alt_quantity    !== '' ? altForm.alt_quantity    : null,
        reason_for_alternative: altForm.reason_for_alternative,
        notes:                  altForm.notes,
      });
      setAltModal(false);
      setAltForm(EMPTY_ALT_FORM);
    } catch (e) {
      setAltError(e.message);
    } finally {
      setAltSaving(false);
    }
  }

  function openAltModal() {
    setAltModal(true);
    setAltError('');
    setAltForm({ ...EMPTY_ALT_FORM, rfq_item_id: rfqItems[0]?.id || '' });
  }

  return (
    <>
      {/* ── File Attachments ── */}
      <div className="bid-card" style={{ marginBottom: 24 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 14,
        }}>
          <span className="section-label">Attachments ({attachments.length})</span>
          {!isLocked && (
            <label style={{
              cursor: 'pointer', fontSize: '.8rem', fontWeight: 600,
              color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <input
                type="file"
                style={{ display: 'none' }}
                onChange={onFileUpload}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.txt,.csv"
                disabled={uploadingFile}
              />
              {uploadingFile ? 'Uploading…' : '+ Add File'}
            </label>
          )}
        </div>

        {uploadError && (
          <div style={{ color: 'var(--accent)', fontSize: '.8rem', marginBottom: 8 }}>
            {uploadError}
          </div>
        )}

        {attachments.length === 0 ? (
          <p style={{ fontSize: '.84rem', color: 'var(--ink-soft)', margin: 0 }}>
            No files attached yet.
            {!isLocked && ' Use "Add File" to attach supporting documents.'}
          </p>
        ) : (
          attachments.map(att => (
            <div key={att.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', marginBottom: 6, background: 'var(--surface)',
            }}>
              <span>📎</span>
              <span style={{
                flex: 1, fontSize: '.84rem', color: 'var(--ink)',
                fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {att.original_name}
              </span>
              <span style={{ fontSize: '.76rem', color: 'var(--ink-soft)' }}>
                {att.file_size >= 1024 * 1024
                  ? `${(att.file_size / (1024 * 1024)).toFixed(1)} MB`
                  : `${(att.file_size / 1024).toFixed(1)} KB`}
              </span>
              {!isLocked && (
                <button
                  onClick={() => onDeleteAttachment(att.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--ink-faint)', fontSize: '.82rem', padding: '2px 4px',
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* ── Alternative Items ── */}
      <div className="alt-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <span className="section-label">Alternative Items</span>
            <span style={{
              marginLeft: 8, fontSize: '.72rem', color: 'var(--ink-faint)',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 4, padding: '1px 7px',
            }}>
              {altItems.length}
            </span>
          </div>
          {!isLocked && (
            <button
              className="btn btn-outline"
              style={{ fontSize: '.8rem', padding: '6px 14px' }}
              onClick={openAltModal}
            >
              + Suggest Alternative
            </button>
          )}
        </div>

        <p style={{ color: 'var(--ink-soft)', fontSize: '.82rem', margin: '0 0 14px' }}>
          If you have a similar or equivalent item that can fulfil a requirement,
          suggest it here. The buyer will review your alternatives alongside your main bid.
        </p>

        {altItems.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '24px 16px',
            border: '2px dashed var(--border)', borderRadius: 8,
          }}>
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
                    {alt.alt_quantity   && <span>Qty: {alt.alt_quantity} · </span>}
                    {alt.alt_unit_price && (
                      <span>
                        Price: {parseFloat(alt.alt_unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })} ·{' '}
                      </span>
                    )}
                    {alt.alt_description && <span>{alt.alt_description}</span>}
                  </div>
                  {alt.alt_specifications && (
                    <div style={{ fontSize: '.76rem', color: 'var(--ink-faint)', marginTop: 2 }}>
                      Specs: {alt.alt_specifications}
                    </div>
                  )}
                  {alt.reason_for_alternative && (
                    <div style={{
                      fontSize: '.78rem', color: 'var(--ink-soft)', marginTop: 4,
                      background: '#eff6ff', borderRadius: 4, padding: '3px 8px', display: 'inline-block',
                    }}>
                      💡 {alt.reason_for_alternative}
                    </div>
                  )}
                </div>
                {!isLocked && (
                  <button
                    onClick={() => onDeleteAlt(alt.id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--ink-faint)', fontSize: '.82rem', padding: '4px 6px', flexShrink: 0,
                    }}
                    title="Remove alternative"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })
        )}

        {/* Step navigation */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: 20, borderTop: '1px solid var(--border)', marginTop: 20,
        }}>
          <button className="btn btn-outline" onClick={onBack}>
            ← Back
          </button>
          <button className="btn btn-primary" onClick={onNext}>
            Next: Review &amp; Submit →
          </button>
        </div>
      </div>

      {/* ── Alternative Item Modal ── */}
      <Modal
        open={altModal}
        onClose={() => setAltModal(false)}
        title="Suggest an Alternative Item"
        width={560}
      >
        <div>
          <p style={{ color: 'var(--ink-soft)', fontSize: '.86rem', margin: '0 0 16px' }}>
            Select the RFQ item you are offering an alternative for, then provide
            details about your item.
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
            <button className="btn btn-outline" onClick={() => setAltModal(false)}>
              Cancel
            </button>
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

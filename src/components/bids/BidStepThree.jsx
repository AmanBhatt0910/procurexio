'use client';
// src/components/bids/BidStepThree.jsx

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

function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M9.5 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.5L9.5 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M9.5 2v3.5H13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5.5 8h5M5.5 10.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function formatFileSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

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
    setAltSaving(true); setAltError('');
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
    setAltModal(true); setAltError('');
    setAltForm({ ...EMPTY_ALT_FORM, rfq_item_id: rfqItems[0]?.id || '' });
  }

  return (
    <>
      <style>{`
        .s3-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 16px;
        }
        .s3-card-header {
          padding: 18px 24px;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .s3-header-info { display: flex; flex-direction: column; gap: 1px; }
        .s3-section-tag {
          font-size: .7rem; font-weight: 700; letter-spacing: .09em;
          text-transform: uppercase; color: var(--ink-faint);
          font-family: 'DM Sans', sans-serif;
        }
        .s3-section-title {
          font-family: 'Syne', sans-serif; font-weight: 700; font-size: .98rem;
          color: var(--ink); letter-spacing: -.025em;
        }
        .s3-card-body { padding: 20px 24px; }
        .s3-upload-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px; background: var(--white);
          border: 1.5px solid var(--border); border-radius: 9px;
          font-family: 'DM Sans', sans-serif; font-size: .835rem; font-weight: 600;
          color: var(--ink); cursor: pointer; transition: all .13s;
        }
        .s3-upload-btn:hover { background: var(--ink); color: #fff; border-color: var(--ink); }
        .s3-file-row {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 14px;
          border: 1px solid var(--border); border-radius: 9px;
          background: var(--surface);
          margin-bottom: 8px;
          transition: border-color .12s;
        }
        .s3-file-row:last-child { margin-bottom: 0; }
        .s3-file-row:hover { border-color: rgba(15,14,13,.2); }
        .s3-file-icon {
          width: 32px; height: 32px; border-radius: 7px;
          background: var(--white); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          color: var(--ink-soft); flex-shrink: 0;
        }
        .s3-file-name {
          flex: 1; font-size: .845rem; font-weight: 500;
          color: var(--ink); font-family: 'DM Sans', sans-serif;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .s3-file-size {
          font-size: .76rem; color: var(--ink-faint);
          font-family: 'DM Sans', sans-serif; white-space: nowrap;
        }
        .s3-file-del {
          background: none; border: none; cursor: pointer;
          color: var(--ink-faint); padding: 4px; border-radius: 5px;
          display: flex; align-items: center; transition: color .12s, background .12s;
        }
        .s3-file-del:hover { color: #A32D2D; background: #FCEBEB; }
        .s3-empty-state {
          text-align: center; padding: 28px 16px;
          border: 1.5px dashed var(--border); border-radius: 10px;
        }
        .s3-empty-text {
          font-size: .845rem; color: var(--ink-faint);
          font-family: 'DM Sans', sans-serif;
        }
        .s3-alt-row {
          padding: 14px 16px;
          border: 1px solid var(--border); border-radius: 10px;
          background: var(--surface); margin-bottom: 10px;
          display: flex; gap: 12px; align-items: flex-start;
          transition: border-color .12s;
        }
        .s3-alt-row:hover { border-color: rgba(15,14,13,.2); }
        .s3-alt-icon {
          width: 32px; height: 32px; border-radius: 8px;
          background: #E6F1FB; border: 1px solid #B5D4F4;
          display: flex; align-items: center; justify-content: center;
          color: #185FA5; flex-shrink: 0;
        }
        .s3-alt-name { font-weight: 600; font-size: .9rem; color: var(--ink); font-family: 'DM Sans', sans-serif; }
        .s3-alt-meta { font-size: .785rem; color: var(--ink-soft); margin-top: 3px; font-family: 'DM Sans', sans-serif; line-height: 1.5; }
        .s3-alt-reason {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: .775rem; color: #185FA5; background: #E6F1FB;
          border-radius: 6px; padding: 3px 9px; margin-top: 6px;
          font-family: 'DM Sans', sans-serif;
        }
        .s3-alt-add-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px; background: var(--white);
          border: 1.5px solid var(--border); border-radius: 9px;
          font-family: 'DM Sans', sans-serif; font-size: .835rem; font-weight: 600;
          color: var(--ink); cursor: pointer; transition: all .13s;
        }
        .s3-alt-add-btn:hover { background: var(--ink); color: #fff; border-color: var(--ink); }
        .s3-footer {
          padding: 16px 24px;
          border-top: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; flex-wrap: wrap; background: var(--surface);
        }
        .s3-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 18px; border-radius: 9px;
          font-family: 'DM Sans', sans-serif; font-size: .845rem; font-weight: 600;
          cursor: pointer; transition: all .14s; letter-spacing: -.01em;
        }
        .s3-btn--ghost {
          background: transparent; color: var(--ink-soft); border: 1.5px solid var(--border);
        }
        .s3-btn--ghost:hover { background: var(--surface); color: var(--ink); }
        .s3-btn--primary {
          background: var(--ink); color: #fff; border: 1.5px solid var(--ink);
        }
        .s3-btn--primary:hover { opacity: .82; }

        /* Modal form styles */
        .alt-modal-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .alt-modal-label {
          font-size: .785rem; font-weight: 600; color: var(--ink);
          font-family: 'DM Sans', sans-serif;
        }
        .alt-modal-label-hint { font-weight: 400; color: var(--ink-faint); font-size: .74rem; }
        .alt-modal-input {
          width: 100%; padding: 9px 12px;
          border: 1.5px solid var(--border); border-radius: 9px;
          font-family: 'DM Sans', sans-serif; font-size: .875rem;
          color: var(--ink); background: var(--white); outline: none;
          box-sizing: border-box; transition: border-color .15s;
          -webkit-appearance: none;
        }
        .alt-modal-input::placeholder { color: var(--ink-faint); }
        .alt-modal-input:focus { border-color: var(--ink); box-shadow: 0 0 0 3px rgba(15,14,13,.07); }
        .alt-modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 520px) {
          .s3-card-header, .s3-card-body, .s3-footer { padding: 14px 16px; }
          .alt-modal-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ── Attachments Card ── */}
      <div className="s3-card">
        <div className="s3-card-header">
          <div className="s3-header-info">
            <div className="s3-section-tag">Step 3 of 4</div>
            <div className="s3-section-title">
              Attachments
              {attachments.length > 0 && (
                <span style={{
                  marginLeft: 8, fontSize: '.72rem', fontWeight: 600,
                  background: 'var(--ink)', color: '#fff',
                  borderRadius: 20, padding: '1px 7px',
                  fontFamily: "'DM Sans', sans-serif", verticalAlign: 'middle',
                }}>
                  {attachments.length}
                </span>
              )}
            </div>
          </div>

          {!isLocked && (
            <label className="s3-upload-btn">
              <input
                type="file"
                style={{ display: 'none' }}
                onChange={onFileUpload}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.txt,.csv"
                disabled={uploadingFile}
              />
              {uploadingFile ? (
                <>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ animation: 'spin .65s linear infinite' }}>
                    <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4" strokeDasharray="12"/>
                  </svg>
                  Uploading…
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M6.5 9V4M6.5 4L4 6.5M6.5 4L9 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 10.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Upload File
                </>
              )}
            </label>
          )}
        </div>

        <div className="s3-card-body">
          {uploadError && (
            <div style={{
              color: '#A32D2D', fontSize: '.82rem', marginBottom: 12,
              background: '#FCEBEB', borderRadius: 7, padding: '8px 12px',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {uploadError}
            </div>
          )}

          {attachments.length === 0 ? (
            <div className="s3-empty-state">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ display: 'block', margin: '0 auto 10px', opacity: .3 }}>
                <path d="M22 28H10a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8l6 6v16a2 2 0 0 1-2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M18 4v6h6M12 16h8M12 20h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <div className="s3-empty-text">
                No files attached
                {!isLocked && ' — upload supporting documents, specs, or images'}
              </div>
            </div>
          ) : (
            attachments.map(att => (
              <div key={att.id} className="s3-file-row">
                <div className="s3-file-icon"><FileIcon /></div>
                <span className="s3-file-name">{att.original_name}</span>
                <span className="s3-file-size">{formatFileSize(att.file_size)}</span>
                {!isLocked && (
                  <button className="s3-file-del" onClick={() => onDeleteAttachment(att.id)} aria-label="Remove file">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M2 3.5h9M5 3.5V2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1M5.5 6v3M7.5 6v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                      <path d="M3 3.5l.6 6.7a.5.5 0 0 0 .5.3h4.8a.5.5 0 0 0 .5-.3L10 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Alternative Items Card ── */}
      <div className="s3-card">
        <div className="s3-card-header">
          <div className="s3-header-info">
            <div className="s3-section-tag">Optional</div>
            <div className="s3-section-title">
              Alternative Items
              {altItems.length > 0 && (
                <span style={{
                  marginLeft: 8, fontSize: '.72rem', fontWeight: 600,
                  background: '#185FA5', color: '#fff',
                  borderRadius: 20, padding: '1px 7px',
                  fontFamily: "'DM Sans', sans-serif", verticalAlign: 'middle',
                }}>
                  {altItems.length}
                </span>
              )}
            </div>
          </div>

          {!isLocked && (
            <button className="s3-alt-add-btn" onClick={openAltModal}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 2v9M2 6.5h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              Suggest Alternative
            </button>
          )}
        </div>

        <div className="s3-card-body">
          <p style={{
            fontSize: '.845rem', color: 'var(--ink-soft)', margin: '0 0 16px',
            lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif",
          }}>
            Have a similar or equivalent item? Suggest it here — the buyer reviews
            alternatives alongside your main bid.
          </p>

          {altItems.length === 0 ? (
            <div className="s3-empty-state">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ display: 'block', margin: '0 auto 10px', opacity: .3 }}>
                <path d="M10 16h12M4 8h8M4 24h8M20 8h8M20 24h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="16" cy="16" r="3" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <div className="s3-empty-text">
                No alternatives suggested
                {!isLocked && ' — use the button above if you have an equivalent item'}
              </div>
            </div>
          ) : (
            altItems.map(alt => {
              const origItem = rfqItems.find(i => i.id === alt.rfq_item_id);
              return (
                <div key={alt.id} className="s3-alt-row">
                  <div className="s3-alt-icon">
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <path d="M3 7.5h9M3 7.5L6 5M3 7.5L6 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="s3-alt-name">{alt.alt_name}</div>
                    <div className="s3-alt-meta">
                      {origItem && <span>For: <strong>{origItem.description}</strong></span>}
                      {alt.alt_quantity   && <span> · Qty: {alt.alt_quantity}</span>}
                      {alt.alt_unit_price && (
                        <span> · {parseFloat(alt.alt_unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      )}
                      {alt.alt_description && <span> · {alt.alt_description}</span>}
                    </div>
                    {alt.reason_for_alternative && (
                      <div className="s3-alt-reason">
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                          <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
                          <path d="M5.5 3.5v2.5M5.5 7.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                        {alt.reason_for_alternative}
                      </div>
                    )}
                  </div>
                  {!isLocked && (
                    <button
                      onClick={() => onDeleteAlt(alt.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--ink-faint)', padding: '4px', borderRadius: 5,
                        display: 'flex', alignItems: 'center', transition: 'color .12s, background .12s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#A32D2D'; e.currentTarget.style.background = '#FCEBEB'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink-faint)'; e.currentTarget.style.background = 'none'; }}
                      aria-label="Remove alternative"
                    >
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M2 2l9 9M11 2l-9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                      </svg>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer nav */}
        <div className="s3-footer">
          <button className="s3-btn s3-btn--ghost" onClick={onBack}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M10 6.5H3M3 6.5l3-3M3 6.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <button className="s3-btn s3-btn--primary" onClick={onNext}>
            Next: Review &amp; Submit
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M3 6.5h7M7 4l3 2.5-3 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Alternative Item Modal ── */}
      <Modal
        open={altModal}
        onClose={() => setAltModal(false)}
        title="Suggest an Alternative Item"
        width={540}
      >
        <p style={{
          color: 'var(--ink-soft)', fontSize: '.845rem', margin: '0 0 20px',
          lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif",
        }}>
          Select the RFQ item you&apos;re offering an alternative for, then describe your substitute.
        </p>

        {altError && (
          <div style={{
            background: '#FCEBEB', border: '1px solid #F7C1C1',
            borderRadius: 8, padding: '10px 14px', color: '#A32D2D',
            fontSize: '.835rem', marginBottom: 14, fontFamily: "'DM Sans', sans-serif",
          }}>
            {altError}
          </div>
        )}

        <div className="alt-modal-field">
          <label className="alt-modal-label">
            Original RFQ Item <span style={{ color: 'var(--accent)' }}>*</span>
          </label>
          <select
            className="alt-modal-input"
            value={altForm.rfq_item_id}
            onChange={e => setAltForm(f => ({ ...f, rfq_item_id: e.target.value }))}
            style={{ cursor: 'pointer' }}
          >
            {rfqItems.map((item, idx) => (
              <option key={item.id} value={item.id}>
                {idx + 1}. {item.description} (Qty: {item.quantity} {item.unit || ''})
              </option>
            ))}
          </select>
        </div>

        <div className="alt-modal-grid">
          <div className="alt-modal-field" style={{ marginBottom: 0 }}>
            <label className="alt-modal-label">
              Alternative Name <span style={{ color: 'var(--accent)' }}>*</span>
            </label>
            <input
              className="alt-modal-input"
              type="text"
              placeholder="e.g. Brand X Model Y"
              value={altForm.alt_name}
              onChange={e => setAltForm(f => ({ ...f, alt_name: e.target.value }))}
            />
          </div>
          <div className="alt-modal-field" style={{ marginBottom: 0 }}>
            <label className="alt-modal-label">
              Unit Price <span className="alt-modal-label-hint">— optional</span>
            </label>
            <input
              className="alt-modal-input"
              type="number" min="0" step="0.01"
              placeholder="0.00"
              value={altForm.alt_unit_price}
              onChange={e => setAltForm(f => ({ ...f, alt_unit_price: e.target.value }))}
            />
          </div>
        </div>

        <div style={{ height: 14 }} />

        <div className="alt-modal-field">
          <label className="alt-modal-label">
            Description <span className="alt-modal-label-hint">— optional</span>
          </label>
          <input
            className="alt-modal-input"
            type="text"
            placeholder="Brief description"
            value={altForm.alt_description}
            onChange={e => setAltForm(f => ({ ...f, alt_description: e.target.value }))}
          />
        </div>

        <div className="alt-modal-field">
          <label className="alt-modal-label">
            Specifications <span className="alt-modal-label-hint">— optional</span>
          </label>
          <textarea
            className="alt-modal-input"
            rows={2}
            placeholder="Model number, dimensions, technical specs…"
            value={altForm.alt_specifications}
            onChange={e => setAltForm(f => ({ ...f, alt_specifications: e.target.value }))}
            style={{ resize: 'vertical' }}
          />
        </div>

        <div className="alt-modal-field">
          <label className="alt-modal-label">
            Why is this a suitable alternative?
          </label>
          <textarea
            className="alt-modal-input"
            rows={2}
            placeholder="Explain how your item meets the requirement…"
            value={altForm.reason_for_alternative}
            onChange={e => setAltForm(f => ({ ...f, reason_for_alternative: e.target.value }))}
            style={{ resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
          <button
            onClick={() => setAltModal(false)}
            style={{
              padding: '9px 18px', background: 'transparent', border: '1.5px solid var(--border)',
              borderRadius: 9, fontFamily: "'DM Sans', sans-serif", fontSize: '.845rem',
              fontWeight: 600, cursor: 'pointer', color: 'var(--ink-soft)', transition: 'all .13s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--ink)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-soft)'; }}
          >
            Cancel
          </button>
          <button
            disabled={altSaving || !altForm.alt_name?.trim() || !altForm.rfq_item_id}
            onClick={handleAddAlt}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '9px 20px', background: altSaving || !altForm.alt_name?.trim() || !altForm.rfq_item_id ? 'var(--border)' : 'var(--accent)',
              color: altSaving || !altForm.alt_name?.trim() || !altForm.rfq_item_id ? 'var(--ink-soft)' : '#fff',
              border: 'none', borderRadius: 9, fontFamily: "'DM Sans', sans-serif",
              fontSize: '.845rem', fontWeight: 600, cursor: altSaving ? 'not-allowed' : 'pointer',
              transition: 'background .15s',
            }}
          >
            {altSaving ? 'Adding…' : 'Add Alternative'}
          </button>
        </div>
      </Modal>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
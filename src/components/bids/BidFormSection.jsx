'use client';
import BidItemsForm from './BidItemsForm';
import MinBidGuidancePanel from './MinBidGuidancePanel';

export default function BidFormSection({
  bid,
  rfqItems,
  currency, setCurrency,
  notes, setNotes,
  bidItems, setBidItems,
  canEdit,
  updateMode,
  companyCurrency,
  paymentTerms,
  freightCharge,
  attachments,
  uploadingFile,
  uploadError,
  isLocked,
  onFileUpload,
  onDeleteAttachment,
}) {
  // Compute new total for live validation display
  const newBidTotal = bidItems.reduce((sum, item) => {
    const up  = parseFloat(item.unit_price) || 0;
    const qty = parseFloat(item.quantity)   || 1;
    return sum + up * qty;
  }, 0);

  const isEditable = canEdit || updateMode;
  const currencies = Array.from(new Set([companyCurrency, 'USD', 'EUR', 'GBP', 'INR', 'AED', 'SGD', 'CAD', 'AUD']));

  return (
    <>
      {/* Update-mode live calculation panel */}
      {updateMode && (
        <MinBidGuidancePanel
          currentTotal={bid.total_amount}
          newTotal={newBidTotal}
          currency={currency}
          updateMode={true}
        />
      )}

      {/* Read-only creation fields (payment terms, freight charge) */}
      {(paymentTerms !== '' || freightCharge !== '') && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 20,
        }}>
          <div style={{ fontSize: '.72rem', fontWeight: 600, letterSpacing: '.08em',
            textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 12 }}>
            Bid Terms (set at creation — read only)
          </div>
          <div className="form-row" style={{ margin: 0, gap: 12 }}>
            {paymentTerms !== '' && (
              <div className="form-group" style={{ minWidth: 0 }}>
                <label>Payment Terms (days)</label>
                <input className="form-control" value={paymentTerms} readOnly disabled />
              </div>
            )}
            {freightCharge !== '' && (
              <div className="form-group" style={{ minWidth: 0 }}>
                <label>Freight Charge per Unit</label>
                <input className="form-control" value={freightCharge} readOnly disabled />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Currency + Notes */}
      <div className="form-row">
        <div className="form-group">
          <label>Currency</label>
          <select
            className="form-control"
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            disabled={!isEditable}
          >
            {currencies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ flex: 3 }}>
          <label>Notes / Cover Message (optional)</label>
          <textarea
            className="form-control"
            rows={4}
            placeholder="Any overall notes for the buyer…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            disabled={!isEditable}
            style={{ resize: 'vertical' }}
          />
        </div>
      </div>

      {/* Items table */}
      <div style={{ marginBottom: 20 }}>
        <BidItemsForm
          rfqItems={rfqItems}
          initialItems={bid.items || []}
          onChange={setBidItems}
          readOnly={!isEditable}
        />
      </div>

      {/* File Attachments */}
      <div style={{ marginBottom: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: '.8rem', fontWeight: 600, letterSpacing: '.07em',
            textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
            Attachments ({attachments.length})
          </span>
          {!isLocked && (
            <label style={{ cursor: 'pointer', fontSize: '.8rem', fontWeight: 600,
              color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
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
            No files attached yet.{!isLocked && ' Use "Add File" to attach supporting documents.'}
          </p>
        ) : (
          attachments.map(att => (
            <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              marginBottom: 6, background: 'var(--surface)' }}>
              <span>📎</span>
              <span style={{ flex: 1, fontSize: '.84rem', color: 'var(--ink)',
                fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                  style={{ background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--ink-faint)', fontSize: '.82rem', padding: '2px 4px' }}
                >
                  ✕
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}

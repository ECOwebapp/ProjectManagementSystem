import { useState } from 'react';
import Badge, { voStatusVariant, formatCurrency } from '../shared/Badge.jsx';
import { addVariationOrder, deleteVariationOrder, updateVariationOrder } from '../../data/projectsRepo.js';
import PasswordModal, { isAuthorized } from '../shared/PasswordModal.jsx';

function formatDateForDisplay(dateStr) {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return dateStr;
}

/* ─── Single VO Card Item ─────────────────────────────────────── */
function VOItem({ vo, projectNo, onDelete, onStatusChange }) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [authTitle, setAuthTitle]         = useState('');
  const [authDesc, setAuthDesc]           = useState('');

  const isApproved = vo.status === 'Approved';
  const nextStatus = isApproved ? 'Subject for BOR Approval' : 'Approved';

  const doStatusChange = () => {
    const updated = updateVariationOrder(projectNo, vo.vo_id, { status: nextStatus });
    if (updated) onStatusChange(vo.vo_id, nextStatus);
  };

  const handleStatusClick = () => {
    if (isAuthorized()) {
      doStatusChange();
    } else {
      setAuthTitle('Unlock Status Change');
      setAuthDesc(`Enter authorization password to set status to "${nextStatus}".`);
      setPendingAction(() => doStatusChange);
      setShowAuthModal(true);
    }
  };

  const doDelete = () => {
    if (!window.confirm('Are you sure you want to delete this variation order?')) return;
    deleteVariationOrder(projectNo, vo.vo_id);
    onDelete(vo.vo_id);
  };

  const handleDeleteClick = () => {
    if (isAuthorized()) {
      doDelete();
    } else {
      setAuthTitle('Unlock Variation Order Deletion');
      setAuthDesc('Enter authorization password to delete this variation order.');
      setPendingAction(() => doDelete);
      setShowAuthModal(true);
    }
  };

  return (
    <div className="vo-card-item">
      <PasswordModal
        isOpen={showAuthModal}
        onClose={() => { setShowAuthModal(false); setPendingAction(null); }}
        onSuccess={() => { if (pendingAction) pendingAction(); }}
        title={authTitle}
        description={authDesc}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--sp-3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>
              Variation Order #{vo.vo_number}
            </span>
            <span className="vo-amount-bold">
              {formatCurrency(vo.amount)}
            </span>
          </div>

          {vo.date_submitted && (
            <div className="text-xs text-muted mt-1">Submitted: {vo.date_submitted}</div>
          )}
          {vo.revised_amount && (
            <div className="text-xs mono mt-1" style={{ color: 'var(--blue)', fontWeight: 600 }}>
              Revised Contract Amount: {formatCurrency(vo.revised_amount)}
            </div>
          )}
          {vo.details && (
            <div className="text-sm mt-2" style={{ color: 'var(--navy)' }}>{vo.details}</div>
          )}
        </div>

        <button
          onClick={handleDeleteClick}
          title="Delete Variation Order"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 16,
            color: 'var(--red)',
            padding: '2px 6px',
            borderRadius: 4,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      {vo.status && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, pt: 8, borderTop: '1px solid var(--border)' }}>
          <span onClick={handleStatusClick} style={{ cursor: 'pointer' }}>
            <Badge variant={voStatusVariant(vo.status)}>{vo.status}</Badge>
          </span>

          <button
            className="btn-outline-pill"
            onClick={handleStatusClick}
            style={{ padding: '2px 8px', fontSize: 10 }}
          >
            ⇄ Change
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Main Panel ──────────────────────────────────────────────── */
export default function VariationOrdersPanel({ projectNo, variationOrders: initialVOs = [] }) {
  const [voList, setVoList] = useState(initialVOs);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Form state
  const todayISO = new Date().toISOString().split('T')[0];
  const [dateSubmitted, setDateSubmitted] = useState(todayISO);
  const [amount, setAmount] = useState('');
  const [revisedAmount, setRevisedAmount] = useState('');
  const [details, setDetails] = useState('');
  const [status, setStatus] = useState('Subject for BOR Approval');
  const [error, setError] = useState('');

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid VO amount.');
      return;
    }
    setError('');

    const formattedDate = formatDateForDisplay(dateSubmitted);
    const newVO = addVariationOrder(projectNo, {
      date_submitted: formattedDate,
      amount: parseFloat(amount),
      revised_amount: revisedAmount ? parseFloat(revisedAmount) : null,
      details: details.trim() || null,
      status: status,
    });

    setVoList(prev => [...prev, newVO]);
    setAmount('');
    setRevisedAmount('');
    setDetails('');
    setStatus('Subject for BOR Approval');
    setDateSubmitted(todayISO);
    setShowAddForm(false);
  };

  const handleAddClick = () => {
    if (isAuthorized()) {
      setShowAddForm(true);
    } else {
      setPendingAction(() => () => setShowAddForm(true));
      setShowAuthModal(true);
    }
  };

  return (
    <div className="card">
      <PasswordModal
        isOpen={showAuthModal}
        onClose={() => { setShowAuthModal(false); setPendingAction(null); }}
        onSuccess={() => { if (pendingAction) pendingAction(); }}
        title="Unlock Variation Orders Editing"
        description="Enter authorization password to modify variation orders."
      />

      <div className="card-header">
        <h3 className="card-title">Variation Orders ({voList.length})</h3>
        {!showAddForm && (
          <button
            className="btn btn-primary btn-sm"
            onClick={handleAddClick}
          >
            + Add VO
          </button>
        )}
      </div>

      {showAddForm && (
        <div style={{ padding: 'var(--sp-4)', background: 'var(--gray-light)', borderRadius: 'var(--r-md)', marginBottom: 'var(--sp-4)', border: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 700, marginBottom: 'var(--sp-3)', fontSize: 13, color: 'var(--navy)' }}>
            New Variation Order
          </div>

          <form onSubmit={handleAddSubmit}>
            {error && (
              <div style={{ color: 'var(--red)', fontSize: 11, marginBottom: 'var(--sp-2)', fontWeight: 600 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
              <div>
                <label className="form-label" style={{ fontSize: 11 }}>Date Submitted</label>
                <input
                  type="date"
                  className="form-input"
                  value={dateSubmitted}
                  onChange={e => setDateSubmitted(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: 11 }}>VO Amount (₱)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 49026.70"
                  className="form-input"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
              <div>
                <label className="form-label" style={{ fontSize: 11 }}>Revised Contract Amount due to VO (₱)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 9757458.24 (Optional)"
                  className="form-input"
                  value={revisedAmount}
                  onChange={e => setRevisedAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: 11 }}>Status</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  <option value="Approved">Approved</option>
                  <option value="Subject for BOR Approval">Subject for BOR Approval</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 'var(--sp-3)' }}>
              <label className="form-label" style={{ fontSize: 11 }}>Details / Remarks (Optional)</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Details of variation order..."
                value={details}
                onChange={e => setDetails(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-2)' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => { setShowAddForm(false); setError(''); }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Save Variation Order
              </button>
            </div>
          </form>
        </div>
      )}

      {voList.length === 0 ? (
        <div className="empty-state">No variation orders recorded.</div>
      ) : (
        <div>
          {voList.map(vo => (
            <VOItem
              key={vo.vo_id}
              vo={vo}
              projectNo={projectNo}
              onDelete={(voId) => setVoList(prev => prev.filter(v => v.vo_id !== voId))}
              onStatusChange={(voId, newStatus) =>
                setVoList(prev => prev.map(v => v.vo_id === voId ? { ...v, status: newStatus } : v))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

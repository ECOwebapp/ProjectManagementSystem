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

/* ─── Single VO row with its own auth state ───────────────────── */
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
    <div className="vo-item">
      <PasswordModal
        isOpen={showAuthModal}
        onClose={() => { setShowAuthModal(false); setPendingAction(null); }}
        onSuccess={() => { if (pendingAction) pendingAction(); }}
        title={authTitle}
        description={authDesc}
      />

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <div style={{ fontWeight: 600 }}>Variation Order #{vo.vo_number}</div>
        </div>
        {vo.date_submitted && <div className="vo-meta">Submitted: {vo.date_submitted}</div>}
        {vo.revised_amount && (
          <div className="vo-meta" style={{ color: 'var(--c-text-2)', fontWeight: 500 }}>
            Revised Contract Amount: {formatCurrency(vo.revised_amount)}
          </div>
        )}
        {vo.details && <div className="text-sm mt-2">{vo.details}</div>}
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--sp-2)' }}>
          <div style={{ fontWeight: 600, fontSize: 'var(--text-base)', color: 'var(--c-primary)' }}>
            {formatCurrency(vo.amount)}
          </div>
          <button
            onClick={handleDeleteClick}
            title="Delete Variation Order"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              color: 'var(--c-red)',
              padding: '2px 4px',
              borderRadius: 4,
              lineHeight: 1,
            }}
          >
            <i className="fas fa-trash-alt"></i>
          </button>
        </div>
        {vo.status && (
          <div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
            <span
              onClick={handleStatusClick}
              title={`Click to change to "${nextStatus}"`}
              style={{ cursor: 'pointer' }}
            >
              <Badge variant={voStatusVariant(vo.status)}>{vo.status}</Badge>
            </span>
            <button
              onClick={handleStatusClick}
              title={`Change status to "${nextStatus}"`}
              style={{
                background: 'none',
                border: '1px solid var(--c-border)',
                cursor: 'pointer',
                fontSize: 10,
                color: 'var(--c-text-3)',
                padding: '2px 6px',
                borderRadius: 4,
                lineHeight: 1.4,
                whiteSpace: 'nowrap',
              }}
            >
              <i className="fas fa-exchange-alt mr-1"></i> Change
            </button>
          </div>
        )}
      </div>
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

      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="card-title">
          <i className="fas fa-file-alt mr-2 text-primary" style={{ fontSize: '0.95rem' }}></i>
          Variation Orders ({voList.length})
        </h3>
        {!showAddForm && (
          <button
            className="btn btn-primary btn-xs"
            onClick={handleAddClick}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <i className="fas fa-plus mr-1"></i> Add VO
          </button>
        )}
      </div>

      {showAddForm && (
        <div style={{ padding: 'var(--sp-4)', background: 'var(--c-gray-bg)', borderBottom: '1px solid var(--c-border)' }}>
          <div style={{ fontWeight: 600, marginBottom: 'var(--sp-3)', fontSize: 'var(--text-sm)', color: 'var(--c-text)' }}>
            New Variation Order
          </div>

          <form onSubmit={handleAddSubmit}>
            {error && (
              <div style={{ color: 'var(--c-red)', fontSize: 'var(--text-xs)', marginBottom: 'var(--sp-2)' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
              <div>
                <label className="form-label" style={{ fontSize: 'var(--text-xs)', marginBottom: 4, display: 'block' }}>
                  Date Submitted
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={dateSubmitted}
                  onChange={e => setDateSubmitted(e.target.value)}
                  style={{ width: '100%', fontSize: 'var(--text-sm)' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: 'var(--text-xs)', marginBottom: 4, display: 'block' }}>
                  VO Amount (₱)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 49026.70"
                  className="form-input"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  style={{ width: '100%', fontSize: 'var(--text-sm)' }}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
              <div>
                <label className="form-label" style={{ fontSize: 'var(--text-xs)', marginBottom: 4, display: 'block' }}>
                  Revised Contract Amount due to VO (₱)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 9757458.24 (Optional)"
                  className="form-input"
                  value={revisedAmount}
                  onChange={e => setRevisedAmount(e.target.value)}
                  style={{ width: '100%', fontSize: 'var(--text-sm)' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: 'var(--text-xs)', marginBottom: 4, display: 'block' }}>
                  Status
                </label>
                <select
                  className="form-select"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  style={{ width: '100%', fontSize: 'var(--text-sm)', padding: '6px 10px' }}
                >
                  <option value="Approved">Approved</option>
                  <option value="Subject for BOR Approval">Subject for BOR Approval</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 'var(--sp-3)' }}>
              <label className="form-label" style={{ fontSize: 'var(--text-xs)', marginBottom: 4, display: 'block' }}>
                Details / Remarks (Optional)
              </label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Details of variation order..."
                value={details}
                onChange={e => setDetails(e.target.value)}
                style={{ width: '100%', fontSize: 'var(--text-sm)' }}
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
        <div className="item-list">
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


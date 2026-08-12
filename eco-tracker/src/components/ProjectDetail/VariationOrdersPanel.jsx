import { useState, useEffect, useRef } from 'react';
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

/* ─── Single VO Card Item with Kebab Menu ─────────────────────── */
function VOItem({ vo, projectNo, onDelete, onStatusChange, onUpdateVO }) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [authTitle, setAuthTitle]         = useState('');
  const [authDesc, setAuthDesc]           = useState('');

  // Dropdown menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Edit Amount / Details inline state
  const [editing, setEditing]         = useState(false);
  const [editAmount, setEditAmount]   = useState(vo.amount ?? '');
  const [editRevised, setEditRevised] = useState(vo.revised_amount ?? '');
  const [editDetails, setEditDetails] = useState(vo.details ?? '');

  // Close dropdown on click outside
  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const isApproved = vo.status === 'Approved';
  const nextStatus = isApproved ? 'Subject for BOR Approval' : 'Approved';

  /* Actions */
  const doStatusChange = () => {
    const updated = updateVariationOrder(projectNo, vo.vo_id, { status: nextStatus });
    if (updated) onStatusChange(vo.vo_id, nextStatus);
  };

  const handleStatusMenuClick = () => {
    setMenuOpen(false);
    if (isAuthorized()) {
      doStatusChange();
    } else {
      setAuthTitle('Unlock Status Change');
      setAuthDesc(`Enter authorization password to set status to "${nextStatus}".`);
      setPendingAction(() => doStatusChange);
      setShowAuthModal(true);
    }
  };

  const doOpenEdit = () => {
    setEditAmount(vo.amount ?? '');
    setEditRevised(vo.revised_amount ?? '');
    setEditDetails(vo.details ?? '');
    setEditing(true);
  };

  const handleEditAmountMenuClick = () => {
    setMenuOpen(false);
    if (isAuthorized()) {
      doOpenEdit();
    } else {
      setAuthTitle('Unlock VO Amount Editing');
      setAuthDesc('Enter authorization password to edit this variation order.');
      setPendingAction(() => doOpenEdit);
      setShowAuthModal(true);
    }
  };

  const doDelete = () => {
    if (!window.confirm('Are you sure you want to delete this variation order?')) return;
    deleteVariationOrder(projectNo, vo.vo_id);
    onDelete(vo.vo_id);
  };

  const handleDeleteMenuClick = () => {
    setMenuOpen(false);
    if (isAuthorized()) {
      doDelete();
    } else {
      setAuthTitle('Unlock Variation Order Deletion');
      setAuthDesc('Enter authorization password to delete this variation order.');
      setPendingAction(() => doDelete);
      setShowAuthModal(true);
    }
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    const parsedAmt = parseFloat(editAmount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) return;

    const patch = {
      amount: parsedAmt,
      revised_amount: editRevised ? parseFloat(editRevised) : null,
      details: editDetails.trim() || null,
    };

    const updated = updateVariationOrder(projectNo, vo.vo_id, patch);
    if (onUpdateVO) onUpdateVO(vo.vo_id, patch);
    setEditing(false);
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
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
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

        {/* Kebab (⋮) Dropdown Menu */}
        <div className="kebab-wrap" ref={menuRef}>
          <button
            className={`kebab-btn${menuOpen ? ' active' : ''}`}
            onClick={() => setMenuOpen(v => !v)}
            title="Actions"
          >
            ⋮
          </button>

          {menuOpen && (
            <div className="kebab-dropdown">
              <button className="kebab-item" onClick={handleStatusMenuClick}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <span>Change Status</span>
              </button>

              <button className="kebab-item" onClick={handleEditAmountMenuClick}>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', width: 14, textAlign: 'center', display: 'inline-block', lineHeight: 1 }}>₱</span>
                <span>Edit Amount</span>
              </button>

              <div className="kebab-divider" />

              <button className="kebab-item danger" onClick={handleDeleteMenuClick}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Inline Edit Form for Amount / Details */}
      {editing && (
        <form onSubmit={handleSaveEdit} style={{ marginTop: 12, padding: 12, background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8, color: 'var(--navy)' }}>Edit Variation Order #{vo.vo_number}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div>
              <label className="form-label" style={{ fontSize: 10 }}>VO Amount (₱)</label>
              <input
                type="number" step="0.01" min="0"
                className="form-input" style={{ fontSize: 12 }}
                value={editAmount} onChange={e => setEditAmount(e.target.value)} required
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: 10 }}>Revised Contract Amount (₱)</label>
              <input
                type="number" step="0.01" min="0"
                className="form-input" style={{ fontSize: 12 }}
                value={editRevised} onChange={e => setEditRevised(e.target.value)}
              />
            </div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label className="form-label" style={{ fontSize: 10 }}>Details / Remarks</label>
            <input
              type="text" className="form-input" style={{ fontSize: 12 }}
              value={editDetails} onChange={e => setEditDetails(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
            <button type="button" className="btn btn-ghost btn-xs" onClick={() => setEditing(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-xs">Save Changes</button>
          </div>
        </form>
      )}

      {/* Bottom Status Chip (no separate change button!) */}
      {vo.status && !editing && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', pt: 8 }}>
          <Badge variant={voStatusVariant(vo.status)}>{vo.status}</Badge>
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
              onUpdateVO={(voId, patch) =>
                setVoList(prev => prev.map(v => v.vo_id === voId ? { ...v, ...patch } : v))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

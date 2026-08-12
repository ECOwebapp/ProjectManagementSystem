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

/* ─── Single VO Card Item ─────────────────────────────────────── */
function VOItem({ vo, projectNo, onDelete, onStatusChange, onUpdateVO }) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [authTitle, setAuthTitle]         = useState('');
  const [authDesc, setAuthDesc]           = useState('');

  // Dropdown menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Status picker state — opens freely
  const [editingStatus, setEditingStatus] = useState(false);
  const [statusOption, setStatusOption]   = useState('Approved');
  const [customStatus, setCustomStatus]   = useState('');

  // Amount edit state — opens freely
  const [editingAmount, setEditingAmount] = useState(false);
  const [editAmount, setEditAmount]     = useState(vo.amount ?? '');
  const [editRevised, setEditRevised]   = useState(vo.revised_amount ?? '');
  const [editDetails, setEditDetails]   = useState(vo.details ?? '');

  // Close dropdown on outside click
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

  /* ── Open forms freely (no password yet) ── */
  const openStatusPicker = () => {
    const current = vo.status || 'Subject for BOR Approval';
    if (current === 'Approved' || current === 'Subject for BOR Approval') {
      setStatusOption(current);
      setCustomStatus('');
    } else {
      setStatusOption('Other');
      setCustomStatus(current);
    }
    setEditingAmount(false);
    setEditingStatus(true);
    setMenuOpen(false);
  };

  const openEditAmount = () => {
    setEditAmount(vo.amount ?? '');
    setEditRevised(vo.revised_amount ?? '');
    setEditDetails(vo.details ?? '');
    setEditingStatus(false);
    setEditingAmount(true);
    setMenuOpen(false);
  };

  /* ── Execute saves (called after password passes) ── */
  const executeStatusSave = (finalStatus) => {
    const updated = updateVariationOrder(projectNo, vo.vo_id, { status: finalStatus });
    if (updated) onStatusChange(vo.vo_id, finalStatus);
    setEditingStatus(false);
    setPendingAction(null);
  };

  const executeAmountSave = (patch) => {
    updateVariationOrder(projectNo, vo.vo_id, patch);
    if (onUpdateVO) onUpdateVO(vo.vo_id, patch);
    setEditingAmount(false);
    setPendingAction(null);
  };

  const executeDelete = () => {
    deleteVariationOrder(projectNo, vo.vo_id);
    onDelete(vo.vo_id);
    setPendingAction(null);
  };

  /* ── Form submit handlers — password required here ── */
  const handleSaveStatus = (e) => {
    e.preventDefault();
    let finalStatus = statusOption;
    if (statusOption === 'Other') {
      if (!customStatus.trim()) return;
      finalStatus = customStatus.trim();
    }
    if (isAuthorized()) {
      executeStatusSave(finalStatus);
    } else {
      setAuthTitle('Authorization Required to Save');
      setAuthDesc(`Enter password to set status to "${finalStatus}".`);
      setPendingAction(() => () => executeStatusSave(finalStatus));
      setShowAuthModal(true);
    }
  };

  const handleSaveAmountEdit = (e) => {
    e.preventDefault();
    const parsedAmt = parseFloat(editAmount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) return;
    const patch = {
      amount: parsedAmt,
      revised_amount: editRevised ? parseFloat(editRevised) : null,
      details: editDetails.trim() || null,
    };
    if (isAuthorized()) {
      executeAmountSave(patch);
    } else {
      setAuthTitle('Authorization Required to Save');
      setAuthDesc('Enter password to save variation order changes.');
      setPendingAction(() => () => executeAmountSave(patch));
      setShowAuthModal(true);
    }
  };

  const handleDeleteClick = () => {
    setMenuOpen(false);
    if (!window.confirm('Are you sure you want to delete this variation order?')) return;
    if (isAuthorized()) {
      executeDelete();
    } else {
      setAuthTitle('Authorization Required to Delete');
      setAuthDesc('Enter password to delete this variation order.');
      setPendingAction(() => executeDelete);
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
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>
              Variation Order #{vo.vo_number}
            </span>
            <span className="vo-amount-bold">{formatCurrency(vo.amount)}</span>
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
              {/* Opens form directly — no password yet */}
              <button className="kebab-item" onClick={openStatusPicker}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <span>Change Status</span>
              </button>

              {/* Opens form directly — no password yet */}
              <button className="kebab-item" onClick={openEditAmount}>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', width: 14, textAlign: 'center', display: 'inline-block', lineHeight: 1 }}>₱</span>
                <span>Edit Amount</span>
              </button>

              <div className="kebab-divider" />

              {/* Password checked inside after confirm */}
              <button className="kebab-item danger" onClick={handleDeleteClick}>
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

      {/* Change Status Choice Picker — password only on Save */}
      {editingStatus && (
        <form onSubmit={handleSaveStatus} style={{ marginTop: 12, padding: 12, background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8, color: 'var(--navy)' }}>
            Select Status for VO #{vo.vo_number}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
              <input type="radio" name={`vo-status-${vo.vo_id}`} value="Approved"
                checked={statusOption === 'Approved'} onChange={() => setStatusOption('Approved')} />
              <span>Approved</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
              <input type="radio" name={`vo-status-${vo.vo_id}`} value="Subject for BOR Approval"
                checked={statusOption === 'Subject for BOR Approval'} onChange={() => setStatusOption('Subject for BOR Approval')} />
              <span>Subject for BOR Approval</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
              <input type="radio" name={`vo-status-${vo.vo_id}`} value="Other"
                checked={statusOption === 'Other'} onChange={() => setStatusOption('Other')} />
              <span>Other (Custom)</span>
            </label>
          </div>

          {statusOption === 'Other' && (
            <div style={{ marginBottom: 10 }}>
              <input
                type="text" className="form-input" autoFocus
                placeholder="Type custom status (e.g. Under Evaluation)..."
                value={customStatus} onChange={e => setCustomStatus(e.target.value)}
                style={{ fontSize: 12 }} required
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
            <button type="button" className="btn btn-ghost btn-xs" onClick={() => setEditingStatus(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-xs">Save Status</button>
          </div>
        </form>
      )}

      {/* Edit Amount Form — password only on Save */}
      {editingAmount && (
        <form onSubmit={handleSaveAmountEdit} style={{ marginTop: 12, padding: 12, background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8, color: 'var(--navy)' }}>
            Edit Variation Order #{vo.vo_number}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div>
              <label className="form-label" style={{ fontSize: 10 }}>VO Amount (₱)</label>
              <input type="number" step="0.01" min="0" className="form-input" style={{ fontSize: 12 }}
                value={editAmount} onChange={e => setEditAmount(e.target.value)} required />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: 10 }}>Revised Contract Amount (₱)</label>
              <input type="number" step="0.01" min="0" className="form-input" style={{ fontSize: 12 }}
                value={editRevised} onChange={e => setEditRevised(e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label className="form-label" style={{ fontSize: 10 }}>Details / Remarks</label>
            <input type="text" className="form-input" style={{ fontSize: 12 }}
              value={editDetails} onChange={e => setEditDetails(e.target.value)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
            <button type="button" className="btn btn-ghost btn-xs" onClick={() => setEditingAmount(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-xs">Save Changes</button>
          </div>
        </form>
      )}

      {/* Status Chip */}
      {vo.status && !editingStatus && !editingAmount && (
        <div style={{ marginTop: 10 }}>
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

  const todayISO = new Date().toISOString().split('T')[0];
  const [dateSubmitted, setDateSubmitted] = useState(todayISO);
  const [amount, setAmount] = useState('');
  const [revisedAmount, setRevisedAmount] = useState('');
  const [details, setDetails] = useState('');
  const [statusSelect, setStatusSelect] = useState('Subject for BOR Approval');
  const [customStatusAdd, setCustomStatusAdd] = useState('');
  const [error, setError] = useState('');

  const executeAddVO = (newVO) => {
    setVoList(prev => [...prev, newVO]);
    setAmount(''); setRevisedAmount(''); setDetails('');
    setStatusSelect('Subject for BOR Approval'); setCustomStatusAdd('');
    setDateSubmitted(todayISO); setShowAddForm(false);
    setPendingAction(null);
  };

  // Add form opens freely — password on Submit
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid VO amount.');
      return;
    }
    let finalStatus = statusSelect;
    if (statusSelect === 'Other') {
      if (!customStatusAdd.trim()) { setError('Please enter custom status.'); return; }
      finalStatus = customStatusAdd.trim();
    }
    setError('');
    const formattedDate = formatDateForDisplay(dateSubmitted);
    const payload = {
      date_submitted: formattedDate,
      amount: parseFloat(amount),
      revised_amount: revisedAmount ? parseFloat(revisedAmount) : null,
      details: details.trim() || null,
      status: finalStatus,
    };
    if (isAuthorized()) {
      executeAddVO(addVariationOrder(projectNo, payload));
    } else {
      setPendingAction(() => () => executeAddVO(addVariationOrder(projectNo, payload)));
      setShowAuthModal(true);
    }
  };

  return (
    <div className="card">
      <PasswordModal
        isOpen={showAuthModal}
        onClose={() => { setShowAuthModal(false); setPendingAction(null); }}
        onSuccess={() => { if (pendingAction) pendingAction(); }}
        title="Authorization Required to Save"
        description="Enter authorization password to save this variation order."
      />

      <div className="card-header">
        <h3 className="card-title">Variation Orders ({voList.length})</h3>
        {/* + Add VO opens freely */}
        {!showAddForm && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(true)}>
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
              <div style={{ color: 'var(--red)', fontSize: 11, marginBottom: 'var(--sp-2)', fontWeight: 600 }}>{error}</div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
              <div>
                <label className="form-label" style={{ fontSize: 11 }}>Date Submitted</label>
                <input type="date" className="form-input" value={dateSubmitted} onChange={e => setDateSubmitted(e.target.value)} />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: 11 }}>VO Amount (₱)</label>
                <input type="number" step="0.01" min="0" placeholder="e.g. 49026.70" className="form-input"
                  value={amount} onChange={e => setAmount(e.target.value)} required />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
              <div>
                <label className="form-label" style={{ fontSize: 11 }}>Revised Contract Amount due to VO (₱)</label>
                <input type="number" step="0.01" min="0" placeholder="Optional" className="form-input"
                  value={revisedAmount} onChange={e => setRevisedAmount(e.target.value)} />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: 11 }}>Status</label>
                <select className="form-select" value={statusSelect} onChange={e => setStatusSelect(e.target.value)}>
                  <option value="Approved">Approved</option>
                  <option value="Subject for BOR Approval">Subject for BOR Approval</option>
                  <option value="Other">Other (Custom)</option>
                </select>
                {statusSelect === 'Other' && (
                  <input type="text" className="form-input mt-2" placeholder="Enter custom status..."
                    value={customStatusAdd} onChange={e => setCustomStatusAdd(e.target.value)} style={{ fontSize: 12 }} required />
                )}
              </div>
            </div>
            <div style={{ marginBottom: 'var(--sp-3)' }}>
              <label className="form-label" style={{ fontSize: 11 }}>Details / Remarks (Optional)</label>
              <textarea className="form-textarea" rows={2} placeholder="Details of variation order..."
                value={details} onChange={e => setDetails(e.target.value)} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-2)' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setShowAddForm(false); setError(''); }}>
                Cancel
              </button>
              {/* Password checked here on submit */}
              <button type="submit" className="btn btn-primary btn-sm">Save Variation Order</button>
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

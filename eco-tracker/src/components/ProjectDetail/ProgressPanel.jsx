import { useState } from 'react';
import { updateProgress } from '../../data/projectsRepo.js';
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

/* ─── Circular SVG Donut ──────────────────────────────────────── */
function DonutChart({ actual = 0, target = 0 }) {
  const size   = 110;
  const stroke = 11;
  const r      = (size - stroke) / 2;
  const circ   = 2 * Math.PI * r;
  const cx     = size / 2;
  const cy     = size / 2;

  const clamp = (v) => Math.min(100, Math.max(0, v));
  const actualPct = clamp(actual);
  const targetPct = clamp(target);

  const dashActual = (actualPct / 100) * circ;
  const dashTarget = (targetPct / 100) * circ;

  const isAhead  = actual >= target;
  const color    = isAhead ? 'var(--c-green)' : 'var(--c-red)';

  return (
    <svg
      width={size}
      height={size}
      className="progress-donut-svg"
      viewBox={`0 0 ${size} ${size}`}
    >
      {/* Track */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="var(--c-border)"
        strokeWidth={stroke}
      />
      {/* Target ring (lighter) */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="#cbd5e1"
        strokeWidth={stroke - 3}
        strokeDasharray={`${dashTarget} ${circ - dashTarget}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray .5s cubic-bezier(.4,0,.2,1)' }}
      />
      {/* Actual fill */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${dashActual} ${circ - dashActual}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray .5s cubic-bezier(.4,0,.2,1)', filter: `drop-shadow(0 0 4px ${color}55)` }}
      />
      {/* Center text */}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="800" fill={color} fontFamily="Inter,sans-serif">
        {actualPct.toFixed(0)}%
      </text>
      <text x={cx} y={cy + 11} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--c-text-3)" fontFamily="Inter,sans-serif" letterSpacing=".04em">
        ACTUAL
      </text>
    </svg>
  );
}

export default function ProgressPanel({ projectNo, progressUpdates: initialUpdates = [] }) {
  const [puList, setPuList] = useState(initialUpdates);
  const [editing, setEditing] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const latest = puList.length > 0 ? puList[puList.length - 1] : {};

  const todayISO = new Date().toISOString().split('T')[0];
  const [actualInput, setActualInput] = useState(
    latest.actual_percent !== undefined && latest.actual_percent !== null ? latest.actual_percent : ''
  );
  const [targetInput, setTargetInput] = useState(
    latest.target_percent !== undefined && latest.target_percent !== null ? latest.target_percent : ''
  );
  const [asOfInput, setAsOfInput] = useState(
    latest.as_of_date ? latest.as_of_date : formatDateForDisplay(todayISO)
  );
  const [error, setError] = useState('');

  const openEdit = () => {
    setActualInput(latest.actual_percent !== undefined && latest.actual_percent !== null ? latest.actual_percent : '');
    setTargetInput(latest.target_percent !== undefined && latest.target_percent !== null ? latest.target_percent : '');
    setAsOfInput(latest.as_of_date ? latest.as_of_date : formatDateForDisplay(todayISO));
    setError('');
    setEditing(true);
  };

  const handleEditClick = () => {
    if (isAuthorized()) openEdit();
    else setShowAuthModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const actualVal = parseFloat(actualInput);
    const targetVal = parseFloat(targetInput);
    if (isNaN(actualVal) || actualVal < 0 || actualVal > 100) {
      setError('Please enter a valid Actual % (0–100).');
      return;
    }
    if (isNaN(targetVal) || targetVal < 0 || targetVal > 100) {
      setError('Please enter a valid Target % (0–100).');
      return;
    }
    setError('');
    const formattedDate = formatDateForDisplay(asOfInput);
    const updated = updateProgress(projectNo, {
      actual_percent: actualVal,
      target_percent: targetVal,
      as_of_date: formattedDate || null,
    });
    setPuList(prev => [...prev, updated]);
    setEditing(false);
  };

  const actual_percent    = latest.actual_percent ?? null;
  const target_percent    = latest.target_percent ?? null;
  const slippage_percent  = latest.slippage_percent ??
    (actual_percent != null && target_percent != null ? actual_percent - target_percent : null);
  const as_of_date        = latest.as_of_date ?? null;

  const slipClass  = (slippage_percent ?? 0) >= 0 ? 'slippage-positive' : 'slippage-negative';
  const barClass   = (slippage_percent ?? 0) >= 0 ? 'on-track' : 'behind';
  const actualPct  = Math.min(100, Math.max(0, actual_percent ?? 0));
  const targetPct  = Math.min(100, Math.max(0, target_percent ?? 0));

  const liveActual  = parseFloat(actualInput);
  const liveTarget  = parseFloat(targetInput);
  const liveSlippage = (!isNaN(liveActual) && !isNaN(liveTarget)) ? (liveActual - liveTarget) : null;

  return (
    <div className="card">
      <PasswordModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={openEdit}
        title="Unlock Progress Editing"
        description="Enter authorization password to edit progress data."
      />

      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--sp-3)' }}>
          <h3 className="card-title">
            <i className="fas fa-chart-line mr-2 text-success" style={{ fontSize: '0.95rem' }}></i>
            Progress &amp; Milestones
          </h3>
          {as_of_date && (
            <span className="text-muted text-xs" style={{ fontWeight: 500 }}>As of {as_of_date}</span>
          )}
        </div>
        {!editing && (
          <button
            className="btn btn-ghost btn-xs"
            onClick={handleEditClick}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <i className="fas fa-edit mr-1"></i> Edit
          </button>
        )}
      </div>

      {/* Edit Form */}
      {editing && (
        <div style={{ padding: 'var(--sp-4)', background: 'var(--c-gray-bg)', borderRadius: 'var(--r-md)', marginBottom: 'var(--sp-4)', border: '1px solid var(--c-border)' }}>
          <div style={{ fontWeight: 700, marginBottom: 'var(--sp-3)', fontSize: 'var(--text-sm)', color: 'var(--c-text)' }}>
            Update Progress
          </div>
          <form onSubmit={handleSave}>
            {error && (
              <div style={{ color: 'var(--c-red)', fontSize: 'var(--text-xs)', marginBottom: 'var(--sp-2)', fontWeight: 500 }}>
                {error}
              </div>
            )}
            <div style={{ marginBottom: 'var(--sp-3)' }}>
              <label className="form-label" style={{ fontSize: 'var(--text-xs)', marginBottom: 4, display: 'block' }}>
                As of Date
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. May 31, 2026"
                value={asOfInput}
                onChange={e => setAsOfInput(e.target.value)}
                style={{ width: '100%', fontSize: 'var(--text-sm)' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
              <div>
                <label className="form-label" style={{ fontSize: 'var(--text-xs)', marginBottom: 4, display: 'block' }}>
                  Actual Progress (%)
                </label>
                <input
                  type="number" step="0.001" min="0" max="100"
                  placeholder="e.g. 43.360"
                  className="form-input"
                  value={actualInput}
                  onChange={e => setActualInput(e.target.value)}
                  style={{ width: '100%', fontSize: 'var(--text-sm)' }}
                  required
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: 'var(--text-xs)', marginBottom: 4, display: 'block' }}>
                  Target Progress (%)
                </label>
                <input
                  type="number" step="0.001" min="0" max="100"
                  placeholder="e.g. 100.000"
                  className="form-input"
                  value={targetInput}
                  onChange={e => setTargetInput(e.target.value)}
                  style={{ width: '100%', fontSize: 'var(--text-sm)' }}
                  required
                />
              </div>
            </div>
            {liveSlippage !== null && (
              <div style={{ marginBottom: 'var(--sp-3)', fontSize: 'var(--text-xs)', fontWeight: 700 }}>
                Calculated Slippage:{' '}
                <span className={liveSlippage >= 0 ? 'slippage-positive' : 'slippage-negative'}>
                  {liveSlippage > 0 ? '+' : ''}{liveSlippage.toFixed(3)}%
                </span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-2)' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setError(''); }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Save Progress
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Display */}
      {puList.length === 0 && !editing ? (
        <div className="empty-state">No progress data available.</div>
      ) : (
        <>
          {/* Donut + stats */}
          <div className="progress-donut-wrap">
            <DonutChart actual={actualPct} target={targetPct} />

            <div className="progress-donut-stats">
              {/* Slippage banner */}
              {slippage_percent !== null && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 10px',
                  borderRadius: 'var(--r-sm)',
                  background: (slippage_percent >= 0) ? 'var(--c-green-bg)' : 'var(--c-red-bg)',
                  border: `1px solid ${(slippage_percent >= 0) ? 'rgba(5,150,105,.15)' : 'rgba(220,38,38,.15)'}`,
                  fontSize: 'var(--text-xs)',
                  fontWeight: 700,
                }}>
                  <i className={`fas ${slippage_percent >= 0 ? 'fa-check-circle text-success' : 'fa-exclamation-triangle text-danger'} mr-1`}></i>
                  <span style={{ color: slippage_percent >= 0 ? 'var(--c-green)' : 'var(--c-red)' }}>
                    {slippage_percent >= 0 ? 'On Track' : 'Behind Schedule'}
                  </span>
                  <span className={`slippage-value ${slipClass}`} style={{ marginLeft: 'auto' }}>
                    {slippage_percent > 0 ? '+' : ''}{slippage_percent.toFixed(3)}%
                  </span>
                </div>
              )}

              {/* Actual bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="text-xs text-muted" style={{ fontWeight: 600 }}>Actual</span>
                  <span className="text-xs" style={{ fontWeight: 700, color: 'var(--c-text)' }}>
                    {actual_percent != null ? `${actual_percent.toFixed(3)}%` : '—'}
                  </span>
                </div>
                <div className="progress-bar-wrap">
                  <div className={`progress-bar-fill ${barClass}`} style={{ width: `${actualPct}%` }} />
                </div>
              </div>

              {/* Target bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="text-xs text-muted" style={{ fontWeight: 600 }}>Target</span>
                  <span className="text-xs" style={{ fontWeight: 700, color: 'var(--c-text-3)' }}>
                    {target_percent != null ? `${target_percent.toFixed(3)}%` : '—'}
                  </span>
                </div>
                <div className="progress-bar-wrap">
                  <div className="progress-bar-fill target" style={{ width: `${targetPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

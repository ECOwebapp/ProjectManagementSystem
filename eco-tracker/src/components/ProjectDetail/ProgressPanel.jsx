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

/* ─── Circular SVG Gauge ──────────────────────────────────────── */
function CircularGauge({ actual = 0, isBehind = false }) {
  const size   = 120;
  const stroke = 10;
  const r      = (size - stroke) / 2;
  const circ   = 2 * Math.PI * r;
  const cx     = size / 2;
  const cy     = size / 2;

  const clamp = (v) => Math.min(100, Math.max(0, v));
  const actualPct = clamp(actual);
  const dashActual = (actualPct / 100) * circ;

  const gaugeColor = isBehind ? 'var(--red)' : 'var(--green)';

  return (
    <div className="gauge-svg-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        {/* Fill Arc */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={stroke}
          strokeDasharray={`${dashActual} ${circ - dashActual}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div className="gauge-center-text">
        <div className="gauge-val" style={{ color: gaugeColor }}>
          {actualPct.toFixed(0)}%
        </div>
        <div className="gauge-lbl">ACTUAL</div>
      </div>
    </div>
  );
}

export default function ProgressPanel({ projectNo, progressUpdates: initialUpdates = [] }) {
  const [puList, setPuList] = useState(initialUpdates);
  const [editing, setEditing] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingSave, setPendingSave] = useState(null);

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

  // Edit opens freely — no password required to open
  const openEdit = () => {
    setActualInput(latest.actual_percent !== undefined && latest.actual_percent !== null ? latest.actual_percent : '');
    setTargetInput(latest.target_percent !== undefined && latest.target_percent !== null ? latest.target_percent : '');
    setAsOfInput(latest.as_of_date ? latest.as_of_date : formatDateForDisplay(todayISO));
    setError('');
    setEditing(true);
  };

  const executeSave = (actualVal, targetVal, formattedDate) => {
    const updated = updateProgress(projectNo, {
      actual_percent: actualVal,
      target_percent: targetVal,
      as_of_date: formattedDate || null,
    });
    setPuList(prev => [...prev, updated]);
    setEditing(false);
    setPendingSave(null);
  };

  // Password required when clicking Save Progress
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
    if (isAuthorized()) {
      executeSave(actualVal, targetVal, formattedDate);
    } else {
      setPendingSave(() => () => executeSave(actualVal, targetVal, formattedDate));
      setShowAuthModal(true);
    }
  };

  const actual_percent    = latest.actual_percent ?? null;
  const target_percent    = latest.target_percent ?? null;
  const slippage_percent  = latest.slippage_percent ??
    (actual_percent != null && target_percent != null ? actual_percent - target_percent : null);
  const as_of_date        = latest.as_of_date ?? null;

  const isBehind   = (slippage_percent ?? 0) < 0;
  const actualPct  = Math.min(100, Math.max(0, actual_percent ?? 0));
  const targetPct  = Math.min(100, Math.max(0, target_percent ?? 0));

  const liveActual  = parseFloat(actualInput);
  const liveTarget  = parseFloat(targetInput);
  const liveSlippage = (!isNaN(liveActual) && !isNaN(liveTarget)) ? (liveActual - liveTarget) : null;

  return (
    <div className="card">
      <PasswordModal
        isOpen={showAuthModal}
        onClose={() => { setShowAuthModal(false); setPendingSave(null); }}
        onSuccess={() => { if (pendingSave) pendingSave(); }}
        title="Authorization Required to Save"
        description="Enter authorization password to save progress data."
      />

      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <h3 className="card-title">Progress & Milestones</h3>
          {as_of_date && (
            <span className="text-muted text-xs">As of {as_of_date}</span>
          )}
        </div>
        {!editing && (
          <button
            className="btn-outline-pill"
            onClick={openEdit}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <span>✎</span> Edit
          </button>
        )}
      </div>

      {/* Edit Form */}
      {editing && (
        <div style={{ padding: 'var(--sp-4)', background: 'var(--gray-light)', borderRadius: 'var(--r-md)', marginBottom: 'var(--sp-4)', border: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 700, marginBottom: 'var(--sp-3)', fontSize: 13, color: 'var(--navy)' }}>
            Update Progress
          </div>
          <form onSubmit={handleSave}>
            {error && (
              <div style={{ color: 'var(--red)', fontSize: 11, marginBottom: 'var(--sp-2)', fontWeight: 600 }}>
                {error}
              </div>
            )}
            <div style={{ marginBottom: 'var(--sp-3)' }}>
              <label className="form-label" style={{ fontSize: 11 }}>As of Date</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. May 31, 2026"
                value={asOfInput}
                onChange={e => setAsOfInput(e.target.value)}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
              <div>
                <label className="form-label" style={{ fontSize: 11 }}>Actual Progress (%)</label>
                <input
                  type="number" step="0.001" min="0" max="100"
                  placeholder="e.g. 43.360"
                  className="form-input"
                  value={actualInput}
                  onChange={e => setActualInput(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: 11 }}>Target Progress (%)</label>
                <input
                  type="number" step="0.001" min="0" max="100"
                  placeholder="e.g. 100.000"
                  className="form-input"
                  value={targetInput}
                  onChange={e => setTargetInput(e.target.value)}
                  required
                />
              </div>
            </div>
            {liveSlippage !== null && (
              <div style={{ marginBottom: 'var(--sp-3)', fontSize: 11, fontWeight: 700 }}>
                Calculated Slippage:{' '}
                <span style={{ color: liveSlippage >= 0 ? 'var(--green)' : 'var(--red)' }}>
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
          <div className="gauge-container">
            <CircularGauge actual={actualPct} isBehind={isBehind} />

            <div style={{ flex: 1 }}>
              {/* Slippage Banner */}
              {slippage_percent !== null && (
                <div className={`banner-slippage ${isBehind ? 'behind' : 'ontrack'}`}>
                  <span>{isBehind ? '⚠️' : '✓'}</span>
                  <span>
                    {isBehind ? 'Behind Schedule' : 'On Schedule'}{' '}
                    {slippage_percent > 0 ? '+' : ''}{slippage_percent.toFixed(3)}%
                  </span>
                </div>
              )}

              {/* Actual progress bar */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="text-xs text-muted" style={{ fontWeight: 600 }}>Actual</span>
                  <span className="text-xs mono" style={{ fontWeight: 700, color: isBehind ? 'var(--red)' : 'var(--green)' }}>
                    {actual_percent != null ? `${actual_percent.toFixed(3)}%` : '—'}
                  </span>
                </div>
                <div className="progress-track-thin">
                  <div
                    className="progress-fill-thin"
                    style={{
                      width: `${actualPct}%`,
                      background: isBehind ? 'var(--red)' : 'var(--green)',
                    }}
                  />
                </div>
              </div>

              {/* Target progress bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="text-xs text-muted" style={{ fontWeight: 600 }}>Target</span>
                  <span className="text-xs mono text-muted" style={{ fontWeight: 700 }}>
                    {target_percent != null ? `${target_percent.toFixed(3)}%` : '—'}
                  </span>
                </div>
                <div className="progress-track-thin">
                  <div
                    className="progress-fill-thin"
                    style={{ width: `${targetPct}%`, background: '#94A3B8' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

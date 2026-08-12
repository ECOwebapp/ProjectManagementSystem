// ProjectDetail.jsx — Detailed view for a single project
import { useState, useEffect } from 'react';
import { getProjectById, updateProjectHeader } from '../../data/projectsRepo.js';
import Badge, { categoryVariant, formatCurrency } from '../shared/Badge.jsx';
import PasswordModal, { isAuthorized } from '../shared/PasswordModal.jsx';
import ProgressPanel from './ProgressPanel.jsx';
import VariationOrdersPanel from './VariationOrdersPanel.jsx';
import IssuesPanel from './IssuesPanel.jsx';
import CommentThread from '../Comments/CommentThread.jsx';

export default function ProjectDetail({ projectNo, onBack }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Header Editing State
  const [editingHeader, setEditingHeader] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingSave, setPendingSave]     = useState(null);

  // Form State for Header
  const [projectName, setProjectName] = useState('');
  const [category, setCategory] = useState('On-going');
  const [projectIdCode, setProjectIdCode] = useState('');
  const [contractorsText, setContractorsText] = useState('');
  const [origAmount, setOrigAmount] = useState('');
  const [revisedAmount, setRevisedAmount] = useState('');
  const [origCompletion, setOrigCompletion] = useState('');
  const [newCompletion, setNewCompletion] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    getProjectById(projectNo)
      .then(data => {
        if (isMounted) {
          if (!data) setError('Project not found.');
          else setProject(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, [projectNo]);

  if (loading) return (
    <div className="loading-wrap">
      <div className="spinner" />
      <span>Loading project details...</span>
    </div>
  );

  if (error || !project) return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back to Projects</button>
      <div className="error-box mt-3">
        <strong>Error:</strong> {error || 'Project not found'}
      </div>
    </div>
  );

  const contractorNames = (project.contractors || []).map(c => c.contractor_name).filter(Boolean);

  const openHeaderEdit = () => {
    setProjectName(project.project_name || '');
    setCategory(project.category || 'On-going');
    setProjectIdCode(project.project_id_code || '');
    setContractorsText(contractorNames.join(', '));
    setOrigAmount(project.original_contract_amount !== null && project.original_contract_amount !== undefined ? project.original_contract_amount : '');
    setRevisedAmount(project.revised_contract_amount !== null && project.revised_contract_amount !== undefined ? project.revised_contract_amount : '');
    setOrigCompletion(project.original_completion_date || '');
    setNewCompletion(project.new_completion_date || '');
    setEditingHeader(true);
  };

  const executeHeaderSave = () => {
    const updatedContractors = contractorsText
      .split(/[,;\n]/)
      .map(s => s.trim())
      .filter(Boolean);

    const patch = {
      project_name: projectName.trim(),
      category: category,
      project_id_code: projectIdCode.trim() || null,
      contractor_names: updatedContractors,
      original_contract_amount: origAmount ? parseFloat(origAmount) : null,
      revised_contract_amount: revisedAmount ? parseFloat(revisedAmount) : null,
      original_completion_date: origCompletion.trim() || null,
      new_completion_date: newCompletion.trim() || null,
    };

    updateProjectHeader(project.project_no, patch);

    setProject(prev => ({
      ...prev,
      ...patch,
      contractors: updatedContractors.map(name => ({ contractor_name: name })),
    }));

    setEditingHeader(false);
    setPendingSave(null);
  };

  const handleSaveHeaderSubmit = (e) => {
    e.preventDefault();
    if (isAuthorized()) {
      executeHeaderSave();
    } else {
      setPendingSave(() => executeHeaderSave);
      setShowAuthModal(true);
    }
  };

  const borderLeftColor = project.category === 'On-going' ? 'var(--green)'
    : project.category === 'Proposed' ? 'var(--orange)'
    : 'var(--gray)';

  const hasRevisedAmount = project.revised_contract_amount != null && project.revised_contract_amount !== project.original_contract_amount;
  const hasNewCompletion = Boolean(project.new_completion_date && project.new_completion_date !== project.original_completion_date);

  return (
    <div>
      <PasswordModal
        isOpen={showAuthModal}
        onClose={() => { setShowAuthModal(false); setPendingSave(null); }}
        onSuccess={() => { if (pendingSave) pendingSave(); }}
        title="Authorization Required to Save"
        description="Enter authorization password to save project header changes."
      />

      {/* Header Info Card */}
      <div className="detail-header-card" style={{ borderLeft: `4px solid ${borderLeftColor}` }}>
        <div className="detail-header-top">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--sp-4)' }}>
            <div style={{ flex: 1 }}>
              {!editingHeader ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
                    <Badge variant={categoryVariant(project.category)}>{project.category}</Badge>
                    {project.project_id_code && (
                      <span className="mono text-xs" style={{ background: 'var(--gray-light)', padding: '2px 8px', borderRadius: 999, color: 'var(--gray)', fontWeight: 600 }}>
                        {project.project_id_code}
                      </span>
                    )}
                    {project.source === 'local' && (
                      <span className="badge badge-amber" style={{ fontSize: 10 }}>LOCAL</span>
                    )}
                  </div>
                  <h1 className="detail-title">
                    {project.project_name}
                  </h1>
                </>
              ) : (
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>
                  ✎ Edit Project Information
                </div>
              )}
            </div>

            {!editingHeader && (
              <button
                className="btn-outline-pill"
                onClick={openHeaderEdit}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
              >
                <span>✎</span> Edit Header
              </button>
            )}
          </div>

          {editingHeader && (
            <form onSubmit={handleSaveHeaderSubmit} style={{ marginTop: 'var(--sp-4)', padding: 'var(--sp-4)', background: 'var(--gray-light)', borderRadius: 'var(--r-lg)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
                <div>
                  <label className="form-label" style={{ fontSize: 11 }}>Category</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    <option value="On-going">On-going</option>
                    <option value="Proposed">Proposed</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: 11 }}>Project Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: 11 }}>Project Code / ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 25CSU02"
                    value={projectIdCode}
                    onChange={e => setProjectIdCode(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 'var(--sp-3)' }}>
                <label className="form-label" style={{ fontSize: 11 }}>Awarded Contractor(s) (comma separated)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Contractor A, Contractor B"
                  value={contractorsText}
                  onChange={e => setContractorsText(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
                <div>
                  <label className="form-label" style={{ fontSize: 11 }}>Original Amount (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="Original amount"
                    value={origAmount}
                    onChange={e => setOrigAmount(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: 11 }}>Revised Amount (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="Revised amount"
                    value={revisedAmount}
                    onChange={e => setRevisedAmount(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: 11 }}>Original Completion</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. August 9, 2026"
                    value={origCompletion}
                    onChange={e => setOrigCompletion(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: 11 }}>New Completion</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. November 9, 2026"
                    value={newCompletion}
                    onChange={e => setNewCompletion(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-2)' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setEditingHeader(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Save Header Changes
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 5-Column Info Grid */}
        {!editingHeader && (
          <div className="detail-info-grid">
            <div className="detail-grid-cell">
              <div className="cell-label">Contractor</div>
              <div className="cell-value">
                {contractorNames.length > 0 ? contractorNames.join(', ') : 'N/A'}
              </div>
            </div>

            <div className="detail-grid-cell">
              <div className="cell-label">Original Amount</div>
              <div className="cell-value value-mono">
                {formatCurrency(project.original_contract_amount)}
              </div>
            </div>

            <div className="detail-grid-cell">
              <div className="cell-label">Revised Amount</div>
              <div className={`cell-value ${hasRevisedAmount ? 'value-blue' : 'value-mono'}`}>
                {formatCurrency(project.revised_contract_amount)}
              </div>
            </div>

            <div className="detail-grid-cell">
              <div className="cell-label">Original Completion</div>
              <div className="cell-value">
                {project.original_completion_date || 'N/A'}
              </div>
            </div>

            <div className="detail-grid-cell">
              <div className="cell-label">New Completion</div>
              <div className={`cell-value ${hasNewCompletion ? 'value-orange' : ''}`}>
                {project.new_completion_date || 'N/A'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Progress & Variation Orders */}
      <div className="detail-grid">
        <ProgressPanel projectNo={project.project_no} progressUpdates={project.progressUpdates} />
        <VariationOrdersPanel projectNo={project.project_no} variationOrders={project.variationOrders} />
      </div>

      {/* Issues & Remarks */}
      <IssuesPanel projectNo={project.project_no} issues={project.issues} generalRemarks={project.general_remarks} />

      {/* Comment Discussion Thread */}
      <CommentThread projectNo={project.project_no} />
    </div>
  );
}

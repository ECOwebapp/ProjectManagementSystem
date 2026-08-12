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
      <button className="back-btn" onClick={onBack}>← Back to Projects</button>
      <div className="error-box">
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

  const handleEditHeaderClick = () => {
    if (isAuthorized()) {
      openHeaderEdit();
    } else {
      setShowAuthModal(true);
    }
  };

  const handleSaveHeader = (e) => {
    e.preventDefault();
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

    // Update local state
    setProject(prev => ({
      ...prev,
      ...patch,
      contractors: updatedContractors.map(name => ({ contractor_name: name })),
    }));

    setEditingHeader(false);
  };

  return (
    <div>
      <button className="back-btn" onClick={onBack}>
        <i className="fas fa-arrow-left mr-1"></i> Back to Projects
      </button>

      <PasswordModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={openHeaderEdit}
        title="Unlock Header Editing"
        description="Enter authorization password to edit project details."
      />

      {/* Header card — premium with accent border */}
      <div
        className="card"
        style={{
          marginBottom: 'var(--sp-4)',
          borderLeft: `5px solid ${
            project.category === 'On-going' ? 'var(--c-green)' :
            project.category === 'Proposed' ? 'var(--c-amber)' :
            project.category === 'Completed' ? 'var(--c-gray)' :
            'var(--c-primary)'
          }`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--sp-4)', marginBottom: 'var(--sp-4)' }}>
          <div style={{ flex: 1 }}>
            {!editingHeader ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap', marginBottom: 'var(--sp-2)' }}>
                  <Badge variant={categoryVariant(project.category)}>{project.category}</Badge>
                  {project.project_id_code && (
                    <span style={{
                      fontSize: 'var(--text-xs)', fontFamily: 'monospace', fontWeight: 700,
                      background: 'var(--c-gray-bg)', color: 'var(--c-text-3)',
                      padding: '2px 8px', borderRadius: 'var(--r-sm)',
                      border: '1px solid var(--c-border)', letterSpacing: '.04em',
                    }}>
                      {project.project_id_code}
                    </span>
                  )}
                  {project.source === 'local' && <span className="local-tag">LOCAL</span>}
                </div>
                <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.25 }}>
                  {project.project_name}
                </h1>
              </>
            ) : (
              <div style={{ fontWeight: 700, fontSize: 'var(--text-md)', marginBottom: 'var(--sp-3)' }}>
                <i className="fas fa-edit mr-1"></i> Edit Project Information
              </div>
            )}
          </div>

          {!editingHeader && (
            <button
              className="btn btn-ghost btn-xs"
              onClick={handleEditHeaderClick}
              style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
            >
              <i className="fas fa-edit mr-1"></i> Edit Header
            </button>
          )}
        </div>

        {editingHeader ? (
          <form onSubmit={handleSaveHeader} style={{ marginTop: 'var(--sp-3)', padding: 'var(--sp-4)', background: 'var(--c-gray-bg)', borderRadius: 'var(--r-md)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
              <div>
                <label className="form-label" style={{ fontSize: 'var(--text-xs)', marginBottom: 4, display: 'block' }}>
                  Category
                </label>
                <select
                  className="form-select"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{ width: '100%', fontSize: 'var(--text-sm)' }}
                >
                  <option value="On-going">On-going</option>
                  <option value="Proposed">Proposed</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: 'var(--text-xs)', marginBottom: 4, display: 'block' }}>
                  Project Name
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  style={{ width: '100%', fontSize: 'var(--text-sm)' }}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: 'var(--text-xs)', marginBottom: 4, display: 'block' }}>
                  Project Code / ID
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 25CSU02"
                  value={projectIdCode}
                  onChange={e => setProjectIdCode(e.target.value)}
                  style={{ width: '100%', fontSize: 'var(--text-sm)' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 'var(--sp-3)' }}>
              <label className="form-label" style={{ fontSize: 'var(--text-xs)', marginBottom: 4, display: 'block' }}>
                Awarded Contractor(s) (comma separated for multiple)
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Contractor A, Contractor B"
                value={contractorsText}
                onChange={e => setContractorsText(e.target.value)}
                style={{ width: '100%', fontSize: 'var(--text-sm)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
              <div>
                <label className="form-label" style={{ fontSize: 'var(--text-xs)', marginBottom: 4, display: 'block' }}>
                  Original Amount (₱)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="Original contract amount"
                  value={origAmount}
                  onChange={e => setOrigAmount(e.target.value)}
                  style={{ width: '100%', fontSize: 'var(--text-sm)' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: 'var(--text-xs)', marginBottom: 4, display: 'block' }}>
                  Revised Amount (₱)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="Revised contract amount"
                  value={revisedAmount}
                  onChange={e => setRevisedAmount(e.target.value)}
                  style={{ width: '100%', fontSize: 'var(--text-sm)' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: 'var(--text-xs)', marginBottom: 4, display: 'block' }}>
                  Original Completion
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. August 9, 2026"
                  value={origCompletion}
                  onChange={e => setOrigCompletion(e.target.value)}
                  style={{ width: '100%', fontSize: 'var(--text-sm)' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: 'var(--text-xs)', marginBottom: 4, display: 'block' }}>
                  New Completion
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. November 9, 2026"
                  value={newCompletion}
                  onChange={e => setNewCompletion(e.target.value)}
                  style={{ width: '100%', fontSize: 'var(--text-sm)' }}
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
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 0,
            marginTop: 'var(--sp-4)',
            borderTop: '1px solid var(--c-border)',
            background: 'var(--c-gray-bg)',
            borderRadius: '0 0 var(--r-md) var(--r-md)',
            overflow: 'hidden',
          }}>
            {[
              {
                label: 'Awarded Contractor(s)',
                value: contractorNames.length > 0 ? contractorNames.join(', ') : 'N/A',
                style: {},
              },
              {
                label: 'Original Contract Amount',
                value: formatCurrency(project.original_contract_amount),
                style: { fontFamily: 'monospace', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--c-text-2)' },
              },
              {
                label: 'Revised Contract Amount',
                value: formatCurrency(project.revised_contract_amount),
                style: { fontFamily: 'monospace', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--c-primary)' },
              },
              {
                label: 'Original Completion',
                value: project.original_completion_date || 'N/A',
                style: {},
              },
              {
                label: 'New Completion',
                value: project.new_completion_date || 'N/A',
                style: { fontWeight: 700, color: project.new_completion_date ? 'var(--c-amber)' : 'inherit' },
              },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: 'var(--sp-4) var(--sp-5)',
                  borderLeft: idx > 0 ? '1px solid var(--c-border)' : 'none',
                }}
              >
                <div className="kv-label" style={{ marginBottom: 4 }}>{item.label}</div>
                <div className="kv-value" style={item.style}>{item.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid: Progress, Variation Orders, Issues */}
      <div className="detail-grid">
        <ProgressPanel projectNo={project.project_no} progressUpdates={project.progressUpdates} />
        <VariationOrdersPanel projectNo={project.project_no} variationOrders={project.variationOrders} />
      </div>

      <IssuesPanel projectNo={project.project_no} issues={project.issues} generalRemarks={project.general_remarks} />

      {/* Comment Thread */}
      <CommentThread projectNo={project.project_no} />
    </div>
  );
}


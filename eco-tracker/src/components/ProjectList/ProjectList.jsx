// ProjectList.jsx — Project list with stat cards & redesigned table
import { useState, useEffect } from 'react';
import { getProjects, deleteProject } from '../../data/projectsRepo.js';
import FilterBar from '../shared/FilterBar.jsx';
import Badge, { categoryVariant, formatCurrency } from '../shared/Badge.jsx';
import AddProjectForm from '../Forms/AddProjectForm.jsx';
import PasswordModal, { isAuthorized } from '../shared/PasswordModal.jsx';

function isInternalContractor(name = '') {
  const lower = name.toLowerCase();
  return lower.includes('administration') || lower.includes('admin') || lower.includes('internal');
}

function StatsBar({ projects }) {
  const total     = projects.length;
  const ongoing   = projects.filter(p => p.category === 'On-going').length;
  const proposed  = projects.filter(p => p.category === 'Proposed').length;
  const completed = projects.filter(p => p.category === 'Completed').length;

  return (
    <div className="stats-bar">
      <div className="stat-card stat-total">
        <div className="stat-icon total">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="7" y1="8" x2="17" y2="8"></line>
            <line x1="7" y1="12" x2="17" y2="12"></line>
            <line x1="7" y1="16" x2="13" y2="16"></line>
          </svg>
        </div>
        <div className="stat-info">
          <div className="stat-value total">{total}</div>
          <div className="stat-label">Total Projects</div>
        </div>
      </div>

      <div className="stat-card stat-ongoing">
        <div className="stat-icon ongoing">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path>
            <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path>
            <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"></path>
            <path d="M10 6h4"></path>
            <path d="M10 10h4"></path>
            <path d="M10 14h4"></path>
            <path d="M10 18h4"></path>
          </svg>
        </div>
        <div className="stat-info">
          <div className="stat-value ongoing">{ongoing}</div>
          <div className="stat-label">On-going</div>
        </div>
      </div>

      <div className="stat-card stat-proposed">
        <div className="stat-icon proposed">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div className="stat-info">
          <div className="stat-value proposed">{proposed}</div>
          <div className="stat-label">Proposed</div>
        </div>
      </div>

      <div className="stat-card stat-completed">
        <div className="stat-icon completed">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <div className="stat-info">
          <div className="stat-value completed">{completed}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectList({ onSelectProject }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showAddProject, setShowAddProject] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const executeDelete = async () => {
    if (!deletingProject) return;
    setDeleting(true);
    try {
      await deleteProject(deletingProject.project_no);
      setDeletingProject(null);
      load();
    } catch (e) {
      alert(`Failed to delete project: ${e.message}`);
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  const handleDelete = () => {
    if (!deletingProject) return;
    if (isAuthorized()) {
      executeDelete();
    } else {
      setPendingDelete(() => executeDelete);
      setShowAuthModal(true);
    }
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = projects.filter(p => {
    const matchCat = filter === 'All' || p.category === filter;
    const matchSearch = !search ||
      (p.project_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.project_id_code || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.contractors || []).some(c => (c.contractor_name || '').toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  if (loading) return (
    <div className="loading-wrap">
      <div className="spinner" />
      <span>Loading projects…</span>
    </div>
  );

  if (error) return (
    <div className="error-box">
      <strong>Failed to load data.</strong> {error}
    </div>
  );

  const counts = {
    All: projects.length,
    'On-going': projects.filter(p => p.category === 'On-going').length,
    Proposed: projects.filter(p => p.category === 'Proposed').length,
    Completed: projects.filter(p => p.category === 'Completed').length,
  };

  const catClass = (cat) => {
    if (cat === 'On-going') return 'cat-ongoing';
    if (cat === 'Proposed') return 'cat-proposed';
    if (cat === 'Completed') return 'cat-completed';
    return '';
  };

  return (
    <div>
      <StatsBar projects={projects} />

      <div className="page-header">
        <div className="page-title-row">
          <div className="page-icon-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div>
            <h1 className="page-title">Infrastructure Projects</h1>
            <p className="page-subtitle">
              Showing {filtered.length} of {projects.length} projects
              {filter !== 'All' ? ` · ${filter}` : ''}
              {search ? ` · searching "${search}"` : ''}
            </p>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddProject(true)}
        >
          + Add Project
        </button>
      </div>

      <FilterBar
        activeFilter={filter}
        onFilterChange={setFilter}
        searchQuery={search}
        onSearchChange={setSearch}
        counts={counts}
      />

      <div className="table-container">
        {filtered.length === 0 ? (
          <div className="empty-state">No projects match your filters.</div>
        ) : (
          <table className="project-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>Project Name</th>
                <th>Category</th>
                <th>Contractor(s)</th>
                <th>Contract Amount</th>
                <th>Completion Date</th>
                <th style={{ width: 140, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const amount = p.revised_contract_amount ?? p.original_contract_amount;
                const contractorNames = (p.contractors || []).map(c => c.contractor_name).filter(Boolean);
                const completionDate = p.new_completion_date || p.original_completion_date;

                return (
                  <tr
                    key={p.project_no}
                    className={`project-row ${catClass(p.category)}`}
                    onClick={() => onSelectProject(p.project_no)}
                  >
                    <td className="text-muted text-xs" style={{ fontWeight: 600 }}>{i + 1}</td>
                    <td>
                      <div className="project-name-cell">{p.project_name}</div>
                      {p.project_id_code && (
                        <div className="project-code-text">
                          {p.project_id_code}
                          {p.source === 'local' && <span className="local-tag" style={{ marginLeft: 6 }}>LOCAL</span>}
                        </div>
                      )}
                    </td>
                    <td>
                      <Badge variant={categoryVariant(p.category)}>{p.category}</Badge>
                    </td>
                    <td style={{ maxWidth: 220 }}>
                      {contractorNames.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                          {contractorNames.map((n, i2) => {
                            const isInternal = isInternalContractor(n);
                            return (
                              <span key={i2} className={isInternal ? "chip-contractor-internal" : "chip-contractor"}>
                                {n}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="chip-contractor-muted">Not yet awarded</span>
                      )}
                    </td>
                    <td>
                      {amount != null ? (
                        <span className="contract-amount-text">
                          {formatCurrency(amount)}
                        </span>
                      ) : (
                        <span className="text-pending">Not yet costed</span>
                      )}
                    </td>

                    <td className="text-sm text-muted" style={{ whiteSpace: 'nowrap' }}>
                      {completionDate ? completionDate : <span className="text-pending">TBD</span>}
                    </td>
                    <td onClick={(e) => e.stopPropagation()} style={{ width: 84 }}>
                       <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                         <button
                           title="Edit project"
                           className="action-btn action-btn-edit"
                           onClick={() => setEditingProject(p)}
                         >
                           <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                             <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                           </svg>
                         </button>
                         <button
                           title="Delete project"
                           className="action-btn action-btn-delete"
                           onClick={() => setDeletingProject(p)}
                         >
                           <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                             <polyline points="3 6 5 6 21 6" />
                             <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                             <line x1="10" y1="11" x2="10" y2="17" />
                             <line x1="14" y1="11" x2="14" y2="17" />
                           </svg>
                         </button>
                       </div>
                     </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showAddProject && (
        <AddProjectForm
          onClose={() => setShowAddProject(false)}
          onSaved={() => { setShowAddProject(false); load(); }}
        />
      )}

      {editingProject && (
        <AddProjectForm
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSaved={() => { setEditingProject(null); load(); }}
        />
      )}

      {deletingProject && (
        <div className="modal-overlay" onClick={() => setDeletingProject(null)}>
          <PasswordModal
            isOpen={showAuthModal}
            onClose={() => { setShowAuthModal(false); setPendingDelete(null); }}
            onSuccess={() => { if (pendingDelete) pendingDelete(); }}
            title="Authorization Required to Delete"
            description="Enter authorization password to delete this project."
          />
          <div className="add-project-modal" style={{ maxWidth: 450, padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center' }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'var(--red-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--red)',
                marginBottom: 8
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </div>
              <div>
                <h3 className="modal-header-title" style={{ fontSize: 18, marginBottom: 8 }}>Delete Project</h3>
                <p className="page-subtitle" style={{ fontSize: 13, color: 'var(--gray)', padding: '0 12px' }}>
                  Are you sure you want to delete <strong>{deletingProject.project_name}</strong>? This action cannot be undone and will permanently delete all related issues, progress updates, variation orders, and comments.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setDeletingProject(null)} disabled={deleting}>
                Cancel
              </button>
              <button className="btn" style={{ background: 'var(--red)', color: '#fff', borderColor: 'var(--red)' }} onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

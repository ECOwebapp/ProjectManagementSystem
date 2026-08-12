// ProjectList.jsx — Project list with stat cards & redesigned table
import { useState, useEffect } from 'react';
import { getProjects } from '../../data/projectsRepo.js';
import FilterBar from '../shared/FilterBar.jsx';
import Badge, { categoryVariant, progressVariant, progressLabel, formatCurrency } from '../shared/Badge.jsx';
import AddProjectForm from '../Forms/AddProjectForm.jsx';

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
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showAddProject, setShowAddProject] = useState(false);

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
        <div>
          <h1 className="page-title">ECO Infrastructure Projects</h1>
          <p className="page-subtitle">
            {filtered.length} project{filtered.length !== 1 ? 's' : ''} shown
            {filter !== 'All' ? ` · ${filter}` : ''}
            {search ? ` · searching "${search}"` : ''}
          </p>
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
                <th>Progress</th>
                <th>Completion Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const progress = p.progressUpdates?.[0] ?? null;
                const slip = progress?.slippage_percent ?? null;
                const amount = p.revised_contract_amount ?? p.original_contract_amount;
                const contractorNames = (p.contractors || []).map(c => c.contractor_name).filter(Boolean);
                const completionDate = p.new_completion_date || p.original_completion_date;

                const fillClass = slip === null || slip === undefined ? 'fill-gray'
                  : slip >= 0 ? 'fill-green'
                  : slip >= -10 ? 'fill-amber'
                  : 'fill-red';

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
                          {contractorNames.map((n, i2) => (
                            <span key={i2} className="chip-contractor">{n}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      {amount != null ? (
                        <span className="contract-amount-text">
                          {formatCurrency(amount)}
                        </span>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td>
                      {progress && progress.actual_percent != null ? (
                        <div className="progress-column-wrap">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="text-xs text-muted" style={{ fontWeight: 600 }}>
                              {progress.actual_percent?.toFixed(1)}%
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: (slip ?? 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                              {progressLabel(slip)}
                            </span>
                          </div>
                          <div className="progress-track-thin">
                            <div
                              className={`progress-fill-thin ${fillClass}`}
                              style={{ width: `${Math.min(100, Math.max(0, progress.actual_percent ?? 0))}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="text-sm text-muted" style={{ whiteSpace: 'nowrap' }}>
                      {completionDate || '—'}
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
    </div>
  );
}

// ProjectList.jsx — Project list with SB Admin 2 Stat Cards & Data Table styling
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
    <div className="row mb-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
      {/* Total Projects Card */}
      <div className="card border-left-primary shadow py-2">
        <div className="card-body py-2">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                Total Projects
              </div>
              <div className="h4 mb-0 font-weight-bold text-gray-800">{total}</div>
            </div>
            <div>
              <i className="fas fa-clipboard-list fa-2x text-gray-300"></i>
            </div>
          </div>
        </div>
      </div>

      {/* On-going Card */}
      <div className="card border-left-success shadow py-2">
        <div className="card-body py-2">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                On-going
              </div>
              <div className="h4 mb-0 font-weight-bold text-gray-800">{ongoing}</div>
            </div>
            <div>
              <i className="fas fa-hard-hat fa-2x text-gray-300"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Proposed Card */}
      <div className="card border-left-warning shadow py-2">
        <div className="card-body py-2">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                Proposed
              </div>
              <div className="h4 mb-0 font-weight-bold text-gray-800">{proposed}</div>
            </div>
            <div>
              <i className="fas fa-file-invoice fa-2x text-gray-300"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Completed Card */}
      <div className="card border-left-info shadow py-2">
        <div className="card-body py-2">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                Completed
              </div>
              <div className="h4 mb-0 font-weight-bold text-gray-800">{completed}</div>
            </div>
            <div>
              <i className="fas fa-check-circle fa-2x text-gray-300"></i>
            </div>
          </div>
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
    <div className="text-center py-5 text-gray-500">
      <i className="fas fa-spinner fa-spin fa-2x mb-3 text-primary"></i>
      <div>Loading projects…</div>
    </div>
  );

  if (error) return (
    <div className="alert alert-danger shadow-sm">
      <i className="fas fa-exclamation-triangle mr-2"></i>
      <strong>Failed to load data.</strong> {error}
    </div>
  );

  const counts = {
    All: projects.length,
    'On-going': projects.filter(p => p.category === 'On-going').length,
    Proposed: projects.filter(p => p.category === 'Proposed').length,
    Completed: projects.filter(p => p.category === 'Completed').length,
  };

  return (
    <div>
      <StatsBar projects={projects} />

      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="h3 mb-0 font-weight-bold text-gray-800">
            ECO Infrastructure Projects
          </h1>
          <p className="text-muted text-xs mb-0 mt-1">
            {filtered.length} project{filtered.length !== 1 ? 's' : ''} listed
            {filter !== 'All' ? ` · Filtered by ${filter}` : ''}
            {search ? ` · Searching "${search}"` : ''}
          </p>
        </div>
        <button
          className="btn btn-primary shadow-sm"
          onClick={() => setShowAddProject(true)}
        >
          <i className="fas fa-plus fa-sm text-white-50 mr-1"></i> Add Project
        </button>
      </div>

      <FilterBar
        activeFilter={filter}
        onFilterChange={setFilter}
        searchQuery={search}
        onSearchChange={setSearch}
        counts={counts}
      />

      <div className="card shadow mb-4" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-folder-open fa-2x mb-2 text-gray-300"></i>
            <div>No projects match your filters.</div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="project-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>#</th>
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

                  return (
                    <tr
                      key={p.project_no}
                      className="project-row"
                      onClick={() => onSelectProject(p.project_no)}
                    >
                      <td className="text-muted text-xs font-weight-bold">{i + 1}</td>
                      <td>
                        <span className="project-name-cell">{p.project_name}</span>
                        {p.source === 'local' && <span className="local-tag">LOCAL</span>}
                        {p.project_id_code && (
                          <div className="text-muted text-xs mt-1 mono">
                            {p.project_id_code}
                          </div>
                        )}
                      </td>
                      <td>
                        <Badge variant={categoryVariant(p.category)}>{p.category}</Badge>
                      </td>
                      <td className="text-sm" style={{ maxWidth: 200, color: '#5a5c69' }}>
                        {contractorNames.length > 0
                          ? contractorNames.map((n, i2) => (
                            <div key={i2} style={i2 > 0 ? { marginTop: 2 } : {}}>{n}</div>
                          ))
                          : <span className="text-muted">—</span>}
                      </td>
                      <td>
                        {amount != null ? (
                          <span className="font-weight-bold text-primary mono text-sm">
                            {formatCurrency(amount)}
                          </span>
                        ) : <span className="text-muted">—</span>}
                      </td>
                      <td>
                        {progress ? (
                          <div style={{ minWidth: 110 }}>
                            <div className="d-flex align-items-center justify-content-between mb-1">
                              <Badge variant={progressVariant(slip)}>{progressLabel(slip)}</Badge>
                              <span className="text-xs text-muted font-weight-bold ml-1">
                                {progress.actual_percent?.toFixed(1)}%
                              </span>
                            </div>
                            <div className="progress-bar-wrap" style={{ margin: 0 }}>
                              <div
                                className={`progress-bar-fill ${(slip ?? 0) >= 0 ? 'on-track' : 'behind'}`}
                                style={{ width: `${Math.min(100, Math.max(0, progress.actual_percent ?? 0))}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="text-sm text-gray-700" style={{ whiteSpace: 'nowrap' }}>
                        {completionDate || <span className="text-muted">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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

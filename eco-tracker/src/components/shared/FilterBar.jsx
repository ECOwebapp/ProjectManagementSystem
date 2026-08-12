// FilterBar.jsx — Category filter tabs + search bar
export default function FilterBar({ activeFilter, onFilterChange, searchQuery, onSearchChange, counts = {} }) {
  const tabs = ['All', 'On-going', 'Proposed', 'Completed'];

  return (
    <div className="filter-bar">
      <div className="tab-group-container">
        {tabs.map(t => (
          <button
            key={t}
            className={`tab-btn${activeFilter === t ? ' active' : ''}`}
            onClick={() => onFilterChange(t)}
          >
            <span>{t}</span>
            {counts[t] !== undefined && (
              <span className="tab-count">{counts[t]}</span>
            )}
          </button>
        ))}
      </div>

      <div className="search-input-wrap">
        <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          placeholder="Search projects…"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}

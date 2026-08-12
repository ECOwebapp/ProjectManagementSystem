// FilterBar.jsx — Category filter tabs + search
export default function FilterBar({ activeFilter, onFilterChange, searchQuery, onSearchChange, counts = {} }) {
  const tabs = ['All', 'On-going', 'Proposed', 'Completed'];
  return (
    <div className="filter-bar">
      <div className="tab-group">
        {tabs.map(t => (
          <button
            key={t}
            className={`tab-btn${activeFilter === t ? ' active' : ''}`}
            onClick={() => onFilterChange(t)}
          >
            {t}
            {counts[t] !== undefined && (
              <span className="tab-count">{counts[t]}</span>
            )}
          </button>
        ))}
      </div>

      <div className="search-input-wrap">
        <span className="search-icon">🔍</span>
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

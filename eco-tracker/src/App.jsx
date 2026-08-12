// App.jsx — Router & main Shell layout
import { useState } from 'react';
import ProjectList from './components/ProjectList/ProjectList.jsx';
import ProjectDetail from './components/ProjectDetail/ProjectDetail.jsx';

export default function App() {
  const [selectedProjectNo, setSelectedProjectNo] = useState(null);

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <a href="#" className="logo" onClick={(e) => { e.preventDefault(); setSelectedProjectNo(null); }}>
          <div className="logo-icon">ECO</div>
          <div>
            <div className="logo-text">Infrastructure Tracker</div>
            <div className="logo-sub">Caraga State University</div>
          </div>
        </a>

        <div className="header-right">
          {selectedProjectNo && (
            <button className="btn-nav-pill" onClick={() => setSelectedProjectNo(null)}>
              ← All Projects
            </button>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="main-content">
        {selectedProjectNo ? (
          <ProjectDetail
            projectNo={selectedProjectNo}
            onBack={() => setSelectedProjectNo(null)}
          />
        ) : (
          <ProjectList
            onSelectProject={(projectNo) => setSelectedProjectNo(projectNo)}
          />
        )}
      </main>
    </div>
  );
}

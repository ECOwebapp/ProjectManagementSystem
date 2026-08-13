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
            <button
              onClick={() => setSelectedProjectNo(null)}
              title="Back to All Projects"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#FFFFFF',
                color: 'var(--navy, #0B1E3D)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 38,
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.35)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)'; }}
            >
              <span className="mdi mdi-home-circle" />
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

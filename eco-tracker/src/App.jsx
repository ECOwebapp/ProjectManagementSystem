// App.jsx — SB Admin 2 Shell Layout
import { useState } from 'react';
import ProjectList from './components/ProjectList/ProjectList.jsx';
import ProjectDetail from './components/ProjectDetail/ProjectDetail.jsx';

export default function App() {
  const [selectedProjectNo, setSelectedProjectNo] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div id="wrapper">
      {/* SB Admin 2 Sidebar */}
      <ul className={`navbar-nav bg-gradient-primary sidebar sidebar-dark accordion ${sidebarCollapsed ? 'toggled' : ''}`} id="accordionSidebar">
        {/* Brand */}
        <a
          className="sidebar-brand d-flex align-items-center justify-content-center"
          href="#"
          onClick={(e) => { e.preventDefault(); setSelectedProjectNo(null); }}
        >
          <div className="sidebar-brand-icon">
            <i className="fas fa-building"></i>
          </div>
          <div className="sidebar-brand-text mx-3">ECO Tracker</div>
        </a>

        <hr className="sidebar-divider my-0" />

        {/* Dashboard Nav Item */}
        <li className={`nav-item ${selectedProjectNo === null ? 'active' : ''}`}>
          <a
            className="nav-link"
            href="#"
            onClick={(e) => { e.preventDefault(); setSelectedProjectNo(null); }}
          >
            <i className="fas fa-fw fa-tachometer-alt"></i>
            <span>Dashboard</span>
          </a>
        </li>

        <hr className="sidebar-divider" />

        <div className="sidebar-heading">Management</div>

        {/* Projects Nav Item */}
        <li className={`nav-item ${selectedProjectNo !== null ? 'active' : ''}`}>
          <a
            className="nav-link"
            href="#"
            onClick={(e) => { e.preventDefault(); setSelectedProjectNo(null); }}
          >
            <i className="fas fa-fw fa-list-alt"></i>
            <span>All Projects</span>
          </a>
        </li>

        <hr className="sidebar-divider d-none d-md-block" />

        {/* Sidebar Toggler */}
        <div className="sidebar-toggler-wrap">
          <button
            className="sidebar-toggler"
            onClick={() => setSidebarCollapsed(prev => !prev)}
            title="Toggle Sidebar"
          >
            <i className={`fas ${sidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
          </button>
        </div>
      </ul>

      {/* Content Wrapper */}
      <div id="content-wrapper" className="d-flex flex-column">
        <div id="content">
          {/* Topbar Navbar */}
          <nav className="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow">
            {/* Sidebar Toggle (Mobile / Topbar) */}
            <button
              className="btn btn-link d-md-none rounded-circle mr-3"
              onClick={() => setSidebarCollapsed(prev => !prev)}
            >
              <i className="fa fa-bars"></i>
            </button>

            {/* Title / Breadcrumb */}
            <div className="d-none d-sm-inline-block form-inline mr-auto my-2 my-md-0 mw-100">
              <span className="h5 mb-0 font-weight-bold text-gray-800">
                {selectedProjectNo ? 'Project Details' : 'Infrastructure Dashboard'}
              </span>
              <span className="text-muted text-xs ml-2">Caraga State University</span>
            </div>

            {/* Topbar Right Nav */}
            <ul className="navbar-nav ml-auto align-items-center">
              {selectedProjectNo && (
                <li className="nav-item mr-3">
                  <button className="btn btn-outline-secondary btn-sm" onClick={() => setSelectedProjectNo(null)}>
                    <i className="fas fa-arrow-left mr-1"></i> All Projects
                  </button>
                </li>
              )}

              <div className="topbar-divider d-none d-sm-block"></div>

              {/* User Info Profile Badge */}
              <li className="nav-item">
                <span className="nav-link" style={{ cursor: 'default' }}>
                  <span className="mr-2 d-none d-lg-inline text-gray-600 small font-weight-bold">
                    CSU Personnel
                  </span>
                  <i className="fas fa-user-circle fa-2x text-gray-400"></i>
                </span>
              </li>
            </ul>
          </nav>

          {/* Main Container */}
          <div className="container-fluid">
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
          </div>
        </div>

        {/* Footer */}
        <footer className="sticky-footer bg-white">
          <div className="container my-auto">
            <div className="copyright text-center my-auto">
              <span>Copyright &copy; Caraga State University · ECO Infrastructure Tracker 2026</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

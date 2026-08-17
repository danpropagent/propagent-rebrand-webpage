import React from 'react';

const Navbar: React.FC = () => {
  return (
    <header className="topbar" aria-label="Primary navigation">
      <div className="topbar-inner container">
        <a className="brand" href="/" aria-label="Propagent home">
          <span className="brand-mark"><img src="/logo.svg" alt="" /></span>
          <span className="brand-name">Propagent</span>
        </a>
        <nav className="topbar-nav" aria-label="Primary">
          <a href="/resources/">Resources</a>
          <a href="/about/">About</a>
          <a href="/security/">Security</a>
        </nav>
        <details className="mobile-nav">
          <summary aria-label="Open navigation">Menu</summary>
          <nav className="mobile-nav-panel" aria-label="Mobile navigation">
            <a href="/resources/">Resources</a>
            <a href="/about/">About</a>
            <a href="/security/">Security guide</a>
            <a href="/60min-meeting">Book a Propagent demo</a>
          </nav>
        </details>
        <div className="topbar-status">
          <a href="/60min-meeting" className="btn btn-primary btn-sm">Book a Propagent demo</a>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

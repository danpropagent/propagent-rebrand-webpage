import React from 'react';

const Navbar: React.FC = () => {
  return (
    <header className="topbar" aria-label="Primary navigation">
      <div className="topbar-inner container">
        <a className="brand" href="/" aria-label="Propagent home">
          <span className="brand-mark"><img src="/logo.svg" alt="" /></span>
          <span className="brand-name">Propagent</span>
        </a>
        <nav className="topbar-nav" aria-label="Page sections">
          <a href="/">Home</a>
          <a href="/#how-it-works">How it works</a>
          <a href="/#pricing">Pricing</a>
        </nav>
        <div className="topbar-status">
          <a href="/#contact" className="btn btn-primary btn-sm">Book a pursuit review</a>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="fixed w-full z-50 px-6 py-6 flex justify-between items-center mix-blend-difference text-white pointer-events-auto">
      <Link to="/" className="text-2xl font-bold tracking-tighter font-brand">
        PROPAGENT
      </Link>
      <div className="flex items-center gap-8">
        <Link
          to="/rfp-grader"
          className="text-sm font-bold uppercase tracking-widest border-b border-white pb-1 hover:text-neon-purple hover:border-neon-purple transition-colors duration-300"
        >
          RFP Grader
        </Link>
        <a
          href="#access"
          className="text-sm font-bold uppercase tracking-widest border-b border-white pb-1 hover:text-neon-blue hover:border-neon-blue transition-colors duration-300"
        >
          Grant Access
        </a>
      </div>
    </nav>
  );
};

export default Navbar;
import React from 'react';

const Navbar: React.FC = () => {
  return (
    <nav className="fixed w-full z-50 px-6 py-6 flex justify-between items-center mix-blend-difference text-white pointer-events-auto">
      <div className="text-2xl font-bold tracking-tighter font-brand">PROPAGENT</div>
      <a 
        href="#access" 
        className="text-sm font-bold uppercase tracking-widest border-b border-white pb-1 hover:text-neon-blue hover:border-neon-blue transition-colors duration-300"
      >
        Grant Access
      </a>
    </nav>
  );
};

export default Navbar;
import React from 'react';

const Navbar: React.FC = () => {
  return (
    <nav className="fixed w-full z-50 px-6 py-6 flex justify-between items-center mix-blend-difference text-white pointer-events-auto">
      <a href="/" className="text-2xl font-bold tracking-tighter font-brand">
        PROPAGENT
      </a>
      <div className="flex items-center gap-8">
        <a
          href="/"
          className="text-sm font-bold uppercase tracking-widest border-b border-white pb-1 hover:text-neon-purple hover:border-neon-purple transition-colors duration-300"
        >
          ← Back to home
        </a>
        <a
          href="/#contact"
          className="text-sm font-bold uppercase tracking-widest border-b border-white pb-1 hover:text-neon-blue hover:border-neon-blue transition-colors duration-300"
        >
          Book a pursuit review
        </a>
      </div>
    </nav>
  );
};

export default Navbar;

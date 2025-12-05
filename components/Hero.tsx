import React, { useState } from 'react';

const Hero: React.FC = () => {
  const [hoveredSide, setHoveredSide] = useState<'left' | 'right' | null>(null);

  // Safe zone logic: if hovering the exact center strip, we are effectively not hovering a side.
  // However, simpler React logic: onMouseEnter of Left Pane sets 'left', Right Pane sets 'right'.
  // We can add a center div to clear it.

  return (
    <div className="h-screen w-full flex flex-col md:flex-row relative bg-black overflow-hidden group/hero">
      
      {/* Safe Zone / Center Reset (Hidden on mobile) */}
      <div 
        className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-1/4 z-40 hidden md:block"
        onMouseEnter={() => setHoveredSide(null)}
      />

      {/* Center Branding */}
      <div 
        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none text-center w-full transition-all duration-700 ease-in-out mix-blend-difference px-4
        ${hoveredSide ? 'opacity-0 blur-lg scale-95' : 'opacity-100 blur-0 scale-100'}`}
      >
        <h1 className="text-6xl md:text-9xl font-bold font-brand text-white tracking-widest glow-text">PROPAGENT</h1>
        <p className="text-xs md:text-sm tracking-[0.8em] mt-4 uppercase text-gray-300 font-sans">Autonomous Procurement Protocol</p>
        <div className="mt-12 flex justify-center items-center gap-6 opacity-90">
          <span className="text-xs font-bold tracking-widest border border-white/40 px-4 py-2 rounded bg-black/50 backdrop-blur-sm hidden md:inline-block">HOVER LEFT FOR BUYER</span>
          <span className="text-xs font-bold tracking-widest border border-white/40 px-4 py-2 rounded bg-black/50 backdrop-blur-sm hidden md:inline-block">HOVER RIGHT FOR VENDOR</span>
        </div>
      </div>

      {/* Left Pane (Buyer) */}
      <div 
        className={`relative flex flex-col justify-center items-center border-r border-neutral-800 transition-[flex,filter] duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden cursor-pointer
        ${hoveredSide === 'left' ? 'md:flex-[2.5]' : 'flex-1'}
        ${hoveredSide === 'right' ? 'blur-sm brightness-50' : ''}
        `}
        onMouseEnter={() => setHoveredSide('left')}
        onMouseLeave={() => setHoveredSide(null)}
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-10 group-hover:opacity-50 transition duration-700 grayscale hover:grayscale-0"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80"></div>
        
        <div className={`relative z-20 text-center p-8 transition-all duration-500 delay-100 transform ${hoveredSide === 'left' ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-8 blur-sm'}`}>
          <div className="h-1 w-20 bg-neon-blue mx-auto mb-6"></div>
          <p className="text-neon-blue text-sm md:text-base font-bold tracking-[0.3em] mb-4 uppercase">The Buyer</p>
          <h2 className="text-5xl md:text-7xl font-bold mb-6 font-sans">I NEED<br/>SOLUTIONS</h2>
          <p className="max-w-xs mx-auto text-gray-300 text-sm leading-relaxed">
            Initiate a request. Propagent constructs the RFP, scouts the market, and delivers perfect matches.
          </p>
        </div>
      </div>

      {/* Right Pane (Vendor) */}
      <div 
        className={`relative flex flex-col justify-center items-center bg-neutral-950 transition-[flex,filter] duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden cursor-pointer
        ${hoveredSide === 'right' ? 'md:flex-[2.5]' : 'flex-1'}
        ${hoveredSide === 'left' ? 'blur-sm brightness-50' : ''}
        `}
        onMouseEnter={() => setHoveredSide('right')}
        onMouseLeave={() => setHoveredSide(null)}
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 group-hover:opacity-50 transition duration-700 grayscale hover:grayscale-0"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80"></div>

        <div className={`relative z-20 text-center p-8 transition-all duration-500 delay-100 transform ${hoveredSide === 'right' ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-8 blur-sm'}`}>
          <div className="h-1 w-20 bg-neon-purple mx-auto mb-6"></div>
          <p className="text-neon-purple text-sm md:text-base font-bold tracking-[0.3em] mb-4 uppercase">The Vendor</p>
          <h2 className="text-5xl md:text-7xl font-bold mb-6 font-sans">I NEED<br/>CONTRACTS</h2>
          <p className="max-w-xs mx-auto text-gray-300 text-sm leading-relaxed">
            Upload capabilities. Propagent identifies right-fit opportunities, writes your proposals, and secures the win.
          </p>
        </div>
      </div>

    </div>
  );
};

export default Hero;
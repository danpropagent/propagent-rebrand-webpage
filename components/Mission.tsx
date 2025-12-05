import React from 'react';
import Reveal from './Reveal';

const Mission: React.FC = () => {
  return (
    <section className="py-32 px-6 bg-black relative overflow-hidden">
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <Reveal>
          <p className="text-neon-blue text-sm font-mono mb-6">SYSTEM STATUS: ONLINE</p>
        </Reveal>
        
        <Reveal delay={200}>
          <h3 className="text-3xl md:text-5xl font-light leading-tight mb-12 font-sans">
            The RFP process is broken.<br/>
            <span className="text-gray-600">Platforms don't fix it. Intelligence does.</span>
          </h3>
        </Reveal>

        <Reveal delay={400}>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-sans">
            Stop logging into dashboards and platforms. Propagent isn't a tool you learn. It's an agent you hire. We run the entire procurement cycle for you and ensure optimal business outcomes.
          </p>
        </Reveal>
      </div>
      
      {/* Background Glows */}
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-purple-900 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-900 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
    </section>
  );
};

export default Mission;
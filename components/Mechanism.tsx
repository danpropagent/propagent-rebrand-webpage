import React from 'react';
import Reveal from './Reveal';

const Mechanism: React.FC = () => {
  return (
    <section className="py-20 border-y border-neutral-900 bg-neutral-950 overflow-hidden">
      
      {/* Marquee */}
      <div className="w-full overflow-hidden opacity-30 mb-20">
        <div className="whitespace-nowrap animate-marquee">
          <span className="inline-block text-9xl font-bold text-transparent stroke-text font-brand mr-8">
            ANALYZE // CONNECT // NEGOTIATE // EXECUTE // ANALYZE // CONNECT // NEGOTIATE // EXECUTE //
          </span>
          <span className="inline-block text-9xl font-bold text-transparent stroke-text font-brand mr-8">
            ANALYZE // CONNECT // NEGOTIATE // EXECUTE // ANALYZE // CONNECT // NEGOTIATE // EXECUTE //
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
        <Reveal delay={100} className="group cursor-default">
          <div className="h-px w-full bg-gradient-to-r from-neon-blue to-transparent mb-6"></div>
          <div className="text-5xl font-bold text-neutral-800 mb-4 group-hover:text-neon-blue transition-colors duration-300 font-brand">01</div>
          <h4 className="text-xl font-bold mb-2 uppercase font-brand">Ingestion</h4>
          <p className="text-gray-500 text-sm leading-relaxed">
            Buyers define their needs. Vendors showcase their capabilities. We ingest the raw data and instantly structure it into a clear, navigable opportunity map
          </p>
        </Reveal>

        <Reveal delay={200} className="group cursor-default">
          <div className="h-px w-full bg-gradient-to-r from-neon-purple to-transparent mb-6"></div>
          <div className="text-5xl font-bold text-neutral-800 mb-4 group-hover:text-neon-purple transition-colors duration-300 font-brand">02</div>
          <h4 className="text-xl font-bold mb-2 uppercase font-brand">Synthesis</h4>
          <p className="text-gray-500 text-sm leading-relaxed">
            We continuously refine your sourcing preferences and writing style based on past wins. For Buyers, this means exact-match vendors. 
            For Vendors, it means hyper-personalized proposals that sound like your best salesperson
          </p>
        </Reveal>

        <Reveal delay={300} className="group cursor-default">
          <div className="h-px w-full bg-gradient-to-r from-white to-transparent mb-6"></div>
          <div className="text-5xl font-bold text-neutral-800 mb-4 group-hover:text-white transition-colors duration-300 font-brand">03</div>
          <h4 className="text-xl font-bold mb-2 uppercase font-brand">Execution</h4>
          <p className="text-gray-500 text-sm leading-relaxed">
            We draft the proposals. We score the responses. We set the stage. You get optimal business outcomes without the hassle.
          </p>
        </Reveal>
      </div>
    </section>
  );
};

export default Mechanism;
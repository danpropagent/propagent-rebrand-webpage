import React from 'react';
import Navbar from './components/Navbar';
import RFPGrader from './components/RFPGrader';

function App() {
  return (
    <div className="relative min-h-screen bg-void text-white overflow-x-hidden selection:bg-neon-blue selection:text-black">
      <div
        className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-[0.05] z-[9000]"
        style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
      />
      <Navbar />
      <RFPGrader />
    </div>
  );
}

export default App;

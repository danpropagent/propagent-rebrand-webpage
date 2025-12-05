import React from 'react';
import CustomCursor from './components/CustomCursor';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Mission from './components/Mission';
import Mechanism from './components/Mechanism';
import Footer from './components/Footer';

function App() {
  return (
    <div className="relative min-h-screen bg-void text-white overflow-x-hidden selection:bg-neon-blue selection:text-black">
      {/* Noise Overlay */}
      <div 
        className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-[0.05] z-[9000]"
        style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
      />

      <CustomCursor />
      <Navbar />
      
      <main>
        <Hero />
        <Mission />
        <Mechanism />
      </main>
      
      <Footer />
    </div>
  );
}

export default App;
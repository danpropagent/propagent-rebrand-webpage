import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CustomCursor from './components/CustomCursor';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Mission from './components/Mission';
import Mechanism from './components/Mechanism';
import Footer from './components/Footer';
import RFPGrader from './components/RFPGrader';

function HomePage() {
  return (
    <main>
      <Hero />
      <Mission />
      <Mechanism />
    </main>
  );
}

function App() {
  return (
    <Router>
      <div className="relative min-h-screen bg-void text-white overflow-x-hidden selection:bg-neon-blue selection:text-black">
        {/* Noise Overlay */}
        <div
          className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-[0.05] z-[9000]"
          style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
        />

        <CustomCursor />
        <Navbar />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rfp-grader" element={<RFPGrader />} />
        </Routes>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
import React, { useState } from 'react';

const Footer: React.FC = () => {
  const [userType, setUserType] = useState<'buyer' | 'vendor' | null>(null);
  const [email, setEmail] = useState('');
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('submitting');

    // TODO: Replace this with your actual Firebase Cloud Function URL
    // Example: https://us-central1-your-project-id.cloudfunctions.net/requestDemo
    const API_ENDPOINT = 'https://api-nzrxc3sypq-uc.a.run.app';

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          user_type: userType || 'unspecified',
          email: email,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      setFormStatus('success');
    } catch (error) {
      console.error('Form Error:', error);
      setFormStatus('error');
    }
  };

  return (
    <footer id="access" className="bg-neutral-950 py-24 px-6 border-t border-neutral-900 relative">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-8 font-sans">DEPLOY PROPAGENT</h2>
        
        {formStatus === 'success' ? (
          <div className="py-12 animate-fade-in">
            <div className="inline-block p-4 border border-neon-blue/30 rounded-full mb-6 bg-neon-blue/5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-neon-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-brand text-white mb-2 tracking-widest">TRANSMISSION RECEIVED</h3>
            <p className="text-gray-500 font-sans">Sequence initiated. We will contact you shortly.</p>
          </div>
        ) : (
          <>
            <p className="text-gray-500 mb-10 font-sans">
              We are currently operating in high-bandwidth beta. <br />
              Tell us who you are to initiate the protocol.
            </p>
            
            <form 
              onSubmit={handleSubmit} 
              className="flex flex-col gap-4 max-w-md mx-auto"
            >
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setUserType('buyer')}
                  className={`flex-1 py-3 border transition-all duration-300 font-sans uppercase text-sm tracking-wider
                    ${userType === 'buyer' 
                      ? 'bg-neutral-800 text-white border-neon-blue' 
                      : 'bg-neutral-900 border-neutral-800 text-gray-400 hover:bg-neutral-800'
                    }`}
                >
                  I am a Buyer
                </button>
                <button 
                  type="button" 
                  onClick={() => setUserType('vendor')}
                  className={`flex-1 py-3 border transition-all duration-300 font-sans uppercase text-sm tracking-wider
                    ${userType === 'vendor' 
                      ? 'bg-neutral-800 text-white border-neon-purple' 
                      : 'bg-neutral-900 border-neutral-800 text-gray-400 hover:bg-neutral-800'
                    }`}
                >
                  I am a Vendor
                </button>
              </div>
              
              <input 
                type="email" 
                name="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ENTER WORK EMAIL" 
                className="w-full bg-black border border-neutral-800 p-4 text-center text-white focus:outline-none focus:border-white transition placeholder-neutral-700 font-mono"
              />
              
              <button 
                type="submit" 
                disabled={formStatus === 'submitting'}
                className="group relative w-full py-4 mt-4 bg-transparent border border-white/20 overflow-hidden text-white font-bold uppercase tracking-widest hover:border-neon-blue hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
                <span className="relative z-10">
                  {formStatus === 'submitting' ? 'INITIATING...' : 'Request Demo'}
                </span>
              </button>
              
              {formStatus === 'error' && (
                <p className="text-red-500 text-sm mt-2">Error connecting to server. Please try again.</p>
              )}
            </form>
          </>
        )}
      </div>
      
      <div className="absolute bottom-6 left-0 w-full text-center">
        <p className="text-[10px] text-neutral-800 uppercase font-mono">Propagent AI Systems © 2024</p>
      </div>
    </footer>
  );
};

export default Footer;
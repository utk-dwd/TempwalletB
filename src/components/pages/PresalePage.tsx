import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Copy, Wallet, Send, Award } from 'lucide-react';
import Leaderboard from '@/components/leaderboard/Leaderboard'; 

// --- ShadCN UI Components ---
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// A component to show a popup message (a "toast")
const Toast = ({ message, show }: { message: string; show: boolean }) => {
  if (!show) return null;
  return (
    <div className="fixed bottom-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg animate-fade-in-up">
      {message}
    </div>
  );
};

// A reusable component for each instruction step
const InstructionStep = React.forwardRef<HTMLDivElement, { icon: React.ReactNode; title: string; description: string }>(
  ({ icon, title, description }, ref) => (
    <div ref={ref} className="flex items-start space-x-4">
      <div className="bg-white/10 p-3 rounded-full border border-white/20 mt-1">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </div>
  )
);

// --- Main Presale Page Component ---
const PresalePage = () => {
  const [showToast, setShowToast] = useState(false);
  const PresaleAddress = import.meta.env.VITE_DONATION_WALLET_ADDRESS || 'YOUR_WALLET_ADDRESS_HERE';

  // Refs for GSAP animations
  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const leaderboardRef = useRef(null);
  const instructionsRef = useRef(null);
  const instructionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // GSAP Animation Effect
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    const instructionElements = instructionRefs.current.filter(el => el !== null);

    gsap.set([headerRef.current, leaderboardRef.current, instructionsRef.current, ...instructionElements], { autoAlpha: 0, y: 30 });

    tl.to(headerRef.current, { autoAlpha: 1, y: 0, duration: 0.8 })
      .to(leaderboardRef.current, { autoAlpha: 1, y: 0, duration: 0.8 }, "-=0.6")
      .to(instructionsRef.current, { autoAlpha: 1, y: 0, duration: 0.8 }, "-=0.6")
      .to(instructionElements, {
        autoAlpha: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.2
      }, "-=0.5");
  }, []);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(PresaleAddress).then(() => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }).catch(err => {
      console.error('Failed to copy address: ', err);
    });
  };

  const instructions = [
    { icon: <Copy size={20} />, title: "1. Copy Address", description: "Click the button below to get the official donation address." },
    { icon: <Wallet size={20} />, title: "2. Open Your Wallet", description: "Access your preferred wallet (e.g., MetaMask, Trust Wallet)." },
    { icon: <Send size={20} />, title: "3. Send USDT", description: "Send any amount of USDT (ERC-20) to the copied address." },
    { icon: <Award size={20} />, title: "4. Get Recognized", description: "Your contribution will automatically appear on the leaderboard!" }
  ];

  return (
    <>
      <style>{`.custom-scrollbar::-webkit-scrollbar{width:8px;}.custom-scrollbar::-webkit-scrollbar-track{background:rgba(255,255,255,0.05);border-radius:4px;}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.2);border-radius:4px;transition:background .3s;}.custom-scrollbar::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.3);}.custom-scrollbar{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.2) rgba(255,255,255,0.05);}`}</style>
      
      <div ref={containerRef} className="flex-1 p-6 overflow-y-auto custom-scrollbar text-white">
        <div className="max-w-7xl mx-auto">
          
          <div ref={headerRef} className="mb-8">
            <div className="flex items-center mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <h1 className="px-6 text-3xl font-bold text-white">Presale</h1>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>
            <p className="text-center text-gray-200 text-sm">Your Presale participation helps us build and maintain the TempWallets platform.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Leaderboard */}
            <div className="lg:col-span-2">
            <Card ref={leaderboardRef} className="bg-white/5 backdrop-blur-sm border border-white/10 h-full">
              <CardHeader>
                <CardTitle className="text-white">Top Participants</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Replace the placeholder paragraph with the new component */}
                <Leaderboard />
              </CardContent>
            </Card>
            </div>

            {/* Right Column: Instructions */}
            <div className="lg:col-span-1">
              <Card ref={instructionsRef} className="bg-gray-800/20 backdrop-blur-sm border border-white/20 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-white">How to Participate</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {instructions.map((step, index) => (
                    <InstructionStep
                      key={step.title}
                      ref={(el) => { instructionRefs.current[index] = el; }} // <-- THIS IS THE FIX
                      icon={step.icon}
                      title={step.title}
                      description={step.description}
                    />
                  ))}
                  
                  <div className="bg-black/50 p-4 rounded-lg flex items-center justify-between flex-wrap gap-4 mt-4">
                    <p className="font-mono text-sm sm:text-base text-gray-400 break-all">{PresaleAddress}</p>
                    <Button onClick={handleCopyAddress} variant="ghost" className="text-white hover:text-gray-300 hover:bg-white/10 transition-all duration-200 group">
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Address
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        <Toast message="Address copied to clipboard!" show={showToast} />
      </div>
    </>
  );
};

export default PresalePage;
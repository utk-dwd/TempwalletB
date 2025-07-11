import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Copy, Wallet, Send, Award, DollarSign,CircleDollarSign } from 'lucide-react';
import Leaderboard from '@/components/leaderboard/Leaderboard'; // Import the Leaderboard component

// --- ShadCN UI Components ---
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// --- Data for Pricing Tiers ---
const PRICE_TIERS = [
  { minAmount: 0, maxAmount: 50, pricePerToken: 0.1 },
  { minAmount: 50, maxAmount: 100, pricePerToken: 0.08 },
  { minAmount: 100, maxAmount: 500, pricePerToken: 0.05 },
  { minAmount: 500, maxAmount: 1000, pricePerToken: 0.04 },
  { minAmount: 1000, maxAmount: 5000, pricePerToken: 0.02 },
  { minAmount: 5000, maxAmount: '∞', pricePerToken: 0.01 }
];

// --- Reusable Components ---
const Toast = ({ message, show }: { message: string; show: boolean }) => {
  if (!show) return null;
  return (
    <div className="fixed bottom-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg animate-fade-in-up">
      {message}
    </div>
  );
};

const ProcessDiagram = () => {
  const diagramRef = useRef(null);
  useEffect(() => {
    const icons = gsap.utils.toArray('.process-icon');
    const lines = gsap.utils.toArray('.process-line');
    gsap.set([...icons, ...lines], { autoAlpha: 0 });
    gsap.to(icons, { autoAlpha: 1, scale: 1, duration: 0.5, stagger: 0.3, delay: 1, ease: 'power2.out' });
    gsap.to(lines, { autoAlpha: 1, width: '100%', duration: 0.4, stagger: 0.3, delay: 1.2, ease: 'power2.inOut' });
  }, []);

  const steps = [
    { icon: <Copy size={20} />, label: "Copy" },
    { icon: <Wallet size={20} />, label: "Open Wallet" },
    { icon: <Send size={20} />, label: "Send USDT" },
    { icon: <Award size={20} />, label: "Get Tokens" },
  ];

  return (
    <div ref={diagramRef} className="flex items-center w-full justify-between">
      {steps.map((step, index) => (
        <React.Fragment key={step.label}>
          <div className="flex flex-col items-center gap-2">
            <div className="process-icon bg-white/10 p-3 rounded-full border border-white/20 transform scale-0">
              {step.icon}
            </div>
            <span className="text-xs text-gray-400">{step.label}</span>
          </div>
          {index < steps.length - 1 && (
            <div className="process-line flex-1 h-[1px] bg-white/20 mx-2 w-0"></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// --- Main Presale Page Component ---
const PresalePage = () => {
  const [showToast, setShowToast] = useState(false);
  const presaleAddress = import.meta.env.VITE_DONATION_WALLET_ADDRESS || 'YOUR_PRESALE_WALLET_ADDRESS_HERE';

  const headerRef = useRef(null);
  const leaderboardRef = useRef(null);
  const rightColumnRef = useRef(null);
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  
    // Set initial state for all elements
    gsap.set([headerRef.current, leaderboardRef.current, rightColumnRef.current], { autoAlpha: 0, y: 20 });
  
    // Animate elements into view
    tl.to(headerRef.current, { autoAlpha: 1, y: 0, duration: 1 })
      .to([leaderboardRef.current, rightColumnRef.current], {
        autoAlpha: 1,
        y: 0,
        duration: 1,
      }, "-=0.7"); 
  }, []);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(presaleAddress).then(() => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }).catch(err => { console.error('Failed to copy address: ', err); });
  };

  return (
    <>
      <style>{`.custom-scrollbar::-webkit-scrollbar{width:8px;}.custom-scrollbar::-webkit-scrollbar-track{background:rgba(255,255,255,0.05);border-radius:4px;}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.2);border-radius:4px;transition:background .3s;}.custom-scrollbar::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.3);}.custom-scrollbar{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.2) rgba(255,255,255,0.05);}`}</style>
      
      <div className="flex-1 p-6 flex flex-col overflow-hidden text-white">
        <div className="max-w-7xl mx-auto w-full flex flex-col flex-1 min-h-0">
          
          <div ref={headerRef} className="mb-8">
            <div className="flex items-center mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <h1 className="px-6 text-3xl font-bold text-white">$TEMP Token Pre-Sale</h1>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>
            <p className="text-center text-gray-400 text-sm">Your participation helps us build and maintain the TempWallets platform.</p>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
            {/* Left Column: Leaderboard */}
            <div ref={leaderboardRef} className="lg:w-2/3 flex flex-col">
              <Card className="bg-white/5 backdrop-blur-sm border border-white/10 flex-1 flex flex-col overflow-hidden">
                <CardContent className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-4">
                   <Leaderboard />
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Instructions & Pricing */}
            <div ref={rightColumnRef} className="lg:w-1/3 flex flex-col gap-2">
              <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">How to Participate</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProcessDiagram />
                  <Separator className="my-2 bg-white/10" />
                  <div className="bg-black/20 p-2 rounded-lg flex items-center justify-between flex-wrap gap-2">
                    <p className="font-mono text-[1rem] text-gray-400 break-all">{presaleAddress}</p>
                    <Button onClick={handleCopyAddress} variant="ghost" className="text-white hover:text-gray-300 hover:bg-white/10 transition-all duration-200 group">
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Address
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2"><DollarSign size={24}/> TEMP Token Pricing Tiers</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/20 hover:bg-transparent">
                        <TableHead className="text-white/80 flex items-center gap-2"> <CircleDollarSign className="h-4 w-4 text-green-400"/>USDT Contributed</TableHead>
                        <TableHead className="text-right text-white/80">Price per TEMP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {PRICE_TIERS.map((tier) => (
                        <TableRow key={tier.minAmount} className="border-white/10">
                          <TableCell className="font-medium text-gray-300">
                            {`$${tier.minAmount.toLocaleString()} - $${tier.maxAmount.toLocaleString()}`}
                          </TableCell>
                          <TableCell className="text-right font-mono text-cyan-400">
                            ${tier.pricePerToken}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Copy, Wallet, Send, Award, CircleDollarSign, AlertTriangle, X, Presentation } from 'lucide-react';
import Leaderboard from '@/components/leaderboard/Leaderboard';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';


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

// --- Data for Tokenomics ---
const TOKEN_ALLOCATION_DATA = [
  { name: 'Community & Ecosystem', value: 30, color: '#002642' }, // Very Dark Blue
  { name: 'Public ICO', value: 20, color: '#023E7D' }, // Dark Blue
  { name: 'Seed Round Investors', value: 20, color: '#0466C8' }, // Medium Blue
  { name: 'Team', value: 20, color: '#6A9AC4' }, // Lighter Blue
  { name: 'Liquidity & Exchange', value: 5, color: '#9D0208' }, // Deep Red Accent
  { name: 'Advisory', value: 5, color: '#D00000' }, // Brighter Red Accent
];
//Tokenomics Card Component
const TokenomicsCard = () => {
  return (
      <Card className="bg-white/5 backdrop-blur-sm border border-white/10">
          <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                  <img 
                    src="/TEMP Token Logo.svg" 
                    alt="TEMP Token" 
                    className="h-8 w-8" 
                  />
                  <span>TEMP Token ICO</span>
              </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
              {/*Summary Table */}
              <Table>
                  <TableHeader>
                      <TableRow className="border-white/20 hover:bg-transparent">
                          <TableHead className="text-white/80 text-xs px-2">Allocation</TableHead>
                          <TableHead className="text-white/80 text-xs px-2">Alloc. %</TableHead>
                          <TableHead className="text-white/80 text-xs px-2">Price</TableHead>
                          <TableHead className="text-white/80 text-xs px-2">FDV</TableHead>
                          <TableHead className="text-right text-white/80 text-xs px-2">Funding</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      <TableRow className="border-white/10">
                          <TableCell className="font-medium text-gray-300 text-xs px-2">100M</TableCell>
                          <TableCell className="text-gray-300 text-xs px-2">20.00%</TableCell>
                          <TableCell className="font-mono text-cyan-400 text-xs px-2">$0.0010</TableCell>
                          <TableCell className="text-gray-300 text-xs px-2">$500k</TableCell>
                          <TableCell className="text-right text-green-400 text-xs px-2">$100k</TableCell>
                      </TableRow>
                  </TableBody>
              </Table>

              {/* --- Chart and Legend Section --- */}
              <div className="flex flex-col lg:flex-row items-center gap-4">
                  {/* Pie Chart */}
                  <div 
                      className="w-full lg:w-1/2 h-48 min-h-[192px]"
                      style={{ 
                          filter: 'drop-shadow(0 0 1.25rem rgba(0, 255, 255, 0.25))' 
                      }}
                  >
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                  data={TOKEN_ALLOCATION_DATA}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  outerRadius={80}
                                  dataKey="value"
                                  stroke="none"
                              >
                                  {TOKEN_ALLOCATION_DATA.map((entry, index) => (
                                      <Cell 
                                          key={`cell-${index}`} 
                                          fill={entry.color} 
                                          style={{ opacity: 0.8 }} 
                                      />
                                  ))}
                              </Pie>
                          </PieChart>
                      </ResponsiveContainer>
                  </div>

                  {/* Allocation Table/Legend */}
                  <div className="w-full lg:w-1/2">
                      <div className="space-y-2">
                          {TOKEN_ALLOCATION_DATA.map((item) => (
                              <div key={item.name} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color, opacity: 0.8 }} />
                                      <span className="text-gray-300">{item.name}</span>
                                  </div>
                                  <span className="font-mono text-cyan-400">{item.value}%</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </CardContent>
      </Card> 
  );
};


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

const CautionToggle = () => {
  const [isOpen, setIsOpen] = useState(true);
  const boxRef = useRef(null);

  useEffect(() => {
      if (isOpen) {
          gsap.fromTo(boxRef.current, 
              { autoAlpha: 0, y: -20, display: 'none' }, 
              { autoAlpha: 1, y: 0, display: 'block', duration: 0.4, ease: 'power3.out' }
          );
      } else {
          if (boxRef.current && (boxRef.current as HTMLElement).style.display === 'block') {
              gsap.to(boxRef.current, { 
                  autoAlpha: 0, 
                  y: -20, 
                  duration: 0.3, 
                  ease: 'power3.in', 
                  onComplete: () => {
                      if (boxRef.current) {
                          (boxRef.current as HTMLElement).style.display = 'none';
                      }
                  }
              });
          }
      }
  }, [isOpen]);

  return (
      <div className="fixed top-6 right-6 z-50 flex flex-col items-end">
          <button
              onClick={() => setIsOpen(!isOpen)}
              className="relative z-10 p-2 rounded-full bg-yellow-500/20 backdrop-blur-md border border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/30 transition-all shadow-lg"
              aria-label="Toggle caution notice"
          >
              <AlertTriangle className="h-6 w-6" />
          </button>
          <div 
              ref={boxRef} 
              style={{ 
                  display: 'none',
                  WebkitMaskImage: 'radial-gradient(circle 30px at top right, transparent 100%, black 100%)',
                  maskImage: 'radial-gradient(circle 30px at top right, transparent 100%, black 100%)',
              }} 
              className="absolute top-0 right-0 mt-2 w-[20rem] pt-3 p-4 rounded-lg bg-yellow-500/10 backdrop-blur-md border border-yellow-500/30 shadow-lg"
          >
              <button onClick={() => setIsOpen(false)} className="absolute top-2 right-2 text-yellow-300/70 hover:text-white transition-colors">
                  <X size={18} />
              </button>
              <div>
                  <p className="text-sm font-semibold text-yellow-200">Important Notice</p>
                  <p className="text-xs text-yellow-200/80 mt-1">
                        This is the presale <strong className="text-yellow-100/90">allocation</strong> of TEMP token. It will go live when we hit the soft-cap of <strong className="text-yellow-100/90">100,000 USDT</strong>.
                    </p>
                    <p className="text-xs text-yellow-200/80 mt-2">
                        You can only participate by sending <strong className="text-yellow-100/90">USDT</strong> over the
                        <span className="inline-flex items-center ml-1">
                            <img src="/ethereum-eth-logo.png" alt="Ethereum" className="h-3 w-3 mr-1" />
                            <strong className="text-yellow-100/90">Ethereum mainnet.</strong>
                        </span>
                         We do not accept funds from other networks or other tokens.
                    </p>
              </div>
          </div>
      </div>
  );
};

const DeckViewerToggle = () => {
    const [isOpen, setIsOpen] = useState(false);
    const viewerRef = useRef(null);
    const backdropRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            gsap.to(backdropRef.current, { autoAlpha: 1, duration: 0.3 });
            gsap.fromTo(viewerRef.current,
                { autoAlpha: 0, scale: 0.95, y: 20 },
                { autoAlpha: 1, scale: 1, y: 0, duration: 0.4, ease: 'power3.out' }
            );
        }
    }, [isOpen]);

    const handleClose = () => {
        gsap.to(viewerRef.current, {
            autoAlpha: 0, scale: 0.95, y: 20, duration: 0.3, ease: 'power3.in',
            onComplete: () => setIsOpen(false)
        });
        gsap.to(backdropRef.current, { autoAlpha: 0, duration: 0.3 });
    };

    return (
        <>
            {/* The persistent icon button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-20 right-6 z-1 p-2 rounded-full bg-green-500/20 backdrop-blur-md border border-green-500/40 text-green-300 hover:bg-green-500/30 transition-all shadow-lg"
                aria-label="View project deck"
            >
                <Presentation className="h-6 w-6" />
            </button>

            {/* The Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div ref={backdropRef} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose}></div>
                    
                    {/* Viewer Content */}
                    <div ref={viewerRef} className="relative w-full h-full max-w-6xl flex flex-col rounded-lg bg-black/50 border border-green-500/30 shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-3 bg-black/20 border-b border-green-500/20 flex-shrink-0">
                            <h3 className="text-lg font-semibold text-green-200 flex items-center gap-2">
                                <Presentation className="h-5 w-5" />
                                Project Deck
                            </h3>
                            <button onClick={handleClose} className="text-green-300/70 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <iframe
                            className="flex-1 w-full h-full bg-white"
                            src="https://www.canva.com/design/DAGozVMA5f0/XFamNzsA24ppP2FaVRtIhA/view?embed"
                            allowFullScreen
                            allow="fullscreen"
                            title="Project Deck"
                        ></iframe>
                    </div>
                </div>
            )}
        </>
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
  
    gsap.set([headerRef.current, leaderboardRef.current, rightColumnRef.current], { autoAlpha: 0, y: 20 });
  
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
      
      <CautionToggle />
      <DeckViewerToggle />

      <div className="p-4 md:p-6 flex flex-col text-white h-screen overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto w-full flex flex-col flex-1">
          
          <div ref={headerRef} className="mb-8">
            <div className="flex items-center mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
               <h1 className="px-4 text-3xl font-bold text-white flex items-center justify-center gap-2">
                <img 
                  src="/TEMP Token Logo.svg" 
                  alt="TEMP Token" 
                  className="h-12 w-12" 
                />
                <span>TEMP Token Pre-Sale</span>
              </h1>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>
            <p className="text-center text-gray-400 text-sm">TEMP Tokens will go live when we hit the soft-cap of 100,000 USDT.</p>
          </div>

          <div className="flex flex-col xl:flex-row gap-6">
            {/* Left Column: Leaderboard */}
            <div ref={leaderboardRef} className="flex-1 min-w-0">
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 h-full">
                <CardContent className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-4">
                   <Leaderboard />
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Instructions & Tokenomics */}
            <div ref={rightColumnRef} className="xl:w-[400px] flex flex-col gap-6">
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

              {/* === REPLACED COMPONENT === */}
              <TokenomicsCard />

            </div>
          </div>
        </div>
        <Toast message="Address copied to clipboard!" show={showToast} />
      </div>
    </>
  );
};

export default PresalePage;
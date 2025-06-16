// src/components/layout/Sidebar.tsx
import { Button } from '@/components/ui/button';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useState } from 'react';

interface SidebarProps {
  activeItem: string;
  onNavClick: (item: string) => void;
}

export function Sidebar({ activeItem, onNavClick }: SidebarProps) {
  // Step 1.2: Remove 'Terms of Use' from navItems array
  const navItems = ['Dashboard', 'Blogs' , 'Address Book', 'History', 'Settings'];
  
  // Step 2.1: Add state for "Coming Soon" popup
  const [showComingSoonPopup, setShowComingSoonPopup] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  
  // Step 5.1: Add state for policy popup
  const [showPolicyPopup, setShowPolicyPopup] = useState<string | null>(null);

  // Step 2.2: Handle navigation clicks with "Coming Soon" logic
  const handleNavClick = (item: string, event?: React.MouseEvent) => {
    const comingSoonItems = ['Address Book', 'History', 'Settings'];
    
    if (comingSoonItems.includes(item)) {
      if (event) {
        const rect = event.currentTarget.getBoundingClientRect();
        setPopupPosition({
          top: rect.top + rect.height / 2,
          left: rect.right - 100
        });
      }
      setShowComingSoonPopup(item);
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        setShowComingSoonPopup(null);
      }, 2500);
    } else {
      onNavClick(item);
    }
  };

  // Step 5.2: Handler for showing policy popup
  const showPolicyHandler = (policyType: string) => {
    setShowPolicyPopup(policyType);
  };

  return (
    <>
      {/* Step 3.1: Wrap Sidebar content in a Flex container */}
      <div className="sidebar w-[280px] h-auto p-4 flex flex-col rounded-xl mb-5 mt-5 ml-5 border border-white/20">
        

        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              {/* Temp Wallet Logo */}
              <div className="mb-4">
                <img  
                  src="/White 2000x500.png"
                  alt="TempWallets Logo"
                  className="h-13 object-contain mx-auto"
                  />
              </div>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="bg-gray-800/70 backdrop-blur-sm text-white p-2 rounded-md shadow-lg text-sm"
                sideOffset={30}
                side="left"
              >
                <p>This DApp creates temporary deterministic smart wallets <br/> using your metamask signature and an index (number).<br/> All wallets created on this DApp are at user's custody <br/>and there is no way for the tempwallet team to recover funds. <br/>Tempwallets does not have a backend and does not store user data. <br/>The intention of this DApp is to enable users to create <br/>temporary wallets to receive funds without exposing their main <br/>metamask accounts.
                </p>
                <Tooltip.Arrow className="fill-white" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>

        {/* Navigation Items - Step 3.1: Set to flex-grow */}
        <nav className="space-y-2 flex-1 flex-grow">
          {navItems.map((item) => (
            <Button
              key={item}
              variant="ghost"
              className={`sidebar-item w-full justify-start h-10 px-3 py-2 text-sidebar-foreground ${
                activeItem === item ? 'active' : ''
              }`}
              onClick={(e) => handleNavClick(item, e)}
            >
              {item}
            </Button>
          ))}
        </nav>

        {/* Step 3: Add Footer Section */}
        <footer className="border-t border-gray-500 p-2 mt-4">
          {/* Step 4.1: Add Terms and Privacy Links */}
          <div className="flex justify-center space-x-4 text-sm text-gray-400">
            <div 
              className="cursor-pointer hover:text-white transition-colors"
              onClick={() => showPolicyHandler('terms')}
            >
              Terms of Use
            </div>
            <div 
              className="cursor-pointer hover:text-white transition-colors"
              onClick={() => showPolicyHandler('privacy')}
            >
              Privacy Policy
            </div>
          </div>
          {/* Version Text */}
          <div className="flex justify-center mt-1">
            <div className="text-sm text-gray-400 hover:text-white transition-colors">
              Version 0.0.1
            </div>
          </div>

        </footer>
      </div>

      {/* Step 2.3: "Coming Soon" Popup - Small and positioned near element */}
      {showComingSoonPopup && (
        <div 
          className="fixed z-50 pointer-events-none"
          style={{
            top: `${popupPosition.top}px`,
            left: `${popupPosition.left}px`,
            transform: 'translateY(-50%)'
          }}
        >
          <div className="bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap border border-gray-600">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-400"> </span>
              <span>Coming Soon</span>
            </div>
            {/* Small arrow pointing to the element */}
            <div className="absolute top-1/2 left-0 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-800 transform -translate-x-full -translate-y-1/2"></div>
          </div>
        </div>
      )}

      {/* Step 5.3: Policy Popup */}
      {showPolicyPopup && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white/80 p-6 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto relative">
            <h3 className="text-black text-xl font-bold mb-4 capitalize">
              {showPolicyPopup === 'terms' ? 'Terms of Use' : 'Privacy Policy'}
            </h3>
            
            {showPolicyPopup === 'terms' && (
              <div className="text-black text-sm leading-relaxed">
                <p className="mb-4">
                Welcome to TempWallet. By accessing or using our decentralized wallet service, you agree to the following terms:
                </p>
                <div className="ml-4 mb-4">
                  <p className="mb-2">1. You are solely responsible for safeguarding your MetaMask credentials and any temporary wallets you generate.</p>
                  <p className="mb-2">2. TempWallet is not liable for any loss of funds, privacy breaches, or damages resulting from use of disposable wallets.</p>
                  <p className="mb-2">3. The service is provided “as is,” without warranties, including for privacy, security, or uninterrupted access.</p>
                  <p className="mb-2">4. Use of TempWallet is at your own risk. Always verify recipient addresses and transaction details before sending funds.</p>
                </div>
                <p className="mb-4">
                  By continuing to use our service, you acknowledge that you have read and agree to these terms.
                </p>
              </div>
            )}

            {showPolicyPopup === 'privacy' && (
              <div className="text-black text-sm leading-relaxed">
                <p className="mb-4">
                Your privacy is central to TempWallet’s mission. Here’s how we handle your information:
                </p>
                <div className="ml-4 mb-4">
                  <p className="mb-2">1. TempWallet does not collect or store your MetaMask credentials, private keys, or transaction history.</p>
                  <p className="mb-2">2. We do not track your main wallet address or disposable wallets you create.</p>
                  <p className="mb-2">3. We do not share any user data with third parties or advertisers.</p>
                  <p className="mb-2">4. TempWallet is provided as a privacy tool “as is,” without guarantees of uptime, performance, or error-free operation.</p>
                </div>
                <p className="mb-4">
                  For questions about this privacy policy, please contact our support team.
                </p>
              </div>
            )}

            <Button
              onClick={() => setShowPolicyPopup(null)}
              className="bg-gray-500/50 hover:bg-green-600 text-white px-4 py-2 rounded mt-4"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
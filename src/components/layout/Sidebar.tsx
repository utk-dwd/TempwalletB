// src/components/layout/Sidebar.tsx
import { Button } from '@/components/ui/button';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import analyticsService from '@/services/analytics';
import { EventName } from '@/utils/types';
import React from 'react';


// This is the button for the "Presale" link.
const StarBorderButton: React.FC<{ onClick: (e: React.MouseEvent) => void; children: React.ReactNode; className?: string; }> = ({ onClick, children, className }) => {
  return (
    <button onClick={onClick} className={`star-border-button ${className}`}>
      <div className="star-border-button-content">
        {children}
      </div>
    </button>
  );
};


interface SidebarProps {
  activeItem?: string; // Make activeItem optional since we'll derive it from the route
  onNavClick?: (item: string) => void; // Make onNavClick optional for flexibility
}
export function Sidebar({ activeItem: propActiveItem, onNavClick }: SidebarProps) {
  // Added 'Presale' to the navigation items
  const navItems = ['Dashboard', 'Blogs', 'Address Book', 'History', 'Settings', 'Presale'];
  const [showComingSoonPopup, setShowComingSoonPopup] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [showPolicyPopup, setShowPolicyPopup] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Added the route for the 'Presale' page
  const routeMap: { [key: string]: string } = {
    Dashboard: '/dashboard',
    Blogs: '/blogs',
    'Presale': '/presale',
    'Address Book': '/address-book',
    History: '/history',
    Settings: '/settings',
  };
  
  const getActiveItem = () => {
    const currentPath = location.pathname.toLowerCase().replace(/\/$/, '');
    for (const [item, route] of Object.entries(routeMap)) {
      if (currentPath === route.toLowerCase() || currentPath === (route.toLowerCase() + '/')) {
        return item;
      }
    }
    return propActiveItem || 'Dashboard';
  };
  
  const activeItem = getActiveItem();
  
  const handleNavClick = (item: string, event?: React.MouseEvent) => {
    analyticsService.trackEvent(EventName.NAVIGATION_CLICKED, { destination: item });
    const comingSoonItems = ['Address Book', 'History', 'Settings'];
    
    if (comingSoonItems.includes(item)) {
      if (event) {
        const rect = event.currentTarget.getBoundingClientRect();
        setPopupPosition({
          top: rect.top + rect.height / 2,
          left: rect.right - 100,
        });
      }
      setShowComingSoonPopup(item);
      setTimeout(() => {
        setShowComingSoonPopup(null);
      }, 2500);
    } else {
      const route = routeMap[item];
      if (route) {
        navigate(route);
      }
      if (onNavClick) {
        onNavClick(item);
      }
    }
  };
  
  const showPolicyHandler = (policyType: string) => {
    setShowPolicyPopup(policyType);
    analyticsService.trackEvent(EventName.POLICY_VIEWED, { policyType });
  };
  
  return (
    <>
      {/* Styles for the StarBorderButton */}
      <style>
        {`
          .star-border-button {
            position: relative;
            background: transparent;
            border: none;
            color: white;
            padding: 0.5rem 0.75rem; /* Match sidebar-item padding */
            font-size: 0.875rem; /* Match sidebar-item font size */
            font-weight: 500;
            cursor: pointer;
            overflow: hidden;
            width: 100%;
            text-align: left;
            border-radius: var(--radius);
            height: 2.5rem; /* Match sidebar-item height */
            display: flex;
            align-items: center;
          }

          .star-border-button-content {
            position: relative;
            z-index: 1;
          }

          .star-border-button::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 150%;
            height: 300%;
            border-radius: var(--radius);
            background: conic-gradient(from 0deg, #818cf8, #c084fc, #f472b6, #818cf8);
            animation: rotate 4s linear infinite;
            transform: translate(-50%, -50%);
          }
          
          .star-border-button::after {
            content: '';
            position: absolute;
            inset: 2px;
            border-radius: 0.65rem; /* Slightly smaller than main radius to prevent bleed */
            background: var(--overlay);
          }

          .star-border-button:hover::after {
             background: var(--sidebar-accent);
          }
          
          .star-border-button.active::after {
            background: var(--sidebar-accent);
          }
          
          .star-border-button.active .star-border-button-content {
             font-weight: 600;
          }


          @keyframes rotate {
            100% {
              transform: translate(-50%, -50%) rotate(1turn);
            }
          }
        `}
      </style>

      <div className="sidebar w-[280px] h-auto p-4 flex flex-col rounded-xl mb-5 mt-5 ml-5 border border-white/20">
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
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
                <p>
                  This DApp creates temporary deterministic smart wallets <br /> using your metamask
                  signature and an index (number).<br /> All wallets created on this DApp are at
                  user's custody <br />and there is no way for the tempwallet team to recover funds.
                  <br />
                  Tempwallets does not have a backend and does not store user data. <br />
                  The intention of this DApp is to enable users to create <br />
                  temporary wallets to receive funds without exposing their main <br />
                  metamask accounts.
                </p>
                <Tooltip.Arrow className="fill-white" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
        
        <nav className="space-y-2 flex-1 flex-grow">
          {navItems.map((item) => (
            item === 'Donate' ? (
              <StarBorderButton
                key={item}
                className={activeItem === item ? 'active' : ''}
                onClick={(e) => handleNavClick(item, e)}
              >
                ⭐ Donate
              </StarBorderButton>
            ) : (
              <Button
                key={item}
                variant="ghost"
                className={`sidebar-item w-full justify-start h-10 px-3 py-2 text-sidebar-foreground ${activeItem === item ? 'active' : ''}`}
                onClick={(e) => handleNavClick(item, e)}
              >
                {item}
              </Button>
            )
          ))}
        </nav>

        <footer className="border-t border-gray-500 p-2 mt-4">
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
          <div className="flex justify-center mt-1">
            <div className="text-sm text-gray-400 hover:text-white transition-colors">
              Version 0.0.1
            </div>
          </div>
        </footer>
      </div>

      {showComingSoonPopup && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            top: `${popupPosition.top}px`,
            left: `${popupPosition.left}px`,
            transform: 'translateY(-50%)',
          }}
        >
          <div className="bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap border border-gray-600">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-400"> </span>
              <span>Coming Soon</span>
            </div>
            <div className="absolute top-1/2 left-0 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-800 transform -translate-x-full -translate-y-1/2"></div>
          </div>
        </div>
      )}

      {showPolicyPopup && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white/80 p-6 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto relative">
            <h3 className="text-black text-xl font-bold mb-4 capitalize">
              {showPolicyPopup === 'terms' ? 'Terms of Use' : 'Privacy Policy'}
            </h3>

            {showPolicyPopup === 'terms' && (
              <div className="text-black text-sm leading-relaxed">
                <p className="mb-4">
                  Welcome to TempWallet. By accessing or using our decentralized wallet service, you
                  agree to the following terms:
                </p>
                <div className="ml-4 mb-4">
                  <p className="mb-2">
                    1. You are solely responsible for safeguarding your MetaMask credentials and any
                    temporary wallets you generate.
                  </p>
                  <p className="mb-2">
                    2. TempWallet is not liable for any loss of funds, privacy breaches, or damages
                    resulting from use of disposable wallets.
                  </p>
                  <p className="mb-2">
                    3. The service is provided “as is,” without warranties, including for privacy,
                    security, or uninterrupted access.
                  </p>
                  <p className="mb-2">
                    4. Use of TempWallet is at your own risk. Always verify recipient addresses and
                    transaction details before sending funds.
                  </p>
                </div>
                <p className="mb-4">
                  By continuing to use our service, you acknowledge that you have read and agree to
                  these terms.
                </p>
              </div>
            )}

            {showPolicyPopup === 'privacy' && (
              <div className="text-black text-sm leading-relaxed">
                <p className="mb-4">
                  Your privacy is central to TempWallet’s mission. Here’s how we handle your
                  information:
                </p>
                <div className="ml-4 mb-4">
                  <p className="mb-2">
                    1. TempWallet does not collect or store your MetaMask credentials, private keys,
                    or transaction history.
                  </p>
                  <p className="mb-2">
                    2. We do not track your main wallet address or disposable wallets you create.
                  </p>
                  <p className="mb-2">3. We do not share any user data with third parties or advertisers.</p>
                  <p className="mb-2">
                    4. TempWallet is provided as a privacy tool “as is,” without guarantees of uptime,
                    performance, or error-free operation.
                  </p>
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
// src/components/layout/Sidebar.tsx
import { Button } from '@/components/ui/button';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import analyticsService from '@/services/analytics';
import { EventName } from '@/utils/types';
import React from 'react';
import {
  LayoutDashboard,
  BookText,
  Contact,
  History,
  Settings,
  Star,
} from 'lucide-react';
import { FaTwitter, FaLinkedin, FaTelegramPlane, FaDiscord } from 'react-icons/fa';


const StarBorderButton: React.FC<{ onClick: (e: React.MouseEvent) => void; children: React.ReactNode; className?: string; }> = ({ onClick, children, className }) => {
  return (
    <button onClick={onClick} className={`star-border-button ${className}`}>
      {/* These two divs create the moving star effect */}
      <div className="star-animation-top"></div>
      <div className="star-animation-bottom"></div>
      
      {/* This div holds the actual button content */}
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
  const navItems = ['Dashboard', 'Blogs', 'Address Book', 'History', 'Settings', '$TEMP Token Pre-Sale'];
  const [showComingSoonPopup, setShowComingSoonPopup] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [showPolicyPopup, setShowPolicyPopup] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const navIcons: { [key: string]: React.ReactNode } = {
      Dashboard: <LayoutDashboard size={20} className="mr-2" />,
      Blogs: <BookText size={20} className="mr-2" />,
      'Address Book': <Contact size={20} className="mr-2" />,
      History: <History size={20} className="mr-2" />,
      Settings: <Settings size={20} className="mr-2" />,
      '$TEMP Token Pre-Sale': <Star size={20} className="mr-2" />,
  };
  
  const routeMap: { [key: string]: string } = {
    Dashboard: '/dashboard',
    Blogs: '/blogs',
    '$TEMP Token Pre-Sale': '/presale',
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
  font-weight: 500;
  cursor: pointer;
  overflow: hidden; /* This is crucial to clip the animation */
  width: 100%;
  border-radius: 0.75rem;
  height: 2.5rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.star-border-button-content {
  /* This ensures the content is above the animation */
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: flex-start; /* Aligns content to the left */
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.83rem;
  height: 100%;
}

/* Styles for the two animated "star" elements */
.star-animation-top,
.star-animation-bottom {
  position: absolute;
  width: 300%;
  height: 50%;
  opacity: 0.7;
  border-radius: 9999px; /* rounded-full */
  background: radial-gradient(circle, white, transparent 20%);
  z-index: 0;
}

.star-animation-top {
  top: -15px;
  left: -250%;
  animation: star-movement-top 6s linear infinite alternate;
}

.star-animation-bottom {
  bottom: -15px;
  right: -250%;
  animation: star-movement-bottom 6s linear infinite alternate;
}

/* The active/hover state now only needs to handle the uplift and glass effect */
.star-border-button:hover,
.star-border-button.active {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}

.star-border-button::after {
  content: '';
  position: absolute;
  inset: 1px; /* Border thickness */
  border-radius: 0.65rem;
  background: var(--overlay);
  transition: background 0.3s ease;
  z-index: 0;
}

.star-border-button:hover::after,
.star-border-button.active::after {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.star-border-button.active .star-border-button-content {
   font-weight: 600;
}

/* Base styles for standard sidebar buttons */
.sidebar-item {
    transition: transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease;
}

.sidebar-item.active,
.sidebar-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px 0 rgba(0, 0, 0, 0.3);
    background-color: rgba(255, 255, 255, 0.1) !important;
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
}

/* Keyframes for the new animation */
@keyframes star-movement-top {
  from { transform: translate(0%, 0%); opacity: 0.7; }
  to { transform: translate(100%, 0%); opacity: 0; }
}

@keyframes star-movement-bottom {
  from { transform: translate(0%, 0%); opacity: 0.7; }
  to { transform: translate(-100%, 0%); opacity: 0; }
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
          {navItems.map((item) =>
            item === '$TEMP Token Pre-Sale' ? (
              <StarBorderButton
                key={item}
                className={activeItem === item ? 'active' : ''}
                onClick={(e) => handleNavClick(item, e)}
              >
                {navIcons[item]}
                {item}
              </StarBorderButton>
            ) : (
              <Button
                key={item}
                variant="ghost"
                className={`sidebar-item w-full justify-start h-10 px-3 py-2 text-sidebar-foreground ${activeItem === item ? 'active' : ''}`}
                onClick={(e) => handleNavClick(item, e)}
              >
                {navIcons[item]}
                {item}
              </Button>
            )
          )}
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
          <div className="flex justify-center space-x-6 mt-4">
            <a href="https://x.com/tempwallets" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <FaTwitter size={20} />
            </a>
            <a href="https://www.linkedin.com/showcase/tempwallets" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <FaLinkedin size={20} />
            </a>
            <a href="https://t.me/+jGONCu_VLqgwZTVl" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <FaTelegramPlane size={20} />
            </a>
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
// src/App.tsx
import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { ethers } from 'ethers';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MainContent } from '@/components/layout/MainContent';
import { AnimatedLandingPage } from '@/components/pages/AnimatedLandingPage';
import { UnsupportedDevice } from '@/components/pages/UnsupportedDevice';
import { Wallet, UserData, TransactionStatus } from '@/utils/types';
import { exportUserData, importUserData } from './utils/exportImport';
import '@/index.css';
import { Image } from 'lucide-react'; 
import { AlertCircle, CheckCircle } from 'lucide-react';
import * as Tooltip from "@radix-ui/react-tooltip";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { BlogListing } from '@/components/pages/BlogListing';
import PresalePage from './components/pages/PresalePage';


//component definition:
interface LayoutProps {
  children: React.ReactNode;
  activeItem: string;
  onNavClick: (item: string) => void;
  walletAddress: string | null;
  walletName: string;
  name: string;
  profilePicture: string | null;
  onConnectWallet: () => Promise<boolean>;
  showProfile: boolean;
  onProfileClick: () => void;
  onEditProfile: (name: string, picture: string | null) => void;
  onEditWalletName: (name: string) => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
  handleCopyAddress: () => void;
  showCopiedPopup: boolean;
  handleExport: () => void;
  handleImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleLogout: () => void;
  bgIndex: number;
  backgroundImages: string[];
  handleSwitchBackground: () => void;
  notification: Notification | null;
  setNotification: (notification: { brief: string; full: string; type: 'error' | 'success' } | null) => void;
  isNotificationExpanded: boolean;
  setIsNotificationExpanded: Dispatch<SetStateAction<boolean>>;
}

interface Notification {
  brief: string;
  full: string;
  type: 'error' | 'success';
}

interface NotificationProps {
  notification: Notification | null;
  isExpanded: boolean;
  setIsExpanded: Dispatch<SetStateAction<boolean>>;
}

function NotificationComponent({ notification, isExpanded, setIsExpanded }: NotificationProps) {
  if (!notification) return null;
  return (
    <div
      className={`fixed top-4 right-4 z-50 rounded-lg shadow-lg text-sm font-medium transition-all duration-300 ease-in-out transform cursor-pointer ${
        isExpanded
          ? 'w-72 p-4 bg-[var(--overlay)] backdrop-blur-[var(--blur)] border border-white/20'
          : 'w-48 h-10 px-3 py-2 ' + (notification.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-green-500/20 text-green-400 border border-green-500/40')
      }`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center gap-2">
        {notification.type === 'error' ? (
          <AlertCircle className="w-4 h-4" />
        ) : (
          <CheckCircle className="w-4 h-4" />
        )}
        <span>{isExpanded ? notification.full : notification.brief}</span>
      </div>
    </div>
  );
}

function AppLayout({
  children,
  activeItem,
  onNavClick,
  walletAddress,
  walletName,
  name,
  profilePicture,
  onConnectWallet,
  showProfile,
  onProfileClick,
  onEditProfile,
  onEditWalletName,
  dropdownRef,
  handleCopyAddress,
  showCopiedPopup,
  handleExport,
  handleImport,
  handleLogout,
  bgIndex,
  backgroundImages,
  handleSwitchBackground,
  notification,
  setNotification,
  isNotificationExpanded,
  setIsNotificationExpanded
}: LayoutProps) {
  const location = useLocation();
  const hideHeader = location.pathname === '/blogs' || location.pathname === '/presale';
  return (
    <>
      {/* Background wrapper with dynamic image */}
      <div className="app-background" style={{ backgroundImage: `url(${backgroundImages[bgIndex]})` }} />

      {/* Notification Component */}
      <NotificationComponent
        notification={notification}
        isExpanded={isNotificationExpanded}
        setIsExpanded={setIsNotificationExpanded}
      />

      {/* Main app content */}
      <div className="app-container relative h-screen flex flex-col p-6 overflow-hidden">
        <div className="grid grid-cols-[280px_1fr] gap-6 flex-1 min-h-0">
          <Sidebar activeItem={activeItem} onNavClick={onNavClick} />
          <div className="space-y-4 flex flex-col h-full min-h-0">
            <div className="relative">
            {!hideHeader && (
              <Header
                walletAddress={walletAddress}
                walletName={walletName}
                name={name}
                profilePicture={profilePicture}
                onConnectWallet={onConnectWallet}
                onProfileClick={onProfileClick}
                onEditProfile={onEditProfile}
                onEditWalletName={onEditWalletName}
                setNotification={setNotification}
              />
            )}
              {showProfile && (
                <div
                  ref={dropdownRef}
                  className="absolute top-[calc(100%-2.5rem)] right-4 bg-white/10 backdrop-blur-lg shadow-lg border border-white/20 rounded-xl p-4 flex flex-col gap-2 z-10"
                >
                  <div className="relative">
                    <p
                      className="text-sm text-text-primary cursor-pointer hover:text-accent-orange transition-colors"
                      onClick={handleCopyAddress}
                      title="Click to copy full address"
                    >
                      Address: {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not connected'}
                    </p>
                    {showCopiedPopup && (
                      <div className="absolute -top-8 left-0 bg-success-green text-white text-xs px-2 py-1 rounded shadow-lg">
                        Copied!
                      </div>
                    )}
                  </div>
                 
                  <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                          <button
                    className="bg-accent-orange text-white rounded-lg hover:bg-orange-600 px-3 py-2 text-sm w-36"
                    onClick={handleExport}
                  >
                    Export Profile
                  </button>
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content
                              className="bg-gray-800/50 backdrop-blur-sm text-white p-2 rounded-md shadow-lg text-sm"
                              sideOffset={30}
                              side="left"
                            >
                              <p>This will export your profile settings. <br/> Private keys or seedphrases are not exported. <br/> Your temporary wallets are linked to your metamask <br/> and follow a deterministic algorithm that does not require <br/> you to save your tempwallets seedphrases.</p>
                              <Tooltip.Arrow className="fill-white" />
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </Tooltip.Provider>

                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                          <label className="bg-accent-orange text-white text-sm rounded-lg hover:bg-orange-600 px-3 py-2 flex items-center justify-center cursor-pointer">
                    Import Profile
                    <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
                  </label>
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content
                              className="bg-gray-800/40 backdrop-blur-sm text-white p-2 rounded-md shadow-lg text-sm"
                              sideOffset={30}
                              side="left"
                            >
                              <p>You can import your saved settings in <br/> JSON format and restore your settings.
                              </p>
                              <Tooltip.Arrow className="fill-white" />
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </Tooltip.Provider>

                  <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                          <button
                    className="bg-danger-red text-white rounded-lg hover:bg-red-600 px-3 py-2 text-sm w-36"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content
                              className="bg-gray-800/40 backdrop-blur-sm text-white p-2 rounded-md shadow-lg text-sm"
                              sideOffset={30}
                              side="left"
                            >
                              <p>This will log you out from tempwallet. <br/> Remember your metamask wallet to login again.
                              </p>
                              <Tooltip.Arrow className="fill-white" />
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </Tooltip.Provider>

          
                </div>
              )}
            </div>
            {children}
          </div>
        </div>
        {/* Background switcher button */}
        <button
          className="fixed bottom-4 right-4 p-2 bg-primary text-primary-foreground rounded-full shadow-md hover:bg-[#3C3AB4] z-10"
          onClick={handleSwitchBackground}
          aria-label="Switch background image"
        >
          <Image className="w-6 h-6" />
        </button>
      </div>
    </>
  );
}

function AppRoutes({
  walletAddress,
  currentAccountWallets,
  onWalletCreated,
  onWalletDeleted,
  onTransactionSent,
  setNotification
}: {
  walletAddress: string | null;
  currentAccountWallets: Wallet[];
  onWalletCreated: (wallet: Wallet) => void;
  onWalletDeleted: (wallet: Wallet) => void;
  onTransactionSent: (wallet: Wallet, status: TransactionStatus) => void;
  setNotification: (notification: { brief: string; full: string; type: 'error' | 'success' } | null) => void;
}) {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard"
        element={
          <MainContent
            walletAddress={walletAddress}
            wallets={currentAccountWallets}
            onWalletCreated={onWalletCreated}
            onWalletDeleted={onWalletDeleted}
            onTransactionSent={onTransactionSent}
            setNotification={setNotification}
          />
        }
      />
      <Route path="/blogs" element={<BlogListing />} />
      <Route path="/presale" element={<PresalePage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function AppRouterContent(props: any) {
  const location = useLocation();
  const navigate = useNavigate();

  // Update active item based on route
  useEffect(() => {
    const getActiveItemFromPath = (pathname: string): string => {
      switch (pathname) {
        case '/':
        case '/dashboard':
          return 'Dashboard';
        case '/blogs':
          return 'Blogs';
        case '/presale':
          return 'Presale';
        default:
          return 'Dashboard';
      }
    };

    const path = location.pathname;
    props.setActiveItem(getActiveItemFromPath(path));
  }, [location.pathname, props.setActiveItem]);

  // Enhanced navigation handler
  const enhancedHandleNavClick = (item: string) => {
    props.setActiveItem(item);
    switch (item) {
      case 'Dashboard':
        navigate('/dashboard');
        break;
      case 'Blogs':
        navigate('/blogs');
        break;
      case 'Presale':
        navigate('/presale');
        break;
      default:
        break;
    }
  };

  if (!props.hasSubmittedName) {
    return (
      <>
        {/* Background wrapper with dynamic image */}
        <div className="app-background" style={{ backgroundImage: `url(${props.backgroundImages[props.bgIndex]})` }} />
        <div className="app-container relative min-h-screen flex items-center justify-center">
          <div className="name-form bg-[var(--overlay)] backdrop-blur-[var(--blur)] rounded-xl p-6 shadow-lg max-w-md w-full">
            <h1 className="text-4xl font-bold text-white mb-4">Temp Wallet dApp</h1>
            <form onSubmit={props.handleNameSubmit} className="space-y-4">
              <label htmlFor="name-input" className="text-lg font-medium text-white">
                Enter Your Name
              </label>
              <input
                id="name-input"
                type="text"
                value={props.name}
                onChange={(e) => props.setName(e.target.value)}
                placeholder="Your Name"
                autoFocus
                className="w-full px-3 py-2 bg-transparent text-white placeholder-white/50 border border-white/20 rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-[var(--radius)] hover:bg-gray-400/50 hover:scale-105 hover:shadow-md transition-all duration-200"
              >
                Submit
              </button>
            </form>
          </div>
          {/* Background switcher button */}
          <button
            className="fixed bottom-4 right-4 p-2 bg-primary text-primary-foreground rounded-full shadow-md hover:bg-[#3C3AB4] z-10"
            onClick={props.handleSwitchBackground}
            aria-label="Switch background image"
          >
            <Image className="w-6 h-6" />
          </button>
        </div>
        <NotificationComponent
          notification={props.notification}
          isExpanded={props.isNotificationExpanded}
          setIsExpanded={props.setIsNotificationExpanded}
        />
      </>
    );
  }

  return (
    <AppLayout
      activeItem={props.activeItem}
      onNavClick={enhancedHandleNavClick}
      walletAddress={props.walletAddress}
      walletName={props.walletName}
      name={props.name}
      profilePicture={props.profilePicture}
      onConnectWallet={props.handleConnectWallet}
      showProfile={props.showProfile}
      onProfileClick={() => props.setShowProfile(!props.showProfile)}
      onEditProfile={props.handleEditProfile}
      onEditWalletName={props.handleEditWalletName}
      dropdownRef={props.dropdownRef}
      handleCopyAddress={props.handleCopyAddress}
      showCopiedPopup={props.showCopiedPopup}
      handleExport={props.handleExport}
      handleImport={props.handleImport}
      handleLogout={props.handleLogout}
      bgIndex={props.bgIndex}
      backgroundImages={props.backgroundImages}
      handleSwitchBackground={props.handleSwitchBackground}
      notification={props.notification}
      setNotification={props.setNotification}
      isNotificationExpanded={props.isNotificationExpanded}
      setIsNotificationExpanded={props.setIsNotificationExpanded}
    >
      <AppRoutes
        walletAddress={props.walletAddress}
        currentAccountWallets={props.currentAccountWallets}
        onWalletCreated={props.handleWalletCreated}
        onWalletDeleted={props.handleWalletDeleted}
        onTransactionSent={props.handleTransactionSent}
        setNotification={props.setNotification}
      />
    </AppLayout>
  );
}

function App() {
  const [showLandingPage, setShowLandingPage] = useState<boolean>(true);
  const [isDesktop, setIsDesktop] = useState<boolean>(true);
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [activeItem, setActiveItem] = useState<string>('Dashboard');
  const [hasSubmittedName, setHasSubmittedName] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string>('wallet-name');
  const [notification, setNotification] = useState<Notification | null>(null);
  const [userData, setUserData] = useState<UserData>({
    accounts: [],
    activeAccount: null,
    walletNames: {},
  });
  // State for background image
  const backgroundImages: string[] = ['/bg7.jpg','/bg2.jpg','/bg1.jpg', '/bg3.jpg', '/bg4.jpg','/bg5.jpg','/bg6.jpg'];
  const [bgIndex, setBgIndex] = useState<number>(0);
  const [isNotificationExpanded, setIsNotificationExpanded] = useState(false);

  // Function to cycle background images
  const handleSwitchBackground = () => {
    setBgIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-dismiss notifications after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
        setIsNotificationExpanded(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Add this useEffect for handling clicks outside the dropdown
useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && showProfile) {
      setShowProfile(false);
    }
  }

  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [showProfile]);

const [showCopiedPopup, setShowCopiedPopup] = useState(false);
const dropdownRef = useRef<HTMLDivElement>(null);

// Add this function for copying address
const handleCopyAddress = async () => {
  if (walletAddress) {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setShowCopiedPopup(true);
      setTimeout(() => setShowCopiedPopup(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  }
};

  useEffect(() => {
    // Load profile data
    const storedProfile = localStorage.getItem('tempWalletProfile');
    if (storedProfile) {
      const { name: storedName, profilePicture: storedPicture } = JSON.parse(storedProfile);
      setName(storedName || '');
      setProfilePicture(storedPicture || null);
      setHasSubmittedName(true);
    }

    // Load user data
    const storedUserData = localStorage.getItem('tempWalletUserData');
    if (storedUserData) {
      const parsedData: UserData = JSON.parse(storedUserData);
      if (parsedData.accounts && Array.isArray(parsedData.accounts)) {
        setUserData({ ...parsedData, walletNames: parsedData.walletNames || {} });
        if (parsedData.activeAccount) {
          setWalletAddress(parsedData.activeAccount);
        }
      }
    }

    // MetaMask account changes listener
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          const storedWalletNames = localStorage.getItem('tempWalletNames');
          if (storedWalletNames) {
            const walletNames = JSON.parse(storedWalletNames);
            setWalletName(walletNames[accounts[0]] || 'wallet-name');
          } else {
            setWalletName('wallet-name');
          }
          // Update user data with new active account
          setUserData(prevUserData => {
            const newUserData = { ...prevUserData };
            if (!newUserData.accounts) {
              newUserData.accounts = [];
            }

            // Find or create account
            let accountIndex = newUserData.accounts.findIndex((acc) => acc.account === walletAddress);
            if (accountIndex === -1) {
              // Create new account
              const newAccount = {
                account: walletAddress!,
                name: walletName,
                externalAccountNumber: 1,
                wallets: []
              };
              newUserData.accounts = [...newUserData.accounts, newAccount];
            } else {
              // Update existing account
              const account = { ...newUserData.accounts[accountIndex] };
              account.name = walletName;
              newUserData.accounts = newUserData.accounts.map((acc, index) =>
                index === accountIndex ? account : acc
              );
            }

            localStorage.setItem('tempWalletUserData', JSON.stringify(newUserData));
            return newUserData;
          });
        } else {
          setWalletAddress(null);
          setWalletName('wallet-name');
          const emptyUserData = { accounts: [], activeAccount: null, walletNames: {} };
          setUserData(emptyUserData);
          localStorage.setItem('tempWalletUserData', JSON.stringify(emptyUserData));
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      // Cleanup listener on unmount
      return () => {
        if (window.ethereum?.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, []); // Empty dependency array - only run once on mount

  // Separate effect for handling wallet name updates when walletAddress changes
  useEffect(() => {
    if (walletAddress) {
      const storedWalletNames = localStorage.getItem('tempWalletNames');
      if (storedWalletNames) {
        const walletNames = JSON.parse(storedWalletNames);
        if (walletNames[walletAddress]) {
          setWalletName(walletNames[walletAddress]);
        }
      }
    }
  }, [walletAddress]);

  const handleConnectWallet = async () => {
    if (!window.ethereum) {
      setNotification({
        brief: 'MetaMask not found',
        full: 'Please install MetaMask and try again',
        type: 'error',
      });
      return false;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        const storedWalletNames = localStorage.getItem('tempWalletNames');
        if (storedWalletNames) {
          const walletNames = JSON.parse(storedWalletNames);
          setWalletName(walletNames[accounts[0]] || 'wallet-name');
        } else {
          setWalletName('wallet-name');
        }
        const newUserData = { ...userData, activeAccount: accounts[0], walletNames: userData.walletNames || {} };
        setUserData(newUserData);
        localStorage.setItem('tempWalletUserData', JSON.stringify(newUserData));
        setNotification({
          brief: 'Wallet connected',
          full: 'Successfully connected to MetaMask',
          type: 'success',
        });
        return true;
      }
      // No accounts returned – treat as cancelled
      throw new Error('No accounts returned from provider');
    } catch (error: any) {
      if (error.code === 4001) {
        setNotification({
          brief: 'Connection rejected',
          full: 'MetaMask connection failed: User rejected the request',
          type: 'error',
        });
      } else {
        setNotification({
          brief: 'Connection failed',
          full: error.message || 'Failed to connect to MetaMask',
          type: 'error',
        });
      }
      // Re-throw the error so that callers can react appropriately
      throw error;
    }
  };

  const handleExport = () => {
    const success = exportUserData();
    setNotification({
      brief: success ? 'Export successful' : 'Export failed',
      full: success ? 'Profile exported successfully' : 'Failed to export wallets',
      type: success ? 'success' : 'error',
    });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const result = await importUserData(file);
    setNotification({
      brief: result.success ? 'Import successful' : 'Import failed',
      full: result.message,
      type: result.success ? 'success' : 'error',
    });
    if (result.success) {
      const storedData = localStorage.getItem('tempWalletUserData');
      const storedProfile = localStorage.getItem('tempWalletProfile');
      if (storedData) {
        const parsedData: UserData = JSON.parse(storedData);
        setUserData({ ...parsedData, walletNames: parsedData.walletNames || {} });
        setWalletAddress(parsedData.activeAccount);
      }
      if (storedProfile) {
        const { name: importedName } = JSON.parse(storedProfile);
        setName(importedName || '');
      }
      const storedWalletNames = localStorage.getItem('tempWalletNames');
      if (storedWalletNames) {
        const walletNames = JSON.parse(storedWalletNames);
        const activeAccount = userData?.activeAccount;
        if (activeAccount && walletNames[activeAccount]) {
          setWalletName(walletNames[activeAccount]);
        } else {
          setWalletName('wallet-name');
        }
      }
    }
    event.target.value = '';
  };


  const handleLogout = () => {
    setHasSubmittedName(false);
    setName('');
    setProfilePicture(null);
    setWalletAddress(null);
    setWalletName('wallet-name');
    setShowProfile(false);
    setActiveItem('Dashboard');
    setUserData({ accounts: [], activeAccount: null, walletNames: {} });
    localStorage.removeItem('tempWalletProfile');
    localStorage.removeItem('tempWalletNames');
    localStorage.setItem('tempWalletUserData', JSON.stringify({ accounts: [], activeAccount: null, walletNames: {} }));
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setHasSubmittedName(true);
      localStorage.setItem('tempWalletProfile', JSON.stringify({ name, profilePicture }));
    }
  };

  const handleEditProfile = (newName: string, newProfilePicture: string | null) => {
    setName(newName);
    setProfilePicture(newProfilePicture);
    localStorage.setItem('tempWalletProfile', JSON.stringify({ name: newName, profilePicture: newProfilePicture }));
  };

  const handleEditWalletName = (newWalletName: string) => {
    if (walletAddress) {
      setWalletName(newWalletName);
      const storedWalletNames = localStorage.getItem('tempWalletNames');
      const walletNames = storedWalletNames ? JSON.parse(storedWalletNames) : {};
      walletNames[walletAddress] = newWalletName;
      localStorage.setItem('tempWalletNames', JSON.stringify(walletNames));
      setUserData({ ...userData, walletNames: { ...walletNames } });
    }
  };

  const handleWalletCreated = (wallet: Wallet) => {
    setUserData(prevUserData => {
      const newUserData = { ...prevUserData };
      if (!newUserData.accounts) {
        newUserData.accounts = [];
      }

      // Find or create account
      let accountIndex = newUserData.accounts.findIndex((acc) => acc.account === walletAddress);
      if (accountIndex === -1) {
        // Create new account
        const newAccount = {
          account: walletAddress!,
          name: walletName,
          externalAccountNumber: 1,
          wallets: [wallet]
        };
        newUserData.accounts = [...newUserData.accounts, newAccount];
      } else {
        // Update existing account
        const account = { ...newUserData.accounts[accountIndex] };
        const existingWalletIndex = account.wallets.findIndex(
          (w) => w.address === wallet.address && w.walletNumber === wallet.walletNumber
        );

        if (existingWalletIndex !== -1) {
          // Update existing wallet
          account.wallets = account.wallets.map((w, index) =>
            index === existingWalletIndex ? wallet : w
          );
        } else {
          // Add new wallet
          account.wallets = [...account.wallets, wallet];
        }

        // Update accounts array immutably
        newUserData.accounts = newUserData.accounts.map((acc, index) =>
          index === accountIndex ? account : acc
        );
      }

      localStorage.setItem('tempWalletUserData', JSON.stringify(newUserData));
      return newUserData;
    });
  };

  const handleWalletDeleted = (wallet: Wallet) => {
    setUserData(prevUserData => {
      const newUserData = { ...prevUserData };
      const accountIndex = newUserData.accounts.findIndex((acc) => acc.account === walletAddress);

      if (accountIndex !== -1) {
        const account = { ...newUserData.accounts[accountIndex] };
        account.wallets = account.wallets.filter(
          (w) => !(w.address === wallet.address && w.walletNumber === wallet.walletNumber)
        );

        // Update accounts array immutably
        newUserData.accounts = newUserData.accounts.map((acc, index) =>
          index === accountIndex ? account : acc
        );

        localStorage.setItem('tempWalletUserData', JSON.stringify(newUserData));
      }

      return newUserData;
    });
  };

  const handleTransactionSent = (wallet: Wallet, status: TransactionStatus) => {
    setUserData(prevUserData => {
      const newUserData = { ...prevUserData };
      const accountIndex = newUserData.accounts.findIndex((acc) => acc.account === walletAddress);

      if (accountIndex !== -1) {
        const account = { ...newUserData.accounts[accountIndex] };
        const walletIndex = account.wallets.findIndex(
          (w) => w.address === wallet.address && w.walletNumber === wallet.walletNumber
        );

        if (walletIndex !== -1) {
          account.wallets = account.wallets.map((w, index) =>
            index === walletIndex ? { ...w, transactionStatus: status } : w
          );

          // Update accounts array immutably
          newUserData.accounts = newUserData.accounts.map((acc, index) =>
            index === accountIndex ? account : acc
          );

          localStorage.setItem('tempWalletUserData', JSON.stringify(newUserData));
        }
      }

      return newUserData;
    });
  };

  // --- CHANGE: Render the new animated landing page ---
  if (showLandingPage) {
    return <AnimatedLandingPage onComplete={() => setShowLandingPage(false)} />;
  }

  if (!isDesktop) {
    return <UnsupportedDevice />;
  }

  const currentAccountWallets = userData.accounts.find((acc) => acc.account === walletAddress)?.wallets || [];

return (
  <Router>
    <AppRouterContent
      hasSubmittedName={hasSubmittedName}
      name={name}
      setName={setName}
      handleNameSubmit={handleNameSubmit}
      backgroundImages={backgroundImages}
      bgIndex={bgIndex}
      handleSwitchBackground={handleSwitchBackground}
      activeItem={activeItem}
      setActiveItem={setActiveItem}
      walletAddress={walletAddress}
      walletName={walletName}
      profilePicture={profilePicture}
      handleConnectWallet={handleConnectWallet}
      showProfile={showProfile}
      setShowProfile={setShowProfile}
      handleEditProfile={handleEditProfile}
      handleEditWalletName={handleEditWalletName}
      dropdownRef={dropdownRef}
      handleCopyAddress={handleCopyAddress}
      showCopiedPopup={showCopiedPopup}
      handleExport={handleExport}
      handleImport={handleImport}
      handleLogout={handleLogout}
      currentAccountWallets={currentAccountWallets}
      handleWalletCreated={handleWalletCreated}
      handleWalletDeleted={handleWalletDeleted}
      handleTransactionSent={handleTransactionSent}
      notification={notification}
      setNotification={setNotification}
      isNotificationExpanded={isNotificationExpanded}
      setIsNotificationExpanded={setIsNotificationExpanded}
    />
  </Router>
);
}


export default App;
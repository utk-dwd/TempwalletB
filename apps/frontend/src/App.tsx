// src/App.tsx

import '@/index.css';
import { AlertCircle, CheckCircle } from 'lucide-react';
import * as Tooltip from "@radix-ui/react-tooltip";
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
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { BlogListing } from '@/components/pages/BlogListing';
import PresalePage from './components/pages/PresalePage';
import { connectWallet } from './utils/provider';
import Settings from './components/pages/Settings';
import api from '@/services/api.js';
import { NETWORKS } from '@/utils/networks';
import { fetchWalletAllBalances } from '@/utils/walletUtils';

const toCamel = (s: string) => {
  return s.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase()
      .replace('-', '')
      .replace('_', '');
  });
};

const transformWalletData = (wallet: any): Wallet => {
  const newWallet: any = {};
  for (const key in wallet) {
    newWallet[toCamel(key)] = wallet[key];
  }
  // Manually ensure walletNumber is a number if it comes as a string
  if (newWallet.walletNumber) {
    newWallet.walletNumber = Number(newWallet.walletNumber);
  }
  return newWallet as Wallet;
};


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
  const hideHeader = location.pathname === '/faq' || location.pathname === '/presale';
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
  setNotification,
  onRefreshWallets
}: {
  walletAddress: string | null;
  currentAccountWallets: Wallet[];
  onWalletCreated: (wallet: Wallet) => void;
  onWalletDeleted: (wallet: Wallet) => void;
  onTransactionSent: (wallet: Wallet, status: TransactionStatus) => void;
  setNotification: (notification: { brief: string; full: string; type: 'error' | 'success' } | null) => void;
  onRefreshWallets: () => Promise<void>;
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
            onRefreshWallets={onRefreshWallets}
          />
        }
      />
      <Route path="/faq" element={<BlogListing />} />
      <Route path="/presale" element={<PresalePage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
      <Route path="/settings" element={<Settings />} />
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
      case '/faq':
        return 'FAQ';
      case '/presale':
        return 'Presale';
      case '/settings':
        return 'Settings';
      default:
        return 'Dashboard';
    }
  };    const path = location.pathname;
    props.setActiveItem(getActiveItemFromPath(path));
  }, [location.pathname, props.setActiveItem]);

  // Enhanced navigation handler
  const enhancedHandleNavClick = (item: string) => {
    props.setActiveItem(item);
    switch (item) {
      case 'Dashboard':
        navigate('/dashboard');
        break;
      case 'FAQ':
        navigate('/faq');
        break;
      case 'Presale':
        navigate('/presale');
        break;
      default:
        break;
    }
  };

  // Skip name form - go directly to AppLayout
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
        onRefreshWallets={props.onRefreshWallets}
      />
    </AppLayout>
  );
}

// Replace your existing App function with this corrected version
function App() {
  // 1. All state declarations first
  const [showLandingPage, setShowLandingPage] = useState<boolean>(true); // Show animation loading first
  const [isDesktop, setIsDesktop] = useState<boolean>(true);
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [activeItem, setActiveItem] = useState<string>('Dashboard');
  const [name, setName] = useState<string>('USER'); // Default name, no prompt needed
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string>('wallet-name');
  const [notification, setNotification] = useState<Notification | null>(null);
  const [userData, setUserData] = useState<UserData>({
    accounts: [],
    activeAccount: null,
    walletNames: {},
  });
  const backgroundImages: string[] = ['/bg7.jpg','/bg2.jpg','/bg1.jpg', '/bg3.jpg', '/bg4.jpg','/bg5.jpg','/bg6.jpg'];
  const [bgIndex, setBgIndex] = useState<number>(0);
  const [isNotificationExpanded, setIsNotificationExpanded] = useState(false);
  const [showCopiedPopup, setShowCopiedPopup] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 2. All functions next
  const fetchExistingWallets = async () => {
    if (!walletAddress) return;
    
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        console.log('No access token found, trying to authenticate...');
        await authenticateAndFetchWallets();
        return;
      }

      console.log('Fetching wallets for address:', walletAddress);
      // Use API service instead of hardcoded localhost URL
      const response = await api.get('/wallets');

      const { data } = response.data;
      // --- KEY CHANGE: Transform each wallet object and fetch balances ---
      const walletsWithBalances = await Promise.all(
        data.map(async (wallet: any) => {
          const transformedWallet = transformWalletData(wallet);
          
          const network = NETWORKS[transformedWallet.networkKey as keyof typeof NETWORKS];
          if (network) {
            const balances = await fetchWalletAllBalances(transformedWallet.address, network);
            return { ...transformedWallet, allTokenBalances: balances };
          }
          return transformedWallet;
        })
      );
      // ---------------------------------------------
      
      console.log('Fetched and transformed wallets from backend with balances:', walletsWithBalances);
      
      setUserData(prevUserData => {
          const newUserData = { ...prevUserData };
          if (!newUserData.accounts) {
            newUserData.accounts = [];
          }

          let accountIndex = newUserData.accounts.findIndex((acc) => acc?.account === walletAddress);
          if (accountIndex === -1) {
            const newAccount = {
              account: walletAddress,
              name: walletName,
              externalAccountNumber: 1,
              wallets: walletsWithBalances || []
            };
            newUserData.accounts = [...newUserData.accounts, newAccount];
            console.log('Created new account with wallets:', newAccount);
          } else {
            const account = { ...newUserData.accounts[accountIndex] };
            account.wallets = walletsWithBalances || [];
            newUserData.accounts = newUserData.accounts.map((acc, index) =>
              index === accountIndex ? account : acc
            );
            console.log('Updated existing account with wallets:', account);
          }

          localStorage.setItem('tempWalletUserData', JSON.stringify(newUserData));
          return newUserData;
        });
    } catch (error) {
      console.error('Failed to fetch existing wallets:', error);
    }
  };

// REPLACE the existing authenticateAndFetchWallets function with this one
  const authenticateAndFetchWallets = async () => {
    if (!walletAddress) return;
    
    try {
      console.log('Authenticating wallet:', walletAddress);
      const message = `Authenticate wallet: ${walletAddress}`;
      
      if (!window.ethereum) {
        console.error('MetaMask not found');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      const authResponse = await api.post('/auth/authenticate', {
        walletAddress, 
        signature, 
        message
      });

      const { accessToken } = authResponse.data;
      localStorage.setItem('accessToken', accessToken);
      console.log('Authentication successful, fetching wallets...');

      const walletsResponse = await api.get('/wallets');

      const { data } = walletsResponse.data;
      // --- KEY CHANGE: Transform each wallet object and fetch balances ---
      const walletsWithBalances = await Promise.all(
        data.map(async (wallet: any) => {
          const transformedWallet = transformWalletData(wallet);
          
          const network = NETWORKS[transformedWallet.networkKey as keyof typeof NETWORKS];
          if (network) {
            const balances = await fetchWalletAllBalances(transformedWallet.address, network);
            return { ...transformedWallet, allTokenBalances: balances };
          }
          return transformedWallet;
        })
      );
      // ---------------------------------------------
      console.log('Fetched and transformed wallets after authentication with balances:', walletsWithBalances);
          
          setUserData(prevUserData => {
            const newUserData = { ...prevUserData };
            if (!newUserData.accounts) {
              newUserData.accounts = [];
            }

            let accountIndex = newUserData.accounts.findIndex((acc) => acc?.account === walletAddress);
            if (accountIndex === -1) {
              const newAccount = {
                account: walletAddress,
                name: walletName,
                externalAccountNumber: 1,
                wallets: wallets || []
              };
              newUserData.accounts = [...newUserData.accounts, newAccount];
            } else {
              const account = { ...newUserData.accounts[accountIndex] };
              account.wallets = wallets || [];
              newUserData.accounts = newUserData.accounts.map((acc, index) =>
                index === accountIndex ? account : acc
              );
            }

            localStorage.setItem('tempWalletUserData', JSON.stringify(newUserData));
            return newUserData;
          });
    } catch (error) {
      console.error('Failed to authenticate and fetch wallets:', error);
    }
  };


  const handleSwitchBackground = () => {
    setBgIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
  };

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

  const handleConnectWallet = async () => {
    const result = await connectWallet();
    if (result.success) {
      const address = result.address;
      setWalletAddress(address);
      const storedWalletNames = localStorage.getItem('tempWalletNames');
      const walletNames = storedWalletNames ? JSON.parse(storedWalletNames) : {};
      setWalletName(walletNames[address] || 'wallet-name');
      const newUserData = { ...userData, activeAccount: address };
      setUserData(newUserData);
      localStorage.setItem('tempWalletUserData', JSON.stringify(newUserData));
      setNotification({
        brief: 'Wallet connected',
        full: 'Successfully connected to MetaMask',
        type: 'success',
      });
      return true;
    } else {
      setNotification({
        brief: 'Connection failed',
        full: 'error' in result ? result.error : 'Failed to connect wallet',
        type: 'error',
      });
      return false;
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
    setName('USER'); // Reset to default name
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
      let accountIndex = newUserData.accounts.findIndex((acc) => acc?.account === walletAddress);
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
        
        // Add null check for wallet objects in the array
        const existingWalletIndex = account.wallets.findIndex(
          (w) => w?.address === wallet?.address && w?.walletNumber === wallet?.walletNumber
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

  const handleWalletDeleted = async (wallet: Wallet) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) throw new Error('No access token found');

      // Call backend to soft-delete wallet
      const response = await api.delete(`/wallets/${wallet.id}`);

      // API service handles response automatically (throws on error)
      
      // Update local state after successful backend deletion
      setUserData(prevUserData => {
        const newUserData = { ...prevUserData };
        const accountIndex = newUserData.accounts.findIndex((acc) => acc?.account === walletAddress);
        if (accountIndex !== -1) {
          const account = { ...newUserData.accounts[accountIndex] };
          account.wallets = account.wallets.filter(
            (w) => w && !(w.address === wallet?.address && w.walletNumber === wallet?.walletNumber)
          );
          newUserData.accounts = newUserData.accounts.map((acc, index) =>
            index === accountIndex ? account : acc
          );
          localStorage.setItem('tempWalletUserData', JSON.stringify(newUserData));
        }
        return newUserData;
      });

      // Step 2: Refresh wallets from backend
      await fetchExistingWallets();
    } catch (error: any) {
      setNotification({
        brief: 'Delete failed',
        full: error.message,
        type: 'error',
      });
    }
  };

  const handleTransactionSent = (wallet: Wallet, status: TransactionStatus) => {
    setUserData(prevUserData => {
      const newUserData = { ...prevUserData };
      const accountIndex = newUserData.accounts.findIndex((acc) => acc?.account === walletAddress);

      if (accountIndex !== -1) {
        const account = { ...newUserData.accounts[accountIndex] };
        
        // Add null check for wallet objects
        const walletIndex = account.wallets.findIndex(
          (w) => w?.address === wallet?.address && w?.walletNumber === wallet?.walletNumber
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

  // 3. ALL useEffect hooks together - MOVED TO THE TOP
  useEffect(() => {
    // Restore profile and wallet session from localStorage on initial load
    const storedProfile = localStorage.getItem('tempWalletProfile');
    if (storedProfile) {
      const { name: storedName, profilePicture: storedProfilePicture } = JSON.parse(storedProfile);
      if (storedName) {
        setName(storedName);
        setProfilePicture(storedProfilePicture || null);
      }
    } else {
      // Auto-create profile with default name "USER" for new users
      localStorage.setItem('tempWalletProfile', JSON.stringify({ name: 'USER', profilePicture: null }));
    }

    const storedUserData = localStorage.getItem('tempWalletUserData');
    if (storedUserData) {
      const parsedData: UserData = JSON.parse(storedUserData);
      setUserData(parsedData);
      if (parsedData.activeAccount) {
        setWalletAddress(parsedData.activeAccount);
      }
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
        setIsNotificationExpanded(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

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

  useEffect(() => {
    if (walletAddress) {
      console.log('Wallet address changed, fetching wallets for:', walletAddress);
      fetchExistingWallets();
    }
  }, [walletAddress]);


  // 4. Early returns are now AFTER all hooks
  if (showLandingPage) {
    return <AnimatedLandingPage onComplete={() => setShowLandingPage(false)} />;
  }

  if (!isDesktop) {
    return <UnsupportedDevice />;
  }

  // 5. Final component logic and return
  const currentAccountWallets = userData.accounts
    .find((acc) => acc?.account === walletAddress)?.wallets
    .filter((wallet) => wallet != null) || [];

  return (
    <Router>
      <AppRouterContent
        name={name}
        setName={setName}
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
        onRefreshWallets={fetchExistingWallets}
      />
    </Router>
  );
}

export default App;
// src/App.tsx
import { useState, useEffect, useRef, Dispatch, SetStateAction, useCallback } from 'react'; // Added useCallback
import { ethers } from 'ethers';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MainContent } from '@/components/layout/MainContent';
import { AnimatedLandingPage } from '@/components/pages/AnimatedLandingPage';
import { UnsupportedDevice } from '@/components/pages/UnsupportedDevice';
import { Wallet, UserData, TransactionStatus, WalletAccount, SupportedNetwork, TokenDetails } from '@/utils/types'; // Updated Wallet, UserData imports
import { exportUserData, importUserData } from './utils/exportImport';
import '@/index.css';
import { Image } from 'lucide-react'; 
import { AlertCircle, CheckCircle } from 'lucide-react';
import * as Tooltip from "@radix-ui/react-tooltip";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { BlogListing } from '@/components/pages/BlogListing';
import PresalePage from './components/pages/PresalePage';
import { supabase, setAuthToken } from './lib/supabaseClient'; // Import supabase client and setAuthToken
import { signMessage } from './utils/walletUtils'; // Import signMessage
import { NETWORKS } from './utils/networks'; // Import NETWORKS for the signMessage call

// component definition: (Props interfaces remain the same)
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
  setNotification
}: {
  walletAddress: string | null;
  currentAccountWallets: Wallet[];
  onWalletCreated: (wallet: Wallet) => void;
  onWalletDeleted: (walletId: string) => void; // Changed to walletId for Supabase delete
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
      <Route path="/faq" element={<BlogListing />} />
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
        case '/faq':
          return 'FAQ';
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
  // UserData now represents data from Supabase, not local storage
  const [userData, setUserData] = useState<UserData>({
    accounts: [],
    activeAccount: null,
    walletNames: {},
  });
  const backgroundImages: string[] = ['/bg7.jpg','/bg2.jpg','/bg1.jpg', '/bg3.jpg', '/bg4.jpg','/bg5.jpg','/bg6.jpg'];
  const [bgIndex, setBgIndex] = useState<number>(0);
  const [isNotificationExpanded, setIsNotificationExpanded] = useState(false);

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

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
        setIsNotificationExpanded(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const [showCopiedPopup, setShowCopiedPopup] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // --- NEW: Supabase Authentication and Data Fetching ---
  const fetchUserDataFromSupabase = useCallback(async (currentMetamaskAddress: string) => {
    try {
      // Fetch user profile name
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('name, profile_picture, total_wallets_created') // Assuming 'name' and 'profile_picture' cols
        .eq('metamask_address', currentMetamaskAddress.toLowerCase())
        .single();

      if (profileError) throw profileError;
      
      setName(userProfile?.name || `User_${currentMetamaskAddress.slice(0, 6)}`); // Default name
      setProfilePicture(userProfile?.profile_picture || null); //
      setHasSubmittedName(true); // User is known if we fetched data

      // Fetch temporary wallets for this user
      const { data: tempWallets, error: walletsError } = await supabase
        .from('temp_wallets')
        .select('*')
        .eq('parent_metamask_address', currentMetamaskAddress.toLowerCase())
        .is('deleted_at', null); // Only active wallets

      if (walletsError) throw walletsError;

      // Fetch balances for all temp wallets
      const walletsWithBalances: Wallet[] = [];
      for (const tempWallet of tempWallets || []) {
        const { data: balancesData, error: balancesError } = await supabase
          .from('balances')
          .select('*')
          .eq('temp_wallet_id', tempWallet.id);

        if (balancesError) {
          console.error(`Error fetching balances for wallet ${tempWallet.address}:`, balancesError.message);
          // Continue even if balances fail for one wallet
        }
        
        // Map Supabase temp_wallet to frontend Wallet interface
        const mappedWallet: Wallet = {
          id: tempWallet.id, // Supabase ID
          address: tempWallet.address as `0x${string}`, //
          walletNumber: tempWallet.wallet_number, //
          externalAccountNumber: tempWallet.external_account_number, //
          index: tempWallet.index, //
          networkKey: tempWallet.network_key as SupportedNetwork, //
          transactionStatus: { state: 'idle' }, // Default status
          allTokenBalances: (balancesData || []).map(b => ({ // Map fetched balances
            address: b.token_address as `0x${string}`, //
            chainId: b.chain_id, //
            amount: b.amount, //
            decimals: b.decimals, //
            formattedAmount: b.formatted_amount, //
            symbol: b.symbol, //
            iconUrl: undefined, // Zerion provides icon, but not stored in DB currently. Will need to re-fetch or derive.
          })),
          // Calculate native balance from allTokenBalances
          balance: (balancesData || []).find(b => b.token_address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')?.formatted_amount || '0', //
        };
        walletsWithBalances.push(mappedWallet);
      }

      const activeAccountData: WalletAccount = { // Create the active account structure
        account: currentMetamaskAddress, //
        name: userProfile?.name || `User_${currentMetamaskAddress.slice(0, 6)}`, //
        externalAccountNumber: 1, // Default, as we're linking to the primary MetaMask account
        wallets: walletsWithBalances, // All fetched temp wallets
      };

      setUserData({ // Update global UserData state
        accounts: [activeAccountData], // Assuming only one active MetaMask account at a time
        activeAccount: currentMetamaskAddress, //
        walletNames: {}, // Wallet names are now stored in the 'users' table or derived
      });

      // Set wallet name from profile or default
      setWalletName(userProfile?.name || `wallet-name`);

    } catch (error: any) {
      console.error('Failed to fetch user data from Supabase:', error.message);
      setNotification({ brief: 'Data sync failed', full: 'Could not load your wallets from the server.', type: 'error' });
      setHasSubmittedName(false); // If data fetch fails, assume no submitted name
      setWalletAddress(null); // Disconnect wallet on error
    }
  }, [setNotification]);

  useEffect(() => {
    // Check for existing Supabase session on load
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (session) {
        // If session exists, set wallet address from session user's metadata or from local storage if available
        const metamaskAddressFromSession = session.user.user_metadata?.metamask_address || localStorage.getItem('lastConnectedMetamaskAddress');
        if (metamaskAddressFromSession) {
          setWalletAddress(metamaskAddressFromSession);
          await fetchUserDataFromSupabase(metamaskAddressFromSession); // Fetch user data associated with this address
        }
      } else if (error) {
        console.error('Error getting Supabase session:', error.message);
        setWalletAddress(null);
        setUserData({ accounts: [], activeAccount: null, walletNames: {} }); // Clear local data
        localStorage.removeItem('tempWalletProfile'); // Clear local profile
        localStorage.removeItem('tempWalletUserData'); // Clear local user data
      }
    };

    checkSession();

    // MetaMask account changes listener
    if (window.ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length > 0) {
          const newAccount = accounts[0];
          setWalletAddress(newAccount);
          localStorage.setItem('lastConnectedMetamaskAddress', newAccount); // Store for persistence
          await fetchUserDataFromSupabase(newAccount); // Re-fetch data for new account
        } else {
          // No accounts, user disconnected MetaMask
          setWalletAddress(null);
          setWalletName('wallet-name');
          setHasSubmittedName(false);
          setName('');
          setProfilePicture(null);
          setUserData({ accounts: [], activeAccount: null, walletNames: {} });
          // Clear Supabase session on MetaMask disconnect
          await supabase.auth.signOut();
          localStorage.removeItem('lastConnectedMetamaskAddress');
          localStorage.removeItem('tempWalletProfile');
          localStorage.removeItem('tempWalletUserData');
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        if (window.ethereum?.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, [fetchUserDataFromSupabase]); // Add fetchUserDataFromSupabase to dependencies

  // This effect is likely redundant now that fetchUserDataFromSupabase handles walletName
  useEffect(() => {
    if (walletAddress) {
      // Logic to fetch wallet name from Supabase 'users' table based on walletAddress (metamask_address)
      // or set a default if not found
      const fetchWalletName = async () => {
        const { data, error } = await supabase
          .from('users')
          .select('name')
          .eq('metamask_address', walletAddress.toLowerCase())
          .single();
        if (data) {
          setWalletName(data.name || 'wallet-name');
        } else if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
          console.error('Error fetching wallet name from Supabase:', error.message);
        }
      };
      fetchWalletName();
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
        const connectedAccount = accounts[0];
        // Request signature for authentication with Edge Function
        const signature = await signMessage(NETWORKS.Avalanche); // Use a default network for signing, it doesn't matter for the message.
        
        // Call the Edge Function for authentication
        const authResponse = await fetch('/functions/v1/auth', { // Adjust URL based on your Supabase functions path
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metamask_address: connectedAccount,
            signature: signature,
          }),
        });

        if (!authResponse.ok) {
          const errorBody = await authResponse.json();
          throw new Error(`Authentication failed: ${errorBody.error || authResponse.statusText}`);
        }

        const { token, user_id, mixpanel_id, total_wallets_created } = await authResponse.json();
        await setAuthToken(token); // Set the Supabase session token

        setWalletAddress(connectedAccount);
        localStorage.setItem('lastConnectedMetamaskAddress', connectedAccount); // Store for quick re-connect
        
        // Fetch/update user data from Supabase
        await fetchUserDataFromSupabase(connectedAccount);

        // Update Mixpanel identity if mixpanel_id is returned
        if (mixpanel_id) {
          analyticsService.identify(mixpanel_id);
        } else {
          // If no mixpanel_id, set an alias or new identity
          analyticsService.alias(user_id, connectedAccount); // Alias new user to their Supabase ID
        }
        
        // Set people properties in Mixpanel
        analyticsService.setPeople({
          $name: name, // Use current name from state
          walletAddress: connectedAccount,
          totalWalletsCreated: total_wallets_created, // Use total_wallets_created from auth response
          lastLogin: new Date().toISOString(), //
        });


        setNotification({
          brief: 'Wallet connected',
          full: 'Successfully connected to MetaMask and authenticated',
          type: 'success',
        });
        return true;
      }
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
      console.error('Failed to connect MetaMask:', error);
      return false;
    }
  };

  const handleExport = () => {
    // Export functionality will now work with the data structure in userData, which comes from Supabase.
    // However, the `exportUserData` function still directly reads from localStorage for 'tempWalletUserData'
    // and 'tempWalletProfile'. We need to ensure that `userData` state is accurately reflected in localStorage
    // if `exportUserData` continues to rely on it. A better approach would be to pass `userData` directly.
    // For now, assuming localStorage is kept in sync.
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
    const result = await importUserData(file); // importUserData needs update to interact with Supabase
    setNotification({
      brief: result.success ? 'Import successful' : 'Import failed',
      full: result.message,
      type: result.success ? 'success' : 'error',
    });
    if (result.success) {
      // After import, re-fetch from Supabase to ensure consistency
      if (walletAddress) {
        await fetchUserDataFromSupabase(walletAddress);
      } else {
        // If wallet not connected, prompt to connect
        setNotification({ brief: 'Connect Wallet', full: 'Please connect MetaMask to see imported data.', type: 'error' });
      }
    }
    event.target.value = ''; // Clear file input
  };


  const handleLogout = async () => {
    await supabase.auth.signOut(); // Sign out from Supabase
    setHasSubmittedName(false);
    setName('');
    setProfilePicture(null);
    setWalletAddress(null);
    setWalletName('wallet-name');
    setShowProfile(false);
    setActiveItem('Dashboard');
    setUserData({ accounts: [], activeAccount: null, walletNames: {} }); // Clear local state
    localStorage.removeItem('lastConnectedMetamaskAddress'); // Clear local cache
    localStorage.removeItem('tempWalletProfile'); // Clear local profile
    localStorage.removeItem('tempWalletUserData'); // Clear local user data
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setHasSubmittedName(true);
      if (walletAddress) {
        // Update user's name in Supabase
        const { error } = await supabase
          .from('users')
          .update({ name: name, profile_picture: profilePicture }) // Update both if profilePicture is there
          .eq('metamask_address', walletAddress.toLowerCase()); // Use metamask_address to identify user
        if (error) {
          console.error('Failed to update user profile in Supabase:', error.message);
          setNotification({ brief: 'Profile update failed', full: 'Could not save your name to the server.', type: 'error' });
        } else {
          setNotification({ brief: 'Profile updated', full: 'Your name has been saved.', type: 'success' });
        }
      }
      // Keep local storage for compatibility with export/import for now
      localStorage.setItem('tempWalletProfile', JSON.stringify({ name, profilePicture }));
    }
  };

  const handleEditProfile = async (newName: string, newProfilePicture: string | null) => {
    setName(newName);
    setProfilePicture(newProfilePicture);
    if (walletAddress) {
      // Update user's profile in Supabase
      const { error } = await supabase
        .from('users')
        .update({ name: newName, profile_picture: newProfilePicture })
        .eq('metamask_address', walletAddress.toLowerCase()); // Identify by metamask_address
      if (error) {
        console.error('Failed to update user profile in Supabase:', error.message);
        setNotification({ brief: 'Profile update failed', full: 'Could not save profile changes to the server.', type: 'error' });
      } else {
        setNotification({ brief: 'Profile updated', full: 'Your profile has been saved.', type: 'success' });
      }
    }
    localStorage.setItem('tempWalletProfile', JSON.stringify({ name: newName, profilePicture: newProfilePicture })); // Keep local storage for export/import compatibility
  };

  const handleEditWalletName = async (newWalletName: string) => {
    if (walletAddress) {
      setWalletName(newWalletName);
      // Update the name of the *user's account* in the 'users' table in Supabase
      const { error } = await supabase
        .from('users')
        .update({ name: newWalletName })
        .eq('metamask_address', walletAddress.toLowerCase());
      if (error) {
        console.error('Failed to update wallet name in Supabase:', error.message);
        setNotification({ brief: 'Wallet name update failed', full: 'Could not save wallet name to the server.', type: 'error' });
      } else {
        setNotification({ brief: 'Wallet name updated', full: 'Your wallet name has been saved.', type: 'success' });
      }
      // Update local UserData state (assuming it's a single account for simplicity for now)
      setUserData(prevUserData => {
        const updatedAccounts = prevUserData.accounts.map(acc => 
          acc.account.toLowerCase() === walletAddress.toLowerCase() 
            ? { ...acc, name: newWalletName } 
            : acc
        );
        return { ...prevUserData, accounts: updatedAccounts, walletNames: { ...prevUserData.walletNames, [walletAddress.toLowerCase()]: newWalletName } }; // Keep local walletNames for now
      });
      localStorage.setItem('tempWalletNames', JSON.stringify({ [walletAddress]: newWalletName })); // Keep local storage for compatibility
    }
  };

  const handleWalletCreated = (wallet: Wallet) => {
    // This function now primarily updates the local state with the wallet that was ALREADY
    // synced to the backend in walletUtils.ts (it should contain its Supabase ID)
    setUserData(prevUserData => {
      const newUserData = { ...prevUserData };
      if (!newUserData.accounts) {
        newUserData.accounts = [];
      }

      let accountIndex = newUserData.accounts.findIndex((acc) => acc.account.toLowerCase() === walletAddress?.toLowerCase());
      if (accountIndex === -1) {
        // This case should ideally not happen if handleConnectWallet fetched initial user data
        const newAccount: WalletAccount = {
          account: walletAddress!,
          name: walletName, // Use current wallet name
          externalAccountNumber: 1, // Default
          wallets: [wallet]
        };
        newUserData.accounts = [...newUserData.accounts, newAccount];
      } else {
        const account = { ...newUserData.accounts[accountIndex] };
        const existingWalletIndex = account.wallets.findIndex(
          (w) => w.id === wallet.id // Use Supabase ID for unique identification
        );

        if (existingWalletIndex !== -1) {
          account.wallets = account.wallets.map((w, index) =>
            index === existingWalletIndex ? wallet : w
          );
        } else {
          account.wallets = [...account.wallets, wallet];
        }
        newUserData.accounts = newUserData.accounts.map((acc, index) =>
          index === accountIndex ? account : acc
        );
      }
      return newUserData;
    });
    // No localStorage.setItem('tempWalletUserData') here, as data flow is now from Supabase
  };

  const handleWalletDeleted = async (walletId: string) => { // Now accepts walletId
    try {
      // Call Edge Function to soft delete wallet
      const response = await fetch(`/functions/v1/temp-wallets/${walletId}`, { //
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await supabase.auth.getSession().then(s => s.data.session?.access_token)}`
        },
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Failed to delete wallet: ${errorBody.error || response.statusText}`);
      }

      setNotification({ brief: 'Wallet deleted', full: 'Temporary wallet successfully deleted.', type: 'success' });

      // Update local state by filtering out the deleted wallet
      setUserData(prevUserData => {
        const newUserData = { ...prevUserData };
        const accountIndex = newUserData.accounts.findIndex((acc) => acc.account.toLowerCase() === walletAddress?.toLowerCase());

        if (accountIndex !== -1) {
          const account = { ...newUserData.accounts[accountIndex] };
          account.wallets = account.wallets.filter(w => w.id !== walletId); // Filter by Supabase ID
          newUserData.accounts = newUserData.accounts.map((acc, index) =>
            index === accountIndex ? account : acc
          );
        }
        return newUserData;
      });

    } catch (error: any) {
      console.error('Failed to delete wallet:', error.message);
      setNotification({ brief: 'Deletion failed', full: `Failed to delete wallet: ${error.message}`, type: 'error' });
    }
  };

  const handleTransactionSent = (wallet: Wallet, status: TransactionStatus) => {
    // This function only updates local state to reflect transaction status,
    // actual transaction logging to DB is handled in walletUtils.ts sendTransaction.
    setUserData(prevUserData => {
      const newUserData = { ...prevUserData };
      const accountIndex = newUserData.accounts.findIndex((acc) => acc.account.toLowerCase() === walletAddress?.toLowerCase());

      if (accountIndex !== -1) {
        const account = { ...newUserData.accounts[accountIndex] };
        const walletIndex = account.wallets.findIndex(
          (w) => w.id === wallet.id // Use Supabase ID
        );

        if (walletIndex !== -1) {
          account.wallets = account.wallets.map((w, index) =>
            index === walletIndex ? { ...w, transactionStatus: status } : w
          );
          newUserData.accounts = newUserData.accounts.map((acc, index) =>
            index === accountIndex ? account : acc
          );
        }
      }
      return newUserData;
    });
  };

  if (showLandingPage) {
    return <AnimatedLandingPage onComplete={() => setShowLandingPage(false)} />;
  }

  if (!isDesktop) {
    return <UnsupportedDevice />;
  }

  const currentAccountWallets = userData.accounts.find((acc) => acc.account.toLowerCase() === walletAddress?.toLowerCase())?.wallets || [];

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
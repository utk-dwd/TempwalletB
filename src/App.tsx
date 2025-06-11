// src/App.tsx
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MainContent } from '@/components/layout/MainContent';
import { LandingPage } from '@/components/pages/LandingPage';
import { UnsupportedDevice } from '@/components/pages/UnsupportedDevice';
import { Wallet, UserData, TransactionStatus } from '@/utils/types';
import { exportUserData, importUserData } from './utils/exportImport';
import '@/index.css';
import { Image } from 'lucide-react'; // Icon for switching backgrounds
import { Analytics } from "@vercel/analytics/next"

function App() {
  const [showLandingPage, setShowLandingPage] = useState<boolean>(true);
  const [isDesktop, setIsDesktop] = useState<boolean>(true);
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeItem, setActiveItem] = useState<string>('Dashboard');
  const [hasSubmittedName, setHasSubmittedName] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string>('wallet-name');
  const [userData, setUserData] = useState<UserData>({
    accounts: [],
    activeAccount: null,
    walletNames: {},
  });
  // State for background image
  const backgroundImages: string[] = ['/bg2.jpg', '/bg1.jpg', '/bg3.jpg', '/bg4.jpg','/bg5.jpg','/bg6.jpg'];
  const [bgIndex, setBgIndex] = useState<number>(0);

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
            const newUserData = { ...prevUserData, activeAccount: accounts[0], walletNames: prevUserData.walletNames || {} };
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

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleConnectWallet = async () => {
    if (window.ethereum) {
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
        }
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        setFeedback({ type: 'error', message: 'Failed to connect wallet' });
      }
    } else {
      setFeedback({ type: 'error', message: 'MetaMask not detected' });
    }
  };

  const handleExport = () => {
    const success = exportUserData();
    setFeedback({
      type: success ? 'success' : 'error',
      message: success ? 'Export successful' : 'Failed to export wallets',
    });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const result = await importUserData(file);
    setFeedback({
      type: result.success ? 'success' : 'error',
      message: result.message,
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
    setFeedback(null);
    setUserData({ accounts: [], activeAccount: null, walletNames: {} });
    localStorage.removeItem('tempWalletProfile');
    localStorage.removeItem('tempWalletNames');
    localStorage.setItem('tempWalletUserData', JSON.stringify({ accounts: [], activeAccount: null, walletNames: {} }));
  };

  const handleNavClick = (item: string) => {
    setActiveItem(item);
    console.log(`Navigating to ${item}`);
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

  if (showLandingPage) {
    return <LandingPage onComplete={() => setShowLandingPage(false)} />;
  }

  if (!isDesktop) {
    return <UnsupportedDevice />;
  }

  if (!hasSubmittedName) {
    return (
      <>
        {/* Background wrapper with dynamic image */}
        <div className="app-background" style={{ backgroundImage: `url(${backgroundImages[bgIndex]})` }} />
        <div className="relative min-h-screen flex items-center justify-center">
          <div className="name-form bg-[var(--overlay)] backdrop-blur-[var(--blur)] rounded-xl p-6 shadow-lg max-w-md w-full">
            <h1 className="text-4xl font-bold text-white mb-4">Temp Wallet dApp</h1>
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <label htmlFor="name-input" className="text-lg font-medium text-white">
                Enter Your Name
              </label>
              <input
                id="name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
            onClick={handleSwitchBackground}
            aria-label="Switch background image"
          >
            <Image className="w-6 h-6" />
          </button>
        </div>
      </>
    );
  }

  const currentAccountWallets = userData.accounts.find((acc) => acc.account === walletAddress)?.wallets || [];

  return (
    <>
      {/* Background wrapper with dynamic image */}
      <div className="app-background" style={{ backgroundImage: `url(${backgroundImages[bgIndex]})` }} />
      {/* Main app content */}
      <div className="relative h-screen flex flex-col p-6 overflow-hidden">
        <div className="grid grid-cols-[280px_1fr] gap-6 flex-1 min-h-0">
          <Sidebar activeItem={activeItem} onNavClick={handleNavClick} />
          <div className="space-y-4 flex flex-col h-full min-h-0">
            <div className="relative">
              <Header
                walletAddress={walletAddress}
                walletName={walletName}
                name={name}
                profilePicture={profilePicture}
                onConnectWallet={handleConnectWallet}
                onProfileClick={() => setShowProfile(!showProfile)}
                onEditProfile={handleEditProfile}
                onEditWalletName={handleEditWalletName}
              />
              {showProfile && (
                <div className="absolute top-[calc(100%+0.5rem)] right-4 bg-white/10 backdrop-blur-lg shadow-lg border border-white/20 rounded-xl p-4 flex flex-col gap-2 z-10">
                  <p className="text-sm text-text-primary">
                    Address: {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not connected'}
                  </p>
                  <p className="text-sm text-text-primary">Full Address: {walletAddress || 'Not connected'}</p>
                  <button
                    className="bg-accent-orange text-white rounded-lg hover:bg-orange-600 px-4 py-2"
                    onClick={handleExport}
                  >
                    Export Wallets
                  </button>
                  <label className="bg-accent-orange text-white text-regular rounded-lg hover:bg-orange-600 px-4 py-2 flex items-center justify-center cursor-pointer">
                    Import Wallets
                    <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
                  </label>
                  <button
                    className="bg-danger-red text-white rounded-lg hover:bg-red-600 px-4 py-2"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                  {feedback && (
                    <p className={`text-sm ${feedback.type === 'success' ? 'text-success-green' : 'text-danger-red'}`}>
                      {feedback.message}
                    </p>
                  )}
                </div>
              )}
            </div>
            <MainContent
              walletAddress={walletAddress}
              wallets={currentAccountWallets}
              onWalletCreated={handleWalletCreated}
              onWalletDeleted={handleWalletDeleted}
              onTransactionSent={handleTransactionSent}
            />
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

<Analytics />

export default App;
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

    // Load wallet names
    const storedWalletNames = localStorage.getItem('tempWalletNames');
    if (storedWalletNames) {
      const walletNames = JSON.parse(storedWalletNames);
      if (walletAddress && walletNames[walletAddress]) {
        setWalletName(walletNames[walletAddress]);
      }
    }

    // MetaMask account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
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
        } else {
          setWalletAddress(null);
          setWalletName('wallet-name');
          setUserData({ accounts: [], activeAccount: null, walletNames: {} });
          localStorage.setItem('tempWalletUserData', JSON.stringify({ accounts: [], activeAccount: null, walletNames: {} }));
        }
      });
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
    const newUserData = { ...userData };
    if (!newUserData.accounts) {
      newUserData.accounts = [];
    }
    let account = newUserData.accounts.find(acc => acc.account === walletAddress);
    if (!account) {
      account = { account: walletAddress!, name: walletName, externalAccountNumber: 1, wallets: [] };
      newUserData.accounts.push(account);
    }
    const existingWalletIndex = account.wallets.findIndex(
      w => w.address === wallet.address && w.walletNumber === wallet.walletNumber
    );
    if (existingWalletIndex !== -1) {
      account.wallets[existingWalletIndex] = wallet;
    } else {
      account.wallets.push(wallet);
    }
    setUserData(newUserData);
    localStorage.setItem('tempWalletUserData', JSON.stringify(newUserData));
  };

  const handleWalletDeleted = (wallet: Wallet) => {
    const newUserData = { ...userData };
    const account = newUserData.accounts.find(acc => acc.account === walletAddress);
    if (account) {
      account.wallets = account.wallets.filter(
        w => !(w.address === wallet.address && w.walletNumber === wallet.walletNumber)
      );
      setUserData(newUserData);
      localStorage.setItem('tempWalletUserData', JSON.stringify(newUserData));
    }
  };

  const handleTransactionSent = (wallet: Wallet, status: TransactionStatus) => {
    const newUserData = { ...userData };
    const account = newUserData.accounts.find(acc => acc.account === walletAddress);
    if (account) {
      const walletIndex = account.wallets.findIndex(
        w => w.address === wallet.address && w.walletNumber === wallet.walletNumber
      );
      if (walletIndex !== -1) {
        account.wallets[walletIndex] = {
          ...account.wallets[walletIndex],
          transactionStatus: status,
        };
        setUserData(newUserData);
        localStorage.setItem('tempWalletUserData', JSON.stringify(newUserData));
      }
    }
  };

  if (showLandingPage) {
    return <LandingPage onComplete={() => setShowLandingPage(false)} />;
  }

  if (!isDesktop) {
    return <UnsupportedDevice />;
  }

  if (!hasSubmittedName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-bg">
        <div className="name-form">
          <h1 className="text-4xl font-bold">Temp Wallet dApp</h1>
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <label htmlFor="name-input" className="text-lg font-medium">Enter Your Name</label>
            <input
              id="name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-orange"
            />
            <button
              type="submit"
              className="w-full px-4 py-2 bg-accent-orange text-white rounded-lg hover:bg-orange-600"
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    );
  }

  const currentAccountWallets = userData.accounts.find(acc => acc.account === walletAddress)?.wallets || [];

  return (
    <div className="min-h-screen bg-primary-bg p-6">
      <div className="grid grid-cols-[280px_1fr] gap-6 h-screen">
        <Sidebar activeItem={activeItem} onNavClick={handleNavClick} />
        <div className="space-y-4 flex flex-col">
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
    </div>
  );
}

export default App;
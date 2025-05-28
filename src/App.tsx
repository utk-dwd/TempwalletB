// src/App.tsx
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProfileDropdown } from '@/components/layout/ProfileDropdown';
import { LandingPage } from '@/components/pages/LandingPage';
import { UnsupportedDevice } from '@/components/pages/UnsupportedDevice';
import '@/index.css';

interface UserData {
  accounts: { account: string; name: string; wallets: any[] }[];
  activeAccount: string | null;
}

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

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Load profile data from local storage
    const storedProfile = localStorage.getItem('tempWalletProfile');
    if (storedProfile) {
      const { name: storedName, profilePicture: storedPicture } = JSON.parse(storedProfile);
      setName(storedName || '');
      setProfilePicture(storedPicture || null);
      setHasSubmittedName(true);
    }

    // Load wallet names from local storage
    const storedWalletNames = localStorage.getItem('tempWalletNames');
    if (storedWalletNames) {
      const walletNames = JSON.parse(storedWalletNames);
      if (walletAddress && walletNames[walletAddress]) {
        setWalletName(walletNames[walletAddress]);
      }
    }

    // Listen for MetaMask account changes
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
        } else {
          setWalletAddress(null);
          setWalletName('wallet-name');
        }
      });
    }
  }, [walletAddress]);

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
    setFeedback({ type: 'success', message: 'Export successful' });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFeedback({ type: 'success', message: 'Import successful' });
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
    localStorage.removeItem('tempWalletProfile');
    localStorage.removeItem('tempWalletNames');
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

  return (
    <div className="min-h-screen bg-primary-bg p-6">
      <div className="grid grid-cols-[280px_1fr] gap-6 h-screen">
        <Sidebar activeItem={activeItem} onNavClick={handleNavClick} />
        <div className="space-y-4 flex flex-col">
          {/* Header Spanning Remaining Width */}
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
              <ProfileDropdown
                address={walletAddress}
                onExport={handleExport}
                onImport={handleImport}
                onLogout={handleLogout}
                feedback={feedback}
              />
            )}
          </div>
          {/* Placeholder for Main Content */}
        </div>
      </div>
    </div>
  );
}

export default App;
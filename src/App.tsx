// src/App.tsx
import { useState, useEffect } from 'react';
import { createSmartAccount, createSmartAccountWithCounter, getBalance, getTokenBalance } from './utils/walletUtils';
import { exportUserData, importUserData } from './utils/exportImport';
import { Wallet, UserData, WalletAccount, TransactionStatus } from './utils/types';
import WalletConnector from './components/WalletConnector';
import SendTransactionForm from './components/SendTransactionForm';
import { formatEther, formatUnits } from 'viem';
import './App.css';

// Logo (using a simple SVG placeholder; replace with actual logo in public/)
const ProfileLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="#646cff" />
    <circle cx="12" cy="8" r="4" fill="white" />
    <path d="M12 14c-4 0-6 2-6 4v2h12v-2c0-2-2-4-6-4z" fill="white" />
  </svg>
);

function App() {
  const [hasSubmittedName, setHasSubmittedName] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [userData, setUserData] = useState<UserData>({ accounts: [], activeAccount: null });
  const [error, setError] = useState<string | null>(null);
  const [customCounter, setCustomCounter] = useState<string>('');
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [sendWallet, setSendWallet] = useState<Wallet | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load user data from localStorage on mount
  useEffect(() => {
    const storedData = localStorage.getItem('tempWalletUserData');
    if (storedData) {
      try {
        const parsedData: UserData = JSON.parse(storedData);
        if (parsedData.accounts && Array.isArray(parsedData.accounts)) {
          setUserData(parsedData);
          if (parsedData.accounts.length > 0) {
            setHasSubmittedName(true);
            setName(parsedData.accounts[0].name || '');
          }
        } else {
          setUserData({ accounts: [], activeAccount: null });
        }
      } catch (err) {
        console.error('Failed to parse userData:', err);
        setUserData({ accounts: [], activeAccount: null });
      }
    }
  }, []);

  // Refresh balances after wallet creation or switch
  useEffect(() => {
    const refreshBalances = async () => {
      const newUserData = { ...userData };
      for (const account of newUserData.accounts) {
        for (const wallet of account.wallets) {
          wallet.balance = await getBalance(wallet.address);
          wallet.tokenBalance = await getTokenBalance(wallet.address);
        }
      }
      setUserData(newUserData);
      localStorage.setItem('tempWalletUserData', JSON.stringify(newUserData));
    };
    if (userData.accounts.length > 0) {
      refreshBalances();
    }
  }, [userData.activeAccount, userData.accounts.length]);

  // Clear feedback after 5 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Handle name form submission
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      const newUserData: UserData = { accounts: [], activeAccount: null };
      setUserData(newUserData);
      localStorage.setItem('tempWalletUserData', JSON.stringify(newUserData));
      setHasSubmittedName(true);
    } else {
      setError('Please enter a valid name');
    }
  };

  const handleCreateSmartAccount = async () => {
    if (!userData.activeAccount) return;
    try {
      const accountData = userData.accounts.find((acc) => acc.account.toLowerCase() === userData.activeAccount?.toLowerCase());
      if (!accountData) throw new Error('Active account not found');
      const wallet = await createSmartAccount(userData.activeAccount, accountData.externalAccountNumber);
      const newUserData = { ...userData };
      const updatedAccountData = newUserData.accounts.find((acc) => acc.account.toLowerCase() === userData.activeAccount?.toLowerCase());
      if (updatedAccountData) {
        updatedAccountData.wallets.push(wallet);
        setUserData(newUserData);
        localStorage.setItem('tempWalletUserData', JSON.stringify(newUserData));
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to create smart account');
    }
  };

  const handleCreateWithCounter = async () => {
    if (!userData.activeAccount) return;
    try {
      const counter = parseInt(customCounter, 10);
      if (isNaN(counter) || counter < 0) {
        throw new Error('Please enter a non-negative integer');
      }
      const accountData = userData.accounts.find((acc) => acc.account.toLowerCase() === userData.activeAccount?.toLowerCase());
      if (!accountData) throw new Error('Active account not found');
      const wallet = await createSmartAccountWithCounter(userData.activeAccount, counter, accountData.externalAccountNumber);
      const newUserData = { ...userData };
      const updatedAccountData = newUserData.accounts.find((acc) => acc.account.toLowerCase() === userData.activeAccount?.toLowerCase());
      if (updatedAccountData) {
        updatedAccountData.wallets.push(wallet);
        setUserData(newUserData);
        localStorage.setItem('tempWalletUserData', JSON.stringify(newUserData));
      }
      setCustomCounter('');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to create smart account with counter');
    }
  };

  const handleSwitchAccount = (account: string) => {
    const newUserData = { ...userData, activeAccount: account };
    const accountData = newUserData.accounts.find((acc) => acc.account.toLowerCase() === account.toLowerCase());
    if (accountData) {
      setName(accountData.name || '');
    }
    setUserData(newUserData);
    localStorage.setItem('tempWalletUserData', JSON.stringify(newUserData));
    setShowProfile(false);
    setCustomCounter('');
    setError(null);
    setSendWallet(null);
  };

  const handleLogout = () => {
    setUserData({ accounts: [], activeAccount: null });
    setName('');
    setHasSubmittedName(false);
    setShowProfile(false);
    setCustomCounter('');
    setError(null);
    setSendWallet(null);
    localStorage.removeItem('tempWalletUserData');
  };

  const handleSendTransaction = (wallet: Wallet, status: TransactionStatus) => {
    const newUserData = { ...userData };
    const accountData = newUserData.accounts.find((acc) => acc.account.toLowerCase() === userData.activeAccount?.toLowerCase());
    if (accountData) {
      const walletData = accountData.wallets.find((w) => w.address === wallet.address && w.walletNumber === wallet.walletNumber);
      if (walletData) {
        walletData.transactionStatus = status;
        walletData.balance = wallet.balance;
        walletData.tokenBalance = wallet.tokenBalance;
        setUserData(newUserData);
        localStorage.setItem('tempWalletUserData', JSON.stringify(newUserData));
      }
    }
    if (status.state === 'success') {
      setSendWallet(null);
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
      if (storedData) {
        const parsedData: UserData = JSON.parse(storedData);
        setUserData(parsedData);
        if (parsedData.accounts.length > 0) {
          setName(parsedData.accounts.find((acc) => acc.account.toLowerCase() === parsedData.activeAccount?.toLowerCase())?.name || '');
        }
      }
    }
    event.target.value = ''; // Reset file input
  };

  if (!hasSubmittedName) {
    return (
      <div className="name-form">
        <h1>Temp Wallet dApp</h1>
        <form onSubmit={handleNameSubmit}>
          <label htmlFor="name-input">Enter Your Name</label>
          <input
            id="name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
            autoFocus
          />
          <button type="submit">Submit</button>
        </form>
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      </div>
    );
  }

  const activeAccountData = userData.accounts.find((acc) => acc.account.toLowerCase() === userData.activeAccount?.toLowerCase());

  return (
    <div className="app-container">
      {/* Profile Section */}
      <div className="profile">
        <button className="profile-button" onClick={() => setShowProfile(!showProfile)}>
          <ProfileLogo />
          <span>{name}</span>
        </button>
        {showProfile && (
          <div className="profile-dropdown">
            <p>Address: {userData.activeAccount ? `${userData.activeAccount.slice(0, 6)}...${userData.activeAccount.slice(-4)}` : 'Not connected'}</p>
            <p>Full Address: {userData.activeAccount || 'Not connected'}</p>
            <button onClick={handleExport}>Export Wallets</button>
            <label className="import-button">
              Import Wallets
              <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            </label>
            <button onClick={handleLogout}>Logout</button>
            {feedback && (
              <p className={`transaction-status ${feedback.type}`}>
                {feedback.message}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Wallet Toggle */}
      <div className="wallet-toggle">
        <label htmlFor="wallet-select">Switch Wallet:</label>
        <select
          id="wallet-select"
          value={userData.activeAccount || ''}
          onChange={(e) => handleSwitchAccount(e.target.value)}
          disabled={userData.accounts.length === 0}
        >
          {userData.accounts.length === 0 && <option value="">No wallets connected</option>}
          {userData.accounts.map((acc) => (
            <option key={acc.account} value={acc.account}>
              External Account {acc.externalAccountNumber} ({acc.account.slice(0, 6)}...{acc.account.slice(-4)})
            </option>
          ))}
        </select>
        <WalletConnector userData={userData} setUserData={setUserData} setError={setError} name={name} />
      </div>

      {/* Main UI */}
      <h1>Temp Wallet dApp</h1>
      {userData.activeAccount ? (
        <>
          <button onClick={handleCreateSmartAccount} disabled={!userData.activeAccount}>
            Create Smart Account
          </button>
          <div>
            <input
              type="number"
              value={customCounter}
              onChange={(e) => setCustomCounter(e.target.value)}
              placeholder="Enter counter number"
              disabled={!userData.activeAccount}
              min="0"
            />
            <button onClick={handleCreateWithCounter} disabled={!userData.activeAccount || !customCounter}>
              Create with Counter
            </button>
          </div>
          <p>
            Connected Account: External Account {activeAccountData?.externalAccountNumber || 'Unknown'} ({userData.activeAccount.slice(0, 6)}...{userData.activeAccount.slice(-4)})
          </p>
          {activeAccountData && activeAccountData.wallets.length > 0 ? (
            <div>
              <h3>Smart Accounts</h3>
              {activeAccountData.wallets.map((wallet) => (
                <div key={`${wallet.address}-${wallet.walletNumber}`} className="wallet-item">
                  <p>
                    External Account {wallet.externalAccountNumber} - Counter: {wallet.walletNumber} - Address: {wallet.address}
                    <span className="balance">
                      AVAX: {wallet.balance ? formatEther(BigInt(wallet.balance)) : '0'} | USDC: {wallet.tokenBalance ? formatUnits(BigInt(wallet.tokenBalance), 6) : '0'}
                    </span>
                    <button
                      onClick={() => setSendWallet(wallet)}
                      disabled={wallet.transactionStatus?.state === 'pending'}
                    >
                      Send
                    </button>
                  </p>
                  {wallet.transactionStatus && wallet.transactionStatus.state !== 'idle' && (
                    <p className={`transaction-status ${wallet.transactionStatus.state}`}>
                      {wallet.transactionStatus.state === 'success' ? (
                        <a
                          href={`https://testnet.snowtrace.io/tx/${wallet.transactionStatus.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {wallet.transactionStatus.message}
                        </a>
                      ) : (
                        wallet.transactionStatus.message
                      )}
                    </p>
                  )}
                  {sendWallet && sendWallet.address === wallet.address && sendWallet.walletNumber === wallet.walletNumber && (
                    <SendTransactionForm
                      account={userData.activeAccount || ''}
                      walletAddress={wallet.address}
                      index={wallet.index}
                      onSend={(status) => handleSendTransaction(wallet, status)}
                      onClose={() => setSendWallet(null)}
                      balance={wallet.balance || '0'}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No smart accounts created for this wallet.</p>
          )}
        </>
      ) : (
        <p>No wallet connected. Please connect a wallet to create smart accounts.</p>
      )}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
    </div>
  );
}

export default App;
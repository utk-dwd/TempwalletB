// Main App component to test MetaMask connection and Biconomy tempwallet creation/sending
// Dependency: react (^19.1.0) for component rendering
// Dependency: ethers (^6.14.0) for provider integration
// Dependency: @biconomy/abstractjs (^0.0.3) for gasless smart account transactions
// Integration: Tests getProvider, createTempWallet, createTempWalletWithNumber, and sendCrypto utilities
import { useState } from 'react';
import { getProvider } from './utils/provider';
import { createTempWallet, createTempWalletWithNumber, sendCrypto } from './utils/walletUtils';
import { Wallet } from './utils/types';
import './App.css';

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [customWalletNumber, setCustomWalletNumber] = useState<string>('');
  const [sendForm, setSendForm] = useState<{ wallet: Wallet | null; recipient: string; amount: string }>({
    wallet: null,
    recipient: '',
    amount: '',
  });
  const [txHash, setTxHash] = useState<string | null>(null); // New state for transaction hash

  const connectMetaMask = async () => {
    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
      setError(null);
      setTxHash(null);
    } catch (err: any) {
      setError(err.message);
      setAccount(null);
    }
  };

  const handleCreateTempWallet = async () => {
    try {
      const wallet = await createTempWallet();
      setWallets([...wallets, wallet]);
      setError(null);
      setTxHash(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateWithWalletNumber = async () => {
    try {
      const walletNumber = parseInt(customWalletNumber, 10);
      if (isNaN(walletNumber) || walletNumber < 0) {
        throw new Error('Please enter a non-negative integer');
      }
      const wallet = await createTempWalletWithNumber(walletNumber);
      setWallets([...wallets, wallet]);
      setCustomWalletNumber('');
      setError(null);
      setTxHash(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSendCrypto = async () => {
    try {
      if (!sendForm.wallet) {
        throw new Error('No wallet selected for sending');
      }
      if (!sendForm.recipient.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error('Invalid recipient address');
      }
      const amount = parseFloat(sendForm.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Amount must be positive');
      }
      const hash = await sendCrypto(sendForm.wallet, sendForm.recipient, sendForm.amount);
      console.log('Transaction sent with hash:', hash);
      // setTxHash(hash); // Store transaction hash for display
      setSendForm({ wallet: null, recipient: '', amount: '' });
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openSendForm = (wallet: Wallet) => {
    setSendForm({ wallet, recipient: '', amount: '' });
    setTxHash(null);
  };

  return (
    <div>
      <h1>Temp Wallet dApp</h1>
      <button onClick={connectMetaMask}>Connect MetaMask</button>
      <button onClick={handleCreateTempWallet} disabled={!account}>
        Create TempWallet
      </button>
      <div>
        <input
          type="number"
          value={customWalletNumber}
          onChange={(e) => setCustomWalletNumber(e.target.value)}
          placeholder="Enter wallet number"
          disabled={!account}
          min="0"
        />
        <button onClick={handleCreateWithWalletNumber} disabled={!account || !customWalletNumber}>
          Create with Wallet Number
        </button>
      </div>
      {account && (
        <p>
          Connected Account: {account.slice(0, 6)}...{account.slice(-4)}
        </p>
      )}
      {wallets.length > 0 && (
        <div>
          <h3>TempWallets</h3>
          {wallets.map((wallet) => (
            <div key={`${wallet.address}-${wallet.walletNumber}`}>
              <p>
                Wallet Number: {wallet.walletNumber} - Address: {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                <button onClick={() => openSendForm(wallet)} disabled={!account}>
                  Send
                </button>
              </p>
            </div>
          ))}
        </div>
      )}
      {sendForm.wallet && (
        <div>
          <h4>Send from Wallet Number: {sendForm.wallet.walletNumber}</h4>
          <input
            type="text"
            value={sendForm.recipient}
            onChange={(e) => setSendForm({ ...sendForm, recipient: e.target.value })}
            placeholder="Recipient address (0x...)"
          />
          <input
            type="number"
            value={sendForm.amount}
            onChange={(e) => setSendForm({ ...sendForm, amount: e.target.value })}
            placeholder="Amount in AVAX"
            min="0"
            step="0.01"
          />
          <button onClick={handleSendCrypto} disabled={!sendForm.recipient || !sendForm.amount}>
            Confirm Send
          </button>
          <button onClick={() => setSendForm({ wallet: null, recipient: '', amount: '' })}>
            Cancel
          </button>
        </div>
      )}
      {txHash && (
        <p style={{ color: 'green' }}>
          Transaction Sent! Hash: <a href={`https://testnet.snowtrace.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer">{txHash.slice(0, 6)}...{txHash.slice(-4)}</a>
        </p>
      )}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
    </div>
  );
}

export default App;
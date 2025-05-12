// Main App component to test MetaMask connection and 0xGasless SDK
// Dependency: react (^19.1.0) for component rendering
// Dependency: ethers (^6.14.0) for provider integration
// Dependency: @0xgasless/smart-account (^0.0.13) for SmartAccountClient
// Integration: Tests getProvider and initGaslessClient utilities
import { useState } from 'react';
import { getProvider } from './utils/provider';
import { initGaslessClient } from './utils/gaslessUtils';
import './App.css';

function App() {
  // State to store connected MetaMask account
  const [account, setAccount] = useState<string | null>(null);
  // State to track connection status
  const [error, setError] = useState<string | null>(null);
  // State to track 0xGasless SDK initialization
  const [sdkInitialized, setSdkInitialized] = useState<boolean>(false);

  // Function to connect MetaMask
  const connectMetaMask = async () => {
    try {
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setAccount(null);
    }
  };

  // Function to initialize 0xGasless SDK
  const initializeGaslessSdk = async () => {
    try {
      await initGaslessClient();
      setSdkInitialized(true);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setSdkInitialized(false);
    }
  };

  return (
    <div>
      <h1>Temp Wallet dApp</h1>
      <button onClick={connectMetaMask}>Connect MetaMask</button>
      <button onClick={initializeGaslessSdk} disabled={!account}>
        Initialize 0xGasless SDK
      </button>
      {account && (
        <p>
          Connected Account: {account.slice(0, 6)}...{account.slice(-4)}
        </p>
      )}
      {sdkInitialized && <p>0xGasless SDK Initialized Successfully</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
    </div>
  );
}

export default App;
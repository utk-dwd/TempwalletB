// src/components/WalletConnector.tsx
import { useState } from 'react';
import { getProvider } from '../utils/provider';
import { UserData } from '../utils/types';

interface WalletConnectorProps {
  userData: UserData;
  setUserData: (data: UserData) => void;
  setError: (error: string | null) => void;
  name: string;
}

function WalletConnector({ userData, setUserData, setError, name }: WalletConnectorProps) {
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }
      const accounts = await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });
      const address = accounts[0].caveats[0].value[0];
      const provider = await getProvider();
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      if (signerAddress.toLowerCase() !== address.toLowerCase()) {
        throw new Error('Selected account does not match signer');
      }
      const newUserData = { ...userData };
      let accountData = newUserData.accounts.find((acc) => acc.account.toLowerCase() === address.toLowerCase());
      if (!accountData) {
        const externalAccountNumber = newUserData.accounts.length + 1;
        accountData = { account: address, name, externalAccountNumber, wallets: [] };
        newUserData.accounts.push(accountData);
      }
      newUserData.activeAccount = address;
      setUserData(newUserData);
      localStorage.setItem('tempWalletUserData', JSON.stringify(newUserData));
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    }
  };

  return (
    <button onClick={connectWallet}>
      {userData.accounts.length === 0 ? 'Connect Wallet' : 'Connect Another Wallet'}
    </button>
  );
}

export default WalletConnector;
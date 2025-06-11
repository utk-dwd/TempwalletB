// src/utils/provider.ts
import { ethers } from 'ethers';

// Avalanche Mainnet network configuration
const AVALANCHE_MAINNET_PARAMS = {
  chainId: '0xA86A', // 43114 in hexadecimal
  chainName: 'Avalanche Network C-Chain',
  nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
  rpcUrls: ['https://avax-mainnet.g.alchemy.com/v2/quPU3ryAXcLpXf5oXVK4O'],
  blockExplorerUrls: ['https://snowtrace.io/'],
};

// Adds Avalanche Mainnet to MetaMask
const addAvalancheMainnetNetwork = async (): Promise<boolean> => {
  if (!window.ethereum) {
    console.error('MetaMask is not installed!');
    return false;
  }
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [AVALANCHE_MAINNET_PARAMS],
    });
    return true;
  } catch (error) {
    console.error('Error adding Avalanche Mainnet network to MetaMask:', error);
    return false;
  }
};

// Switch to or adds Avalanche Mainnet in MetaMask
const switchToAvalancheMainnet = async (): Promise<boolean> => {
  if (!window.ethereum) {
    console.error('MetaMask is not installed!');
    return false;
  }
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: AVALANCHE_MAINNET_PARAMS.chainId }],
    });
    return true;
  } catch (error: any) {
    if (error.code === 4902) {
      const added = await addAvalancheMainnetNetwork();
      if (added) {
        return await switchToAvalancheMainnet(); // Retry switching
      }
      return false;
    }
    console.error('Error switching to Avalanche Mainnet network:', error);
    return false;
  }
};

// Get the MetaMask provider and ensure Avalanche Mainnet
export const getProvider = async (desiredAccount?: string): Promise<ethers.BrowserProvider> => {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed. Please install the MetaMask browser extension.');
  }
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const switched = await switchToAvalancheMainnet();
    if (!switched) {
      throw new Error('Failed to switch to Avalanche Mainnet.');
    }
    const { chainId } = await provider.getNetwork();
    const mainnetChainId = 43114n;
    if (chainId !== mainnetChainId) {
      throw new Error('Incorrect network. Please ensure MetaMask is on Avalanche Mainnet.');
    }
    // Get current account
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    const currentAccount = accounts[0]?.toLowerCase();
    // If desired account is provided and doesn't match current account
    if (desiredAccount && currentAccount !== desiredAccount.toLowerCase()) {
      try {
        // Request account switch
        const newAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const newAccount = newAccounts[0]?.toLowerCase();
        if (newAccount !== desiredAccount.toLowerCase()) {
          throw new Error('Please select the correct account in MetaMask');
        }
      } catch (error) {
        throw new Error('Failed to switch accounts. Please manually select the correct account in MetaMask.');
      }
    }
    return provider;
  } catch (error) {
    console.error('Failed to connect MetaMask:', error);
    throw new Error(`MetaMask connection failed: ${error}`);
  }
};
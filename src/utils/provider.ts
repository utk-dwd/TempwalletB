// src/utils/provider.ts
import { ethers } from 'ethers';

// Avalanche Fuji Testnet network configuration
const AVALANCHE_FUJI_PARAMS = {
  chainId: '0xA869', // 43113 in hexadecimal
  chainName: 'Avalanche Fuji C-Chain',
  nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
  rpcUrls: ['https://avax-fuji.g.alchemy.com/v2/fL4M2zOw4TUa-kEXC-ITju7MRMqVK3uH'],
  blockExplorerUrls: ['https://testnet.snowtrace.io/'],
};

// Adds Avalanche Fuji Testnet to MetaMask
const addAvalancheFujiNetwork = async (): Promise<boolean> => {
  if (!window.ethereum) {
    console.error('MetaMask is not installed!');
    return false;
  }
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [AVALANCHE_FUJI_PARAMS],
    });
    return true;
  } catch (error) {
    console.error('Error adding Avalanche Fuji network to MetaMask:', error);
    return false;
  }
};

// Switch to or adds Avalanche Fuji Testnet in MetaMask
const switchToAvalancheFuji = async (): Promise<boolean> => {
  if (!window.ethereum) {
    console.error('MetaMask is not installed!');
    return false;
  }
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: AVALANCHE_FUJI_PARAMS.chainId }],
    });
    return true;
  } catch (error: any) {
    if (error.code === 4902) {
      const added = await addAvalancheFujiNetwork();
      if (added) {
        return await switchToAvalancheFuji(); // Retry switching
      }
      return false;
    }
    console.error('Error switching to Avalanche Fuji network:', error);
    return false;
  }
};

// Get the MetaMask provider and ensure Avalanche Fuji Testnet
export const getProvider = async (desiredAccount?: string): Promise<ethers.BrowserProvider> => {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed. Please install the MetaMask browser extension.');
  }
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const switched = await switchToAvalancheFuji();
    if (!switched) {
      throw new Error('Failed to switch to Avalanche Fuji Testnet.');
    }
    const { chainId } = await provider.getNetwork();
    const fujiChainId = 43113n;
    if (chainId !== fujiChainId) {
      throw new Error('Incorrect network. Please ensure MetaMask is on Avalanche Fuji Testnet.');
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
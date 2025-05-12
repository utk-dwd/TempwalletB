// Utility to connect MetaMask and switch to Avalanche Fuji Testnet
// Dependency: ethers (^6.14.0) for BrowserProvider and account connection
// Integration: Connects MetaMask, ensures Avalanche Fuji Testnet (Chain ID 43113)
// Note: window.ethereum type is declared in src/types/global.d.ts
import { ethers } from 'ethers';

// Avalanche Fuji Testnet network configuration
const AVALANCHE_FUJI_PARAMS = {
  chainId: '0xA869', // 43113 in hexadecimal
  chainName: 'Avalanche Fuji C-Chain',
  nativeCurrency: {
    name: 'Avalanche',
    symbol: 'AVAX',
    decimals: 18,
  },
  rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
  blockExplorerUrls: ['https://testnet.snowtrace.io/'],
};

/**
 * Adds Avalanche Fuji Testnet to MetaMask
 * @returns {Promise<boolean>} True if the network was added, false otherwise
 */
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

/**
 * Switches to or adds Avalanche Fuji Testnet in MetaMask
 * @returns {Promise<boolean>} True if switched successfully, false otherwise
 */
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

// Function to get the MetaMask provider and ensure Avalanche Fuji Testnet
export const getProvider = async (): Promise<ethers.BrowserProvider> => {
  // Check if MetaMask is installed
  if (!window.ethereum) {
    throw new Error('MetaMask not installed. Please install the MetaMask browser extension.');
  }

  try {
    // Initialize ethers BrowserProvider
    const provider = new ethers.BrowserProvider(window.ethereum);

    // Switch to or add Avalanche Fuji Testnet
    const switched = await switchToAvalancheFuji();
    if (!switched) {
      throw new Error('Failed to switch to Avalanche Fuji Testnet.');
    }

    // Verify the current network
    const { chainId } = await provider.getNetwork();
    const fujiChainId = 43113n;
    if (chainId !== fujiChainId) {
      throw new Error('Incorrect network. Please ensure MetaMask is on Avalanche Fuji Testnet.');
    }

    // Request user to connect MetaMask account
    await provider.send('eth_requestAccounts', []);

    return provider;
  } catch (error) {
    console.error('Failed to connect MetaMask:', error);
    throw new Error(`MetaMask connection failed: ${error}`);
  }
};
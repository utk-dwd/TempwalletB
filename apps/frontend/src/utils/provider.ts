// src/utils/provider.ts
import { ethers } from 'ethers';
import analyticsService from '../services/analytics';
import { EventName, ConnectWalletResult } from '../utils/types';
import { NetworkConfig } from './networks';
import api from '../services/api.js';


const CONSTANT_MESSAGE = 'Welcome to TempwalletB! Please sign this message to authenticate, this will not cost you anything.';

/**
 * Prompts the user to add a network to MetaMask.
 * @param network - The network configuration object.
 * @returns A promise that resolves to true if the network was added successfully.
 */
const addNetwork = async (network: NetworkConfig): Promise<boolean> => {
  if (!window.ethereum) {
    console.error('MetaMask is not installed!');
    return false;
  }

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: `0x${network.chainId.toString(16)}`,
        chainName: network.name,
        nativeCurrency: {
          name: network.viemChain.nativeCurrency.name,
          symbol: network.currencySymbol,
          decimals: network.viemChain.nativeCurrency.decimals,
        },
        rpcUrls: [network.rpcUrl],
        blockExplorerUrls: [network.explorerUrl],
      }],
    });
    analyticsService.trackEvent(EventName.NETWORK_ADDED, {
      networkName: network.name,
      chainId: network.chainId,
    });
    return true;
  } catch (error) {
    console.error(`Error adding ${network.name} network to MetaMask:`, error);
    return false;
  }
};

/**
 * Prompts the user to switch to a specified network in MetaMask.
 * If the network is not available, it prompts the user to add it first.
 * @param network - The network configuration object to switch to.
 * @returns A promise that resolves to true if the switch was successful.
 */
const switchToNetwork = async (network: NetworkConfig): Promise<boolean> => {
  if (!window.ethereum) {
    console.error('MetaMask is not installed!');
    return false;
  }

  try {
    analyticsService.trackEvent(EventName.NETWORK_SWITCH_REQUESTED, {
      targetNetworkName: network.name,
      targetChainId: network.chainId,
    });
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${network.chainId.toString(16)}` }],
    });
    return true;
  } catch (error: any) {
    if (error.code === 4902) {
      const added = await addNetwork(network);
      if (added) {
        return await switchToNetwork(network);
      }
      return false;
    }
    console.error(`Error switching to ${network.name} network:`, error);
    return false;
  }
};

/**
 * Establishes a connection to MetaMask and handles user authentication.
 * @returns An object containing success status, address, and an optional access token or error message.
 */
export const connectWallet = async (): Promise<ConnectWalletResult> => {
  if (!window.ethereum) {
    return { success: false, error: 'MetaMask not installed. Please install the MetaMask browser extension.' };
  }
  
  try {
    analyticsService.trackEvent(EventName.WALLET_CONNECTION_ATTEMPTED);

    const provider = new ethers.BrowserProvider(window.ethereum);
    
    // Request accounts from the user
    await provider.send('eth_requestAccounts', []);

    // Get the signer, which represents the connected user account
    const signer = await provider.getSigner();

    // Get the address directly from the signer
    const address = await signer.getAddress();
    if (!address) {
      return { success: false, error: 'No accounts found. Please connect your MetaMask wallet.' };
    }

    // Sign the consistent message
    const signature = await signer.signMessage(CONSTANT_MESSAGE);

    // Post the address from the signer and the signature to your backend using configured API service
    const response = await api.post('/auth/login', {
      metamask_address: address, // <-- Using address from the signer
      signature,
    });
    
    // Store the JWT in local storage
    const { access_token } = response.data;
    localStorage.setItem('accessToken', access_token);

    // Update analytics with the authenticated user
    analyticsService.identify(address); // <-- Use the 'address' variable
    analyticsService.setPeople({
      $name: `User_${address.slice(0, 6)}`,
      $email: null,
      currentAccount: address, // <-- Use the 'address' variable
      signupDate: new Date().toISOString(),
    });
    analyticsService.trackEvent(EventName.WALLET_CONNECTION_SUCCESS, {
      connectedAccount: address, // <-- Use the 'address' variable
    });

    return { success: true, address: address, accessToken: access_token };
  } catch (error: any) {
    analyticsService.trackEvent(EventName.WALLET_CONNECTION_FAILED, {
      errorMessage: error.message || 'Unknown error',
    });
    console.error('Failed to connect MetaMask or authenticate:', error);
    return { success: false, error: error.message || 'Failed to connect to MetaMask' };
  }
};

/**
 * Gets the MetaMask provider instance.
 * @returns A promise that resolves to an ethers.BrowserProvider instance.
 */
export const getProvider = async (): Promise<ethers.BrowserProvider> => {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed. Please install the MetaMask browser extension.');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  return provider;
};
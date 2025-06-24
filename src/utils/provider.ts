// src/utils/provider.ts
import { ethers } from 'ethers';
import analyticsService from '../services/analytics';
import { EventName } from '../utils/types';
import { NetworkConfig } from './networks';

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
 * Gets the MetaMask provider, ensuring the wallet is connected to the correct network and account.
 * @param network - The desired network configuration.
 * @param desiredAccount - The optional specific account address that should be active.
 * @returns A promise that resolves to an ethers.BrowserProvider instance.
 */
export const getProvider = async (network: NetworkConfig, desiredAccount?: string): Promise<ethers.BrowserProvider> => {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed. Please install the MetaMask browser extension.');
  }

  try {
    analyticsService.trackEvent(EventName.WALLET_CONNECTION_ATTEMPTED, {
      networkName: network.name,
      desiredAccount: desiredAccount || 'none',
    });

    const provider = new ethers.BrowserProvider(window.ethereum);

    const switched = await switchToNetwork(network);
    if (!switched) {
      throw new Error(`Failed to switch to ${network.name}.`);
    }

    const { chainId } = await provider.getNetwork();
    if (chainId !== BigInt(network.chainId)) {
      throw new Error(`Incorrect network. Please ensure MetaMask is on ${network.name}.`);
    }

    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    const currentAccount = accounts[0]?.toLowerCase();

    if (desiredAccount && currentAccount !== desiredAccount.toLowerCase()) {
      try {
        const newAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const newAccount = newAccounts[0]?.toLowerCase();
        if (newAccount !== desiredAccount.toLowerCase()) {
          throw new Error('Please select the correct account in MetaMask.');
        }
      } catch (error) {
        throw new Error('Failed to switch accounts. Please manually select the correct account in MetaMask.');
      }
    }
    analyticsService.identify(currentAccount);
    analyticsService.setPeople({
      $name: `User_${currentAccount.slice(0, 6)}`, // Example: User_0x1234
      $email: null, // Add if available
      currentAccount,
      signupDate: new Date().toISOString(),
    });
    analyticsService.trackEvent(EventName.WALLET_CONNECTION_SUCCESS, {
      connectedAccount: currentAccount || 'none',
    });

    return provider;
  } catch (error: any) {
    analyticsService.trackEvent(EventName.WALLET_CONNECTION_FAILED, {
      errorMessage: error.message || 'Unknown error',
    });
    console.error('Failed to connect MetaMask:', error);
    throw new Error(`MetaMask connection failed: ${error.message || error}`);
  }
};
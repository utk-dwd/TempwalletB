// src/utils/provider.ts
import { ethers } from 'ethers';
import { NetworkConfig } from './networks'; // Import the NetworkConfig type

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
        chainId: `0x${network.chainId.toString(16)}`, // Convert chainId to hexadecimal
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
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${network.chainId.toString(16)}` }],
    });
    return true;
  } catch (error: any) {
    // Error code 4902 indicates that the chain has not been added to MetaMask.
    if (error.code === 4902) {
      const added = await addNetwork(network);
      if (added) {
        // Retry switching after adding the network
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
    const provider = new ethers.BrowserProvider(window.ethereum);

    // Switch to the desired network.
    const switched = await switchToNetwork(network);
    if (!switched) {
      throw new Error(`Failed to switch to ${network.name}.`);
    }

    // Verify the network chainId after switching.
    const { chainId } = await provider.getNetwork();
    if (chainId !== BigInt(network.chainId)) {
      throw new Error(`Incorrect network. Please ensure MetaMask is on ${network.name}.`);
    }

    // Get the current account from MetaMask.
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    const currentAccount = accounts[0]?.toLowerCase();

    // If a specific account is required and it's not the active one, request a switch.
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
    return provider;
  } catch (error: any) {
    console.error('Failed to connect MetaMask:', error);
    // Pass along the specific error message from the nested functions.
    throw new Error(`MetaMask connection failed: ${error.message || error}`);
  }
};
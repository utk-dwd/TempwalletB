// Utility to connect MetaMask and switch to Avalanche Fuji Testnet
// Dependency: ethers (^6.14.0) for BrowserProvider and network utilities
// Integration: Connects MetaMask, ensures Avalanche Fuji Testnet (Chain ID 43113)
// Note: Requires window.ethereum, declared in src/types/global.d.ts
import { ethers } from 'ethers';

// Function to get the MetaMask provider and switch to Avalanche Fuji Testnet
export const getProvider = async (): Promise<ethers.BrowserProvider> => {
  // Check if MetaMask is installed (window.ethereum is injected by MetaMask)
  if (!window.ethereum) {
    throw new Error('MetaMask not installed. Please install the MetaMask browser extension.');
  }

  try {
    // Initialize ethers BrowserProvider with MetaMask's injected provider
    const provider = new ethers.BrowserProvider(window.ethereum);

    // Get the current network
    const { chainId } = await provider.getNetwork();

    // Avalanche Fuji Testnet Chain ID (43113 in decimal, 0xa869 in hex)
    const fujiChainId = 43113n;

    // If not on Fuji Testnet, switch or add the network
    if (chainId !== fujiChainId) {
      try {
        // Attempt to switch to Avalanche Fuji Testnet
        await provider.send('wallet_switchEthereumChain', [{ chainId: '0xa869' }]);
      } catch (switchError: any) {
        // If chain not added (error code 4902), add Avalanche Fuji Testnet
        if (switchError.code === 4902) {
          await provider.send('wallet_addEthereumChain', [
            {
              chainId: '0xa869',
              chainName: 'Avalanche Fuji Testnet',
              rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
              nativeCurrency: {
                name: 'AVAX',
                symbol: 'AVAX',
                decimals: 18,
              },
              blockExplorerUrls: ['https://testnet.snowtrace.io'],
            },
          ]);
        } else {
          throw switchError;
        }
      }
    }

    // Request user to connect MetaMask account
    await provider.send('eth_requestAccounts', []);

    return provider;
  } catch (error) {
    console.error('Failed to connect MetaMask:', error);
    throw new Error(`MetaMask connection failed: ${error}`);
  }
};
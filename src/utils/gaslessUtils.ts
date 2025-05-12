// Utility to initialize the 0xGasless Smart Account client for Avalanche
// Dependency: @0xgasless/smart-account (^0.0.13) for createSmartAccountClient
// Dependency: viem (^2.29.1) for chain configuration (avalancheFuji)
// Dependency: ethers (^6.14.0) for MetaMask signer integration
// Integration: Connects to 0xGasless paymaster and bundler for gasless transactions
import { createSmartAccountClient } from '@0xgasless/smart-account';
import { avalancheFuji } from 'viem/chains';
import { getProvider } from './provider';
import { BrowserProvider } from 'ethers';

import { createPublicClient, http } from 'viem';


// Function to initialize the 0xGasless SDK client
export const initGaslessClient = async () => {
  try {

    // Debug: Test network connectivity
    const publicClient = createPublicClient({
        chain: avalancheFuji,
        transport: http('https://api.avax-test.network/ext/bc/C/rpc'),
      });
      const blockNumber = await publicClient.getBlockNumber();
      console.log('Avalanche Fuji Block Number:', blockNumber);


    // Get MetaMask provider and signer for validation
    const provider = await getProvider();
    const signer = await provider.getSigner();

    const signerAddress = await signer.getAddress();
    console.log('Signer Address:', signerAddress);  

    // Initialize 0xGasless smart account client
    // TODO: Replace with actual values from https://dashboard.0xgasless.com

    // Initialize 0xGasless smart account client
    const client = await createSmartAccountClient({
      chainId: avalancheFuji.id, // Chain ID for Avalanche Fuji Testnet (43113)
      rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc', // Avalanche Fuji RPC
      paymasterUrl: "https://paymaster.0xgasless.com/v1/43114/rpc/7e00b844-d446-4f8c-bfac-3ecc7b46408e", // Obtain from 0xGasless Dashboard
      bundlerUrl: "https://bundler.0xgasless.com/{chainId}", // Obtain from 0xGasless Dashboard
      entryPointAddress: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", // Obtain from 0xGasless Dashboard or documentation
      signer: signer, // MetaMask signer from ethers
    });

    console.log('0xGasless Smart Account Client initialized:', client);
    return client;
  } catch (error) {
    console.error('Failed to initialize 0xGasless client:', error);
    throw new Error(`0xGasless initialization failed: ${error}`);
  }
};
// src/testBiconomyMethods.ts
import { createSmartAccountClient } from '@biconomy/account';
import { avalancheFuji } from 'viem/chains';
import { ethers } from 'ethers';

// Function to get MetaMask signer
async function getMetaMaskSigner(): Promise<ethers.Signer> {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  // Request MetaMask to connect
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return signer;
}

// Test function to check smart account methods
export async function testSmartAccountMethods() {
  try {
    // Get MetaMask signer
    const signer = await getMetaMaskSigner();
    const walletAddress = await signer.getAddress();
    console.log('Signer Address:', walletAddress);

    // Environment variables
    const bundlerUrl = import.meta.env.VITE_BUNDLER_URL;
    const paymasterApiKey = import.meta.env.VITE_BICONOMY_PAYMASTER_API_KEY;
    const rpcUrl = import.meta.env.VITE_AVALANCHE_FUJI_RPC;

    if (!bundlerUrl || !paymasterApiKey || !rpcUrl) {
      throw new Error(
        'Missing environment variables: Ensure VITE_BUNDLER_URL, VITE_BICONOMY_PAYMASTER_API_KEY, and VITE_AVALANCHE_FUJI_RPC are set in .env'
      );
    }

    // Initialize smart account
    const smartAccount = await createSmartAccountClient({
      signer,
      bundlerUrl,
      biconomyPaymasterApiKey: paymasterApiKey,
      chainId: avalancheFuji.id,
      index: 0, // Use index 0 for testing
      rpcUrl,
    });

    const accountAddress = await smartAccount.getAccountAddress();
    console.log('Smart Account Address:', accountAddress);

    // Inspect smart account instance for methods and properties
    const smartAccountMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(smartAccount));
    const smartAccountProperties = Object.getOwnPropertyNames(smartAccount);

    console.log('Smart Account Methods:', smartAccountMethods);
    console.log('Smart Account Properties:', smartAccountProperties);

    // Specifically check for getBalances and getSupportedTokens
    const hasGetBalances = 'getBalances' in smartAccount || smartAccountMethods.includes('getBalances');
    const hasGetSupportedTokens = 'getSupportedTokens' in smartAccount || smartAccountMethods.includes('getSupportedTokens');

    console.log('getBalances Available:', hasGetBalances);
    console.log('getSupportedTokens Available:', hasGetSupportedTokens);

    // Attempt to call the methods if available
    if (hasGetBalances) {
      try {
        const balances = await (smartAccount as any).getBalances([]);
        console.log('getBalances Result:', balances);
      } catch (error) {
        console.error('Error calling getBalances:', error);
      }
    }

    if (hasGetSupportedTokens) {
      try {
        const tokens = await (smartAccount as any).getSupportedTokens();
        console.log('getSupportedTokens Result:', tokens);
      } catch (error) {
        console.error('Error calling getSupportedTokens:', error);
      }
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}